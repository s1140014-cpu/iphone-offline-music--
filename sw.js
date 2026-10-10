
const CACHE_NAME = "offline-music-v1";

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([
      new URL("./", self.registration.scope).href,
      new URL("./index.html", self.registration.scope).href
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key.startsWith("offline-music-") &&
        key !== CACHE_NAME).map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok && request.mode === "navigate") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(
          new URL("./index.html", self.registration.scope).href,
          response.clone()
        );
      }
      return response;
    } catch (error) {
      const fallback = await caches.match(
        new URL("./index.html", self.registration.scope).href
      );
      if (fallback) return fallback;
      throw error;
    }
  })());
});
