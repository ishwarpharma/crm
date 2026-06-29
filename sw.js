/* ================================================================
   sw.js  —  IshwarCRM Service Worker
   Network-first strategy: always tries network so updates show
   immediately. Falls back to cache when offline.
   ================================================================ */

const CACHE = 'ishwarcrm-v6';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './users.js',
  './site.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  // Pre-cache shell but don't wait — network-first means we always
  // try the network anyway, cache is just the offline fallback.
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // Delete ALL old caches so stale files never serve.
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first for everything: try network, update cache, fall back to cache.
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Clone and cache the fresh response
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
