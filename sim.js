/**
 * Space War — modo simulación para balancear: ?sim=1&runs=N&seed=S[&maxmin=10]
 * Un bot juega partidas completas con paso fijo (60 Hz) y registra nivel, vida y tiempo por partida.
 */
(function (global) {
  const q = new URLSearchParams(location.search);
  if (q.get("sim") !== "1") return;
  global.SIM_MODE = true;
  const RUNS = Math.max(1, Math.min(500, parseInt(q.get("runs") || "1", 10) || 1));
  const BASE = (parseInt(q.get("seed") || "1", 10) || 1) >>> 0;
  const MAXMS = (parseFloat(q.get("maxmin") || "10") || 10) * 60000;
  const STEPS = 240; // frames simulados por tick
  // Niveles de habilidad del bot: ?skill=good|medio|casual
  const SKILLS = {
    good:   { react: [12, 15], miss: 0.25, wrong: 0.10, aim: 20, look: [90, 50], idle: 0.04, magia: 0.05 },
    medio:  { react: [13, 18], miss: 0.45, wrong: 0.20, aim: 30, look: [70, 40], idle: 0.08, magia: 0.02 },
    casual: { react: [16, 20], miss: 0.60, wrong: 0.30, aim: 40, look: [55, 35], idle: 0.18, magia: 0.01 },
  };
  const SKILL = SKILLS[q.get("skill")] ? q.get("skill") : "medio";
  const SK = SKILLS[SKILL];
  const results = [];
  global.SIM_RESULTS = results;

  // Bot "humano": reacción de ~200–300 ms, error de puntería y esquives imperfectos.
  let botSeed = 1;
  function brand() { botSeed |= 0; botSeed = (botSeed + 0x6d2b79f5) | 0; let t = Math.imul(botSeed ^ (botSeed >>> 15), 1 | botSeed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const queue = []; // decisiones pendientes: se aplican tras el retardo de reacción
  let frame = 0, aimErr = 0, current = null;
  function decide() {
    const px = player.x + player.width / 2, py = player.y + player.height / 2;
    const threats = [];
    const look = SK.look[0] + brand() * SK.look[1]; // mira poco hacia arriba
    const notice = (x) => { if (brand() > SK.miss) threats.push(x); }; // parte de las amenazas se le pasan
    enemyBullets.forEach((b) => { if (b.y < py + 10 && b.y > py - look) notice(b.x); });
    enemies.forEach((e) => { if (e.y + e.height > py - look && e.y < py + 20) notice(e.x + e.width / 2); });
    if (global.Foes) Foes.list.forEach((f) => { if (f.y + f.h > py - look && f.y < py + 20) notice(f.x + f.w / 2); });
    let target;
    const close = threats.filter((t) => Math.abs(t - px) < 28);
    if (close.length) {
      // esquiva hacia el lado con menos amenazas, pero sin buscar el óptimo
      const left = threats.filter((t) => t < px).length, right = threats.length - left;
      const dir = (left > right ? 1 : -1) * (brand() < SK.wrong ? -1 : 1); // a veces esquiva al lado equivocado
      target = px + dir * (30 + brand() * 40);
    } else {
      const all = enemies.map((e) => e.x + e.width / 2).concat(global.Foes ? Foes.list.map((f) => f.x + f.w / 2) : []);
      target = boss ? boss.x + boss.width / 2 : all.length ? all[Math.floor(brand() * all.length)] : GW / 2;
      target += aimErr;
    }
    return { target: Math.max(16, Math.min(GW - 16, target)), shoot: brand() > SK.idle };
  }
  function bot() {
    frame++;
    if (frame % 30 === 0) aimErr = (brand() + brand() + brand() - 1.5) * SK.aim; // error de puntería ~±25 px
    if (frame % 6 === 0) queue.push({ at: frame + SK.react[0] + Math.floor(brand() * (SK.react[1] - SK.react[0] + 1)), d: decide() }); // reacción
    while (queue.length && queue[0].at <= frame) current = queue.shift().d;
    if (!current) return;
    const px = player.x + player.width / 2;
    player.movingLeft = current.target < px - 6;
    player.movingRight = current.target > px + 6;
    player.movingUp = player.y > GH - 110;
    player.movingDown = player.y < GH - 130;
    player.speed = 7;
    player.shooting = current.shoot;
    if (global.Magia && Magia.state.magia >= 100 && brand() < SK.magia) Magia.cast(); // tarda en acordarse
  }

  let run = 0;
  function startRun() {
    global.__simSeed = (BASE + run) >>> 0;
    botSeed = global.__simSeed ^ 0x9e3779b9; queue.length = 0; frame = 0; current = null; bossT0 = null; bossFights = []; lvl10At = null;
    document.body.classList.add("game-running");
    gameOverDisplay.style.display = "none";
    gameRunning = true;
    startGame();
    gamePaused = false;
  }
  function finish(reason) { if (bossT0 !== null && boss) console.log(`[sim] run jefe ${SKILL} muerte en pelea: ${((GameClock.t - bossT0)/1000).toFixed(1)}s, vida jefe ${boss.health}/${bossHealth}, golpes: ${JSON.stringify((window.__hitLog||[]).filter(h=>h.boss).map(h=>h.src+'@'+h.t))}`);
    const r = { run: run + 1, skill: SKILL, lvl10At, boss: bossFights.slice(), seed: Rogue.seed, level, hp: player.hearts, score, timeS: Math.round(GameClock.t / 1000), reason, picks: Rogue.picks.length };
    results.push(r);
    console.log(`[sim] run ${r.run} seed=${r.seed} nivel=${r.level} vida=${r.hp} puntaje=${r.score} tiempo=${r.timeS}s fin=${reason} cartas=${r.picks}`);
  }
  let lastHit = '';
  let bossT0 = null, bossFights = [], lvl10At = null, bossHurt = 0, hpAtBoss = 0;
  function tick() {
    for (let i = 0; i < STEPS; i++) {
      if (bossActive && bossT0 === null) { window.__hitLog = []; bossT0 = GameClock.t; hpAtBoss = player.hearts; console.log(`[sim] run jefe ${SKILL} aparece t=${Math.round(GameClock.t/1000)}s vida=${bossHealth} corazones=${player.hearts}/${player.maxHearts}`); }
      if (!bossActive && bossT0 !== null) { bossFights.push({ s: +((GameClock.t - bossT0) / 1000).toFixed(1), hpLost: Math.max(0, hpAtBoss - player.hearts) }); bossT0 = null; console.log(`[sim] run jefe ${SKILL} golpes ${JSON.stringify((window.__hitLog||[]).filter(h=>h.boss).map(h=>h.src+'@'+h.t))} duró ${bossFights[bossFights.length-1].s}s vida perdida ${bossFights[bossFights.length-1].hpLost} vida inicial ${hpAtBoss}`); }
      if (lvl10At === null && level >= 10) lvl10At = Math.round(GameClock.t / 1000);
      if (!gameRunning) { finish("muerte"); return next(); }
      if (GameClock.t > MAXMS) { finish("tope"); gameRunning = false; return next(); }
      gamePaused = false;
      bot();
      updateGame();
    }
    setTimeout(tick, 0);
  }
  function next() {
    run++;
    if (run >= RUNS) {
      const avg = (k) => (results.reduce((a, r) => a + r[k], 0) / results.length).toFixed(1);
      const dead = results.filter((r) => r.reason === "muerte");
      const lv = {}; dead.forEach((r) => (lv[r.level] = (lv[r.level] || 0) + 1));
      const times = results.map((r) => r.timeS).sort((a, b) => a - b);
      const med = times.length % 2 ? times[(times.length - 1) / 2] : (times[times.length / 2 - 1] + times[times.length / 2]) / 2;
      console.log(`[sim] FIN ${results.length} partidas · muertes ${dead.length} · nivel medio ${avg("level")} · tiempo mediano ${med}s · puntaje medio ${avg("score")}`);
      const early = dead.filter((r) => r.timeS < 120).length;
      console.log(`[sim] niveles de muerte: ${JSON.stringify(lv)}`);
      const l10 = results.map((r) => r.lvl10At).filter((x) => x != null).sort((a, b) => a - b);
      const bf = results.flatMap((r) => r.boss);
      console.log(`[sim] skill=${SKILL} · nivel 10 alcanzado en ${l10.length}/${results.length} (mediana ${l10.length ? l10[Math.floor(l10.length / 2)] : "-"} s) · peleas de jefe ${bf.length}, duración mediana ${bf.length ? bf.map((b) => b.s).sort((a, b) => a - b)[Math.floor(bf.length / 2)] : "-"} s, vida perdida media ${bf.length ? (bf.reduce((a, b) => a + b.hpLost, 0) / bf.length).toFixed(2) : "-"}`);
      console.log(`[sim] muertes antes de 2 min: ${early}/${results.length} = ${(100 * early / results.length).toFixed(1)}%`);
      global.SIM_SUMMARY = { lv, med, dead: dead.length, early };
      global.SIM_DONE = true;
      return;
    }
    setTimeout(() => { startRun(); tick(); }, 0);
  }
  window.addEventListener("load", () => setTimeout(() => {
    try { localStorage.setItem("hasSeenUpdatePopup_v2", "true"); } catch (e) {}
    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";
    startRun(); tick();
  }, 300));
})(window);
