'use strict';
// Simple service worker for Panther Pay PWA
const CACHE_NAME = 'pantherpay-v1';
const CORE_ASSETS = [
  '/',
  '/assets/css/main.css?v=2',
  '/assets/js/main.js?v=2',
  '/assets/js/pwa.js?v=1',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

// Network-first for HTML, cache-first for others
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isHTML = req.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        return cached || cache.match('/');
      }
    })());
  } else {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        cache.put(req, resp.clone());
        return resp;
      } catch (e) {
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })());
  }
});
