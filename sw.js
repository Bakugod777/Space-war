/* Space War — service worker (offline completo). Sube VERSION en cada entrega. */
const VERSION = "v2.3.17";
const CACHE = "space-war-" + VERSION;

/** Todo lo necesario para jugar sin red (incl. música de jefe). */
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./sw.js",
  // JS
  "./js/constants.js",
  "./js/icons.js",
  "./js/moai-messages.js",
  "./js/store.js",
  "./js/sfx.js",
  "./js/settings.js",
  "./js/fx.js",
  "./js/ui-anime.js",
  "./js/difficulty.js",
  "./js/game.js",
  "./js/powerups.js",
  "./js/achievements.js",
  "./js/shop.js",
  "./js/foes.js",
  "./js/bosses.js",
  "./js/rogue.js",
  "./js/magia.js",
  "./js/sim.js",
  "./vendor/anime.min.js",
  // Fonts
  "./fonts/exo-2-latin-400-normal.woff2",
  "./fonts/exo-2-latin-600-normal.woff2",
  "./fonts/exo-2-latin-700-normal.woff2",
  "./fonts/orbitron-latin-400-normal.woff2",
  "./fonts/orbitron-latin-700-normal.woff2",
  "./fonts/orbitron-latin-900-normal.woff2",
  // Icons PWA
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  // Sprites / UI
  "./assets/Boss.png",
  "./assets/bosses-sheet.png",
  "./assets/paimon-sheet.png",
  "./assets/paimon.png",
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
  "./assets/meteoro/meteoro-sheet.png",
  "./assets/meteor.png",
  "./assets/player.png",
  "./assets/rerir.png",
  "./assets/tipos-sheet.png",
  "./assets/xiao.png",
  "./assets/xiao_heart.png",
  "./assets/xiao_weapon.png",
  // Audio de jefe (necesario en partida; ~1.4 MB)
  "./assets/music/boss-battle.ogg",
];

/** Cachea uno a uno: si falla un archivo, el resto igual queda offline (addAll falla todo). */
async function precacheAll() {
  const cache = await caches.open(CACHE);
  await Promise.all(
    ASSETS.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "reload" });
        if (res && res.ok) await cache.put(url, res);
      } catch (_) {
        /* un asset fallido no tumba el install */
      }
    })
  );
}

self.addEventListener("install", (e) => {
  e.waitUntil(precacheAll().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("space-war-") && k !== CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const url = new URL(req.url);
  const path = url.pathname;

  // Shell (HTML/JS/CSS): red primero si hay señal; si no, cache (partida / offline).
  const live =
    req.mode === "navigate" ||
    path.endsWith(".html") ||
    path.endsWith(".js") ||
    path.endsWith(".css") ||
    path.endsWith("/sw.js") ||
    /\/(index\.html)?$/.test(path);

  if (live) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(req, { ignoreSearch: true })
            .then((hit) => hit || caches.match("./index.html"))
        )
    );
    return;
  }

  // Imágenes, fonts, música: cache primero → sin cortes mid-partida
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => undefined);
    })
  );
});
