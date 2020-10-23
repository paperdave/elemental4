var cacheName = 'ELEMENTAL';

// this worker is different from others, since all the cache management is done in
// the actual game, not the worker. all this worker does is 

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((r) => {
      // match a cached entry, if not it will run fetch
      return r || fetch(e.request);
    })
  );
});

// to get it to work without reloading we have to claim all pages,
// so any open pages before the install will get their fetch() intercepted
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});
