const CACHE_NAME = 'focusflow-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/animations.css',
  '/css/premium.css',
  '/js/app.js',
  '/js/storage.js',
  '/js/tasks.js',
  '/js/analytics.js',
  '/js/pomodoro.js',
  '/js/ui.js',
  '/js/cursor.js',
  '/js/charts.js',
  '/js/settings.js',
  '/js/visuals.js',
  '/js/onboarding.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache assets but don't fail if some are missing yet
        return Promise.allSettled(
          ASSETS.map(url => cache.add(url).catch(err => console.log(`Failed to cache ${url}`)))
        );
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
