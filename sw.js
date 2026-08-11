const CACHE_NAME = 'r2-nusantara-v3';
const urlsToCache = [
  '/R2-Nusantara/',
  '/R2-Nusantara/index.html',
  '/R2-Nusantara/style.css',
  '/R2-Nusantara/app.js',
  '/R2-Nusantara/data.js',
  '/R2-Nusantara/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).catch(function(){})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
