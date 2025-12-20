import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toCamelCase, toSnakeCase } from '@/lib/services/transformation-utils';
import { syncStorage } from '@/lib/sync-storage';
import { QueueChange } from '@/types';

const SYNC_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;

export function useSyncManager() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [failedCount, setFailedCount] = useState(0);

  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncInProgressRef = useRef(false);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Add change to queue
   */
  const queueChange = useCallback((change: QueueChange) => {
    syncStorage.addChange(change);
    setQueueLength(syncStorage.getQueue().length);

    console.log('[SyncManager] Queued change:', change.type, change.table);
  }, []);

  /**
   * Process a single change
   */
  const processChange = useCallback(async (change: QueueChange, retryCount = 0): Promise<boolean> => {
    if (!user?.id) {
      console.warn('[SyncManager] No user ID, cannot process change');
      return false;
    }

    try {
      const dataWithUserId = { ...change.data, user_id: user.id };
      const dbData = toSnakeCase(dataWithUserId);

      // Map 'quotes' or 'items' to the specific union expected by supabase.from()
      const table = change.table as any;

      switch (change.type) {
        case 'create': {
          const { error: createError } = await supabase
            .from(table)
            .insert(dbData as never);

          if (createError) {
            if (createError.code === '23505') {
              console.log('[SyncManager] Item already exists, skipping create');
              return true;
            }
            throw createError;
          }
          break;
        }
        case 'update': {
          if (!change.data.id) {
            console.error('[SyncManager] Update missing ID:', change);
            return false;
          }

          const { error: updateError } = await supabase
            .from(table)
            .update(dbData as never)
            .eq('id', change.data.id as string)
            .eq('user_id', user.id);

          if (updateError) throw updateError;
          break;
        }
        case 'delete': {
          if (!change.data.id) {
            console.error('[SyncManager] Delete missing ID:', change);
            return false;
          }

          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('id', change.data.id as string)
            .eq('user_id', user.id);

          if (deleteError) {
            if (deleteError.code === 'PGRST116') {
              console.log('[SyncManager] Item already deleted, skipping');
              return true;
            }
            throw deleteError;
          }
          break;
        }
        default:
          console.error('[SyncManager] Unknown change type:', (change as any).type);
          return false;
      }

      console.log(`[SyncManager] ✅ Processed ${change.type} for ${change.table}`);
      return true;
    } catch (error) {
      console.error(`[SyncManager] ❌ Error processing ${change.type} for ${change.table}:`, error);

      if (retryCount < MAX_RETRIES) {
        console.log(`[SyncManager] Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return processChange(change, retryCount + 1);
      }

      return false;
    }
  }, [user?.id]);

  /**
   * Sync all queued changes
   */
  const syncQueue = useCallback(async () => {
    if (!navigator.onLine) {
      console.log('[SyncManager] Offline, skipping sync');
      return;
    }

    if (isPaused) {
      console.log('[SyncManager] Sync paused, skipping');
      return;
    }

    if (syncInProgressRef.current) {
      console.log('[SyncManager] Sync already in progress');
      return;
    }

    const queue = syncStorage.getQueue();
    if (queue.length === 0) {
      return;
    }

    syncInProgressRef.current = true;
    setIsSyncing(true);

    console.log(`[SyncManager] 🔄 Syncing ${queue.length} changes...`);

    const failedChanges: QueueChange[] = [];

    for (const change of queue) {
      const success = await processChange(change);
      if (!success) {
        failedChanges.push(change);
      }
    }

    // Save only failed changes back to queue
    syncStorage.saveQueue(failedChanges);
    setQueueLength(failedChanges.length);

    if (failedChanges.length === 0) {
      console.log('[SyncManager] ✅ All changes synced successfully');
      setFailedCount(0);
    } else {
      console.warn(`[SyncManager] ⚠️ ${failedChanges.length} changes failed to sync`);
      setFailedCount(prev => prev + failedChanges.length);
    }

    syncInProgressRef.current = false;
    setIsSyncing(false);
  }, [isPaused, processChange]);

  /**
   * Clear the queue
   */
  const clearQueue = useCallback(() => {
    syncStorage.saveQueue([]);
    setQueueLength(0);
    console.log('[SyncManager] Queue cleared');
  }, []);

  /**
   * Remove specific items from queue (useful after bulk delete)
   */
  const removeFromQueue = useCallback((table: string, ids: string[]) => {
    const queue = syncStorage.getQueue();
    const filtered = queue.filter(
      change => !(change.table === table && ids.includes(change.data.id as string))
    );
    syncStorage.saveQueue(filtered);
    setQueueLength(filtered.length);
    console.log(`[SyncManager] Removed ${queue.length - filtered.length} items from queue`);
  }, []);

  /**
   * Setup auto-sync interval
   */
  useEffect(() => {
    if (!user?.id) return;

    // Initial sync on mount
    syncQueue();

    // Setup periodic sync
    syncIntervalRef.current = setInterval(() => {
      syncQueue();
    }, SYNC_INTERVAL);

    // Sync when coming back online
    const handleOnline = () => {
      console.log('[SyncManager] Connection restored, syncing...');
      syncQueue();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      window.removeEventListener('online', handleOnline);
    };
  }, [user?.id, syncQueue]);

  /**
   * Update queue length on mount
   */
  useEffect(() => {
    const queue = syncStorage.getQueue();
    setQueueLength(queue.length);
  }, []);

  const pauseSync = useCallback(() => {
    setIsPaused(true);
    console.log('[SyncManager] Sync paused');
  }, []);

  const resumeSync = useCallback(() => {
    setIsPaused(false);
    console.log('[SyncManager] Sync resumed');
    setTimeout(() => syncQueue(), 100);
  }, [syncQueue]);

  return {
    isSyncing,
    isPaused,
    queueLength,
    queueChange,
    syncQueue,
    clearQueue,
    removeFromQueue,
    pauseSync,
    resumeSync,
    isOnline,
    pendingCount: queueLength,
    failedCount,
  };
}