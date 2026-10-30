/**
 * Space War — Ajustes: controles remapeables, zurdo/diestro, vibración,
 * reducir movimiento. Todo se guarda en localStorage.
 */
(function (global) {
  const LS = global.localStorage;
  const get = (k, d) => { try { const v = LS.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  const set = (k, v) => { try { LS.setItem(k, v); } catch (e) {} };

  // ---------- Teclado (e.code: funciona con teclado español/latam) ----------
  // Dos esquemas activos a la vez: WASD + J (mano izq. mueve) y flechas + Z / Enter / Shift (mano izq. dispara).
  const DEFAULT_KEYS = {
    up: ["ArrowUp", "KeyW"],
    down: ["ArrowDown", "KeyS"],
    left: ["ArrowLeft", "KeyA"],
    right: ["ArrowRight", "KeyD"],
    fire: ["ShiftRight", "Enter", "NumpadEnter", "KeyJ"],
  };
  const LABELS = { up: "Arriba", down: "Abajo", left: "Izquierda", right: "Derecha", fire: "Disparar" };
  let keys;
  try { keys = JSON.parse(get("sw_keys_v21", "null")); } catch (e) { keys = null; }
  if (!keys || typeof keys !== "object" || !["up","down","left","right","fire"].every((a) => Array.isArray(keys[a]) && keys[a].every((c) => typeof c === "string"))) keys = null;
  if (!keys || !keys.fire) keys = JSON.parse(JSON.stringify(DEFAULT_KEYS));
  let codeMap = {};
  function rebuild() { codeMap = {}; for (const a in keys) keys[a].forEach((c) => (codeMap[c] = a)); }
  rebuild();
  const Controls = {
    actionFor: (code) => codeMap[code] || null,
    keys: () => keys,
    remap(action, code) {
      for (const a in keys) keys[a] = keys[a].filter((c) => c !== code);
      keys[action] = [code].concat(keys[action]).slice(0, 4);
      set("sw_keys_v21", JSON.stringify(keys)); rebuild();
    },
    reset() { keys = JSON.parse(JSON.stringify(DEFAULT_KEYS)); set("sw_keys_v21", JSON.stringify(keys)); rebuild(); },
    pretty(code) {
      return code.replace(/^Key/, "").replace(/^Digit/, "").replace("Arrow", "").replace("Up", "↑").replace("Down", "↓")
        .replace("Left", "←").replace("Right", "→").replace("Shift↑", "Shift").replace("Space", "Espacio")
        .replace(/^Shift→$/, "Shift der.").replace(/^Shift←$/, "Shift izq.");
    },
  };

  // ---------- Vibración (Safari/iOS no vibra: detección de soporte) ----------
  const canVibrate = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  let vibOn = get("sw_vibrate", "1") === "1";
  // navigator.vibrate solo después del primer gesto (evita el aviso de la consola)
  let __gestured = false;
  ["pointerdown", "touchstart", "keydown"].forEach((ev) => window.addEventListener(ev, () => { __gestured = true; }, { once: true, capture: true, passive: true }));
  const PATTERNS = { shoot: 6, explosion: 25, damage: [50, 30, 50], pickup: 15 };
  const Haptics = {
    supported: canVibrate,
    buzz(kind) { if (canVibrate && vibOn && __gestured) try { navigator.vibrate(PATTERNS[kind] || 10); } catch (e) {} },
    set(v) { vibOn = !!v; set("sw_vibrate", v ? "1" : "0"); },
    get on() { return vibOn; },
  };

  // ---------- Preferencias ----------
  const Prefs = {
    get hand() { return get("sw_hand", "zurdo"); },
    setHand(h) {
      set("sw_hand", h);
      document.body.classList.toggle("left-handed", h !== "diestro");
      document.body.classList.toggle("right-handed", h === "diestro");
    },
    get reduceMotion() { return global.VFX ? VFX.isReducedMotion() : false; },
    setReduceMotion(v) { set("sw_reduceMotion", v ? "1" : "0"); if (global.VFX) VFX.setReducedMotion(v); document.body.classList.toggle("reduce-motion", !!v); },
  };

  // ---------- Panel ----------
  function buildPanel() {
    const btn = document.createElement("button");
    btn.id = "settingsButton"; btn.className = "settings-btn"; btn.type = "button";
    btn.setAttribute("aria-label", "Ajustes"); btn.innerHTML = '<span class="px-ico px-gear"></span>';
    const pause = document.createElement("button");
    pause.id = "pauseButton"; pause.className = "pause-btn"; pause.type = "button";
    pause.setAttribute("aria-label", "Pausa"); pause.innerHTML = '<span class="px-ico px-pause"></span>';
    const panel = document.createElement("div");
    panel.id = "settingsPanel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true");
    panel.innerHTML = `
      <div class="sp-card">
        <h2>Tus ajustes <span class="star-px" aria-hidden="true"></span></h2>
        <div class="sp-row"><span>Mano</span>
          <div class="sp-seg" role="group">
            <button type="button" data-hand="zurdo">Zurdo</button>
            <button type="button" data-hand="diestro">Diestro</button>
          </div></div>
        <p class="sp-hint">Zurdo: disparas con la izquierda y te mueves con la derecha.</p>
        <label class="sp-row"><span>Menos sacudidas</span><input type="checkbox" id="spMotion"></label>
        <label class="sp-row" id="spVibRow"><span>Vibración</span><input type="checkbox" id="spVib"></label>
        <h3>Teclas</h3>
        <div id="spKeys"></div>
        <p class="sp-hint">Toca una acción y luego aprieta la tecla que quieras.</p>
        <div class="sp-actions">
          <button type="button" id="spReset" class="sp-ghost">Como venían</button>
          <button type="button" id="spClose" class="sp-primary">¡A jugar!</button>
        </div>
      </div>`;
    document.body.append(btn, pause, panel);

    const $ = (s) => panel.querySelector(s);
    const syncHand = () => panel.querySelectorAll("[data-hand]").forEach((b) => b.classList.toggle("on", b.dataset.hand === Prefs.hand));
    panel.querySelectorAll("[data-hand]").forEach((b) => b.addEventListener("click", () => { Prefs.setHand(b.dataset.hand); syncHand(); }));
    $("#spMotion").checked = Prefs.reduceMotion; $("#spMotion").onchange = (e) => Prefs.setReduceMotion(e.target.checked);
    if (!Haptics.supported) { $("#spVibRow").classList.add("disabled"); $("#spVib").disabled = true; $("#spVibRow span").textContent = "Vibración (este cel no vibra, ni modo)"; }
    $("#spVib").checked = Haptics.on && Haptics.supported; $("#spVib").onchange = (e) => { Haptics.set(e.target.checked); Haptics.buzz("pickup"); };

    let waiting = null;
    function renderKeys() {
      const k = Controls.keys();
      $("#spKeys").innerHTML = Object.keys(LABELS).map((a) =>
        `<button type="button" class="sp-key ${waiting === a ? "wait" : ""}" data-act="${a}"><span>${LABELS[a]}</span><b>${waiting === a ? "aprieta una…" : k[a].map(Controls.pretty).join(" · ")}</b></button>`).join("");
      $("#spKeys").querySelectorAll(".sp-key").forEach((b) => (b.onclick = () => { waiting = b.dataset.act; renderKeys(); }));
    }
    document.addEventListener("keydown", (e) => {
      if (!waiting) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.code !== "Escape") Controls.remap(waiting, e.code);
      waiting = null; renderKeys();
    }, true);
    $("#spReset").onclick = () => { Controls.reset(); renderKeys(); };

    let wasPaused = false;
    const open = () => {
      wasPaused = document.body.classList.contains("game-paused");
      if (global.isGameRunning && isGameRunning() && global.setPaused) setPaused(true);
      syncHand(); renderKeys(); panel.classList.add("show");
    };
    const close = () => { panel.classList.remove("show"); waiting = null; if (global.setPaused && !wasPaused) setPaused(false); };
    btn.onclick = open; $("#spClose").onclick = close;
    panel.addEventListener("click", (e) => { if (e.target === panel) close(); });
    pause.onclick = () => { if (global.setPaused) setPaused(!document.body.classList.contains("game-paused")); };
    // Toque en la capa de pausa para continuar
    const ov = document.createElement("div"); ov.id = "pauseOverlay"; ov.innerHTML = "<div>pausita<small>toca para seguir, aquí te espero</small></div>";
    ov.onclick = () => global.setPaused && setPaused(false);
    document.body.append(ov);
    document.addEventListener("keydown", (e) => {
      if ((e.code === "Escape" || e.code === "KeyP") && global.isGameRunning && isGameRunning() && !panel.classList.contains("show"))
        setPaused(!document.body.classList.contains("game-paused"));
    });
  }

  global.Controls = Controls; global.Haptics = Haptics; global.Prefs = Prefs;
  document.addEventListener("DOMContentLoaded", () => {
    Prefs.setHand(Prefs.hand);
    if (Prefs.reduceMotion) document.body.classList.add("reduce-motion");
    buildPanel();
  });
})(window);
