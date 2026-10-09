// Service Worker for Cuadrante ADIF Patrullas
// Clean up any stale caches to prevent blank screen issues
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Clean up only temporary app caches, strictly protecting persistent PK caches
      return Promise.all(
        cacheNames
          .filter((name) => !name.startsWith('adif-pk-'))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch fresh assets from network
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
