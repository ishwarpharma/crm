/* ================================================================
   sw.js  —  IshwarCRM Service Worker
   Minimal SW required for PWA installability on Android/Chrome.
   Caches the app shell so it loads offline after install.
   ================================================================ */

const CACHE = 'ishwarcrm-v1';
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
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first for CSV data, cache-first for shell assets
  if (e.request.url.endsWith('.csv')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
