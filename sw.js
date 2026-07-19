const CACHE_NAME = 'accessplay-v62';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/index.html',
  '/admin.html',
  '/css/styles.css',
  '/css/admin.css',
  '/css/roulette.css',
  '/js/data.js',
  '/js/components.js',
  '/js/app.js',
  '/js/admin.js',
  '/js/tutorial.js',
  '/js/roulette.js',
  '/img/logo.png',
  '/img/favicon-192.png',
  '/img/favicon-512.png',
  '/img/favicon-32.png',
  '/404.html',
  '/admin-manifest.json'
];

// Install Event
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  self.clients.claim();
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event - Network First Strategy
self.addEventListener('fetch', event => {
  // Ignorar peticiones a la API o recursos externos para que siempre vayan a red
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        // Si no está en caché y falla la red, servir 404 (o offline fallback)
        if (event.request.destination === 'document') {
          return caches.match('/404.html');
        }
      });
    })
  );
});
