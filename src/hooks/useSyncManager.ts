import { useState, useEffect, useCallback } from 'react';
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
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const { user } = useAuth();

  // Load pending changes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sync-queue');
    if (stored) {
      setPendingChanges(JSON.parse(stored));
    }
  }, []);

  // Save pending changes to localStorage
  useEffect(() => {
    localStorage.setItem('sync-queue', JSON.stringify(pendingChanges));
  }, [pendingChanges]);

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
    if (!isOnline || !user || pendingChanges.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const successfulIds: string[] = [];

    for (const change of pendingChanges) {
      try {
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
      } catch (error) {
        console.error(`Failed to sync change ${change.id}:`, error);
      }
    }

    setPendingChanges(prev => prev.filter(c => !successfulIds.includes(c.id)));
    setIsSyncing(false);
  }, [isOnline, user, pendingChanges, isSyncing]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && user) {
      syncToDatabase();
      
      const interval = setInterval(syncToDatabase, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOnline, user, syncToDatabase]);

  return {
    isOnline,
    isSyncing,
    pendingCount: pendingChanges.length,
    queueChange,
    syncToDatabase,
  };
};
