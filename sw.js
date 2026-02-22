const CACHE_NAME = 'venomplayer-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/DogVenomsnakeLogo.png',
  '/musicbackground.png'
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
  // MP3-Dateien direkt vom Server laden, da sie extern liegen
  if (event.request.url.includes('.mp3')) {
    event.respondWith(
      fetch(event.request, { mode: 'cors' }) 
    );
    return;
  }

  // Alles andere aus dem Cache oder Netzwerk
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
