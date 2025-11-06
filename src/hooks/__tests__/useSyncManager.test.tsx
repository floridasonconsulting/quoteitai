import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSyncManager } from '@/hooks/useSyncManager';
import { supabase } from '@/integrations/supabase/client';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

// Mock useAuth directly without AuthProvider to avoid context issues
vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    userRole: 'free',
    isMaxAITier: false,
    loading: false,
  }),
}));

// Mock online/offline events
const mockOnline = () => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
  window.dispatchEvent(new Event('online'));
};

const mockOffline = () => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false,
  });
  window.dispatchEvent(new Event('offline'));
};

describe('useSyncManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockOnline();
  });

  it('should initialize with online status', () => {
    const { result } = renderHook(() => useSyncManager());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.pendingCount).toBe(0);
  });

  it('should detect offline status', async () => {
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      mockOffline();
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });
  });

  it('should detect online status', async () => {
    mockOffline();
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      mockOnline();
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });

  it('should queue changes when offline', () => {
    mockOffline();
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    expect(result.current.pendingCount).toBe(1);
  });

  it('should sync changes when going online', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    (supabase.from as any) = vi.fn(() => ({
      insert: mockInsert,
    }));

    mockOffline();
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    act(() => {
      mockOnline();
    });

    await waitFor(
      () => {
        expect(mockInsert).toHaveBeenCalled();
        expect(result.current.pendingCount).toBe(0);
      },
      { timeout: 3000 }
    );
  });

  it('should handle sync failures and retry', async () => {
    const mockInsert = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: null, error: null });

    (supabase.from as any) = vi.fn(() => ({
      insert: mockInsert,
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
      await result.current.syncToDatabase();
    });

    // First attempt should fail
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(result.current.pendingCount).toBe(1);

    // Second attempt should succeed
    await act(async () => {
      await result.current.syncToDatabase();
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(2);
      expect(result.current.pendingCount).toBe(0);
    });
  });

  it('should move failed changes to failed queue after max retries', async () => {
    const mockInsert = vi.fn().mockRejectedValue(new Error('Network error'));

    (supabase.from as any) = vi.fn(() => ({
      insert: mockInsert,
    }));

    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    // Try syncing 3 times (max retries)
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        await result.current.syncToDatabase();
      });
    }

    await waitFor(() => {
      expect(result.current.failedCount).toBe(1);
      expect(result.current.pendingCount).toBe(0);
    });
  });

  it('should pause and resume sync', () => {
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.pauseSync();
    });

    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.resumeSync();
    });

    expect(result.current.isPaused).toBe(false);
  });

  it('should not sync when paused', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    (supabase.from as any) = vi.fn(() => ({
      insert: mockInsert,
    }));

    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.pauseSync();
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    await act(async () => {
      await result.current.syncToDatabase();
    });

    expect(mockInsert).not.toHaveBeenCalled();
    expect(result.current.pendingCount).toBe(1);
  });

  it('should persist pending changes to localStorage', () => {
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer' },
      });
    });

    const stored = localStorage.getItem('sync-queue');
    expect(stored).toBeTruthy();
    const queue = JSON.parse(stored!);
    expect(queue).toHaveLength(1);
    expect(queue[0].data.name).toBe('Test Customer');
  });

  it('should handle different change types (create, update, delete)', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    (supabase.from as any) = vi.fn((table: string) => ({
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    }));

    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'New Customer' },
      });
      result.current.queueChange({
        type: 'update',
        table: 'customers',
        data: { id: '1', name: 'Updated Customer' },
      });
      result.current.queueChange({
        type: 'delete',
        table: 'customers',
        data: { id: '2' },
      });
    });

    await act(async () => {
      await result.current.syncToDatabase();
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
