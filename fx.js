/**
 * Space War — Visual Effects Engine (canvas)
 * Parallax stars, nebulae, particles, shake, combo, banners.
 */
(function (global) {
  const reducedMotion =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  const MAX_PARTICLES = 420;
  const MAX_FLOATERS = 48;
  const MAX_SHOCKWAVES = 12;

  const particles = [];
  const floaters = [];
  const shockwaves = [];
  const stars = [[], [], []];
  const nebulae = [];

  let shakeIntensity = 0;
  let shakeDecay = 0.88;
  let flashAlpha = 0;
  let flashColor = "255,40,40";
  let vignettePulse = 0;
  let time = 0;
  let lastTs = 0;
  let combo = 0;
  let comboTimer = 0;
  let comboMax = 0;
  let banner = null;
  let initialized = false;
  let w = 0;
  let h = 0;

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function initStars(width, height) {
    w = width;
    h = height;
    for (let layer = 0; layer < 3; layer++) {
      stars[layer].length = 0;
      const count = layer === 0 ? 60 : layer === 1 ? 90 : 140;
      for (let i = 0; i < count; i++) {
        stars[layer].push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: (layer + 1) * 0.45 + Math.random() * 1.2,
          tw: Math.random() * Math.PI * 2,
          speed: 0.15 + layer * 0.35 + Math.random() * 0.25,
        });
      }
    }
    nebulae.length = 0;
    const palette = [
      ["#0a3d62", "#1e3799", "#3c6382"],
      ["#6a0572", "#ab83a1", "#1b1464"],
      ["#0c2461", "#1e3799", "#0a3d62"],
      ["#b71540", "#6F1E51", "#1e272e"],
    ];
    for (let i = 0; i < 4; i++) {
      const colors = palette[i % palette.length];
      nebulae.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: rand(180, 420),
        vx: rand(-0.08, 0.08),
        vy: rand(0.02, 0.12),
        colors,
        a: rand(0.08, 0.18),
        rot: Math.random() * Math.PI * 2,
      });
    }
    initialized = true;
  }

  function ensureSize(width, height) {
    if (!initialized || Math.abs(width - w) > 2 || Math.abs(height - h) > 2) {
      initStars(width, height);
    }
  }

  function spawnParticle(p) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push(p);
  }

  function spawnFloater(f) {
    if (floaters.length >= MAX_FLOATERS) floaters.shift();
    floaters.push(f);
  }

  function spawnShockwave(s) {
    if (shockwaves.length >= MAX_SHOCKWAVES) shockwaves.shift();
    shockwaves.push(s);
  }

  function burst(x, y, opts) {
    if (reducedMotion) return;
    const {
      count = 18,
      speed = 4,
      life = 0.55,
      size = 3,
      colors = ["#00eaff", "#ffffff", "#0077ff"],
      gravity = 0.04,
      spread = Math.PI * 2,
      angle = -Math.PI / 2,
      drag = 0.97,
      glow = true,
    } = opts || {};
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const sp = speed * (0.4 + Math.random());
      spawnParticle({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: life * (0.6 + Math.random() * 0.5),
        maxLife: life,
        size: size * (0.5 + Math.random()),
        color: colors[(Math.random() * colors.length) | 0],
        gravity,
        drag,
        glow,
      });
    }
  }

  const VFX = {
    get combo() {
      return combo;
    },
    get comboMax() {
      return comboMax;
    },

    resize(width, height) {
      initStars(width, height);
    },

    beginFrame(ctx, width, height, dtMs) {
      ensureSize(width, height);
      const dt = Math.min(0.05, (dtMs || 16) / 1000);
      time += dt;
      lastTs = performance.now();

      ctx.save();
      if (shakeIntensity > 0.15 && !reducedMotion) {
        const sx = (Math.random() - 0.5) * shakeIntensity * 2;
        const sy = (Math.random() - 0.5) * shakeIntensity * 2;
        ctx.translate(sx, sy);
        shakeIntensity *= shakeDecay;
      } else {
        shakeIntensity = 0;
      }

      if (combo > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
          combo = 0;
          comboTimer = 0;
          VFX._syncComboHud();
        }
      }
      if (vignettePulse > 0) vignettePulse = Math.max(0, vignettePulse - dt * 1.5);
      if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - dt * 2.2);
      if (banner) {
        banner.t += dt;
        if (banner.t > banner.duration) banner = null;
      }
    },

    endFrame(ctx, width, height) {
      // Flash overlay
      if (flashAlpha > 0.01) {
        ctx.fillStyle = `rgba(${flashColor},${flashAlpha})`;
        ctx.fillRect(0, 0, width, height);
      }
      // Damage / intensity vignette
      if (vignettePulse > 0.01) {
        const g = ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.25,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.75
        );
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, `rgba(180,0,40,${0.45 * vignettePulse})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
      VFX._drawBanner(ctx, width, height);
      VFX._syncComboHud();
    },

    drawBackground(ctx, width, height) {
      // Deep space gradient
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#02010a");
      bg.addColorStop(0.45, "#051428");
      bg.addColorStop(1, "#0a1f3d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Nebulae
      for (let i = 0; i < nebulae.length; i++) {
        const n = nebulae[i];
        n.x += n.vx;
        n.y += n.vy;
        n.rot += 0.0008;
        if (n.y - n.r > height) {
          n.y = -n.r;
          n.x = Math.random() * width;
        }
        if (n.x < -n.r) n.x = width + n.r;
        if (n.x > width + n.r) n.x = -n.r;

        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.rot);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.r);
        g.addColorStop(0, hexToRgba(n.colors[0], n.a));
        g.addColorStop(0.45, hexToRgba(n.colors[1], n.a * 0.55));
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, n.r, n.r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Parallax stars
      for (let layer = 0; layer < 3; layer++) {
        const list = stars[layer];
        const alphaBase = 0.35 + layer * 0.22;
        for (let i = 0; i < list.length; i++) {
          const s = list[i];
          s.y += s.speed * (1 + layer * 0.4);
          if (s.y > height + 2) {
            s.y = -2;
            s.x = Math.random() * width;
          }
          const twinkle = 0.55 + 0.45 * Math.sin(time * (1.5 + layer) + s.tw);
          ctx.beginPath();
          ctx.fillStyle = `rgba(220,235,255,${alphaBase * twinkle})`;
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
          if (layer === 2 && twinkle > 0.9) {
            ctx.fillStyle = `rgba(255,255,255,${0.15 * twinkle})`;
            ctx.fillRect(s.x - s.r * 2.5, s.y - 0.5, s.r * 5, 1);
            ctx.fillRect(s.x - 0.5, s.y - s.r * 2.5, 1, s.r * 5);
          }
        }
      }
    },

    updateAndDrawParticles(ctx) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.016;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const t = p.life / p.maxLife;
        const r = p.size * (0.4 + t);
        if (p.glow) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10 * t;
        }
        ctx.globalAlpha = Math.max(0, t);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.r += s.speed;
        s.life -= 0.016;
        if (s.life <= 0) {
          shockwaves.splice(i, 1);
          continue;
        }
        const t = s.life / s.maxLife;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${s.rgb},${t})`;
        ctx.lineWidth = s.width * t;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i];
        f.y += f.vy;
        f.life -= 0.016;
        if (f.life <= 0) {
          floaters.splice(i, 1);
          continue;
        }
        const t = f.life / f.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.min(1, t * 1.4);
        ctx.font = `bold ${f.size}px Orbitron, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 12;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }
    },

    drawPlayerAura(ctx, player, flags) {
      const cx = player.x + player.width / 2;
      const cy = player.y + player.height / 2;
      const pulse = 0.5 + 0.5 * Math.sin(time * 6);

      // Engine thrusters
      if (!reducedMotion) {
        const moving =
          player.movingLeft ||
          player.movingRight ||
          player.movingUp ||
          player.movingDown ||
          true;
        if (moving) {
          burst(cx + rand(-6, 6), player.y + player.height - 4, {
            count: 2,
            speed: 2.2,
            life: 0.28,
            size: 2.2,
            colors: flags && flags.boost
              ? ["#ff9100", "#ffea00", "#fff"]
              : ["#4fc3f7", "#81d4fa", "#e1f5fe"],
            gravity: 0.08,
            spread: 0.9,
            angle: Math.PI / 2,
            glow: true,
          });
        }
      }

      // Invulnerability shield ring
      if (flags && flags.invuln) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0,229,255,${0.35 + 0.35 * pulse})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 16;
        ctx.arc(cx, cy, player.width * 0.75 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Double points gold ring
      if (flags && flags.double) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,215,0,${0.3 + 0.3 * pulse})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 12;
        ctx.arc(cx, cy, player.width * 0.9 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    },

    drawBullet(ctx, bullet) {
      const x = bullet.x + 2;
      const y = bullet.y;
      const g = ctx.createLinearGradient(x, y + 18, x, y - 6);
      g.addColorStop(0, "#0077ff");
      g.addColorStop(0.5, "#00eaff");
      g.addColorStop(1, "#ffffff");
      ctx.save();
      ctx.shadowColor = "#00eaff";
      ctx.shadowBlur = 14;
      ctx.fillStyle = g;
      ctx.beginPath();
      roundRect(ctx, x - 3, y - 10, 6, 22, 3);
      ctx.fill();
      ctx.restore();

      if (!reducedMotion && Math.random() > 0.4) {
        spawnParticle({
          x: x + rand(-2, 2),
          y: y + 10,
          vx: rand(-0.3, 0.3),
          vy: rand(0.5, 1.5),
          life: 0.2,
          maxLife: 0.2,
          size: 1.8,
          color: "#00eaff",
          gravity: 0,
          drag: 0.95,
          glow: true,
        });
      }
    },

    drawEnemyBullet(ctx, bullet) {
      ctx.save();
      ctx.shadowColor = "#ff1744";
      ctx.shadowBlur = 12;
      const g = ctx.createLinearGradient(
        bullet.x,
        bullet.y,
        bullet.x,
        bullet.y + bullet.height
      );
      g.addColorStop(0, "#ffeb3b");
      g.addColorStop(1, "#ff1744");
      ctx.fillStyle = g;
      roundRect(ctx, bullet.x, bullet.y, Math.max(4, bullet.width), Math.max(10, bullet.height), 3);
      ctx.fill();
      ctx.restore();
    },

    muzzleFlash(x, y) {
      burst(x, y, {
        count: 10,
        speed: 3.5,
        life: 0.25,
        size: 2.5,
        colors: ["#fff", "#00eaff", "#4fc3f7"],
        gravity: 0,
        spread: Math.PI * 1.2,
        angle: -Math.PI / 2,
      });
    },

    explosion(x, y, power) {
      const p = power || 1;
      burst(x, y, {
        count: Math.floor(16 * p),
        speed: 5 * p,
        life: 0.55,
        size: 3.5 * p,
        colors: ["#ff6b00", "#ffeb3b", "#ff1744", "#fff"],
        gravity: 0.05,
        spread: Math.PI * 2,
      });
      burst(x, y, {
        count: Math.floor(8 * p),
        speed: 2.5 * p,
        life: 0.7,
        size: 2,
        colors: ["#ff9100", "#ff5722"],
        gravity: -0.02,
        spread: Math.PI * 2,
      });
      spawnShockwave({
        x,
        y,
        r: 4,
        speed: 4.5 * p,
        life: 0.4,
        maxLife: 0.4,
        width: 4,
        rgb: "255,140,40",
      });
      VFX.shake(3.5 * p);
    },

    hitSpark(x, y) {
      burst(x, y, {
        count: 6,
        speed: 3,
        life: 0.3,
        size: 2,
        colors: ["#fff", "#ffeb3b", "#00eaff"],
        gravity: 0,
        spread: Math.PI * 2,
      });
    },

    heal(x, y) {
      burst(x, y, {
        count: 14,
        speed: 2.8,
        life: 0.7,
        size: 2.8,
        colors: ["#69f0ae", "#00e676", "#fff"],
        gravity: -0.06,
        spread: Math.PI * 2,
      });
      spawnShockwave({
        x,
        y,
        r: 6,
        speed: 3,
        life: 0.45,
        maxLife: 0.45,
        width: 3,
        rgb: "80,250,160",
      });
    },

    powerUp(x, y, colors) {
      burst(x, y, {
        count: 20,
        speed: 4,
        life: 0.65,
        size: 3,
        colors: colors || ["#ffd700", "#fff", "#ff9100"],
        gravity: -0.04,
        spread: Math.PI * 2,
      });
    },

    damageFlash() {
      flashColor = "220,20,40";
      flashAlpha = 0.45;
      vignettePulse = 1;
      VFX.shake(8);
    },

    shake(amount) {
      if (reducedMotion) return;
      shakeIntensity = Math.min(22, shakeIntensity + amount);
    },

    floatText(x, y, text, color, size) {
      spawnFloater({
        x,
        y,
        text: String(text),
        color: color || "#ffeb3b",
        size: size || 18,
        vy: -1.2,
        life: 0.9,
        maxLife: 0.9,
      });
    },

    registerKill(x, y, points) {
      combo += 1;
      comboTimer = 2.4;
      if (combo > comboMax) comboMax = combo;
      const bonus = combo >= 10 ? 2 : combo >= 5 ? 1.5 : 1;
      const shown = Math.floor(points * bonus);
      let color = "#ffeb3b";
      if (combo >= 10) color = "#ff1493";
      else if (combo >= 5) color = "#ff9100";
      else if (combo >= 3) color = "#00eaff";
      VFX.floatText(x, y - 10, `+${shown}`, color, 16 + Math.min(combo, 10));
      if (combo >= 3) {
        VFX.floatText(x, y - 32, `${combo} COMBO!`, color, 14 + Math.min(combo, 8));
      }
      VFX._syncComboHud();
      return bonus;
    },

    resetCombo() {
      combo = 0;
      comboTimer = 0;
      VFX._syncComboHud();
    },

    levelUp(level) {
      banner = {
        title: `NIVEL ${level}`,
        subtitle: level % 10 === 0 ? "¡OLEADA ÉPICA!" : "Sigue disparando",
        t: 0,
        duration: 2.2,
        color: level % 10 === 0 ? "#ff1744" : "#00eaff",
      };
      flashColor = "0,180,255";
      flashAlpha = 0.25;
      VFX.shake(4);
      spawnShockwave({
        x: w / 2,
        y: h / 2,
        r: 10,
        speed: 12,
        life: 0.7,
        maxLife: 0.7,
        width: 5,
        rgb: "0,200,255",
      });
    },

    bossWarning() {
      banner = {
        title: "¡ALERTA!",
        subtitle: "Astraeus, Señor del Vacío",
        t: 0,
        duration: 3,
        color: "#ff1744",
      };
      flashColor = "255,20,40";
      flashAlpha = 0.35;
      VFX.shake(10);
    },

    clear() {
      particles.length = 0;
      floaters.length = 0;
      shockwaves.length = 0;
      shakeIntensity = 0;
      flashAlpha = 0;
      vignettePulse = 0;
      combo = 0;
      comboTimer = 0;
      banner = null;
      VFX._syncComboHud();
    },

    _drawBanner(ctx, width, height) {
      if (!banner) return;
      const t = banner.t;
      let alpha = 1;
      if (t < 0.25) alpha = t / 0.25;
      else if (t > banner.duration - 0.4) alpha = (banner.duration - t) / 0.4;
      const scale = t < 0.3 ? 0.7 + (t / 0.3) * 0.35 : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(width / 2, height * 0.28);
      ctx.scale(scale, scale);
      ctx.textAlign = "center";
      ctx.font = "bold 42px Orbitron, sans-serif";
      ctx.fillStyle = banner.color;
      ctx.shadowColor = banner.color;
      ctx.shadowBlur = 24;
      ctx.fillText(banner.title, 0, 0);
      ctx.font = "16px Orbitron, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 8;
      ctx.fillText(banner.subtitle, 0, 32);
      ctx.restore();
    },

    _syncComboHud() {
      const el = document.getElementById("comboDisplay");
      if (!el) return;
      if (combo >= 2) {
        el.classList.add("show");
        const countEl = el.querySelector(".combo-count");
        countEl.textContent = `x${combo}`;
        el.querySelector(".combo-label").textContent =
          combo >= 10 ? "LEGENDARIO" : combo >= 5 ? "ÉPICO" : "COMBO";
        el.style.setProperty("--combo-heat", Math.min(1, combo / 12));
        if (
          countEl.dataset.comboShown !== String(combo) &&
          typeof UIAnime !== "undefined" &&
          UIAnime.comboPop
        ) {
          countEl.dataset.comboShown = String(combo);
          UIAnime.comboPop(countEl);
        }
      } else {
        el.classList.remove("show");
        const countEl = el.querySelector(".combo-count");
        if (countEl) delete countEl.dataset.comboShown;
      }
    },
  };

  function hexToRgba(hex, a) {
    const h = hex.replace("#", "");
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const n = parseInt(full, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  global.VFX = VFX;
})(typeof window !== "undefined" ? window : globalThis);
