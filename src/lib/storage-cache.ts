/**
 * Storage Cache Layer - Memoization and optimization for localStorage access
 * Reduces synchronous localStorage reads and implements efficient caching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class StorageCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private pendingWrites: Map<string, NodeJS.Timeout>;
  private readonly DEBOUNCE_DELAY = 500; // 500ms debounce for writes
  private readonly DEFAULT_TTL = 60000; // 1 minute default cache TTL

  constructor() {
    this.cache = new Map();
    this.pendingWrites = new Map();
    
    // Clear expired cache entries every 5 minutes
    setInterval(() => this.clearExpiredEntries(), 300000);
  }

  /**
   * Gets data from cache or localStorage with memoization
   * @param key - Storage key
   * @param parser - Optional parser function for the stored value
   * @param ttl - Time to live for cache entry in milliseconds
   */
  get<T>(key: string, parser?: (value: string) => T, ttl: number = this.DEFAULT_TTL): T | null {
    // Check cache first
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Cache miss - read from localStorage
    try {
      const value = localStorage.getItem(key);
      if (value === null) {
        return null;
      }

      const parsed = parser ? parser(value) : JSON.parse(value) as T;
      
      // Store in cache
      this.cache.set(key, {
        data: parsed,
        timestamp: Date.now(),
        ttl,
      });

      return parsed;
    } catch (error) {
      console.error(`Failed to read from localStorage [${key}]:`, error);
      return null;
    }
  }

  /**
   * Sets data to localStorage with debouncing and quota error handling
   * @param key - Storage key
   * @param value - Value to store
   * @param immediate - If true, bypass debouncing
   */
  set<T>(key: string, value: T, immediate: boolean = false): void {
    // Update cache immediately
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL,
    });

    // Clear any pending write for this key
    const pending = this.pendingWrites.get(key);
    if (pending) {
      clearTimeout(pending);
    }

    const writeToStorage = () => {
      try {
        const serialized = typeof value === "string" ? value : JSON.stringify(value);
        localStorage.setItem(key, serialized);
        this.pendingWrites.delete(key);
      } catch (error) {
        if (error instanceof Error && error.name === "QuotaExceededError") {
          console.error("localStorage quota exceeded. Attempting cleanup...");
          this.handleQuotaExceeded(key, value);
        } else {
          console.error(`Failed to write to localStorage [${key}]:`, error);
        }
      }
    };

    if (immediate) {
      writeToStorage();
    } else {
      // Debounce the write
      const timeout = setTimeout(writeToStorage, this.DEBOUNCE_DELAY);
      this.pendingWrites.set(key, timeout);
    }
  }

  /**
   * Removes data from cache and localStorage
   */
  remove(key: string): void {
    this.cache.delete(key);
    
    const pending = this.pendingWrites.get(key);
    if (pending) {
      clearTimeout(pending);
      this.pendingWrites.delete(key);
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove from localStorage [${key}]:`, error);
    }
  }

  /**
   * Clears all cache entries (not localStorage itself)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidates a specific cache entry, forcing next read from localStorage
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Flushes all pending writes immediately
   */
  flush(): void {
    this.pendingWrites.forEach((timeout, key) => {
      clearTimeout(timeout);
      const cached = this.cache.get(key);
      if (cached) {
        try {
          const serialized = typeof cached.data === "string" 
            ? cached.data 
            : JSON.stringify(cached.data);
          localStorage.setItem(key, serialized);
        } catch (error) {
          console.error(`Failed to flush write [${key}]:`, error);
        }
      }
    });
    this.pendingWrites.clear();
  }

  /**
   * Gets current cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingWrites: this.pendingWrites.size,
      cacheKeys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Handles QuotaExceededError by removing old/large entries
   */
  private handleQuotaExceeded<T>(key: string, value: T): void {
    console.warn("Attempting to free up localStorage space...");
    
    // Strategy 1: Remove expired cache entries from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.includes("-cache")) {
        keysToRemove.push(storageKey);
      }
    }

    // Remove oldest cache entries first
    keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2)).forEach(k => {
      localStorage.removeItem(k);
      this.cache.delete(k);
    });

    // Strategy 2: Try to write again
    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      console.log("Successfully wrote after cleanup");
    } catch (retryError) {
      console.error("Failed to write even after cleanup. localStorage is critically full.");
      
      // Last resort: Show user warning
      if (typeof window !== "undefined") {
        console.warn(
          "Storage limit reached. Some features may not work correctly. " +
          "Consider clearing browser data or exporting your data."
        );
      }
    }
  }

  /**
   * Removes expired cache entries
   */
  private clearExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cleared ${keysToDelete.length} expired cache entries`);
    }
  }
}

// Export singleton instance
export const storageCache = new StorageCache();

// Flush pending writes before page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    storageCache.flush();
  });
}
