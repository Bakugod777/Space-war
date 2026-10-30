/**
 * Space War — Mini-jefes + roster de jefes.
 *
 * API pública (window.Bosses):
 *   trySpawnForLevel(lvl) · updateMini · enhanceBossAttack · drawBossSprite
 *   isBlocking · isMini · reset
 *
 * Roster: Paimon (10) · Walpurgia (20) · Laberinto (30)
 * Minis: niveles 4, 7, 13, 16, 22, 25
 */
(function (global) {
  const sheet = new Image();
  sheet.src = "assets/bosses-sheet.png";
  const paimonSheet = new Image();
  paimonSheet.src = "assets/paimon-sheet.png";
  const PAIMON = {
    FRAME: 128, // cada cuadro del sheet
    // 0 idle · 1 bob · 2 cast · 3 mad
    IDLE: 0, BOB: 1, CAST: 2, MAD: 3,
  };

  /** Jefes principales por nivel */
  const ROSTER = {
    10: {
      id: "paimon",
      name: "Paimon · Guía de Emergencia",
      frame: 0,
      hpMul: 1,
      color: "#4EDAD2",
      toast: "¡Paimon está enojada! (y tiene hambre)",
    },
    20: {
      id: "walpurgia",
      name: "Walpurgia · Carnaval de Pétalos",
      frame: 1,
      hpMul: 1.35,
      color: "#FF8AD8",
      toast: "¡el carnaval de la bruja!",
    },
    30: {
      id: "labyrinth",
      name: "Señor del Laberinto",
      frame: 2,
      hpMul: 1.7,
      color: "#FF4D7A",
      toast: "¡el corazón del laberinto!",
    },
  };

  /** Mini-jefes mid-run */
  const MINIS = [
    { lvl: 4, id: "fam_mayor", name: "Familiar Mayor", hp: 28, color: "#FF8AD8", kind: "swarm" },
    { lvl: 7, id: "cinta_madre", name: "Cinta Madre", hp: 36, color: "#7EC8FF", kind: "ribbon" },
    { lvl: 13, id: "semilla_negra", name: "Semilla Negra", hp: 48, color: "#C9A0FF", kind: "grief" },
    { lvl: 16, id: "bruja_umbral", name: "Bruja del Umbral", hp: 56, color: "#FF4D7A", kind: "witch" },
    { lvl: 22, id: "hex_trono", name: "Hex del Trono", hp: 64, color: "#FFD54F", kind: "hex" },
    { lvl: 25, id: "cazadora", name: "Cazadora Rosa", hp: 72, color: "#FF6BCB", kind: "hunt" },
  ];

  let mini = null;
  let spawned = Object.create(null); // level → true (una vez por run)

  function reset() {
    mini = null;
    spawned = Object.create(null);
  }

  function bang(vol) {
    if (global.SFX) SFX.play("impact", vol || 0.4);
  }

  function EB() {
    // Preferir el array vivo del juego y re-sincronizar window (evita balas huérfanas)
    if (typeof enemyBullets !== "undefined" && enemyBullets) {
      global.enemyBullets = enemyBullets;
      return enemyBullets;
    }
    if (!global.enemyBullets) global.enemyBullets = [];
    return global.enemyBullets;
  }

  function clearEB() {
    if (typeof enemyBullets !== "undefined") {
      enemyBullets = [];
      global.enemyBullets = enemyBullets;
    } else {
      global.enemyBullets = [];
    }
  }

  function fireRing(x, y, n, sp, witch) {
    const mul = global.Diff ? Diff.bulletMul() : 1;
    const bag = EB();
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.PI / 2;
      bag.push({
        x: x - 3, y: y,
        vx: Math.cos(a) * sp * mul,
        speed: Math.sin(a) * sp * mul,
        width: witch ? 8 : 6, height: witch ? 8 : 12,
        witch: !!witch,
        src: "bala mini-jefe",
      });
    }
    bang(0.35);
  }

  function fireAimed(x, y, sp, src) {
    const px = player.x + player.width / 2, py = player.y + player.height / 2;
    const dx = px - x, dy = Math.max(48, py - y), m = Math.hypot(dx, dy) || 1;
    const mul = global.Diff ? Diff.bulletMul() : 1;
    const s = sp * mul;
    EB().push({
      x: x - 3, y: y,
      vx: (dx / m) * s, speed: (dy / m) * s,
      width: 6, height: 12, src: src || "bala mini-jefe",
    });
    bang(0.3);
  }

  function fireFan(x, y, count, spread, sp) {
    const mul = global.Diff ? Diff.bulletMul() : 1;
    const bag = EB();
    for (let i = 0; i < count; i++) {
      const a = Math.PI / 2 + (i - (count - 1) / 2) * spread;
      bag.push({
        x: x - 3, y: y,
        vx: Math.cos(a) * sp * mul,
        speed: Math.sin(a) * sp * mul,
        width: 6, height: 12, src: "bala mini-jefe",
      });
    }
    bang(0.3);
  }

  function showBar(name, color) {
    if (typeof bossBar === "undefined") return;
    const nameEl = document.getElementById("bossName");
    const fill = document.getElementById("bossHealthFill");
    if (nameEl) nameEl.textContent = name;
    if (fill) fill.style.background = color || "#FF8AD8";
    bossBar.style.display = "block";
    if (typeof placeBossBar === "function") placeBossBar();
  }

  function hideBar() {
    if (typeof bossBar !== "undefined") bossBar.style.display = "none";
  }

  function updateMiniBar() {
    if (!mini) return;
    const fill = document.getElementById("bossHealthFill");
    if (fill) fill.style.width = Math.max(0, (mini.hp / mini.maxHp) * 100) + "%";
  }

  function spawnMini(def) {
    if (mini || (typeof bossActive !== "undefined" && bossActive)) return false;
    // limpiar presión normal
    if (typeof Foes !== "undefined") Foes.clear();
    enemies = [];
    clearEB();
    const scale = 1 + Math.min(0.6, Math.max(0, level - def.lvl) * 0.04);
    const hp = Math.round(def.hp * scale * (global.Diff ? 1 + Diff.pressure() * 0.08 : 1));
    mini = {
      id: def.id,
      kind: def.kind,
      name: def.name,
      color: def.color,
      x: GW / 2 - 40,
      y: 48,
      w: 80,
      h: 64,
      hp,
      maxHp: hp,
      t: 0,
      fireT: 900,
      phase: 0,
      state: "enter",
      flash: 0,
      vx: 1.4 * (RNG() < 0.5 ? -1 : 1),
    };
    showBar("MINI · " + def.name, def.color);
    updateMiniBar();
    if (typeof showMiniToast === "function") showMiniToast("¡mini-jefe! " + def.name, 2200);
    if (global.VFX) {
      VFX.shake(8);
      VFX.floatText(GW / 2, 90, def.name, def.color, 22);
    }
    if (global.SFX) {
      SFX.play("achievement", 0.5);
      if (SFX.startBossMusic) SFX.startBossMusic();
    }
    return true;
  }

  function trySpawnForLevel(lvl) {
    if (spawned[lvl]) return false;
    // jefe principal
    if (ROSTER[lvl]) {
      spawned[lvl] = true;
      return spawnMain(ROSTER[lvl]);
    }
    const def = MINIS.find((m) => m.lvl === lvl);
    if (def) {
      spawned[lvl] = true;
      return spawnMini(def);
    }
    return false;
  }

  function spawnMain(def) {
    // reutiliza spawnBoss del juego, luego personaliza
    if (typeof spawnBoss !== "function") return false;
    if (typeof bossActive !== "undefined" && bossActive) return false;
    spawnBoss();
    if (!boss) return false;
    boss.rosterId = def.id;
    boss.rosterFrame = def.frame;
    boss.rosterColor = def.color;
    boss.phase = 1;
    boss.patternT = 0;
    boss.spiral = 0;
    boss.animT = 0;
    boss.castUntil = 0;
    boss.moveDir = RNG() < 0.5 ? -1 : 1;
    if (def.id === "paimon") {
      // Hitbox cuadrada chibi (el sheet es 128×128)
      boss.width = 128;
      boss.height = 128;
      boss.x = GW / 2 - 64;
      boss.y = typeof bossTopY === "function" ? bossTopY() : 48;
      boss.paimon = true;
      boss.baseY = boss.y;
    }
    const nameEl = document.getElementById("bossName");
    if (nameEl) nameEl.textContent = def.name;
    const fill = document.getElementById("bossHealthFill");
    if (fill) fill.style.background = def.color;
    // vida según roster
    const extra = Math.round(bossHealth * (def.hpMul - 1));
    bossHealth += extra;
    boss.health += extra;
    if (typeof updateBossBar === "function") updateBossBar();
    if (typeof showMiniToast === "function") showMiniToast(def.toast, 2400);
    if (global.VFX) VFX.floatText(GW / 2, 100, def.name, def.color, 20);
    return true;
  }

  /** Estrella teal de Paimon (comida de emergencia / magia) */
  function firePaimonStar(x, y, ang, sp) {
    const mul = global.Diff ? Diff.bulletMul() : 1;
    const s = sp * mul;
    EB().push({
      x: x - 4, y: y - 4,
      vx: Math.cos(ang) * s,
      speed: Math.sin(ang) * s,
      width: 8, height: 8,
      witch: true,
      src: "jefe:paimon",
      paimonStar: true,
    });
  }

  function paimonAnimFrame() {
    if (!boss) return PAIMON.IDLE;
    const now = gameNow();
    if (boss.phase >= 3) return PAIMON.MAD;
    if (now < (boss.castUntil || 0)) return PAIMON.CAST;
    return (Math.floor((boss.animT || 0) / 280) % 2 === 0) ? PAIMON.IDLE : PAIMON.BOB;
  }

  function updatePaimon(dt) {
    if (!boss || !boss.paimon || boss.appearing || boss.dying) return;
    boss.animT = (boss.animT || 0) + dt;
    // Flota + paseo lateral suave
    const bob = Math.sin(boss.animT / 280) * 8;
    boss.y = (boss.baseY || 48) + bob;
    const speed = 1.1 + (boss.phase || 1) * 0.35;
    boss.x += (boss.moveDir || 1) * speed * (typeof FK !== "undefined" ? FK : 1);
    if (boss.x < 8) { boss.x = 8; boss.moveDir = 1; }
    if (boss.x + boss.width > GW - 8) { boss.x = GW - boss.width - 8; boss.moveDir = -1; }
  }

  function attackPaimon(phase, now, bx, by) {
    // Telegráfo: pose de cast ~280 ms antes de soltar
    const wind = 280;
    if (now - (boss._starAt || 0) > (phase === 3 ? 850 : phase === 2 ? 1200 : 1600)) {
      boss.castUntil = now + wind;
      boss._starAt = now;
      boss._pendingStar = true;
    }
    if (boss._pendingStar && now >= (boss.castUntil || 0)) {
      boss._pendingStar = false;
      const n = 3 + phase;
      for (let i = 0; i < n; i++) {
        const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.32;
        firePaimonStar(bx, by, a, 3.1 + phase * 0.2);
      }
      bang(0.4);
      if (global.VFX) VFX.floatText(bx, by - 20, "¡estrellitas!", "#4EDAD2", 14);
    }

    if (phase >= 2 && now - (boss._foodAt || 0) > (phase === 3 ? 1400 : 2000)) {
      boss.castUntil = now + wind;
      boss._foodAt = now;
      // Anillo de “bocadillos”
      const n = phase === 3 ? 12 : 8;
      for (let i = 0; i < n; i++) {
        firePaimonStar(bx, by, (Math.PI * 2 * i) / n + Math.PI / 2, 2.6);
      }
      fireAimed(bx, by, 3.9, "jefe:paimon");
      bang(0.45);
      if (typeof showMiniToast === "function" && phase === 2) {
        showMiniToast("¡comida de emergencia!", 1200);
      }
    }

    if (phase >= 3 && now - (boss._rageAt || 0) > 2400) {
      boss.castUntil = now + 400;
      boss._rageAt = now;
      // Lluvia: tres columnas + abanico
      [-60, 0, 60].forEach((ox) => {
        firePaimonStar(bx + ox, by, Math.PI / 2, 4.0);
        firePaimonStar(bx + ox, by, Math.PI / 2 + 0.15, 3.6);
      });
      fireFan(bx, by, 7, 0.2, 3.5);
      // Cambio de dirección brusco (dash)
      boss.moveDir = player.x + player.width / 2 < bx ? -1 : 1;
      bang(0.55);
      if (global.VFX) {
        VFX.shake(5);
        VFX.floatText(bx, by - 28, "¡MODO EMERGENCIA!", "#FF4D7A", 16);
      }
    }
  }

  function hitMini(dmg) {
    if (!mini) return;
    mini.hp -= dmg || 1;
    mini.flash = 4;
    updateMiniBar();
    if (global.VFX) {
      VFX.hitSpark(mini.x + mini.w / 2, mini.y + mini.h / 2);
      VFX.shake(3);
    }
    if (mini.hp <= 0) killMini();
  }

  function killMini() {
    if (!mini) return;
    const cx = mini.x + mini.w / 2, cy = mini.y + mini.h / 2;
    const name = mini.name;
    const pts = 80 + Math.floor(mini.maxHp);
    if (global.VFX) {
      for (let i = 0; i < 8; i++) {
        gSetTimeout(() => VFX.explosion(cx + Math.cos(i) * 40, cy + Math.sin(i) * 30, 1.2), i * 60);
      }
      VFX.floatText(cx, cy, "¡mini-jefe caído!", "#FFD54F", 20);
      VFX.shake(12);
    }
    if (global.SFX) {
      SFX.play("explosion", 1);
      if (SFX.stopBossMusic) SFX.stopBossMusic(true);
    }
    addPoints(pts);
    if (typeof Magia !== "undefined") Magia.onKill(cx, cy);
    // premio pequeño + botín
    player.hearts = Math.min(
      maxHearts + (hasExtraHeart ? 1 : 0),
      player.hearts + 1
    );
    if (typeof updateHeartsDisplay === "function") updateHeartsDisplay();
    if (typeof dropBossLoot === "function") dropBossLoot(cx, cy, "mini");
    if (typeof showMiniToast === "function") showMiniToast(name + " derrotado · +1 gema · botín", 2000);
    try {
      playerStats.bossesKilled = (playerStats.bossesKilled || 0); // mini no cuenta como boss full
      playerStats.miniBossesKilled = (playerStats.miniBossesKilled || 0) + 1;
    } catch (e) {}
    mini = null;
    hideBar();
    clearEB();
  }

  function drawMini(ctx) {
    if (!mini) return;
    const m = mini;
    ctx.save();
    // silueta procedural según kind
    const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
    if (m.flash > 0) { ctx.globalAlpha = 0.55 + 0.45 * Math.sin(m.t / 30); m.flash -= 0.2; }
    // cuerpo
    ctx.fillStyle = m.color;
    ctx.beginPath();
    if (m.kind === "swarm" || m.kind === "witch" || m.kind === "hunt") {
      ctx.ellipse(cx, cy, m.w * 0.38, m.h * 0.42, 0, 0, Math.PI * 2);
    } else if (m.kind === "ribbon" || m.kind === "grief") {
      ctx.moveTo(cx, m.y + 6);
      ctx.lineTo(m.x + m.w - 8, cy);
      ctx.lineTo(cx, m.y + m.h - 6);
      ctx.lineTo(m.x + 8, cy);
      ctx.closePath();
    } else {
      // hex
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + Math.cos(a) * m.w * 0.4;
        const y = cy + Math.sin(a) * m.h * 0.4;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, m.w * 0.14, m.h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    // corona mini
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(m.x + 4, m.y + 4, m.w - 8, m.h - 8);
    ctx.restore();
  }

  function updateMini(ctx, dt, K) {
    if (!mini) return;
    const m = mini;
    m.t += dt;
    if (m.state === "enter") {
      m.y += 1.6 * K;
      if (m.y >= 56) m.state = "fight";
    } else {
      m.x += m.vx * K;
      if (m.x < 8 || m.x + m.w > GW - 8) m.vx *= -1;
      m.y = 56 + Math.sin(m.t / 400) * 10;
    }

    m.fireT -= dt;
    const pct = m.hp / m.maxHp;
    const angry = pct < 0.45;

    if (m.fireT <= 0 && m.state === "fight") {
      const bx = m.x + m.w / 2, by = m.y + m.h;
      if (m.kind === "swarm") {
        fireFan(bx, by, angry ? 5 : 3, 0.28, 3.2);
        m.fireT = angry ? 700 : 1100;
        // invoca familiares
        if (global.Foes && RNG() < 0.45) {
          Foes._spawn("familiar");
          const last = Foes.list[Foes.list.length - 1];
          if (last) { last.x = bx - 14; last.y = by; }
        }
      } else if (m.kind === "ribbon") {
        fireFan(bx, by, 4, 0.35, 3.4);
        fireAimed(bx, by, 3.8);
        m.fireT = angry ? 650 : 1000;
      } else if (m.kind === "grief") {
        fireRing(bx, by, angry ? 10 : 7, 3.0, true);
        m.fireT = angry ? 900 : 1400;
      } else if (m.kind === "witch") {
        fireRing(bx, by, 8, 2.8, true);
        fireAimed(bx - 20, by, 4.0);
        fireAimed(bx + 20, by, 4.0);
        m.fireT = angry ? 750 : 1200;
      } else if (m.kind === "hex") {
        fireRing(bx, by, 6, 3.3, false);
        fireFan(bx, by, 3, 0.4, 3.6);
        m.fireT = angry ? 700 : 1100;
      } else if (m.kind === "hunt") {
        fireAimed(bx, by, 4.4);
        fireAimed(bx, by, 3.6);
        fireFan(bx, by, angry ? 5 : 3, 0.22, 3.5);
        m.fireT = angry ? 550 : 850;
      } else {
        fireFan(bx, by, 3, 0.3, 3.2);
        m.fireT = 1000;
      }
    }

    drawMini(ctx);

    // colisión balas jugador
    for (let b = bullets.length - 1; b >= 0; b--) {
      const u = bullets[b];
      if (u.x < m.x + m.w && u.x + 5 > m.x && u.y < m.y + m.h && u.y + 12 > m.y) {
        if (u.pierce > 0) { u.pierce--; } else bullets.splice(b, 1);
        hitMini(u.dmg || 1);
        if (!mini) break;
      }
    }
    // choque
    if (mini && m.x < player.x + player.width && m.x + m.w > player.x &&
        m.y < player.y + player.height && m.y + m.h > player.y) {
      handlePlayerDamage("choque mini-jefe");
    }
  }

  /** Patrones de jefe principal según roster + fase de vida */
  function enhanceBossAttack() {
    if (!boss || boss.appearing || boss.dying) return;
    const id = boss.rosterId || "paimon";
    const pct = boss.health / Math.max(1, bossHealth);
    const phase = pct > 0.66 ? 1 : pct > 0.33 ? 2 : 3;
    if (boss.phase !== phase) {
      boss.phase = phase;
      const tip =
        id === "paimon"
          ? (phase === 2 ? "¡Paimon saca las estrellas!" : phase === 3 ? "¡modo emergencia!" : "fase 1")
          : ("fase " + phase + " ¡ojo!");
      if (typeof showMiniToast === "function") showMiniToast(tip, 1600);
      if (global.VFX) VFX.shake(6);
    }
    boss.patternT = (boss.patternT || 0) + 16;
    boss.spiral = (boss.spiral || 0) + 0.12;

    const bx = boss.x + boss.width / 2;
    const by = boss.y + boss.height * 0.85;
    const now = gameNow();
    const dt = 16;

    if (id === "paimon") {
      updatePaimon(dt);
      attackPaimon(phase, now, bx, by);
      return;
    }

    // Walpurgia: pétalos densos
    if (id === "walpurgia") {
      if (now - (boss._petalAt || 0) > (phase === 3 ? 700 : 1100)) {
        fireRing(bx, by, 6 + phase * 2, 2.9, true);
        fireFan(bx, by, 5, 0.25, 3.2);
        boss._petalAt = now;
      }
      if (phase >= 2 && now - (boss._aimAt || 0) > 1600) {
        fireAimed(bx - 40, by, 4.2, "jefe:pétalo");
        fireAimed(bx + 40, by, 4.2, "jefe:pétalo");
        boss._aimAt = now;
      }
    }

    // Labyrinth: espiral + caza
    if (id === "labyrinth") {
      if (now - (boss._spiralAt || 0) > 180) {
        const a = boss.spiral;
        const mul = global.Diff ? Diff.bulletMul() : 1;
        const sp = 3.4 * mul;
        EB().push({
          x: bx - 3, y: by,
          vx: Math.cos(a) * sp, speed: Math.sin(a) * sp + 1.2,
          width: 7, height: 7, witch: true, src: "jefe:laberinto",
        });
        EB().push({
          x: bx - 3, y: by,
          vx: Math.cos(a + Math.PI) * sp, speed: Math.sin(a + Math.PI) * sp + 1.2,
          width: 7, height: 7, witch: true, src: "jefe:laberinto",
        });
        boss._spiralAt = now;
      }
      if (now - (boss._huntAt || 0) > (phase === 3 ? 900 : 1400)) {
        fireAimed(bx, by, 4.6, "jefe:laberinto");
        if (phase >= 2) fireFan(bx, by, 7, 0.2, 3.5);
        boss._huntAt = now;
      }
    }
  }

  function drawBossSprite(ctx) {
    if (!boss || typeof boss.rosterFrame !== "number") return false;
    ctx.save();
    let scale = 1, opacity = 1;
    if (boss.appearing) {
      boss.appearAnim += 0.04;
      scale = Math.min(1, boss.appearAnim);
      opacity = Math.min(1, boss.appearAnim);
      if (scale >= 1) boss.appearing = false;
    }
    if (boss.damageAnim > 0) {
      opacity = 0.5 + 0.5 * Math.sin(boss.damageAnim * 20);
      boss.damageAnim -= 0.08;
      if (boss.damageAnim < 0) boss.damageAnim = 0;
    }
    if (boss.dying) {
      scale = 1 + boss.dying * 0.5;
      opacity = 1 - boss.dying;
      boss.dying += 0.04;
      if (boss.dying > 1) {
        bossActive = false;
        hideBar();
        boss = null;
        ctx.restore();
        return true;
      }
    }

    // —— Paimon: sheet propio animado ——
    if (boss.paimon && paimonSheet.complete && paimonSheet.naturalWidth >= PAIMON.FRAME) {
      if (!boss.dying && !boss.appearing) {
        // movimiento lo hace updatePaimon; aquí solo dibuja
      }
      const fr = paimonAnimFrame();
      const F = PAIMON.FRAME;
      ctx.globalAlpha = opacity;
      ctx.imageSmoothingEnabled = false;
      ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2);
      ctx.scale(scale, scale);
      // aura suave en fase 3
      if (boss.phase >= 3) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,77,122,0.18)";
        ctx.ellipse(0, 8, 70, 58, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.drawImage(paimonSheet, fr * F, 0, F, F, -F / 2, -F / 2, F, F);
      ctx.restore();
      return true;
    }

    // —— Otros jefes: bosses-sheet ——
    if (!sheet.complete || sheet.naturalWidth < 256) { ctx.restore(); return false; }
    if (!boss.dying && !boss.appearing) {
      boss.x += Math.sin(gameNow() / 600) * 2 * (typeof FK !== "undefined" ? FK : 1);
      if (boss.x < 0) boss.x = 0;
      if (boss.x + boss.width > GW) boss.x = GW - boss.width;
    }
    const fr = boss.rosterFrame;
    ctx.globalAlpha = opacity;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2);
    ctx.scale(scale, scale);
    ctx.drawImage(sheet, fr * 256, 0, 256, 128, -boss.width / 2, -boss.height / 2, boss.width, boss.height);
    ctx.restore();
    return true;
  }

  function isBlocking() {
    return !!mini || (typeof bossActive !== "undefined" && bossActive);
  }

  global.Bosses = {
    reset,
    trySpawnForLevel,
    updateMini,
    hitMini,
    enhanceBossAttack,
    drawBossSprite,
    isBlocking,
    isMini: () => !!mini,
    get mini() { return mini; },
    roster: ROSTER,
    minis: MINIS,
  };
})(window);
