import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSyncManager } from '../useSyncManager';
import { backgroundSync } from '@/lib/background-sync';

// Create a mock user state that can be updated
let mockUserState: { id: string | null } = { id: 'test-user-id' };

// Mock the auth context with a function that returns the current mock user state
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUserState.id ? { id: mockUserState.id } : null,
  }),
}));

// Mock supabase client
const mockSupabaseInsert = vi.fn().mockResolvedValue({ error: null });
const mockSupabaseUpdate = vi.fn(() => ({
  eq: vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ error: null }),
  })),
}));
const mockSupabaseDelete = vi.fn(() => ({
  eq: vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockSupabaseInsert,
      update: mockSupabaseUpdate,
      delete: mockSupabaseDelete,
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
    
    // Reset mock user state
    mockUserState = { id: 'test-user-id' };
    
    // Reset supabase mocks
    mockSupabaseInsert.mockResolvedValue({ error: null });
    mockSupabaseUpdate.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    });
    mockSupabaseDelete.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    });
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
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

    // Wait for sync to complete
    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    }, { timeout: 2000 });

    expect(mockSupabaseInsert).toHaveBeenCalled();
  });

  it('should not sync when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
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
    // Mock a consistently failing insert
    mockSupabaseInsert.mockResolvedValue({ error: new Error('Insert failed') });

    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    expect(result.current.queueLength).toBe(1);

    // Trigger sync (will fail and retry up to MAX_RETRIES)
    await act(async () => {
      await result.current.syncQueue();
    });

    // Wait for all retries to complete (3 retries with delays)
    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    }, { timeout: 10000 });

    // Failed change should remain in queue after max retries
    expect(result.current.queueLength).toBe(1);
  }, 10000); // Increase test timeout to 10 seconds

  it('should retry failed changes', async () => {
    let callCount = 0;
    
    // First call fails, second succeeds
    mockSupabaseInsert.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ error: new Error('First attempt failed') });
      }
      return Promise.resolve({ error: null });
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

    // Wait for retry to complete
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(1);
      expect(result.current.queueLength).toBe(0);
    }, { timeout: 8000 });

    // Should have retried and succeeded
    expect(callCount).toBeGreaterThanOrEqual(2);
  }, 10000);

  it('should trigger sync when coming back online', async () => {
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    expect(result.current.queueLength).toBe(1);

    // Simulate coming back online
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      // Give time for the event handler to trigger sync
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // Wait for sync to complete
    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    }, { timeout: 3000 });

    expect(mockSupabaseInsert).toHaveBeenCalled();
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

    expect(result.current.queueLength).toBe(1);
    expect(backgroundSync.registerSync).toHaveBeenCalledWith({
      type: 'create',
      entityType: 'customers',
      data: { name: 'Test Customer' },
    });
  });

  it('should handle missing user ID', async () => {
    // Temporarily remove user ID
    mockUserState.id = null;

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

    // Queue should remain unchanged without user
    expect(result.current.queueLength).toBe(1);

    // Restore user ID for other tests
    mockUserState.id = 'test-user-id';
  });
});
