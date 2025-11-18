// firebase-messaging-sw.js

// --- PWA Cache Logic ---
const CACHE_NAME = 'swapit-cache-v2';
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
  // Para las peticiones de navegación, intentamos ir a la red primero.
  // Si falla (estamos offline), servimos la página principal desde la caché.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // Para todos los demás recursos (assets, etc.), usamos la estrategia "stale-while-revalidate".
  // Esto sirve el contenido desde la caché inmediatamente si está disponible (rápido),
  // y al mismo tiempo, busca una versión actualizada en la red para la próxima vez.
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // Si la petición a la red tiene éxito, la guardamos en caché para futuras visitas.
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });

          // Devolvemos la respuesta de la caché si existe, si no, esperamos la respuesta de la red.
          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});


// --- Firebase Messaging Logic has been removed ---
// Push notifications are now handled natively via the Capacitor Push Notifications plugin.
// This ensures reliable delivery on both iOS and Android.