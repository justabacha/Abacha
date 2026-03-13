const CACHE_NAME = 'ghost-v1.1.0'; // Bumped version
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
// 4. GHOST PUSH & ACTIONS
self.addEventListener('push', (event) => {
    // 1. Extract the data sent from the Supabase Edge Function
    const data = event.data ? event.data.json() : { title: 'New Vibe', body: 'Someone sent a ghost...' };
    
    const options = {
        body: data.body,
        icon: 'icon-192-v2.png', // Ensure this file exists in your root folder!
        badge: 'icon-192-v2.png',
        vibrate: [100, 50, 100],
        data: { 
            senderId: data.senderId, 
            url: `/hub.html?friend_id=${data.senderId}` 
        },
        actions: [
            { action: 'reply', title: 'Reply ✍️', type: 'text', placeholder: 'Type vibe...' },
            { action: 'read', title: 'Mark Read ✓' }
        ]
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. HANDLE NOTIFICATION CLICKS
self.addEventListener('notificationclick', (event) => {
    const action = event.action;
    const notification = event.notification;
    const senderId = notification.data.senderId;

    if (action === 'read') {
        // Logic to hit Supabase and mark as read silently
        notification.close();
    } else if (action === 'reply') {
        // Grab the text from event.reply
        const replyText = event.reply;
        // Logic to insert into Supabase messages table
        notification.close();
    } else {
        // Normal click: open the chat
        event.waitUntil(clients.openWindow(notification.data.url));
        notification.close();
    }
});