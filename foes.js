/**
 * Space War — Enemigos pixel (assets/enemigos-sheet.png, 32 px).
 * Naves + laberinto Madoka + sniper/orbiter. Escala con Diff.
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
  };
  const LABELS = {
    fast: "Rápido", splitter: "Divisor", kamikaze: "Kamikaze", tank: "Tanque",
    fan: "Abanico", familiar: "Familiar rosa", ribbon: "Cinta del laberinto",
    grief: "Semilla de pena", witch: "Brujita menor", sniper: "Francotiradora",
    orbiter: "Órbita maldita", half: "Mitad", elite: "Élite",
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
      state: "in", stateT: 0, fireT: 1100 + RNG() * 700,
      phase: RNG() * Math.PI * 2, dashT: 0, elite,
      orbitR: 36 + RNG() * 40, aimT: 0,
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
    const kind = kinds[Math.floor(RNG() * (lvl >= 8 ? 4 : 3))];
    const baseX = 40 + RNG() * Math.max(1, GW - 120);
    const y0 = -T - 8;
    const elite = RNG() < D().eliteChance();
    if (kind === "line") {
      const n = 3 + Math.floor(RNG() * 3);
      const t = lvl >= 4 && RNG() < 0.5 ? "familiar" : "fast";
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
    }
    if (global.showMiniToast && RNG() < 0.55) {
      const msg = kind === "swarm" ? "¡enjambre de familiares!" : kind === "vee" ? "formación en V" : kind === "ring" ? "anillo orbital" : "oleada alineada";
      showMiniToast(msg, 1400);
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
    const chance = Math.min(0.78, (0.22 + lvl * 0.05) * (0.55 + 0.45 * ramp) * (1 + 0.55 * Math.max(0, lvl - 10)));
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
    const magical = f.type === "familiar" || f.type === "ribbon" || f.type === "grief" || f.type === "witch" || f.type === "orbiter";
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
  }

  function fireAimed(f) {
    const bx = f.x + f.w / 2, by = f.y + f.h;
    const px = player.x + player.width / 2, py = player.y + player.height / 2;
    const dx = px - bx, dy = py - by, m = Math.hypot(dx, dy) || 1;
    const sp = 4.0 * D().bulletMul();
    // doble bala con ligera dispersión (más difícil de esquivar)
    [-0.08, 0.08].forEach((off) => {
      const ang = Math.atan2(dy, dx) + off;
      enemyBullets.push({
        x: bx - 2, y: by,
        vx: Math.cos(ang) * sp, speed: Math.sin(ang) * sp,
        width: 5, height: 10, src: "bala francotiradora",
      });
    });
  }

  function update(ctx, dtMs, K) {
    const dt = dtMs * (K > 0 ? 1 : 0);
    for (let i = foes.length - 1; i >= 0; i--) {
      const f = foes[i];
      f.t += dt; if (f.flash > 0) f.flash -= K;
      switch (f.type) {
        case "fast":
          f.y += f.vy * K; f.x = f.baseX + Math.sin(f.t / 260) * 46; break;
        case "kamikaze":
          f.stateT += dt;
          if (f.state === "in") { f.y += f.vy * K; if (f.y > GH * 0.18) { f.state = "blink"; f.stateT = 0; if (global.SFX) SFX.play("impact", 0.4); } }
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
          f.fireT -= dt * (1.15 + 0.4 * Math.max(0, level - 5));
          f.glow = f.fireT <= 280 && f.fireT > 0 ? 1 : 0;
          if (f.fireT <= 0) {
            f.fireT = Math.max(850, 2000 - level * 55);
            const bx = f.x + f.w / 2, by = f.y + f.h;
            const bs = (3.0 + level * 0.055) * D().bulletMul();
            [-2.0, -0.7, 0.7, 2.0].forEach((vx) => enemyBullets.push({ x: bx - 2, y: by, vx: vx * D().bulletMul(), speed: bs, width: 4, height: 10, src: "bala abanico" }));
          }
          break;
        case "familiar":
          f.y += f.vy * K; f.x += f.vx * K;
          if (f.x <= 0 || f.x + f.w >= GW) f.vx *= -1;
          break;
        case "ribbon":
          f.y += f.vy * K;
          f.x = f.baseX + Math.sin(f.t / 200 + f.phase) * Math.min(78, GW * 0.22);
          break;
        case "grief":
          f.y += f.vy * K;
          f.x += Math.sin(f.t / 380 + f.phase) * 0.45 * K;
          // Semillas siempre escupen pétalos (no solo élites)
          f.fireT -= dt;
          if (f.fireT <= 0) {
            f.fireT = Math.max(1100, 1800 - level * 40);
            firePetals(f, f.elite ? 5 : 3, 0.38);
          }
          break;
        case "witch":
          f.dashT += dt;
          if (f.state !== "dash" && f.dashT > Math.max(480, 820 - level * 25)) {
            f.state = "dash"; f.dashT = 0;
            const dx = player.x - f.x, dy = player.y - f.y, m = Math.hypot(dx, dy) || 1;
            const dash = 6.2 + Math.min(3.2, level * 0.1);
            f.vx = (dx / m) * dash; f.vy = (dy / m) * dash;
            firePetals(f, 3, 0.45); // dash con ráfaga
          } else if (f.state === "dash") {
            f.x += f.vx * K; f.y += f.vy * K;
            if (f.dashT > 400) { f.state = "in"; f.dashT = 0; f.vy = 0.95 * D().speedMul(); f.vx = 0; f.baseX = f.x; }
          } else {
            f.y += f.vy * K;
            f.x = f.baseX + Math.sin(f.t / 260 + f.phase) * 34;
          }
          f.fireT -= dt;
          if (f.fireT <= 0 && f.state !== "dash") {
            f.fireT = Math.max(650, 1400 - level * 40);
            firePetals(f, 7, 0.26);
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
            f.fireT -= dt;
            if (f.fireT <= 0) {
              fireAimed(f);
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
          f.fireT -= dt;
          if (f.fireT <= 0) {
            f.fireT = Math.max(1000, 1800 - level * 35);
            firePetals(f, f.elite ? 4 : 2, 0.48);
          }
          break;
        }
        case "half":
          f.x += f.vx * K; f.y += f.vy * K; if (f.x < 0 || f.x + f.w > GW) f.vx *= -1; break;
        default:
          f.y += f.vy * K;
      }
      // élites genéricos: a veces disparan
      if (f.elite && f.type !== "witch" && f.type !== "fan" && f.type !== "sniper" && f.type !== "grief" && f.type !== "orbiter") {
        f.fireT -= dt;
        if (f.fireT <= 0) { f.fireT = 2000 + RNG() * 800; fireAimed(f); }
      }
      draw(ctx, f);
      if (f.y > GH + 40 || f.x < -80 || f.x > GW + 80) { foes.splice(i, 1); continue; }
      if (hitsPlayer(f)) { foes.splice(i, 1); handlePlayerDamage("choque " + f.type); continue; }
      for (let b = bullets.length - 1; b >= 0; b--) {
        const u = bullets[b];
        if (u.x < f.x + f.w && u.x + 5 > f.x && u.y < f.y + f.h && u.y + 12 > f.y) {
          if (u.hit && u.hit.has(f)) continue;
          f.hp -= u.dmg || 1; f.flash = 4;
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
