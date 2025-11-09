// firebase-messaging-sw.js

// --- PWA Cache Logic ---
// This part remains to provide offline capabilities for the PWA.
const CACHE_NAME = 'swapit-cache-v1';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.js',
  '/vite.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// --- Firebase Messaging Logic has been removed ---
// Push notifications are now handled natively via the Capacitor Push Notifications plugin.
// This ensures reliable delivery on both iOS and Android.
