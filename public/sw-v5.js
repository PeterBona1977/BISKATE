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
