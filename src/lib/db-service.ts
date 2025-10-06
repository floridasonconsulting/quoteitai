import { supabase } from '@/integrations/supabase/client';
import { Customer, Item, Quote } from '@/types';
import { getStorageItem, setStorageItem } from './storage';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';

const CACHE_VERSION = 'v1';
const CACHE_KEYS = {
  CUSTOMERS: 'customers-cache',
  ITEMS: 'items-cache',
  QUOTES: 'quotes-cache',
} as const;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request deduplication map
const inFlightRequests = new Map<string, Promise<any>>();

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  version: string;
}

function getCachedData<T>(key: string): T[] | null {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  try {
    const entry: CacheEntry<T> = JSON.parse(cached);
    
    // Version check
    if (entry.version !== CACHE_VERSION) {
      console.log(`[Cache] ${key} version mismatch, clearing`);
      localStorage.removeItem(key);
      return null;
    }
    
    const age = Date.now() - entry.timestamp;
    
    if (age > CACHE_DURATION) {
      console.log(`[Cache] ${key} expired (${(age / 1000).toFixed(0)}s old)`);
      localStorage.removeItem(key);
      return null;
    }
    
    console.log(`[Cache] ${key} hit (${(age / 1000).toFixed(0)}s old)`);
    return entry.data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function setCachedData<T>(key: string, data: T[]): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  };
  localStorage.setItem(key, JSON.stringify(entry));
}

// Clear all caches (coordinated clear of localStorage + service worker)
export async function clearAllCaches(): Promise<void> {
  // Clear localStorage caches
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear service worker caches if available
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const messageChannel = new MessageChannel();
    
    return new Promise((resolve) => {
      messageChannel.port1.onmessage = () => {
        console.log('[Cache] All caches cleared (localStorage + Service Worker)');
        resolve();
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_ALL_CACHE' },
        [messageChannel.port2]
      );
      
      // Fallback timeout
      setTimeout(resolve, 1000);
    });
  }
  
  console.log('[Cache] localStorage caches cleared');
}

// Transformation functions to convert between camelCase (frontend) and snake_case (database)
export function toSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  const snakeCaseObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeCaseObj[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  return snakeCaseObj;
}

export function toCamelCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const camelCaseObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelCaseObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  return camelCaseObj;
}

// Timeout utility to prevent hanging promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

// Request deduplication wrapper
async function dedupedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  if (inFlightRequests.has(key)) {
    console.log(`[Dedup] Reusing in-flight request for ${key}`);
    return inFlightRequests.get(key)!;
  }

  const promise = requestFn().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

// Generic fetch with cache and deduplication
async function fetchWithCache<T>(
  userId: string | undefined,
  table: string,
  cacheKey: string
): Promise<T[]> {
  if (!userId) {
    console.warn(`⚠️ No user ID - using cache for ${table}.`);
    return getCachedData<T>(cacheKey) || [];
  }

  const dedupKey = `fetch-${table}-${userId}`;

  return dedupedRequest(dedupKey, async () => {
    // Check cache first
    const cached = getCachedData<T>(cacheKey);
    
    if (!navigator.onLine) {
      return cached || [];
    }

    try {
      // Apply 15-second timeout
      const dbQueryPromise = Promise.resolve(
        supabase
          .from(table as any)
          .select('*')
          .eq('user_id', userId)
      );
      
      const { data, error } = await withTimeout(dbQueryPromise, 15000);
      
      if (error) {
        console.error(`Error fetching ${table}:`, error);
        // Return cached data on error
        if (cached) {
          console.log(`[Cache] Using cached data for ${table} after error`);
          return cached;
        }
        throw error;
      }
      
      // Transform and cache
      const result = data ? data.map(item => toCamelCase(item)) as T[] : [];
      setCachedData<T>(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      if (cached) {
        console.log(`[Cache] Returning cached data for ${table} after timeout`);
        return cached;
      }
      return [];
    }
  });
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
    if (!userId) {
      console.warn(`⚠️ No user ID - saving ${table} to localStorage only. Sign in to save to database.`);
    }
    const cached = getStorageItem<T[]>(cacheKey, []);
    setStorageItem<T[]>(cacheKey, [...cached, itemWithUser]);
    queueChange?.({ type: 'create', table, data: toSnakeCase(itemWithUser) });
    return;
  }

  try {
    // Transform camelCase to snake_case for DB
    const dbItem = toSnakeCase(itemWithUser);
    const { error } = await supabase.from(table as any).insert(dbItem as any);
    if (error) {
      console.error(`❌ Database insert failed for ${table}:`, error);
      throw error;
    }
    
    console.log(`✅ Successfully inserted ${table} into database`);
    // Update cache with camelCase version and fresh timestamp
    const cached = getCachedData<T>(cacheKey) || [];
    setCachedData<T>(cacheKey, [...cached, itemWithUser as T]);
    
    // Dispatch refresh event
    if (table === 'customers') dispatchDataRefresh('customers-changed');
    if (table === 'items') dispatchDataRefresh('items-changed');
    if (table === 'quotes') dispatchDataRefresh('quotes-changed');
  } catch (error) {
    console.error(`⚠️ Error creating ${table}, falling back to localStorage:`, error);
    // Fallback to cache
    const cached = getCachedData<T>(cacheKey) || [];
    setCachedData<T>(cacheKey, [...cached, itemWithUser as T]);
    queueChange?.({ type: 'create', table, data: toSnakeCase(itemWithUser) });
    throw error; // Re-throw so caller knows it failed
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
    const cached = getCachedData<T>(cacheKey) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setCachedData<T>(cacheKey, updated);
    queueChange?.({ type: 'update', table, data: toSnakeCase({ id, ...updates }) });
    return;
  }

  try {
    // Transform camelCase to snake_case for DB
    const dbUpdates = toSnakeCase(updates);
    const { error } = await supabase
      .from(table as any)
      .update(dbUpdates as any)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Update cache with camelCase version
    const cached = getCachedData<T>(cacheKey) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setCachedData<T>(cacheKey, updated);
    
    // Dispatch refresh event
    if (table === 'customers') dispatchDataRefresh('customers-changed');
    if (table === 'items') dispatchDataRefresh('items-changed');
    if (table === 'quotes') dispatchDataRefresh('quotes-changed');
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    // Fallback to cache
    const cached = getCachedData<T>(cacheKey) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setCachedData<T>(cacheKey, updated);
    queueChange?.({ type: 'update', table, data: toSnakeCase({ id, ...updates }) });
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
    const cached = getCachedData<T>(cacheKey) || [];
    setCachedData<T>(cacheKey, cached.filter(item => item.id !== id));
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
    const cached = getCachedData<T>(cacheKey) || [];
    setCachedData<T>(cacheKey, cached.filter(item => item.id !== id));
    
    // Dispatch refresh event
    if (table === 'customers') dispatchDataRefresh('customers-changed');
    if (table === 'items') dispatchDataRefresh('items-changed');
    if (table === 'quotes') dispatchDataRefresh('quotes-changed');
  } catch (error) {
    console.error(`Error deleting ${table}:`, error);
    // Fallback to cache
    const cached = getCachedData<T>(cacheKey) || [];
    setCachedData<T>(cacheKey, cached.filter(item => item.id !== id));
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

// Company Settings
export const getSettings = async (userId: string | undefined): Promise<any> => {
  const defaultSettings = {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    website: '',
    license: '',
    insurance: '',
    logoDisplayOption: 'both',
    terms: 'Payment due within 30 days. Thank you for your business!',
  };

  if (!userId) {
    return getStorageItem('quote-it-settings', defaultSettings);
  }

  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const settings = {
        name: data.name || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        license: data.license || '',
        insurance: data.insurance || '',
        logo: data.logo || '',
        logoDisplayOption: data.logo_display_option || 'both',
        terms: data.terms || 'Payment due within 30 days. Thank you for your business!',
      };
      setStorageItem('quote-it-settings', settings);
      return settings;
    }

    return defaultSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return getStorageItem('quote-it-settings', defaultSettings);
  }
};

export const saveSettings = async (userId: string | undefined, settings: any, queueChange?: (change: any) => void): Promise<void> => {
  setStorageItem('quote-it-settings', settings);

  if (!userId) return;

  try {
    const settingsData = {
      user_id: userId,
      name: settings.name,
      address: settings.address,
      city: settings.city,
      state: settings.state,
      zip: settings.zip,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      license: settings.license,
      insurance: settings.insurance,
      logo: settings.logo,
      logo_display_option: settings.logoDisplayOption,
      terms: settings.terms,
    };

    const { error } = await supabase
      .from('company_settings')
      .upsert(settingsData, { onConflict: 'user_id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving settings:', error);
    if (queueChange) {
      queueChange({
        type: 'upsert',
        table: 'company_settings',
        data: settings,
      });
    }
  }
};

export async function clearDatabaseData(userId: string | undefined): Promise<void> {
  if (!userId) return;

  const { error: customersError } = await supabase
    .from('customers')
    .delete()
    .eq('user_id', userId);

  const { error: itemsError } = await supabase
    .from('items')
    .delete()
    .eq('user_id', userId);

  const { error: quotesError } = await supabase
    .from('quotes')
    .delete()
    .eq('user_id', userId);

  if (customersError || itemsError || quotesError) {
    throw new Error('Failed to clear database data');
  }

  // Clear caches
  localStorage.removeItem(`customers_${userId}`);
  localStorage.removeItem(`items_${userId}`);
  localStorage.removeItem(`quotes_${userId}`);
}
