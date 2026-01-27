const CACHE_NAME = 'just-abacha-v1.0.2';
const ASSETS = [
  '/',
  '/index.html',
  '/chat-list.html',
  '/chat-list.js',
  '/hub.html',
  '/chat.html',
  '/settings.html',
  '/requests.html',
  '/profile.html',
  '/style.css',        // Your main design
  '/app.js',          // Your main logic
  '/theme-engine.js',  // Your Ghost visuals
  '/manifest.json'     // Your App Identity
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
