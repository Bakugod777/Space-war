/* Space War — service worker (offline). Sube VERSION en cada entrega. */
const VERSION = "v2.2.7";
const CACHE = "space-war-" + VERSION;
const ASSETS = [
  "./assets/meteoro/meteoro-sheet.png",
  "./",
  "./difficulty.js",
  "./assets/Boss.png",
  "./assets/arlee.png",
  "./assets/brand/corte-tijera.png",
  "./assets/brand/estrella-sheet.png",
  "./assets/brand/logo.png",
  "./assets/brand/logo@2x.png",
  "./assets/brand/logo@3x.png",
  "./assets/cyno.png",
  "./assets/enemigos-sheet.png",
  "./assets/enemy1.png",
  "./assets/enemy2.png",
  "./assets/enemy3.png",
  "./assets/enemy4.png",
  "./assets/flins.png",
  "./assets/heart.png",
  "./assets/ifa.png",
  "./assets/kit.png",
  "./assets/laberinto/fondo_far_fase1.png",
  "./assets/laberinto/fondo_far_fase2.png",
  "./assets/laberinto/fondo_far_fase3.png",
  "./assets/laberinto/fondo_near_fase1.png",
  "./assets/laberinto/fondo_near_fase2.png",
  "./assets/laberinto/fondo_near_fase3.png",
  "./assets/laberinto/gema-sheet.png",
  "./assets/laberinto/magia_marco.png",
  "./assets/laberinto/magia_relleno.png",
  "./assets/laberinto/semilla-sheet.png",
  "./assets/laberinto/semilla_idle.png",
  "./assets/meteor.png",
  "./assets/player.png",
  "./assets/rerir.png",
  "./assets/tipos-sheet.png",
  "./assets/xiao.png",
  "./assets/xiao_heart.png",
  "./assets/xiao_weapon.png",
  "./foes.js",
  "./fonts/exo-2-latin-400-normal.woff2",
  "./fonts/exo-2-latin-600-normal.woff2",
  "./fonts/exo-2-latin-700-normal.woff2",
  "./fonts/orbitron-latin-400-normal.woff2",
  "./fonts/orbitron-latin-700-normal.woff2",
  "./fonts/orbitron-latin-900-normal.woff2",
  "./fx.js",
  "./game.js",
  "./icons.js",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./index.html",
  "./magia.js",
  "./manifest.webmanifest",
  "./moai-messages.js",
  "./rogue.js",
  "./settings.js",
  "./sfx.js",
  "./sim.js",
  "./store.js",
  "./style.css",
  "./ui-anime.js",
  "./vendor/anime.min.js"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("space-war-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) =>
      hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => (req.mode === "navigate" ? caches.match("./index.html") : undefined))
    )
  );
});
