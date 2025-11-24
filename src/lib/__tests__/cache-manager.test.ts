
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getCacheQuota,
  getCacheDetails,
  clearAllCaches,
  clearCache,
  clearOldCaches,
  getCacheStats,
  cacheExists,
  warmUpCache,
  exportCacheData,
} from "../cache-utils";
import { CACHE_NAMES } from "../cache-strategies";

describe("Cache Utilities", () => {
  beforeEach(async () => {
    // Clear all caches before each test
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  });

  afterEach(async () => {
    // Clean up after each test
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  });

  describe("getCacheQuota", () => {
    it("should return cache quota information", async () => {
      const quota = await getCacheQuota();

      expect(quota).toHaveProperty("usage");
      expect(quota).toHaveProperty("quota");
      expect(quota).toHaveProperty("percentage");
      expect(quota).toHaveProperty("usageMB");
      expect(quota).toHaveProperty("quotaMB");
      expect(typeof quota.usage).toBe("number");
      expect(typeof quota.quota).toBe("number");
    });
  });

  describe("getCacheDetails", () => {
    it("should return empty array when no caches exist", async () => {
      const details = await getCacheDetails();
      expect(details).toEqual([]);
    });

    it("should return details for existing caches", async () => {
      // Create test cache
      const testCache = await caches.open("test-cache");
      await testCache.put(
        new Request("/test"),
        new Response("test data", { status: 200 })
      );

      const details = await getCacheDetails();

      expect(details.length).toBeGreaterThan(0);
      expect(details[0]).toHaveProperty("name");
      expect(details[0]).toHaveProperty("size");
      expect(details[0]).toHaveProperty("count");
      expect(details[0]).toHaveProperty("sizeMB");
    });

    it("should calculate cache size correctly", async () => {
      const testCache = await caches.open("test-cache");
      const testData = "x".repeat(1024); // 1KB of data
      await testCache.put(
        new Request("/test"),
        new Response(testData, { status: 200 })
      );

      const details = await getCacheDetails();
      const testCacheDetails = details.find((d) => d.name === "test-cache");

      expect(testCacheDetails).toBeDefined();
      expect(testCacheDetails!.count).toBe(1);
      expect(testCacheDetails!.size).toBeGreaterThan(0);
    });
  });

  describe("clearAllCaches", () => {
    it("should clear all existing caches", async () => {
      // Create multiple test caches
      await caches.open("test-cache-1");
      await caches.open("test-cache-2");
      await caches.open("test-cache-3");

      let cacheNames = await caches.keys();
      expect(cacheNames.length).toBe(3);

      await clearAllCaches();

      cacheNames = await caches.keys();
      expect(cacheNames.length).toBe(0);
    });
  });

  describe("clearCache", () => {
    it("should clear specific cache by name", async () => {
      await caches.open("test-cache");
      
      let exists = await cacheExists("test-cache");
      expect(exists).toBe(true);

      const deleted = await clearCache("test-cache");
      expect(deleted).toBe(true);

      exists = await cacheExists("test-cache");
      expect(exists).toBe(false);
    });

    it("should return false for non-existent cache", async () => {
      const deleted = await clearCache("non-existent-cache");
      expect(deleted).toBe(false);
    });
  });

  describe("clearOldCaches", () => {
    it("should clear caches that don't match current version", async () => {
      // Create old version caches
      await caches.open("quote-it-ai-static-v1.0");
      await caches.open("quote-it-ai-api-v1.0");
      
      // Create current version cache
      await caches.open(CACHE_NAMES.static);

      const cleared = await clearOldCaches();
      
      expect(cleared).toBe(2);
      
      const remainingCaches = await caches.keys();
      expect(remainingCaches).toContain(CACHE_NAMES.static);
      expect(remainingCaches).not.toContain("quote-it-ai-static-v1.0");
      expect(remainingCaches).not.toContain("quote-it-ai-api-v1.0");
    });

    it("should not clear current version caches", async () => {
      await caches.open(CACHE_NAMES.static);
      await caches.open(CACHE_NAMES.api);

      const cleared = await clearOldCaches();
      
      expect(cleared).toBe(0);
      
      const remainingCaches = await caches.keys();
      expect(remainingCaches).toContain(CACHE_NAMES.static);
      expect(remainingCaches).toContain(CACHE_NAMES.api);
    });
  });

  describe("getCacheStats", () => {
    it("should return comprehensive cache statistics", async () => {
      const testCache = await caches.open("test-cache");
      await testCache.put(
        new Request("/test1"),
        new Response("data1", { status: 200 })
      );
      await testCache.put(
        new Request("/test2"),
        new Response("data2", { status: 200 })
      );

      const stats = await getCacheStats();

      expect(stats).toHaveProperty("totalCaches");
      expect(stats).toHaveProperty("totalSize");
      expect(stats).toHaveProperty("totalSizeMB");
      expect(stats).toHaveProperty("totalEntries");
      expect(stats).toHaveProperty("quota");
      expect(stats.totalCaches).toBeGreaterThan(0);
      expect(stats.totalEntries).toBe(2);
    });
  });

  describe("cacheExists", () => {
    it("should return true for existing cache", async () => {
      await caches.open("test-cache");
      const exists = await cacheExists("test-cache");
      expect(exists).toBe(true);
    });

    it("should return false for non-existent cache", async () => {
      const exists = await cacheExists("non-existent-cache");
      expect(exists).toBe(false);
    });
  });

  describe("warmUpCache", () => {
    it("should cache specified URLs", async () => {
      // Mock fetch to return successful responses
      global.fetch = vi.fn().mockResolvedValue(
        new Response("test data", { status: 200 })
      );

      const urls = ["/test1", "/test2", "/test3"];
      const successCount = await warmUpCache("test-cache", urls);

      expect(successCount).toBe(3);

      const cache = await caches.open("test-cache");
      const keys = await cache.keys();
      expect(keys.length).toBe(3);
    });

    it("should handle failed fetches gracefully", async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const urls = ["/test1", "/test2"];
      const successCount = await warmUpCache("test-cache", urls);

      expect(successCount).toBe(0);
    });
  });

  describe("exportCacheData", () => {
    it("should export complete cache data", async () => {
      const testCache = await caches.open("test-cache");
      await testCache.put(
        new Request("/test"),
        new Response("data", { status: 200 })
      );

      const exportData = await exportCacheData();

      expect(exportData).toHaveProperty("timestamp");
      expect(exportData).toHaveProperty("quota");
      expect(exportData).toHaveProperty("caches");
      expect(exportData).toHaveProperty("stats");
      expect(Array.isArray(exportData.caches)).toBe(true);
      expect(new Date(exportData.timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});
