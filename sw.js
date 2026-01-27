const CACHE_NAME = 'just-abacha-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/hub.html',
  '/chat.html',
  '/style.css',
  '/app.js'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Fetch Event (Allows offline vibes)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
