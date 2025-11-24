/**
 * Item Service
 * Handles all item/service catalog database operations
 */

import { Item, QueueChange } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_KEYS, getCachedData, setCachedData } from './cache-service';
import { dedupedRequest, withTimeout } from './request-pool-service';
import { toCamelCase, toSnakeCase } from './transformation-utils';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';
import { ItemDB, isIndexedDBSupported } from '../indexed-db';

/**
 * Fetch all items for a user
 * Priority: IndexedDB > Supabase > Cache > Empty
 */
export async function getItems(userId: string | undefined): Promise<Item[]> {
  if (!userId) {
    console.warn('⚠️ No user ID - using cache for items.');
    return getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
  }

  const dedupKey = `fetch-items-${userId}`;

  return dedupedRequest(dedupKey, async () => {
    // Try IndexedDB first if supported
    if (isIndexedDBSupported()) {
      try {
        const indexedDBData = await ItemDB.getAll(userId);
        if (indexedDBData && indexedDBData.length > 0) {
          console.log(`[ItemService] Retrieved ${indexedDBData.length} items from IndexedDB`);
          // Update memory cache
          setCachedData<Item>(CACHE_KEYS.ITEMS, indexedDBData);
          return indexedDBData;
        }
      } catch (error) {
        console.warn('[ItemService] IndexedDB read failed, falling back to Supabase:', error);
      }
    }

    // Check memory cache
    const cached = getCachedData<Item>(CACHE_KEYS.ITEMS);
    
    if (!navigator.onLine) {
      return cached || [];
    }

    try {
      const dbQueryPromise = Promise.resolve(
        supabase
          .from('items')
          .select('*')
          .eq('user_id', userId)
      );
      
      const { data, error } = await withTimeout(dbQueryPromise, 15000);
      
      if (error) {
        console.error('Error fetching items:', error);
        if (cached) {
          console.log('[Cache] Using cached items after error');
          return cached;
        }
        throw error;
      }
      
      const result = data ? data.map(item => toCamelCase(item)) as Item[] : [];
      
      // Save to IndexedDB if supported
      if (isIndexedDBSupported()) {
        try {
          // Clear old data and save new
          await ItemDB.clear(userId);
          for (const item of result) {
            await ItemDB.add({ ...item, user_id: userId } as never);
          }
          console.log(`[ItemService] Saved ${result.length} items to IndexedDB`);
        } catch (error) {
          console.warn('[ItemService] Failed to save to IndexedDB:', error);
        }
      }
      
      // Update memory cache
      setCachedData<Item>(CACHE_KEYS.ITEMS, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching items:', error);
      if (cached) {
        console.log('[Cache] Returning cached items after timeout');
        return cached;
      }
      return [];
    }
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
    finalPrice // Ensure calculated finalPrice is used
  } as Item;

  // Save to IndexedDB first if supported
  if (isIndexedDBSupported()) {
    try {
      await ItemDB.add(itemWithUser as never);
      console.log('[ItemService] Saved item to IndexedDB');
    } catch (error) {
      console.warn('[ItemService] IndexedDB save failed:', error);
    }
  }

  // Update memory cache
  const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
  setCachedData<Item>(CACHE_KEYS.ITEMS, [...cached, itemWithUser]);

  if (!navigator.onLine || !userId) {
    if (!userId) {
      console.warn('⚠️ No user ID - item saved to IndexedDB/localStorage only.');
    }
    queueChange?.({ type: 'create', table: 'items', data: itemWithUser });
    return itemWithUser;
  }

  try {
    const dbItem = toSnakeCase(itemWithUser);
    const { error } = await supabase.from('items').insert(dbItem as unknown);
    
    if (error) {
      console.error('❌ Database insert failed for item:', error);
      throw error;
    }
    
    console.log('✅ Successfully inserted item into database');
    
    dispatchDataRefresh('items-changed');
    
    return itemWithUser;
  } catch (error) {
    console.error('⚠️ Error creating item, queued for sync:', error);
    queueChange?.({ type: 'create', table: 'items', data: itemWithUser });
    throw error;
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
    const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
    currentItem = cached.find(i => i.id === id);
  }

  const updatedItem = { ...currentItem, ...updates } as Item;

  // Update IndexedDB
  if (isIndexedDBSupported()) {
    try {
      await ItemDB.update({ ...updatedItem, user_id: userId } as never);
      console.log('[ItemService] Updated item in IndexedDB');
    } catch (error) {
      console.warn('[ItemService] IndexedDB update failed:', error);
    }
  }

  // Update memory cache
  const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
  const updatedCache = cached.map(item => 
    item.id === id ? updatedItem : item
  );
  setCachedData<Item>(CACHE_KEYS.ITEMS, updatedCache);

  if (!navigator.onLine || !userId) {
    queueChange?.({ type: 'update', table: 'items', data: { id, ...updates } });
    return updatedItem;
  }

  try {
    const dbUpdates = toSnakeCase(updates);
    const { error } = await supabase
      .from('items')
      .update(dbUpdates as unknown)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    dispatchDataRefresh('items-changed');
    
    return updatedItem;
  } catch (error) {
    console.error('Error updating item:', error);
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
      console.log('[ItemService] Deleted item from IndexedDB');
    } catch (error) {
      console.warn('[ItemService] IndexedDB delete failed:', error);
    }
  }

  // Update memory cache
  const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
  setCachedData<Item>(CACHE_KEYS.ITEMS, cached.filter(item => item.id !== id));

  if (!navigator.onLine || !userId) {
    queueChange?.({ type: 'delete', table: 'items', data: { id } });
    return;
  }

  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    dispatchDataRefresh('items-changed');
  } catch (error) {
    console.error('Error deleting item:', error);
    queueChange?.({ type: 'delete', table: 'items', data: { id } });
  }
}
