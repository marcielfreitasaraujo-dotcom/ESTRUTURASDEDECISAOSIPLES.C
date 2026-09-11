export function serviceWorkerScript(build: string) {
  const id = JSON.stringify(build || "dev");
  return `const BUILD = ${id};
const STATIC_CACHE = "comanda-ia-static-" + BUILD;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        client.postMessage({ type: "COMANDA_UPDATED", build: BUILD });
      }
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function mustBypassCache(request) {
  if (request.method !== "GET") return true;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return true;
  if (request.mode === "navigate") return true;
  if (request.headers.get("rsc") === "1" || url.searchParams.has("_rsc")) return true;
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname === "/sw.js" || url.pathname.endsWith("manifest.webmanifest")) return true;
  if (url.pathname === "/entrar" || url.pathname.startsWith("/app") || url.pathname.startsWith("/caixa")) return true;
  if (url.pathname.startsWith("/garcom") || url.pathname.startsWith("/entrega") || url.pathname.startsWith("/admin")) {
    return true;
  }
  if (url.pathname === "/" || url.pathname.startsWith("/loja")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (mustBypassCache(request)) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  const url = new URL(request.url);
  if (!url.pathname.startsWith("/_next/static/")) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    }),
  );
});
`;
}