import { Customer, Item, Quote } from '@/types';

// Local database keys with versioning
const STORAGE_KEYS = {
  CUSTOMERS: 'customers-local-v1',
  ITEMS: 'items-local-v1',
  QUOTES: 'quotes-local-v1',
  SYNC_STATUS: 'sync-status-v1',
} as const;

export interface SyncStatus {
  id: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  lastAttempt?: string;
  error?: string;
}

// Generic local storage operations
function getLocalData<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return [];
  }
}

function setLocalData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

// Customer operations
export function getLocalCustomers(): Customer[] {
  return getLocalData<Customer>(STORAGE_KEYS.CUSTOMERS);
}

export function addLocalCustomer(customer: Customer): Customer {
  const customers = getLocalCustomers();
  const exists = customers.find(c => c.id === customer.id);
  
  if (!exists) {
    customers.push(customer);
    setLocalData(STORAGE_KEYS.CUSTOMERS, customers);
    setSyncStatus(customer.id, 'pending');
  }
  
  return customer;
}

export function updateLocalCustomer(id: string, updates: Partial<Customer>): Customer | null {
  const customers = getLocalCustomers();
  const index = customers.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  const updated = { ...customers[index], ...updates };
  customers[index] = updated;
  setLocalData(STORAGE_KEYS.CUSTOMERS, customers);
  setSyncStatus(id, 'pending');
  
  return updated;
}

export function deleteLocalCustomer(id: string): boolean {
  const customers = getLocalCustomers();
  const filtered = customers.filter(c => c.id !== id);
  
  if (filtered.length === customers.length) return false;
  
  setLocalData(STORAGE_KEYS.CUSTOMERS, filtered);
  setSyncStatus(id, 'pending');
  
  return true;
}

// Item operations
export function getLocalItems(): Item[] {
  return getLocalData<Item>(STORAGE_KEYS.ITEMS);
}

export function addLocalItem(item: Item): Item {
  const items = getLocalItems();
  const exists = items.find(i => i.id === item.id);
  
  if (!exists) {
    items.push(item);
    setLocalData(STORAGE_KEYS.ITEMS, items);
    setSyncStatus(item.id, 'pending');
  }
  
  return item;
}

export function updateLocalItem(id: string, updates: Partial<Item>): Item | null {
  const items = getLocalItems();
  const index = items.findIndex(i => i.id === id);
  
  if (index === -1) return null;
  
  const updated = { ...items[index], ...updates };
  items[index] = updated;
  setLocalData(STORAGE_KEYS.ITEMS, items);
  setSyncStatus(id, 'pending');
  
  return updated;
}

export function deleteLocalItem(id: string): boolean {
  const items = getLocalItems();
  const filtered = items.filter(i => i.id !== id);
  
  if (filtered.length === items.length) return false;
  
  setLocalData(STORAGE_KEYS.ITEMS, filtered);
  setSyncStatus(id, 'pending');
  
  return true;
}

// Quote operations
export function getLocalQuotes(): Quote[] {
  return getLocalData<Quote>(STORAGE_KEYS.QUOTES);
}

export function addLocalQuote(quote: Quote): Quote {
  const quotes = getLocalQuotes();
  const exists = quotes.find(q => q.id === quote.id);
  
  if (!exists) {
    quotes.push(quote);
    setLocalData(STORAGE_KEYS.QUOTES, quotes);
    setSyncStatus(quote.id, 'pending');
  }
  
  return quote;
}

export function updateLocalQuote(id: string, updates: Partial<Quote>): Quote | null {
  const quotes = getLocalQuotes();
  const index = quotes.findIndex(q => q.id === id);
  
  if (index === -1) return null;
  
  const updated = { ...quotes[index], ...updates };
  quotes[index] = updated;
  setLocalData(STORAGE_KEYS.QUOTES, quotes);
  setSyncStatus(id, 'pending');
  
  return updated;
}

export function deleteLocalQuote(id: string): boolean {
  const quotes = getLocalQuotes();
  const filtered = quotes.filter(q => q.id !== id);
  
  if (filtered.length === quotes.length) return false;
  
  setLocalData(STORAGE_KEYS.QUOTES, filtered);
  setSyncStatus(id, 'pending');
  
  return true;
}

// Sync status operations
export function getSyncStatus(id: string): SyncStatus | null {
  const statuses = getLocalData<SyncStatus>(STORAGE_KEYS.SYNC_STATUS);
  return statuses.find(s => s.id === id) || null;
}

export function setSyncStatus(id: string, status: SyncStatus['status'], error?: string): void {
  const statuses = getLocalData<SyncStatus>(STORAGE_KEYS.SYNC_STATUS);
  const index = statuses.findIndex(s => s.id === id);
  
  const statusObj: SyncStatus = {
    id,
    status,
    lastAttempt: new Date().toISOString(),
    error,
  };
  
  if (index === -1) {
    statuses.push(statusObj);
  } else {
    statuses[index] = statusObj;
  }
  
  setLocalData(STORAGE_KEYS.SYNC_STATUS, statuses);
}

export function clearSyncStatus(id: string): void {
  const statuses = getLocalData<SyncStatus>(STORAGE_KEYS.SYNC_STATUS);
  const filtered = statuses.filter(s => s.id !== id);
  setLocalData(STORAGE_KEYS.SYNC_STATUS, filtered);
}

export function getAllPendingSyncIds(): string[] {
  const statuses = getLocalData<SyncStatus>(STORAGE_KEYS.SYNC_STATUS);
  return statuses.filter(s => s.status === 'pending').map(s => s.id);
}

// Merge remote data with local data (for initial load)
export function mergeWithRemote<T extends { id: string }>(
  remoteData: T[],
  localData: T[],
  storageKey: string
): T[] {
  const merged = new Map<string, T>();
  
  // Add all remote data first
  remoteData.forEach(item => merged.set(item.id, item));
  
  // Override with pending local changes
  const pendingIds = getAllPendingSyncIds();
  localData.forEach(item => {
    if (pendingIds.includes(item.id)) {
      merged.set(item.id, item);
    }
  });
  
  const result = Array.from(merged.values());
  setLocalData(storageKey, result);
  
  return result;
}
