// Minimal Service Worker to enable PWA installability - v5 (NUCLEAR FORCE)
console.log('🚀 SW: v5 Script Loaded');

const CACHE_NAME = 'biskate-v5';
const ASSETS_TO_CACHE = [
    '/dashboard',
    '/manifest-v5.json',
    '/biskate-icon-192.png',
    '/biskate-icon-512.png',
    '/favicon.ico'
];

self.addEventListener('install', (event) => {
    console.log('🚀 SW: Install event firing');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('🚀 SW: Activate event firing');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Web Push Notification Listener
self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.body || 'Nova notificação de emergência!',
                icon: '/biskate-icon-192.png',
                badge: '/favicon.ico',
                vibrate: [200, 100, 200, 100, 200, 100, 200],
                requireInteraction: true,
                data: {
                    url: data.url || '/dashboard/provider/emergency'
                },
            };
            event.waitUntil(
                self.registration.showNotification(data.title || '🚨 URGENTE: Biskate', options)
            );
        } catch (e) {
            console.error('Error parsing push data:', e);
            event.waitUntil(
                self.registration.showNotification('🚨 Emergência', {
                    body: event.data.text() || 'Nova notificação!',
                    icon: '/biskate-icon-192.png',
                    vibrate: [200, 100, 200],
                    requireInteraction: true,
                })
            );
        }
    }
});

// Handle Notification Clicks (resume app or open)
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            const urlToOpen = event.notification.data?.url || '/dashboard/provider';
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // If so, just focus it.
                if (client.url.includes('biskate') && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
