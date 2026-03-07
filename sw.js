const CACHE_NAME = 'ghost-v1.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/hub.html',
  '/style.css',
  '/app.js',
  '/hub.js',
  '/theme-engine.js'
];

// Install Event: Save the "Ghost Core" to memory
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Fetch Event: Serve from cache first for speed, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});