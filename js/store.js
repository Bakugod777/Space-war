/**
 * Space War — lectura segura de localStorage: try/catch + validación + versión de esquema.
 * Si algo está corrupto, se usa el valor por defecto limpio (y se repara la clave).
 */
(function (global) {
  const SCHEMA = 2;
  const ls = (() => { try { const t = "__sw"; localStorage.setItem(t, t); localStorage.removeItem(t); return localStorage; } catch (e) { return null; } })();
  function raw(k) { try { return ls ? ls.getItem(k) : null; } catch (e) { return null; } }
  function put(k, v) { try { ls && ls.setItem(k, v); } catch (e) {} }
  function parse(k, valid, def) {
    const r = raw(k);
    if (r === null) return def();
    try { const v = JSON.parse(r); if (valid(v)) return v; } catch (e) {}
    console.warn("[SafeStore] dato inválido en", k, "→ valores por defecto");
    try { ls && ls.removeItem(k); } catch (e) {}
    return def();
  }
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  const SafeStore = {
    SCHEMA,
    getArray(k, itemValid) {
      const all = parse(k, (v) => Array.isArray(v), () => []);
      const ok = all.filter((x) => { try { return !itemValid || itemValid(x); } catch (e) { return false; } });
      if (ok.length !== all.length) put(k, JSON.stringify(ok)); // repara la clave
      return ok;
    },
    getObject(k, valid) { return parse(k, (v) => isObj(v) && (!valid || valid(v)), () => ({})); },
    get(k, valid, def) { return parse(k, valid, def); },
    set(k, v) { put(k, JSON.stringify(v)); },
    // Número finito y acotado; si está corrupto se repara con el valor por defecto.
    num(k, def, min, max) {
      const r = raw(k); const v = r === null ? NaN : parseFloat(r);
      if (!Number.isFinite(v)) { if (r !== null) put(k, String(def)); return def; }
      const c = Math.min(max, Math.max(min, v)); if (c !== v) put(k, String(c)); return c;
    },
  };
  // Versión de esquema: si no coincide, se validan/limpian las claves conocidas.
  const ver = parseInt(raw("sw_schema") || "0", 10);
  if (ver !== SCHEMA) {
    SafeStore.getArray("scores", (x) => x && typeof x.name === "string" && Number.isFinite(x.score));
    SafeStore.getObject("playerStats");
    SafeStore.getArray("achievements", (x) => x && typeof x.id === "string");
    SafeStore.getArray("shopPurchases", (x) => typeof x === "string");
    put("sw_schema", String(SCHEMA));
  }
  global.SafeStore = SafeStore;
})(window);
