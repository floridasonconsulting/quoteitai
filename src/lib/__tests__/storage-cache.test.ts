import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storageCache } from '../storage-cache';

describe('StorageCache', () => {
  beforeEach(() => {
    localStorage.clear();
    storageCache.clearCache();
    // Ensure mocks are clean
    vi.clearAllMocks();
  });

  afterEach(() => {
    // CRITICAL: Restore mocks to prevent leakage
    vi.restoreAllMocks();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve string values', () => {
      storageCache.set('test-key', 'test-value');
      const value = storageCache.get<string>('test-key');
      expect(value).toBe('test-value');
    });

    it('should store and retrieve object values', () => {
      const testObject = { id: '1', name: 'Test', count: 42 };
      storageCache.set('test-object', testObject);
      const value = storageCache.get<typeof testObject>('test-object');
      expect(value).toEqual(testObject);
    });

    it('should return null for non-existent keys', () => {
      const value = storageCache.get('non-existent');
      expect(value).toBeNull();
    });
  });

  describe('Memoization', () => {
    it('should return cached value on subsequent reads', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      
      storageCache.set('memo-test', { data: 'test' });
      storageCache.get('memo-test');
      const firstCallCount = getItemSpy.mock.calls.length;
      
      storageCache.get('memo-test');
      const secondCallCount = getItemSpy.mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should invalidate cache when value is updated', () => {
      storageCache.set('update-test', 'initial');
      const firstValue = storageCache.get('update-test');
      
      storageCache.set('update-test', 'updated');
      const secondValue = storageCache.get('update-test');
      
      expect(firstValue).toBe('initial');
      expect(secondValue).toBe('updated');
    });
  });

  describe('Error Handling', () => {
    it('should handle QuotaExceededError gracefully', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Use immediate: true to bypass debounce and trigger error immediately
      storageCache.set('quota-test', 'value', true);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Storage limit reached') // Updated to match actual warning message in code
      );
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('corrupted-key', '{invalid json}');
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const value = storageCache.get('corrupted-key');
      
      expect(value).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should handle rapid successive reads efficiently', () => {
      storageCache.set('perf-test', { data: 'test' });
      
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        storageCache.get('perf-test');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
    });
  });
});
