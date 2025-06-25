// Nom du cache pour les ressources de l'application
const CACHE_NAME = 'chat-app-pwa-cache-v1';

// Liste des fichiers à mettre en cache lors de l'installation du Service Worker
const urlsToCache = [
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com'
];

/**
 * @event install
 * @description 
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Cache ouvert, ajout des URLs');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Force l'activation du nouveau Service Worker
            .catch(error => {
                console.error('[Service Worker] Échec de la mise en cache lors de l\'installation:', error);
            })
    );
});

/**
 * @event activate
 * @description S'active lorsque le Service Worker est activé. Nettoie les anciens caches.
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activation...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Prend le contrôle immédiat des clients
    );
});

/**
 * @event fetch
 * @description Intercepte les requêtes réseau et sert les ressources depuis le cache si disponible (stratégie cache-first).
 */
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    console.log('[Service Worker] Servie depuis le cache:', event.request.url);
                    return response;
                }
                return fetch(event.request)
                    .then(async (networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                                console.log('[Service Worker] Mise en cache de la nouvelle ressource:', event.request.url);
                            });
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Échec de la récupération et de la mise en cache de la ressource:', event.request.url, error);
                        return new Response('<h1>Hors ligne</h1><p>Cette page n\'est pas disponible hors ligne.</p>', {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    });
            })
    );
});

/**
 * @event push (pour les futures notifications push, non implémentées ici mais structure nécessaire)
 * @description Gère les événements push (notifications envoyées par un serveur).
 */
self.addEventListener('push', (event) => {
    const title = 'Nouvelle notification push !';
    const options = {
        body: event.data ? event.data.text() : 'Vous avez un nouveau message.',
        icon: 'https://placehold.co/192x192/075e54/ffffff?text=PWA',
        badge: 'https://placehold.co/72x72/075e54/ffffff?text=PWA' 
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * @event notificationclick
 * @description 
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification cliquée:', event.notification.tag);
    event.notification.close(); 
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./index.html');
            }
        })
    );
});
