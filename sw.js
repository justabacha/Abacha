const CACHE_NAME = 'ghost-v1.0.2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/hub.html',
  '/style.css',
  '/app.js',
  '/hub.js',
  '/theme-engine.js'
];

// 1. FAST INSTALL: Don't wait for files to cache to activate
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the new service worker to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll, but we don't return it to event.waitUntil 
      // This lets the worker install even if the cache takes a second
      cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. CLEANUP: Delete old ghost caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// 3. SMART FETCH: Serve from cache but update in background
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update the cache with the new version from the network
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Silent fail for network errors (already serving cache)
      });

      // Return cached version immediately, or wait for network if not in cache
      return cachedResponse || fetchPromise;
    })
  );
});