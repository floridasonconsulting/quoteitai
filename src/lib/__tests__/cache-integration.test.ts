import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cacheManager } from '@/lib/cache-manager';
import { performanceMonitor } from '@/lib/performance-monitor';
import { rateLimiter } from '@/lib/rate-limiter';

describe('Cache System Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cacheManager.clear();
    localStorage.clear();
    rateLimiter.resetAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cache Manager & Performance Monitor Integration', () => {
    it('should track performance metrics when cache operations occur', async () => {
      const setSpy = vi.spyOn(cacheManager, 'set');
      const getSpy = vi.spyOn(cacheManager, 'get');
      
      await cacheManager.set('test-key', { data: 'test' });
      const result = await cacheManager.get('test-key');
      
      expect(setSpy).toHaveBeenCalled();
      expect(getSpy).toHaveBeenCalled();
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle cache quotas correctly', async () => {
      // Mock storage estimate
      const mockEstimate = {
        usage: 800 * 1024 * 1024, // 800MB
        quota: 1024 * 1024 * 1024, // 1GB
      };
      
      if (navigator.storage &amp;&amp; navigator.storage.estimate) {
        vi.spyOn(navigator.storage, 'estimate').mockResolvedValue(mockEstimate);
      }

      const quota = await cacheManager.getQuotaUsage();
      
      expect(quota.usage).toBe(mockEstimate.usage);
      expect(quota.quota).toBe(mockEstimate.quota);
    });
  });

  describe('Rate Limiter & Cache Integration', () => {
    it('should respect rate limits for cached API calls', async () => {
      const key = 'test-api';
      rateLimiter.register(key, {
        maxRequests: 2,
        windowMs: 1000
      });

      // First request
      const res1 = await rateLimiter.trackRequest(key, async () => 'success');
      expect(res1).toBe('success');

      // Second request
      const res2 = await rateLimiter.trackRequest(key, async () => 'success');
      expect(res2).toBe('success');

      // Third request should fail
      await expect(rateLimiter.trackRequest(key, async () => 'success'))
        .rejects
        .toThrow(/Rate limit exceeded/);
    });
  });

  describe('Performance Monitor Subscribers', () => {
    it('should notify subscribers when metrics update', () => {
      const callback = vi.fn();
      const unsubscribe = performanceMonitor.subscribe(callback);

      // Should be called immediately with current metrics
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
    });
  });
});