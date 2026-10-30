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
gameOverDisplay.style.position = "absolute";
gameOverDisplay.style.top = "50%";
gameOverDisplay.style.left = "50%";
gameOverDisplay.style.transform = "translate(-50%, -50%)";
gameOverDisplay.style.fontSize = "50px";
gameOverDisplay.style.color = "white";
gameOverDisplay.style.display = "none";
gameOverDisplay.style.zIndex = "1000";
gameOverDisplay.style.textAlign = "center";
gameOverDisplay.innerHTML =
  "<div class='go-title'>se acabó la ronda</div><button id='restartBtn'>otra vez</button>";
document.getElementById("game-container").appendChild(gameOverDisplay);

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
let xiaos = []; // Array para los kits especiales xiao
let arlees = []; // Array para los power-ups de velocidad de disparo
let cynos = []; // Array para los power-ups de invulnerabilidad
let flins = []; // Array para los power-ups de puntos dobles
let rerirs = []; // Array para los power-ups de corazón temporal
let hasTemporaryHeart = false; // Control del corazón temporal
let temporaryHeartTimer = null;
let temporaryHeartTimeLeft = 10; // 10 segundos de corazón temporal
let hasFireRateBoost = false; // Control del power-up activo
let normalFireRate = 500; // Cadencia normal de disparo (500ms)
let boostedFireRate = 150; // Cadencia mejorada de disparo (150ms)
let hasDoublePoints = false; // Control del power-up de puntos dobles
let doublePointsTimer = null;
let doublePointsTimeLeft = 30; // 30 segundos de puntos dobles
let maxHearts = 3; // Corazones base máximos
let hasExtraHeart = false; // Controla si el jugador tiene el corazón extra
let isInvulnerable = false; // Control de invulnerabilidad
let invulnerabilityTimer = null;
let invulnerabilityTimeLeft = 10; // 10 segundos de invulnerabilidad
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
function updateStatsOnShoot() {}
function updateStatsOnScore() {}
function updateStatsOnDamage() {}
function updateStatsOnGameStart() {}
function updateStatsOnGameEnd() {}
function updateStatsOnKill() {}
function updateStatsOnBossKill() {}
function updateStatsOnPowerUpCollected() {}
function checkAchievements() {}
let bossActive = false;
let bossHealth = 40; // laberinto con 3 fases
const bossName = "Astraeus, Señor del Vacío";
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
    canShoot: false,
    lastShot: 0,
  };

  // Determinar el tipo de enemigo basado en el nivel
  if (level >= 30 && RNG() > 0.9) {
    // Enemigo tipo 4 (artillero)
    enemy.health = 2;
    enemy.speed = 0.5; // Muy lento
    enemy.canShoot = true; // Puede disparar
    enemy.image.src = "assets/enemy4.png";
  } else if (level >= 20 && RNG() > 0.85) {
    // Enemigo tipo 3 (muy rápido)
    enemy.health = 2;
    enemy.speed = RNG() * 4 + 5; // Velocidad entre 7 y 13
    enemy.image.src = "assets/enemy3.png";
  } else if (level >= 10 && RNG() > 0.8) {
    // Enemigo tipo 2 (resistente)
    enemy.health = 3;
    enemy.speed = RNG() * 2 + 1; // Velocidad entre 1 y 3
    enemy.image.src = "assets/enemy2.png";
  } else {
    // Enemigo tipo 1 (normal)
    enemy.health = 1;
    enemy.speed = RNG() * 2 + 1; // Velocidad entre 1 y 3
    enemy.image.src = "assets/enemy1.png";
  }
  if (RNG() < 0.1) {
    enemy.health = 1;
    enemy.speedX = 2.5;
    enemy.speedY = 3.5;
    enemy.image.src = "assets/xiao_weapon.png";
    { const p = Math.max(0, level - 10); if (p) { enemy.speed *= 1 + 0.25 * p; enemy.health += Math.floor(p * 0.75); } } // post-jefe: más rápidos y duros
  enemies.push(enemy);
    return;
  }
  if (RNG() < 0.06) {
    // 6% de probabilidad
    spawnIfa();
  }

  enemies.push(enemy);
}

// función para que el enemigo dispare
function enemyShoot(enemy) {
  const currentTime = gameNow();
  if (currentTime - enemy.lastShot > 3000) {
    // Dispara cada 3 segundos
    enemyBullets.push({
      x: enemy.x + enemy.width / 2,
      y: enemy.y + enemy.height,
      speed: 5,
      width: 3,
      height: 8,
    });
    enemy.lastShot = currentTime;
  }
}

function spawnKit() {
  const kit = {
    x: RNG() * (GW - 50),
    y: -50,
    width: 50, // Aumentar el tamaño del kit
    height: 50, // Aumentar el tamaño del kit
    speed: 2,
    image: new Image(),
  };
  kit.image.src = "assets/laberinto/semilla_idle.png"; // botiquín = semilla
  kits.push(kit);
}

// Meteoro: hoja 128x48. Grande 4×32px, chico 4×16px, escombros 3×6px. Giro por cuadros cada 150 ms, sin rotar el canvas.
const MeteorSheet = new Image(); MeteorSheet.src = "assets/meteoro/meteoro-sheet.png";
let meteorDebris = [];
function makeMeteor(x, y, big, px, speed) {
  const s = big ? 32 : 16, w = s * px;
  return { x, y, width: w, height: w, big, px, speed, health: big ? 2 : 1, t0: gameNow() + Math.floor(RNG() * 600) };
}
function drawMeteor(m) {
  const s = m.big ? 32 : 16, f = Math.floor((gameNow() - m.t0) / 150) & 3;
  if (MeteorSheet.complete && MeteorSheet.naturalWidth) ctx.drawImage(MeteorSheet, f * s, m.big ? 0 : 32, s, s, Math.round(m.x), Math.round(m.y), m.width, m.height);
}
function breakMeteor(m) {
  const n = 3 + Math.floor(Math.random() * 3); // 3–5 escombros (solo efecto)
  for (let k = 0; k < n; k++) meteorDebris.push({ x: m.x + m.width / 2, y: m.y + m.height / 2, vx: (Math.random() - 0.5) * 4, vy: -1 - Math.random() * 2, p: k % 3, life: 700, px: m.px });
}
function drawMeteorDebris(dtMs) {
  for (let i = meteorDebris.length - 1; i >= 0; i--) {
    const d = meteorDebris[i]; d.x += d.vx * FK; d.y += d.vy * FK; d.vy += 0.15 * FK; d.life -= dtMs;
    if (d.life <= 0) { meteorDebris.splice(i, 1); continue; }
    if (MeteorSheet.complete && MeteorSheet.naturalWidth) ctx.drawImage(MeteorSheet, 64 + d.p * 8, 32, 6, 6, Math.round(d.x), Math.round(d.y), 6 * d.px, 6 * d.px);
  }
}

function spawnMeteor() {
  meteors.push(makeMeteor(RNG() * (GW - 64), -64, true, 2, 3)); // grande, escala entera ×2
}

// la función para crear el kit especial xiao
function spawnXiao() {
  const xiao = {
    x: RNG() * (GW - 50),
    y: -50,
    width: 48,
    height: 48,
    speed: 1.5, // Más lento que el kit normal
    image: new Image(),
  };
  xiao.image.src = "assets/xiao.png"; // Necesitarás una imagen especial para este kit
  xiaos.push(xiao);
}

// la función para crear el power-up arlee
function spawnArlee() {
  const arlee = {
    x: RNG() * (GW - 50),
    y: -60,
    width: 48,
    height: 48,
    speed: 2,
    image: new Image(),
  };
  arlee.image.src = "assets/arlee.png";
  arlees.push(arlee);
}

// la función para crear el power-up cyno
function spawnCyno() {
  const cyno = {
    x: RNG() * (GW - 50),
    y: -60,
    width: 48,
    height: 48,
    speed: 2,
    image: new Image(),
  };
  cyno.image.src = "assets/cyno.png";
  cynos.push(cyno);
}

function spawnXiaoWeapon() {
  const xiaoWeapon = {
    x: RNG() * (GW - 50),
    y: -50,
    width: 50,
    height: 50,
    speedX: 2.5, // velocidad horizontal
    speedY: 3.5, // velocidad vertical
    health: 2,
    image: new Image(),
  };
  xiaoWeapon.image.src = "assets/xiao_weapon.png";
  enemies.push(xiaoWeapon);
}
function spawnIfa() {
  const ifa = {
    x: RNG() * (GW - 50),
    y: -50,
    width: 50,
    height: 50,
    speed: 1.5,
    image: new Image(),
    health: 1,
  };
  ifa.image.src = "assets/ifa.png";
  enemies.push(ifa);
}

// la función para crear el power-up flins (puntos dobles)
function spawnFlins() {
  const flin = {
    x: RNG() * (GW - 50),
    y: -50,
    width: 48,
    height: 48,
    speed: 2,
    image: new Image(),
  };
  flin.image.src = "assets/flins.png";
  flins.push(flin);
}

// la función para crear el power-up rerir (corazón temporal)
function spawnRerir() {
  const rerir = {
    x: RNG() * (GW - 50),
    y: -50,
    width: 48,
    height: 48,
    speed: 2,
    image: new Image(),
  };
  rerir.image.src = "assets/rerir.png";
  rerirs.push(rerir);
}

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

    if (bullet.y > GH) {
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
        invulnerabilityTimeLeft = 10;
      } else {
        // Activar invulnerabilidad por primera vez
        isInvulnerable = true;
        invulnerabilityTimeLeft = 10;
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

  // Boss logic
  if (bossActive && boss) {
    animateBoss(ctx); // animación y dibujo del boss
    bossAttack();

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

  // Boss aparece en nivel 10
  if (level === 10 && !bossActive && !boss) {
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
  scissorCut();
  if (typeof Rogue !== "undefined") Rogue.showSummary(gameOverDisplay);
  if (typeof UIAnime !== "undefined") {
    UIAnime.gameOver(gameOverDisplay);
  } else {
    gameOverDisplay.style.display = "block";
  }
  canvas.style.filter = "grayscale(100%)";

  // Pausar la música cuando el juego termina
  const music = initBgMusic();
  if (music) {
    music.pause();
    console.log("Música pausada al terminar el juego");
  }

  // Remover clase cuando el juego termina
  document.body.classList.remove("game-running");
  refreshTouchUiMode();

  // Actualizar estadísticas de fin de partida
  updateStatsOnGameEnd();

  saveScore();
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
  // Remover clase antes de recargar
  document.body.classList.remove("game-running");
  window.location.reload();
});

function startGame() {
  scissorCut();
  GameClock.reset();
  player.iframesUntil = 0; window.__postBossAt = null;
  // Estado de power-ups de la partida anterior (sus temporizadores se borran con el reloj): volver a lo normal.
  normalFireRate = 500; isFireRateReduced = false; hasFireRateBoost = false; hasDoublePoints = false; isInvulnerable = false; hasTemporaryHeart = false;
  xiaos = []; arlees = []; cynos = []; flins = []; rerirs = []; kits = []; meteors = []; enemyBullets = []; bullets = [];
  bossActive = false; boss = null; if (typeof bossBar !== "undefined") bossBar.style.display = "none";
  player.canShoot = true; // el reloj se reinicia: el enfriamiento pendiente se cancela
  player.x = GW / 2 - player.width / 2;
  player.y = GH - 80;
  if (typeof Rogue !== "undefined") Rogue.newRun();
  if (typeof Foes !== "undefined") Foes.clear();
  if (typeof Magia !== "undefined") Magia.reset();
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
  enemyBullets = []; // Limpiar las balas enemigas
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
  invulnerabilityTimeLeft = 10;
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
  gameOverDisplay.style.display = "none";
  canvas.style.filter = "none";

  // Añadir clase para ocultar controles de menú
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

    console.log("Intentando reproducir música, volumen:", music.volume);

    music
      .play()
      .then(() => {
        console.log("Música reproduciéndose correctamente");
      })
      .catch((error) => {
        console.log("Error al reproducir música:", error);
        // Intentar reproducir en el próximo clic del usuario
        document.addEventListener(
          "click",
          function playMusic() {
            music
              .play()
              .then(() => {
                console.log("Música iniciada después de clic del usuario");
              })
              .catch(() => {});
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
  player.iframesUntil = gameNow() + (bossActive ? 3500 : 1000); // contra el jefe, más respiro tras un golpe
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

  if (RNG() < 0.03 && player.hearts === maxHearts && !hasExtraHeart) spawnXiao();
  if (RNG() < Math.max(0.04, 0.07 - Math.max(0, level - 8) * 0.004)) spawnArlee();
  if (RNG() < 0.035) spawnCyno();
  if (level <= 2 && RNG() < 0.08) spawnFlins();
  if (player.hearts === 1 && !hasTemporaryHeart && RNG() < 0.16) spawnRerir();
  if (RNG() < Math.min(0.16, 0.08 + level * 0.006)) spawnXiaoWeapon();
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

    // Evento para manejar errores de carga
    bgMusic.addEventListener("error", (e) => {
      console.log("Error al cargar la música:", e);
    });

    // Evento cuando la música está lista para reproducir
    bgMusic.addEventListener("canplay", () => {
      console.log("Música lista para reproducir");
    });

    console.log("Música de fondo inicializada");
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
  bossHealth = Math.round(200 * ratio * Math.max(1, 1 + (level - 10) * 0.05));
  if (!Number.isFinite(bossHealth)) bossHealth = 420;
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

  // Bloquear enemigos normales
  enemies = [];
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
    for (const i of [-1, 1]) { // dos balas a los lados: el centro queda libre para disparar
      enemyBullets.push({
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
    // Eliminar boss inmediatamente
    bossActive = false;
    bossBar.style.display = "none";
    boss = null;
    // Premio por ganarle al jefe: +3 gemas (sin pasar del máximo) y 10 s de respiro sin enemigos.
    player.hearts = Math.max(player.hearts, Math.min(maxHearts + (hasExtraHeart ? 1 : 0), player.hearts + 3));
    window.__postBossAt = gameNow();
    if (typeof updateHeartsDisplay === "function") updateHeartsDisplay();
    if (typeof showMiniToast === "function") showMiniToast("¡le ganaste! +3 gemas · respira", 2200);
    // Sube de nivel y limpia enemigos
    level++;
    levelDisplay.textContent = `Nivel: ${level}`;
    enemies = [];
    // Permitir que vuelvan a aparecer enemigos normales
    if (typeof enemySpawnInterval !== "undefined")
      gClear(enemySpawnInterval);
    spawnEnemies();
  }
}

function updateBossBar() {
  if (!boss) return;
  const percent = (boss.health / bossHealth) * 100;
  document.getElementById("bossHealthFill").style.width = percent + "%";
}

// =================== SISTEMA DE LOGROS ÉPICO ===================

// Estadísticas del jugador para logros
let playerStats = {
  totalScore: 0,
  cumulativeScore: 0, // Nueva estadística para puntuación acumulativa
  totalKills: 0,
  totalShots: 0,
  totalGameTime: 0,
  maxLevel: 0,
  maxHearts: 0,
  powerUpsCollected: 0,
  bossesKilled: 0,
  meteorsDestroyed: 0,
  gamesPlayed: 0,
  totalDamageReceived: 0,
  consecutiveKills: 0,
  maxConsecutiveKills: 0,
  xiaosCollected: 0,
  arleesCollected: 0,
  cynosCollected: 0,
  kitsCollected: 0,
  flinsCollected: 0,
  timeWithoutDamage: 0,
  maxTimeWithoutDamage: 0,
  perfectLevels: 0,
  enemyTypesKilled: {
    type1: 0,
    type2: 0,
    type3: 0,
    type4: 0,
    fast: 0,
    tank: 0,
    kamikaze: 0,
    fan: 0,
    splitter: 0,
    familiar: 0,
    ribbon: 0,
    grief: 0,
    witch: 0,
    sniper: 0,
    orbiter: 0,
    ifa: 0,
    xiao_weapon: 0,
  },
  sessionStartTime: 0,
};

// Definición de todos los logros épicos
const achievements = [
  {
    id: "first_blood",
    name: "Primera señal",
    description: "Destruye tu primer enemigo en combate.",
    category: "combat",
    rarity: "common",
    points: 10,
    icon: "sword",
    condition: () => playerStats.totalKills >= 1,
    unlocked: false,
  },
  {
    id: "newbie_killer",
    name: "Cadete de combate",
    description: "Elimina 5 enemigos.",
    category: "combat",
    rarity: "common",
    points: 15,
    icon: "sword",
    condition: () => playerStats.totalKills >= 5,
    unlocked: false,
  },
  {
    id: "marksman",
    name: "Puntería firme",
    description: "Dispara 100 veces.",
    category: "combat",
    rarity: "common",
    points: 15,
    icon: "target",
    condition: () => playerStats.totalShots >= 100,
    unlocked: false,
  },
  {
    id: "trigger_happy",
    name: "Ráfaga inicial",
    description: "Dispara 25 veces.",
    category: "combat",
    rarity: "common",
    points: 10,
    icon: "blast",
    condition: () => playerStats.totalShots >= 25,
    unlocked: false,
  },
  {
    id: "slayer",
    name: "Cazadora orbital",
    description: "Destruye 50 enemigos.",
    category: "combat",
    rarity: "rare",
    points: 25,
    icon: "skull",
    condition: () => playerStats.totalKills >= 50,
    unlocked: false,
  },
  {
    id: "genocide",
    name: "Tormenta del vacío",
    description: "Destruye 500 enemigos.",
    category: "combat",
    rarity: "epic",
    points: 50,
    icon: "skull",
    condition: () => playerStats.totalKills >= 500,
    unlocked: false,
  },
  {
    id: "killing_spree",
    name: "Racha encendida",
    description: "Elimina 10 enemigos seguidos sin recibir daño.",
    category: "combat",
    rarity: "rare",
    points: 30,
    icon: "fire",
    condition: () => playerStats.maxConsecutiveKills >= 10,
    unlocked: false,
  },
  {
    id: "unstoppable",
    name: "Imparable",
    description: "Elimina 25 enemigos seguidos sin recibir daño.",
    category: "combat",
    rarity: "epic",
    points: 75,
    icon: "bolt",
    condition: () => playerStats.maxConsecutiveKills >= 25,
    unlocked: false,
  },
  {
    id: "boss_slayer",
    name: "Cazadora de jefes",
    description: "Derrota a tu primer jefe.",
    category: "combat",
    rarity: "epic",
    points: 100,
    icon: "crown",
    condition: () => playerStats.bossesKilled >= 1,
    unlocked: false,
  },
  {
    id: "boss_destroyer",
    name: "Rompetitanes",
    description: "Derrota 5 jefes.",
    category: "combat",
    rarity: "legendary",
    points: 200,
    icon: "dragon",
    condition: () => playerStats.bossesKilled >= 5,
    unlocked: false,
  },
  {
    id: "meteor_master",
    name: "Rompecometas",
    description: "Destruye 20 meteoritos.",
    category: "combat",
    rarity: "rare",
    points: 40,
    icon: "meteor",
    condition: () => playerStats.meteorsDestroyed >= 20,
    unlocked: false,
  },
  {
    id: "diversified_killer",
    name: "Arsenal completo",
    description: "Elimina al menos 10 enemigos de cada tipo principal.",
    category: "combat",
    rarity: "epic",
    points: 60,
    icon: "mask",
    condition: () => {
      const types = playerStats.enemyTypesKilled;
      return (
        types.type1 >= 10 &&
        types.type2 >= 10 &&
        types.type3 >= 10 &&
        types.type4 >= 10
      );
    },
    unlocked: false,
  },
  {
    id: "survivor",
    name: "Superviviente",
    description: "Acumula 5 minutos de vuelo en total.",
    category: "survival",
    rarity: "common",
    points: 20,
    icon: "shield",
    condition: () => playerStats.totalGameTime >= 300000,
    unlocked: false,
  },
  {
    id: "marathon_runner",
    name: "Órbita larga",
    description: "Juega durante 1 hora en total.",
    category: "survival",
    rarity: "rare",
    points: 50,
    icon: "run",
    condition: () => playerStats.totalGameTime >= 3600000,
    unlocked: false,
  },
  {
    id: "level_master",
    name: "Maestra de niveles",
    description: "Alcanza el nivel 20.",
    category: "survival",
    rarity: "epic",
    points: 80,
    icon: "star",
    condition: () => playerStats.maxLevel >= 20,
    unlocked: false,
  },
  {
    id: "level_god",
    name: "Cima estelar",
    description: "Alcanza el nivel 50.",
    category: "survival",
    rarity: "legendary",
    points: 150,
    icon: "spark",
    condition: () => playerStats.maxLevel >= 50,
    unlocked: false,
  },
  {
    id: "untouchable",
    name: "Intocable",
    description: "Mantente 2 minutos sin recibir daño.",
    category: "survival",
    rarity: "epic",
    points: 70,
    icon: "ghost",
    condition: () => playerStats.maxTimeWithoutDamage >= 120000,
    unlocked: false,
  },
  {
    id: "iron_will",
    name: "Voluntad de hierro",
    description: "Completa un nivel sin recibir daño.",
    category: "survival",
    rarity: "rare",
    points: 35,
    icon: "hammer",
    condition: () => playerStats.perfectLevels >= 1,
    unlocked: false,
  },
  {
    id: "perfectionist",
    name: "Perfección orbital",
    description: "Completa 5 niveles sin recibir daño.",
    category: "survival",
    rarity: "epic",
    points: 100,
    icon: "gem",
    condition: () => playerStats.perfectLevels >= 5,
    unlocked: false,
  },
  {
    id: "heart_collector",
    name: "Reserva vital",
    description: "Alcanza 6 gemas de vida.",
    category: "survival",
    rarity: "rare",
    points: 40,
    icon: "heart",
    condition: () => playerStats.maxHearts >= 6,
    unlocked: false,
  },
  {
    id: "first_powerup",
    name: "Primera mejora",
    description: "Recolecta tu primer power-up.",
    category: "collection",
    rarity: "common",
    points: 10,
    icon: "gift",
    condition: () => playerStats.powerUpsCollected >= 1,
    unlocked: false,
  },
  {
    id: "powerup_addict",
    name: "Ingeniera de suministros",
    description: "Recolecta 50 power-ups.",
    category: "collection",
    rarity: "rare",
    points: 30,
    icon: "capsule",
    condition: () => playerStats.powerUpsCollected >= 50,
    unlocked: false,
  },
  {
    id: "xiao_fan",
    name: "Aliada de Xiao",
    description: "Recolecta 10 power-ups de Xiao.",
    category: "collection",
    rarity: "rare",
    points: 25,
    icon: "leaf",
    condition: () => playerStats.xiaosCollected >= 10,
    unlocked: false,
  },
  {
    id: "arlee_enthusiast",
    name: "Ritmo de Arlee",
    description: "Recolecta 10 power-ups de Arlee.",
    category: "collection",
    rarity: "rare",
    points: 25,
    icon: "bow",
    condition: () => playerStats.arleesCollected >= 10,
    unlocked: false,
  },
  {
    id: "cyno_devotee",
    name: "Pacto de Cyno",
    description: "Recolecta 10 power-ups de Cyno.",
    category: "collection",
    rarity: "rare",
    points: 25,
    icon: "bolt",
    condition: () => playerStats.cynosCollected >= 10,
    unlocked: false,
  },
  {
    id: "flins_fortune",
    name: "Fortuna de Flins",
    description: "Recolecta 5 power-ups de Flins.",
    category: "collection",
    rarity: "epic",
    points: 40,
    icon: "coin",
    condition: () => playerStats.flinsCollected >= 5,
    unlocked: false,
  },
  {
    id: "genshin_collector",
    name: "Colección especial",
    description: "Consigue al menos 3 de cada power-up especial.",
    category: "collection",
    rarity: "epic",
    points: 75,
    icon: "blossom",
    condition: () =>
      playerStats.xiaosCollected >= 3 &&
      playerStats.arleesCollected >= 3 &&
      playerStats.cynosCollected >= 3 &&
      playerStats.flinsCollected >= 3,
    unlocked: false,
  },
  {
    id: "medic",
    name: "Médica de flota",
    description: "Recolecta 25 kits de salud.",
    category: "collection",
    rarity: "common",
    points: 20,
    icon: "medkit",
    condition: () => playerStats.kitsCollected >= 25,
    unlocked: false,
  },
  {
    id: "first_points",
    name: "Primeros puntos",
    description: "Acumula 1.000 puntos en total.",
    category: "mastery",
    rarity: "common",
    points: 10,
    icon: "target",
    condition: () => playerStats.cumulativeScore >= 1000,
    unlocked: false,
  },
  {
    id: "point_collector",
    name: "Contadora de estrellas",
    description: "Acumula 5.000 puntos en total.",
    category: "mastery",
    rarity: "common",
    points: 20,
    icon: "coin",
    condition: () => playerStats.cumulativeScore >= 5000,
    unlocked: false,
  },
  {
    id: "high_scorer",
    name: "Puntuación alta",
    description: "Acumula 10.000 puntos en total.",
    category: "mastery",
    rarity: "rare",
    points: 40,
    icon: "chart",
    condition: () => playerStats.cumulativeScore >= 10000,
    unlocked: false,
  },
  {
    id: "score_enthusiast",
    name: "Sed de marcas",
    description: "Acumula 25.000 puntos en total.",
    category: "mastery",
    rarity: "rare",
    points: 60,
    icon: "spark",
    condition: () => playerStats.cumulativeScore >= 25000,
    unlocked: false,
  },
  {
    id: "score_master",
    name: "Maestra del marcador",
    description: "Acumula 50.000 puntos en total.",
    category: "mastery",
    rarity: "epic",
    points: 100,
    icon: "trophy",
    condition: () => playerStats.cumulativeScore >= 50000,
    unlocked: false,
  },
  {
    id: "score_legend",
    name: "Leyenda del marcador",
    description: "Acumula 100.000 puntos en total.",
    category: "mastery",
    rarity: "legendary",
    points: 200,
    icon: "star",
    condition: () => playerStats.cumulativeScore >= 100000,
    unlocked: false,
  },
  {
    id: "score_god",
    name: "Soberana del marcador",
    description: "Acumula 500.000 puntos en total.",
    category: "mastery",
    rarity: "mythic",
    points: 500,
    icon: "spark",
    condition: () => playerStats.cumulativeScore >= 500000,
    unlocked: false,
  },
  {
    id: "score_transcendent",
    name: "Trascendencia",
    description: "Acumula 1.000.000 puntos en total.",
    category: "mastery",
    rarity: "mythic",
    points: 1000,
    icon: "galaxy",
    condition: () => playerStats.cumulativeScore >= 1000000,
    unlocked: false,
  },
  {
    id: "veteran",
    name: "Veterana",
    description: "Juega 50 partidas.",
    category: "mastery",
    rarity: "rare",
    points: 30,
    icon: "medal",
    condition: () => playerStats.gamesPlayed >= 50,
    unlocked: false,
  },
  {
    id: "dedicated_player",
    name: "Piloto dedicado",
    description: "Juega 100 partidas.",
    category: "mastery",
    rarity: "epic",
    points: 60,
    icon: "medal",
    condition: () => playerStats.gamesPlayed >= 100,
    unlocked: false,
  },
  {
    id: "ifa_victim",
    name: "Eco de Ifa",
    description: "Sufre el efecto de ralentización de Ifa.",
    category: "secret",
    rarity: "rare",
    points: 25,
    icon: "crystal",
    condition: () => playerStats.enemyTypesKilled.ifa >= 1,
    unlocked: false,
  },
  {
    id: "xiao_weapon_hunter",
    name: "Cazadora de armas Xiao",
    description: "Destruye 5 enemigos tipo Xiao Weapon.",
    category: "secret",
    rarity: "epic",
    points: 50,
    icon: "sword",
    condition: () => playerStats.enemyTypesKilled.xiao_weapon >= 5,
    unlocked: false,
  },
  {
    id: "familiar_tamer",
    name: "Domadora de ecos",
    description: "Disuelve 20 familiares rosa.",
    category: "combat",
    rarity: "common",
    points: 20,
    icon: "spark",
    condition: () => playerStats.enemyTypesKilled.familiar >= 20,
    unlocked: false,
  },
  {
    id: "witch_hunter",
    name: "Cazadora de brujitas",
    description: "Derriba 3 brujitas menores.",
    category: "combat",
    rarity: "rare",
    points: 35,
    icon: "skull",
    condition: () => playerStats.enemyTypesKilled.witch >= 3,
    unlocked: false,
  },
  {
    id: "sniper_break",
    name: "Rompefrancotiradoras",
    description: "Elimina 5 francotiradoras del laberinto.",
    category: "combat",
    rarity: "rare",
    points: 30,
    icon: "target",
    condition: () => playerStats.enemyTypesKilled.sniper >= 5,
    unlocked: false,
  },
  {
    id: "moai_friend",
    name: "Confidente del Moai",
    description: "Consulta al Moai 10 veces.",
    category: "secret",
    rarity: "common",
    points: 15,
    icon: "moai",
    condition: () => SafeStore.num("moaiClicks", 0, 0, 1e9) >= 10,
    unlocked: false,
  },
  {
    id: "achievement_hunter",
    name: "Archivera de hazañas",
    description: "Abre el panel de logros por primera vez.",
    category: "secret",
    rarity: "common",
    points: 5,
    icon: "trophy",
    condition: () =>
      SafeStore.num("achievementsOpened", 0, 0, 1e9) >= 1,
    unlocked: false,
  },
  {
    id: "completionist",
    name: "Casi completa",
    description: "Desbloquea el 80% de todos los logros.",
    category: "secret",
    rarity: "mythic",
    points: 500,
    icon: "check",
    condition: () => {
      const unlockedCount = achievements.filter((a) => a.unlocked).length;
      const totalCount = achievements.length;
      return unlockedCount / totalCount >= 0.8;
    },
    unlocked: false,
  },
  {
    id: "legend",
    name: "Leyenda viviente",
    description: "Desbloquea todos los logros.",
    category: "secret",
    rarity: "mythic",
    points: 1000,
    icon: "star",
    condition: () => {
      const unlockedCount = achievements.filter(
        (a) => a.id !== "legend" && a.unlocked
      ).length;
      const totalCount = achievements.length - 1;
      return unlockedCount === totalCount;
    },
    unlocked: false,
  },
];

// Cargar estadísticas y logros desde localStorage
function loadPlayerStats() {
  const savedStats = SafeStore.getObject("playerStats");
  for (const k in savedStats) {
    if (k in playerStats && typeof savedStats[k] === typeof playerStats[k]) playerStats[k] = savedStats[k];
  }

  const saved = SafeStore.getArray("achievements", (a) => a && typeof a.id === "string");
  if (saved.length) {
    achievements.forEach((achievement) => {
      const savedAchievement = saved.find((a) => a.id === achievement.id);
      if (savedAchievement) {
        achievement.unlocked = savedAchievement.unlocked;
      }
    });
  }
}

// Guardar estadísticas y logros
function savePlayerStats() {
  localStorage.setItem("playerStats", JSON.stringify(playerStats));
  localStorage.setItem(
    "achievements",
    JSON.stringify(
      achievements.map((a) => ({ id: a.id, unlocked: a.unlocked }))
    )
  );
}

// Verificar logros
function checkAchievements() {
  achievements.forEach((achievement) => {
    if (!achievement.unlocked && achievement.condition()) {
      unlockAchievement(achievement);
    }
  });
}

// Desbloquear logro
function unlockAchievement(achievement) {
  achievement.unlocked = true;
  showAchievementNotification(achievement);
  savePlayerStats();
  updateAchievementStats();
}

// Mostrar notificación de logro
function isMobileDevice() {
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
}

function showAchievementNotification(achievement) {
  if (!gameRunning) return; // no mostrar avisos en la carga ni en el menú
  if (window.showMiniToast) { showMiniToast(`logro: ${achievement.name}  +${achievement.points}`, 2400); try { SFX.play("achievement", 0.4); } catch (e) {} return; }
  const notification = document.getElementById("achievementNotification");
  const nameEl = document.getElementById("notificationName");
  const descEl = document.getElementById("notificationDescription");
  const pointsEl = document.getElementById("notificationPoints");

  nameEl.textContent = achievement.name;
  descEl.textContent = achievement.description;
  pointsEl.textContent = `+${achievement.points} puntos`;

  const notifIcon = notification.querySelector(".notification-icon");
  if (notifIcon && typeof swIcon === "function") {
    notifIcon.innerHTML = swIcon(achievement.icon || "trophy", "sw-icon-lg");
  }

  // Añadir clase específica para móviles
  if (isMobileDevice()) {
    notification.classList.add("mobile-notification");
  } else {
    notification.classList.remove("mobile-notification");
  }

  if (typeof UIAnime !== "undefined") {
    UIAnime.notifyAchievement(notification);
  } else {
    notification.classList.add("show");
  }

  // Reproducir sonido de logro (si existe) - volumen más bajo en móviles
  try {
    const achievementSound = SFX.audio("achievement");
    achievementSound.volume = isMobileDevice() ? 0.3 : 0.5;
    achievementSound.play().catch(() => {}); // Ignorar errores de audio
  } catch (e) {}

  // Tiempo de display más corto en móviles para ser menos intrusivo
  const displayTime = isMobileDevice() ? 3000 : 5000;
  setTimeout(() => {
    if (typeof UIAnime !== "undefined") {
      UIAnime.hideAchievement(notification);
    } else {
      notification.classList.remove("show");
    }
    setTimeout(() => {
      notification.classList.remove("mobile-notification");
    }, 300); // Limpiar clase después de la animación
  }, displayTime);
}

// Inicializar sistema de logros
function initAchievementSystem() {
  loadPlayerStats();

  const achievementsBtn = document.getElementById("achievementsButton");
  const achievementsModal = document.getElementById("achievementsModal");
  const achievementsClose = document.querySelector(".achievements-close");

  // Abrir modal de logros
  achievementsBtn.addEventListener("click", () => {
    if (isMobileDevice()) {
      achievementsModal.classList.add("mobile-modal");
    } else {
      achievementsModal.classList.remove("mobile-modal");
    }

    if (typeof UIAnime !== "undefined") {
      UIAnime.openModal(achievementsModal);
    } else {
      achievementsModal.style.display = "block";
    }

    renderAchievements();
    updateAchievementStats();
    if (typeof UIAnime !== "undefined") {
      setTimeout(() => UIAnime.staggerList(".achievement-item"), 40);
    }

    // Logro secreto por abrir el panel
    let achievementsOpened = SafeStore.num("achievementsOpened", 0, 0, 1e9);
    achievementsOpened++;
    localStorage.setItem("achievementsOpened", achievementsOpened.toString());
    checkAchievements();
  });

  // Cerrar modal
  achievementsClose.addEventListener("click", () => {
    if (typeof UIAnime !== "undefined") {
      UIAnime.closeModal(achievementsModal);
    } else {
      achievementsModal.style.display = "none";
      achievementsModal.classList.remove("mobile-modal");
    }
  });

  // Cerrar con clic fuera del modal
  window.addEventListener("click", (e) => {
    if (e.target === achievementsModal) {
      if (typeof UIAnime !== "undefined") {
        UIAnime.closeModal(achievementsModal);
      } else {
        achievementsModal.style.display = "none";
        achievementsModal.classList.remove("mobile-modal");
      }
    }
  });

  // Tabs de categorías
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderAchievements(btn.dataset.category);
    });
  });

  // Tracking de clics en Moai para logro secreto
  const moaiBtn = document.getElementById("moaiButton");
  moaiBtn.addEventListener("click", () => {
    let moaiClicks = SafeStore.num("moaiClicks", 0, 0, 1e9);
    moaiClicks++;
    localStorage.setItem("moaiClicks", moaiClicks.toString());
    checkAchievements();
  });
}

// Renderizar logros
function renderAchievements(category = "all") {
  const achievementsList = document.getElementById("achievementsList");
  achievementsList.innerHTML = "";

  const filteredAchievements =
    category === "all"
      ? achievements
      : achievements.filter((a) => a.category === category);

  filteredAchievements.forEach((achievement) => {
    const achievementEl = document.createElement("div");
    achievementEl.className = `achievement-item ${
      achievement.unlocked ? "unlocked" : "locked"
    }`;

    const progress = getAchievementProgress(achievement);

    const iconHtml =
      typeof swIcon === "function"
        ? swIcon(achievement.icon, "sw-icon-lg")
        : "";
    achievementEl.innerHTML = `
            <div class="achievement-icon">${iconHtml}</div>
            <div class="achievement-details">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-progress">${progress}</div>
            </div>
            <div class="achievement-points">+${achievement.points}</div>
            <div class="achievement-rarity rarity-${achievement.rarity}">${achievement.rarity}</div>
        `;

    achievementsList.appendChild(achievementEl);
  });
}

// Obtener progreso del logro
function getAchievementProgress(achievement) {
  if (achievement.unlocked) return "Desbloqueado";

  // Progreso específico para cada logro
  switch (achievement.id) {
    case "first_blood":
      return `${Math.min(playerStats.totalKills, 1)}/1 enemigos`;
    case "newbie_killer":
      return `${Math.min(playerStats.totalKills, 5)}/5 enemigos`;
    case "trigger_happy":
      return `${Math.min(playerStats.totalShots, 25)}/25 disparos`;
    case "marksman":
      return `${Math.min(playerStats.totalShots, 100)}/100 disparos`;
    case "slayer":
      return `${Math.min(playerStats.totalKills, 50)}/50 enemigos`;
    case "genocide":
      return `${Math.min(playerStats.totalKills, 500)}/500 enemigos`;
    case "killing_spree":
      return `${Math.min(playerStats.maxConsecutiveKills, 10)}/10 consecutivos`;
    case "unstoppable":
      return `${Math.min(playerStats.maxConsecutiveKills, 25)}/25 consecutivos`;
    case "boss_slayer":
      return `${Math.min(playerStats.bossesKilled, 1)}/1 boss`;
    case "boss_destroyer":
      return `${Math.min(playerStats.bossesKilled, 5)}/5 bosses`;
    case "meteor_master":
      return `${Math.min(playerStats.meteorsDestroyed, 20)}/20 meteoritos`;
    case "survivor":
      return `${Math.floor(
        Math.min(playerStats.totalGameTime, 300000) / 60000
      )}/5 minutos`;
    case "level_master":
      return `${Math.min(playerStats.maxLevel, 20)}/20 nivel`;
    case "level_god":
      return `${Math.min(playerStats.maxLevel, 50)}/50 nivel`;
    case "heart_collector":
      return `${Math.min(playerStats.maxHearts, 6)}/6 gemas`;
    case "powerup_addict":
      return `${Math.min(playerStats.powerUpsCollected, 50)}/50 power-ups`;
    case "first_points":
      return `${Math.min(
        playerStats.cumulativeScore,
        1000
      ).toLocaleString()}/1,000 puntos`;
    case "point_collector":
      return `${Math.min(
        playerStats.cumulativeScore,
        5000
      ).toLocaleString()}/5,000 puntos`;
    case "high_scorer":
      return `${Math.min(
        playerStats.cumulativeScore,
        10000
      ).toLocaleString()}/10,000 puntos`;
    case "score_enthusiast":
      return `${Math.min(
        playerStats.cumulativeScore,
        25000
      ).toLocaleString()}/25,000 puntos`;
    case "score_master":
      return `${Math.min(
        playerStats.cumulativeScore,
        50000
      ).toLocaleString()}/50,000 puntos`;
    case "score_legend":
      return `${Math.min(
        playerStats.cumulativeScore,
        100000
      ).toLocaleString()}/100,000 puntos`;
    case "score_god":
      return `${Math.min(
        playerStats.cumulativeScore,
        500000
      ).toLocaleString()}/500,000 puntos`;
    case "score_transcendent":
      return `${Math.min(
        playerStats.cumulativeScore,
        1000000
      ).toLocaleString()}/1,000,000 puntos`;
    case "veteran":
      return `${Math.min(playerStats.gamesPlayed, 50)}/50 partidas`;
    case "dedicated_player":
      return `${Math.min(playerStats.gamesPlayed, 100)}/100 partidas`;
    case "moai_friend":
      return `${Math.min(
        SafeStore.num("moaiClicks", 0, 0, 1e9),
        10
      )}/10 clics`;
    default:
      return "En progreso...";
  }
}

// Actualizar estadísticas de logros
function updateAchievementStats() {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const totalPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);
  const completionPercent = Math.round((unlockedCount / totalCount) * 100);

  document.getElementById(
    "totalAchievements"
  ).textContent = `${unlockedCount}/${totalCount}`;
  document.getElementById("achievementPoints").textContent = totalPoints;
  document.getElementById(
    "completionPercent"
  ).textContent = `${completionPercent}%`;
}

// Funciones para actualizar estadísticas durante el juego
function updateStatsOnKill(enemyType) {
  playerStats.totalKills++;
  playerStats.consecutiveKills++;
  playerStats.maxConsecutiveKills = Math.max(
    playerStats.maxConsecutiveKills,
    playerStats.consecutiveKills
  );

  if (playerStats.enemyTypesKilled[enemyType] !== undefined) {
    playerStats.enemyTypesKilled[enemyType]++;
  }

  savePlayerStats();
  checkAchievements();
}

function updateStatsOnShoot() {
  playerStats.totalShots++;
  checkAchievements();
}

function updateStatsOnScore(points) {
  // Actualizar puntuación acumulativa en tiempo real
  playerStats.cumulativeScore += points;
  checkAchievements();
}

function updateStatsOnDamage() {
  playerStats.totalDamageReceived++;
  playerStats.consecutiveKills = 0; // Reset consecutive kills
  playerStats.timeWithoutDamage = 0; // Reset time without damage
  checkAchievements();
}

function updateStatsOnBossKill() {
  playerStats.bossesKilled++;
  savePlayerStats();
  checkAchievements();
}

function updateStatsOnPowerUpCollected(type) {
  playerStats.powerUpsCollected++;

  switch (type) {
    case "xiao":
      playerStats.xiaosCollected++;
      break;
    case "arlee":
      playerStats.arleesCollected++;
      break;
    case "cyno":
      playerStats.cynosCollected++;
      break;
    case "kit":
      playerStats.kitsCollected++;
      break;
    case "flins":
      playerStats.flinsCollected++;
      break;
    case "rerir":
      playerStats.rerirsCollected = (playerStats.rerirsCollected || 0) + 1;
      break;
  }

  savePlayerStats();
  checkAchievements();
}

function updateStatsOnGameStart() {
  playerStats.gamesPlayed++;
  playerStats.sessionStartTime = Date.now();
  savePlayerStats();
  checkAchievements();
}

function updateStatsOnGameEnd() {
  if (playerStats.sessionStartTime > 0) {
    const sessionTime = Date.now() - playerStats.sessionStartTime;
    playerStats.totalGameTime += sessionTime;
    playerStats.sessionStartTime = 0;
  }

  // Actualizar puntuación máxima por partida
  playerStats.totalScore = Math.max(playerStats.totalScore, score);

  // Añadir puntuación actual a la puntuación acumulativa
  playerStats.cumulativeScore += score;

  playerStats.maxLevel = Math.max(playerStats.maxLevel, level);
  playerStats.maxHearts = Math.max(playerStats.maxHearts, player.hearts);

  savePlayerStats();
  checkAchievements();
}

// Inicializar el sistema cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  initAchievementSystem();
  initShopSystem();
});

// =================== SISTEMA DE TIENDA ÉPICA ===================

// Catálogo de items de la tienda
const shopItems = [
  {
    id: "poem_stars",
    name: "Poema: Entre las estrellas",
    description: "Un poema íntimo sobre viajes, distancia y esperanza.",
    category: "poems",
    cost: 50,
    rarity: "common",
    icon: "scroll",
    content: `Canje desbloqueado: Entre las estrellas

Toma una captura de esta ventana y envíasela a Manuel (Administrador Estelar).

A cambio recibirás un poema escrito para ti.
Guarda esta prueba: es tu llave de canje.`,
    purchased: false,
  },
  {
    id: "poem_warrior",
    name: "Poema: Guerrero del cosmos",
    description: "Versos sobre coraje, batalla y sostenerse en pie.",
    category: "poems",
    cost: 75,
    rarity: "rare",
    icon: "sword",
    content: `Canje desbloqueado: Guerrero del cosmos

Captura esta pantalla y envíasela a Manuel.

Recibirás un poema épico personalizado.
Esta ventana es tu comprobante de desbloqueo.`,
    purchased: false,
  },
  {
    id: "poem_love",
    name: "Poema: Amor cósmico",
    description: "Palabras profundas sobre querer a través de cualquier distancia.",
    category: "poems",
    cost: 100,
    rarity: "epic",
    icon: "heart",
    content: `Canje desbloqueado: Amor cósmico

Captura esta ventana y compártela con Manuel.

Este poema es el más íntimo de la colección.
Preséntalo para recibir tu pieza escrita a mano del corazón.`,
    purchased: false,
  },
  {
    id: "secret_dev",
    name: "Secreto: Nota del creador",
    description: "Un mensaje directo de quien construyó este universo.",
    category: "secrets",
    cost: 150,
    rarity: "epic",
    icon: "crystal",
    content: `Hola. Soy Manuel, quien armó Space War.

Hice este juego con cariño, pensando en alguien concreto: tú.
Cada efecto, cada detalle y cada línea buscan dejarte un respiro y una sonrisa.

Quiero que sepas que eres valiosa, fuerte y luminosa.
Los días difíciles pasan; tu luz no.

Gracias por jugar esta pequeña creación.
Con cariño,
Manuel`,
    purchased: false,
  },
  {
    id: "secret_easteregg",
    name: "Secreto: Archivo oculto",
    description: "Pistas internas del juego y de sus rincones secretos.",
    category: "secrets",
    cost: 200,
    rarity: "legendary",
    icon: "egg",
    content: `Archivo oculto de Space War

1. Disparar exactamente 777 veces en una partida puede revelar un mensaje especial.
2. Los power-ups especiales (Xiao, Arlee, Cyno, Flins) están pensados como guiños personales.
3. El Moai también lleva la cuenta de tus visitas para un logro secreto.
4. Hay ${achievements.length} logros en total; algunos exigen paciencia real.
5. Si estás leyendo esto, ya desbloqueaste uno de los canjes más raros.`,
    purchased: false,
  },
  {
    id: "secret_truth",
    name: "Secreto: Verdad universal",
    description: "Una reflexión serena sobre existir frente al cosmos.",
    category: "secrets",
    cost: 500,
    rarity: "mythic",
    icon: "galaxy",
    content: `La verdad universal

No importa cuán pequeños parezcamos frente al cosmos, ni cuántos días nublados intenten apagar la fe.
No importa cuántas veces caigamos: incluso las estrellas titilan antes de volver a arder.

Eres una constelación irrepetible: átomos y sueños tejidos por miles de millones de años.
Polvo de estrellas que aprendió a sentir, amar e imaginar.

El universo conspiró —en el sentido más literal de la física— para que existieras aquí y ahora.
Cuando dudes, recuerda: dentro de ti late la misma energía que enciende soles y guía cometas.`,
    purchased: false,
  },
  {
    id: "avatar_novice",
    name: "Título: Explorador estelar",
    description: "Multiplicador x2 de puntos. Aura blanca suave.",
    category: "avatars",
    cost: 50,
    rarity: "common",
    icon: "star",
    content: "Título activo: Explorador estelar",
    bonus: { type: "points", multiplier: 2, effect: "white-aura" },
    purchased: false,
  },
  {
    id: "avatar_galaxy",
    name: "Título: Guardián galáctico",
    description: "Multiplicador x2 de puntos. Aura verde.",
    category: "avatars",
    cost: 100,
    rarity: "rare",
    icon: "galaxy",
    content: "Título activo: Guardián galáctico",
    bonus: { type: "points", multiplier: 2, effect: "green-aura" },
    purchased: false,
  },
  {
    id: "avatar_legend",
    name: "Título: Leyenda estelar",
    description: "Multiplicador x3 de puntos. Estelas doradas.",
    category: "avatars",
    cost: 250,
    rarity: "epic",
    icon: "crown",
    content: "Título activo: Leyenda estelar",
    bonus: { type: "points", multiplier: 3, effect: "golden-stars" },
    purchased: false,
  },
  {
    id: "avatar_cosmic",
    name: "Título: Emperador cósmico",
    description: "Multiplicador x3 de puntos. Aura multicolor.",
    category: "avatars",
    cost: 500,
    rarity: "legendary",
    icon: "spark",
    content: "Título activo: Emperador cósmico",
    bonus: { type: "points", multiplier: 3, effect: "rainbow-aura" },
    purchased: false,
  },
  {
    id: "avatar_supreme",
    name: "Título: Supremo del cosmos",
    description: "Multiplicador x4 de puntos. Aura suprema.",
    category: "avatars",
    cost: 1000,
    rarity: "mythic",
    icon: "gem",
    content: "Título activo: Supremo del cosmos",
    bonus: { type: "points", multiplier: 4, effect: "supreme-aura" },
    purchased: false,
  },
  {
    id: "quote_motivation",
    name: "Frase: Coraje diario",
    description: "Una frase clara para sostenerte cuando el día pesa.",
    category: "quotes",
    cost: 50,
    rarity: "common",
    icon: "quote",
    content: `"El éxito no es el final, el fracaso no es fatal: es el coraje de continuar lo que cuenta." — Winston Churchill

Cada día es otra oportunidad de volver a intentarlo.
No mides tu valor por una caída, sino por la decisión de seguir.`,
    purchased: false,
  },
  {
    id: "quote_dreams",
    name: "Frase: Apunta alto",
    description: "Palabras para no achicar tus sueños.",
    category: "quotes",
    cost: 75,
    rarity: "rare",
    icon: "star",
    content: `"Apunta a la luna. Aunque falles, aterrizarás entre las estrellas." — Norman Vincent Peale

Tus sueños no son excesivos.
El universo es amplio; tus posibilidades también.
No entregues tu horizonte solo porque alguien no puede verlo.`,
    purchased: false,
  },
  {
    id: "fact_space",
    name: "Curiosidad: Datos del espacio",
    description: "Cinco hechos del cosmos para maravillarte un momento.",
    category: "facts",
    cost: 100,
    rarity: "rare",
    icon: "rocket",
    content: `Datos del espacio

1. Un día en Venus dura más que un año en Venus.
2. Hay más estrellas en el universo observable que granos de arena en todas las playas de la Tierra.
3. A la velocidad de la luz tardarías unos 100.000 años en cruzar la Vía Láctea.
4. En el vacío, metales limpios pueden soldarse en frío (cold welding).
5. Los átomos de tu cuerpo se forjaron en estrellas antiguas: eres, literalmente, polvo estelar.`,
    purchased: false,
  },
  {
    id: "message_special",
    name: "Mensaje: Para ti",
    description: "Una carta personal, directa y sin adornos vacíos.",
    category: "messages",
    cost: 300,
    rarity: "legendary",
    icon: "letter",
    content: `Para ti, que estás leyendo esto

Eres una presencia irrepetible.
Existir ya es improbable y, aun así, aquí estás: respirando, sintiendo, dejando huella.

Cada amanecer es permiso para reconstruirte y recordar la luz que cargas.
No dejes que las sombras ajenas te convenzan de apagarla.

Eres más fuerte de lo que imaginas, más valiosa de lo que crees y más querida de lo que sospechas.
Sigue. Brilla aunque no todos entiendan tu resplandor.
Tu luz importa.`,
    purchased: false,
  },
];

// Cargar items comprados
function loadPurchasedItems() {
  const purchases = SafeStore.getArray("shopPurchases", (x) => typeof x === "string");
  if (purchases.length) {
    shopItems.forEach((item) => {
      if (purchases.includes(item.id)) {
        item.purchased = true;
      }
    });
  }
}

// Guardar compra
function savePurchase(itemId) {
  const purchases = SafeStore.getArray("shopPurchases", (x) => typeof x === "string");
  if (!purchases.includes(itemId)) {
    purchases.push(itemId);
    localStorage.setItem("shopPurchases", JSON.stringify(purchases));
  }
}

// Obtener puntos totales de logros
function getTotalAchievementPoints() {
  return achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);
}

// Obtener puntos gastados
function getSpentPoints() {
  return shopItems
    .filter((item) => item.purchased)
    .reduce((sum, item) => sum + item.cost, 0);
}

// Obtener puntos disponibles
function getAvailablePoints() {
  return getTotalAchievementPoints() - getSpentPoints();
}

// Inicializar sistema de tienda
function initShopSystem() {
  loadPurchasedItems();

  const shopBtn = document.getElementById("shopButton");
  const shopModal = document.getElementById("shopModal");
  const shopClose = document.querySelector(".shop-close");

  // Abrir modal de tienda
  shopBtn.addEventListener("click", () => {
    if (isMobileDevice()) {
      shopModal.classList.add("mobile-modal");
    } else {
      shopModal.classList.remove("mobile-modal");
    }

    if (typeof UIAnime !== "undefined") {
      UIAnime.openModal(shopModal);
    } else {
      shopModal.style.display = "block";
    }

    renderShopItems();
    updateShopStats();
    if (typeof UIAnime !== "undefined") {
      setTimeout(() => UIAnime.staggerList(".shop-item"), 40);
    }
  });

  // Cerrar modal
  shopClose.addEventListener("click", () => {
    if (typeof UIAnime !== "undefined") {
      UIAnime.closeModal(shopModal);
    } else {
      shopModal.style.display = "none";
      shopModal.classList.remove("mobile-modal");
    }
  });

  // Cerrar con clic fuera del modal
  window.addEventListener("click", (e) => {
    if (e.target === shopModal) {
      if (typeof UIAnime !== "undefined") {
        UIAnime.closeModal(shopModal);
      } else {
        shopModal.style.display = "none";
        shopModal.classList.remove("mobile-modal");
      }
    }
  });

  // Tabs de categorías de tienda
  const shopTabBtns = document.querySelectorAll(".shop-tab-btn");
  shopTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      shopTabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderShopItems(btn.dataset.category);
    });
  });
}

// Renderizar items de la tienda
function renderShopItems(category = "all") {
  const shopList = document.getElementById("shopItemsList");
  shopList.innerHTML = "";

  const filteredItems =
    category === "all"
      ? shopItems
      : shopItems.filter((item) => item.category === category);

  filteredItems.forEach((item) => {
    const itemEl = document.createElement("div");
    itemEl.className = `shop-item ${item.purchased ? "purchased" : ""}`;

    const canAfford = getAvailablePoints() >= item.cost;
    const buttonText = item.purchased
      ? "Canjeado"
      : `Canjear (${item.cost} pts)`;
    const buttonDisabled = item.purchased || !canAfford ? "disabled" : "";

    itemEl.innerHTML = `
            <div class="shop-item-icon">${typeof swIcon === "function" ? swIcon(item.icon, "sw-icon-lg") : ""}</div>
            <div class="shop-item-details">
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-description">${item.description}</div>
                <div class="shop-item-rarity rarity-${item.rarity}">${item.rarity}</div>
            </div>
            <div class="shop-item-actions">
                <div class="shop-item-cost">${item.cost} pts</div>
                <button class="shop-buy-btn" ${buttonDisabled} onclick="purchaseItem('${item.id}')">
                    ${buttonText}
                </button>
            </div>
        `;

    // Agregar evento de clic para ver contenido si ya está comprado
    if (item.purchased) {
      itemEl.style.cursor = "pointer";
      itemEl.addEventListener("click", () => showItemContent(item));
    }

    shopList.appendChild(itemEl);
  });
}

// Comprar item
function purchaseItem(itemId) {
  const item = shopItems.find((i) => i.id === itemId);
  if (!item || item.purchased) return;

  const availablePoints = getAvailablePoints();
  if (availablePoints < item.cost) {
    showNotification("No tienes suficientes puntos de logros", "error");
    return;
  }

  // Confirmar compra
  if (confirm(`¿Deseas canjear "${item.name}" por ${item.cost} puntos?`)) {
    item.purchased = true;
    savePurchase(item.id);

    // ANIMACIÓN ÉPICA DE COMPRA
    createEpicPurchaseAnimation(item);

    // Mostrar contenido después de la animación
    setTimeout(() => {
      showItemContent(item);
    }, 2000);

    renderShopItems();
    updateShopStats();

    // Sonido de compra
    try {
      const purchaseSound = SFX.audio("achievement");
      purchaseSound.volume = 0.5;
      purchaseSound.play().catch(() => {});
    } catch (e) {}

    // Si es un avatar (título), actualizar el sistema de títulos
    if (item.category === "avatars") {
      updateAvailableTitles();
    }
  }
}

// Crear animación épica de compra
function createEpicPurchaseAnimation(item) {
  const container = document.getElementById("game-container");

  // Crear overlay de animación
  const animationOverlay = document.createElement("div");
  animationOverlay.className = "purchase-animation-overlay";
  const purchaseIcon =
    typeof swIcon === "function" ? swIcon(item.icon, "sw-icon-xl") : "";
  animationOverlay.innerHTML = `
        <div class="purchase-burst"></div>
        <div class="purchase-content">
            <div class="purchase-icon">${purchaseIcon}</div>
            <div class="purchase-name">${item.name}</div>
            <div class="purchase-category">${getCategoryIcon(
              item.category
            )} ${getCategoryName(item.category)}</div>
            <div class="purchase-success">Desbloqueado</div>
        </div>
    `;

  container.appendChild(animationOverlay);

  // Crear partículas explosivas
  for (let i = 0; i < 50; i++) {
    createPurchaseParticle(container, item.icon);
  }

  // Crear rayos de energía
  for (let i = 0; i < 8; i++) {
    createEnergyRay(container, i);
  }

  // Remover después de la animación
  setTimeout(() => {
    animationOverlay.remove();
  }, 2000);
}

// Crear partícula de compra
function createPurchaseParticle(container, icon) {
  const particle = document.createElement("div");
  particle.className = "purchase-particle";
  if (typeof swIcon === "function") {
    particle.innerHTML = swIcon(icon || "spark", "sw-icon-sm");
  } else {
    particle.textContent = "•";
  }

  const angle = Math.random() * Math.PI * 2;
  const distance = 200 + Math.random() * 300;
  const duration = 1 + Math.random() * 1;

  particle.style.setProperty("--angle", `${angle}rad`);
  particle.style.setProperty("--distance", `${distance}px`);
  particle.style.setProperty("--duration", `${duration}s`);

  container.appendChild(particle);

  setTimeout(() => particle.remove(), duration * 1000);
}

// Crear rayo de energía
function createEnergyRay(container, index) {
  const ray = document.createElement("div");
  ray.className = "purchase-energy-ray";
  ray.style.transform = `rotate(${index * 45}deg)`;

  container.appendChild(ray);

  setTimeout(() => ray.remove(), 1500);
}

// Icono SVG de categoría
function getCategoryIcon(category) {
  const icons = {
    poems: "scroll",
    secrets: "crystal",
    avatars: "mask",
    quotes: "quote",
    facts: "science",
    messages: "letter",
  };
  const key = icons[category] || "spark";
  return typeof swIcon === "function" ? swIcon(key, "sw-icon-inline") : "";
}

// Obtener nombre de categoría
function getCategoryName(category) {
  const names = {
    poems: "Poema",
    secrets: "Secreto",
    avatars: "Título",
    quotes: "Frase",
    facts: "Curiosidad",
    messages: "Mensaje",
  };
  return names[category] || "Ítem";
}

// Mostrar contenido del item
function showItemContent(item) {
  const contentModal = document.getElementById("itemContentModal");
  const contentTitle = document.getElementById("itemContentTitle");
  const contentText = document.getElementById("itemContentText");

  contentTitle.textContent = item.name;
  contentText.textContent = item.content;

  contentModal.style.display = "block";

  // Cerrar modal de contenido
  const contentClose = document.querySelector(".item-content-close");
  contentClose.onclick = () => {
    contentModal.style.display = "none";
  };

  window.onclick = (e) => {
    if (e.target === contentModal) {
      contentModal.style.display = "none";
    }
  };
}

// Actualizar estadísticas de la tienda
function updateShopStats() {
  const totalPoints = getTotalAchievementPoints();
  const spentPoints = getSpentPoints();
  const availablePoints = getAvailablePoints();
  const purchasedCount = shopItems.filter((item) => item.purchased).length;
  const totalItems = shopItems.length;

  document.getElementById("totalShopPoints").textContent = totalPoints;
  document.getElementById("spentPoints").textContent = spentPoints;
  document.getElementById("availablePoints").textContent = availablePoints;
  document.getElementById(
    "purchasedItems"
  ).textContent = `${purchasedCount}/${totalItems}`;
}

// Mostrar notificación simple
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `simple-notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${type === "error" ? "#e74c3c" : "#2ecc71"};
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        font-size: 1.2em;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// =================== SISTEMA DE TÍTULOS ===================

// Cargar título activo del jugador
function loadActiveTitle() {
  return localStorage.getItem("activePlayerTitle") || "";
}

// Guardar título activo
function saveActiveTitle(titleText) {
  localStorage.setItem("activePlayerTitle", titleText);
}

// Actualizar títulos disponibles
function updateAvailableTitles() {
  const avatarItems = shopItems.filter(
    (item) => item.category === "avatars" && item.purchased
  );

  if (avatarItems.length > 0) {
    // Crear selector de títulos si hay avatares comprados
    createTitleSelector();
  }
}

// Crear selector de títulos
function createTitleSelector() {
  // Verificar si ya existe el botón
  if (document.getElementById("titleSelectorButton")) return;

  const titleButton = document.createElement("button");
  titleButton.id = "titleSelectorButton";
  titleButton.className = "title-selector-btn";
  titleButton.title = "Seleccionar título";
  titleButton.setAttribute("aria-label", "Seleccionar título");
  titleButton.innerHTML =
    typeof swIcon === "function" ? swIcon("crown", "sw-icon-btn") : "T";

  titleButton.addEventListener("click", showTitleSelector);

  document.getElementById("game-container").appendChild(titleButton);
}

// Mostrar selector de títulos
function showTitleSelector() {
  const modal = document.createElement("div");
  modal.className = "title-selector-modal";
  const crown =
    typeof swIcon === "function" ? swIcon("crown", "sw-icon-inline") : "";
  modal.innerHTML = `
        <div class="title-selector-content">
            <span class="title-selector-close">&times;</span>
            <h2>${crown} Selecciona tu título</h2>
            <div class="title-selector-subtitle">Cada título otorga bonificaciones especiales</div>
            <div class="titles-grid" id="titlesGrid"></div>
            <button class="remove-title-btn" onclick="removeActiveTitle()">Quitar título</button>
        </div>
    `;

  document.body.appendChild(modal);

  // Llenar con títulos disponibles
  const titlesGrid = modal.querySelector("#titlesGrid");
  const avatarItems = shopItems.filter(
    (item) => item.category === "avatars" && item.purchased
  );
  const activeTitle = loadActiveTitle();

  avatarItems.forEach((item) => {
    const titleOption = document.createElement("div");
    titleOption.className = `title-option ${
      item.content === activeTitle ? "active" : ""
    }`;

    // Calcular bonificación para mostrar
    let bonusText = "";
    if (item.bonus && item.bonus.type === "points") {
      const bonusPercent = Math.round((item.bonus.multiplier - 1) * 100);
      bonusText = `<div class="title-bonus">+${bonusPercent}% Puntos</div>`;
    }

    // Mostrar efecto visual
    let effectText = "";
    if (item.bonus && item.bonus.effect) {
      const effectNames = {
        "green-aura": "Aura verde",
        "golden-stars": "Estelas doradas",
        "rainbow-aura": "Aura multicolor",
        "white-aura": "Aura blanca",
        "supreme-aura": "Aura suprema",
      };
      effectText = `<div class="title-effect">${
        effectNames[item.bonus.effect]
      }</div>`;
    }

    titleOption.innerHTML = `
            <div class="title-option-icon">${typeof swIcon === "function" ? swIcon(item.icon, "sw-icon-lg") : ""}</div>
            <div class="title-option-text">${item.content}</div>
            ${bonusText}
            ${effectText}
        `;

    titleOption.addEventListener("click", () => {
      selectTitle(item.content);
      modal.remove();
    });

    titlesGrid.appendChild(titleOption);
  });

  // Cerrar modal
  const closeBtn = modal.querySelector(".title-selector-close");
  closeBtn.addEventListener("click", () => modal.remove());

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Seleccionar título
function selectTitle(titleText) {
  saveActiveTitle(titleText);
  displayPlayerTitle();

  // Buscar el item para mostrar el bono
  const titleItem = shopItems.find(
    (item) => item.category === "avatars" && item.content === titleText
  );

  let message = "¡Título equipado!";
  if (titleItem && titleItem.bonus && titleItem.bonus.type === "points") {
    const bonusPercent = Math.round((titleItem.bonus.multiplier - 1) * 100);
    message = `¡Título equipado! Bonificación: +${bonusPercent}% puntos`;
  }

  showNotification(message, "success");
}

// Quitar título activo
function removeActiveTitle() {
  saveActiveTitle("");
  displayPlayerTitle();
  showNotification("Título removido", "info");
  document.querySelector(".title-selector-modal")?.remove();
}

// Mostrar título del jugador en pantalla
function displayPlayerTitle() {
  const titleDisplay = document.getElementById("playerTitleDisplay");
  const titleText = document.getElementById("playerTitle");
  const activeTitle = loadActiveTitle();

  if (activeTitle && activeTitle.trim()) {
    titleText.textContent = activeTitle;
    titleDisplay.style.display = "block";
  } else {
    titleDisplay.style.display = "none";
  }
}

// Aplicar efectos visuales según el título equipado
function applyTitleVisualEffects() {
  if (!gameRunning) return;

  const activeTitle = loadActiveTitle();
  if (!activeTitle) return;

  const titleItem = shopItems.find(
    (item) =>
      item.category === "avatars" &&
      item.content === activeTitle &&
      item.purchased
  );

  if (!titleItem || !titleItem.bonus) return;

  const effect = titleItem.bonus.effect;
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;

  // Crear efectos con menor frecuencia para no sobrecargar
  if (Math.random() > 0.7) {
    switch (effect) {
      case "green-aura":
        createTitleParticle(centerX, centerY, "#4CAF50", "aura");
        break;
      case "golden-stars":
        createTitleParticle(centerX, centerY, "#FFD700", "star");
        break;
      case "rainbow-aura":
        const colors = [
          "#FF6B6B",
          "#4ECDC4",
          "#45B7D1",
          "#FFA07A",
          "#98D8C8",
          "#F7DC6F",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        createTitleParticle(centerX, centerY, randomColor, "rainbow");
        break;
      case "white-aura":
        createTitleParticle(centerX, centerY, "#FFFFFF", "white");
        break;
      case "supreme-aura":
        // Aura suprema con colores intensos y rotantes
        const supremeColors = ["#FF1493", "#FFD700", "#8A2BE2", "#00FFFF"];
        const supremeColor = supremeColors[Math.floor(Math.random() * supremeColors.length)];
        createTitleParticle(centerX, centerY, supremeColor, "supreme");
        break;
    }
  }
}

// Crear partícula de efecto de título
function createTitleParticle(x, y, color, type) {
  const particle = document.createElement("div");
  particle.className = `title-particle title-particle-${type}`;

  // Posición alrededor de la nave
  const angle = Math.random() * Math.PI * 2;
  const radius = 30 + Math.random() * 20;
  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius;

  particle.style.left = x + offsetX + "px";
  particle.style.top = y + offsetY + "px";
  particle.style.backgroundColor = color;
  particle.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}`;

  if (type === "star") {
    particle.style.backgroundColor = "transparent";
    particle.style.width = "0";
    particle.style.height = "0";
    particle.style.borderLeft = "6px solid transparent";
    particle.style.borderRight = "6px solid transparent";
    particle.style.borderBottom = `10px solid ${color}`;
    particle.style.boxShadow = `0 0 12px ${color}`;
  }

  document.getElementById("game-container").appendChild(particle);

  // Animación y remoción
  setTimeout(() => particle.remove(), 1500);
}

// Inicializar sistema de títulos al cargar
window.addEventListener("DOMContentLoaded", () => {
  updateAvailableTitles();
  displayPlayerTitle();
});

// Pausa automática al ocultar la pestaña / bloquear el celular.
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
    if (level % 10 === 0) {
      enemies = [];
      if (typeof Foes !== "undefined") Foes.clear();
    }
    // Acelerar spawns al subir de nivel
    if (gameRunning && !bossActive) rescheduleSpawner();
    if (level === 5 || level === 8 || level === 11) {
      if (typeof showMiniToast === "function") {
        showMiniToast(level === 11 ? "el laberinto se cierra…" : "la presión sube", 1600);
      }
    }
    if (typeof Rogue !== "undefined") Rogue.offerUpgrades(level);
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
