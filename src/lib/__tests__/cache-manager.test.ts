import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheManager, cacheManager } from '../cache-manager';

describe('CacheManager', () => {
  let manager: CacheManager;

  beforeEach(() => {
    localStorage.clear();
    manager = new CacheManager();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('get/set operations', () => {
    it('should cache and retrieve data', async () => {
      const testData = { id: '1', name: 'Test Customer' };
      
      await manager.set('customers', testData, '1');
      const cached = await manager.get('customers', '1');
      
      expect(cached).toEqual(testData);
    });

    it('should return null for cache miss', async () => {
      const cached = await manager.get('customers', 'nonexistent');
      expect(cached).toBeNull();
    });

    it('should respect TTL expiration', async () => {
      const testData = { id: '1', name: 'Test' };
      
      // Mock Date.now() to control time
      const originalNow = Date.now;
      let currentTime = Date.now();
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      await manager.set('quotes', testData, '1');
      
      // Advance time past TTL (5 minutes for quotes)
      currentTime += 6 * 60 * 1000;
      
      const cached = await manager.get('quotes', '1');
      expect(cached).toBeNull();
      
      // Restore
      Date.now = originalNow;
    });

    it('should cache all entities without ID', async () => {
      const testData = [
        { id: '1', name: 'Customer 1' },
        { id: '2', name: 'Customer 2' }
      ];
      
      await manager.set('customers', testData);
      const cached = await manager.get('customers');
      
      expect(cached).toEqual(testData);
    });
  });

  describe('invalidation', () => {
    it('should invalidate specific cache entry', async () => {
      const testData = { id: '1', name: 'Test' };
      
      await manager.set('customers', testData, '1');
      await manager.invalidate('customers', '1');
      
      const cached = await manager.get('customers', '1');
      expect(cached).toBeNull();
    });

    it('should invalidate related caches', async () => {
      const customer = { id: '1', name: 'Test Customer' };
      const quotes = [{ id: 'q1', customer_id: '1' }];
      
      await manager.set('customers', customer, '1');
      await manager.set('quotes', quotes);
      
      // Invalidating customer should invalidate quotes
      await manager.invalidate('customers', '1');
      
      const cachedQuotes = await manager.get('quotes');
      expect(cachedQuotes).toBeNull();
    });

    it('should clear all caches', async () => {
      await manager.set('customers', { id: '1' }, '1');
      await manager.set('items', { id: '1' }, '1');
      await manager.set('quotes', { id: '1' }, '1');
      
      await manager.clearAll();
      
      expect(await manager.get('customers', '1')).toBeNull();
      expect(await manager.get('items', '1')).toBeNull();
      expect(await manager.get('quotes', '1')).toBeNull();
    });
  });

  describe('request coalescing', () => {
    it('should coalesce duplicate requests', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      
      // Fire multiple requests simultaneously
      const promises = [
        manager.coalesce('test-key', fetchFn),
        manager.coalesce('test-key', fetchFn),
        manager.coalesce('test-key', fetchFn),
      ];
      
      await Promise.all(promises);
      
      // Fetch should only be called once
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should not coalesce different keys', async () => {
      const fetchFn1 = vi.fn().mockResolvedValue({ data: 'test1' });
      const fetchFn2 = vi.fn().mockResolvedValue({ data: 'test2' });
      
      await Promise.all([
        manager.coalesce('key1', fetchFn1),
        manager.coalesce('key2', fetchFn2),
      ]);
      
      expect(fetchFn1).toHaveBeenCalledTimes(1);
      expect(fetchFn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('metrics', () => {
    it('should track cache hits', async () => {
      const testData = { id: '1', name: 'Test' };
      
      await manager.set('customers', testData, '1');
      await manager.get('customers', '1');
      
      const stats = manager.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.totalRequests).toBe(1);
    });

    it('should track cache misses', async () => {
      await manager.get('customers', 'nonexistent');
      
      const stats = manager.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.totalRequests).toBe(1);
    });

    it('should calculate average response time', async () => {
      const testData = { id: '1', name: 'Test' };
      
      await manager.set('customers', testData, '1');
      await manager.get('customers', '1');
      await manager.get('customers', '1');
      
      const stats = manager.getStats();
      expect(stats.avgResponseTime).toBeGreaterThan(0);
    });

    it('should reset metrics', () => {
      manager.resetMetrics();
      
      const stats = manager.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.errors).toBe(0);
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('cache warming', () => {
    it('should preload high-priority resources', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await manager.preload(['customers', 'items', 'settings']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Preloading')
      );
    });

    it('should warm cache with high-priority entity types', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await manager.warmCache();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warming cache')
      );
    });
  });

  describe('cache configurations', () => {
    it('should use correct TTL for customers (10 min)', async () => {
      const testData = { id: '1', name: 'Test' };
      const originalNow = Date.now;
      let currentTime = Date.now();
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      await manager.set('customers', testData, '1');
      
      // 9 minutes - should still be valid
      currentTime += 9 * 60 * 1000;
      expect(await manager.get('customers', '1')).toEqual(testData);
      
      // 11 minutes - should be expired
      currentTime += 2 * 60 * 1000;
      expect(await manager.get('customers', '1')).toBeNull();
      
      Date.now = originalNow;
    });

    it('should use correct TTL for items (15 min)', async () => {
      const testData = { id: '1', name: 'Test' };
      const originalNow = Date.now;
      let currentTime = Date.now();
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      await manager.set('items', testData, '1');
      
      // 14 minutes - should still be valid
      currentTime += 14 * 60 * 1000;
      expect(await manager.get('items', '1')).toEqual(testData);
      
      // 16 minutes - should be expired
      currentTime += 2 * 60 * 1000;
      expect(await manager.get('items', '1')).toBeNull();
      
      Date.now = originalNow;
    });
  });
});

describe('Singleton cacheManager', () => {
  it('should export singleton instance', () => {
    expect(cacheManager).toBeInstanceOf(CacheManager);
  });

  it('should maintain state across imports', async () => {
    await cacheManager.set('customers', { id: '1' }, '1');
    
    const cached = await cacheManager.get('customers', '1');
    expect(cached).toEqual({ id: '1' });
  });
});
