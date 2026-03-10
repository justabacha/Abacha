const CACHE_NAME = 'ghost-v1.0.7'; // Bumped version
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/hub.html',
  '/style.css',
  '/app.js',
  '/hub.js',
  '/theme-engine.js'
];

// 1. FAST INSTALL
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Return the promise so the browser knows when install is truly done
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. CLEANUP
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// 3. STABLE FETCH ENGINE
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // GHOST BYPASS: Do NOT cache Supabase or API calls
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/api/')) {
    return; // Let the browser handle these normally
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have it in cache, return it immediately
      if (cachedResponse) {
        // Optional: Update cache in background (Stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
        }).catch(() => {}); // Silent fail for background update
        
        return cachedResponse;
      }

      // If NOT in cache, go to network
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        console.error("Ghost SW Fetch Failed:", err);
        // Fallback for navigation errors could go here
      });
    })
  );
});