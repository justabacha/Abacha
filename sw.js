const CACHE_NAME = 'ghost-v1.1.1'; // Bumped version
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
// 4. GHOST PUSH & ACTIONS (Tuned for Background Vibes)
self.addEventListener('push', (event) => {
    let data = { title: 'New Vibe Received', body: 'Someone sent a ghost...' };
    
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        console.error("Push data wasn't JSON:", e);
    }
    
    const options = {
        body: data.body,
        icon: '/icon-192-v2.png', 
        badge: '/icon-192-v2.png',
        vibrate: [200, 100, 200],
        tag: 'ghost-vibe', // This groups notifications so they don't stack messy
        renotify: true,
data: { 
            senderId: data.senderId, 
            url: `/chat.html?friend_id=${data.senderId}` 
        }
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. HANDLE NOTIFICATION CLICKS (Updated for Chat.html)
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const targetUrl = notification.data.url;

    notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if chat.html is already open with the RIGHT friend
            for (const client of clientList) {
                const clientUrl = new URL(client.url);
                if (clientUrl.pathname.includes('chat.html') && clientUrl.search.includes(`friend_id=${notification.data.senderId}`)) {
                    if ('focus' in client) return client.focus();
                }
            }
            // If chat isn't open or is on a different friend, open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});