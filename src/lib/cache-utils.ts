
/**
 * Cache Management Utilities
 * 
 * Provides functions for monitoring, managing, and debugging
 * browser caches (both Cache API and IndexedDB).
 * 
 * @module cache-utils
 */

import { CACHE_NAMES } from "./cache-strategies";

/**
 * Cache quota information
 */
export interface CacheQuota {
  usage: number;
  quota: number;
  percentage: number;
  usageMB: number;
  quotaMB: number;
}

/**
 * Individual cache details
 */
export interface CacheDetails {
  name: string;
  size: number;
  count: number;
  sizeMB: number;
}

/**
 * Get current cache storage quota and usage
 */
export async function getCacheQuota(): Promise<CacheQuota> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    
    return {
      usage,
      quota,
      percentage: quota ? Math.round((usage / quota) * 100) : 0,
      usageMB: Number((usage / 1024 / 1024).toFixed(2)),
      quotaMB: Number((quota / 1024 / 1024).toFixed(2)),
    };
  }
  
  return {
    usage: 0,
    quota: 0,
    percentage: 0,
    usageMB: 0,
    quotaMB: 0,
  };
}

/**
 * Get detailed information about all caches
 */
export async function getCacheDetails(): Promise<CacheDetails[]> {
  try {
    const cacheNames = await caches.keys();
    
    const details = await Promise.all(
      cacheNames.map(async (name) => {
        try {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          
          // Calculate approximate size
          let totalSize = 0;
          for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
            }
          }
          
          return {
            name,
            size: totalSize,
            count: keys.length,
            sizeMB: Number((totalSize / 1024 / 1024).toFixed(2)),
          };
        } catch (error) {
          console.error(`[CacheUtils] Error analyzing cache ${name}:`, error);
          return {
            name,
            size: 0,
            count: 0,
            sizeMB: 0,
          };
        }
      })
    );
    
    return details.sort((a, b) => b.size - a.size);
  } catch (error) {
    console.error("[CacheUtils] Error getting cache details:", error);
    return [];
  }
}

/**
 * Clear all caches (useful for debugging and cleanup)
 */
export async function clearAllCaches(): Promise<void> {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        console.log(`[CacheUtils] Deleting cache: ${cacheName}`);
        return caches.delete(cacheName);
      })
    );
    console.log("[CacheUtils] All caches cleared successfully");
  } catch (error) {
    console.error("[CacheUtils] Error clearing caches:", error);
    throw error;
  }
}

/**
 * Clear specific cache by name
 */
export async function clearCache(cacheName: string): Promise<boolean> {
  try {
    const deleted = await caches.delete(cacheName);
    console.log(`[CacheUtils] Cache ${cacheName} ${deleted ? "deleted" : "not found"}`);
    return deleted;
  } catch (error) {
    console.error(`[CacheUtils] Error deleting cache ${cacheName}:`, error);
    return false;
  }
}

/**
 * Clear old cache versions (cleanup after service worker update)
 */
export async function clearOldCaches(): Promise<number> {
  try {
    const cacheNames = await caches.keys();
    const currentCaches = Object.values(CACHE_NAMES);
    const oldCaches = cacheNames.filter(
      (name) => !currentCaches.includes(name)
    );
    
    await Promise.all(
      oldCaches.map((cacheName) => {
        console.log(`[CacheUtils] Deleting old cache: ${cacheName}`);
        return caches.delete(cacheName);
      })
    );
    
    console.log(`[CacheUtils] Cleared ${oldCaches.length} old caches`);
    return oldCaches.length;
  } catch (error) {
    console.error("[CacheUtils] Error clearing old caches:", error);
    return 0;
  }
}

/**
 * Get cache statistics summary
 */
export async function getCacheStats(): Promise<{
  totalCaches: number;
  totalSize: number;
  totalSizeMB: number;
  totalEntries: number;
  quota: CacheQuota;
}> {
  const [details, quota] = await Promise.all([
    getCacheDetails(),
    getCacheQuota(),
  ]);
  
  const totalSize = details.reduce((sum, cache) => sum + cache.size, 0);
  const totalEntries = details.reduce((sum, cache) => sum + cache.count, 0);
  
  return {
    totalCaches: details.length,
    totalSize,
    totalSizeMB: Number((totalSize / 1024 / 1024).toFixed(2)),
    totalEntries,
    quota,
  };
}

/**
 * Check if a specific cache exists
 */
export async function cacheExists(cacheName: string): Promise<boolean> {
  try {
    const cacheNames = await caches.keys();
    return cacheNames.includes(cacheName);
  } catch (error) {
    console.error(`[CacheUtils] Error checking cache ${cacheName}:`, error);
    return false;
  }
}

/**
 * Warm up cache with critical URLs
 */
export async function warmUpCache(
  cacheName: string,
  urls: string[]
): Promise<number> {
  try {
    const cache = await caches.open(cacheName);
    let successCount = 0;
    
    await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            successCount++;
          }
        } catch (error) {
          console.warn(`[CacheUtils] Failed to cache ${url}:`, error);
        }
      })
    );
    
    console.log(
      `[CacheUtils] Warmed up ${successCount}/${urls.length} URLs in ${cacheName}`
    );
    return successCount;
  } catch (error) {
    console.error(`[CacheUtils] Error warming up cache ${cacheName}:`, error);
    return 0;
  }
}

/**
 * Export cache data for debugging
 */
export async function exportCacheData(): Promise<{
  timestamp: string;
  quota: CacheQuota;
  caches: CacheDetails[];
  stats: Awaited<ReturnType<typeof getCacheStats>>;
}> {
  const [quota, caches, stats] = await Promise.all([
    getCacheQuota(),
    getCacheDetails(),
    getCacheStats(),
  ]);
  
  return {
    timestamp: new Date().toISOString(),
    quota,
    caches,
    stats,
  };
}
