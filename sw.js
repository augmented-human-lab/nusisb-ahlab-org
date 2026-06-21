// Service worker. VERSION is rewritten by server.js on startup to bust the cache.
const VERSION = 'static-20260621-authgate';
const CACHE = 'nus-isb-' + VERSION;

const SHELL = [
  './',
  './index.html',
  './auth-callback/',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(SHELL.map(u => c.add(u).catch(() => null)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Live API responses — never cache; let the network fail naturally when offline.
  if (url.pathname.startsWith('/api/')) return;

  // Network-first for HTML — users get fresh content; cache is offline fallback.
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const c = await caches.open(CACHE);
        c.put(req, res.clone());
        return res;
      } catch {
        const cached = await caches.match(req);
        return cached || caches.match('./index.html');
      }
    })());
    return;
  }

  // Cache-first for static assets.
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') {
        const c = await caches.open(CACHE);
        c.put(req, res.clone());
      }
      return res;
    } catch {
      return cached || Response.error();
    }
  })());
});
