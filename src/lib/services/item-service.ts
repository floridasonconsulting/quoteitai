/**
 * Item Service
 * Handles all item/service catalog database operations
 */

import { Item, QueueChange } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '../cache-manager';
import { dedupedRequest, executeWithPool, withTimeout } from './request-pool-service';
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
// Fetch all items for a user
// Priority: Cache/IDB (Immediate) -> Supabase (Background Refresh)
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

  // 1. Try Memory Cache
  cached = await cacheManager.get<Item[]>('items');

  // 2. Try IndexedDB if memory miss
  if (!cached && isIndexedDBSupported()) {
    try {
      const indexedDBData = await ItemDB.getAll(userId);
      if (indexedDBData && indexedDBData.length > 0) {
        cached = indexedDBData;
        await cacheManager.set('items', indexedDBData);
      }
    } catch (e) {
      console.warn('[ItemService] IDB read failed:', e);
    }
  }

  // Define Background Fetch Function
  const fetchFromSupabase = async () => {
    if (!navigator.onLine) {
      console.log('[ItemService] Offline - skipping background fetch');
      return null;
    }

    console.log('[ItemService] 🔄 SWR: Fetching items from Supabase...');
    try {
      return await dedupedRequest(dedupKey, async () => {
        // Use cache manager's request coalescing for network requests
        return cacheManager.coalesce(`items-${userId}`, async () => {
          const startTime = performance.now();
          let query = supabase.from('items' as any).select('*');

          if (organizationId) {
            // Fetch items belonging to the organization OR created by the user
            // This prevents "lost" items during the migration to organization IDs
            query = query.or(`organization_id.eq.${organizationId},user_id.eq.${userId}`);
          } else {
            query = query.eq('user_id', userId);
          }

          const { data, error } = await executeWithPool(async (signal) => {
            return await (query.order('created_at', { ascending: false }) as any).abortSignal(signal);
          }, 15000, `fetch-items-${userId}`);

          apiTracker.track(
            'items.select',
            'GET',
            performance.now() - startTime,
            error ? 'error' : 'success'
          );

          if (error) {
            console.error('[ItemService] SWR fetch error:', error);
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
              }
            } catch (error) {
              console.warn('[ItemService] Failed to save to IndexedDB:', error);
            }
          }

          // Update cache - Detect Change?
          // For items, array comparison is expensive. We just update it.
          await cacheManager.set('items', dedupedResult);

          // Notify if data changed (simple length check or just always dispatch for safety)
          if (!cached || JSON.stringify(cached.map(i => i.id).sort()) !== JSON.stringify(dedupedResult.map(i => i.id).sort())) {
            console.log('[ItemService] 🔄 Data changed, dispatching refresh');
            dispatchDataRefresh('items-changed');
          }

          return dedupedResult;
        });
      });
    } catch (err) {
      console.error('[ItemService] Background fetch failed:', err);
      return null;
    }
  };

  // STRATEGY:
  // 1. If Forced Refresh: Await Sync.
  // 2. If Cached: Return Cache + Trigger Background Sync.
  // 3. If No Cache: Await Sync.

  if (forceRefresh) {
    console.log('[ItemService] Force refresh requested - awaiting fetch');
    const fresh = await fetchFromSupabase();
    return fresh || cached || [];
  }

  if (cached) {
    console.log(`[ItemService] ⚡ Using ${cached.length} cached items (background sync triggered)`);
    // Fire and forget background fetch
    fetchFromSupabase().catch(e => console.error('Background sync error:', e));
    return cached;
  }

  console.log('[ItemService] ⏳ No cache, awaiting items...');
  const initialFetch = await fetchFromSupabase();
  return initialFetch || [];
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
    const { error } = await executeWithPool(async (signal) => {
      return await (supabase.from('items' as any).insert(dbItem as any) as any).abortSignal(signal);
    }, 15000, `create-item-${item.id}`);

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
    const { error } = await executeWithPool(async (signal) => {
      let query = supabase
        .from('items' as any)
        .update(dbUpdates as unknown)
        .eq('id', id);

      if (!organizationId) {
        query = query.eq('user_id', userId);
      }

      return await (query.select().single() as any).abortSignal(signal);
    }, 15000, `update-item-${id}`);

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
    const { error } = await executeWithPool(async (signal) => {
      let query = supabase
        .from('items' as any)
        .delete()
        .eq('id', id);

      // If not in an organization context, strictly enforce user_id matching
      // If in an organization, allow RLS to handle permission (to allow owner/admin deletes)
      if (!organizationId) {
        query = query.eq('user_id', userId);
      }
      return await (query as any).abortSignal(signal);
    }, 15000, `delete-item-${id}`);

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
