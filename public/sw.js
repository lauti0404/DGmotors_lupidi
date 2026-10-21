const CACHE = "dg-motors-erp-v2";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch("/precache.json", { cache: "no-store" });
      const files = await response.json();
      await cache.addAll(files);
    } catch {
      await cache.addAll(["/", "/index.html", "/manifest.json", "/favicon.svg"]);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function fromCacheOrNetwork(request) {
  const cache = await caches.open(CACHE);
  if (request.mode === "navigate") {
    try {
      const fresh = await fetch(request);
      if (fresh && fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    } catch {
      return (await cache.match(request)) || (await cache.match("/index.html")) || new Response("Sin conexión", { status: 503 });
    }
  }
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  const fresh = await network;
  if (fresh) return fresh;
  if (request.mode === "navigate") {
    return (await cache.match("/index.html")) || new Response("Sin conexión", { status: 503 });
  }
  return new Response("Sin conexión", { status: 503 });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const font = url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com");
  if (url.origin !== self.location.origin && !font) return;
  event.respondWith(fromCacheOrNetwork(request));
});
