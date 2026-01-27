const CACHE_NAME = 'just-abacha-v1.0.7';
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

  // 🔓 Always fetch fresh auth & navigation pages
  if (
    url.pathname === '/' ||
    url.pathname.endsWith('.html')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 🎨 Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
