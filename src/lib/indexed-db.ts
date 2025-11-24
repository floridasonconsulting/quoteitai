/**
 * IndexedDB Wrapper
 * Provides async database operations with proper schema versioning,
 * transactions, and error handling for Quote.it AI
 * 
 * Database: quote-it-db
 * Version: 1
 * Object Stores: customers, items, quotes, company_settings, sync_queue
 */

import { Customer, Item, Quote, CompanySettings } from "@/types";

/**
 * Check if IndexedDB is supported in the current browser
 */
export function isIndexedDBSupported(): boolean {
  try {
    return "indexedDB" in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

// Database configuration
const DB_NAME = "quote-it-db";
const DB_VERSION = 1;

// Object store names
export const STORES = {
  CUSTOMERS: "customers",
  ITEMS: "items",
  QUOTES: "quotes",
  SETTINGS: "company_settings",
  SYNC_QUEUE: "sync_queue",
} as const;

// Sync queue entry type
export interface SyncQueueEntry {
  id: string;
  type: "create" | "update" | "delete";
  table: keyof typeof STORES;
  data: unknown;
  timestamp: number;
  status: "pending" | "syncing" | "synced" | "failed";
  error?: string;
  retryCount: number;
}

// Database instance (singleton)
let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB with schema
 * Creates object stores and indexes on first run or version upgrade
 */
function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    // Check for IndexedDB support
    if (!isIndexedDBSupported()) {
      console.error("[IndexedDB] Not supported in this browser");
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("[IndexedDB] Failed to open database:", request.error);
      dbPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log("[IndexedDB] Database opened successfully");

      // Handle unexpected close
      dbInstance.onclose = () => {
        console.warn("[IndexedDB] Database connection closed unexpectedly");
        dbInstance = null;
        dbPromise = null;
      };

      // Handle version change (another tab upgraded the database)
      dbInstance.onversionchange = () => {
        console.warn("[IndexedDB] Database version changed, closing connection");
        dbInstance?.close();
        dbInstance = null;
        dbPromise = null;
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log("[IndexedDB] Upgrading database schema to version", DB_VERSION);

      // Create Customers store
      if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
        const customerStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: "id" });
        customerStore.createIndex("user_id", "user_id", { unique: false });
        customerStore.createIndex("created_at", "createdAt", { unique: false });
        customerStore.createIndex("name", "name", { unique: false });
        console.log("[IndexedDB] Created customers store");
      }

      // Create Items store
      if (!db.objectStoreNames.contains(STORES.ITEMS)) {
        const itemStore = db.createObjectStore(STORES.ITEMS, { keyPath: "id" });
        itemStore.createIndex("user_id", "user_id", { unique: false });
        itemStore.createIndex("category", "category", { unique: false });
        itemStore.createIndex("created_at", "createdAt", { unique: false });
        console.log("[IndexedDB] Created items store");
      }

      // Create Quotes store
      if (!db.objectStoreNames.contains(STORES.QUOTES)) {
        const quoteStore = db.createObjectStore(STORES.QUOTES, { keyPath: "id" });
        quoteStore.createIndex("user_id", "user_id", { unique: false });
        quoteStore.createIndex("customer_id", "customerId", { unique: false });
        quoteStore.createIndex("status", "status", { unique: false });
        quoteStore.createIndex("created_at", "createdAt", { unique: false });
        quoteStore.createIndex("quote_number", "quoteNumber", { unique: true });
        console.log("[IndexedDB] Created quotes store");
      }

      // Create Company Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: "user_id" });
        console.log("[IndexedDB] Created company_settings store");
      }

      // Create Sync Queue store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: "id" });
        syncStore.createIndex("status", "status", { unique: false });
        syncStore.createIndex("timestamp", "timestamp", { unique: false });
        syncStore.createIndex("table", "table", { unique: false });
        console.log("[IndexedDB] Created sync_queue store");
      }
    };
  });

  return dbPromise;
}

/**
 * Execute a transaction with proper error handling
 * @param storeNames - Store names to access
 * @param mode - Transaction mode (readonly or readwrite)
 * @param callback - Transaction operations
 */
async function executeTransaction<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  callback: (tx: IDBTransaction) => Promise<T>
): Promise<T> {
  const db = await initDB();
  const tx = db.transaction(storeNames, mode);

  return new Promise((resolve, reject) => {
    tx.onerror = () => {
      console.error("[IndexedDB] Transaction error:", tx.error);
      reject(tx.error);
    };

    tx.onabort = () => {
      console.error("[IndexedDB] Transaction aborted");
      reject(new Error("Transaction aborted"));
    };

    callback(tx)
      .then(resolve)
      .catch(reject);
  });
}

/**
 * Get all records from a store for a specific user
 */
export async function getAll<T>(
  storeName: string,
  userId: string
): Promise<T[]> {
  return executeTransaction(storeName, "readonly", async (tx) => {
    const store = tx.objectStore(storeName);
    const index = store.index("user_id");
    const request = index.getAll(userId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  });
}

/**
 * Get a single record by ID
 */
export async function getById<T>(
  storeName: string,
  id: string
): Promise<T | null> {
  return executeTransaction(storeName, "readonly", async (tx) => {
    const store = tx.objectStore(storeName);
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        // CRITICAL: Return null instead of undefined when not found
        const result = request.result;
        resolve(result !== undefined ? (result as T) : null);
      };
      request.onerror = () => reject(request.error);
    });
  });
}

/**
 * Add a new record
 */
export async function add<T extends { id: string; userId?: string }>(
  storeName: string,
  record: T
): Promise<T> {
  return executeTransaction(storeName, "readwrite", async (tx) => {
    const store = tx.objectStore(storeName);
    
    // Transform userId (camelCase) to user_id (snake_case) for IndexedDB index
    const dbRecord = {
      ...record,
      user_id: record.userId,
    };
    
    const request = store.add(dbRecord);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`[IndexedDB] Added record to ${storeName}:`, record.id);
        resolve(record);
      };
      request.onerror = () => {
        console.error(`[IndexedDB] Failed to add to ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Update an existing record
 */
export async function update<T extends { id: string; userId?: string }>(
  storeName: string,
  record: T
): Promise<T> {
  return executeTransaction(storeName, "readwrite", async (tx) => {
    const store = tx.objectStore(storeName);
    
    // Transform userId (camelCase) to user_id (snake_case) for IndexedDB index
    const dbRecord = {
      ...record,
      user_id: record.userId,
    };
    
    const request = store.put(dbRecord);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`[IndexedDB] Updated record in ${storeName}:`, record.id);
        resolve(record);
      };
      request.onerror = () => {
        console.error(`[IndexedDB] Failed to update in ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Delete a record by ID
 */
export async function deleteById(
  storeName: string,
  id: string
): Promise<void> {
  return executeTransaction(storeName, "readwrite", async (tx) => {
    const store = tx.objectStore(storeName);
    const request = store.delete(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`[IndexedDB] Deleted record from ${storeName}:`, id);
        resolve();
      };
      request.onerror = () => {
        console.error(`[IndexedDB] Failed to delete from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Clear all records from a store for a specific user
 */
export async function clearUserData(
  storeName: string,
  userId: string
): Promise<void> {
  const records = await getAll<{ id: string }>(storeName, userId);
  
  return executeTransaction(storeName, "readwrite", async (tx) => {
    const store = tx.objectStore(storeName);
    const promises = records.map(record => {
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(record.id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`[IndexedDB] Cleared all user data from ${storeName}`);
  });
}

/**
 * Get database storage usage statistics
 */
export async function getStorageStats(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return { usage, quota, percentage };
    } catch (error) {
      console.error("[IndexedDB] Failed to estimate storage:", error);
    }
  }

  return { usage: 0, quota: 0, percentage: 0 };
}

/**
 * Get record counts for a specific user across all stores
 */
export async function getRecordCounts(userId: string): Promise<{
  customers: { count: number };
  items: { count: number };
  quotes: { count: number };
}> {
  try {
    const [customers, items, quotes] = await Promise.all([
      getAll<Customer>(STORES.CUSTOMERS, userId),
      getAll<Item>(STORES.ITEMS, userId),
      getAll<Quote>(STORES.QUOTES, userId),
    ]);

    return {
      customers: { count: customers.length },
      items: { count: items.length },
      quotes: { count: quotes.length },
    };
  } catch (error) {
    console.error("[IndexedDB] Failed to get record counts:", error);
    return {
      customers: { count: 0 },
      items: { count: 0 },
      quotes: { count: 0 },
    };
  }
}

/**
 * Close the database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    dbPromise = null;
    console.log("[IndexedDB] Database connection closed");
  }
}

/**
 * Delete the entire database (for testing/debugging)
 */
export async function deleteDatabase(): Promise<void> {
  closeDB();
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = () => {
      console.log("[IndexedDB] Database deleted successfully");
      resolve();
    };
    
    request.onerror = () => {
      console.error("[IndexedDB] Failed to delete database:", request.error);
      reject(request.error);
    };
    
    request.onblocked = () => {
      console.warn("[IndexedDB] Database deletion blocked - close all tabs");
    };
  });
}

// Export specialized CRUD operations for each entity type

/**
 * Customer operations
 */
export const CustomerDB = {
  getAll: (userId: string) => getAll<Customer>(STORES.CUSTOMERS, userId),
  getById: (id: string) => getById<Customer>(STORES.CUSTOMERS, id),
  add: (customer: Customer) => add(STORES.CUSTOMERS, customer),
  update: (customer: Customer) => update(STORES.CUSTOMERS, customer),
  delete: (id: string) => deleteById(STORES.CUSTOMERS, id),
  clear: (userId: string) => clearUserData(STORES.CUSTOMERS, userId),
};

/**
 * Item operations
 */
export const ItemDB = {
  getAll: (userId: string) => getAll<Item>(STORES.ITEMS, userId),
  getById: (id: string) => getById<Item>(STORES.ITEMS, id),
  add: (item: Item) => add(STORES.ITEMS, item),
  update: (item: Item) => update(STORES.ITEMS, item),
  delete: (id: string) => deleteById(STORES.ITEMS, id),
  clear: (userId: string) => clearUserData(STORES.ITEMS, userId),
};

/**
 * Quote operations
 */
export const QuoteDB = {
  getAll: (userId: string) => getAll<Quote>(STORES.QUOTES, userId),
  getById: (id: string) => getById<Quote>(STORES.QUOTES, id),
  add: (quote: Quote) => add(STORES.QUOTES, quote),
  update: (quote: Quote) => update(STORES.QUOTES, quote),
  delete: (id: string) => deleteById(STORES.QUOTES, id),
  clear: (userId: string) => clearUserData(STORES.QUOTES, userId),
};

/**
 * Company Settings operations
 */
export const SettingsDB = {
  get: (userId: string) => getById<CompanySettings>(STORES.SETTINGS, userId),
  set: (userId: string, settings: CompanySettings) => 
    update(STORES.SETTINGS, { ...settings, user_id: userId } as never),
};

/**
 * Sync Queue operations
 */
export const SyncQueueDB = {
  getAll: async () => {
    const db = await initDB();
    const tx = db.transaction(STORES.SYNC_QUEUE, "readonly");
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const request = store.getAll();

    return new Promise<SyncQueueEntry[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  add: (entry: SyncQueueEntry) => add(STORES.SYNC_QUEUE, entry),
  update: (entry: SyncQueueEntry) => update(STORES.SYNC_QUEUE, entry),
  delete: (id: string) => deleteById(STORES.SYNC_QUEUE, id),
  clear: async () => {
    const db = await initDB();
    const tx = db.transaction(STORES.SYNC_QUEUE, "readwrite");
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    store.clear();
    console.log("[IndexedDB] Cleared sync queue");
  },
};
