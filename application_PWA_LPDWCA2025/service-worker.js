const CACHE_NAME = 'chat-app-pwa-cache';

const urlsToCache = [
  './index.html',
  './manifest.json',
  './main.js',
  './style.css',
  './rivescript-bot.js',
  './brain.rive'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mise en cache initiale');
      return cache.addAll(urlsToCache);
    }).catch((err) => {
      console.error('[Service Worker] Erreur de cache :', err);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Suppression ancien cache :', name);
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW] Réponse depuis le cache :', event.request.url);
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
          console.log('[SW] Cache nouvelle ressource :', event.request.url);
        });

        return networkResponse;
      }).catch(() => {
        return new Response('<h1>Hors ligne</h1><p>Impossible d’accéder à cette ressource.</p>', {
          headers: { 'Content-Type': 'text/html' }
        });
      });
    })
  );
});

self.addEventListener('push', (event) => {
  const title = 'Nouvelle notification !';
  const options = {
    body: event.data ? event.data.text() : 'Vous avez un nouveau message.',
    icon: 'https://placehold.co/192x192/075e54/ffffff?text=PWA',
    badge: 'https://placehold.co/72x72/075e54/ffffff?text=PWA'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée :', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('./index.html');
    })
  );
});
