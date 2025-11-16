
/**
 * Cache Service
 * Handles localStorage caching with versioning and expiration
 */

const CACHE_VERSION = 'v1';
export const CACHE_KEYS = {
  CUSTOMERS: 'customers-cache',
  ITEMS: 'items-cache',
  QUOTES: 'quotes-cache',
} as const;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  version: string;
}

/**
 * Get cached data from localStorage with version and expiration checks
 */
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

/**
 * Set cached data in localStorage with timestamp and version
 */
export function setCachedData<T>(key: string, data: T[]): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  };
  localStorage.setItem(key, JSON.stringify(entry));
}

/**
 * Clear all caches (coordinated clear of localStorage + service worker)
 */
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

/**
 * Clear specific cache key
 */
export function clearCache(key: string): void {
  localStorage.removeItem(key);
  console.log(`[Cache] Cleared ${key}`);
}
