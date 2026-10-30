/**
 * Space War — Audio procedural (WebAudio). Sin archivos externos.
 * SFX.play(name), SFX.audio(name) => objeto compatible con HTMLAudioElement.
 * La música es un sintetizador generativo en bucle (synthwave espacial).
 */
(function (global) {
  const AC = global.AudioContext || global.webkitAudioContext;
  let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  let volume = (() => {
    const m = localStorage.getItem("gameMuted") === "true";
    return m ? 0 : (global.SafeStore ? SafeStore.num("gameVolume", 50, 0, 100) : 50) / 100;
  })();
  const last = {};

  function init() {
    if (ctx || !AC) return ctx;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.38; musicBus.connect(master);
    master.gain.value = volume;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  // iOS: el audio solo arranca tras un gesto del usuario.
  function unlock() {
    init();
    if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
    if (ctx) { // buffer vacío para desbloquear Safari antiguo
      const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050);
      b.connect(ctx.destination); b.start(0);
    }
  }
  ["pointerdown", "touchend", "keydown", "click"].forEach((ev) =>
    global.addEventListener(ev, unlock, { passive: true, capture: true })
  );

  function env(g, t, a, peak, dec, end = 0.0001) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(end, t + a + dec);
  }
  function tone(type, f0, f1, dur, peak, dest, t0 = 0) {
    const t = ctx.currentTime + t0;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.005, peak, dur);
    o.connect(g).connect(dest || sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, peak, fType, f0, f1, dest, t0 = 0) {
    const t = ctx.currentTime + t0;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = fType; f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, 0.004, peak, dur);
    s.connect(f).connect(g).connect(dest || sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const arp = (notes, step, type, peak) =>
    notes.forEach((n, i) => tone(type, n, 0, step * 1.6, peak, null, i * step));

  const BANK = {
    shoot: () => { tone("square", 880 + Math.random() * 60, 220, 0.09, 0.12); noise(0.05, 0.05, "highpass", 4000); },
    impact: () => { tone("triangle", 300, 90, 0.08, 0.25); noise(0.06, 0.12, "bandpass", 2500, 800); },
    explosion: () => { noise(0.55, 0.5, "lowpass", 2400, 120); tone("sine", 140, 35, 0.45, 0.55); },
    damage: () => { tone("sawtooth", 220, 60, 0.3, 0.3); noise(0.25, 0.25, "lowpass", 1200, 200); },
    heal: () => arp([523, 659, 784, 1047], 0.07, "triangle", 0.18),
    powerup: () => { const t = ctx.currentTime; const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "square"; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(1400, t + 0.35);
      env(g, t, 0.01, 0.1, 0.4); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + 0.5); },
    shield: () => { tone("sine", 200, 600, 0.5, 0.25); tone("sine", 300, 900, 0.5, 0.12); },
    coin: () => { tone("square", 988, 0, 0.08, 0.12); tone("square", 1319, 0, 0.3, 0.12, null, 0.08); },
    xiao: () => { noise(0.35, 0.25, "bandpass", 600, 5000); arp([392, 587, 784], 0.06, "sawtooth", 0.08); },
    achievement: () => arp([523, 659, 784, 1047, 1319], 0.09, "square", 0.1),
  };
  const MIN_GAP = { shoot: 40, impact: 30, explosion: 45 };

  function play(name, vol = 1) {
    if (!init() || volume <= 0 || !BANK[name]) return;
    if (ctx.state !== "running") return;
    const now = performance.now();
    if (now - (last[name] || 0) < (MIN_GAP[name] || 20)) return; // evita saturar
    last[name] = now;
    sfxBus.gain.setValueAtTime(Math.min(1, vol), ctx.currentTime);
    BANK[name]();
  }

  // ---- Música generativa ----
  const music = { on: false, timer: 0, step: 0, next: 0 };
  const BPM = 112, S16 = 60 / BPM / 4;
  const prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function schedule() {
    if (!music.on || !ctx) return;
    while (music.next < ctx.currentTime + 0.2) {
      const st = music.step, t = music.next, bar = Math.floor(st / 16) % 4, chord = prog[bar];
      const at = t - ctx.currentTime;
      if (st % 16 === 0) chord.forEach((n) => tone("sawtooth", mtof(n), 0, S16 * 15, 0.035, musicBus, at));
      if (st % 2 === 0) tone("triangle", mtof(chord[0] - 24), 0, S16 * 1.6, 0.22, musicBus, at);
      if (st % 4 === 0) tone("sine", 120, 40, 0.18, 0.5, musicBus, at);
      if (st % 8 === 4) noise(0.12, 0.18, "bandpass", 1800, 900, musicBus, at);
      if (st % 2 === 1) noise(0.03, 0.05, "highpass", 7000, 0, musicBus, at);
      if (st % 3 === 0) tone("square", mtof(chord[(st / 3) % 3 | 0] + 12), 0, S16 * 0.9, 0.03, musicBus, at);
      music.next += S16; music.step++;
    }
  }
  function startMusic() {
    if (!init()) return Promise.resolve();
    unlock();
    // Si suena el tema de jefe, no pises con el synth de exploración
    if (bossTrack && !bossTrack.paused) return Promise.resolve();
    if (!music.on) { music.on = true; music.next = ctx.currentTime + 0.05; music.timer = setInterval(schedule, 50); }
    return Promise.resolve();
  }
  function stopMusic() { music.on = false; clearInterval(music.timer); }

  // ---- Tema épico de jefe (archivo CC0) ----
  let bossTrack = null;
  let bossWanted = false;
  function ensureBossTrack() {
    if (bossTrack) return bossTrack;
    bossTrack = new Audio("assets/music/boss-battle.ogg");
    bossTrack.loop = true;
    bossTrack.preload = "auto";
    bossTrack.volume = Math.max(0, Math.min(1, volume * 0.85));
    bossTrack.addEventListener("error", () => { /* silencioso si falta el asset */ });
    return bossTrack;
  }
  function startBossMusic() {
    unlock();
    bossWanted = true;
    stopMusic(); // corta el synth de exploración
    const a = ensureBossTrack();
    a.volume = Math.max(0, Math.min(1, volume * 0.85));
    try { a.currentTime = 0; } catch (e) {}
    return a.play().catch(() => {});
  }
  function stopBossMusic(resumeExplore) {
    bossWanted = false;
    if (bossTrack) {
      try { bossTrack.pause(); bossTrack.currentTime = 0; } catch (e) {}
    }
    if (resumeExplore !== false) startMusic();
  }
  function isBossMusicOn() {
    return !!(bossTrack && !bossTrack.paused && bossWanted);
  }

  function setVolume(v) {
    v = Number(v); if (!Number.isFinite(v)) v = 0.5;
    volume = Math.max(0, Math.min(1, v));
    if (master) master.gain.value = volume;
    if (bossTrack) bossTrack.volume = Math.max(0, Math.min(1, volume * 0.85));
  }

  // Objeto compatible con el antiguo `new Audio(...)`.
  function audio(name) {
    if (name === "music") {
      return {
        loop: true, currentTime: 0, get paused() { return !music.on; },
        get volume() { return volume; }, set volume(v) { setVolume(v); },
        play: startMusic, pause: stopMusic, addEventListener() {},
      };
    }
    if (name === "boss") {
      return {
        loop: true,
        get paused() { return !isBossMusicOn(); },
        get volume() { return volume; }, set volume(v) { setVolume(v); },
        play: startBossMusic, pause: () => stopBossMusic(false), addEventListener() {},
      };
    }
    return { volume: 1, currentTime: 0, play() { play(name, this.volume); return Promise.resolve(); }, pause() {} };
  }
  function suspend() {
    if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
    if (bossTrack && !bossTrack.paused) try { bossTrack.pause(); } catch (e) {}
  }
  function resume() {
    if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
    if (bossWanted && bossTrack) bossTrack.play().catch(() => {});
  }

  global.SFX = {
    play, audio, unlock, setVolume, suspend, resume,
    startMusic, stopMusic, startBossMusic, stopBossMusic, isBossMusicOn,
  };
})(window);
