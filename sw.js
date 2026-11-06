'use strict';
const cacheName = 'a300-ge-three-shot-v4';
const assets = ['./index.html', './plot.js', './manifest.webmanifest', './icon.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('a300-ge-three-shot-') && key !== cacheName)
    .map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.open(cacheName).then(cache => cache.match('./index.html'))));
    return;
  }
  event.respondWith(caches.open(cacheName).then(cache => cache.match(request)).then(cached => cached || fetch(request)));
});
