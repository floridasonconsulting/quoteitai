import { supabase } from '@/integrations/supabase/client';
import { Customer, Item, Quote, CompanySettings, QueueChange } from '@/types';
import { getStorageItem, setStorageItem } from './storage';
import * as LocalDB from './local-db';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';

const CACHE_VERSION = 'v1';
const CACHE_KEYS = {
  CUSTOMERS: 'customers-cache',
  ITEMS: 'items-cache',
  QUOTES: 'quotes-cache',
} as const;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request pooling to limit concurrent Supabase requests
const MAX_CONCURRENT_REQUESTS = 2;
const requestQueue: Array<() => Promise<unknown>> = [];
let activeRequests = 0;

async function executeWithPool<T>(requestFn: () => Promise<T>): Promise<T> {
  while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  activeRequests++;
  try {
    return await requestFn();
  } finally {
    activeRequests--;
  }
}

// Request deduplication map with timestamp tracking and abort controllers
interface InFlightRequest {
  promise: Promise<unknown>;
  startTime: number;
  abortController: AbortController;
}

const inFlightRequests = new Map<string, InFlightRequest>();
const MAX_REQUEST_AGE = 20000; // 20 seconds max age for in-flight requests

// Extend window type for debugging
declare global {
  interface Window {
    __inFlightRequests: Map<string, InFlightRequest>;
  }
}

// Expose for debugging in Diagnostics page
if (typeof window !== 'undefined') {
  window.__inFlightRequests = inFlightRequests;
}

// Clear all in-flight requests (emergency cleanup)
export function clearInFlightRequests(): void {
  const count = inFlightRequests.size;
  if (count > 0) {
    console.log(`[Dedup] Clearing ${count} in-flight requests`);
    // Abort all controllers
    inFlightRequests.forEach((request) => {
      request.abortController.abort();
    });
    inFlightRequests.clear();
  }
}

// Clear stale requests that have been in-flight too long
function clearStaleRequests(): void {
  const now = Date.now();
  const staleKeys: string[] = [];
  
  inFlightRequests.forEach((request, key) => {
    if (now - request.startTime > MAX_REQUEST_AGE) {
      staleKeys.push(key);
      // Abort stale request
      request.abortController.abort();
    }
  });
  
  if (staleKeys.length > 0) {
    console.log(`[Dedup] Clearing ${staleKeys.length} stale requests:`, staleKeys);
    staleKeys.forEach(key => inFlightRequests.delete(key));
  }
}

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  version: string;
}

export function getCachedData<T>(key: string): T[] | null {
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

export function setCachedData<T>(key: string, data: T[]): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  };
  localStorage.setItem(key, JSON.stringify(entry));
}

// Clear all caches (coordinated clear of localStorage + service worker)
export async function clearAllCaches(): Promise<void> {
  // Clear in-flight requests first
  clearInFlightRequests();
  
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
export function toSnakeCase(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  const snakeCaseObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeCaseObj[snakeKey] = toSnakeCase((obj as Record<string, unknown>)[key]);
    }
  }
  return snakeCaseObj;
}

export function toCamelCase(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const camelCaseObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelCaseObj[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
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

// Request deduplication wrapper with abort support
async function dedupedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  // Clear stale requests before checking
  clearStaleRequests();
  
  const existing = inFlightRequests.get(key);
  if (existing) {
    const age = Date.now() - existing.startTime;
    console.log(`[Dedup] Reusing in-flight request for ${key} (age: ${age}ms)`);
    return existing.promise as Promise<T>;
  }

  console.log(`[Dedup] Starting new request for ${key}`);
  
  // Create abort controller for this request
  const abortController = new AbortController();
  
  // Create promise with guaranteed cleanup
  const promise = (async () => {
    try {
      const result = await executeWithPool(requestFn);
      return result;
    } catch (error) {
      // Don't log abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error(`[Dedup] Request failed for ${key}:`, error);
      }
      throw error;
    } finally {
      // Always cleanup, even on error or timeout
      const deleted = inFlightRequests.delete(key);
      console.log(`[Dedup] Cleanup for ${key}: ${deleted ? 'success' : 'already removed'}`);
    }
  })();

  inFlightRequests.set(key, {
    promise,
    startTime: Date.now(),
    abortController
  });
  
  return promise as Promise<T>;
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  queueChange?: (change: QueueChange) => void
): Promise<T> {
  const itemWithUser = { ...item, user_id: userId } as T;

  if (!navigator.onLine || !userId) {
    // Offline: update cache and queue
    if (!userId) {
      console.warn(`⚠️ No user ID - saving ${table} to localStorage only. Sign in to save to database.`);
    }
    const cached = getCachedData<T>(cacheKey) || [];
    setCachedData<T>(cacheKey, [...cached, itemWithUser]);
    queueChange?.({ type: 'create', table, data: itemWithUser as ChangeData });
    return itemWithUser;
  }

  try {
    // Transform camelCase to snake_case for DB
    const dbItem = toSnakeCase(itemWithUser);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table as any).insert(dbItem as unknown);
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
    
    return itemWithUser;
  } catch (error) {
    console.error(`⚠️ Error creating ${table}, falling back to localStorage:`, error);
    // Fallback to cache
    const cached = getCachedData<T>(cacheKey) || [];
    setCachedData<T>(cacheKey, [...cached, itemWithUser as T]);
    queueChange?.({ type: 'create', table, data: itemWithUser as ChangeData });
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
  queueChange?: (change: QueueChange) => void
): Promise<T> {
  const updatedItem = { ...updates, id } as T;
  
  if (!navigator.onLine || !userId) {
    // Offline: update cache and queue
    const cached = getCachedData<T>(cacheKey) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as T : item
    );
    setCachedData<T>(cacheKey, updated);
    queueChange?.({ type: 'update', table, data: { id, ...updates } as ChangeData });
    return updated.find(item => item.id === id)!;
  }

  try {
    // Transform camelCase to snake_case for DB
    const dbUpdates = toSnakeCase(updates);
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any)
      .update(dbUpdates as unknown)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Update cache with camelCase version
    const cached = getCachedData<T>(cacheKey) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as T : item
    );
    setCachedData<T>(cacheKey, updated);
    
    // Dispatch refresh event
    if (table === 'customers') dispatchDataRefresh('customers-changed');
    if (table === 'items') dispatchDataRefresh('items-changed');
    if (table === 'quotes') dispatchDataRefresh('quotes-changed');
    
    return updated.find(item => item.id === id)!;
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    // Fallback to cache
    const cached = getCachedData<T>(cacheKey) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as T : item
    );
    setCachedData<T>(cacheKey, updated);
    queueChange?.({ type: 'update', table, data: { id, ...updates } as ChangeData });
    return updated.find(item => item.id === id)!;
  }
}

// Generic delete with cache
async function deleteWithCache<T extends { id: string }>(
  userId: string | undefined,
  table: string,
  cacheKey: string,
  id: string,
  queueChange?: (change: QueueChange) => void
): Promise<void> {
  if (!navigator.onLine || !userId) {
    // Offline: update cache and queue
    const cached = getCachedData<T>(cacheKey) || [];
    setCachedData<T>(cacheKey, cached.filter(item => item.id !== id));
    queueChange?.({ type: 'delete', table, data: { id } as Partial<T> });
    return;
  }

  try {
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    queueChange?.({ type: 'delete', table, data: { id } as Partial<T> });
  }
}

// Customers
export const getCustomers = (userId: string | undefined) => 
  fetchWithCache<Customer>(userId, 'customers', CACHE_KEYS.CUSTOMERS);

export const addCustomer = (userId: string | undefined, customer: Customer, queueChange?: (change: QueueChange) => void): Promise<Customer> =>
  createWithCache(userId, 'customers', CACHE_KEYS.CUSTOMERS, customer, queueChange);

export const updateCustomer = (userId: string | undefined, id: string, updates: Partial<Customer>, queueChange?: (change: QueueChange) => void): Promise<Customer> =>
  updateWithCache(userId, 'customers', CACHE_KEYS.CUSTOMERS, id, updates, queueChange);

export const deleteCustomer = (userId: string | undefined, id: string, queueChange?: (change: QueueChange) => void) =>
  deleteWithCache<Customer>(userId, 'customers', CACHE_KEYS.CUSTOMERS, id, queueChange);

// Items
export const getItems = (userId: string | undefined) =>
  fetchWithCache<Item>(userId, 'items', CACHE_KEYS.ITEMS);

export const addItem = (userId: string | undefined, item: Item, queueChange?: (change: QueueChange) => void): Promise<Item> =>
  createWithCache(userId, 'items', CACHE_KEYS.ITEMS, item, queueChange);

export const updateItem = (userId: string | undefined, id: string, updates: Partial<Item>, queueChange?: (change: QueueChange) => void): Promise<Item> =>
  updateWithCache(userId, 'items', CACHE_KEYS.ITEMS, id, updates, queueChange);

export const deleteItem = (userId: string | undefined, id: string, queueChange?: (change: QueueChange) => void) =>
  deleteWithCache<Item>(userId, 'items', CACHE_KEYS.ITEMS, id, queueChange);

// Quotes
export const getQuotes = (userId: string | undefined) =>
  fetchWithCache<Quote>(userId, 'quotes', CACHE_KEYS.QUOTES);

export const addQuote = (userId: string | undefined, quote: Quote, queueChange?: (change: QueueChange) => void) =>
  createWithCache(userId, 'quotes', CACHE_KEYS.QUOTES, quote, queueChange);

export const updateQuote = (userId: string | undefined, id: string, updates: Partial<Quote>, queueChange?: (change: QueueChange) => void) =>
  updateWithCache(userId, 'quotes', CACHE_KEYS.QUOTES, id, updates, queueChange);

export const deleteQuote = (userId: string | undefined, id: string, queueChange?: (change: QueueChange) => void) =>
  deleteWithCache<Quote>(userId, 'quotes', CACHE_KEYS.QUOTES, id, queueChange);

// Company Settings
export const getSettings = async (userId: string | undefined): Promise<CompanySettings> => {
  const defaultSettings: CompanySettings = {
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
    proposalTemplate: 'classic',
    notifyEmailAccepted: true,
    notifyEmailDeclined: true,
  };

  if (!userId) {
    return getStorageItem<CompanySettings>('quote-it-settings', defaultSettings);
  }

  try {
    // Don't use cache - always fetch fresh from database
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
        proposalTemplate: data.proposal_template || 'classic',
        notifyEmailAccepted: data.notify_email_accepted !== false, // default true
        notifyEmailDeclined: data.notify_email_declined !== false, // default true
      };
      
      console.log('[DB Service] Retrieved settings from DB:', { 
        proposalTemplate: settings.proposalTemplate, 
        logoDisplayOption: settings.logoDisplayOption,
        notifyEmailAccepted: settings.notifyEmailAccepted,
        notifyEmailDeclined: settings.notifyEmailDeclined
      });
      
      // Cache the fresh settings
      setStorageItem('quote-it-settings', settings);
      return settings;
    }

    return defaultSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return getStorageItem<CompanySettings>('quote-it-settings', defaultSettings);
  }
};

export const saveSettings = async (userId: string | undefined, settings: CompanySettings, queueChange?: (change: QueueChange) => void): Promise<void> => {
  if (!userId) return;

  try {
    const settingsData = {
      user_id: userId,
      name: settings.name || '',
      address: settings.address || '',
      city: settings.city || '',
      state: settings.state || '',
      zip: settings.zip || '',
      phone: settings.phone || '',
      email: settings.email || '',
      website: settings.website || '',
      license: settings.license || '',
      insurance: settings.insurance || '',
      logo: settings.logo || '',
      logo_display_option: settings.logoDisplayOption || 'both',
      terms: settings.terms || '',
      proposal_template: settings.proposalTemplate || 'classic',
      notify_email_accepted: settings.notifyEmailAccepted !== false,
      notify_email_declined: settings.notifyEmailDeclined !== false,
    };

    console.log('[DB Service] Saving settings to DB:', {
      proposalTemplate: settingsData.proposal_template,
      logoDisplayOption: settingsData.logo_display_option,
      notifyEmailAccepted: settingsData.notify_email_accepted,
      notifyEmailDeclined: settingsData.notify_email_declined
    });

    const { error } = await supabase
      .from('company_settings')
      .upsert(settingsData, { onConflict: 'user_id' });

    if (error) throw error;
    
    // Clear the cache after successful save to force fresh fetch next time
    localStorage.removeItem('quote-it-settings');
    console.log('[DB Service] Settings saved successfully to database');
  } catch (error) {
    console.error('Error saving settings:', error);
    if (queueChange) {
      queueChange({
        type: 'upsert',
        table: 'company_settings',
        data: settings,
      });
    }
    throw error;
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

// Clear only sample data (customers, items, quotes) but keep company settings
export async function clearSampleData(userId: string | undefined): Promise<void> {
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
    throw new Error('Failed to clear sample data');
  }

  // Clear caches
  localStorage.removeItem(CACHE_KEYS.CUSTOMERS);
  localStorage.removeItem(CACHE_KEYS.ITEMS);
  localStorage.removeItem(CACHE_KEYS.QUOTES);
  
  // Dispatch refresh events for all data types
  dispatchDataRefresh('customers-changed');
  dispatchDataRefresh('items-changed');
  dispatchDataRefresh('quotes-changed');
}
