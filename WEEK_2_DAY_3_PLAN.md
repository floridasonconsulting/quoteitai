
# 📋 Week 2, Day 3 - Service Worker Foundation & Advanced Caching

**Date:** November 25, 2025 (Planned)  
**Status:** 📝 Planning Phase  
**Phase:** 2 - Advanced Caching Strategies

---

## 🎯 Day 3 Objectives

### Primary Mission
Transform Quote.it AI into a high-performance, offline-first PWA with intelligent service worker caching

### Success Criteria
- ✅ Service worker refactored with workbox patterns
- ✅ Cache versioning system operational
- ✅ Critical assets pre-cached on install
- ✅ Background sync for failed requests
- ✅ All 38 existing tests still passing
- ✅ Performance metrics dashboard created

---

## 📋 Task Breakdown

### 1. Service Worker Architecture Refactoring (2-3 hours)
**Priority:** 🔴 Critical

**Current State:**
- Basic service worker at `public/service-worker.js` (393 lines)
- Manual cache management
- No versioning system
- Limited offline functionality

**Target State:**
- Workbox-based architecture
- Automatic cache versioning
- Strategy-based routing
- Background sync enabled
- Proper lifecycle management

**Implementation Steps:**

#### Step 1.1: Install Workbox Dependencies
```bash
npm install workbox-build workbox-core workbox-precaching workbox-routing workbox-strategies workbox-background-sync --save-dev
```

#### Step 1.2: Create Cache Strategy Configuration
**File:** `src/lib/cache-strategies.ts` (new)
```typescript
export const CACHE_VERSION = 'v2.0';
export const CACHE_PREFIX = 'quote-it-ai';

export const CACHE_NAMES = {
  static: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  api: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
  images: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  avatars: `${CACHE_PREFIX}-avatars-${CACHE_VERSION}`,
};

export const CACHE_STRATEGIES = {
  // Static assets: cache-first (CSS, JS, fonts)
  static: {
    strategy: 'CacheFirst',
    cacheName: CACHE_NAMES.static,
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },
  
  // API calls: network-first with fallback
  api: {
    strategy: 'NetworkFirst',
    cacheName: CACHE_NAMES.api,
    networkTimeoutSeconds: 5,
    maxEntries: 50,
    maxAgeSeconds: 5 * 60, // 5 minutes
  },
  
  // Images: cache-first with revalidation
  images: {
    strategy: 'CacheFirst',
    cacheName: CACHE_NAMES.images,
    maxEntries: 200,
    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
  },
  
  // User avatars: stale-while-revalidate
  avatars: {
    strategy: 'StaleWhileRevalidate',
    cacheName: CACHE_NAMES.avatars,
    maxEntries: 50,
    maxAgeSeconds: 24 * 60 * 60, // 1 day
  },
};

export const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Will be populated by build process
];
```

#### Step 1.3: Refactor Service Worker
**File:** `public/service-worker.js` (refactor)
```typescript
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CACHE_STRATEGIES, CACHE_NAMES } from './cache-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Static assets (CSS, JS, fonts)
registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: CACHE_NAMES.static,
    plugins: [
      new ExpirationPlugin(CACHE_STRATEGIES.static),
    ],
  })
);

// API calls with network-first strategy
registerRoute(
  ({ url }) => url.origin === 'https://your-supabase-url.supabase.co',
  new NetworkFirst({
    cacheName: CACHE_NAMES.api,
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin(CACHE_STRATEGIES.api),
      new BackgroundSyncPlugin('api-queue', {
        maxRetentionTime: 24 * 60, // Retry for 24 hours
      }),
    ],
  })
);

// Images with cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_NAMES.images,
    plugins: [
      new ExpirationPlugin(CACHE_STRATEGIES.images),
    ],
  })
);

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  const cacheWhitelist = Object.values(CACHE_NAMES);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

#### Step 1.4: Add Cache Warmup on Install
```typescript
// In service-worker.js
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      console.log('[SW] Pre-caching critical assets');
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/favicon.ico',
        '/logo.png',
        // Add more critical assets
      ]);
    })
  );
  
  // Force activation
  self.skipWaiting();
});
```

**Testing Checklist:**
- [ ] Service worker installs without errors
- [ ] Cache versioning works (old caches deleted)
- [ ] Network-first strategy works for API calls
- [ ] Cache-first strategy works for static assets
- [ ] Background sync queues failed requests
- [ ] No regression in existing functionality

---

### 2. Cache Management System (1-2 hours)
**Priority:** 🟡 High

**Implementation Steps:**

#### Step 2.1: Cache Quota Monitoring
**File:** `src/lib/cache-manager.ts` (enhance existing)
```typescript
export async function getCacheQuota(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: estimate.quota 
        ? Math.round((estimate.usage! / estimate.quota) * 100) 
        : 0,
    };
  }
  return { usage: 0, quota: 0, percentage: 0 };
}

export async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((cacheName) => caches.delete(cacheName))
  );
  console.log('[CacheManager] Cleared all caches');
}

export async function getCacheDetails(): Promise<{
  name: string;
  size: number;
  count: number;
}[]> {
  const cacheNames = await caches.keys();
  const details = await Promise.all(
    cacheNames.map(async (name) => {
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
      };
    })
  );
  
  return details;
}
```

#### Step 2.2: Add Cache Debug UI
**File:** `src/components/CacheDebugPanel.tsx` (new)
```typescript
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCacheQuota, getCacheDetails, clearAllCaches } from "@/lib/cache-manager";

export function CacheDebugPanel() {
  const [quota, setQuota] = useState<{ usage: number; quota: number; percentage: number }>();
  const [caches, setCaches] = useState<{ name: string; size: number; count: number }[]>([]);
  
  const loadCacheInfo = async () => {
    const quotaInfo = await getCacheQuota();
    const cacheInfo = await getCacheDetails();
    setQuota(quotaInfo);
    setCaches(cacheInfo);
  };
  
  useEffect(() => {
    loadCacheInfo();
  }, []);
  
  const handleClearCaches = async () => {
    await clearAllCaches();
    await loadCacheInfo();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache Management</CardTitle>
      </CardHeader>
      <CardContent>
        {quota && (
          <div className="mb-4">
            <p>Usage: {(quota.usage / 1024 / 1024).toFixed(2)} MB</p>
            <p>Quota: {(quota.quota / 1024 / 1024).toFixed(2)} MB</p>
            <p>Percentage: {quota.percentage}%</p>
          </div>
        )}
        
        <div className="space-y-2">
          {caches.map((cache) => (
            <div key={cache.name} className="border p-2 rounded">
              <p className="font-semibold">{cache.name}</p>
              <p className="text-sm">
                Size: {(cache.size / 1024).toFixed(2)} KB | 
                Count: {cache.count} items
              </p>
            </div>
          ))}
        </div>
        
        <Button 
          onClick={handleClearCaches} 
          variant="destructive" 
          className="mt-4"
        >
          Clear All Caches
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### 3. Performance Monitoring Foundation (1-2 hours)
**Priority:** 🟡 High

**Implementation Steps:**

#### Step 3.1: Core Web Vitals Tracker
**File:** `src/lib/performance-monitor.ts` (new)
```typescript
import { onCLS, onFID, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  inp: number | null;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    inp: null,
  };
  
  private listeners: Array<(metrics: PerformanceMetrics) => void> = [];
  
  constructor() {
    this.initializeTracking();
  }
  
  private initializeTracking() {
    onLCP((metric: Metric) => {
      this.metrics.lcp = metric.value;
      this.notifyListeners();
    });
    
    onFID((metric: Metric) => {
      this.metrics.fid = metric.value;
      this.notifyListeners();
    });
    
    onCLS((metric: Metric) => {
      this.metrics.cls = metric.value;
      this.notifyListeners();
    });
    
    onTTFB((metric: Metric) => {
      this.metrics.ttfb = metric.value;
      this.notifyListeners();
    });
    
    onINP((metric: Metric) => {
      this.metrics.inp = metric.value;
      this.notifyListeners();
    });
  }
  
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  public subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }
  
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getMetrics()));
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

#### Step 3.2: Performance Dashboard Component
**File:** `src/components/PerformanceDashboard.tsx` (new)
```typescript
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { performanceMonitor } from "@/lib/performance-monitor";

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());
  
  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    return unsubscribe;
  }, []);
  
  const getScoreClass = (value: number | null, thresholds: [number, number]) => {
    if (value === null) return "text-gray-400";
    if (value <= thresholds[0]) return "text-green-600";
    if (value <= thresholds[1]) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Largest Contentful Paint (LCP)</p>
          <p className={`text-2xl font-bold ${getScoreClass(metrics.lcp, [2500, 4000])}`}>
            {metrics.lcp ? `${(metrics.lcp / 1000).toFixed(2)}s` : 'Measuring...'}
          </p>
          <p className="text-xs text-gray-500">Good: &lt;2.5s | Needs Improvement: 2.5-4s | Poor: &gt;4s</p>
        </div>
        
        <div>
          <p className="text-sm font-medium">First Input Delay (FID)</p>
          <p className={`text-2xl font-bold ${getScoreClass(metrics.fid, [100, 300])}`}>
            {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'Measuring...'}
          </p>
          <p className="text-xs text-gray-500">Good: &lt;100ms | Needs Improvement: 100-300ms | Poor: &gt;300ms</p>
        </div>
        
        <div>
          <p className="text-sm font-medium">Cumulative Layout Shift (CLS)</p>
          <p className={`text-2xl font-bold ${getScoreClass(metrics.cls, [0.1, 0.25])}`}>
            {metrics.cls !== null ? metrics.cls.toFixed(3) : 'Measuring...'}
          </p>
          <p className="text-xs text-gray-500">Good: &lt;0.1 | Needs Improvement: 0.1-0.25 | Poor: &gt;0.25</p>
        </div>
        
        <div>
          <p className="text-sm font-medium">Time to First Byte (TTFB)</p>
          <p className={`text-2xl font-bold ${getScoreClass(metrics.ttfb, [800, 1800])}`}>
            {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'Measuring...'}
          </p>
          <p className="text-xs text-gray-500">Good: &lt;800ms | Needs Improvement: 800-1800ms | Poor: &gt;1800ms</p>
        </div>
        
        <div>
          <p className="text-sm font-medium">Interaction to Next Paint (INP)</p>
          <p className={`text-2xl font-bold ${getScoreClass(metrics.inp, [200, 500])}`}>
            {metrics.inp ? `${metrics.inp.toFixed(0)}ms` : 'Measuring...'}
          </p>
          <p className="text-xs text-gray-500">Good: &lt;200ms | Needs Improvement: 200-500ms | Poor: &gt;500ms</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 📊 Expected Outcomes

### Day 3 Deliverables
1. ✅ Refactored service worker with workbox
2. ✅ Cache versioning system operational
3. ✅ Cache management UI in Settings
4. ✅ Performance monitoring dashboard
5. ✅ All 38 existing tests passing
6. ✅ Documentation updated

### Performance Improvements
- **Cache Hit Rate:** 85% → 95%+ (12% improvement)
- **Offline Functionality:** 70% → 90% coverage
- **First Load:** <1.5s LCP (from 2.1s)
- **API Caching:** 5-minute stale-while-revalidate

---

## 🧪 Testing Strategy

### Service Worker Tests
```typescript
// Test service worker installation
test('service worker installs and activates', async () => {
  const registration = await navigator.serviceWorker.register('/service-worker.js');
  expect(registration.installing || registration.waiting || registration.active).toBeTruthy();
});

// Test cache versioning
test('old caches are deleted on activation', async () => {
  // Mock setup and test cache cleanup
});

// Test cache strategies
test('static assets use cache-first strategy', async () => {
  // Test cache-first behavior
});

test('API calls use network-first strategy', async () => {
  // Test network-first behavior
});
```

### Integration Tests
- Verify existing 38 tests still pass
- Add new tests for cache strategies
- Test service worker lifecycle
- Verify performance monitoring

---

## 📝 Documentation Updates

### Files to Update
1. `MASTERSYSTEMREFERENCE.md` - Add Day 3 completion
2. `WEEK_2_DAY_3_SUMMARY.md` - Create completion report
3. `README.md` - Update performance metrics
4. Code comments - Document cache strategies

---

## 🚀 Next Steps (Day 4)

### Day 4 Focus Areas
1. Performance optimization phase 2
2. Optimistic UI updates implementation
3. Mobile UX enhancements
4. Error recovery improvements
5. Testing and validation

---

**Created:** November 24, 2025  
**Target Start:** November 25, 2025  
**Estimated Duration:** 4-6 hours  
**Status:** 📝 Planning Complete

---

*This plan provides a clear roadmap for Day 3 implementation. All tasks are broken down into actionable steps with code examples.*
  