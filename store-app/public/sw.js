self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy for dynamic content
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});
