var cacheName = 'ELEMENTAL';
var contentToCache = [
  '/',
  '/logo.svg',
  '/no-element.svg',
  '/game.html',
  '/font.css',
  '/icon/android-icon-192x192.png',
  '/icon.png',
  '/p5.min.js',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      const v = new URL(location).searchParams.get('v');
      return cache.addAll(contentToCache.concat('/elemental.js?v=' + v));
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if(key !== cacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
      return r || fetch(e.request).then((response) => {
        if (
          e.request.url.startsWith(location.origin + '/icon')
          || e.request.url.startsWith(location.origin + '/elemental.js')
        ) {
          return caches.open(cacheName).then(async(cache) => {
            if (e.request.url.startsWith(location.origin + '/elemental.js')) {
              (await cache.keys()).filter(x => x.url.startsWith(location.origin + '/elemental.js')).forEach((x) => {
                cache.delete(x);
              })
            }
            cache.put(e.request, response.clone());
            return response;
          });
        } else {
          return response;
        }
      });
    })
  );
});
