
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

/**
 * Fetch all items for a user
 */
export async function getItems(userId: string | undefined): Promise<Item[]> {
  if (!userId) {
    console.warn('⚠️ No user ID - using cache for items.');
    return getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
  }

  const dedupKey = `fetch-items-${userId}`;

  return dedupedRequest(dedupKey, async () => {
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

  if (!navigator.onLine || !userId) {
    if (!userId) {
      console.warn('⚠️ No user ID - saving item to localStorage only.');
    }
    const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
    setCachedData<Item>(CACHE_KEYS.ITEMS, [...cached, itemWithUser]);
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
    const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
    setCachedData<Item>(CACHE_KEYS.ITEMS, [...cached, itemWithUser]);
    
    dispatchDataRefresh('items-changed');
    
    return itemWithUser;
  } catch (error) {
    console.error('⚠️ Error creating item, falling back to localStorage:', error);
    const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
    setCachedData<Item>(CACHE_KEYS.ITEMS, [...cached, itemWithUser]);
    queueChange?.({ type: 'create', table: 'items', data: itemWithUser });
    throw error;
  }
}

/**
 * Update an existing item
 */
export async function updateItem(
  userId: string | undefined,
  id: string,
  updates: Partial<Item>,
  queueChange?: (change: QueueChange) => void
): Promise<Item> {
  if (!navigator.onLine || !userId) {
    const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as Item : item
    );
    setCachedData<Item>(CACHE_KEYS.ITEMS, updated);
    queueChange?.({ type: 'update', table: 'items', data: { id, ...updates } });
    return updated.find(item => item.id === id)!;
  }

  try {
    const dbUpdates = toSnakeCase(updates);
    const { error } = await supabase
      .from('items')
      .update(dbUpdates as unknown)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as Item : item
    );
    setCachedData<Item>(CACHE_KEYS.ITEMS, updated);
    
    dispatchDataRefresh('items-changed');
    
    return updated.find(item => item.id === id)!;
  } catch (error) {
    console.error('Error updating item:', error);
    const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as Item : item
    );
    setCachedData<Item>(CACHE_KEYS.ITEMS, updated);
    queueChange?.({ type: 'update', table: 'items', data: { id, ...updates } });
    return updated.find(item => item.id === id)!;
  }
}

/**
 * Delete an item
 */
export async function deleteItem(
  userId: string | undefined,
  id: string,
  queueChange?: (change: QueueChange) => void
): Promise<void> {
  if (!navigator.onLine || !userId) {
    const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
    setCachedData<Item>(CACHE_KEYS.ITEMS, cached.filter(item => item.id !== id));
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
    
    const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
    setCachedData<Item>(CACHE_KEYS.ITEMS, cached.filter(item => item.id !== id));
    
    dispatchDataRefresh('items-changed');
  } catch (error) {
    console.error('Error deleting item:', error);
    const cached = getCachedData<Item>(CACHE_KEYS.ITEMS) || [];
    setCachedData<Item>(CACHE_KEYS.ITEMS, cached.filter(item => item.id !== id));
    queueChange?.({ type: 'delete', table: 'items', data: { id } });
  }
}
