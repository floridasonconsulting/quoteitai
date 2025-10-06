import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: 'customers' | 'items' | 'quotes';
  data: any;
  timestamp: string;
}

export const useSyncManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [failedChanges, setFailedChanges] = useState<PendingChange[]>([]);
  const { user } = useAuth();
  const failureCountsRef = useRef<Map<string, number>>(new Map());

  // Load pending and failed changes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sync-queue');
    const failed = localStorage.getItem('failed-sync-queue');
    if (stored) {
      setPendingChanges(JSON.parse(stored));
    }
    if (failed) {
      setFailedChanges(JSON.parse(failed));
    }
  }, []);

  // Save pending and failed changes to localStorage
  useEffect(() => {
    localStorage.setItem('sync-queue', JSON.stringify(pendingChanges));
  }, [pendingChanges]);

  useEffect(() => {
    localStorage.setItem('failed-sync-queue', JSON.stringify(failedChanges));
  }, [failedChanges]);

  // Monitor online/offline status
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

  // Add change to pending queue
  const queueChange = useCallback((change: Omit<PendingChange, 'id' | 'timestamp'>) => {
    const newChange: PendingChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setPendingChanges(prev => [...prev, newChange]);
  }, []);

  // Sync pending changes to database
  const syncToDatabase = useCallback(async () => {
    if (!isOnline || !user || pendingChanges.length === 0 || isSyncing || isPaused) return;

    setIsSyncing(true);
    const successfulIds: string[] = [];
    const failedIds: string[] = [];

    for (const change of pendingChanges) {
      try {
        // Check if data already exists in DB to avoid duplicate syncs
        if (change.type === 'create') {
          const { data: existing } = await supabase
            .from(change.table)
            .select('id')
            .eq('id', change.data.id)
            .maybeSingle();
          
          if (existing) {
            console.log(`[Sync] Skipping duplicate create for ${change.table}:${change.data.id}`);
            successfulIds.push(change.id);
            continue;
          }
        }

        const table = supabase.from(change.table);
        
        switch (change.type) {
          case 'create':
            await table.insert({ ...change.data, user_id: user.id });
            break;
          case 'update':
            await table.update(change.data).eq('id', change.data.id).eq('user_id', user.id);
            break;
          case 'delete':
            await table.delete().eq('id', change.data.id).eq('user_id', user.id);
            break;
        }
        
        successfulIds.push(change.id);
        failureCountsRef.current.delete(change.id);
      } catch (error) {
        console.error(`Failed to sync change ${change.id}:`, error);
        
        // Track failure count
        const currentCount = failureCountsRef.current.get(change.id) || 0;
        const newCount = currentCount + 1;
        failureCountsRef.current.set(change.id, newCount);
        
        // After 3 failures, move to failed queue
        if (newCount >= 3) {
          failedIds.push(change.id);
          failureCountsRef.current.delete(change.id);
        }
      }
    }

    // Update queues
    setPendingChanges(prev => {
      const remaining = prev.filter(c => !successfulIds.includes(c.id) && !failedIds.includes(c.id));
      return remaining;
    });
    
    if (failedIds.length > 0) {
      const failed = pendingChanges.filter(c => failedIds.includes(c.id));
      setFailedChanges(prev => [...prev, ...failed]);
    }
    
    if (successfulIds.length > 0) {
      localStorage.setItem('last-sync-time', new Date().toISOString());
    }

    setIsSyncing(false);
  }, [isOnline, user, pendingChanges, isSyncing, isPaused]);

  // Auto-sync when online (not paused)
  useEffect(() => {
    if (isOnline && user && !isPaused) {
      syncToDatabase();
      
      const interval = setInterval(syncToDatabase, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOnline, user, isPaused, syncToDatabase]);

  const pauseSync = useCallback(() => {
    console.log('[SyncManager] Pausing sync');
    setIsPaused(true);
  }, []);

  const resumeSync = useCallback(() => {
    console.log('[SyncManager] Resuming sync');
    setIsPaused(false);
  }, []);

  return {
    isOnline,
    isSyncing,
    isPaused,
    pendingCount: pendingChanges.length,
    failedCount: failedChanges.length,
    queueChange,
    syncToDatabase,
    pauseSync,
    resumeSync,
  };
};
