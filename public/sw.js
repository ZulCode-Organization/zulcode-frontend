const CACHE = "zulcode-shell-v1";
const ASSET = /\\.(?:js|css|woff2?|png|jpe?g|svg|ico)$/i;

self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/"])).catch(() => undefined)));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && (request.mode === "navigate" || ASSET.test(new URL(request.url).pathname))) {
        const cache = await caches.open(CACHE); cache.put(request, response.clone());
      }
      return response;
    } catch {
      return (await caches.match(request)) || (request.mode === "navigate" ? await caches.match("/") : Response.error());
    }
  })());
});
