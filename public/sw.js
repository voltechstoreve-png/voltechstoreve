// ✅ SW kamikaze: limpia TODAS las cachés y se desregistra.
// Mata cualquier Service Worker viejo que sirva código stale.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
  );
});

// No interceptar nada: que todo venga de la red
self.addEventListener('fetch', () => {});