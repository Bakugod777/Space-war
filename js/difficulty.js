/**
 * Space War — curva de dificultad (tono Madoka: el laberinto no perdona).
 * Enemigos densos, balas rápidas, poca misericordia desde temprano.
 */
(function (global) {
  function postBoss() {
    return Math.max(0, (typeof level === "number" ? level : 1) - 10);
  }
  function lvl() {
    return Math.max(1, typeof level === "number" ? level : 1);
  }
  /** Rampa de tiempo: arranca ya tensa (no “tutorial soft”) */
  function timeRamp() {
    if (typeof gameNow !== "function") return 1;
    const t = gameNow();
    if (t < 45000) return 0.72 + 0.28 * (t / 45000); // 0.72 → 1 en 45 s
    if (t < 180000) return 1 + 0.35 * ((t - 45000) / 135000);
    return 1.45;
  }
  const Diff = {
    post: postBoss,
    pressure() {
      const L = lvl(), p = postBoss(), r = timeRamp();
      return (1.15 + (L - 1) * 0.11 + p * 0.55) * r;
    },
    /** HP extra — se nota desde nivel 2 */
    hpBonus(baseHp) {
      const L = lvl(), p = postBoss();
      const pre = Math.floor((L - 1) * 0.45 + (L >= 5 ? 1 : 0));
      const post = Math.floor(p * 1.15);
      // tipos tanky reciben un poco más
      const thick = baseHp >= 3 ? Math.floor(L / 4) : 0;
      return Math.max(0, pre + post + thick);
    },
    speedMul() {
      const L = lvl(), p = postBoss();
      return 1.08 + Math.min(1.35, (L - 1) * 0.06 + p * 0.35);
    },
    bulletMul() {
      const L = lvl(), p = postBoss();
      return 1.12 + Math.min(1.05, L * 0.045 + p * 0.25);
    },
    spawnInterval() {
      const L = lvl(), p = postBoss();
      return Math.max(620, Math.round(1750 - L * 95 - p * 160));
    },
    waveSize() {
      const L = lvl(), p = postBoss(), r = timeRamp();
      const base = 1.4 + Math.sqrt(L) * 1.55 * (0.55 + 0.45 * Math.min(1.2, r));
      return Math.min(10 + 5 * p, Math.floor(base * (1 + 1.05 * p)));
    },
    maxAlive() {
      return Math.min(36, 12 + lvl() + postBoss() * 5);
    },
    eliteChance() {
      const L = lvl();
      if (L < 2) return 0.03;
      return Math.min(0.32, 0.08 + L * 0.018 + postBoss() * 0.045);
    },
    formationChance() {
      const L = lvl();
      if (L < 2) return 0.08;
      return Math.min(0.38, 0.1 + L * 0.02 + postBoss() * 0.05);
    },
    kitChance() {
      // Semillas/kits escasos: el laberinto no te regala vida
      return 0.055 / (1 + postBoss() * 1.6 + (lvl() > 4 ? 0.7 : 0));
    },
    /** i-frames tras golpe (ms) — menos “invuln spam” */
    iframeMs() {
      return postBoss() > 0 ? 800 : 650;
    },
  };
  global.Diff = Diff;
})(typeof window !== "undefined" ? window : globalThis);
