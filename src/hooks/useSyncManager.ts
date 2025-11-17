import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Customer, Item, Quote } from "@/types";
import { storageCache } from "@/lib/storage-cache";

type ChangeData = (Partial<Customer> | Partial<Item> | Partial<Quote>) & { id: string };

interface PendingChange {
  id: string;
  type: "create" | "update" | "delete";
  table: "customers" | "items" | "quotes";
  data: ChangeData;
  timestamp: string;
}

const SYNC_QUEUE_KEY = "sync-queue";
const FAILED_SYNC_QUEUE_KEY = "failed-sync-queue";
const LAST_SYNC_TIME_KEY = "last-sync-time";
const SYNC_INTERVAL = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;

export const useSyncManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [failedChanges, setFailedChanges] = useState<PendingChange[]>([]);
  const { user } = useAuth();
  const failureCountsRef = useRef<Map<string, number>>(new Map());
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Load pending and failed changes from storage cache
  useEffect(() => {
    const loadQueues = () => {
      try {
        const stored = storageCache.get<PendingChange[]>(SYNC_QUEUE_KEY);
        const failed = storageCache.get<PendingChange[]>(FAILED_SYNC_QUEUE_KEY);
        
        if (stored) {
          setPendingChanges(stored);
        }
        if (failed) {
          setFailedChanges(failed);
        }
      } catch (error) {
        console.error("[SyncManager] Error loading sync queues:", error);
      }
    };

    loadQueues();
  }, []);

  // Save pending changes to storage cache (debounced)
  useEffect(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      try {
        storageCache.set(SYNC_QUEUE_KEY, pendingChanges);
      } catch (error) {
        console.error("[SyncManager] Error saving pending changes:", error);
      }
    }, 500); // Debounce writes by 500ms

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [pendingChanges]);

  // Save failed changes to storage cache (debounced)
  useEffect(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      try {
        storageCache.set(FAILED_SYNC_QUEUE_KEY, failedChanges);
      } catch (error) {
        console.error("[SyncManager] Error saving failed changes:", error);
      }
    }, 500);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [failedChanges]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log("[SyncManager] Online - resuming sync");
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log("[SyncManager] Offline - pausing sync");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Add change to pending queue
  const queueChange = useCallback((change: Omit<PendingChange, "id" | "timestamp">) => {
    const newChange: PendingChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    
    setPendingChanges(prev => [...prev, newChange]);
    console.log(`[SyncManager] Queued ${change.type} for ${change.table}:${change.data.id}`);
  }, []);

  // Sync pending changes to database
  const syncToDatabase = useCallback(async () => {
    if (!isOnline || !user || pendingChanges.length === 0 || isSyncing || isPaused) {
      return;
    }

    console.log(`[SyncManager] Starting sync of ${pendingChanges.length} changes`);
    setIsSyncing(true);
    
    const successfulIds: string[] = [];
    const failedIds: string[] = [];

    for (const change of pendingChanges) {
      try {
        // Check if data already exists in DB to avoid duplicate syncs
        if (change.type === "create") {
          const { data: existing } = await supabase
            .from(change.table)
            .select("id")
            .eq("id", change.data.id)
            .maybeSingle();
          
          if (existing) {
            console.log(`[SyncManager] Skipping duplicate create for ${change.table}:${change.data.id}`);
            successfulIds.push(change.id);
            continue;
          }
        }

        const table = supabase.from(change.table);
        
        switch (change.type) {
          case "create":
            await table.insert({ ...change.data, user_id: user.id });
            console.log(`[SyncManager] Created ${change.table}:${change.data.id}`);
            break;
          case "update":
            await table.update(change.data).eq("id", change.data.id).eq("user_id", user.id);
            console.log(`[SyncManager] Updated ${change.table}:${change.data.id}`);
            break;
          case "delete":
            await table.delete().eq("id", change.data.id).eq("user_id", user.id);
            console.log(`[SyncManager] Deleted ${change.table}:${change.data.id}`);
            break;
        }
        
        successfulIds.push(change.id);
        failureCountsRef.current.delete(change.id);
      } catch (error) {
        console.error(`[SyncManager] Failed to sync change ${change.id}:`, error);
        
        // Track failure count
        const currentCount = failureCountsRef.current.get(change.id) || 0;
        const newCount = currentCount + 1;
        failureCountsRef.current.set(change.id, newCount);
        
        // After max retry attempts, move to failed queue
        if (newCount >= MAX_RETRY_ATTEMPTS) {
          console.warn(`[SyncManager] Moving change ${change.id} to failed queue after ${MAX_RETRY_ATTEMPTS} attempts`);
          failedIds.push(change.id);
          failureCountsRef.current.delete(change.id);
        }
      }
    }

    // Update queues
    setPendingChanges(prev => {
      const remaining = prev.filter(c => !successfulIds.includes(c.id) && !failedIds.includes(c.id));
      console.log(`[SyncManager] ${successfulIds.length} synced, ${failedIds.length} failed, ${remaining.length} remaining`);
      return remaining;
    });
    
    if (failedIds.length > 0) {
      const failed = pendingChanges.filter(c => failedIds.includes(c.id));
      setFailedChanges(prev => [...prev, ...failed]);
    }
    
    if (successfulIds.length > 0) {
      try {
        storageCache.set(LAST_SYNC_TIME_KEY, new Date().toISOString());
      } catch (error) {
        console.error("[SyncManager] Error saving last sync time:", error);
      }
    }

    setIsSyncing(false);
  }, [isOnline, user, pendingChanges, isSyncing, isPaused]);

  // Auto-sync when online (not paused)
  useEffect(() => {
    if (isOnline && user && !isPaused) {
      // Initial sync
      syncToDatabase();
      
      // Setup interval for periodic sync
      const interval = setInterval(syncToDatabase, SYNC_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [isOnline, user, isPaused, syncToDatabase]);

  const pauseSync = useCallback(() => {
    console.log("[SyncManager] Pausing sync");
    setIsPaused(true);
  }, []);

  const resumeSync = useCallback(() => {
    console.log("[SyncManager] Resuming sync");
    setIsPaused(false);
  }, []);

  const retryFailed = useCallback(() => {
    console.log(`[SyncManager] Retrying ${failedChanges.length} failed changes`);
    setPendingChanges(prev => [...prev, ...failedChanges]);
    setFailedChanges([]);
    failureCountsRef.current.clear();
  }, [failedChanges]);

  const clearFailed = useCallback(() => {
    console.log("[SyncManager] Clearing failed changes");
    setFailedChanges([]);
    failureCountsRef.current.clear();
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
    retryFailed,
    clearFailed,
  };
};
