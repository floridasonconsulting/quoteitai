import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSyncManager } from '../useSyncManager';
import { backgroundSync } from '@/lib/background-sync';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    })),
  },
}));

// Mock BackgroundSyncManager
vi.mock('@/lib/background-sync', () => ({
  backgroundSync: {
    registerSync: vi.fn(),
    clearAll: vi.fn(),
  },
}));

describe('useSyncManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with empty queue', () => {
    const { result } = renderHook(() => useSyncManager());

    expect(result.current.queueLength).toBe(0);
    expect(result.current.isSyncing).toBe(false);
  });

  it('should queue a change', () => {
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    expect(result.current.queueLength).toBe(1);
    expect(backgroundSync.registerSync).toHaveBeenCalledWith({
      type: 'create',
      entityType: 'customers',
      data: { name: 'Test Customer' },
    });
  });

  it('should queue multiple changes', () => {
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Customer 1' },
      });
      result.current.queueChange({
        type: 'update',
        table: 'items',
        data: { id: '1', name: 'Item 1' },
      });
      result.current.queueChange({
        type: 'delete',
        table: 'quotes',
        data: { id: '2' },
      });
    });

    expect(result.current.queueLength).toBe(3);
  });

  it('should sync queued changes when online', async () => {
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    expect(result.current.queueLength).toBe(1);

    await act(async () => {
      await result.current.syncQueue();
    });

    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    });
  });

  it('should not sync when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    expect(result.current.queueLength).toBe(1);

    await act(async () => {
      await result.current.syncQueue();
    });

    // Queue should remain unchanged when offline
    expect(result.current.queueLength).toBe(1);
  });

  it('should clear the queue', () => {
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    expect(result.current.queueLength).toBe(1);

    act(() => {
      result.current.clearQueue();
    });

    expect(result.current.queueLength).toBe(0);
    expect(backgroundSync.clearAll).toHaveBeenCalled();
  });

  it('should handle sync errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Mock a failed insert
    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ error: new Error('Insert failed') }),
    } as never);

    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    await act(async () => {
      await result.current.syncQueue();
    });

    // Failed change should remain in queue
    expect(result.current.queueLength).toBe(1);
  });

  it('should retry failed changes', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => ({
      insert: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ error: new Error('First attempt failed') });
        }
        return Promise.resolve({ error: null });
      }),
    } as never));

    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    await act(async () => {
      await result.current.syncQueue();
    });

    await waitFor(() => {
      expect(callCount).toBeGreaterThan(1);
    });
  });

  it('should trigger sync when coming back online', async () => {
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    }, { timeout: 3000 });
  });

  it('should integrate with BackgroundSyncManager', () => {
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    expect(backgroundSync.registerSync).toHaveBeenCalledWith({
      type: 'create',
      entityType: 'customers',
      data: { name: 'Test Customer' },
    });
  });

  it('should handle missing user ID', async () => {
    // Mock useAuth to return no user
    vi.mock('@/contexts/AuthContext', () => ({
      useAuth: () => ({ user: null }),
    }));

    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    await act(async () => {
      await result.current.syncQueue();
    });

    // Queue should remain unchanged without user
    expect(result.current.queueLength).toBe(1);
  });
});
