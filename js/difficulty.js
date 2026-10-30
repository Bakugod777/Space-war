/**
 * Space War — curva de dificultad: de menos a más.
 * Empieza suave (aprender a moverse/disparar), sube con nivel/tiempo
 * y aprieta de verdad tras el primer jefe (nivel 10+).
 */
(function (global) {
  function postBoss() {
    return Math.max(0, (typeof level === "number" ? level : 1) - 10);
  }
  function lvl() {
    return Math.max(1, typeof level === "number" ? level : 1);
  }
  /** 0→1 según “qué tan temprano” (niveles 1–5) */
  function earlyEase() {
    const L = lvl();
    if (L <= 1) return 0.35;
    if (L <= 3) return 0.45 + (L - 1) * 0.1; // 0.45 → 0.65
    if (L <= 5) return 0.7 + (L - 3) * 0.1; // 0.7 → 0.9
    return 1;
  }
  /** Rampa de tiempo: minutos 1–2 suaves, luego tensión */
  function timeRamp() {
    if (typeof gameNow !== "function") return earlyEase();
    const t = gameNow();
    const e = earlyEase();
    if (t < 60000) return e * (0.55 + 0.45 * (t / 60000)); // sube despacio el 1er min
    if (t < 150000) return Math.min(1.05, e + 0.25 * ((t - 60000) / 90000));
    if (t < 300000) return 1.05 + 0.25 * ((t - 150000) / 150000);
    return 1.35;
  }
  const Diff = {
    post: postBoss,
    pressure() {
      const L = lvl(), p = postBoss(), r = timeRamp();
      // Base baja al inicio; crece con nivel y post-jefe
      return (0.7 + (L - 1) * 0.09 + p * 0.5) * r;
    },
    /** HP extra — casi nada en 1–2, se nota desde 5+ */
    hpBonus(baseHp) {
      const L = lvl(), p = postBoss();
      if (L <= 2) return 0;
      const pre = Math.floor((L - 2) * 0.35 + (L >= 6 ? 1 : 0));
      const post = Math.floor(p * 1.1);
      const thick = baseHp >= 3 && L >= 4 ? Math.floor(L / 5) : 0;
      return Math.max(0, pre + post + thick);
    },
    speedMul() {
      const L = lvl(), p = postBoss();
      // Nivel 1 ~0.92 (un pelín más lento), luego sube
      return 0.92 + Math.min(1.4, (L - 1) * 0.05 + p * 0.32);
    },
    bulletMul() {
      const L = lvl(), p = postBoss();
      // Balas más lentas al principio
      return 0.85 + Math.min(1.15, (L - 1) * 0.04 + p * 0.22);
    },
    spawnInterval() {
      const L = lvl(), p = postBoss();
      // Más aire entre oleadas al inicio
      return Math.max(700, Math.round(2400 - L * 85 - p * 150));
    },
    waveSize() {
      const L = lvl(), p = postBoss(), r = timeRamp();
      const base = 1.0 + Math.sqrt(L) * 1.2 * (0.4 + 0.6 * Math.min(1.15, r));
      return Math.min(10 + 5 * p, Math.max(1, Math.floor(base * (1 + 0.95 * p))));
    },
    maxAlive() {
      const L = lvl(), p = postBoss();
      if (L <= 2) return 6;
      if (L <= 4) return 8 + L;
      return Math.min(36, 10 + L + p * 5);
    },
    eliteChance() {
      const L = lvl();
      if (L < 3) return 0;
      if (L < 5) return 0.04;
      return Math.min(0.3, 0.06 + L * 0.016 + postBoss() * 0.04);
    },
    formationChance() {
      const L = lvl();
      if (L < 3) return 0.02;
      if (L < 5) return 0.06;
      return Math.min(0.36, 0.08 + L * 0.018 + postBoss() * 0.045);
    },
    kitChance() {
      // Más semillas al inicio; se vuelven escasas después del jefe
      const L = lvl(), p = postBoss();
      if (L <= 3) return 0.12;
      if (L <= 6) return 0.09;
      return 0.06 / (1 + p * 1.5 + (L > 8 ? 0.5 : 0));
    },
    /** i-frames tras golpe — más generosos al inicio */
    iframeMs() {
      const L = lvl();
      if (postBoss() > 0) return 750;
      if (L <= 3) return 1100;
      if (L <= 6) return 900;
      return 750;
    },
  };
  global.Diff = Diff;
})(typeof window !== "undefined" ? window : globalThis);
