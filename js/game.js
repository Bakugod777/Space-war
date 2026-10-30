/**
 * Space War — núcleo del juego (bucle, jugador, combate, jefe).
 * Módulos satélite (cargar después de este archivo):
 *   powerups.js · achievements.js · shop.js · foes.js · bosses.js
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const playerNameInput = document.getElementById("playerName");
const startGameBtn = document.getElementById("startGame");
const scoreDisplay = document.getElementById("score");
const menu = document.getElementById("menu");
const levelDisplay = document.createElement("div");
const heartsDisplay = document.createElement("div");
const gameOverDisplay = document.createElement("div");

levelDisplay.id = "levelDisplay";
levelDisplay.textContent = "Nivel: 1";
document.getElementById("game-container").appendChild(levelDisplay);

heartsDisplay.id = "heartsDisplay";
document.getElementById("game-container").appendChild(heartsDisplay);

function refreshTouchUiMode() {
  // Controles táctiles solo en celular/tablet (o viewport estrecho táctil).
  // Layout fijo zurdo: disparo izquierda / joystick derecha.
  const mq = window.matchMedia
    ? {
        coarse: window.matchMedia("(pointer: coarse)").matches,
        noHover: window.matchMedia("(hover: none)").matches,
        narrow: window.matchMedia("(max-width: 900px)").matches,
      }
    : { coarse: false, noHover: false, narrow: window.innerWidth <= 900 };
  const hasTouch =
    "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0;
  // Celular/tablet: puntero grueso o sin hover. No forzar solo por ancho (evita HUD en desktop).
  const touchUi = mq.coarse || mq.noHover || (hasTouch && mq.narrow);
  document.body.classList.toggle("touch-ui", !!touchUi);
  const lh = localStorage.getItem("sw_hand") !== "diestro";
  document.body.classList.toggle("left-handed", lh);
  document.body.classList.toggle("right-handed", !lh);
  const touchControls = document.getElementById("touchControls");
  if (touchControls) {
    touchControls.setAttribute(
      "aria-hidden",
      document.body.classList.contains("game-running") && touchUi
        ? "false"
        : "true"
    );
  }
}
refreshTouchUiMode();
window.addEventListener("resize", refreshTouchUiMode);
window.addEventListener("orientationchange", refreshTouchUiMode);

gameOverDisplay.id = "gameOverDisplay";
gameOverDisplay.setAttribute("role", "dialog");
gameOverDisplay.setAttribute("aria-modal", "true");
gameOverDisplay.setAttribute("aria-label", "Fin de partida");
gameOverDisplay.hidden = true;
gameOverDisplay.innerHTML =
  "<div class='go-card'>" +
  "<div class='go-summary-slot'></div>" +
  "<div class='go-title'>se acabó la ronda</div>" +
  "<button type='button' id='restartBtn'>otra vez</button>" +
  "</div>";
// Overlay a body: no queda atrapado en el campo estrecho de escritorio
document.body.appendChild(gameOverDisplay);

// Lienzo nítido según devicePixelRatio (limitado a 2 por rendimiento)
let GW = window.innerWidth, GH = window.innerHeight, WORLD_SCALE = 1;
function resizeCanvas() {
  const vv = window.visualViewport;
  const __q = new URLSearchParams(location.search), __sim = __q.get("sim") === "1";
  // En la simulación el campo lógico es fijo (390×844 por defecto, ?simvw=&simvh=), así el resultado no depende de la ventana del navegador.
  const vw = __sim ? (parseInt(__q.get("simvw"), 10) || 390) : Math.round(vv ? vv.width : window.innerWidth);
  const vh = __sim ? (parseInt(__q.get("simvh"), 10) || 844) : Math.round(vv ? vv.height : window.innerHeight);
  // Escritorio (sin pantalla táctil y en horizontal): campo vertical de al menos 390×700, centrado.
  // A los costados se ve el laberinto lejano atenuado; el HUD vive dentro del campo.
  const __coarse = !__sim && window.matchMedia && matchMedia("(pointer: coarse)").matches;
  const desk = !__coarse && vw > vh;
  let fieldW = vw;
  if (desk) {
    WORLD_SCALE = Math.max(1, Math.floor(Math.min(vw / 390, vh / 700))); // la mayor escala entera que cabe
    GH = Math.floor(vh / WORLD_SCALE);
    GW = Math.min(Math.floor(vw / WORLD_SCALE), Math.max(390, Math.round(GH * 0.56)));
    fieldW = GW * WORLD_SCALE;
  } else {
    // Escala entera del mundo: el arte de 32 px nunca se estira a tamaños raros.
    WORLD_SCALE = Math.max(1, Math.floor(Math.min(vw / 360, vh / 360))); // la mayor escala entera que cabe
    GW = Math.floor(vw / WORLD_SCALE);
    GH = Math.floor(vh / WORLD_SCALE);
  }
  document.body.classList.toggle("desk-field", desk);
  document.documentElement.style.setProperty("--fw", fieldW + "px");
  document.documentElement.style.setProperty("--fx", Math.floor((vw - fieldW) / 2) + "px");
  const dpr = Math.min(window.devicePixelRatio || 1, vw * vh > 1.2e6 ? 1.5 : 2);
  canvas.width = Math.round(fieldW * dpr);
  canvas.height = Math.round(vh * dpr);
  canvas.style.width = fieldW + "px";
  canvas.style.height = vh + "px";
  ctx.setTransform(dpr * WORLD_SCALE, 0, 0, dpr * WORLD_SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false; // pixel art nítido
  if (typeof VFX !== "undefined") VFX.resize(GW, GH);
}
resizeCanvas();


// ===== Reloj de juego: todos los temporizadores de gameplay avanzan con el bucle
// principal, así que la pausa y las pestañas ocultas los detienen.
let FK = 1; // factor delta-time (1 = 60 Hz)
// RNG con semilla SOLO para gameplay (spawns, oleadas, cartas, drops). Los efectos usan Math.random.
let __rngState = 1;
function RNG() {
  __rngState |= 0; __rngState = (__rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(__rngState ^ (__rngState >>> 15), 1 | __rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function seedRNG(seed) { __rngState = seed >>> 0; }
window.RNG = RNG; window.seedRNG = seedRNG;
const gameNow = () => GameClock.t; // reloj del juego (se congela en pausa)
const GameClock = {
  t: 0, id: 1, jobs: new Map(),
  add(fn, ms, repeat) { const id = this.id++; this.jobs.set(id, { fn, ms, at: this.t + ms, repeat }); return { __g: id }; },
  clear(h) { if (h && h.__g) this.jobs.delete(h.__g); else if (h) { gClear(h); clearTimeout(h); } },
  tick(dt) {
    this.t += dt;
    for (const [id, j] of this.jobs) {
      if (this.t >= j.at) {
        if (j.repeat) j.at += j.ms; else this.jobs.delete(id);
        try { j.fn(); } catch (e) { console.error(e); }
      }
    }
  },
  reset() { this.jobs.clear(); this.t = 0; },
};
const gSetTimeout = (fn, ms) => GameClock.add(fn, ms, false);
const gSetInterval = (fn, ms) => GameClock.add(fn, ms, true);
const gClear = (h) => GameClock.clear(h);
let gamePaused = false;
const SIM = new URLSearchParams(location.search).get("sim") === "1";
let __lastFrameTs = performance.now();
let __killStreakAnnounce = 0;

if (window.visualViewport) window.visualViewport.addEventListener("resize", () => window.dispatchEvent(new Event("resize")));
window.addEventListener("resize", () => {
  resizeCanvas();
  player.x = Math.min(Math.max(0, player.x), GW - player.width);
  player.y = Math.min(Math.max(0, player.y), GH - player.height);

  // Actualizar clases de responsive para elementos activos
  const notification = document.getElementById("achievementNotification");
  const modal = document.getElementById("achievementModal");

  if (notification && notification.classList.contains("show")) {
    if (isMobileDevice()) {
      notification.classList.add("mobile-notification");
    } else {
      notification.classList.remove("mobile-notification");
    }
  }

  // Ajustar modal si está abierto
  if (modal && modal.style.display === "flex") {
    if (isMobileDevice()) {
      modal.classList.add("mobile-modal");
    } else {
      modal.classList.remove("mobile-modal");
    }
  }
});

// Variables del jugador
const player = {
  x: GW / 2,
  y: GH - 80,
  width: 32,
  height: 32,
  speed: 7,
  image: new Image(),
  movingLeft: false,
  movingRight: false,
  movingUp: false,
  movingDown: false,
  shooting: false,
  canShoot: true, // Variable para controlar la cadencia de disparo
  hearts: 3, // Corazones del jugador
};
player.image.src = "assets/player.png";

let bullets = []; // Balas del jugador
let enemies = []; // Enemigos
let kits = []; // Kits de salud
let meteors = []; // Meteoritos
let enemyBullets = []; // Balas enemigas
window.enemyBullets = enemyBullets; // foes/bosses empujan aquí sin ambigüedad de scope
let xiaos = []; // Array para los kits especiales xiao
let arlees = []; // Array para los power-ups de velocidad de disparo
let cynos = []; // Array para los power-ups de invulnerabilidad
let flins = []; // Array para los power-ups de puntos dobles
let rerirs = []; // Array para los power-ups de corazón temporal
let hasTemporaryHeart = false; // Control del corazón temporal
let temporaryHeartTimer = null;
let temporaryHeartTimeLeft = 10; // 10 segundos de corazón temporal
let hasFireRateBoost = false; // Control del power-up activo
let normalFireRate = (typeof CONFIG !== "undefined" ? CONFIG.PLAYER.NORMAL_FIRE_MS : 500);
let boostedFireRate = (typeof CONFIG !== "undefined" ? CONFIG.PLAYER.BOOSTED_FIRE_MS : 150);
let hasDoublePoints = false; // Control del power-up de puntos dobles
let doublePointsTimer = null;
let doublePointsTimeLeft = 30; // 30 segundos de puntos dobles
let maxHearts = (typeof CONFIG !== "undefined" ? CONFIG.PLAYER.MAX_HEARTS : 3);
let hasExtraHeart = false; // Controla si el jugador tiene el corazón extra
let isInvulnerable = false; // Control de invulnerabilidad
let invulnerabilityTimer = null;
let invulnerabilityTimeLeft = (typeof CONFIG !== "undefined" ? CONFIG.PLAYER.INVULN_SECS : 6);
let score = 0;
let level = 1;
let gameRunning = false;
let playerName = "";
let powerUpTimer = null;
let powerUpTimeLeft = 30;
let isFireRateReduced = false;
let fireRateDebuffTimer = null;
let boss = null;

// Funciones temporales para evitar errores (se redefinen más abajo)
let bossActive = false;
let bossHealth = 40; // laberinto con 3 fases
const bossName = "Paimon · Guía de Emergencia";
let fireRateDebuffTimeLeft = 10; // segundos
const powerUpTimerDisplay = document.getElementById("powerUpTimer");
const timerSpan = document.getElementById("timer");

let joystickActive = false;
let joyTouchId = null;
let joystickCenter = { x: 0, y: 0 };
let maxJoystickDistance = 45; // Reducir de 50 a 40 para un control más preciso
const deadzone = 7; // Reducir de 10 a 7 para mejor respuesta a movimientos pequeños

const shootButton = document.getElementById("shootButton");

function bindShootControl(el) {
  if (!el) return;
  const down = (e) => {
    e.preventDefault();
    player.shooting = true;
  };
  const up = (e) => {
    e.preventDefault();
    player.shooting = false;
  };
  el.addEventListener("touchstart", down, { passive: false });
  el.addEventListener("touchend", up, { passive: false });
  el.addEventListener("touchcancel", up, { passive: false });
  el.addEventListener("mousedown", down);
  el.addEventListener("mouseup", up);
  el.addEventListener("mouseleave", up);
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}
bindShootControl(shootButton);

startGameBtn.addEventListener("click", () => {
  playerName = playerNameInput.value || "Jugador";
  document.body.classList.add("game-running");
  refreshTouchUiMode();
  gameRunning = true;

  const begin = () => startGame();
  if (typeof UIAnime !== "undefined") {
    UIAnime.startTransition(menu, canvas, begin);
  } else {
    menu.style.display = "none";
    canvas.style.display = "block";
    begin();
  }
});

// Teclado remapeable (Controls en settings.js): flechas / IJKL + Enter / Shift derecho.
function __applyKey(e, down) {
  if (typeof Controls === "undefined") return;
  const a = Controls.actionFor(e.code);
  if (!a) return;
  if (document.activeElement && document.activeElement.tagName === "INPUT") return;
  e.preventDefault();
  if (a === "left") player.movingLeft = down;
  else if (a === "right") player.movingRight = down;
  else if (a === "up") player.movingUp = down;
  else if (a === "down") player.movingDown = down;
  else if (a === "fire") player.shooting = down;
  if (down && a !== "fire") player.speed = 7;
}
document.addEventListener("keydown", (e) => __applyKey(e, true));
document.addEventListener("keyup", (e) => __applyKey(e, false));

const shootSound = SFX.audio("shoot");

// Partículas al disparar (canvas VFX)
function createBulletParticles(x, y) {
  if (typeof VFX !== "undefined") VFX.muzzleFlash(x, y);
}

// Estela de balas ahora la dibuja el motor VFX en canvas
function createBulletTrailParticles(x, y) {
  /* no-op: trails renderizados por VFX.drawBullet */
}

const cooldownBar = document.getElementById("shootCooldownFill");
const cooldownBarMobile = document.getElementById("shootCooldownFillMobile");

function pulseCooldownBars(cooldownMs) {
  [cooldownBar, cooldownBarMobile].forEach((bar) => {
    if (!bar) return;
    bar.style.transition = "none";
    bar.style.width = "0%";
    void bar.offsetWidth;
    bar.style.transition = `width ${cooldownMs}ms linear`;
    bar.style.width = "100%";
  });
}

function shoot() {
  if (player.canShoot) {
    const bulletX = player.x + 20;
    const bulletY = player.y;
    bullets.push({ x: bulletX + (RNG() - 0.5) * 2, y: bulletY, speed: 10, pierce: Rogue.mods.pierce });
    Rogue.extraBullets(bulletX, bulletY);
    player.recoil = 3;
    shootSound.play();
    if (typeof Haptics !== "undefined") Haptics.buzz("shoot");
    player.canShoot = false;

    // Efecto de partículas al disparar
    createBulletParticles(bulletX + 2, bulletY);

    // Actualizar estadísticas de disparos
    updateStatsOnShoot();

    // Cadencia según si tiene boost o no
    const cooldown = (hasFireRateBoost ? boostedFireRate : normalFireRate) * Rogue.mods.fireRate;
    pulseCooldownBars(cooldown);

    gSetTimeout(() => {
      player.canShoot = true;
    }, cooldown);
  }
}

function spawnEnemy() {
  const enemy = {
    x: RNG() * (GW - 50),
    y: -50,
    width: 40,
    height: 40,
    speed: RNG() * 2 + 1,
    health: 1,
    image: new Image(),
    canShoot: true, // todas las naves legacy disparan
    lastShot: null, // primer tiro al entrar en pantalla
    fireGap: Math.max(650, 1100 - level * 45),
  };

  // Determinar el tipo de enemigo basado en el nivel
  if (level >= 30 && RNG() > 0.9) {
    // Enemigo tipo 4 (artillero)
    enemy.health = 2;
    enemy.speed = 0.5; // Muy lento
    enemy.canShoot = true;
    enemy.fireGap = Math.max(700, 1200 - level * 20);
    enemy.image.src = "assets/enemy4.png";
  } else if (level >= 20 && RNG() > 0.85) {
    // Enemigo tipo 3 (muy rápido) — dispara al pasar
    enemy.health = 2;
    enemy.speed = RNG() * 4 + 5; // Velocidad entre 7 y 13
    enemy.canShoot = true;
    enemy.fireGap = Math.max(800, 1400 - level * 25);
    enemy.image.src = "assets/enemy3.png";
  } else if (level >= 10 && RNG() > 0.8) {
    // Enemigo tipo 2 (resistente)
    enemy.health = 3;
    enemy.speed = RNG() * 2 + 1; // Velocidad entre 1 y 3
    enemy.canShoot = true;
    enemy.fireGap = Math.max(850, 1500 - level * 30);
    enemy.image.src = "assets/enemy2.png";
  } else {
    // Enemigo tipo 1 (normal)
    enemy.health = 1;
    enemy.speed = RNG() * 2 + 1; // Velocidad entre 1 y 3
    enemy.canShoot = true;
    enemy.fireGap = Math.max(1000, 1700 - level * 35);
    enemy.image.src = "assets/enemy1.png";
  }
  if (RNG() < 0.1) {
    enemy.health = 1;
    enemy.speedX = 2.5;
    enemy.speedY = 3.5;
    enemy.canShoot = false; // es loot-arma, no artillero
    enemy.image.src = "assets/xiao_weapon.png";
    { const p = Math.max(0, level - 10); if (p) { enemy.speed *= 1 + 0.25 * p; enemy.health += Math.floor(p * 0.75); } }
    enemies.push(enemy);
    return;
  }
  if (RNG() < 0.06) {
    // 6% de probabilidad
    spawnIfa();
  }

  enemies.push(enemy);
}

// función para que el enemigo dispare (apunta un poco al jugador)
function enemyShoot(enemy) {
  if (enemy.speedX !== undefined) return;
  if (enemy.y < -24) return;
  if (!enemy.canShoot) return;
  const currentTime = gameNow();
  const gap = enemy.fireGap || Math.max(700, 1200 - level * 40);
  if (enemy.lastShot != null && currentTime - enemy.lastShot < gap) return;
  const bx = enemy.x + enemy.width / 2;
  const by = enemy.y + enemy.height;
  const px = player.x + player.width / 2;
  const py = player.y + player.height / 2;
  const dx = px - bx, dy = Math.max(40, py - by);
  const m = Math.hypot(dx, dy) || 1;
  const sp = (3.8 + Math.min(2.2, level * 0.06)) * (typeof Diff !== "undefined" ? Diff.bulletMul() : 1);
  const bag = window.enemyBullets || enemyBullets;
  bag.push({
    x: bx - 3, y: by,
    vx: (dx / m) * sp * 0.7, speed: (dy / m) * sp,
    width: 6, height: 12, src: "bala nave",
  });
  if (level >= 2 || (enemy.image && enemy.image.src.includes("enemy4"))) {
    [-1.6, 1.6].forEach((vx) => {
      bag.push({
        x: bx - 2, y: by, vx: vx, speed: sp * 0.85,
        width: 5, height: 10, src: "bala nave",
      });
    });
  }
  enemy.lastShot = currentTime;
  if (typeof SFX !== "undefined") SFX.play("impact", 0.28);
  if (typeof VFX !== "undefined" && VFX.muzzleFlash) VFX.muzzleFlash(bx, by);
}

// Power-ups → js/powerups.js

function updateGame() {
  const now = performance.now();
  let dtMs = SIM ? 1000 / 60 : Math.min(50, Math.max(0, now - __lastFrameTs)); // tope: evita saltos tras pausas
  __lastFrameTs = now;
  if (gamePaused) { dtMs = 0; }
  const frozen = typeof VFX !== "undefined" && VFX.consumeHitStop(dtMs);
  FK = frozen || gamePaused ? 0 : dtMs / (1000 / 60);
  if (!frozen && !gamePaused) GameClock.tick(dtMs);

  ctx.clearRect(0, 0, GW, GH);

  if (typeof VFX !== "undefined") {
    VFX.beginFrame(ctx, GW, GH, dtMs);
    VFX.drawBackground(ctx, GW, GH);
    if (typeof Magia !== "undefined") Magia.drawBackdrop(ctx, frozen || gamePaused ? 0 : dtMs);
  }

  if (player.movingLeft && player.x > 0) player.x -= player.speed * Rogue.mods.speed * FK;
  if (player.movingRight && player.x < GW - player.width)
    player.x += player.speed * Rogue.mods.speed * FK;
  if (player.movingUp && player.y > 0) player.y -= player.speed * Rogue.mods.speed * FK;
  if (player.movingDown && player.y < GH - player.height)
    player.y += player.speed * Rogue.mods.speed * FK;
  if (player.shooting) shoot();
  if (typeof Rogue !== "undefined") Rogue.update(dtMs, FK);
  if (typeof Foes !== "undefined") Foes.update(ctx, dtMs, FK);

  if (typeof VFX !== "undefined") {
    VFX.drawPlayerAura(ctx, player, {
      boost: hasFireRateBoost,
      invuln: isInvulnerable,
      double: hasDoublePoints,
    });
  }

  player.recoil = Math.max(0, (player.recoil || 0) - 0.5 * FK);
  const __if = gameNow() < (player.iframesUntil || 0);
  ctx.save();
  if (__if) ctx.globalAlpha = Math.floor(performance.now() / 50) % 2 ? 0.3 : 1;
  ctx.drawImage(player.image, player.x, player.y + player.recoil, player.width, player.height);
  ctx.restore();
  if (typeof Rogue !== "undefined") Rogue.drawShield(ctx);

  // Aplicar efectos visuales del título equipado
  applyTitleVisualEffects();

  // Limpiar restos DOM de balas (legacy)
  document.querySelectorAll(".bullet, .boss-bullet").forEach((el) => el.remove());

  bullets.forEach((bullet, i) => {
    bullet.y -= bullet.speed * FK;
    bullet.x += (bullet.vx || 0) * FK;
    if (typeof VFX !== "undefined") {
      VFX.drawBullet(ctx, bullet);
    } else {
      ctx.fillStyle = "#00eaff";
      ctx.fillRect(bullet.x, bullet.y, 5, 12);
    }

    enemies.forEach((enemy, j) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + 5 > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + 10 > enemy.y
      ) {
        if (bullet.hit && bullet.hit.has(enemy)) return;
        enemy.health -= bullet.dmg || 1;
        if (bullet.pierce > 0) { bullet.pierce--; (bullet.hit = bullet.hit || new Set()).add(enemy); }
        else bullets.splice(i, 1);
        enemy.flash = 4;
        if (typeof Magia !== "undefined") Magia.onHit();
        if (typeof VFX !== "undefined") {
          VFX.hitSpark(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        }
        if (enemy.health <= 0) {
          const ex = enemy.x + enemy.width / 2;
          const ey = enemy.y + enemy.height / 2;
          createExplosion(ex, ey);

          let enemyType = "type1";
          if (enemy.image.src.includes("enemy2.png")) enemyType = "type2";
          else if (enemy.image.src.includes("enemy3.png")) enemyType = "type3";
          else if (enemy.image.src.includes("enemy4.png")) enemyType = "type4";
          else if (enemy.image.src.includes("ifa.png")) enemyType = "ifa";
          else if (enemy.image.src.includes("xiao_weapon.png"))
            enemyType = "xiao_weapon";

          updateStatsOnKill(enemyType);

          enemies.splice(j, 1);
          const gained = addPoints(10);
          if (typeof VFX !== "undefined") {
            VFX.registerKill(ex, ey, gained || 10);
            pushKillFeed(enemyType);
          }

          try {
            const explosionSound = SFX.audio("explosion");
            explosionSound.play().catch(() => {});
          } catch (e) {}

          if (typeof Magia !== "undefined") Magia.onKill(ex, ey);
          maybeLevelUp(score - (gained || 10));
        }
      }
    });
    meteors.forEach((meteor, j) => {
      if (
        bullet.x < meteor.x + meteor.width &&
        bullet.x + 5 > meteor.x &&
        bullet.y < meteor.y + meteor.height &&
        bullet.y + 10 > meteor.y
      ) {
        meteor.health--;
        bullets.splice(i, 1);
        if (meteor.health <= 0) {
          const mx = meteor.x + meteor.width / 2;
          const my = meteor.y + meteor.height / 2;
          meteors.splice(j, 1); breakMeteor(meteor);
          const gained = addPoints(20);
          if (typeof VFX !== "undefined") VFX.registerKill(mx, my, gained || 20);
          try {
            const explosionSound = SFX.audio("explosion");
            explosionSound.play().catch(() => {});
          } catch (e) {}
          createExplosion(mx, my);
        } else {
          if (typeof VFX !== "undefined") {
            VFX.hitSpark(
              meteor.x + meteor.width / 2,
              meteor.y + meteor.height / 2
            );
          }
          try {
            const impactSound = SFX.audio("impact");
            impactSound.play().catch(() => {});
          } catch (e) {}
        }
      }
    });
    if (bullet.y < 0) {
      bullets.splice(i, 1);
    }
  });

  // Balas enemigas (una sola pasada)
  const __bk = bossActive ? 1 : 1 + 0.15 * Math.max(0, level - 10); // post-jefe: balas más rápidas
  enemyBullets.forEach((bullet, i) => {
    // Bombas retardadas: caen lento y estallan en abanico
    if (bullet.bomb) {
      bullet.fuse = (bullet.fuse || 700) - dtMs;
      bullet.y += bullet.speed * FK * __bk;
      if (typeof VFX !== "undefined") VFX.drawEnemyBullet(ctx, bullet);
      else { ctx.fillStyle = "#ff9100"; ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height); }
      if (bullet.fuse <= 0) {
        const bx = bullet.x + bullet.width / 2, by = bullet.y + bullet.height / 2;
        const mul = typeof Diff !== "undefined" ? Diff.bulletMul() : 1;
        const bag = window.enemyBullets || enemyBullets;
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI * 2 * k) / 6;
          bag.push({
            x: bx - 3, y: by,
            vx: Math.cos(a) * 3.2 * mul, speed: Math.sin(a) * 3.2 * mul,
            width: 5, height: 5, witch: true, src: "estallido bomba",
          });
        }
        if (typeof VFX !== "undefined") VFX.explosion(bx, by, 0.9);
        if (typeof SFX !== "undefined") SFX.play("explosion", 0.45);
        enemyBullets.splice(i, 1);
      } else if (bullet.y > GH) enemyBullets.splice(i, 1);
      return;
    }
    bullet.y += bullet.speed * FK * __bk;
    bullet.x += (bullet.vx || 0) * FK * __bk;
    if (typeof VFX !== "undefined") {
      VFX.drawEnemyBullet(ctx, bullet);
    } else {
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    if (
      bullet.x < player.x + player.width &&
      bullet.x + bullet.width > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bullet.height > player.y
    ) {
      enemyBullets.splice(i, 1);
      handlePlayerDamage((bullet.src || (bullet.witch ? 'jefe:patrón' : 'bala enemiga')));
    }

    if (bullet.y > GH || bullet.x < -40 || bullet.x > GW + 40) {
      enemyBullets.splice(i, 1);
    }
  });

  enemies.forEach((enemy, i) => {
    // Movimiento especial si tiene speedX (es el xiao_weapon)
    if (enemy.speedX !== undefined) {
      enemy.x += enemy.speedX * FK;
      enemy.y += enemy.speedY * FK;

      if (enemy.x <= 0 || enemy.x + enemy.width >= GW) {
        enemy.speedX *= -1;
      }
    } else {
      enemy.y += enemy.speed * FK;
    }

    // Halo sutil en enemigos peligrosos
    if (enemy.canShoot || enemy.image.src.includes("enemy3.png")) {
      ctx.save();
      ctx.shadowColor = enemy.canShoot ? "#ff1744" : "#ff9100";
      ctx.shadowBlur = 12;
      ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
      ctx.restore();
    } else {
      ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
    }

    if (enemy.flash > 0) { enemy.flash -= FK; ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.7; ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height); ctx.restore(); }
    if (enemy.y > GH) enemies.splice(i, 1);

    if (
      enemy.x < player.x + player.width &&
      enemy.x + enemy.width > player.x &&
      enemy.y < player.y + player.height &&
      enemy.y + enemy.height > player.y
    ) {
      if (enemy.image.src.includes("ifa.png")) {
        applyFireRateDebuff();
      }
      enemies.splice(i, 1);
      handlePlayerDamage('choque enemigo');
    }

    if (enemy.canShoot) {
      enemyShoot(enemy);
    }
  });

  kits.forEach((kit, i) => {
    kit.y += kit.speed * FK;
    ctx.drawImage(kit.image, kit.x, kit.y, kit.width, kit.height);
    if (kit.y > GH) kits.splice(i, 1);

    // Colisión con el jugador para recoger el kit
    if (
      kit.x < player.x + player.width &&
      kit.x + kit.width > player.x &&
      kit.y < player.y + player.height &&
      kit.y + kit.height > player.y
    ) {
      kits.splice(i, 1);

      // Actualizar estadísticas de power-up recolectado
      updateStatsOnPowerUpCollected("kit");

      if (player.hearts < maxHearts) {
        player.hearts++;
        updateHeartsDisplay();

        // Efecto de sonido
        const healSound = SFX.audio("heal");
        healSound.play();

        // Efecto visual en el jugador
        player.image.classList.add("healing");
        setTimeout(() => {
          player.image.classList.remove("healing");
        }, 500);

        // Mostrar notificación de curación
        showPowerUpNotification(
          "kit",
          player.x + player.width / 2,
          player.y + player.height / 2
        );

        // Efecto de partículas de curación
        createHealEffect(
          player.x + player.width / 2,
          player.y + player.height / 2
        );
      }
    }
  });

  drawMeteorDebris(16.67 * FK);
  meteors.forEach((meteor, i) => {
    meteor.y += meteor.speed * FK;
    drawMeteor(meteor);

    if (meteor.y > GH) {
      meteors.splice(i, 1);
    }

    // Colisión con el jugador
    if (
      meteor.x < player.x + player.width &&
      meteor.x + meteor.width > player.x &&
      meteor.y < player.y + player.height &&
      meteor.y + meteor.height > player.y
    ) {
      meteors.splice(i, 1); breakMeteor(meteor);
      handlePlayerDamage((bossActive ? 'jefe:meteoro' : 'meteoro'));

      // Efecto visual y sonoro
      const explosionSound = SFX.audio("explosion");
      explosionSound.play();

      createExplosion(
        meteor.x + meteor.width / 2,
        meteor.y + meteor.height / 2
      );
    }
  });

  xiaos.forEach((xiao, i) => {
    xiao.y += xiao.speed * FK;
    ctx.drawImage(xiao.image, xiao.x, xiao.y, xiao.width, xiao.height);

    if (xiao.y > GH) {
      xiaos.splice(i, 1);
    }

    // Colisión con el jugador
    if (
      xiao.x < player.x + player.width &&
      xiao.x + xiao.width > player.x &&
      xiao.y < player.y + player.height &&
      xiao.y + xiao.height > player.y
    ) {
      xiaos.splice(i, 1);

      // Actualizar estadísticas de power-up recolectado
      updateStatsOnPowerUpCollected("xiao");

      if (player.hearts === maxHearts && !hasExtraHeart) {
        player.hearts++;
        hasExtraHeart = true;
        updateHeartsDisplay();

        // Efecto visual y sonoro especial
        const xiaoSound = SFX.audio("xiao");
        xiaoSound.play();

        // Mostrar notificación de corazón extra
        showPowerUpNotification(
          "xiao",
          player.x + player.width / 2,
          player.y + player.height / 2
        );

        // Efecto visual especial
        heartsDisplay.style.animation = "glow 1s ease-in-out";
        setTimeout(() => {
          heartsDisplay.style.animation = "";
        }, 1000);
      }
    }
  });

  arlees.forEach((arlee, i) => {
    arlee.y += arlee.speed * FK;
    ctx.drawImage(arlee.image, arlee.x, arlee.y, arlee.width, arlee.height);

    if (arlee.y > GH) {
      arlees.splice(i, 1);
    }

    // Colisión con el jugador
    if (
      arlee.x < player.x + player.width &&
      arlee.x + arlee.width > player.x &&
      arlee.y < player.y + player.height &&
      arlee.y + arlee.height > player.y
    ) {
      arlees.splice(i, 1);

      // Actualizar estadísticas de power-up recolectado
      updateStatsOnPowerUpCollected("arlee");

      // Si ya hay un power-up activo, solo reinicia el tiempo
      if (hasFireRateBoost) {
        powerUpTimeLeft = 30;
      } else {
        // Activar power-up por primera vez
        hasFireRateBoost = true;
        powerUpTimeLeft = 30;
        powerUpTimerDisplay.style.display = "block";

        // Iniciar el contador
        startPowerUpTimer();
      }

      // Efecto visual y sonoro
      const powerUpSound = SFX.audio("powerup");
      powerUpSound.play();

      // Mostrar notificación de disparo rápido
      showPowerUpNotification(
        "arlee",
        player.x + player.width / 2,
        player.y + player.height / 2
      );

      // Efecto visual en el jugador
      player.image.style.filter = "hue-rotate(90deg)";
    }
  });

  cynos.forEach((cyno, i) => {
    cyno.y += cyno.speed * FK;
    ctx.drawImage(cyno.image, cyno.x, cyno.y, cyno.width, cyno.height);

    if (cyno.y > GH) {
      cynos.splice(i, 1);
    }

    // Colisión con el jugador
    if (
      cyno.x < player.x + player.width &&
      cyno.x + cyno.width > player.x &&
      cyno.y < player.y + player.height &&
      cyno.y + cyno.height > player.y
    ) {
      cynos.splice(i, 1);

      // Actualizar estadísticas de power-up recolectado
      updateStatsOnPowerUpCollected("cyno");

      // Mostrar notificación de invulnerabilidad
      showPowerUpNotification(
        "cyno",
        player.x + player.width / 2,
        player.y + player.height / 2
      );

      // Si ya es invulnerable, solo reinicia el tiempo
      if (isInvulnerable) {
        invulnerabilityTimeLeft = 6;
      } else {
        // Activar invulnerabilidad por primera vez
        isInvulnerable = true;
        invulnerabilityTimeLeft = 6;
        startInvulnerabilityTimer();
      }

      // Efecto visual y sonoro
      const powerUpSound = SFX.audio("shield");
      powerUpSound.play();

      // Efecto visual en el jugador
      player.image.style.filter = "hue-rotate(180deg) brightness(1.5)";
    }
  });

  flins.forEach((flin, i) => {
    flin.y += flin.speed * FK;

    // Efecto visual especial para flins - brillo dorado
    ctx.save();
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 15;
    ctx.drawImage(flin.image, flin.x, flin.y, flin.width, flin.height);
    ctx.restore();

    if (flin.y > GH) {
      flins.splice(i, 1);
    }

    // Colisión con el jugador
    if (
      flin.x < player.x + player.width &&
      flin.x + flin.width > player.x &&
      flin.y < player.y + player.height &&
      flin.y + flin.height > player.y
    ) {
      flins.splice(i, 1);

      // Actualizar estadísticas de power-up recolectado
      updateStatsOnPowerUpCollected("flins");

      // Si ya tiene puntos dobles, solo reinicia el tiempo
      if (hasDoublePoints) {
        doublePointsTimeLeft = 30;
      } else {
        // Activar puntos dobles por primera vez
        hasDoublePoints = true;
        doublePointsTimeLeft = 30;
        startDoublePointsTimer();
      }

      // Efecto visual y sonoro épico
      createDoublePointsEffect(
        player.x + player.width / 2,
        player.y + player.height / 2
      );
      const powerUpSound = SFX.audio("coin");
      powerUpSound.volume = 0.7;
      powerUpSound.play().catch(() => {});
    }
  });

  rerirs.forEach((rerir, i) => {
    rerir.y += rerir.speed * FK;

    // Efecto visual especial para rerir - brillo azul
    ctx.save();
    ctx.shadowColor = "#00BFFF";
    ctx.shadowBlur = 20;
    ctx.drawImage(rerir.image, rerir.x, rerir.y, rerir.width, rerir.height);
    ctx.restore();

    if (rerir.y > GH) {
      rerirs.splice(i, 1);
    }

    // Colisión con el jugador - solo si tiene 1 corazón
    if (
      rerir.x < player.x + player.width &&
      rerir.x + rerir.width > player.x &&
      rerir.y < player.y + player.height &&
      rerir.y + rerir.height > player.y
    ) {
      rerirs.splice(i, 1);

      // Actualizar estadísticas de power-up recolectado
      updateStatsOnPowerUpCollected("rerir");

      // Solo activar si el jugador tiene exactamente 1 corazón
      if (player.hearts === 1 && !hasTemporaryHeart) {
        // Dar corazón temporal
        hasTemporaryHeart = true;
        player.hearts++;
        temporaryHeartTimeLeft = 10;
        updateHeartsDisplay();
        startTemporaryHeartTimer();

        // Efecto visual y sonoro
        const powerUpSound = SFX.audio("shield");
        powerUpSound.play();

        // Efecto visual especial azul
        createTemporaryHeartEffect(
          player.x + player.width / 2,
          player.y + player.height / 2
        );
      }
    }
  });

  // Mini-jefes
  if (typeof Bosses !== "undefined" && Bosses.isMini()) {
    Bosses.updateMini(ctx, frozen || gamePaused ? 0 : dtMs, FK);
  }

  // Boss logic
  if (bossActive && boss) {
    // sprite del roster si aplica; si no, el clásico
    if (!(typeof Bosses !== "undefined" && Bosses.drawBossSprite(ctx))) {
      animateBoss(ctx);
    }
    bossAttack();
    if (typeof Bosses !== "undefined") Bosses.enhanceBossAttack();

    // Colisión con balas del jugador
    bullets.forEach((bullet, i) => {
      if (boss) {
        if (
          bullet.x < boss.x + boss.width &&
          bullet.x + 5 > boss.x &&
          bullet.y < boss.y + boss.height &&
          bullet.y + 10 > boss.y
        ) {
          bullets.splice(i, 1);
          handleBossHit();
        }
      }
    });

    // Colisión con el jugador
    if (boss) {
      if (
        boss.x < player.x + player.width &&
        boss.x + boss.width > player.x &&
        boss.y < player.y + boss.height &&
        boss.y + boss.height > player.y
      ) {
        handlePlayerDamage('jefe:choque');
      }
    }
  }

  // Jefes / mini-jefes por hitos de nivel
  if (typeof Bosses !== "undefined") {
    Bosses.trySpawnForLevel(level);
  } else if (level === 10 && !bossActive && !boss) {
    spawnBoss();
  }

  if (typeof VFX !== "undefined") {
    if (typeof Magia !== "undefined") Magia.update(ctx, frozen || gamePaused ? 0 : dtMs, FK);
    VFX.updateAndDrawParticles(ctx);
    VFX.endFrame(ctx, GW, GH);
  }

  if (gameRunning && !SIM) requestAnimationFrame(updateGame);
}

function pushKillFeed(enemyType) {
  const feed = document.getElementById("killFeed");
  if (!feed) return;
  const labels = {
    type1: "Caza destruido",
    type2: "Tanque abatido",
    type3: "Interceptor",
    type4: "Artillero",
    ifa: "Ifa neutralizado",
    xiao_weapon: "Arma Xiao",
  };
  const row = document.createElement("div");
  row.className = "kill-feed-item";
  row.textContent = labels[enemyType] || "Enemigo destruido";
  feed.prepend(row);
  if (typeof UIAnime !== "undefined") UIAnime.killFeedItem(row);
  while (feed.children.length > 4) feed.lastChild.remove();
  setTimeout(() => row.remove(), 2200);
}

function updateHeartsDisplay() {
  if (typeof Magia !== "undefined") Magia.drawHud();
  heartsDisplay.innerHTML = "";
  for (let i = 0; i < player.hearts; i++) {
    const heart = document.createElement("img");
    
    // Determinar qué imagen de corazón usar
    if (i < maxHearts) {
      heart.src = "assets/heart.png";
    } else if (hasExtraHeart && i === maxHearts) {
      heart.src = "assets/xiao_heart.png";
      heart.style.filter = "hue-rotate(90deg)"; // Corazón extra de Xiao (verde)
    } else {
      heart.src = "assets/heart.png";
    }
    
    heart.style.width = "20px";
    heart.style.margin = "0 5px";
    
    // Si es el corazón temporal (el último cuando hasTemporaryHeart es true)
    if (hasTemporaryHeart && i === player.hearts - 1) {
      heart.style.filter = "hue-rotate(180deg) brightness(1.2)"; // Corazón temporal azul
      heart.style.animation = "pulse 1s infinite"; // Animación de pulsación
    }
    
    heartsDisplay.appendChild(heart);
  }
}

function gameOver() {
  gameRunning = false;
  if (typeof bossBar !== "undefined") bossBar.style.display = "none";
  if (typeof setPaused === "function") setPaused(true, true);
  scissorCut();
  // Mantener el marco del campo en escritorio; ocultar chrome de menú
  document.body.classList.add("game-over");
  document.body.classList.remove("game-running");
  refreshTouchUiMode();
  if (typeof Rogue !== "undefined") Rogue.showSummary(gameOverDisplay);
  gameOverDisplay.hidden = false;
  if (typeof UIAnime !== "undefined") {
    UIAnime.gameOver(gameOverDisplay);
  } else {
    gameOverDisplay.style.display = "flex";
  }
  canvas.style.filter = "grayscale(70%) brightness(0.55)";

  const music = initBgMusic();
  if (music) music.pause();

  updateStatsOnGameEnd();
  saveScore();
  const btn = document.getElementById("restartBtn");
  if (btn) setTimeout(() => btn.focus(), 80);
}

function saveScore() {
  let scores = SafeStore.getArray("scores", (x) => x && typeof x.name === "string" && Number.isFinite(x.score));
  scores.push({ name: playerName, score: score });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 10); // Mantener solo los mejores 10 puntajes en la tabla
  localStorage.setItem("scores", JSON.stringify(scores));
  displayScores(scores);
}

function displayScores(scores) {
  const scoresList = document.getElementById("scoresList");
  scoresList.innerHTML = "";
  scores.forEach((score) => {
    const li = document.createElement("li");
    li.textContent = `${score.name}: ${score.score}`;
    scoresList.appendChild(li);
  });
}

document.getElementById("restartBtn").addEventListener("click", () => {
  document.body.classList.remove("game-running", "game-over");
  window.location.reload();
});

function startGame() {
  scissorCut();
  GameClock.reset();
  player.iframesUntil = 0; window.__postBossAt = null;
  // Estado de power-ups de la partida anterior (sus temporizadores se borran con el reloj): volver a lo normal.
  normalFireRate = 500; isFireRateReduced = false; hasFireRateBoost = false; hasDoublePoints = false; isInvulnerable = false; hasTemporaryHeart = false;
  xiaos = []; arlees = []; cynos = []; flins = []; rerirs = []; kits = []; meteors = [];
  enemyBullets = []; window.enemyBullets = enemyBullets; bullets = [];
  bossActive = false; boss = null; if (typeof bossBar !== "undefined") bossBar.style.display = "none";
  player.canShoot = true; // el reloj se reinicia: el enfriamiento pendiente se cancela
  player.x = GW / 2 - player.width / 2;
  player.y = GH - 80;
  if (typeof Rogue !== "undefined") Rogue.newRun();
  if (typeof Foes !== "undefined") Foes.clear();
  if (typeof Bosses !== "undefined") Bosses.reset();
  if (typeof Magia !== "undefined") Magia.reset();
  if (typeof SFX !== "undefined" && SFX.stopBossMusic) SFX.stopBossMusic(false);
  GameClock.reset();
  __lastFrameTs = performance.now();
  gamePaused = false;
  level = 1;
  score = 0;
  player.hearts = maxHearts;
  levelDisplay.textContent = `Nivel: ${level}`;
  scoreDisplay.textContent = score;
  updateHeartsDisplay();
  enemies = [];
  bullets = [];
  kits = [];
  meteors = [];
  enemyBullets = [];
  window.enemyBullets = enemyBullets;
  xiaos = [];
  arlees = []; // Limpiar los power-ups de velocidad de disparo
  cynos = [];
  flins = []; // Limpiar los power-ups de puntos dobles
  rerirs = []; // Limpiar los power-ups de corazón temporal
  if (typeof VFX !== "undefined") {
    VFX.clear();
    VFX.resize(GW, GH);
    VFX.levelUp(1);
  }
  const feed = document.getElementById("killFeed");
  if (feed) feed.innerHTML = "";
  isInvulnerable = false;
  if (invulnerabilityTimer) {
    gClear(invulnerabilityTimer);
    invulnerabilityTimer = null;
  }
  invulnerabilityTimeLeft = 6;
  document.getElementById("invulnerabilityTimer").style.display = "none";
  hasExtraHeart = false;
  if (powerUpTimer) {
    gClear(powerUpTimer);
    powerUpTimer = null;
  }
  hasFireRateBoost = false;
  powerUpTimeLeft = 30;
  powerUpTimerDisplay.style.display = "none";

  // Limpiar timer de puntos dobles
  hasDoublePoints = false;
  if (doublePointsTimer) {
    gClear(doublePointsTimer);
    doublePointsTimer = null;
  }
  doublePointsTimeLeft = 30;
  document.getElementById("doublePointsTimer").style.display = "none";

  // Limpiar timer de corazón temporal
  hasTemporaryHeart = false;
  if (temporaryHeartTimer) {
    gClear(temporaryHeartTimer);
    temporaryHeartTimer = null;
  }
  temporaryHeartTimeLeft = 10;
  document.getElementById("temporaryHeartTimer").style.display = "none";

  player.image.style.filter = "none";
  gameRunning = true;
  gameOverDisplay.hidden = true;
  gameOverDisplay.style.display = "none";
  canvas.style.filter = "none";

  document.body.classList.remove("game-over");
  document.body.classList.add("game-running");

  // Reproducir música de fondo con configuración robusta
  const music = initBgMusic();
  if (music) {
    music.currentTime = 0; // Reiniciar desde el principio
    music.loop = true; // Asegurar que esté en loop

    // Configurar volumen actual
    const currentVolume = SafeStore.num("gameVolume", 50, 0, 100);
    const currentMuted = localStorage.getItem("gameMuted") === "true";
    music.volume = currentMuted ? 0 : currentVolume / 100;

    music
      .play()
      .then(() => {})
      .catch(() => {
        // Autoplay bloqueado: se reintenta con el próximo gesto del usuario
        document.addEventListener(
          "click",
          function playMusic() {
            music.play().catch(() => {});
            document.removeEventListener("click", playMusic);
          },
          { once: true }
        );
      });
  }

  // Actualizar estadísticas de inicio de partida
  updateStatsOnGameStart();

  refreshTouchUiMode();
  spawnEnemies();
  updateGame();
  initJoystick();
  setTimeout(refreshJoystickCenter, 60);
}

function handlePlayerDamage(src) {
  if (isInvulnerable) return; // Si es invulnerable, no recibe daño
  if (gameNow() < (player.iframesUntil || 0)) return;
  const iframe =
    bossActive
      ? 2200
      : typeof Diff !== "undefined" && Diff.iframeMs
        ? Diff.iframeMs()
        : 650;
  player.iframesUntil = gameNow() + iframe;
  if (typeof Rogue !== "undefined" && Rogue.absorbHit()) return;
  if (typeof Magia !== "undefined") Magia.onDamage();

  player.hearts--;
  (window.__hitLog = window.__hitLog || []).push({ t: Math.round(gameNow() / 100) / 10, src: src || '?', boss: bossActive });

  if (typeof VFX !== "undefined") {
    VFX.resetCombo();
    VFX.damageFlash();
  }

  // Si el jugador tenía un corazón temporal y lo pierde
  if (hasTemporaryHeart && player.hearts === 1) {
    hasTemporaryHeart = false;
    // Detener el timer del corazón temporal
    if (temporaryHeartTimer) {
      gClear(temporaryHeartTimer);
      temporaryHeartTimer = null;
      document.getElementById("temporaryHeartTimer").style.display = "none";
    }
  }

  if (player.hearts === maxHearts) {
    hasExtraHeart = false;
  }
  updateHeartsDisplay();

  // Actualizar estadísticas de daño
  updateStatsOnDamage();

  // Efecto visual en el jugador
  player.image.classList.add("damage");
  setTimeout(() => {
    player.image.classList.remove("damage");
  }, 500);

  // Efecto de partículas de daño
  createDamageEffect(player.x + player.width / 2, player.y + player.height / 2);

  // Sonido de daño
  try {
    const damageSound = SFX.audio("damage");
    damageSound.play().catch(() => {});
  } catch (e) {}

  // Efecto en el contador de corazones
  heartsDisplay.classList.add("pulse");
  setTimeout(() => {
    heartsDisplay.classList.remove("pulse");
  }, 1000);

  if (player.hearts <= 0) {
    gameRunning = false;
    gameOver();
  }
}

function createDamageEffect(x, y) {
  if (typeof VFX !== "undefined") {
    VFX.explosion(x, y, 0.7);
    VFX.floatText(x, y - 20, "¡auch!", "#ff5252", 20);
    return;
  }
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement("div");
    particle.className = "damage-particle";
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    const angle = (Math.PI * 2 * i) / 12;
    const distance = 50;
    const finalX = x + Math.cos(angle) * distance;
    const finalY = y + Math.sin(angle) * distance;
    particle.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        {
          transform: `translate(${finalX - x}px, ${finalY - y}px) scale(0)`,
          opacity: 0,
        },
      ],
      { duration: 500, easing: "ease-out", fill: "forwards" }
    );
    document.getElementById("game-container").appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
}

let spawnerHandle = null;
let spawnerInterval = 2000;
function spawnIntervalMs() {
  return typeof Diff !== "undefined" ? Diff.spawnInterval() : Math.max(900, 2000 - level * 70);
}
function rescheduleSpawner() {
  gClear(spawnerHandle);
  spawnerInterval = spawnIntervalMs();
  spawnerHandle = gSetInterval(spawnTick, spawnerInterval);
}
function spawnTick() {
  if (bossActive) return;
  if (typeof Bosses !== "undefined" && Bosses.isBlocking()) return;
  const __pb = window.__postBossAt != null ? gameNow() - window.__postBossAt : Infinity;
  if (__pb < 10000) return;

  // Ritmo dinámico: si el intervalo objetivo cambió, reprograma
  const want = spawnIntervalMs();
  if (want !== spawnerInterval) {
    rescheduleSpawner();
    return;
  }

  const enemiesToSpawn =
    typeof Diff !== "undefined"
      ? Diff.waveSize()
      : Math.min(6 + 3 * Math.max(0, level - 10), Math.floor(1 + Math.sqrt(level) * 1.4));

  for (let i = 0; i < enemiesToSpawn; i++) {
    if (typeof Foes !== "undefined" && Foes.rollSpawn(level)) continue;
    spawnEnemy();
  }

  const kitP = typeof Diff !== "undefined" ? Diff.kitChance() : 0.1 / (1 + Math.max(0, level - 10));
  if (RNG() < kitP) spawnKit();

  const metP = Math.min(0.14, 0.04 + level * 0.006 + Math.max(0, level - 10) * 0.02);
  if (RNG() < metP) spawnMeteor();

  // Power-ups más raros: el laberinto no te miméa
  if (RNG() < 0.022 && player.hearts === maxHearts && !hasExtraHeart) spawnXiao();
  if (RNG() < Math.max(0.028, 0.05 - Math.max(0, level - 6) * 0.004)) spawnArlee();
  if (RNG() < 0.025) spawnCyno();
  if (level <= 2 && RNG() < 0.06) spawnFlins();
  if (player.hearts === 1 && !hasTemporaryHeart && RNG() < 0.12) spawnRerir();
  if (RNG() < Math.min(0.14, 0.07 + level * 0.005)) spawnXiaoWeapon();
}
function spawnEnemies() {
  rescheduleSpawner();
}

function startPowerUpTimer() {
  // Limpiar timer existente si hay uno
  if (powerUpTimer) {
    gClear(powerUpTimer);
  }

  powerUpTimer = gSetInterval(() => {
    powerUpTimeLeft--;
    timerSpan.textContent = powerUpTimeLeft;

    if (powerUpTimeLeft <= 0) {
      // Desactivar power-up
      hasFireRateBoost = false;
      player.image.style.filter = "none";
      powerUpTimerDisplay.style.display = "none";
      gClear(powerUpTimer);
      powerUpTimer = null;
    }
  }, 1000);
}

function startInvulnerabilityTimer() {
  if (invulnerabilityTimer) {
    gClear(invulnerabilityTimer);
  }

  const invTimerDisplay = document.getElementById("invulnerabilityTimer");
  const invTimerSpan = document.getElementById("invTimer");
  invTimerDisplay.style.display = "block";

  invulnerabilityTimer = gSetInterval(() => {
    invulnerabilityTimeLeft--;
    invTimerSpan.textContent = invulnerabilityTimeLeft;

    if (invulnerabilityTimeLeft <= 0) {
      isInvulnerable = false;
      player.image.style.filter = "none";
      invTimerDisplay.style.display = "none";
      gClear(invulnerabilityTimer);
      invulnerabilityTimer = null;
    }
  }, 1000);
}

function startDoublePointsTimer() {
  if (doublePointsTimer) {
    gClear(doublePointsTimer);
  }

  const doublePointsDisplay = document.getElementById("doublePointsTimer");
  const doublePointsSpan = document.getElementById("doublePointsTime");
  doublePointsDisplay.style.display = "block";

  doublePointsTimer = gSetInterval(() => {
    doublePointsTimeLeft--;
    doublePointsSpan.textContent = doublePointsTimeLeft;

    if (doublePointsTimeLeft <= 0) {
      hasDoublePoints = false;
      doublePointsDisplay.style.display = "none";
      gClear(doublePointsTimer);
      doublePointsTimer = null;
    }
  }, 1000);
}

function startTemporaryHeartTimer() {
  if (temporaryHeartTimer) {
    gClear(temporaryHeartTimer);
  }

  const temporaryHeartDisplay = document.getElementById("temporaryHeartTimer");
  const temporaryHeartSpan = document.getElementById("temporaryHeartTime");
  temporaryHeartDisplay.style.display = "block";

  temporaryHeartTimer = gSetInterval(() => {
    temporaryHeartTimeLeft--;
    temporaryHeartSpan.textContent = temporaryHeartTimeLeft;

    if (temporaryHeartTimeLeft <= 0) {
      // Perder el corazón temporal
      if (hasTemporaryHeart && player.hearts > 1) {
        hasTemporaryHeart = false;
        player.hearts--;
        updateHeartsDisplay();
        
        // Efecto de sonido de pérdida
        const lostSound = SFX.audio("damage");
        lostSound.volume = 0.5;
        lostSound.play().catch(() => {});
      }
      
      temporaryHeartDisplay.style.display = "none";
      gClear(temporaryHeartTimer);
      temporaryHeartTimer = null;
    }
  }, 1000);
}

// Configuración de música de fondo
let bgMusic = null;

function initBgMusic() {
  if (!bgMusic) {
    bgMusic = SFX.audio("music");
    bgMusic.loop = true;

    // Configurar volumen inicial
    const savedVolume = SafeStore.num("gameVolume", 50, 0, 100);
    const savedMuted = localStorage.getItem("gameMuted") === "true";
    bgMusic.volume = savedMuted ? 0 : savedVolume / 100;

    // Evento para reiniciar la música si se detiene inesperadamente
    bgMusic.addEventListener("ended", () => {
      if (gameRunning && bgMusic.loop) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(() => {});
      }
    });

    bgMusic.addEventListener("error", () => {});
  }
  return bgMusic;
}

// Inicializar música inmediatamente y hacerla accesible globalmente
bgMusic = initBgMusic();
window.bgMusic = bgMusic;

// Controles táctiles para dispositivos móviles y botones en pantalla

let touchX, touchY;

// Añadir eventos táctiles para los botones
function handleTouchStart(e) {
  const touch = e.touches[0];
  touchX = touch.clientX;
  touchY = touch.clientY;
  if (touchY < GH / 2) {
    player.shooting = true;
  }
}

function handleTouchMove(e) {
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchX;
  const deltaY = touch.clientY - touchY;
  touchX = touch.clientX;
  touchY = touch.clientY;

  if (deltaX < 0) player.movingLeft = true;
  if (deltaX > 0) player.movingRight = true;
  if (deltaY < 0) player.movingUp = true;
  if (deltaY > 0) player.movingDown = true;
}

function handleTouchEnd(e) {
  player.movingLeft = false;
  player.movingRight = false;
  player.movingUp = false;
  player.movingDown = false;
  player.shooting = false;
}

// Añade esta nueva función para crear el efecto de curación
function createHealEffect(x, y) {
  const effect = document.createElement("div");
  effect.className = "heal-effect";
  effect.style.left = x + "px";
  effect.style.top = y + "px";
  document.getElementById("game-container").appendChild(effect);

  // Remover el elemento después de la animación
  setTimeout(() => {
    effect.remove();
  }, 500);

  // Crear múltiples anillos de curación
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const ring = document.createElement("div");
      ring.className = "heal-effect";
      ring.style.left = x + "px";
      ring.style.top = y + "px";
      document.getElementById("game-container").appendChild(ring);
      setTimeout(() => {
        ring.remove();
      }, 500);
    }, i * 100);
  }
}

// Función para crear el efecto visual de puntos dobles
// Función para crear efecto visual de puntos dobles (mantener por compatibilidad)
function createDoublePointsEffect(x, y) {
  showPowerUpNotification("flins", x, y);
}

// Función genérica para mostrar notificación de power-up o debuff
function showPowerUpNotification(type, x, y) {
  if (typeof Magia !== "undefined") Magia.onAlly(type);
  const config = {
    kit: {
      text: "Curación +1",
      color: "#2ecc71",
      particles: ["+", "+", "+"],
      className: "powerup-notification-green"
    },
    xiao: {
      text: "Gema extra",
      color: "#2ecc71",
      particles: ["+", "+", "+"],
      className: "powerup-notification-green"
    },
    arlee: {
      text: "Disparo rápido",
      color: "#ff5722",
      particles: ["»", "»", "»"],
      className: "powerup-notification-red"
    },
    cyno: {
      text: "Invulnerabilidad",
      color: "#00ffff",
      particles: ["○", "○", "○"],
      className: "powerup-notification-cyan"
    },
    flins: {
      text: "Puntos x2",
      color: "#FFD700",
      particles: ["×", "×", "×"],
      className: "powerup-notification-gold"
    },
    rerir: {
      text: "Gema temporal",
      color: "#00BFFF",
      particles: ["+", "+", "+"],
      className: "powerup-notification-blue"
    },
    ifa: {
      text: "Disparo lento",
      color: "#9b59b6",
      particles: ["…", "…", "…"],
      className: "powerup-notification-purple"
    }
  };

  const settings = config[type];
  if (!settings) return;

  if (typeof VFX !== "undefined") {
    const palette = {
      kit: ["#69f0ae", "#00e676", "#fff"],
      xiao: ["#69f0ae", "#00c853", "#fff"],
      arlee: ["#ff5722", "#ff9100", "#fff"],
      cyno: ["#00e5ff", "#18ffff", "#fff"],
      flins: ["#FFD700", "#fff59d", "#fff"],
      rerir: ["#00BFFF", "#40c4ff", "#fff"],
      ifa: ["#9b59b6", "#ce93d8", "#fff"],
    };
    if (type === "kit" || type === "xiao" || type === "rerir") {
      VFX.heal(x, y);
    } else {
      VFX.powerUp(x, y, palette[type]);
    }
    VFX.shake(type === "ifa" ? 5 : 2.5);
  }

  // Crear efecto principal
  const mainEffect = document.createElement("div");
  mainEffect.className = settings.className;
  mainEffect.style.left = x - 50 + "px";
  mainEffect.style.top = y - 25 + "px";
  mainEffect.innerHTML = settings.text;
  document.getElementById("game-container").appendChild(mainEffect);

  // Remover después de la animación
  setTimeout(() => {
    mainEffect.remove();
  }, 2000);

  // Crear partículas flotantes
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const particle = document.createElement("div");
      particle.className = "powerup-particle";
      particle.style.left = x + Math.random() * 60 - 30 + "px";
      particle.style.top = y + Math.random() * 60 - 30 + "px";
      particle.style.color = settings.color;
      particle.innerHTML = settings.particles[Math.floor(Math.random() * settings.particles.length)];
      document.getElementById("game-container").appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 1500);
    }, i * 80);
  }
}

// Función para crear efecto visual de corazón temporal (mantener por compatibilidad)
function createTemporaryHeartEffect(x, y) {
  showPowerUpNotification("rerir", x, y);
}

// Función para añadir puntos considerando el multiplicador
function addPoints(basePoints, showFloatingText = true) {
  let finalPoints = basePoints;
  let multiplierText = "";

  // Aplicar bono de power-up de puntos dobles primero
  if (hasDoublePoints) {
    finalPoints *= 2;
    multiplierText = "x2";
  }

  // Aplicar multiplicador del título (se acumula con el de puntos dobles)
  const titleMultiplier = getActiveTitleBonus();
  if (titleMultiplier > 0) {
    finalPoints = Math.floor(finalPoints * titleMultiplier);
    if (hasDoublePoints) {
      // Si hay ambos, mostrar el multiplicador total
      multiplierText = `x${2 * titleMultiplier}`;
    } else {
      multiplierText = `x${titleMultiplier}`;
    }
  }

  // Multiplicador de combo real: golpes seguidos sin recibir daño (hasta x2)
  if (typeof VFX !== "undefined" && VFX.getCombo) finalPoints = Math.round(finalPoints * (1 + Math.min(20, VFX.getCombo()) * 0.05));
  score += finalPoints;
  scoreDisplay.textContent = score;
  if (typeof UIAnime !== "undefined") {
    UIAnime.scorePulse(scoreDisplay);
  } else {
    scoreDisplay.classList.remove("score-pop");
    void scoreDisplay.offsetWidth;
    scoreDisplay.classList.add("score-pop");
  }

  // Actualizar estadísticas de puntuación en tiempo real
  updateStatsOnScore(finalPoints);

  // Texto flotante de puntos (siempre que haya feedback)
  if (showFloatingText) {
    let color = "#ffeb3b";
    if (titleMultiplier >= 4) color = "#FF1493";
    else if (titleMultiplier >= 3) color = "#9b59b6";
    else if (titleMultiplier >= 2 || hasDoublePoints) color = "#FFD700";

    const label = multiplierText
      ? `+${finalPoints} ${multiplierText}`
      : `+${finalPoints}`;

    if (typeof VFX !== "undefined") {
      // El combo/kill ya dibuja el texto principal; refuerzo cerca del jugador si hay multiplicador
      if (hasDoublePoints || titleMultiplier > 0) {
        VFX.floatText(
          player.x + player.width / 2,
          player.y - 28,
          label,
          color,
          18
        );
      }
    } else {
      const floatingText = document.createElement("div");
      floatingText.className = "floating-points";
      floatingText.style.left = player.x + player.width / 2 + "px";
      floatingText.style.top = player.y - 20 + "px";
      floatingText.innerHTML = label;
      floatingText.style.color = color;
      document.getElementById("game-container").appendChild(floatingText);
      setTimeout(() => floatingText.remove(), 1000);
    }
  }

  return finalPoints;
}

// Obtener bonificación del título activo
function getActiveTitleBonus() {
  const activeTitle = loadActiveTitle();
  if (!activeTitle) return 0;

  // Buscar el item del título activo
  const titleItem = shopItems.find(
    (item) =>
      item.category === "avatars" &&
      item.content === activeTitle &&
      item.purchased
  );

  if (titleItem && titleItem.bonus && titleItem.bonus.type === "points") {
    return titleItem.bonus.multiplier; // Retornar el multiplicador completo (2, 3, o 4)
  }

  return 0;
}

// Obtener multiplicador del título como texto
function getActiveTitleMultiplierText() {
  const multiplier = getActiveTitleBonus();
  if (multiplier === 0) return "";
  return `x${multiplier}`;
}

// Explosión: motor canvas VFX (+ fallback DOM ligero)
function createExplosion(x, y, power) {
  if (typeof VFX !== "undefined") {
    VFX.explosion(x, y, power || 1);
    return;
  }
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement("div");
    particle.className = "explosion-particle";
    const size = Math.random() * 20 + 10;
    particle.style.width = size + "px";
    particle.style.height = size + "px";
    particle.style.left = x - size / 2 + "px";
    particle.style.top = y - size / 2 + "px";
    particle.style.animation = "explosion 0.5s ease-out forwards";
    const angle = (Math.PI * 2 * i) / 8;
    const distance = 30;
    const finalX = x + Math.cos(angle) * distance;
    const finalY = y + Math.sin(angle) * distance;
    particle.animate(
      [
        { transform: `translate(0, 0)` },
        { transform: `translate(${finalX - x}px, ${finalY - y}px)` },
      ],
      { duration: 500, easing: "ease-out", fill: "forwards" }
    );
    document.getElementById("game-container").appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
}

// Añade estas funciones para el joystick
function refreshJoystickCenter() {
  const joystickArea = document.getElementById("joystickArea");
  if (!joystickArea) return;
  const rect = joystickArea.getBoundingClientRect();
  joystickCenter.x = rect.left + rect.width / 2;
  joystickCenter.y = rect.top + rect.height / 2;
  maxJoystickDistance = Math.max(28, rect.width * 0.32);
}

function initJoystick() {
  const joystickArea = document.getElementById("moveZone") || document.getElementById("joystickArea");
  const joystick = document.getElementById("joystick");
  if (!joystickArea || !joystick) return;

  joystickArea.addEventListener("touchstart", handleJoystickStart, {
    passive: false,
  });
  joystickArea.addEventListener("touchmove", handleJoystickMove, {
    passive: false,
  });
  joystickArea.addEventListener("touchend", handleJoystickEnd, {
    passive: false,
  });
  joystickArea.addEventListener("touchcancel", handleJoystickEnd, {
    passive: false,
  });

  refreshJoystickCenter();
  window.addEventListener("resize", refreshJoystickCenter);
  window.addEventListener("orientationchange", () => {
    setTimeout(refreshJoystickCenter, 120);
  });
}

function handleJoystickStart(e) {
  e.preventDefault();
  const touch = e.changedTouches[0];
  joyTouchId = touch.identifier;
  // Joystick flotante: aparece donde apoyas el pulgar
  const area = document.getElementById("joystickArea");
  area.style.transform = "none";
  const r = area.getBoundingClientRect();
  area.style.transform = `translate(${touch.clientX - (r.left + r.width / 2)}px, ${touch.clientY - (r.top + r.height / 2)}px)`;
  joystickActive = true;
  document.getElementById("joystick").classList.add("active");
  updateJoystickPosition(touch);
}

function handleJoystickMove(e) {
  e.preventDefault();
  if (!joystickActive) return;
  const touch = Array.from(e.touches).find((t) => t.identifier === joyTouchId);
  if (!touch) return;
  updateJoystickPosition(touch);
}

function handleJoystickEnd(e) {
  e.preventDefault();
  if (Array.from(e.touches).some((t) => t.identifier === joyTouchId)) return;
  joystickActive = false;
  const joystick = document.getElementById("joystick");
  joystick.style.transform = "translate(-50%, -50%)";
  joystick.classList.remove("active");

  // Detener movimiento del jugador
  player.movingLeft = false;
  player.movingRight = false;
  player.movingUp = false;
  player.movingDown = false;
}

function updateJoystickPosition(touch) {
  const joystick = document.getElementById("joystick");
  const area = document.getElementById("joystickArea");
  const rect = area.getBoundingClientRect();

  // Calcular la distancia desde el centro
  let deltaX = touch.clientX - (rect.left + rect.width / 2);
  let deltaY = touch.clientY - (rect.top + rect.height / 2);

  // Limitar la distancia máxima
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  if (distance > maxJoystickDistance) {
    const angle = Math.atan2(deltaY, deltaX);
    deltaX = Math.cos(angle) * maxJoystickDistance;
    deltaY = Math.sin(angle) * maxJoystickDistance;
  }

  // Mover el joystick
  joystick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

  player.movingLeft = deltaX < -deadzone;
  player.movingRight = deltaX > deadzone;
  player.movingUp = deltaY < -deadzone;
  player.movingDown = deltaY > deadzone;

  // Ajustar la velocidad según la distancia con una curva de aceleración suave
  const speedMultiplier = Math.pow(
    Math.min(distance / maxJoystickDistance, 1),
    1.5
  );
  player.speed = 7 * speedMultiplier; // Cambio de 10 a 7
}
function applyFireRateDebuff() {
  if (isFireRateReduced) {
    fireRateDebuffTimeLeft = 10;
    return;
  }

  isFireRateReduced = true;
  normalFireRate = 800; // más lento
  fireRateDebuffTimeLeft = 10;

  // Mostrar notificación de debuff
  showPowerUpNotification(
    "ifa",
    player.x + player.width / 2,
    player.y + player.height / 2
  );

  const fireRateDebuffDisplay = document.getElementById("fireRateDebuff");
  const debuffTimerSpan = document.getElementById("debuffTimer");
  fireRateDebuffDisplay.style.display = "block";
  debuffTimerSpan.textContent = fireRateDebuffTimeLeft;

  fireRateDebuffTimer = gSetInterval(() => {
    fireRateDebuffTimeLeft--;
    debuffTimerSpan.textContent = fireRateDebuffTimeLeft;

    if (fireRateDebuffTimeLeft <= 0) {
      isFireRateReduced = false;
      normalFireRate = 500; // volver al normal
      fireRateDebuffDisplay.style.display = "none";
      gClear(fireRateDebuffTimer);
      fireRateDebuffTimer = null;
    }
  }, 1000);
}

function placeBossBar() {
  const g = document.getElementById("lifeGem"), c = document.getElementById("game-container");
  if (g && c && g.offsetParent) { const gb = g.getBoundingClientRect().bottom - c.getBoundingClientRect().top; bossBar.style.top = Math.max(112, Math.ceil(gb) + 8) + "px"; }
}
// Elementos para la barra de vida y nombre del boss
const bossBar = document.createElement("div");
bossBar.id = "bossBar";
bossBar.style.position = "absolute";
bossBar.style.top = "calc(112px + env(safe-area-inset-top, 0px))"; // debajo del HUD y de pausa/ajustes
bossBar.style.left = "50%";
bossBar.style.transform = "translateX(-50%)";
bossBar.style.width = "min(360px, 70vw)";
bossBar.style.height = "auto";
bossBar.style.background = "transparent";
bossBar.style.border = "0";
bossBar.style.borderRadius = "10px";
bossBar.style.display = "none";
bossBar.style.zIndex = "1002";
bossBar.innerHTML = `
    <div id="bossName" style="text-align:center;font:700 12px 'Exo 2',sans-serif;color:#EAF2FF;margin-bottom:2px;text-shadow:1px 1px 0 #0B0F1E;">${bossName}</div>
    <div id="bossHealthBar" style="width:100%;height:8px;background:#0B0F1E;border:2px solid #EAF2FF;border-radius:2px;overflow:hidden;box-sizing:content-box;">
        <div id="bossHealthFill" style="width:100%;height:100%;background:#9B6BFF;transition:width 0.3s;"></div>
    </div>
`;
document.getElementById("game-container").appendChild(bossBar);

// El jefe arranca debajo de la barra (nombre + vida), así el nombre nunca tapa el sprite.
function bossTopY() {
  const c = canvas.getBoundingClientRect(); let y = 40;
  try { const was = bossBar.style.display; bossBar.style.visibility = "hidden"; bossBar.style.display = "block"; placeBossBar();
    const b = bossBar.getBoundingClientRect(); y = Math.max(40, Math.ceil((b.bottom - c.top) * GH / c.height) + 6);
    bossBar.style.display = was; bossBar.style.visibility = ""; } catch (e) {}
  return Math.min(y, Math.max(40, GH - 128 - 200));
}
function spawnBoss() {
  // Vida del jefe según el DPS real de la jugadora: la pelea dura ~30–60 s.
  const m = typeof Rogue !== "undefined" ? Rogue.mods : { fireRate: 1, spread: 0, dmg: 1 };
  const shotsPerSec = 1000 / Math.max(60, normalFireRate * m.fireRate);
  const hitsPerSec = shotsPerSec * (1 + m.spread * 0.6); // las diagonales no siempre pegan
  // Relativo a tu daño base: las cartas de cadencia, abanico y daño lo suben; el nivel suma un 5 % por nivel desde el 10.
  const baseHps = 1000 / Math.max(60, normalFireRate);
  const ratio = Math.min(3, Math.max(0.8, (hitsPerSec * (m.dmg || 1)) / baseHps));
  bossHealth = Math.round(280 * ratio * Math.max(1, 1 + (level - 10) * 0.07));
  if (!Number.isFinite(bossHealth)) bossHealth = 560;
  boss = {
    x: GW / 2 - 128,
    y: bossTopY(),
    width: 256,
    height: 128,
    health: bossHealth,
    image: new Image(),
    attackTimer: 0,
    meteorTimer: 0,
    appearing: true,
    appearAnim: 0,
    dying: false,
    damageAnim: 0,
  };
  boss.image.src = "assets/Boss.png";
  bossActive = true;
  bossBar.style.display = "block";
  placeBossBar(); // nunca encima de la gema de vida
  updateBossBar();

  // Animación de aparición
  boss.appearing = true;
  boss.appearAnim = 0;

  if (typeof VFX !== "undefined") {
    // v2.2.2: sin cartel '¡cuidado!' (tapaba al jefe y se juntaba con 'fase 1 ¡ojo!')
    VFX.explosion(boss.x + boss.width / 2, boss.y + boss.height / 2, 2);
  }

  // Tema épico de jefe (CC0)
  if (typeof SFX !== "undefined" && SFX.startBossMusic) SFX.startBossMusic();

  // Bloquear enemigos normales
  enemies = [];
  if (typeof Foes !== "undefined") Foes.clear();
}

function animateBoss(ctx) {
  if (!boss) return;
  ctx.save();

  // Movimiento lateral simple
  if (!boss.dying && !boss.appearing) {
    boss.x += Math.sin(gameNow() / 600) * 2 * FK; // Oscila suavemente
    // Rebote en los bordes
    if (boss.x < 0) boss.x = 0;
    if (boss.x + boss.width > GW) boss.x = GW - boss.width;
  }

  // Animación de aparición
  let scale = 1;
  let opacity = 1;
  if (boss.appearing) {
    boss.appearAnim += 0.04;
    scale = Math.min(1, boss.appearAnim);
    opacity = Math.min(1, boss.appearAnim);
    if (scale >= 1) boss.appearing = false;
  }

  // Animación de daño
  if (boss.damageAnim > 0) {
    opacity = 0.5 + 0.5 * Math.sin(boss.damageAnim * 20);
    boss.damageAnim -= 0.08;
    if (boss.damageAnim < 0) boss.damageAnim = 0;
  }

  // Animación de muerte
  if (boss.dying) {
    scale = 1 + boss.dying * 0.5;
    opacity = 1 - boss.dying;
    boss.dying += 0.04;
    if (boss.dying > 1) {
      bossActive = false;
      bossBar.style.display = "none";
      boss = null;
    }
  }

  ctx.globalAlpha = opacity;
  ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2);
  ctx.scale(scale, scale);
  ctx.drawImage(
    boss.image,
    -boss.width / 2,
    -boss.height / 2,
    boss.width,
    boss.height
  );
  ctx.restore();
  ctx.globalAlpha = 1;
}

function bossAttack() {
  if (!boss || boss.appearing || boss.dying) return;
  // Ataque especial: disparo múltiple cada 2 segundos
  if (gameNow() - boss.attackTimer > 8000) { // ráfaga de 3 con huecos esquivables
    const bag = window.enemyBullets || enemyBullets;
    for (const i of [-1, 1]) { // dos balas a los lados: el centro queda libre para disparar
      bag.push({
        x: boss.x + boss.width / 2 + i * 72,
        y: boss.y + boss.height,
        speed: 2.6,
        width: 8,
        height: 18,
        src: 'jefe:ráfaga',
      });
    }
    boss.attackTimer = gameNow();
  }
  // Ataque especial: lluvia de meteoritos cada 5 segundos
  if (gameNow() - boss.meteorTimer > 5000) {
    for (let i = 0; i < 2; i++) { // dos meteoros chicos (×3 = 48 px): amenaza, no muro
      meteors.push(makeMeteor(RNG() * (GW - 48), boss.y + boss.height, false, 3, 3.2 + RNG() * 1.4));
    }
    boss.meteorTimer = gameNow();
  }
}

function handleBossHit() {
  if (!boss || boss.dying) return;
  boss.health--;
  boss.damageAnim = 1; // Inicia animación de daño
  if (typeof Magia !== "undefined") Magia.onHit();
  bossBar.classList.add("boss-bar-damage");
  setTimeout(() => bossBar.classList.remove("boss-bar-damage"), 300);
  updateBossBar();
  if (typeof VFX !== "undefined") {
    VFX.hitSpark(boss.x + boss.width / 2, boss.y + boss.height / 2);
    VFX.shake(4);
  }
  if (boss.health <= 0) {
    // Guarda la posición antes de eliminar el boss
    const bossX = boss.x;
    const bossY = boss.y;
    const bossWidth = boss.width;
    const bossHeight = boss.height;

    // Actualizar estadísticas de muerte de boss
    updateStatsOnBossKill();

    // Explosión épica
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        createExplosion(
          bossX + bossWidth / 2 + Math.cos((Math.PI * 2 * i) / 12) * 80,
          bossY + bossHeight / 2 + Math.sin((Math.PI * 2 * i) / 12) * 60,
          1.4
        );
      }, i * 80);
    }
    if (typeof VFX !== "undefined") {
      VFX.shake(14);
      VFX.floatText(
        bossX + bossWidth / 2,
        bossY + bossHeight / 2,
        (boss && boss.rosterId === "paimon") ? "¡Paimon… se fue a comer!" :
        (boss && boss.rosterId === "walpurgia") ? "el carnaval calla" :
        (boss && boss.rosterId === "labyrinth") ? "el laberinto se rompe" :
        "la bruja cayó",
        "#ff1744",
        36
      );
      VFX.levelUp(level + 1);
    }
    score += 100; // Suficiente para pasar de nivel
    scoreDisplay.textContent = score;

    // Actualizar estadísticas de puntuación en tiempo real
    updateStatsOnScore(100);

    // Sonido de victoria
    try {
      const victorySound = SFX.audio("explosion");
      victorySound.play().catch(() => {});
    } catch (e) {}
    // Volver a música de exploración
    if (typeof SFX !== "undefined" && SFX.stopBossMusic) SFX.stopBossMusic(true);
    // Botín de power-ups en el punto de muerte
    dropBossLoot(bossX + bossWidth / 2, bossY + bossHeight / 2, "boss");
    // Eliminar boss inmediatamente
    bossActive = false;
    bossBar.style.display = "none";
    boss = null;
    // Premio por ganarle al jefe: +3 gemas (sin pasar del máximo) y 10 s de respiro sin enemigos.
    player.hearts = Math.max(player.hearts, Math.min(maxHearts + (hasExtraHeart ? 1 : 0), player.hearts + 3));
    window.__postBossAt = gameNow();
    if (typeof updateHeartsDisplay === "function") updateHeartsDisplay();
    if (typeof showMiniToast === "function") showMiniToast("¡le ganaste! +3 gemas · botín · respira", 2200);
    // Sube de nivel y limpia enemigos (el botín ya está dropeado)
    level++;
    levelDisplay.textContent = `Nivel: ${level}`;
    // no vaciar enemies: puede haber arma-xiao del botín
    // Permitir que vuelvan a aparecer enemigos normales
    if (typeof enemySpawnInterval !== "undefined")
      gClear(enemySpawnInterval);
    spawnEnemies();
    if (typeof Rogue !== "undefined") {
      Rogue.offerUpgrades(level, { title: "¡Jefe derrotado! · escoge una" });
    }
  }
}

function updateBossBar() {
  if (!boss) return;
  const percent = (boss.health / bossHealth) * 100;
  document.getElementById("bossHealthFill").style.width = percent + "%";
}

// Logros → js/achievements.js | Tienda/títulos → js/shop.js

function setPaused(p, silent) {
  if (!p && typeof Rogue !== "undefined" && Rogue.choosing) return; // primero elige la mejora
  gamePaused = !!p;
  document.body.classList.toggle("game-paused", gamePaused && !silent);
  if (gamePaused) { player.shooting = false; if (typeof SFX !== "undefined") SFX.suspend(); }
  else { __lastFrameTs = performance.now(); if (typeof __lastTouchTs !== "undefined") __lastTouchTs = performance.now(); if (typeof SFX !== "undefined") SFX.resume(); }
}
window.setPaused = setPaused;
window.isGameRunning = () => gameRunning;
document.addEventListener("visibilitychange", () => {
  if (document.hidden && gameRunning) setPaused(true);
});
window.addEventListener("pagehide", () => gameRunning && setPaused(true));

// Subida de nivel (se usa también desde foes.js). Ofrece mejoras roguelike.
function maybeLevelUp(prevScore) {
  if (typeof Rogue === "undefined") return;
  // Ritmo: además del puntaje, cada nivel pide tiempo mínimo.
  if (score >= Rogue.nextLevelAt && gameNow() >= Rogue.levelMinTime(level)) {
    Rogue.nextLevelAt += Rogue.levelStep(level + 1);
    level++;
    levelDisplay.textContent = `Nivel: ${level}`;
    if (typeof VFX !== "undefined") VFX.levelUp(level);
    const miniLvls = (typeof CONFIG !== "undefined" && CONFIG.BOSS.MINI_LEVELS) || [4, 7, 13, 16, 22, 25];
    if (level % 10 === 0 || miniLvls.includes(level)) {
      enemies = [];
      if (typeof Foes !== "undefined") Foes.clear();
    }
    // Acelerar spawns al subir de nivel
    if (gameRunning && !bossActive && !(typeof Bosses !== "undefined" && Bosses.isMini())) rescheduleSpawner();
    if (level === 5 || level === 8 || level === 11 || level === 15 || level === 21) {
      if (typeof showMiniToast === "function") {
        const msg =
          level === 11 ? "el laberinto se cierra…" :
          level === 15 ? "las brujas se reúnen…" :
          level === 21 ? "el carnaval no termina…" :
          "la presión sube";
        showMiniToast(msg, 1600);
      }
    }
    // Intentar mini-jefe / jefe al cruzar el hito
    if (typeof Bosses !== "undefined") Bosses.trySpawnForLevel(level);
    // Cartas solo en hitos 5 / 10 / 15 / 20… (el jefe también otorga al morir)
    if (typeof Rogue !== "undefined" && Rogue.isMilestoneLevel(level)) {
      Rogue.offerUpgrades(level);
    }
  }
}

// Pausa por inactividad (solo táctil): ~3 s sin ningún dedo en pantalla.
// Levantar el dedo NO pausa al instante.
let __lastTouchTs = performance.now(), __touchesDown = 0;
["touchstart", "touchmove"].forEach((ev) =>
  document.addEventListener(ev, (e) => { __lastTouchTs = performance.now(); __touchesDown = e.touches.length; }, { passive: true, capture: true })
);
["touchend", "touchcancel"].forEach((ev) =>
  document.addEventListener(ev, (e) => { __lastTouchTs = performance.now(); __touchesDown = e.touches.length; }, { passive: true, capture: true })
);
setInterval(() => {
  if (!gameRunning || gamePaused || !document.body.classList.contains("touch-ui")) return;
  if (typeof Rogue !== "undefined" && Rogue.choosing) return;
  // Grace al iniciar / tras reanudar: no pausar los primeros 2.5 s
  if (gameNow() < 2500) return;
  if (__touchesDown === 0 && performance.now() - __lastTouchTs > 3000) setPaused(true);
}, 500);

// Transición de pantalla: corte de tijera de papel
function scissorCut() {
  const el = document.getElementById("scissorCut");
  if (!el || (typeof VFX !== "undefined" && VFX.isReducedMotion())) return;
  el.classList.remove("run"); void el.offsetWidth; el.classList.add("run");
  setTimeout(() => el.classList.remove("run"), 400);
}
window.scissorCut = scissorCut;

// Aviso corto: tira de 32 px abajo al centro (no tapa vidas ni botones)
function showMiniToast(text, ms, opts) {
  let el = document.getElementById("miniToast");
  if (!el) { el = document.createElement("div"); el.id = "miniToast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = text;
  // encima de los controles (DISPARAR, MAGIA, barra Magia, joystick) con 8 px de margen
  let top = window.innerHeight;
  ["shootButton", "magiaBtn", "magiaHud", "joystickArea", "shootCooldownBarMobile"].forEach((id) => {
    const n = document.getElementById(id); if (!n) return;
    const r = n.getBoundingClientRect(); if (r.width && r.height && r.top < top) top = r.top;
  });
  if (opts && opts.top) { // avisos de fase: arriba, debajo de la barra del jefe; nunca sobre la nave
    const bb = bossBar && bossBar.style.display !== "none" ? bossBar.getBoundingClientRect().bottom : 112;
    el.style.bottom = "auto"; el.style.top = Math.round(bb + 8) + "px"; el.classList.add("top");
  } else { el.style.top = ""; el.classList.remove("top"); el.style.bottom = Math.max(8, window.innerHeight - top + 8) + "px"; }
  el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), ms || 2000);
}
window.showMiniToast = showMiniToast;
