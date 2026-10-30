/**
 * Space War — Enemigos en pixel art (assets/enemigos-sheet.png, cuadrícula 32 px).
 * Naves: Rápido, Tanque, Kamikaze, Abanico, Divisor.
 * Laberinto (Madoka-ish): Familiar, Cinta, Semilla de pena, Brujita.
 */
(function (global) {
  const sheet = new Image();
  sheet.src = "assets/enemigos-sheet.png";
  const T = 32;
  const DEFS = {
    fast:     { row: 0, hp: 1, pts: 15, minLvl: 1, w: 1 },
    splitter: { row: 4, hp: 2, pts: 20, minLvl: 2, w: 0.8 },
    kamikaze: { row: 2, hp: 1, pts: 25, minLvl: 4, w: 0.75 },
    tank:     { row: 1, hp: 3, pts: 40, minLvl: 4, w: 0.55 },
    fan:      { row: 3, hp: 2, pts: 35, minLvl: 6, w: 0.45 },
    // vibe laberinto / Madoka — sprites propios en filas 5–8
    familiar: { row: 5, hp: 1, pts: 12, minLvl: 1, w: 0.95, frames: 3 },
    ribbon:   { row: 6, hp: 2, pts: 22, minLvl: 3, w: 0.7, frames: 2 },
    grief:    { row: 7, hp: 4, pts: 36, minLvl: 5, w: 0.5, frames: 2 },
    witch:    { row: 8, hp: 5, pts: 55, minLvl: 8, w: 0.28, frames: 2 },
  };
  const LABELS = {
    fast: "Rápido",
    splitter: "Divisor",
    kamikaze: "Kamikaze",
    tank: "Tanque",
    fan: "Abanico",
    familiar: "Familiar rosa",
    ribbon: "Cinta del laberinto",
    grief: "Semilla de pena",
    witch: "Brujita menor",
    half: "Mitad",
  };
  let foes = [];
  const S = () => 1;

  function make(type, x, y) {
    const d = DEFS[type], s = S();
    const post = Math.floor(Math.max(0, level - 10) * 0.75);
    const f = {
      type, x, y, w: T * s, h: T * s,
      hp: d.hp + post, maxHp: d.hp + post,
      t: 0, flash: 0, vx: 0, vy: 0, baseX: x,
      state: "in", stateT: 0,
      fireT: 1500 + RNG() * 1000,
      phase: RNG() * Math.PI * 2,
      dashT: 0,
    };
    if (type === "fast") f.vy = (2.6 + Math.min(1.5, level * 0.05)) * (1 + 0.25 * Math.max(0, level - 10));
    if (type === "tank") f.vy = 0.7;
    if (type === "splitter") f.vy = 1.4;
    if (type === "kamikaze") f.vy = 1.2;
    if (type === "fan") { f.vy = 1.4; f.vx = RNG() < 0.5 ? -1.2 : 1.2; }
    if (type === "familiar") { f.vy = 2.4 + RNG() * 0.8; f.vx = (RNG() < 0.5 ? -1 : 1) * (1.4 + RNG()); f.w = f.h = 28; }
    if (type === "ribbon") { f.vy = 1.5 + RNG() * 0.4; }
    if (type === "grief") { f.vy = 0.55 + RNG() * 0.25; }
    if (type === "witch") { f.vy = 0.9; f.fireT = 1200 + RNG() * 600; }
    return f;
  }
  function half(x, y, dir) {
    const s = S();
    return { type: "half", x, y, w: 16 * s, h: 16 * s, hp: 1, t: 0, flash: 0, vx: 2 * dir, vy: 2.2, dir };
  }

  function rollSpawn(lvl) {
    const __t = gameNow(), ramp = __t < 120000 ? __t / 200000 : 0.6 + 0.4 * Math.min(1, (__t - 120000) / 360000);
    const __pb = window.__postBossAt != null ? gameNow() - window.__postBossAt : Infinity;
    if (__pb < 10000) return false;
    const __post = Math.max(0, lvl - 10);
    const chance = Math.min(0.6 + 0.08 * __post, (0.18 + lvl * 0.045) * (0.5 + 0.5 * ramp) * (1 + 0.5 * __post));
    if (RNG() > chance) return false;
    const pool = Object.keys(DEFS).filter((k) => lvl >= DEFS[k].minLvl);
    const tot = pool.reduce((a, k) => a + DEFS[k].w, 0);
    let r = RNG() * tot, type = pool[0];
    for (const k of pool) { r -= DEFS[k].w; if (r <= 0) { type = k; break; } }
    if (type === "fan" && foes.filter((f) => f.type === "fan").length >= 2) type = "fast";
    if (type === "witch" && foes.filter((f) => f.type === "witch").length >= 1) type = RNG() < 0.5 ? "grief" : "ribbon";
    const s = S();
    const x0 = 8 + RNG() * Math.max(1, GW - T * s - 16);
    foes.push(make(type, x0, -T * s));
    // familiares a veces vienen de a dos
    if (type === "familiar" && RNG() < 0.55) {
      foes.push(make("familiar", Math.max(8, Math.min(GW - 40, x0 + 36)), -T * s - 18));
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
    if (f.flash > 0) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(f.x) + 4, Math.round(f.y) + 4, f.w - 8, f.h - 8); ctx.restore();
    }
    // vida solo en tanques del laberinto
    if ((f.type === "grief" || f.type === "witch" || f.type === "tank") && f.maxHp > 1) {
      const pct = Math.max(0, f.hp / f.maxHp);
      const bw = f.w * 0.7, bx = f.x + (f.w - bw) / 2, by = f.y - 4;
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx, by, bw, 2);
      ctx.fillStyle = f.type === "witch" ? "#FF8AD8" : "#FFD54F";
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
    const prev = score;
    const gained = addPoints(base);
    const magical = f.type === "familiar" || f.type === "ribbon" || f.type === "grief" || f.type === "witch";
    if (global.VFX) {
      if (magical) petalBurst(cx, cy);
      else VFX.explosion(cx, cy, f.type === "tank" ? 1.6 : f.type === "half" ? 0.6 : 1);
      VFX.registerKill(cx, cy, gained || base);
      if (typeof VFX.floatText === "function" && magical) {
        VFX.floatText(cx, cy - 18, LABELS[f.type] || "", "#FF8AD8", 12);
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
    const easy = gameNow() < 120000 ? 0.9 : 1.1;
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 + (i - (n - 1) / 2) * spread;
      enemyBullets.push({
        x: bx - 3, y: by,
        vx: Math.cos(a) * 3.2 * easy,
        speed: Math.sin(a) * 3.2 * easy,
        width: 7, height: 7,
        witch: true,
        src: "bala " + (LABELS[f.type] || f.type),
      });
    }
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
          if (f.state === "in") { f.y += f.vy * K; if (f.y > GH * 0.22) { f.state = "blink"; f.stateT = 0; if (global.SFX) SFX.play("impact", 0.4); } }
          else if (f.state === "blink") { if (f.stateT >= 400) { f.state = "dive"; const dx = player.x - f.x, dy = player.y - f.y, m = Math.hypot(dx, dy) || 1; f.vx = (dx / m) * 8; f.vy = (dy / m) * 8; } }
          else { f.x += f.vx * K; f.y += f.vy * K; }
          break;
        case "fan":
          if (f.y < GH * 0.14) f.y += f.vy * K; else { f.x += f.vx * K; if (f.x < 0 || f.x + f.w > GW) f.vx *= -1; }
          if (f.t > 14000) f.y += 2 * K;
          f.fireT -= dt * (1 + 0.3 * Math.max(0, level - 10));
          f.glow = f.fireT <= 300 && f.fireT > 0 ? 1 : 0;
          if (f.fireT <= 0) {
            f.fireT = Math.max(1400, 2600 - level * 40);
            const bx = f.x + f.w / 2, by = f.y + f.h;
            const bs = gameNow() < 120000 ? 2.8 : 3.6;
            [-1.6, 0, 1.6].forEach((vx) => enemyBullets.push({ x: bx - 2, y: by, vx, speed: bs, width: 4, height: 10, src: "bala abanico" }));
          }
          break;
        case "familiar":
          f.y += f.vy * K;
          f.x += f.vx * K;
          if (f.x <= 0 || f.x + f.w >= GW) f.vx *= -1;
          break;
        case "ribbon":
          f.y += f.vy * K;
          f.x = f.baseX + Math.sin(f.t / 220 + f.phase) * Math.min(70, GW * 0.2);
          break;
        case "grief":
          f.y += f.vy * K;
          f.x += Math.sin(f.t / 400 + f.phase) * 0.4 * K;
          break;
        case "witch":
          f.dashT += dt;
          if (f.state !== "dash" && f.dashT > 1100) {
            f.state = "dash"; f.dashT = 0;
            const dx = player.x - f.x, dy = player.y - f.y, m = Math.hypot(dx, dy) || 1;
            f.vx = (dx / m) * 5.5; f.vy = (dy / m) * 5.5;
          } else if (f.state === "dash") {
            f.x += f.vx * K; f.y += f.vy * K;
            if (f.dashT > 380) { f.state = "in"; f.dashT = 0; f.vy = 0.9; f.vx = 0; f.baseX = f.x; }
          } else {
            f.y += f.vy * K;
            f.x = f.baseX + Math.sin(f.t / 320 + f.phase) * 28;
          }
          f.fireT -= dt;
          if (f.fireT <= 0 && f.state !== "dash") {
            f.fireT = Math.max(1100, 2000 - level * 30);
            firePetals(f, 5, 0.32);
          }
          break;
        case "half":
          f.x += f.vx * K; f.y += f.vy * K; if (f.x < 0 || f.x + f.w > GW) f.vx *= -1; break;
        default:
          f.y += f.vy * K;
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
    _spawn: (t) => foes.push(make(t, GW / 2 - 16, 40)),
  };
})(window);
