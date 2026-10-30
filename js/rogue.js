/**
 * Space War — Capa roguelike: partida con semilla, mejoras 1 de 3 entre niveles
 * (con rareza y acumulación), muerte permanente por partida y resumen final.
 */
(function (global) {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const nativeRandom = Math.random.bind(Math);
  const RAR = { comun: { w: 70, k: 1, label: "Común" }, rara: { w: 25, k: 1.6, label: "Rara" }, epica: { w: 5, k: 2.4, label: "Épica" } };

  // Cada mejora: id, nombre, icono, max stacks, apply(k)
  const UPG = [
    { id: "rate", type: "impulso", name: "Cadencia", max: 6, desc: (k) => `Disparas ${Math.round(12 * k)}% más rápido`, apply: (k) => (M.fireRate *= 1 - 0.12 * k) },
    { id: "spread", type: "rafaga", name: "Disparo en abanico", max: 3, desc: () => "+2 balas en diagonal", apply: () => (M.spread += 1) },
    { id: "pierce", type: "rafaga", name: "Perforante", max: 3, desc: (k) => (k >= 2 ? "Las balas atraviesan 2 enemigos más" : "Las balas atraviesan 1 enemigo más"), apply: (k) => (M.pierce += k >= 2 ? 2 : 1) },
    { id: "speed", type: "impulso", name: "Propulsores", max: 4, desc: (k) => `+${Math.round(12 * k)}% velocidad`, apply: (k) => (M.speed *= 1 + 0.12 * k) },
    { id: "hp", type: "carga", name: "Casco reforzado", max: 3, desc: () => "+1 gema y te cura", apply: () => { maxHearts++; player.hearts = maxHearts; updateHeartsDisplay(); } },
    { id: "magnet", type: "carga", name: "Imán", max: 3, desc: (k) => `Atrae power-ups (radio +${Math.round(90 * k)} px)`, apply: (k) => (M.magnet += 90 * k) },
    { id: "shield", type: "carga", name: "Escudo regenerable", max: 3, desc: (k) => `Escudo que bloquea 1 golpe; se recarga cada ${Math.round(22 / k)} s`, apply: (k) => { M.shieldMax += 1; M.shieldRegen = Math.min(M.shieldRegen, 22000 / k); M.shield = M.shieldMax; } },
    { id: "dmg", type: "rafaga", name: "Núcleo de plasma", max: 3, desc: () => "Balas hacen +1 de daño", apply: () => (M.dmg += 1) },
  ];
  const TYPES = {
    impulso: { label: "Impulso", bonus: "¡combo Impulso! más rápida en todo", apply: () => { M.fireRate *= 0.75; M.speed *= 1.15; } },
    rafaga: { label: "Ráfaga", bonus: "¡combo Ráfaga! pegas más duro", apply: () => { M.dmg += 1; M.pierce += 1; } },
    carga: { label: "Carga", bonus: "¡combo Carga! escudo y vida llena", apply: () => { M.shieldMax += 1; M.shield = M.shieldMax; M.shieldRegen = Math.min(M.shieldRegen, 20000); player.hearts = maxHearts; updateHeartsDisplay(); } },
  };
  let M;
  function resetMods() { M = { fireRate: 1, spread: 0, pierce: 0, speed: 1, magnet: 0, shield: 0, shieldMax: 0, shieldRegen: Infinity, shieldT: 0, dmg: 1 }; }
  resetMods();

  const Rogue = {
    get mods() { return M; },
    seed: 0, kills: 0, typeCount: {}, bonuses: [], picks: [], stacks: {}, startedAt: 0, nextLevelAt: 100, choosing: false,
    levelMinTime: (lvl) => (lvl <= 3 ? lvl * 40000 : 120000 + (lvl - 3) * 55000), // ms de juego mínimos para pasar del nivel lvl
    levelStep: (lvl) => Math.round(100 * Math.pow(1.25, lvl - 1)), // curva geométrica: el puntaje crece con los multiplicadores
    newRun() {
      const q = new URLSearchParams(location.search).get("seed");
      this.seed = global.__simSeed != null ? global.__simSeed >>> 0 : q ? parseInt(q, 10) >>> 0 : (nativeRandom() * 1e9) >>> 0;
      seedRNG(this.seed); // RNG propio de gameplay: misma semilla = misma partida (Math.random queda para efectos)
      resetMods(); this.kills = 0; this.picks = []; this.stacks = {}; this.typeCount = {}; this.bonuses = []; this.startedAt = gameNow();
      this.nextLevelAt = this.levelStep(1); this.choosing = false; this._rookieT = 0; M.shield = 1; // escudo de novata
      maxHearts = 3;
      const el = document.getElementById("upgradePanel"); if (el) el.classList.remove("show");
    },
    extraBullets(x, y) {
      for (let i = 1; i <= M.spread; i++)
        for (const s of [-1, 1]) bullets.push({ x, y, speed: 10, vx: s * i * 1.6, pierce: M.pierce, dmg: M.dmg });
      const main = bullets[bullets.length - 1 - M.spread * 2]; if (main) main.dmg = M.dmg;
    },
    absorbHit() {
      if (M.shield > 0) {
        M.shield--; M.shieldT = 0;
        if (global.VFX) { VFX.hitSpark(player.x + player.width / 2, player.y); VFX.shake(3); }
        if (global.SFX) SFX.play("shield");
        return true;
      }
      return false;
    },
    update(dtMs, K) {
      if (!K) return;
      if (gameNow() < 150000) { this._rookieT = (this._rookieT || 0) + dtMs; if (M.shield < 1 && this._rookieT > 15000) { M.shield = 1; this._rookieT = 0; } }
      if (M.shieldMax > 0 && M.shield < M.shieldMax) { M.shieldT += dtMs; if (M.shieldT >= M.shieldRegen) { M.shield++; M.shieldT = 0; } }
      if (M.magnet > 0) {
        const px = player.x + player.width / 2, py = player.y + player.height / 2;
        [kits, xiaos, arlees, cynos, flins, rerirs].forEach((arr) => arr && arr.forEach((o) => {
          const dx = px - (o.x + (o.width || 40) / 2), dy = py - (o.y + (o.height || 40) / 2), d = Math.hypot(dx, dy);
          if (d < M.magnet && d > 1) { o.x += (dx / d) * 5 * K; o.y += (dy / d) * 5 * K; }
        }));
      }
    },
    drawShield(ctx) {
      if (M.shield <= 0) return;
      ctx.save(); ctx.strokeStyle = "rgba(63,224,240,0.8)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.8, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    },
    roll() {
      const avail = UPG.filter((u) => (this.stacks[u.id] || 0) < u.max);
      const out = [];
      while (out.length < 3 && avail.length) {
        const u = avail.splice(Math.floor(RNG() * avail.length), 1)[0];
        let r = RNG() * 100, rar = "comun";
        for (const k in RAR) { r -= RAR[k].w; if (r <= 0) { rar = k; break; } }
        out.push({ u, rar });
      }
      return out;
    },
    offerUpgrades(lvl) {
      if (this.choosing) return;
      const opts = this.roll(); if (!opts.length) return;
      this.choosing = true; player.shooting = false;
      document.body.classList.add("choosing"); if (global.VFX && VFX.clearBanner) VFX.clearBanner();
      if (global.setPaused) setPaused(true, true);
      const el = document.getElementById("upgradePanel");
      el.querySelector(".up-title").textContent = `Nivel: ${level} · escoge una`;
      const box = el.querySelector(".up-cards"); box.innerHTML = "";
      opts.forEach((o, i) => {
        const b = document.createElement("button"); b.type = "button"; b.className = `up-card r-${o.rar}`;
        const st = this.stacks[o.u.id] || 0;
        b.innerHTML = `<span class="up-key">${i + 1}</span><span class="up-icon ti-${o.u.type}"></span><i class="up-type t-${o.u.type}">${TYPES[o.u.type].label} ${(this.typeCount[o.u.type] || 0) % 3 + 1}/3</i><b>${o.u.name}</b><small>${o.u.desc(RAR[o.rar].k)}</small><em>${o.rar !== "comun" ? '<span class="star-px" aria-hidden="true"></span> ' : ""}${RAR[o.rar].label}${st ? " · x" + (st + 1) : ""}</em>`;
        b.onclick = () => this.pick(o);
        box.appendChild(b);
      });
      this._keys = (e) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= opts.length) { e.preventDefault(); this.pick(opts[n - 1]); } };
      document.addEventListener("keydown", this._keys);
      el.classList.add("show");
      if (global.SIM_MODE) { this.pick(opts[Math.floor(RNG() * opts.length)]); return; }
      setTimeout(() => { const f = box.querySelector("button"); if (f) f.focus(); }, 50);
    },
    pick(o) {
      if (!this.choosing) return;
      o.u.apply(RAR[o.rar].k);
      this.stacks[o.u.id] = (this.stacks[o.u.id] || 0) + 1;
      this.picks.push(`${o.u.name} (${RAR[o.rar].label})`);
      // 3 cartas del mismo tipo = bono de tipo (se repite cada 3)
      const tc = (this.typeCount[o.u.type] = (this.typeCount[o.u.type] || 0) + 1);
      if (tc % 3 === 0) {
        TYPES[o.u.type].apply(); this.bonuses.push(TYPES[o.u.type].label);
        if (global.VFX) VFX.floatText(player.x + player.width / 2, player.y - 30, TYPES[o.u.type].bonus, "#FFC94A", 16);
        if (global.SFX) SFX.play("achievement");
      }
      if (global.SFX) SFX.play("powerup"); if (global.Haptics) Haptics.buzz("pickup");
      document.removeEventListener("keydown", this._keys);
      document.getElementById("upgradePanel").classList.remove("show");
      this.choosing = false;
      document.body.classList.remove("choosing");
      if (global.setPaused) setPaused(false);
    },
    showSummary(target) {
      const secs = Math.round((gameNow() - this.startedAt) / 1000);
      const best = Math.max(score, SafeStore.num("sw_bestRun", 0, 0, 1e12));
      localStorage.setItem("sw_bestRun", best);
      const html = `<div class="run-summary"><h3>${score >= best ? '¡récord nuevo! <span class="star-px star-lg" aria-hidden="true"></span>' : "¡uff, por poco! otra vez, tú puedes"}</h3>
        <dl><dt>Puntaje</dt><dd>${score}</dd><dt>Nivel</dt><dd>${level}</dd><dt>Bajas</dt><dd>${this.kills}</dd>
        <dt>Tiempo</dt><dd>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}</dd><dt>Mejor</dt><dd>${best}</dd><dt>Combo máx.</dt><dd>${global.VFX && VFX.getComboMax ? VFX.getComboMax() : "-"}</dd><dt>Semilla</dt><dd>${this.seed}</dd></dl>
        <p>${this.bonuses.length ? "Combos de tipo: " + this.bonuses.join(", ") + "<br>" : ""}${this.picks.length ? this.picks.join(" · ") : "sin cartas esta vez"}</p></div>`;
      let s = target.querySelector(".run-summary"); if (s) s.remove();
      target.insertAdjacentHTML("afterbegin", html);
    },
  };
  global.Rogue = Rogue;
  document.addEventListener("DOMContentLoaded", () => {
    const el = document.createElement("div"); el.id = "upgradePanel";
    el.innerHTML = '<div class="up-wrap"><h2 class="up-title"></h2><div class="up-cards"></div></div>';
    document.body.appendChild(el);
  });
})(window);
