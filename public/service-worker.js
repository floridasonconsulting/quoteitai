const CACHE_VERSION = 'quote-it-v1';  // Increment manually only when needed
const STATIC_CACHE = CACHE_VERSION + '-static';
const DYNAMIC_CACHE = CACHE_VERSION + '-dynamic';
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stale-while-revalidate helper for API
async function staleWhileRevalidate(request, cache) {
  const cachedResponse = await cache.match(request);
  
  // Start network fetch (don't await)
  const fetchPromise = fetch(request)
    .then(response => {
      if (response && response.ok) {
        const clone = response.clone();
        cache.put(request, clone);
      }
      return response;
    })
    .catch(() => null);

  // Return cached immediately if available, otherwise wait for network
  return cachedResponse || await fetchPromise || new Response(null, { status: 504 });
}

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Analytics - fire and forget, never block
  if (url.pathname.includes('analytics') || url.pathname.includes('~api/analytics')) {
    event.respondWith(
      fetch(request)
        .then(r => r)
        .catch(() => new Response(null, { status: 204 }))
    );
    return;
  }

  // API calls - stale-while-revalidate strategy
  if (url.pathname.includes('/api/') || url.pathname.includes('/rest/v1/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => staleWhileRevalidate(request, cache))
    );
    return;
  }

  // HTML - network first with cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
        .then(response => response || caches.match('/index.html'))
    );
    return;
  }

  // Scripts and styles - network first (prevent React version mismatches)
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Images and fonts - cache first
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Default - network first
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Check if cached response is expired
function checkCacheExpiration(cachedResponse, request) {
  const cacheTime = cachedResponse.headers.get('sw-cache-time');
  if (cacheTime) {
    const age = Date.now() - parseInt(cacheTime);
    if (age > CACHE_EXPIRATION_TIME) {
      // Cache expired, fetch fresh
      return fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              const headers = new Headers(responseClone.headers);
              headers.append('sw-cache-time', Date.now().toString());
              const newCachedResponse = new Response(responseClone.body, {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: headers
              });
              cache.put(request, newCachedResponse);
            });
          }
          return response;
        })
        .catch(() => cachedResponse); // Fallback to expired cache if offline
    }
  }
  return cachedResponse;
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Quote It', options)
  );
});

// Notify clients when service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Clear all caches (coordinated clear)
  if (event.data && event.data.type === 'CLEAR_ALL_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        console.log('[SW] Clearing all caches');
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        ).then(() => {
          // Notify caller that clear is complete
          event.ports[0]?.postMessage({ success: true });
        });
      })
    );
  }
  
  // Clear all caches on auth errors
  if (event.data && event.data.type === 'CLEAR_AUTH_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        console.log('[SW] Clearing all caches due to auth error');
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
