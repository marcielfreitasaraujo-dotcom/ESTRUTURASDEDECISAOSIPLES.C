/* FinUP PWA — cache somente de estáticos. Nunca HTML/API/dados financeiros. */
const CACHE_NAME = "finup-static-v1";
const PRECACHE = [
  "/static/css/app.css",
  "/static/js/app.js",
  "/static/js/sessao.js",
  "/static/js/dashboard.js",
  "/static/js/pwa-register.js",
  "/static/img/favicon-32.png",
  "/static/img/apple-touch-icon.png",
  "/static/img/logo.png",
  "/static/img/icon-192.png",
  "/static/img/icon-512.png",
  "/static/img/icon-192-maskable.png",
  "/static/img/icon-512-maskable.png",
  "/static/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function ehEstaticoSeguro(url) {
  try {
    const u = new URL(url);
    if (u.origin !== self.location.origin) return false;
    if (!u.pathname.startsWith("/static/")) return false;
    // nunca cachear uploads ou arquivos gerados fora de static
    return true;
  } catch (_e) {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Navegações e APIs: sempre rede (sem fallback HTML em cache)
  if (req.mode === "navigate" || !ehEstaticoSeguro(req.url)) {
    return;
  }

  // Estáticos: cache-first com atualização em background
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            cache.put(req, resp.clone());
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
