// sw.js
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open("v1").then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/style.css',
        '/app.js',
        '/manifest.json',
        '/assets/icons/icon-72x72.png',
        '/assets/icons/icon-96x96.png',
        '/assets/icons/icon-128x128.png'
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
