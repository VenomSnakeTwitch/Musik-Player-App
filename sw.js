const CACHE_NAME = 'venomplayer-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/DogVenomsnakeLogo.png',
  '/musicbackground.png'
  // Füge später Icons hinzu, KEINE MP3s!
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.endsWith('.mp3')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
