const CACHE_NAME = 'just-abacha-v1.1.4';
const ASSETS = [
  '/style.css',
  '/chat-list.js',
  '/app.js',
  '/chat-list.js',
  '/settings.js',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Fetch Event (Allows offline vibes)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 🚫 NEVER cache HTML navigation
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request));
    return;
  }

  // 🎨 Cache static assets only
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
