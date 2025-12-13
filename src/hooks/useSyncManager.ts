import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { backgroundSync } from '@/lib/background-sync';
import { toCamelCase, toSnakeCase } from '@/lib/services/transformation-utils';

export interface QueueChange {
  type: 'create' | 'update' | 'delete';
  table: 'customers' | 'items' | 'quotes';
  data: Record<string, unknown>;
}

const QUEUE_KEY = 'offline-changes-queue';
const SYNC_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;

export function useSyncManager() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncInProgressRef = useRef(false);

  /**
   * Get current queue from localStorage
   */
  const getQueue = useCallback((): QueueChange[] => {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (!stored) return [];
      
      const queue = JSON.parse(stored);
      return Array.isArray(queue) ? queue : [];
    } catch (error) {
      console.error('[SyncManager] Error reading queue:', error);
      return [];
    }
  }, []);

  /**
   * Save queue to localStorage
   */
  const saveQueue = useCallback((queue: QueueChange[]) => {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      setQueueLength(queue.length);
    } catch (error) {
      console.error('[SyncManager] Error saving queue:', error);
    }
  }, []);

  /**
   * Add change to queue
   */
  const queueChange = useCallback((change: QueueChange) => {
    const queue = getQueue();
    
    // CRITICAL: Deduplicate queue - if we're deleting something that was just created, remove both
    const existingCreateIndex = queue.findIndex(
      q => q.type === 'create' && 
      q.table === change.table && 
      q.data.id === change.data.id
    );
    
    if (change.type === 'delete' && existingCreateIndex >= 0) {
      // Remove the create operation instead of adding a delete
      console.log('[SyncManager] Removing create operation for deleted item:', change.data.id);
      queue.splice(existingCreateIndex, 1);
      saveQueue(queue);
      return;
    }
    
    queue.push(change);
    saveQueue(queue);
    
    // Also register with BackgroundSyncManager for better offline support
    backgroundSync.registerSync({
      type: change.type,
      entityType: change.table,
      data: change.data,
    });
    
    console.log('[SyncManager] Queued change:', change.type, change.table);
  }, [getQueue, saveQueue]);

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

      switch (change.type) {
        case 'create': {
          const { error: createError } = await supabase
            .from(change.table)
            .insert(dbData as never);
          
          if (createError) {
            // If it's a duplicate key error, consider it successful
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
            .from(change.table)
            .update(dbData as never)
            .eq('id', change.data.id)
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
            .from(change.table)
            .delete()
            .eq('id', change.data.id)
            .eq('user_id', user.id);
          
          if (deleteError) {
            // If item doesn't exist, consider delete successful
            if (deleteError.code === 'PGRST116') {
              console.log('[SyncManager] Item already deleted, skipping');
              return true;
            }
            throw deleteError;
          }
          break;
        }
        default:
          console.error('[SyncManager] Unknown change type:', change.type);
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

    if (syncInProgressRef.current) {
      console.log('[SyncManager] Sync already in progress');
      return;
    }

    const queue = getQueue();
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
    saveQueue(failedChanges);

    if (failedChanges.length === 0) {
      console.log('[SyncManager] ✅ All changes synced successfully');
    } else {
      console.warn(`[SyncManager] ⚠️ ${failedChanges.length} changes failed to sync`);
    }

    syncInProgressRef.current = false;
    setIsSyncing(false);
  }, [getQueue, saveQueue, processChange]);

  /**
   * Clear the queue
   */
  const clearQueue = useCallback(() => {
    saveQueue([]);
    backgroundSync.clearAll();
    console.log('[SyncManager] Queue cleared');
  }, [saveQueue]);

  /**
   * Remove specific items from queue (useful after bulk delete)
   */
  const removeFromQueue = useCallback((table: string, ids: string[]) => {
    const queue = getQueue();
    const filtered = queue.filter(
      change => !(change.table === table && ids.includes(change.data.id as string))
    );
    saveQueue(filtered);
    console.log(`[SyncManager] Removed ${queue.length - filtered.length} items from queue`);
  }, [getQueue, saveQueue]);

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
    const queue = getQueue();
    setQueueLength(queue.length);
  }, [getQueue]);

  return {
    isSyncing,
    queueLength,
    queueChange,
    syncQueue,
    clearQueue,
    removeFromQueue,
  };
}