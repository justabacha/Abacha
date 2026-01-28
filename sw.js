self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (url.pathname.endsWith('.html')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
