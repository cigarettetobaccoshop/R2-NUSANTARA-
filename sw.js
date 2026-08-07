const CACHE_NAME = 'r2-nusantara-v2';
const urlsToCache = [
  '.',
  'index.html',
  'style.css',
  'data.js',
  'app.js',
  'manifest.json',
  'assets/logo/logo.png',
  'assets/logo/hero-bg.jpg',
  'assets/logo/footer-bg.jpg',
  'assets/logo/loader-bg.jpg',
  'assets/logo/watermark.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});