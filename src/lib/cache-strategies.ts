
/**
 * Cache Strategy Configuration for Quote.it AI
 * 
 * Defines cache names, versioning, and strategy configurations
 * for the Workbox-based service worker implementation.
 * 
 * @module cache-strategies
 */

export const CACHE_VERSION = "v2.0";
export const CACHE_PREFIX = "quote-it-ai";

/**
 * Cache name constants with versioning
 */
export const CACHE_NAMES = {
  static: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  api: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
  images: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  avatars: `${CACHE_PREFIX}-avatars-${CACHE_VERSION}`,
  runtime: `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`,
} as const;

/**
 * Cache strategy configurations for different resource types
 */
export const CACHE_STRATEGIES = {
  /**
   * Static assets: cache-first with long expiration
   * Used for: CSS, JavaScript, fonts, icons
   */
  static: {
    strategy: "CacheFirst" as const,
    cacheName: CACHE_NAMES.static,
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * API calls: network-first with offline fallback
   * Used for: Supabase API calls, authentication
   */
  api: {
    strategy: "NetworkFirst" as const,
    cacheName: CACHE_NAMES.api,
    networkTimeoutSeconds: 5,
    maxEntries: 50,
    maxAgeSeconds: 5 * 60, // 5 minutes
  },

  /**
   * Images: cache-first with revalidation
   * Used for: Screenshots, logos, icons
   */
  images: {
    strategy: "CacheFirst" as const,
    cacheName: CACHE_NAMES.images,
    maxEntries: 200,
    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
  },

  /**
   * User avatars: stale-while-revalidate for fast UX
   * Used for: Profile pictures, custom branding
   */
  avatars: {
    strategy: "StaleWhileRevalidate" as const,
    cacheName: CACHE_NAMES.avatars,
    maxEntries: 50,
    maxAgeSeconds: 24 * 60 * 60, // 1 day
  },

  /**
   * Runtime cache: for dynamic content
   * Used for: HTML pages, dynamic routes
   */
  runtime: {
    strategy: "NetworkFirst" as const,
    cacheName: CACHE_NAMES.runtime,
    networkTimeoutSeconds: 3,
    maxEntries: 20,
    maxAgeSeconds: 60 * 60, // 1 hour
  },
} as const;

/**
 * Critical assets to precache during service worker installation
 * These are loaded immediately when the SW is installed
 */
export const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png",
] as const;

/**
 * Routes that should be cached with network-first strategy
 */
export const API_ROUTES = [
  "/rest/v1/customers",
  "/rest/v1/items",
  "/rest/v1/quotes",
  "/rest/v1/company_settings",
  "/rest/v1/user_roles",
] as const;

/**
 * Background sync queue configuration
 */
export const BACKGROUND_SYNC_CONFIG = {
  queueName: "api-queue",
  maxRetentionTime: 24 * 60, // 24 hours in minutes
  onSync: async ({ queue }: { queue: { replayRequests: () => Promise<void> } }) => {
    await queue.replayRequests();
  },
} as const;

/**
 * Get all cache names (for cleanup operations)
 */
export function getAllCacheNames(): string[] {
  return Object.values(CACHE_NAMES);
}

/**
 * Check if a cache name belongs to the current version
 */
export function isCurrentCache(cacheName: string): boolean {
  return getAllCacheNames().includes(cacheName);
}

/**
 * Get the cache name for a specific resource type
 */
export function getCacheNameForResource(url: string): string {
  if (url.includes("/rest/v1/") || url.includes("/auth/v1/")) {
    return CACHE_NAMES.api;
  }
  
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
    return CACHE_NAMES.images;
  }
  
  if (url.match(/\.(css|js|woff|woff2|ttf|eot)$/i)) {
    return CACHE_NAMES.static;
  }
  
  return CACHE_NAMES.runtime;
}
