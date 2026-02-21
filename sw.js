const CACHE_NAME = 'venomsnake-player-v2';  // ← Versionsnummer erhöhen bei Änderungen!

const ASSETS_TO_CACHE = [
  '/',                        // Root → oft index.html redirect
  '/index.html',
  '/manifest.webmanifest',    // ← .webmanifest statt .json (aktueller Standard)
  '/DogVenomsnakeLogo.png',   // Logo & Hintergrund cachen
  '/musicbackground.png',
  // Füge ggf. weitere kleine Assets hinzu (CSS/JS wenn ausgelagert)
  // KEINE .mp3 hier – siehe Erklärung unten
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.error('[SW] Install fehlgeschlagen:', err))
  );
  self.skipWaiting();  // Sofort aktiv werden
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                  .map(name => caches.delete(name))
      );
    }).then(() => {
      console.log('[SW] Alte Caches gelöscht');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. GitHub Pages MP3-Requests immer direkt ans Netz (kein Cache!)
  if (url.pathname.endsWith('.mp3') || url.hostname.includes('githubusercontent.com')) {
    event.respondWith(fetch(event.request).catch(() => {
      // Optional: Offline-Fallback, z. B. "Kein Netz – Song nicht verfügbar"
      return new Response('Offline – MP3 nicht verfügbar', { status: 503 });
    }));
    return;
  }

  // 2. Alles andere → klassisch Cache → Network → Cache
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        // Optional: nur erfolgreiche Responses cachen (status 200)
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback für offline (z. B. für HTML eine Offline-Seite)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
