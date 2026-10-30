/**
 * Space War — Enemigos originales en pixel art (hoja assets/enemigos-sheet.png, cuadrícula 32 px).
 * Rápido (zigzag), Tanque (3 golpes, grietas), Kamikaze (parpadea 400 ms y se lanza),
 * Abanico (cañones brillan 300 ms y dispara 3), Divisor (se parte en dos mitades de 16 px).
 */
(function (global) {
  const sheet = new Image();
  sheet.src = "assets/enemigos-sheet.png";
  const T = 32;
  const DEFS = {
    fast:     { row: 0, hp: 1, pts: 15, minLvl: 1, w: 1 },
    splitter: { row: 4, hp: 2, pts: 20, minLvl: 2, w: 0.8 },
    kamikaze: { row: 2, hp: 1, pts: 25, minLvl: 4, w: 0.8 },
    tank:     { row: 1, hp: 3, pts: 40, minLvl: 4, w: 0.6 },
    fan:      { row: 3, hp: 2, pts: 35, minLvl: 6, w: 0.5 },
  };
  let foes = [];
  const S = () => 1; // el mundo entero ya se escala por un entero // escala entera

  function make(type, x, y) {
    const d = DEFS[type], s = S();
    const f = { type, x, y, w: T * s, h: T * s, hp: d.hp + Math.floor(Math.max(0, level - 10) * 0.75), maxHp: d.hp + Math.floor(Math.max(0, level - 10) * 0.75), t: 0, flash: 0,
      vx: 0, vy: 0, baseX: x, state: "in", stateT: 0, fireT: 1500 + RNG() * 1000 };
    if (type === "fast") f.vy = (2.6 + Math.min(1.5, level * 0.05)) * (1 + 0.25 * Math.max(0, level - 10));
    if (type === "tank") f.vy = 0.7;
    if (type === "splitter") f.vy = 1.4;
    if (type === "kamikaze") f.vy = 1.2;
    if (type === "fan") { f.vy = 1.4; f.vx = RNG() < 0.5 ? -1.2 : 1.2; }
    return f;
  }
  function half(x, y, dir) {
    const s = S();
    return { type: "half", x, y, w: 16 * s, h: 16 * s, hp: 1, t: 0, flash: 0, vx: 2 * dir, vy: 2.2, dir };
  }

  function rollSpawn(lvl) {
    const __t = gameNow(), ramp = __t < 120000 ? __t / 200000 : 0.6 + 0.4 * Math.min(1, (__t - 120000) / 360000); // después del min 2 sube despacio (tope al min 8)
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
    const s = S();
    foes.push(make(type, 8 + RNG() * Math.max(1, GW - T * s - 16), -T * s));
    return true;
  }

  function frameFor(f) {
    if (f.type === "fast") return [0, 1 + (Math.floor(f.t / 80) % 3)][f.t > 0 ? 1 : 0];
    if (f.type === "tank") return Math.min(3, f.maxHp - f.hp + (f.hp < f.maxHp ? 0 : 0));
    if (f.type === "kamikaze") return f.state === "blink" && Math.floor(f.stateT / 80) % 2 ? 1 : 0;
    if (f.type === "fan") return f.glow > 0 ? 1 : 0;
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
    if (f.flash > 0) { // destello blanco al recibir impacto
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.6;
      ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(f.x) + 4, Math.round(f.y) + 4, f.w - 8, f.h - 8); ctx.restore();
    }
  }

  function kill(f, idx) {
    foes.splice(idx, 1);
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
    if (f.type === "splitter") foes.push(half(f.x, f.y, -1), half(f.x + f.w / 2, f.y, 1));
    const base = f.type === "half" ? 5 : DEFS[f.type].pts;
    const prev = score;
    const gained = addPoints(base);
    if (global.VFX) { VFX.explosion(cx, cy, f.type === "tank" ? 1.6 : f.type === "half" ? 0.6 : 1); VFX.registerKill(cx, cy, gained || base); }
    if (global.SFX) SFX.play("explosion", f.type === "half" ? 0.5 : 1);
    if (global.Rogue) Rogue.kills++;
    if (global.Magia) Magia.onKill(cx, cy);
    try { updateStatsOnKill("type1"); } catch (e) {}
    maybeLevelUp(prev);
  }

  function hitsPlayer(f) {
    return f.x < player.x + player.width && f.x + f.w > player.x && f.y < player.y + player.height && f.y + f.h > player.y;
  }

  function update(ctx, dtMs, K) {
    const dt = dtMs * (K > 0 ? 1 : 0);
    for (let i = foes.length - 1; i >= 0; i--) {
      const f = foes[i];
      f.t += dt; if (f.flash > 0) f.flash -= K;
      switch (f.type) {
        case "fast": f.y += f.vy * K; f.x = f.baseX + Math.sin(f.t / 260) * 46; break;
        case "kamikaze":
          f.stateT += dt;
          if (f.state === "in") { f.y += f.vy * K; if (f.y > GH * 0.22) { f.state = "blink"; f.stateT = 0; if (global.SFX) SFX.play("impact", 0.4); } }
          else if (f.state === "blink") { if (f.stateT >= 400) { f.state = "dive"; const dx = player.x - f.x, dy = player.y - f.y, m = Math.hypot(dx, dy) || 1; f.vx = (dx / m) * 8; f.vy = (dy / m) * 8; } }
          else { f.x += f.vx * K; f.y += f.vy * K; }
          break;
        case "fan":
          if (f.y < GH * 0.14) f.y += f.vy * K; else { f.x += f.vx * K; if (f.x < 0 || f.x + f.w > GW) f.vx *= -1; }
          if (f.t > 14000) f.y += 2 * K; // se retira
          f.fireT -= dt * (1 + 0.3 * Math.max(0, level - 10)); // post-jefe: disparan más seguido
          f.glow = f.fireT <= 300 && f.fireT > 0 ? 1 : 0;
          if (f.fireT <= 0) {
            f.fireT = Math.max(1400, 2600 - level * 40);
            const bx = f.x + f.w / 2, by = f.y + f.h;
            const bs = gameNow() < 120000 ? 2.8 : 3.6;
            [-1.6, 0, 1.6].forEach((vx) => enemyBullets.push({ x: bx - 2, y: by, vx, speed: bs, width: 4, height: 10, src: 'bala abanico' }));
          }
          break;
        case "half": f.x += f.vx * K; f.y += f.vy * K; if (f.x < 0 || f.x + f.w > GW) f.vx *= -1; break;
        default: f.y += f.vy * K;
      }
      draw(ctx, f);
      if (f.y > GH + 40 || f.x < -80 || f.x > GW + 80) { foes.splice(i, 1); continue; }
      if (hitsPlayer(f)) { foes.splice(i, 1); handlePlayerDamage('choque ' + f.type); continue; }
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

  global.Foes = { update, rollSpawn, clear: () => (foes = []), get list() { return foes; }, _spawn: (t) => foes.push(make(t, GW / 2 - 16, 40)) };
})(window);
