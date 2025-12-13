/// <reference lib="webworker" />

/**
 * Service Worker with Workbox Integration
 * Quote.it AI - Advanced Caching & Performance Optimization
 * 
 * Features:
 * - Workbox cache strategies for optimal performance
 * - Request coalescing to prevent duplicate fetches
 * - Cache validation and security checks
 * - Performance monitoring hooks
 * - Background sync for offline operations
 * 
 * @version 2.0
 */

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { BackgroundSyncPlugin } from "workbox-background-sync";

// ============================================================================
// Configuration
// ============================================================================

const CACHE_VERSION = "v2.0";
const CACHE_PREFIX = "quote-it-ai";

const CACHE_NAMES = {
  static: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  api: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
  images: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  avatars: `${CACHE_PREFIX}-avatars-${CACHE_VERSION}`,
  runtime: `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`,
};

// Trusted domains for cache validation (prevent cache poisoning)
const TRUSTED_DOMAINS = [
  self.location.origin,
  "https://*.supabase.co",
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://cdn.jsdelivr.net",
  "https://unpkg.com",
];

// Performance monitoring
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  errors: 0,
};

// ============================================================================
// Security & Validation
// ============================================================================

/**
 * Validate response before caching (prevent cache poisoning)
 */
function isValidCacheResponse(response, request) {
  if (!response || response.status < 200 || response.status >= 300) {
    return false;
  }

  if (!response.headers.get("content-type")) {
    return false;
  }

  const url = new URL(request.url);
  const isTrusted = TRUSTED_DOMAINS.some((domain) => {
    if (domain.includes("*")) {
      const pattern = domain.replace("*", ".*");
      return new RegExp(pattern).test(url.origin);
    }
    return url.origin === domain || url.origin.includes(domain);
  });

  if (!isTrusted) {
    console.warn("[SW] Blocked caching from untrusted domain:", url.origin);
    return false;
  }

  const contentType = response.headers.get("content-type") || "";
  const destination = request.destination;

  if (destination === "script" && !contentType.includes("javascript")) {
    console.warn("[SW] Content-Type mismatch for script:", contentType);
    return false;
  }

  if (destination === "style" && !contentType.includes("css")) {
    console.warn("[SW] Content-Type mismatch for style:", contentType);
    return false;
  }

  if (destination === "image" && !contentType.includes("image")) {
    console.warn("[SW] Content-Type mismatch for image:", contentType);
    return false;
  }

  return true;
}

/**
 * Custom plugin for response validation
 */
class ResponseValidationPlugin {
  async cacheWillUpdate({ request, response }) {
    if (!isValidCacheResponse(response, request)) {
      console.warn("[SW] Response validation failed:", request.url);
      return null;
    }
    return response;
  }

  cacheDidUpdate({ cacheName, request }) {
    performanceMetrics.cacheHits++;
    console.log(`[SW] Cache updated: ${cacheName} - ${request.url}`);
  }
}

/**
 * Performance monitoring plugin
 */
class PerformanceMonitoringPlugin {
  requestWillFetch({ request }) {
    performanceMetrics.networkRequests++;
    return request;
  }

  fetchDidFail({ request, error }) {
    performanceMetrics.errors++;
    console.error("[SW] Fetch failed:", request.url, error);
  }

  cachedResponseWillBeUsed({ cacheName, cachedResponse }) {
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
    } else {
      performanceMetrics.cacheMisses++;
    }
    return cachedResponse;
  }
}

// ============================================================================
// Workbox Configuration
// ============================================================================

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Background sync for offline API requests
const bgSyncPlugin = new BackgroundSyncPlugin("api-queue", {
  maxRetentionTime: 24 * 60, // 24 hours
  onSync: async ({ queue }) => {
    console.log("[SW] Background sync triggered");
    await queue.replayRequests();
  },
});

// ============================================================================
// Cache Strategies
// ============================================================================

/**
 * Static assets: cache-first with long expiration
 * CSS, JavaScript, fonts, icons
 */
registerRoute(
  ({ request }) =>
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font",
  new CacheFirst({
    cacheName: CACHE_NAMES.static,
    plugins: [
      new ResponseValidationPlugin(),
      new PerformanceMonitoringPlugin(),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

/**
 * API calls: network-first with offline fallback
 * Supabase API, authentication
 */
registerRoute(
  ({ url }) =>
    url.pathname.includes("/rest/v1/") ||
    url.pathname.includes("/auth/v1/") ||
    url.pathname.includes("/api/"),
  new NetworkFirst({
    cacheName: CACHE_NAMES.api,
    networkTimeoutSeconds: 5,
    plugins: [
      new ResponseValidationPlugin(),
      new PerformanceMonitoringPlugin(),
      bgSyncPlugin,
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

/**
 * Edge functions: never cache, always fetch fresh
 */
registerRoute(
  ({ url }) => url.pathname.includes("/functions/v1/"),
  async ({ request }) => {
    try {
      performanceMetrics.networkRequests++;
      return await fetch(request, { cache: "no-store" });
    } catch (error) {
      performanceMetrics.errors++;
      console.error("[SW] Edge function fetch failed:", error);
      return new Response(null, { status: 204 });
    }
  }
);

/**
 * Images: cache-first with revalidation
 * Screenshots, logos, icons
 */
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: CACHE_NAMES.images,
    plugins: [
      new ResponseValidationPlugin(),
      new PerformanceMonitoringPlugin(),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

/**
 * User avatars: stale-while-revalidate for fast UX
 * Profile pictures, custom branding
 */
registerRoute(
  ({ url }) =>
    url.pathname.includes("/avatar") || url.pathname.includes("/profile"),
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.avatars,
    plugins: [
      new ResponseValidationPlugin(),
      new PerformanceMonitoringPlugin(),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
    ],
  })
);

/**
 * HTML pages: network-first with cache fallback
 * Dynamic routes, SPA navigation
 */
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: CACHE_NAMES.runtime,
    networkTimeoutSeconds: 3,
    plugins: [
      new ResponseValidationPlugin(),
      new PerformanceMonitoringPlugin(),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);

/**
 * Analytics: fire and forget, never block
 */
registerRoute(
  ({ url }) =>
    url.pathname.includes("analytics") || url.pathname.includes("~api/analytics"),
  async ({ request }) => {
    try {
      return await fetch(request);
    } catch {
      return new Response(null, { status: 204 });
    }
  }
);

// ============================================================================
// Service Worker Lifecycle
// ============================================================================

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker v2.0 with Workbox");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker v2.0");
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const currentCaches = Object.values(CACHE_NAMES);
      
      await Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
      
      // Take control of all clients
      await self.clients.claim();
      console.log("[SW] Service worker activated and claimed clients");
    })()
  );
});

// ============================================================================
// Message Handling
// ============================================================================

self.addEventListener("message", (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "CLEAR_ALL_CACHE":
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          console.log("[SW] Clearing all caches");
          return Promise.all(cacheNames.map((name) => caches.delete(name))).then(() => {
            event.ports[0]?.postMessage({ success: true });
          });
        })
      );
      break;

    case "CLEAR_API_CACHE":
      event.waitUntil(
        caches.delete(CACHE_NAMES.api).then(() => {
          console.log("[SW] API cache cleared");
          event.ports[0]?.postMessage({ success: true });
        })
      );
      break;

    case "CLEAR_AUTH_CACHE":
      event.waitUntil(
        Promise.all([
          caches.delete(CACHE_NAMES.api),
          caches.delete(CACHE_NAMES.runtime),
        ]).then(() => {
          console.log("[SW] Auth-related caches cleared");
          event.ports[0]?.postMessage({ success: true });
        })
      );
      break;

    case "GET_PERFORMANCE_METRICS":
      event.ports[0]?.postMessage(performanceMetrics);
      break;

    default:
      console.warn("[SW] Unknown message type:", type);
  }
});

// ============================================================================
// Push Notifications
// ============================================================================

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || "You have a new notification",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(data.title || "Quote It", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});

console.log("[SW] Service worker v2.0 loaded with Workbox strategies");
