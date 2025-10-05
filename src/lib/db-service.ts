import { supabase } from '@/integrations/supabase/client';
import { Customer, Item, Quote } from '@/types';
import { getStorageItem, setStorageItem } from './storage';

const CACHE_KEYS = {
  CUSTOMERS: 'customers-cache',
  ITEMS: 'items-cache',
  QUOTES: 'quotes-cache',
} as const;

// Generic fetch with cache
async function fetchWithCache<T>(
  userId: string | undefined,
  table: string,
  cacheKey: string
): Promise<T[]> {
  if (!navigator.onLine || !userId) {
    return getStorageItem<T[]>(cacheKey, []);
  }

  try {
    const { data, error } = await supabase
      .from(table as any)
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const result = (data as T[]) || [];
    setStorageItem<T[]>(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    return getStorageItem<T[]>(cacheKey, []);
  }
}

// Generic create with cache
async function createWithCache<T>(
  userId: string | undefined,
  table: string,
  cacheKey: string,
  item: T,
  queueChange?: (change: any) => void
): Promise<void> {
  const itemWithUser = { ...item, user_id: userId };

  if (!navigator.onLine || !userId) {
    // Offline: update cache and queue
    const cached = getStorageItem<T[]>(cacheKey, []);
    setStorageItem<T[]>(cacheKey, [...cached, itemWithUser]);
    queueChange?.({ type: 'create', table, data: itemWithUser });
    return;
  }

  try {
    const { error } = await supabase.from(table as any).insert(itemWithUser as any);
    if (error) throw error;
    
    // Update cache
    const cached = getStorageItem<T[]>(cacheKey, []);
    setStorageItem<T[]>(cacheKey, [...cached, itemWithUser as T]);
  } catch (error) {
    console.error(`Error creating ${table}:`, error);
    // Fallback to cache
    const cached = getStorageItem<T[]>(cacheKey, []);
    setStorageItem<T[]>(cacheKey, [...cached, itemWithUser as T]);
    queueChange?.({ type: 'create', table, data: itemWithUser });
  }
}

// Generic update with cache
async function updateWithCache<T extends { id: string }>(
  userId: string | undefined,
  table: string,
  cacheKey: string,
  id: string,
  updates: Partial<T>,
  queueChange?: (change: any) => void
): Promise<void> {
  if (!navigator.onLine || !userId) {
    // Offline: update cache and queue
    const cached = getStorageItem<T[]>(cacheKey, []);
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setStorageItem<T[]>(cacheKey, updated);
    queueChange?.({ type: 'update', table, data: { id, ...updates } });
    return;
  }

  try {
    const { error } = await supabase
      .from(table as any)
      .update(updates as any)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Update cache
    const cached = getStorageItem<T[]>(cacheKey, []);
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setStorageItem<T[]>(cacheKey, updated);
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    // Fallback to cache
    const cached = getStorageItem<T[]>(cacheKey, []);
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setStorageItem<T[]>(cacheKey, updated);
    queueChange?.({ type: 'update', table, data: { id, ...updates } });
  }
}

// Generic delete with cache
async function deleteWithCache<T extends { id: string }>(
  userId: string | undefined,
  table: string,
  cacheKey: string,
  id: string,
  queueChange?: (change: any) => void
): Promise<void> {
  if (!navigator.onLine || !userId) {
    // Offline: update cache and queue
    const cached = getStorageItem<T[]>(cacheKey, []);
    setStorageItem<T[]>(cacheKey, cached.filter(item => item.id !== id));
    queueChange?.({ type: 'delete', table, data: { id } });
    return;
  }

  try {
    const { error } = await supabase
      .from(table as any)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Update cache
    const cached = getStorageItem<T[]>(cacheKey, []);
    setStorageItem<T[]>(cacheKey, cached.filter(item => item.id !== id));
  } catch (error) {
    console.error(`Error deleting ${table}:`, error);
    // Fallback to cache
    const cached = getStorageItem<T[]>(cacheKey, []);
    setStorageItem<T[]>(cacheKey, cached.filter(item => item.id !== id));
    queueChange?.({ type: 'delete', table, data: { id } });
  }
}

// Customers
export const getCustomers = (userId: string | undefined) => 
  fetchWithCache<Customer>(userId, 'customers', CACHE_KEYS.CUSTOMERS);

export const addCustomer = (userId: string | undefined, customer: Customer, queueChange?: (change: any) => void) =>
  createWithCache(userId, 'customers', CACHE_KEYS.CUSTOMERS, customer, queueChange);

export const updateCustomer = (userId: string | undefined, id: string, updates: Partial<Customer>, queueChange?: (change: any) => void) =>
  updateWithCache(userId, 'customers', CACHE_KEYS.CUSTOMERS, id, updates, queueChange);

export const deleteCustomer = (userId: string | undefined, id: string, queueChange?: (change: any) => void) =>
  deleteWithCache<Customer>(userId, 'customers', CACHE_KEYS.CUSTOMERS, id, queueChange);

// Items
export const getItems = (userId: string | undefined) =>
  fetchWithCache<Item>(userId, 'items', CACHE_KEYS.ITEMS);

export const addItem = (userId: string | undefined, item: Item, queueChange?: (change: any) => void) =>
  createWithCache(userId, 'items', CACHE_KEYS.ITEMS, item, queueChange);

export const updateItem = (userId: string | undefined, id: string, updates: Partial<Item>, queueChange?: (change: any) => void) =>
  updateWithCache(userId, 'items', CACHE_KEYS.ITEMS, id, updates, queueChange);

export const deleteItem = (userId: string | undefined, id: string, queueChange?: (change: any) => void) =>
  deleteWithCache<Item>(userId, 'items', CACHE_KEYS.ITEMS, id, queueChange);

// Quotes
export const getQuotes = (userId: string | undefined) =>
  fetchWithCache<Quote>(userId, 'quotes', CACHE_KEYS.QUOTES);

export const addQuote = (userId: string | undefined, quote: Quote, queueChange?: (change: any) => void) =>
  createWithCache(userId, 'quotes', CACHE_KEYS.QUOTES, quote, queueChange);

export const updateQuote = (userId: string | undefined, id: string, updates: Partial<Quote>, queueChange?: (change: any) => void) =>
  updateWithCache(userId, 'quotes', CACHE_KEYS.QUOTES, id, updates, queueChange);

export const deleteQuote = (userId: string | undefined, id: string, queueChange?: (change: any) => void) =>
  deleteWithCache<Quote>(userId, 'quotes', CACHE_KEYS.QUOTES, id, queueChange);
