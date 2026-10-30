/**
 * Space War v2.1 — capa "Magia" (inspirada en el ritmo de Magia Record, con arte propio):
 * gema del alma + semillas, barra Magia (9-slice) con corte de personaje, combo de equipo
 * y el jefe como laberinto de bruja por fases con avisos de 1 s.
 */
(function (global) {
  const img = (s) => { const i = new Image(); i.src = s; return i; };
  const A = {
    gem: img("assets/laberinto/gema-sheet.png"),
    seed: img("assets/laberinto/semilla-sheet.png"),
    frame: img("assets/laberinto/magia_marco.png"),
    fill: img("assets/laberinto/magia_relleno.png"),
    far: [1, 2, 3].map((n) => img(`assets/laberinto/fondo_far_fase${n}.png`)),
    near: [1, 2, 3].map((n) => img(`assets/laberinto/fondo_near_fase${n}.png`)),
  };
  const ALLIES = { xiao: "assets/xiao.png", arlee: "assets/arlee.png", cyno: "assets/cyno.png", flins: "assets/flins.png", rerir: "assets/rerir.png" };
  const allyImg = {}; for (const k in ALLIES) allyImg[k] = img(ALLIES[k]);

  const st = { magia: 0, gem: 0, seeds: [], team: [], lastAlly: "xiao", phase: 0, warnT: 0, patT: 0, ang: 0, scroll: 0, cut: null };
  const MAX = 100;

  // ---------- HUD (DOM + canvas pequeño, escala entera) ----------
  let hud, barC, barX, gemC, gemX, btn;
  function buildHud() {
    hud = document.createElement("div"); hud.id = "magiaHud";
    hud.innerHTML = '<canvas id="magiaBar" width="120" height="12" aria-label="Barra Magia"></canvas>';
    const life = document.createElement("div"); life.id = "lifeGem";
    life.innerHTML = '<canvas id="gemCanvas" width="16" height="24" aria-label="Gema del alma (vida)"></canvas><span id="gemLabel">×3</span>';
    document.getElementById("game-container").appendChild(life);
    btn = document.createElement("button"); btn.id = "magiaBtn"; btn.type = "button"; btn.textContent = "MAGIA"; btn.setAttribute("aria-label", "Usar Magia");
    document.getElementById("game-container").appendChild(btn);
    document.getElementById("game-container").appendChild(hud);
    barC = document.getElementById("magiaBar"); barX = barC.getContext("2d");
    gemC = document.getElementById("gemCanvas"); gemX = gemC.getContext("2d");
    const fire = (e) => { e.preventDefault(); e.stopPropagation(); cast(); };
    btn.addEventListener("touchstart", fire, { passive: false });
    btn.addEventListener("mousedown", fire);
    drawHud();
  }
  // 9-slice: bordes de 4 px fijos, centro estirado. Interior útil x3–116, y3–8.
  function drawHud() {
    if (!barX) return;
    const W = 120, H = 12; barX.imageSmoothingEnabled = false; barX.clearRect(0, 0, W, H);
    const inner = 114; // 3..116
    const w = Math.round(inner * (st.magia / MAX));
    if (w > 0 && A.fill.complete) barX.drawImage(A.fill, 0, 0, 1, 6, 3, 3, w, 6);
    if (A.frame.complete) {
      const f = A.frame, b = 4, fw = f.width, fh = f.height;
      // esquinas + bordes + centro (marco del mismo tamaño que el lienzo; queda listo para otros anchos)
      barX.drawImage(f, 0, 0, b, fh, 0, 0, b, H);
      barX.drawImage(f, b, 0, fw - 2 * b, fh, b, 0, W - 2 * b, H);
      barX.drawImage(f, fw - b, 0, b, fh, W - b, 0, b, H);
    }
    gemX.imageSmoothingEnabled = false; gemX.clearRect(0, 0, 16, 24);
    st.gem = lifeGem();
    if (A.gem.complete) gemX.drawImage(A.gem, st.gem * 16, 0, 16, 24, 0, 0, 16, 24);
    const lbl = document.getElementById("gemLabel"); if (lbl && global.player) lbl.textContent = "×" + Math.max(0, player.hearts);
    const full = st.magia >= MAX && st.gem < 4;
    btn.classList.toggle("ready", full);
    hud.classList.toggle("dark", st.gem >= 4);
  }
  [A.frame, A.fill, A.gem].forEach((i) => i.addEventListener("load", drawHud));

  // La gema del alma ES la vida: limpia con vida llena, negra con la última.
  function lifeGem() {
    if (!global.player || typeof maxHearts === "undefined") return 0;
    const r = Math.max(0, player.hearts) / Math.max(1, maxHearts + (global.hasExtraHeart ? 1 : 0));
    return Math.max(0, Math.min(4, Math.round(4 * (1 - r))));
  }
  // ---------- Medidor ----------
  function add(n) {
    if (st.gem >= 4) n *= 0.25; // gema negra: casi no carga
    const before = st.magia; st.magia = Math.min(MAX, st.magia + n);
    if (before < MAX && st.magia >= MAX) { if (global.SFX) SFX.play("coin"); if (global.Haptics) Haptics.buzz("pickup"); toast("¡Magia lista! toca MAGIA"); }
    drawHud();
  }
  function onHit() { if (st.blasting || (global.bossActive || (typeof bossActive !== 'undefined' && bossActive))) return; add(2 + Math.min(10, (global.VFX ? VFX.getCombo() : 0)) * 0.2); }
  function onKill(x, y) { add(5); if (RNG() < 0.05) st.seeds.push({ x, y, t: 0 }); }
  function onDamage() { st.magia = Math.max(0, st.magia - 25); setTimeout(drawHud, 0); if (player.hearts <= 2) toast("¡uff! la gema se oscurece, busca semillas"); }

  // ---------- Combo de equipo: 3 aliadas distintas en 12 s ----------
  function onAlly(type) {
    if (!ALLIES[type]) return;
    st.lastAlly = type;
    const now = gameNow();
    st.team = st.team.filter((a) => now - a.t < 12000 && a.type !== type);
    st.team.push({ type, t: now });
    if (st.team.length >= 3) {
      st.team = [];
      add(50);
      if (global.Rogue) { Rogue.mods.shieldMax = Math.max(1, Rogue.mods.shieldMax); Rogue.mods.shield = Rogue.mods.shieldMax; }
      if (global.VFX) VFX.floatText(player.x + player.width / 2, player.y - 40, "¡combo de equipo!", "#FF8AD8", 18);
      if (global.SFX) SFX.play("achievement");
    }
  }

  // ---------- Ultimate ----------
  function cast() {
    if (!global.isGameRunning || !isGameRunning() || gamePaused) return;
    if (st.magia < MAX || st.gem >= 4) return;
    st.magia = 0; drawHud();
    st.cut = { t: 0, who: allyImg[st.lastAlly] || allyImg.xiao };
    if (global.VFX) { VFX.hitStop(120, 0.6); VFX.shake(10); }
    if (global.SFX) { SFX.play("xiao"); gSetTimeout(() => SFX.play("explosion"), 250); }
    if (global.Haptics) Haptics.buzz("damage");
    gSetTimeout(() => {
      // limpia la pantalla
      enemies.forEach((e) => global.VFX && VFX.explosion(e.x + e.width / 2, e.y + e.height / 2, 1));
      const n = enemies.length; enemies.length = 0;
      if (global.Foes) { Foes.list.slice().forEach((f) => { f.hp = 0; global.VFX && VFX.explosion(f.x + f.w / 2, f.y + f.h / 2, 1); }); const k = Foes.list.length; Foes.clear(); addPoints(10 * (n + k)); }
      else addPoints(10 * n);
      EB().length = 0;
      if (boss && !boss.dying) { st.blasting = true; for (let i = 0; i < Math.ceil(bossHealth * 0.08); i++) handleBossHit(); st.blasting = false; } // el golpe de Magia no recarga Magia
    }, 260);
  }

  // ---------- Laberinto de bruja ----------
  function EB() {
    if (typeof enemyBullets !== "undefined" && enemyBullets) {
      global.enemyBullets = enemyBullets;
      return enemyBullets;
    }
    return global.enemyBullets || (global.enemyBullets = []);
  }
  function phaseOf() { if (!boss) return 0; const r = boss.health / bossHealth; return r > 0.66 ? 1 : r > 0.33 ? 2 : 3; }
  function shootRing(cx, cy, n, sp, off, gap) {
    const bag = EB();
    for (let i = 0; i < n; i++) {
      if (gap != null && Math.abs(i - gap) < 1.5) continue;
      const a = off + (i / n) * Math.PI * 2;
      bag.push({ x: cx, y: cy, vx: Math.cos(a) * sp, speed: Math.sin(a) * sp, width: 6, height: 6, witch: true, src: st.phase === 1 ? 'jefe:espiral' : 'jefe:flor' });
    }
  }
  function updateWitch(dt, K) {
    if (!bossActive || !boss || boss.appearing || boss.dying) { st.phase = 0; return; }
    const p = phaseOf();
    if (p !== st.phase) {
      st.phase = p; st.warnT = 1000; st.patT = 0;
      toast(["", "fase 1 ¡ojo!", "fase 2: pétalos", "fase 3 ¡última!"][p], { top: true });
      if (global.SFX) SFX.play("impact");
    }
    if (st.warnT > 0) { st.warnT -= dt; return; } // 1 s de aviso sin balas
    st.patT -= dt; st.ang += 0.0025 * dt;
    const cx = boss.x + boss.width / 2, cy = boss.y + boss.height * 0.7;
    const easy = GW < 500 ? 0.8 : 1;
    if (p === 1 && st.patT <= 0) { // espiral de dos brazos
      st.patT = 400;
      for (const s of [0, Math.PI]) shootRing(cx, cy, 1, 1.8 * easy, st.ang + s);
    } else if (p === 2 && st.patT <= 0) { // flor con hueco que gira
      st.patT = 1100;
      shootRing(cx, cy, 8, 1.7 * easy, st.ang, Math.floor((st.ang * 2) % 8));
    } else if (p === 3 && st.patT <= 0) { // cortina alterna + tiro dirigido
      st.patT = 1700; st.alt = !st.alt;
      const bag = EB();
      const cols = Math.max(5, Math.floor(GW / 84)); // cortina más rala: huecos de ~2 columnas
      for (let i = 0; i < cols; i++) if ((i % 2 === 0) === st.alt) bag.push({ x: (i + 0.5) * (GW / cols), y: -6, vx: 0, speed: 2.0 * easy, width: 6, height: 10, witch: true, src: 'jefe:cortina' });
      const dx = player.x - cx, dy = player.y - cy, m = Math.hypot(dx, dy) || 1;
      if (st.alt) bag.push({ x: cx, y: cy, vx: (dx / m) * 2.6, speed: (dy / m) * 2.6, width: 6, height: 6, witch: true, src: 'jefe:dirigido' });
    }
  }
  // Fondo por fase: far + near en mosaico vertical, escala entera
  function drawBackdrop(ctx, dt) {
    if (!bossActive || !boss) return;
    const i = Math.max(0, (st.phase || 1) - 1);
    const far = A.far[i], near = A.near[i];
    if (!far.complete) return;
    const s = Math.max(1, Math.ceil(GH / 640 - 0.25)), w = 360 * s, h = 640 * s;
    st.scroll += dt * 0.02;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = st.warnT > 0 ? 0.6 + 0.4 * Math.abs(Math.sin(st.warnT / 120)) : 1;
    for (const [im, sp] of [[far, 0.5], [near, 1.3]]) {
      if (!im.complete) continue;
      const oy = Math.floor((st.scroll * sp) % h);
      for (let x = 0; x < GW; x += w) for (let y = oy - h; y < GH; y += h) ctx.drawImage(im, x, y, w, h);
    }
    ctx.restore();
  }
  // Semillas: caen, se recogen y limpian la gema
  function updateSeeds(ctx, dt, K) {
    for (let i = st.seeds.length - 1; i >= 0; i--) {
      const s = st.seeds[i]; s.t += dt; s.y += 1.2 * K;
      const px = player.x + player.width / 2, py = player.y + player.height / 2, d = Math.hypot(px - s.x, py - s.y);
      const mag = (global.Rogue ? Rogue.mods.magnet : 0) + 40;
      if (d < mag) { s.x += ((px - s.x) / d) * 4 * K; s.y += ((py - s.y) / d) * 4 * K; }
      ctx.imageSmoothingEnabled = false;
      if (A.seed.complete) ctx.drawImage(A.seed, Math.floor(s.t / 300) % 2 ? 16 : 0, 0, 16, 16, Math.round(s.x - 8), Math.round(s.y - 8), 16, 16);
      if (d < 26) { st.seeds.splice(i, 1); add(10); drawHud(); if (global.SFX) SFX.play("heal"); continue; }
      if (s.y > GH + 20) st.seeds.splice(i, 1);
    }
  }
  function drawCut(ctx, dt) {
    if (!st.cut) return;
    const c = st.cut; c.t += dt; const T = 650;
    if (c.t > T) { st.cut = null; return; }
    const k = c.t / T, bandH = Math.min(140, GH * 0.24), y = GH * 0.38;
    ctx.save();
    ctx.fillStyle = "rgba(255,138,216,0.92)"; ctx.fillRect(0, y, GW, bandH);
    ctx.fillStyle = "#0B0F1E"; ctx.fillRect(0, y - 3, GW, 3); ctx.fillRect(0, y + bandH, GW, 3);
    const sz = Math.round(bandH * 1.1), x = Math.round(-sz + (GW + sz) * (k < 0.5 ? k * 1.2 : 0.6 + (k - 0.5) * 0.8));
    if (c.who.complete) { ctx.imageSmoothingEnabled = true; ctx.drawImage(c.who, x, y + bandH - sz, sz, sz); }
    ctx.fillStyle = "#0B0F1E"; ctx.font = `900 ${Math.round(bandH * 0.32)}px Orbitron, sans-serif`; ctx.textAlign = "right";
    ctx.fillText("MAGIA", GW - 16, y + bandH * 0.62);
    if (c.t < 90) { ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fillRect(0, 0, GW, GH); }
    ctx.restore();
  }
  function update(ctx, dt, K) { if (!K) { drawCut(ctx, 0); return; } updateWitch(dt, K); if (typeof bossActive !== "undefined" && bossActive && boss && !boss.appearing && st.magia < MAX) add(dt * 100 / 15000); /* contra el jefe la Magia carga con el tiempo (1 cada 15 s), no por impacto */ updateSeeds(ctx, dt, K); drawCut(ctx, dt); }

  function toast(text, opts) { if (global.showMiniToast) showMiniToast(text, 1600, opts); }
  function reset() { st.magia = 0; st.gem = 0; st.seeds = []; st.team = []; st.phase = 0; st.cut = null; drawHud(); }

  global.Magia = { drawHud, add, onHit, onKill, onDamage, onAlly, cast, update, drawBackdrop, reset, state: st };
  document.addEventListener("DOMContentLoaded", buildHud);
  document.addEventListener("keydown", (e) => { if (e.code === "KeyX" || e.code === "KeyM") { if (document.activeElement && document.activeElement.tagName === "INPUT") return; cast(); } });
})(window);
