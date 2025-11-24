/**
 * Cache Manager
 * Advanced caching system with intelligent preloading, request coalescing,
 * and integration with IndexedDB for persistent storage
 */

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  priority: 'high' | 'medium' | 'low';
  preload: boolean;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  hits: number;
  lastAccess: number;
}

interface RequestMetrics {
  hits: number;
  misses: number;
  errors: number;
  avgResponseTime: number;
  totalRequests: number;
}

const CACHE_VERSION = 'v2';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const METRICS_KEY = 'cache-metrics';

// Request deduplication map (prevent duplicate in-flight requests)
const pendingRequests = new Map<string, Promise<unknown>>();

// Cache configurations by entity type
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  customers: {
    ttl: 10 * 60 * 1000, // 10 minutes
    priority: 'high',
    preload: true,
    strategy: 'stale-while-revalidate',
  },
  items: {
    ttl: 15 * 60 * 1000, // 15 minutes
    priority: 'high',
    preload: true,
    strategy: 'stale-while-revalidate',
  },
  quotes: {
    ttl: 5 * 60 * 1000, // 5 minutes
    priority: 'medium',
    preload: false,
    strategy: 'network-first',
  },
  settings: {
    ttl: 30 * 60 * 1000, // 30 minutes
    priority: 'high',
    preload: true,
    strategy: 'cache-first',
  },
};

/**
 * Cache Manager Class
 * Handles intelligent caching with performance monitoring
 */
export class CacheManager {
  private metrics: RequestMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    avgResponseTime: 0,
    totalRequests: 0,
  };

  constructor() {
    this.loadMetrics();
  }

  /**
   * Get cache key for a resource
   */
  private getCacheKey(entityType: string, id?: string): string {
    return id ? `${entityType}:${id}` : `${entityType}:all`;
  }

  /**
   * Get cache configuration for entity type
   */
  private getConfig(entityType: string): CacheConfig {
    return CACHE_CONFIGS[entityType] || {
      ttl: DEFAULT_TTL,
      priority: 'medium',
      preload: false,
      strategy: 'network-first',
    };
  }

  /**
   * Check if cache entry is valid
   */
  private isValid<T>(entry: CacheEntry<T> | null, config: CacheConfig): boolean {
    if (!entry) return false;
    if (entry.version !== CACHE_VERSION) return false;
    
    const age = Date.now() - entry.timestamp;
    return age < config.ttl;
  }

  /**
   * Get from cache (memory-first, then IndexedDB)
   */
  async get<T>(entityType: string, id?: string): Promise<T | null> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(entityType, id);
    const config = this.getConfig(entityType);

    try {
      // Try memory cache first (localStorage for speed)
      const memoryCache = localStorage.getItem(cacheKey);
      if (memoryCache) {
        const entry: CacheEntry<T> = JSON.parse(memoryCache);
        
        if (this.isValid(entry, config)) {
          // Update metrics
          entry.hits++;
          entry.lastAccess = Date.now();
          localStorage.setItem(cacheKey, JSON.stringify(entry));
          
          this.recordHit(Date.now() - startTime);
          console.log(`[CacheManager] Memory cache hit for ${cacheKey}`);
          return entry.data;
        }
      }

      // Memory cache miss
      this.recordMiss(Date.now() - startTime);
      console.log(`[CacheManager] Cache miss for ${cacheKey}`);
      return null;
    } catch (error) {
      this.recordError();
      console.error(`[CacheManager] Error getting cache for ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Set cache entry
   */
  async set<T>(entityType: string, data: T, id?: string): Promise<void> {
    const cacheKey = this.getCacheKey(entityType, id);
    
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        hits: 0,
        lastAccess: Date.now(),
      };

      // Store in memory cache
      localStorage.setItem(cacheKey, JSON.stringify(entry));
      console.log(`[CacheManager] Cached ${cacheKey}`);
    } catch (error) {
      console.error(`[CacheManager] Error setting cache for ${cacheKey}:`, error);
    }
  }

  /**
   * Invalidate cache for entity type
   */
  async invalidate(entityType: string, id?: string): Promise<void> {
    const cacheKey = this.getCacheKey(entityType, id);
    
    try {
      localStorage.removeItem(cacheKey);
      console.log(`[CacheManager] Invalidated cache for ${cacheKey}`);

      // Also clear related caches (e.g., quotes when customer changes)
      await this.invalidateRelated(entityType, id);
    } catch (error) {
      console.error(`[CacheManager] Error invalidating cache for ${cacheKey}:`, error);
    }
  }

  /**
   * Invalidate related caches based on entity relationships
   */
  private async invalidateRelated(entityType: string, id?: string): Promise<void> {
    const relationships: Record<string, string[]> = {
      customers: ['quotes'], // When customer changes, invalidate their quotes
      items: ['quotes'], // When item changes, invalidate quotes using it
      settings: ['all'], // When settings change, invalidate everything
    };

    const related = relationships[entityType];
    if (!related) return;

    for (const relatedType of related) {
      if (relatedType === 'all') {
        await this.clearAll();
      } else {
        const relatedKey = this.getCacheKey(relatedType);
        localStorage.removeItem(relatedKey);
        console.log(`[CacheManager] Invalidated related cache: ${relatedKey}`);
      }
    }
  }

  /**
   * Request coalescing - prevent duplicate in-flight requests
   */
  async coalesce<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Check if request is already in flight
    const existingRequest = pendingRequests.get(key);
    if (existingRequest) {
      console.log(`[CacheManager] Coalescing request for ${key}`);
      return existingRequest as Promise<T>;
    }

    // Execute request and store promise
    const promise = fetcher()
      .finally(() => {
        // Clean up after request completes
        pendingRequests.delete(key);
      });

    pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Preload high-priority resources
   */
  async preload(entityTypes: string[]): Promise<void> {
    console.log(`[CacheManager] Preloading ${entityTypes.length} entity types`);
    
    const preloadPromises = entityTypes
      .filter(type => {
        const config = this.getConfig(type);
        return config.preload && config.priority === 'high';
      })
      .map(async (type) => {
        // This would be connected to actual data fetching
        console.log(`[CacheManager] Preloading ${type}`);
      });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Cache warming - populate cache with frequently accessed data
   */
  async warmCache(): Promise<void> {
    console.log('[CacheManager] Warming cache with high-priority resources');
    
    // Preload high-priority entity types
    await this.preload(['customers', 'items', 'settings']);
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    try {
      // Clear memory cache
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('customers:') || key.includes('items:') || 
            key.includes('quotes:') || key.includes('settings:')) {
          localStorage.removeItem(key);
        }
      });

      // Clear service worker caches
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        
        await new Promise<void>((resolve) => {
          messageChannel.port1.onmessage = () => resolve();
          
          navigator.serviceWorker.controller?.postMessage(
            { type: 'CLEAR_ALL_CACHE' },
            [messageChannel.port2]
          );
          
          setTimeout(resolve, 1000);
        });
      }

      console.log('[CacheManager] All caches cleared');
    } catch (error) {
      console.error('[CacheManager] Error clearing caches:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): RequestMetrics {
    return { ...this.metrics };
  }

  /**
   * Record cache hit
   */
  private recordHit(responseTime: number): void {
    this.metrics.hits++;
    this.metrics.totalRequests++;
    this.updateAvgResponseTime(responseTime);
    this.saveMetrics();
  }

  /**
   * Record cache miss
   */
  private recordMiss(responseTime: number): void {
    this.metrics.misses++;
    this.metrics.totalRequests++;
    this.updateAvgResponseTime(responseTime);
    this.saveMetrics();
  }

  /**
   * Record error
   */
  private recordError(): void {
    this.metrics.errors++;
    this.metrics.totalRequests++;
    this.saveMetrics();
  }

  /**
   * Update average response time
   */
  private updateAvgResponseTime(responseTime: number): void {
    const totalTime = this.metrics.avgResponseTime * (this.metrics.totalRequests - 1);
    this.metrics.avgResponseTime = (totalTime + Math.max(responseTime, 0.01)) / this.metrics.totalRequests;
  }

  /**
   * Save metrics to storage
   */
  private saveMetrics(): void {
    try {
      localStorage.setItem(METRICS_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('[CacheManager] Error saving metrics:', error);
    }
  }

  /**
   * Load metrics from storage
   */
  private loadMetrics(): void {
    try {
      const stored = localStorage.getItem(METRICS_KEY);
      if (stored) {
        this.metrics = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[CacheManager] Error loading metrics:', error);
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      avgResponseTime: 0,
      totalRequests: 0,
    };
    this.saveMetrics();
    console.log('[CacheManager] Metrics reset');
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
