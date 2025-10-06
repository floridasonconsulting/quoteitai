const CACHE_VERSION = 'quote-it-v' + Date.now();
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

  // Network-first strategy for HTML and API calls
  if (request.headers.get('accept')?.includes('text/html') || 
      url.pathname.includes('/api/') ||
      url.pathname.includes('/rest/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return a custom offline page if available
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Cache-first strategy for static assets (images, fonts, JS, CSS)
  if (request.destination === 'image' || 
      request.destination === 'font' ||
      request.destination === 'script' ||
      request.destination === 'style') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Check if cache is expired
          return cachedResponse.headers.get('sw-cache-time')
            ? checkCacheExpiration(cachedResponse, request)
            : cachedResponse;
        }
        
        // Fetch from network and cache
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              // Add timestamp to cached response
              const headers = new Headers(responseClone.headers);
              headers.append('sw-cache-time', Date.now().toString());
              const cachedResponse = new Response(responseClone.body, {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: headers
              });
              cache.put(request, cachedResponse);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for everything else
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
});
