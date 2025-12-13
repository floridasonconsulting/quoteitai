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

/**
 * Fetch all items for a user
 * Priority: Cache > IndexedDB > Supabase > Empty
 */
export async function getItems(userId: string | undefined): Promise<Item[]> {
  if (!userId) {
    console.warn('⚠️ No user ID - using cache for items.');
    const cached = await cacheManager.get<Item[]>('items');
    return cached || [];
  }

  const dedupKey = `fetch-items-${userId}`;

  return dedupedRequest(dedupKey, async () => {
    // Check cache first (CacheManager handles memory cache)
    const cached = await cacheManager.get<Item[]>('items');
    if (cached && cached.length > 0) {
      console.log(`[ItemService] Retrieved ${cached.length} items from cache`);
      return cached;
    }

    // Try IndexedDB if cache miss
    if (isIndexedDBSupported()) {
      try {
        const indexedDBData = await ItemDB.getAll(userId);
        if (indexedDBData && indexedDBData.length > 0) {
          console.log(`[ItemService] Retrieved ${indexedDBData.length} items from IndexedDB`);
          // Update cache
          await cacheManager.set('items', indexedDBData);
          
          // If offline, return IndexedDB data immediately
          if (!navigator.onLine) {
            return indexedDBData;
          }
          
          // If online, we'll fetch from Supabase to sync, but keep IndexedDB data as fallback
        }
      } catch (error) {
        console.warn('[ItemService] IndexedDB read failed, falling back to Supabase:', error);
      }
    }

    if (!navigator.onLine) {
      return cached || [];
    }

    // Use cache manager's request coalescing for network requests
    return cacheManager.coalesce(`items-${userId}`, async () => {
      try {
        const startTime = performance.now();
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

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
        
        // Only update IndexedDB if we received data from Supabase
        // If Supabase returns empty but IndexedDB has data, keep IndexedDB data (offline-created records)
        if (isIndexedDBSupported()) {
          try {
            if (result.length > 0) {
              // Sync Supabase data to IndexedDB
              for (const item of result) {
                await ItemDB.update({ ...item, user_id: userId } as never);
              }
              console.log(`[ItemService] Saved ${result.length} items to IndexedDB`);
            } else {
              // Supabase returned empty - check if IndexedDB has data
              const indexedDBData = await ItemDB.getAll(userId);
              if (indexedDBData && indexedDBData.length > 0) {
                console.log(`[ItemService] Supabase empty, using ${indexedDBData.length} items from IndexedDB`);
                // Update cache with IndexedDB data
                await cacheManager.set('items', indexedDBData);
                return indexedDBData;
              }
            }
          } catch (error) {
            console.warn('[ItemService] Failed to save to IndexedDB:', error);
          }
        }
        
        // Update cache
        await cacheManager.set('items', result);
        
        return result;
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
    const { error } = await supabase.from('items').insert(dbItem as unknown);
    
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
    const { error } = await supabase
      .from('items')
      .update(dbUpdates as unknown)
      .eq('id', id)
      .eq('user_id', userId)
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
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
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
