/**
 * Space War — curva de dificultad unificada.
 * Usada por foes.js / spawn / balas. Ajusta presión antes y después del jefe.
 */
(function (global) {
  function postBoss() {
    return Math.max(0, (typeof level === "number" ? level : 1) - 10);
  }
  function lvl() {
    return Math.max(1, typeof level === "number" ? level : 1);
  }
  /** 0..1 rampa de tiempo de partida (suave primeros 2 min) */
  function timeRamp() {
    if (typeof gameNow !== "function") return 1;
    const t = gameNow();
    if (t < 90000) return 0.35 + 0.65 * (t / 90000);
    if (t < 300000) return 1 + 0.25 * ((t - 90000) / 210000);
    return 1.35;
  }
  const Diff = {
    post: postBoss,
    /** Multiplicador general de presión */
    pressure() {
      const L = lvl(), p = postBoss(), r = timeRamp();
      return (1 + (L - 1) * 0.07 + p * 0.42) * r;
    },
    /** HP extra por nivel (también ANTES del jefe) */
    hpBonus(baseHp) {
      const L = lvl(), p = postBoss();
      const pre = Math.floor((L - 1) * 0.2);
      const post = Math.floor(p * 0.85);
      return Math.max(0, pre + post);
    },
    /** Multiplicador de velocidad de enemigos */
    speedMul() {
      const L = lvl(), p = postBoss();
      return 1 + Math.min(1.1, (L - 1) * 0.045 + p * 0.28);
    },
    /** Velocidad de balas enemigas */
    bulletMul() {
      const L = lvl(), p = postBoss();
      return 1 + Math.min(0.85, L * 0.03 + p * 0.18);
    },
    /** Intervalo del spawner (ms) */
    spawnInterval() {
      const L = lvl(), p = postBoss();
      return Math.max(750, Math.round(2000 - L * 85 - p * 140));
    },
    /** Cuántos intentos de spawn por tick */
    waveSize() {
      const L = lvl(), p = postBoss(), r = timeRamp();
      const base = 1 + Math.sqrt(L) * 1.35 * (0.5 + 0.5 * Math.min(1, r));
      return Math.min(8 + 4 * p, Math.floor(base * (1 + 0.95 * p)));
    },
    /** Tope de enemigos vivos (rendimiento + legibilidad) */
    maxAlive() {
      return Math.min(32, 10 + lvl() + postBoss() * 4);
    },
    /** Probabilidad de élite */
    eliteChance() {
      const L = lvl();
      if (L < 4) return 0;
      return Math.min(0.22, 0.04 + L * 0.012 + postBoss() * 0.03);
    },
    /** Probabilidad de oleada/formación en un tick */
    formationChance() {
      const L = lvl();
      if (L < 3) return 0.04;
      return Math.min(0.28, 0.06 + L * 0.015 + postBoss() * 0.04);
    },
    /** Kits más escasos bajo presión */
    kitChance() {
      return 0.1 / (1 + postBoss() * 1.2 + (lvl() > 6 ? 0.4 : 0));
    },
  };
  global.Diff = Diff;
})(typeof window !== "undefined" ? window : globalThis);
