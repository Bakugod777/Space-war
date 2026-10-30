/**
 * Space War — Enemigos pixel (assets/enemigos-sheet.png, 32 px).
 *
 * API: Foes.update · Foes.rollSpawn · Foes.clear · Foes.list · Foes.spawnFormation
 * Tipos en DEFS; patrones de disparo en el switch de update().
 */
(function (global) {
  const sheet = new Image();
  sheet.src = "assets/enemigos-sheet.png";
  const T = 32;
  // HP altos + peso hacia tipos “bruja”: el laberinto duele
  const DEFS = {
    fast:     { row: 0, hp: 2, pts: 18, minLvl: 1, w: 0.7 },
    splitter: { row: 4, hp: 3, pts: 28, minLvl: 2, w: 0.7 },
    kamikaze: { row: 2, hp: 2, pts: 30, minLvl: 2, w: 0.75 },
    tank:     { row: 1, hp: 5, pts: 50, minLvl: 3, w: 0.55 },
    fan:      { row: 3, hp: 3, pts: 42, minLvl: 4, w: 0.55 },
    familiar: { row: 5, hp: 1, pts: 14, minLvl: 1, w: 1.05, frames: 3 },
    ribbon:   { row: 6, hp: 3, pts: 28, minLvl: 2, w: 0.8, frames: 2 },
    grief:    { row: 7, hp: 7, pts: 48, minLvl: 3, w: 0.65, frames: 2 },
    witch:    { row: 8, hp: 9, pts: 70, minLvl: 5, w: 0.4, frames: 2 },
    sniper:   { row: 9, hp: 4, pts: 55, minLvl: 4, w: 0.55, frames: 2 },
    orbiter:  { row: 10, hp: 3, pts: 34, minLvl: 3, w: 0.7, frames: 3 },
    // —— roster ampliado ——
    shield:   { row: 11, hp: 6, pts: 40, minLvl: 3, w: 0.5, frames: 2 },
    bomber:   { row: 12, hp: 4, pts: 38, minLvl: 4, w: 0.5, frames: 2 },
    phantom:  { row: 13, hp: 3, pts: 44, minLvl: 5, w: 0.45, frames: 2 },
    crystal:  { row: 14, hp: 5, pts: 50, minLvl: 6, w: 0.42, frames: 2 },
    huntress: { row: 15, hp: 4, pts: 52, minLvl: 5, w: 0.48, frames: 2 },
    weaver:   { row: 16, hp: 3, pts: 36, minLvl: 4, w: 0.55, frames: 2 },
    drone:    { row: 17, hp: 2, pts: 22, minLvl: 2, w: 0.85, frames: 3 },
    hex:      { row: 18, hp: 6, pts: 58, minLvl: 7, w: 0.35, frames: 2 },
  };
  const LABELS = {
    fast: "Rápido", splitter: "Divisor", kamikaze: "Kamikaze", tank: "Tanque",
    fan: "Abanico", familiar: "Familiar rosa", ribbon: "Cinta del laberinto",
    grief: "Semilla de pena", witch: "Brujita menor", sniper: "Francotiradora",
    orbiter: "Órbita maldita",
    shield: "Escudero", bomber: "Bombardero", phantom: "Fantasma",
    crystal: "Cristal maldito", huntress: "Cazadora", weaver: "Tejedora",
    drone: "Dron", hex: "Hexágono",
    half: "Mitad", elite: "Élite",
  };
  let foes = [];
  const S = () => 1;
  const D = () => (global.Diff || {
    hpBonus: () => Math.floor(Math.max(0, level - 10) * 0.75),
    speedMul: () => 1 + 0.25 * Math.max(0, level - 10),
    bulletMul: () => 1,
    eliteChance: () => 0,
    maxAlive: () => 24,
    formationChance: () => 0.08,
  });

  function make(type, x, y, opts) {
    const d = DEFS[type], s = S(), sm = D().speedMul();
    const bonus = D().hpBonus(d.hp);
    const elite = !!(opts && opts.elite);
    const hp = d.hp + bonus + (elite ? 3 : 0);
    const f = {
      type, x, y, w: T * s, h: T * s,
      hp, maxHp: hp, t: 0, flash: 0, vx: 0, vy: 0, baseX: x,
      state: "in", stateT: 0, fireT: 450 + RNG() * 550, // disparan pronto al entrar
      phase: RNG() * Math.PI * 2, dashT: 0, elite, glow: 0,
      orbitR: 36 + RNG() * 40, aimT: 0, eliteGun: 700 + RNG() * 400,
    };
    if (type === "fast") f.vy = (2.7 + Math.min(2.2, level * 0.08)) * sm;
    if (type === "tank") f.vy = 0.7 * sm;
    if (type === "splitter") f.vy = 1.45 * sm;
    if (type === "kamikaze") f.vy = 1.35 * sm;
    if (type === "fan") { f.vy = 1.4 * sm; f.vx = (RNG() < 0.5 ? -1 : 1) * 1.25 * sm; }
    if (type === "familiar") { f.vy = (2.6 + RNG() * 1.1) * sm; f.vx = (RNG() < 0.5 ? -1 : 1) * (1.6 + RNG()) * sm; f.w = f.h = 28; }
    if (type === "ribbon") f.vy = (1.6 + RNG() * 0.5) * sm;
    if (type === "grief") { f.vy = (0.55 + RNG() * 0.35) * sm; f.fireT = 1600 + RNG() * 600; }
    if (type === "witch") { f.vy = 0.95 * sm; f.fireT = 700 + RNG() * 400; }
    if (type === "sniper") { f.vy = 1.85 * sm; f.state = "enter"; f.fireT = 500 + RNG() * 300; }
    if (type === "orbiter") { f.vy = 0.95 * sm; f.orbitSpeed = 0.055 + RNG() * 0.035; f.fireT = 1400 + RNG() * 500; }
    if (type === "shield") { f.vy = 0.85 * sm; f.shield = true; f.fireT = 900 + RNG() * 400; }
    if (type === "bomber") { f.vy = 1.1 * sm; f.bombT = 800 + RNG() * 400; }
    if (type === "phantom") { f.vy = 1.5 * sm; f.phaseT = 0; f.ghost = false; }
    if (type === "crystal") { f.vy = 0.7 * sm; f.fireT = 1200 + RNG() * 500; }
    if (type === "huntress") { f.vy = 1.7 * sm; f.vx = (RNG() < 0.5 ? -1 : 1) * 1.4 * sm; f.fireT = 600 + RNG() * 300; }
    if (type === "weaver") { f.vy = 1.35 * sm; f.trailT = 0; }
    if (type === "drone") { f.vy = 1.8 * sm; f.orbitSpeed = 0.08; f.w = f.h = 26; }
    if (type === "hex") { f.vy = 0.75 * sm; f.state = "hold"; f.fireT = 700 + RNG() * 400; }
    if (elite) { f.vy *= 1.2; f.ptsMul = 2; }
    return f;
  }
  function half(x, y, dir) {
    const s = S();
    return { type: "half", x, y, w: 16 * s, h: 16 * s, hp: 1, t: 0, flash: 0, vx: 2.1 * dir * D().speedMul(), vy: 2.3 * D().speedMul(), dir };
  }

  function pickType(lvl) {
    const pool = Object.keys(DEFS).filter((k) => lvl >= DEFS[k].minLvl);
    const tot = pool.reduce((a, k) => a + DEFS[k].w, 0);
    let r = RNG() * tot, type = pool[0];
    for (const k of pool) { r -= DEFS[k].w; if (r <= 0) { type = k; break; } }
    // Permitir más presión: hasta 3 abanicos / 2 brujitas / 3 snipers
    if (type === "fan" && foes.filter((f) => f.type === "fan").length >= 3) type = "orbiter";
    if (type === "witch" && foes.filter((f) => f.type === "witch").length >= 2) type = RNG() < 0.5 ? "grief" : "sniper";
    if (type === "sniper" && foes.filter((f) => f.type === "sniper").length >= 3) type = "grief";
    return type;
  }

  function pushFoe(f) {
    if (foes.length >= D().maxAlive()) return false;
    foes.push(f);
    return true;
  }

  function spawnOne(type, x, y, opts) {
    return pushFoe(make(type, x, y, opts));
  }

  function spawnFormation(lvl) {
    const kinds = ["line", "vee", "swarm", "ring"];
    if (lvl >= 5) kinds.push("dronewall");
    if (lvl >= 6) kinds.push("huntpack");
    if (lvl >= 8) kinds.push("crystalgate");
    const kind = kinds[Math.floor(RNG() * kinds.length)];
    const baseX = 40 + RNG() * Math.max(1, GW - 120);
    const y0 = -T - 8;
    const elite = RNG() < D().eliteChance();
    if (kind === "line") {
      const n = 3 + Math.floor(RNG() * 3);
      const t = lvl >= 4 && RNG() < 0.5 ? "familiar" : (lvl >= 3 && RNG() < 0.4 ? "drone" : "fast");
      for (let i = 0; i < n; i++) spawnOne(t, baseX + i * 36, y0 - i * 10, { elite: elite && i === 1 });
    } else if (kind === "vee") {
      const t = "ribbon";
      spawnOne(t, baseX, y0);
      spawnOne(t, baseX - 40, y0 - 24);
      spawnOne(t, baseX + 40, y0 - 24);
      if (lvl >= 6) {
        spawnOne("familiar", baseX - 20, y0 - 48);
        spawnOne("familiar", baseX + 20, y0 - 48);
      }
    } else if (kind === "swarm") {
      const n = 6 + Math.floor(RNG() * 4);
      for (let i = 0; i < n; i++) {
        spawnOne("familiar", Math.max(8, Math.min(GW - 40, baseX + (RNG() - 0.5) * 110)), y0 - RNG() * 55);
      }
      if (lvl >= 5) spawnOne("grief", baseX, y0 - 70, { elite });
    } else if (kind === "ring") {
      const cx = Math.max(60, Math.min(GW - 60, baseX));
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        spawnOne("orbiter", cx + Math.cos(a) * 30, y0 + Math.sin(a) * 12, { elite: elite && i === 0 });
      }
      if (lvl >= 6) spawnOne("sniper", cx, y0 - 40);
    } else if (kind === "dronewall") {
      for (let i = 0; i < 5; i++) spawnOne("drone", baseX + i * 28 - 40, y0 - (i % 2) * 18);
      if (lvl >= 7) spawnOne("hex", baseX + 20, y0 - 50, { elite });
    } else if (kind === "huntpack") {
      spawnOne("huntress", baseX, y0, { elite });
      spawnOne("weaver", baseX - 48, y0 - 20);
      spawnOne("weaver", baseX + 48, y0 - 20);
      spawnOne("drone", baseX, y0 - 40);
    } else if (kind === "crystalgate") {
      spawnOne("crystal", baseX, y0, { elite });
      spawnOne("shield", baseX - 50, y0 - 10);
      spawnOne("shield", baseX + 50, y0 - 10);
      spawnOne("phantom", baseX, y0 - 45);
    }
    if (global.showMiniToast && RNG() < 0.55) {
      const msgs = {
        swarm: "¡enjambre de familiares!", vee: "formación en V", ring: "anillo orbital",
        line: "oleada alineada", dronewall: "¡muro de drones!", huntpack: "jauría de cazadoras",
        crystalgate: "portal de cristales",
      };
      showMiniToast(msgs[kind] || "oleada", 1400);
    }
  }

  function rollSpawn(lvl) {
    const __pb = window.__postBossAt != null ? gameNow() - window.__postBossAt : Infinity;
    if (__pb < 10000) return false;
    if (foes.length >= D().maxAlive()) return true;

    // Oleadas especiales
    if (RNG() < D().formationChance()) {
      spawnFormation(lvl);
      return true;
    }

    const __t = gameNow();
    const ramp = __t < 120000 ? __t / 200000 : 0.6 + 0.4 * Math.min(1, (__t - 120000) / 360000);
    const chance = Math.min(0.9, (0.38 + lvl * 0.055) * (0.6 + 0.4 * ramp) * (1 + 0.55 * Math.max(0, lvl - 10)));
    if (RNG() > chance) return false;

    const type = pickType(lvl);
    const elite = RNG() < D().eliteChance();
    const x0 = 8 + RNG() * Math.max(1, GW - T - 16);
    spawnOne(type, x0, -T, { elite });
    // Familiares casi siempre en pareja/trío (presión Madoka)
    if (type === "familiar") {
      spawnOne("familiar", Math.max(8, Math.min(GW - 40, x0 + 34)), -T - 16);
      if (RNG() < 0.55) spawnOne("familiar", Math.max(8, Math.min(GW - 40, x0 - 34)), -T - 28);
    }
    return true;
  }

  function frameFor(f) {
    if (f.type === "fast") return Math.min(3, 1 + (Math.floor(f.t / 80) % 3));
    if (f.type === "tank") return Math.min(3, Math.max(0, f.maxHp - f.hp));
    if (f.type === "kamikaze") return f.state === "blink" && Math.floor(f.stateT / 80) % 2 ? 1 : 0;
    if (f.type === "fan") return f.glow > 0 ? 1 : 0;
    if (f.type === "familiar") return Math.floor(f.t / 100) % 3;
    if (f.type === "ribbon") return Math.floor(f.t / 160) % 2;
    if (f.type === "grief") return f.hp <= f.maxHp / 2 ? 1 : 0;
    if (f.type === "witch") return f.state === "dash" ? 1 : 0;
    if (f.type === "sniper") return f.state === "charge" ? 1 : 0;
    if (f.type === "orbiter") return Math.floor(f.t / 90) % 3;
    if (f.type === "splitter") return f.hp < f.maxHp ? 1 : 0;
    if (f.type === "shield") return f.glow > 0 ? 1 : 0;
    if (f.type === "bomber") return Math.floor(f.t / 200) % 2;
    if (f.type === "phantom") return f.ghost ? 1 : 0;
    if (f.type === "crystal") return f.glow > 0 ? 1 : 0;
    if (f.type === "huntress") return Math.floor(f.t / 120) % 2;
    if (f.type === "weaver") return Math.floor(f.t / 140) % 2;
    if (f.type === "drone") return Math.floor(f.t / 80) % 3;
    if (f.type === "hex") return f.glow > 0 ? 1 : 0;
    return 0;
  }

  function draw(ctx, f) {
    ctx.imageSmoothingEnabled = false;
    if (f.type === "half") {
      ctx.drawImage(sheet, f.dir < 0 ? 32 : 48, 136, 16, 16, Math.round(f.x), Math.round(f.y), f.w, f.h);
    } else {
      const d = DEFS[f.type], fr = frameFor(f);
      ctx.drawImage(sheet, fr * T, d.row * T, T, T, Math.round(f.x), Math.round(f.y), f.w, f.h);
    }
    if (f.elite) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,77,122,0.85)";
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(f.x) + 1, Math.round(f.y) + 1, f.w - 2, f.h - 2);
      ctx.restore();
    }
    // Aviso de disparo: brillo rojo antes de soltar la bala
    if (f.glow > 0.35) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.35 + 0.45 * Math.min(1, f.glow);
      ctx.fillStyle = "#FF4D7A";
      ctx.fillRect(Math.round(f.x) + 2, Math.round(f.y) + 2, f.w - 4, f.h - 4);
      ctx.restore();
    }
    if (f.flash > 0) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(f.x) + 4, Math.round(f.y) + 4, f.w - 8, f.h - 8); ctx.restore();
    }
    if ((f.type === "grief" || f.type === "witch" || f.type === "tank" || f.type === "sniper" || f.elite) && f.maxHp > 1) {
      const pct = Math.max(0, f.hp / f.maxHp);
      const bw = f.w * 0.7, bx = f.x + (f.w - bw) / 2, by = f.y - 4;
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx, by, bw, 2);
      ctx.fillStyle = f.elite ? "#FF4D7A" : f.type === "witch" ? "#FF8AD8" : "#FFD54F";
      ctx.fillRect(bx, by, bw * pct, 2);
    }
  }

  function petalBurst(cx, cy) {
    if (!global.VFX) return;
    if (typeof VFX.petalBurst === "function") VFX.petalBurst(cx, cy);
    else VFX.explosion(cx, cy, 0.9);
  }

  function kill(f, idx) {
    foes.splice(idx, 1);
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
    if (f.type === "splitter") foes.push(half(f.x, f.y, -1), half(f.x + f.w / 2, f.y, 1));
    const base = f.type === "half" ? 5 : (DEFS[f.type] ? DEFS[f.type].pts : 10);
    const pts = Math.round(base * (f.elite ? 1.8 : 1) * (f.ptsMul || 1));
    const prev = score;
    const gained = addPoints(pts);
    const magical = f.type === "familiar" || f.type === "ribbon" || f.type === "grief" || f.type === "witch" || f.type === "orbiter"
      || f.type === "phantom" || f.type === "crystal" || f.type === "weaver" || f.type === "hex" || f.type === "huntress";
    if (global.VFX) {
      if (magical) petalBurst(cx, cy);
      else VFX.explosion(cx, cy, f.type === "tank" || f.elite ? 1.6 : f.type === "half" ? 0.6 : 1);
      VFX.registerKill(cx, cy, gained || pts);
      if (typeof VFX.floatText === "function" && (magical || f.elite)) {
        VFX.floatText(cx, cy - 18, f.elite ? "Élite" : (LABELS[f.type] || ""), f.elite ? "#FF4D7A" : "#FF8AD8", 12);
      }
    }
    if (global.SFX) SFX.play("explosion", f.type === "half" ? 0.5 : 1);
    if (global.Rogue) Rogue.kills++;
    if (global.Magia) Magia.onKill(cx, cy);
    try { updateStatsOnKill(f.type === "half" ? "splitter" : f.type); } catch (e) {}
    maybeLevelUp(prev);
  }

  function hitsPlayer(f) {
    return f.x < player.x + player.width && f.x + f.w > player.x && f.y < player.y + player.height && f.y + f.h > player.y;
  }

  function bang() {
    if (global.SFX) SFX.play("impact", 0.35);
  }

  function firePetals(f, n, spread) {
    const bx = f.x + f.w / 2, by = f.y + f.h;
    const mul = D().bulletMul();
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 + (i - (n - 1) / 2) * spread;
      const sp = 3.55 * mul;
      enemyBullets.push({
        x: bx - 3, y: by,
        vx: Math.cos(a) * sp, speed: Math.sin(a) * sp,
        width: 7, height: 7, witch: true,
        src: "bala " + (LABELS[f.type] || f.type),
      });
    }
    bang();
  }

  function fireAimed(f, opts) {
    const bx = f.x + f.w / 2, by = f.y + f.h;
    const px = player.x + player.width / 2, py = player.y + player.height / 2;
    const dx = px - bx, dy = py - by, m = Math.hypot(dx, dy) || 1;
    const sp = (opts && opts.sp ? opts.sp : 4.0) * D().bulletMul();
    const offs = (opts && opts.double) ? [-0.08, 0.08] : [0];
    offs.forEach((off) => {
      const ang = Math.atan2(dy, dx) + off;
      enemyBullets.push({
        x: bx - 2, y: by,
        vx: Math.cos(ang) * sp, speed: Math.sin(ang) * sp,
        width: opts && opts.w ? opts.w : 5,
        height: opts && opts.h ? opts.h : 10,
        src: (opts && opts.src) || ("bala " + (LABELS[f.type] || f.type)),
      });
    });
    bang();
  }

  /** Ráfaga hacia abajo (naves clásicas) */
  function fireSpray(f, vxs, speed) {
    const bx = f.x + f.w / 2, by = f.y + f.h;
    const bs = (speed || 3.2) * D().bulletMul();
    const mul = D().bulletMul();
    vxs.forEach((vx) => {
      enemyBullets.push({
        x: bx - 2, y: by, vx: vx * mul, speed: bs,
        width: 4, height: 10,
        src: "bala " + (LABELS[f.type] || f.type),
      });
    });
    bang();
  }

  /** Cuenta atrás de disparo + glow de aviso (emoción al esquivar) */
  function tickGun(f, dt, rateMul, onFire) {
    if (f.y < -8) return; // aún fuera de pantalla
    f.fireT -= dt * (rateMul || 1);
    f.glow = f.fireT <= 320 && f.fireT > 0 ? 1 : (f.glow || 0) * 0.9;
    if (f.fireT <= 0) onFire();
  }

  function update(ctx, dtMs, K) {
    const dt = dtMs * (K > 0 ? 1 : 0);
    for (let i = foes.length - 1; i >= 0; i--) {
      const f = foes[i];
      f.t += dt; if (f.flash > 0) f.flash -= K;
      switch (f.type) {
        case "fast":
          f.y += f.vy * K; f.x = f.baseX + Math.sin(f.t / 260) * 46;
          // Rápidos: bala guiada — te obligan a moverte
          tickGun(f, dt, 1.1 + level * 0.02, () => {
            f.fireT = Math.max(700, 1400 - level * 35);
            fireAimed(f, { sp: 3.6, w: 4, h: 9, src: "bala rápido" });
          });
          break;
        case "tank":
          f.y += f.vy * K;
          // Tanque: triple spray pesado
          tickGun(f, dt, 0.95, () => {
            f.fireT = Math.max(900, 1700 - level * 30);
            fireSpray(f, [-1.6, 0, 1.6], 2.8 + level * 0.04);
          });
          break;
        case "splitter":
          f.y += f.vy * K;
          tickGun(f, dt, 1, () => {
            f.fireT = Math.max(850, 1600 - level * 35);
            fireAimed(f, { sp: 3.4, src: "bala divisor" });
            if (level >= 5 || f.elite) fireSpray(f, [-1.4, 1.4], 3.0);
          });
          break;
        case "kamikaze":
          f.stateT += dt;
          if (f.state === "in") { f.y += f.vy * K; if (f.y > GH * 0.18) { f.state = "blink"; f.stateT = 0; if (global.SFX) SFX.play("impact", 0.4); fireAimed(f, { sp: 3.2, src: "bala kamikaze" }); } }
          else if (f.state === "blink") {
            if (f.stateT >= Math.max(180, 320 - level * 12)) {
              f.state = "dive";
              const dx = player.x - f.x, dy = player.y - f.y, m = Math.hypot(dx, dy) || 1;
              const dive = 8.5 + Math.min(4, level * 0.15);
              f.vx = (dx / m) * dive; f.vy = (dy / m) * dive;
            }
          } else { f.x += f.vx * K; f.y += f.vy * K; }
          break;
        case "fan":
          if (f.y < GH * 0.14) f.y += f.vy * K; else { f.x += f.vx * K; if (f.x < 0 || f.x + f.w > GW) f.vx *= -1; }
          if (f.t > 12000) f.y += 2.2 * K;
          tickGun(f, dt, 1.15 + 0.4 * Math.max(0, level - 5), () => {
            f.fireT = Math.max(750, 1800 - level * 55);
            fireSpray(f, [-2.2, -0.75, 0.75, 2.2], 3.1 + level * 0.055);
          });
          break;
        case "familiar":
          f.y += f.vy * K; f.x += f.vx * K;
          if (f.x <= 0 || f.x + f.w >= GW) f.vx *= -1;
          // Familiares: perdigón pequeño (presión de enjambre)
          tickGun(f, dt, 0.85, () => {
            f.fireT = Math.max(1100, 2000 - level * 40);
            fireAimed(f, { sp: 3.0, w: 4, h: 6, src: "bala familiar" });
          });
          break;
        case "ribbon":
          f.y += f.vy * K;
          f.x = f.baseX + Math.sin(f.t / 200 + f.phase) * Math.min(78, GW * 0.22);
          tickGun(f, dt, 1.05, () => {
            f.fireT = Math.max(800, 1500 - level * 40);
            firePetals(f, f.elite ? 4 : 3, 0.42);
          });
          break;
        case "grief":
          f.y += f.vy * K;
          f.x += Math.sin(f.t / 380 + f.phase) * 0.45 * K;
          tickGun(f, dt, 1, () => {
            f.fireT = Math.max(1000, 1650 - level * 40);
            firePetals(f, f.elite ? 5 : 3, 0.38);
          });
          break;
        case "witch":
          f.dashT += dt;
          if (f.state !== "dash" && f.dashT > Math.max(480, 820 - level * 25)) {
            f.state = "dash"; f.dashT = 0;
            const dx = player.x - f.x, dy = player.y - f.y, m = Math.hypot(dx, dy) || 1;
            const dash = 6.2 + Math.min(3.2, level * 0.1);
            f.vx = (dx / m) * dash; f.vy = (dy / m) * dash;
            firePetals(f, 3, 0.45);
          } else if (f.state === "dash") {
            f.x += f.vx * K; f.y += f.vy * K;
            if (f.dashT > 400) { f.state = "in"; f.dashT = 0; f.vy = 0.95 * D().speedMul(); f.vx = 0; f.baseX = f.x; }
          } else {
            f.y += f.vy * K;
            f.x = f.baseX + Math.sin(f.t / 260 + f.phase) * 34;
          }
          if (f.state !== "dash") {
            tickGun(f, dt, 1.1, () => {
              f.fireT = Math.max(600, 1300 - level * 40);
              firePetals(f, 7, 0.26);
            });
          }
          break;
        case "sniper":
          if (f.state === "enter") {
            f.y += f.vy * K;
            if (f.y >= GH * 0.1) { f.state = "hold"; f.aimT = 0; f.baseX = f.x; }
          } else if (f.state === "hold" || f.state === "charge") {
            f.x = f.baseX + Math.sin(f.t / 420) * 22;
            f.aimT += dt;
            f.state = f.aimT > 320 ? "charge" : "hold";
            f.glow = f.state === "charge" ? 1 : 0;
            f.fireT -= dt;
            if (f.fireT <= 0) {
              fireAimed(f, { double: true, sp: 4.2, src: "bala francotiradora" });
              f.fireT = Math.max(650, 1300 - level * 45);
              f.aimT = 0; f.state = "hold";
              f.y += 6;
              if (f.y > GH * 0.5) f.state = "leave";
            }
          } else {
            f.y += f.vy * 1.5 * K;
          }
          break;
        case "orbiter": {
          f.phase += (f.orbitSpeed || 0.055) * K * 16;
          f.y += f.vy * K;
          f.x = f.baseX + Math.cos(f.phase) * (f.orbitR || 40);
          f.x = Math.max(0, Math.min(GW - f.w, f.x));
          tickGun(f, dt, 1, () => {
            f.fireT = Math.max(900, 1650 - level * 35);
            firePetals(f, f.elite ? 4 : 2, 0.48);
            if (f.elite || level >= 6) fireAimed(f, { sp: 3.5, src: "bala órbita" });
          });
          break;
        }
        case "shield":
          f.y += f.vy * K;
          f.x = f.baseX + Math.sin(f.t / 320) * 28;
          tickGun(f, dt, 0.95, () => {
            f.fireT = Math.max(900, 1600 - level * 30);
            // dispara desde los lados (el escudo frontal bloquea el centro)
            fireSpray(f, [-2.2, 2.2], 3.1);
            if (f.elite) fireAimed(f, { sp: 3.2, src: "bala escudo" });
          });
          break;
        case "bomber":
          f.y += f.vy * K;
          f.bombT = (f.bombT || 800) - dt;
          f.glow = f.bombT <= 280 ? 1 : 0;
          if (f.bombT <= 0 && f.y > 20) {
            f.bombT = Math.max(900, 1700 - level * 40);
            // bomba retardada: bala lenta que luego “estalla” en abanico
            const bx = f.x + f.w / 2, by = f.y + f.h;
            const bomb = {
              x: bx - 4, y: by, vx: 0, speed: 1.6,
              width: 8, height: 8, src: "bomba", bomb: true, fuse: 700,
            };
            enemyBullets.push(bomb);
            bang();
          }
          tickGun(f, dt, 0.7, () => {
            f.fireT = 1800;
            fireAimed(f, { sp: 2.8, src: "bala bombardero" });
          });
          break;
        case "phantom":
          f.phaseT = (f.phaseT || 0) + dt;
          if (f.phaseT > 1400) {
            f.ghost = !f.ghost;
            f.phaseT = 0;
            if (f.ghost) { f.x = Math.max(8, Math.min(GW - f.w - 8, player.x + (RNG() - 0.5) * 80)); }
          }
          f.y += f.vy * (f.ghost ? 0.5 : 1) * K;
          f.x += Math.sin(f.t / 180) * 0.8 * K;
          if (!f.ghost) {
            tickGun(f, dt, 1.1, () => {
              f.fireT = Math.max(800, 1400 - level * 35);
              fireAimed(f, { sp: 3.7, src: "bala fantasma" });
            });
          }
          break;
        case "crystal":
          f.y += f.vy * K;
          f.x = f.baseX + Math.sin(f.t / 400 + f.phase) * 20;
          tickGun(f, dt, 0.9, () => {
            f.fireT = Math.max(1000, 1800 - level * 30);
            // anillo de cristales
            const bx = f.x + f.w / 2, by = f.y + f.h / 2;
            const n = f.elite ? 8 : 6;
            const mul = D().bulletMul();
            for (let i = 0; i < n; i++) {
              const a = (Math.PI * 2 * i) / n;
              enemyBullets.push({
                x: bx - 3, y: by,
                vx: Math.cos(a) * 2.8 * mul, speed: Math.sin(a) * 2.8 * mul,
                width: 6, height: 6, witch: true, src: "bala cristal",
              });
            }
            bang();
          });
          break;
        case "huntress":
          // persigue al jugador en X mientras baja
          f.y += f.vy * K;
          {
            const tx = player.x + player.width / 2 - f.w / 2;
            f.x += Math.sign(tx - f.x) * Math.min(2.4, Math.abs(tx - f.x) * 0.08) * K * D().speedMul();
          }
          tickGun(f, dt, 1.25, () => {
            f.fireT = Math.max(550, 1100 - level * 40);
            fireAimed(f, { double: true, sp: 4.0, src: "bala cazadora" });
          });
          break;
        case "weaver":
          f.y += f.vy * K;
          f.x = f.baseX + Math.sin(f.t / 160 + f.phase) * Math.min(90, GW * 0.28);
          f.trailT = (f.trailT || 0) + dt;
          if (f.trailT > 220 && f.y > 0) {
            f.trailT = 0;
            enemyBullets.push({
              x: f.x + f.w / 2 - 2, y: f.y + f.h / 2,
              vx: 0, speed: 2.2 * D().bulletMul(),
              width: 5, height: 5, witch: true, src: "rastro tejedora",
            });
          }
          tickGun(f, dt, 0.85, () => {
            f.fireT = Math.max(1000, 1700 - level * 30);
            firePetals(f, 3, 0.4);
          });
          break;
        case "drone":
          f.phase += (f.orbitSpeed || 0.08) * K * 16;
          f.y += f.vy * K;
          f.x = f.baseX + Math.cos(f.phase) * 50;
          f.x = Math.max(0, Math.min(GW - f.w, f.x));
          tickGun(f, dt, 1.15, () => {
            f.fireT = Math.max(700, 1300 - level * 40);
            fireAimed(f, { sp: 3.5, w: 3, h: 7, src: "bala dron" });
          });
          break;
        case "hex":
          if (f.y < GH * 0.16) f.y += f.vy * K;
          else {
            f.x = f.baseX + Math.sin(f.t / 350) * 36;
            tickGun(f, dt, 1.05, () => {
              f.fireT = Math.max(750, 1400 - level * 35);
              firePetals(f, f.elite ? 6 : 4, 0.32);
              fireAimed(f, { sp: 3.8, src: "bala hex" });
            });
          }
          break;
        case "half":
          f.x += f.vx * K; f.y += f.vy * K; if (f.x < 0 || f.x + f.w > GW) f.vx *= -1;
          tickGun(f, dt, 0.9, () => {
            f.fireT = 1600 + RNG() * 600;
            fireSpray(f, [0], 3.4);
          });
          break;
        default:
          f.y += f.vy * K;
          tickGun(f, dt, 1, () => {
            f.fireT = Math.max(900, 1600 - level * 30);
            fireAimed(f, { sp: 3.5 });
          });
      }
      // Élites: ráfaga extra además de su patrón
      if (f.elite && (f.type === "fast" || f.type === "tank" || f.type === "splitter" || f.type === "ribbon" || f.type === "familiar")) {
        f.eliteGun = (f.eliteGun || 900) - dt;
        if (f.eliteGun <= 0 && f.y > 0) {
          f.eliteGun = 1400 + RNG() * 500;
          fireAimed(f, { double: true, sp: 3.8, src: "bala élite" });
        }
      }
      draw(ctx, f);
      if (f.y > GH + 40 || f.x < -80 || f.x > GW + 80) { foes.splice(i, 1); continue; }
      if (hitsPlayer(f)) { foes.splice(i, 1); handlePlayerDamage("choque " + f.type); continue; }
      // fantasma en fase: no recibe daño
      if (f.type === "phantom" && f.ghost) continue;
      for (let b = bullets.length - 1; b >= 0; b--) {
        const u = bullets[b];
        if (u.x < f.x + f.w && u.x + 5 > f.x && u.y < f.y + f.h && u.y + 12 > f.y) {
          if (u.hit && u.hit.has(f)) continue;
          // escudero: balas frontales (desde abajo) hacen medio daño
          let dmg = u.dmg || 1;
          if (f.type === "shield" && u.y > f.y + f.h * 0.4) dmg = Math.max(1, Math.ceil(dmg * 0.5));
          f.hp -= dmg; f.flash = 4;
          if (u.pierce > 0) { u.pierce--; (u.hit = u.hit || new Set()).add(f); } else bullets.splice(b, 1);
          if (global.VFX) VFX.hitSpark(u.x, u.y);
          if (global.Magia) Magia.onHit();
          if (f.hp <= 0) { kill(f, i); break; }
          if (global.SFX) SFX.play("impact", 0.6);
          if (global.VFX) VFX.shake(1);
        }
      }
    }
  }

  global.Foes = {
    update,
    rollSpawn,
    clear: () => (foes = []),
    get list() { return foes; },
    labels: LABELS,
    spawnFormation,
    _spawn: (t) => foes.push(make(t, GW / 2 - 16, 40)),
  };
})(window);
