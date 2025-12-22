/**
 * Item Service
 * Handles all item/service catalog database operations
 */

import { Item, QueueChange } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '../cache-manager';
import { dedupedRequest, withTimeout } from './request-pool-service';
import { toCamelCase, toSnakeCase } from './transformation-utils';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';
import { ItemDB, isIndexedDBSupported } from '../indexed-db';
import { apiTracker } from '@/lib/api-performance-tracker';
import { syncStorage } from '../sync-storage';
import { isDemoModeActive } from '@/contexts/DemoContext';
import { MOCK_ITEMS } from '../mockData';

/**
 * Fetch all items for a user
 * Priority: Cache > IndexedDB > Supabase > Empty
 */
export async function getItems(
  userId: string | undefined,
  organizationId: string | null = null,
  options?: { forceRefresh?: boolean }
): Promise<Item[]> {
  if (isDemoModeActive()) {
    console.log('[item-service] (Demo Mode) Returning mock items');
    return Promise.resolve(MOCK_ITEMS);
  }

  if (!userId) {
    console.warn('⚠️ No user ID - using cache for items.');
    const cached = await cacheManager.get<Item[]>('items');
    return cached || [];
  }

  const forceRefresh = options?.forceRefresh;
  const dedupKey = `fetch-items-${userId}`;
  let cached: Item[] | null = null;

  // Check cache first (CacheManager handles memory cache)
  if (!forceRefresh) {
    cached = await cacheManager.get<Item[]>('items');
    if (cached && cached.length > 0) {
      console.log(`[ItemService] Retrieved ${cached.length} items from cache`);
      return cached;
    }
  }

  // Try IndexedDB if cache miss or forceRefresh is enabled (but we won't return early if forceRefresh)
  if (isIndexedDBSupported()) {
    try {
      const indexedDBData = await ItemDB.getAll(userId);
      if (indexedDBData && indexedDBData.length > 0) {
        if (!forceRefresh) {
          console.log(`[ItemService] Retrieved ${indexedDBData.length} items from IndexedDB`);
          // Update cache
          await cacheManager.set('items', indexedDBData);
          // If offline, return IndexedDB data immediately
          return indexedDBData;
        } else {
          console.log(`[ItemService] IndexedDB has ${indexedDBData.length} items but FORCE REFRESH is on - proceeding to Supabase`);
        }
      }
    } catch (error) {
      console.warn('[ItemService] IndexedDB read failed, falling back to Supabase:', error);
    }
  }

  if (!navigator.onLine) {
    if (isIndexedDBSupported()) {
      try {
        const indexedDBData = await ItemDB.getAll(userId);
        if (indexedDBData && indexedDBData.length > 0) return indexedDBData;
      } catch (e) { /* ignore */ }
    }
    const oldCached = await cacheManager.get<Item[]>('items');
    return oldCached || [];
  }

  return dedupedRequest(dedupKey, async () => {
    // Use cache manager's request coalescing for network requests
    return cacheManager.coalesce(`items-${userId}`, async () => {
      try {
        const startTime = performance.now();
        let query = supabase.from('items' as any).select('*');

        if (organizationId) {
          // Fetch items belonging to the organization OR created by the user
          // This prevents "lost" items during the migration to organization IDs
          query = query.or(`organization_id.eq.${organizationId},user_id.eq.${userId}`);
        } else {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        apiTracker.track(
          'items.select',
          'GET',
          performance.now() - startTime,
          error ? 'error' : 'success'
        );

        if (error) {
          console.error('Error fetching items:', error);
          // Try IndexedDB as fallback
          if (isIndexedDBSupported()) {
            const indexedDBData = await ItemDB.getAll(userId);
            if (indexedDBData && indexedDBData.length > 0) {
              return indexedDBData;
            }
          }
          if (cached) {
            console.log('[Cache] Using cached items after error');
            return cached;
          }
          throw error;
        }

        const result = data ? data.map(item => toCamelCase(item)) as Item[] : [];

        // PROTECT LOCAL STATE: Merge with pending changes before updating IndexedDB/Cache
        const dedupedResult = syncStorage.applyPendingChanges(result, 'items');

        // Only update IndexedDB if we received data from Supabase
        if (isIndexedDBSupported()) {
          try {
            if (dedupedResult.length > 0) {
              // Clear and sync Supabase data to IndexedDB
              await ItemDB.clear(userId);
              for (const item of dedupedResult) {
                await ItemDB.add({ ...item, user_id: userId } as never);
              }
              console.log(`[ItemService] Saved ${dedupedResult.length} items to IndexedDB`);
            } else {
              // Supabase returned empty - check if IndexedDB has data
              // This part should be handled by applyPendingChanges above if it included 'create'
              // but we'll keep the safety check
              const indexedDBData = await ItemDB.getAll(userId);
              if (indexedDBData && indexedDBData.length > 0) {
                return indexedDBData;
              }
            }
          } catch (error) {
            console.warn('[ItemService] Failed to save to IndexedDB:', error);
          }
        }

        // Update cache
        await cacheManager.set('items', dedupedResult);

        return dedupedResult;
      } catch (error) {
        console.error('Error fetching items:', error);
        // Try IndexedDB as fallback
        if (isIndexedDBSupported()) {
          const indexedDBData = await ItemDB.getAll(userId);
          if (indexedDBData && indexedDBData.length > 0) {
            return indexedDBData;
          }
        }
        if (cached) {
          console.log('[Cache] Returning cached items after timeout');
          return cached;
        }
        return [];
      }
    });
  });
}

/**
 * Create a new item
 * Priority: Supabase + IndexedDB + Cache
 */
export async function addItem(
  userId: string | undefined,
  organizationId: string | null,
  item: Item,
  queueChange?: (change: QueueChange) => void
): Promise<Item> {
  // CRITICAL FIX: Ensure final_price is always calculated and never null
  const basePrice = item.basePrice || 0;
  const markup = item.markup || 0;
  const markupType = item.markupType || 'percentage';

  let finalPrice = item.finalPrice;
  if (!finalPrice || finalPrice === 0) {
    if (markupType === 'percentage') {
      finalPrice = basePrice + (basePrice * markup / 100);
    } else if (markupType === 'fixed') {
      finalPrice = basePrice + markup;
    } else {
      finalPrice = basePrice;
    }
  }

  const itemWithUser = {
    ...item,
    user_id: userId,
    organization_id: organizationId,
    finalPrice
  } as Item;

  // Save to IndexedDB first if supported (includes minQuantity and imageUrl)
  if (isIndexedDBSupported()) {
    try {
      await ItemDB.add(itemWithUser as never);
      console.log('[ItemService] ✅ Saved item to IndexedDB (includes minQuantity and imageUrl)');
    } catch (error) {
      console.warn('[ItemService] IndexedDB save failed:', error);
    }
  }

  // Invalidate cache to force refresh
  await cacheManager.invalidate('items');

  // Check if Supabase is actually connected before attempting sync
  const isSupabaseConnected = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!navigator.onLine || !userId || !isSupabaseConnected) {
    if (!userId) {
      console.warn('[ItemService] ⚠️ No user ID - item saved to IndexedDB only.');
    }
    if (!isSupabaseConnected) {
      console.log('[ItemService] ℹ️ Supabase not connected - item saved to IndexedDB only.');
    }
    // Don't queue for sync if Supabase isn't connected
    if (isSupabaseConnected) {
      queueChange?.({ type: 'create', table: 'items', data: itemWithUser });
    }
    return itemWithUser;
  }

  try {
    // ✅ FIXED: Include ALL fields including minQuantity and imageUrl (migrations already exist)
    const dbItem = toSnakeCase(itemWithUser);

    console.log('[ItemService] Syncing to Supabase with minQuantity and imageUrl');

    const startTime = performance.now();
    const { error } = await supabase.from('items' as any).insert(dbItem as any);

    apiTracker.track(
      'items.insert',
      'POST',
      performance.now() - startTime,
      error ? 'error' : 'success'
    );

    if (error) {
      console.error('[ItemService] ❌ Database insert failed:', error);
      throw error;
    }

    console.log('[ItemService] ✅ Successfully synced to Supabase');

    dispatchDataRefresh('items-changed');

    return itemWithUser;
  } catch (error) {
    console.error('[ItemService] ⚠️ Error syncing to Supabase, item saved locally:', error);
    queueChange?.({ type: 'create', table: 'items', data: itemWithUser });
    // Still return the item since it's saved locally
    return itemWithUser;
  }
}

/**
 * Update an existing item
 * Priority: IndexedDB + Supabase + Cache
 */
export async function updateItem(
  userId: string | undefined,
  organizationId: string | null,
  id: string,
  updates: Partial<Item>,
  queueChange?: (change: QueueChange) => void
): Promise<Item> {
  // Get current item data
  let currentItem: Item | undefined;

  if (isIndexedDBSupported()) {
    try {
      const indexedItem = await ItemDB.getById(id);
      if (indexedItem) {
        currentItem = indexedItem;
      }
    } catch (error) {
      console.warn('[ItemService] IndexedDB read failed:', error);
    }
  }

  if (!currentItem) {
    const cached = await cacheManager.get<Item[]>('items');
    currentItem = cached?.find(i => i.id === id);
  }

  const updatedItem = { ...currentItem, ...updates } as Item;

  // Update IndexedDB (includes minQuantity and imageUrl)
  if (isIndexedDBSupported()) {
    try {
      await ItemDB.update({ ...updatedItem, user_id: userId } as never);
      console.log('[ItemService] ✅ Updated item in IndexedDB (includes minQuantity and imageUrl)');
    } catch (error) {
      console.warn('[ItemService] IndexedDB update failed:', error);
    }
  }

  // Invalidate cache
  await cacheManager.invalidate('items');

  // Check if Supabase is actually connected before attempting sync
  const isSupabaseConnected = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!navigator.onLine || !userId || !isSupabaseConnected) {
    if (!isSupabaseConnected) {
      console.log('[ItemService] ℹ️ Supabase not connected - item updated in IndexedDB only.');
    }
    // Don't queue for sync if Supabase isn't connected
    if (isSupabaseConnected) {
      queueChange?.({ type: 'update', table: 'items', data: { id, ...updates } });
    }
    return updatedItem;
  }

  try {
    // ✅ FIXED: Include ALL fields including minQuantity and imageUrl (migrations already exist)
    const dbUpdates = toSnakeCase(updates);

    console.log('[ItemService] Syncing update to Supabase with minQuantity and imageUrl');

    const startTime = performance.now();
    let query = supabase
      .from('items' as any)
      .update(dbUpdates as unknown)
      .eq('id', id);

    // If not in an organization context, strictly enforce user_id matching
    // If in an organization, allow RLS to handle permission (to allow owner/admin updates)
    if (!organizationId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query
      .select()
      .single();

    apiTracker.track(
      'items.update',
      'PUT',
      performance.now() - startTime,
      error ? 'error' : 'success'
    );

    if (error) throw error;

    console.log('[ItemService] ✅ Successfully synced update to Supabase');

    dispatchDataRefresh('items-changed');

    return updatedItem;
  } catch (error) {
    console.error('[ItemService] ⚠️ Error syncing update to Supabase, item updated locally:', error);
    queueChange?.({ type: 'update', table: 'items', data: { id, ...updates } });
    return updatedItem;
  }
}

/**
 * Delete an item
 * Priority: IndexedDB + Supabase + Cache
 */
export async function deleteItem(
  userId: string | undefined,
  organizationId: string | null,
  id: string,
  queueChange?: (change: QueueChange) => void
): Promise<void> {
  // Delete from IndexedDB
  if (isIndexedDBSupported()) {
    try {
      await ItemDB.delete(id);
      console.log('[ItemService] ✅ Deleted item from IndexedDB');
    } catch (error) {
      console.warn('[ItemService] IndexedDB delete failed:', error);
    }
  }

  // Invalidate cache
  await cacheManager.invalidate('items');

  // Check if Supabase is actually connected before attempting sync
  const isSupabaseConnected = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!navigator.onLine || !userId || !isSupabaseConnected) {
    if (!isSupabaseConnected) {
      console.log('[ItemService] ℹ️ Supabase not connected - item deleted from IndexedDB only.');
    }
    // Don't queue for sync if Supabase isn't connected
    if (isSupabaseConnected) {
      queueChange?.({ type: 'delete', table: 'items', data: { id } });
    }
    return;
  }

  try {
    const startTime = performance.now();
    let query = supabase
      .from('items' as any)
      .delete()
      .eq('id', id);

    // If not in an organization context, strictly enforce user_id matching
    // If in an organization, allow RLS to handle permission (to allow owner/admin deletes)
    if (!organizationId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    apiTracker.track(
      'items.delete',
      'DELETE',
      performance.now() - startTime,
      error ? 'error' : 'success'
    );

    if (error) throw error;

    console.log('[ItemService] ✅ Successfully synced delete to Supabase');

    dispatchDataRefresh('items-changed');
  } catch (error) {
    console.error('[ItemService] ⚠️ Error syncing delete to Supabase, item deleted locally:', error);
    queueChange?.({ type: 'delete', table: 'items', data: { id } });
  }
}
