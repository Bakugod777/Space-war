/**
 * Space War — spawns de power-ups y botín de jefe.
 * Depende de arrays globales (kits, xiaos, …) definidos en game.js.
 */
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

/** Botín tras derrotar jefe / mini-jefe: cae cerca del cadáver */
function dropBossLoot(cx, cy, tier) {
  const at = (arr, make, ox, oy, spd) => {
    const p = make();
    p.x = Math.max(8, Math.min(GW - (p.width || 48) - 8, cx + ox - (p.width || 48) / 2));
    p.y = Math.max(-20, cy + oy);
    if (spd) p.speed = spd;
    arr.push(p);
  };
  const mk = (src, w = 48, h = 48, speed = 1.6) => {
    const o = { x: 0, y: 0, width: w, height: h, speed, image: new Image() };
    o.image.src = src;
    return o;
  };
  // Siempre: kit (cura) + arlee (cadencia)
  at(kits, () => mk("assets/laberinto/semilla_idle.png", 50, 50, 1.4), -40, -10, 1.4);
  at(arlees, () => mk("assets/arlee.png"), 40, -20);
  at(cynos, () => mk("assets/cyno.png"), 0, -50);
  if (tier === "boss") {
    at(flins, () => mk("assets/flins.png"), -70, -40);
    at(xiaos, () => mk("assets/xiao.png"), 70, -35, 1.3);
    if (player.hearts <= 2) at(rerirs, () => mk("assets/rerir.png"), 20, -70);
    // arma xiao como enemigo-loot cerca
    const wpn = {
      x: Math.max(8, Math.min(GW - 58, cx - 25)),
      y: cy - 80,
      width: 50, height: 50,
      speedX: RNG() < 0.5 ? -2 : 2,
      speedY: 2.2,
      health: 2,
      image: new Image(),
    };
    wpn.image.src = "assets/xiao_weapon.png";
    enemies.push(wpn);
  }
  if (typeof SFX !== "undefined") SFX.play("powerup", 0.8);
  if (typeof VFX !== "undefined") VFX.floatText(cx, cy - 30, "¡botín!", "#FFD54F", 16);
  if (typeof showMiniToast === "function") {
    showMiniToast(tier === "boss" ? "¡botín de jefe!" : "¡botín de mini-jefe!", 1800);
  }
}

