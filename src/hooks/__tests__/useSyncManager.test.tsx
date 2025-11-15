import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSyncManager } from '@/hooks/useSyncManager';
import { supabase } from '@/integrations/supabase/client';
import { ReactNode } from 'react';

// Mock useAuth directly without AuthProvider to avoid context issues
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { access_token: 'test-token', user: { id: 'test-user-id' } },
    subscription: null,
    userRole: 'free',
    isAdmin: false,
    isMaxAITier: false,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    refreshSubscription: vi.fn(),
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
        data: { name: 'Test Customer', id: crypto.randomUUID() },
      });
    });

    expect(result.current.pendingCount).toBe(1);
  });

  it('should sync changes when going online', async () => {
    // Don't override the mock - use the comprehensive one from setup.ts
    mockOffline();
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer', id: 'test-customer-1' },
      });
    });

    act(() => {
      mockOnline();
    });

    await waitFor(
      () => {
        expect(result.current.isSyncing).toBe(false);
        expect(result.current.pendingCount).toBe(0);
      },
      { timeout: 3000 }
    );
  });

  it('should handle sync failures and retry', async () => {
    // Create a custom mock that fails once then succeeds
    let callCount = 0;
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ data: {}, error: null });
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer', id: 'test-customer-4' },
      });
    });

    await act(async () => {
      await result.current.syncToDatabase();
    });

    // First attempt should fail
    expect(result.current.pendingCount).toBe(1);

    // Second attempt should succeed
    await act(async () => {
      await result.current.syncToDatabase();
    });

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });
    
    vi.clearAllMocks();
  });

  it('should move failed changes to failed queue after max retries', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer', id: crypto.randomUUID() },
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
    
    vi.clearAllMocks();
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
    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.pauseSync();
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'Test Customer', id: 'test-customer-6' },
      });
    });

    await act(async () => {
      await result.current.syncToDatabase();
    });

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
    const mockUpdate = {
      eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
    };
    const mockDelete = {
      eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
    };
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      update: vi.fn().mockReturnValue(mockUpdate),
      delete: vi.fn().mockReturnValue(mockDelete),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSyncManager());

    act(() => {
      result.current.queueChange({
        type: 'create',
        table: 'customers',
        data: { name: 'New Customer', id: 'test-customer-7' },
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
      expect(result.current.pendingCount).toBe(0);
    });
    
    vi.clearAllMocks();
  });
});
