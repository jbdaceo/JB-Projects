// Service Worker for TMC Teacher
// Handles offline functionality and origin mismatches

const CACHE_VERSION = 'v1-tmc-2025-01-07';
const CACHE_ASSETS = ['/', '/index.html', '/index.css'];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        return cache.addAll(CACHE_ASSETS).catch(() => {
          console.log('[SW] Some assets unavailable, continuing...');
        });
      })
      .then(() => self.skipWaiting())
      .catch((error) => console.error('[SW] Install error:', error))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_VERSION) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
      .catch((error) => console.error('[SW] Activate error:', error))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // API calls - stale-while-revalidate
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const cloned = response.clone();
                caches.open(CACHE_VERSION)
                  .then((cache) => cache.put(request, cloned))
                  .catch(() => {});
              }
              return response;
            })
            .catch(() => cached || new Response(JSON.stringify({ error: 'Offline' }), { status: 503 }));
          return cached || fetchPromise;
        })
        .catch(() => new Response(JSON.stringify({ error: 'Offline' }), { status: 503 }))
    );
    return;
  }

  // Static assets - cache-first
  if (url.pathname.match(/\.(js|css|woff2|png|jpg|gif|svg|webp)$/i)) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const cloned = response.clone();
                caches.open(CACHE_VERSION)
                  .then((cache) => cache.put(request, cloned))
                  .catch(() => {});
              }
              return response;
            })
            .catch(() => cached || new Response('Failed to load', { status: 503 }));
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // HTML - network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_VERSION)
            .then((cache) => cache.put(request, cloned))
            .catch(() => {});
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .catch(() => new Response('Offline', { status: 503 }));
      })
  );
});

console.log('[SW] Service Worker loaded');