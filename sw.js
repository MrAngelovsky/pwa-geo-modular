var CACHE_NAME = 'georeporte-v2';
var APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './geo-helper.js',
  './app.js',
  './manifest.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (nombres) {
        return Promise.all(
          nombres.map(function (nombre) {
            if (nombre !== CACHE_NAME) {
              return caches.delete(nombre);
            }
            return Promise.resolve(false);
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function (respuestaCache) {
        if (respuestaCache) {
          return respuestaCache;
        }

        return fetch(event.request)
          .then(function (respuestaRed) {
            if (!respuestaRed || respuestaRed.status !== 200 || respuestaRed.type === 'opaque') {
              return respuestaRed;
            }

            return caches.open(CACHE_NAME)
              .then(function (cache) {
                cache.put(event.request, respuestaRed.clone());
                return respuestaRed;
              });
          })
          .catch(function () {
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return Promise.reject(new Error('Recurso no disponible sin conexión.'));
          });
      })
  );
});
