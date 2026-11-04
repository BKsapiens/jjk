// Firebase de mentira, em memória, para testar as rotas da API sem conta real.
// Uso: import { instalarFirebaseFalso } from "./firebase-falso.js"; const f = instalarFirebaseFalso({ tokens: { "tk-ana": { uid: "ana", email: "ana@x.com" } } });
export function instalarFirebaseFalso({ tokens = {} } = {}) {
  const store = new Map();
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v, (k, x) => (x && x.__ts) ? { __ts: true, ms: x.ms } : x));
  const ts = () => ({ __ts: true, ms: Date.now(), toMillis() { return this.ms; } });
  const resolver = v => { if (v && v.__sv === "ts") return ts(); if (v && typeof v === "object" && !Array.isArray(v)) { const o = {}; for (const k in v) o[k] = resolver(v[k]); return o; } return v; };
  const snap = (path) => ({ id: path.split("/").pop(), exists: store.has(path), data: () => { const d = clone(store.get(path)); if (d) for (const k in d) if (d[k] && d[k].__ts) d[k] = { ms: d[k].ms, toMillis() { return this.ms; } }; return d; } });
  const docRef = path => ({
    path, id: path.split("/").pop(),
    get: async () => snap(path),
    set: async (d, o) => { store.set(path, o && o.merge ? { ...(store.get(path) || {}), ...resolver(d) } : resolver(d)); },
    update: async d => { if (!store.has(path)) throw new Error("not found"); store.set(path, { ...store.get(path), ...resolver(d) }); },
    delete: async () => { store.delete(path); }
  });
  const consulta = (col, filtros = [], ordem = null, lim = null) => ({
    where: (f, op, v) => consulta(col, [...filtros, [f, op, v]], ordem, lim),
    orderBy: (f, dir) => consulta(col, filtros, [f, dir], lim),
    limit: n => consulta(col, filtros, ordem, n),
    select: () => consulta(col, filtros, ordem, lim),
    get: async () => {
      let docs = [...store.keys()].filter(k => k.startsWith(col + "/") && k.split("/").length === col.split("/").length + 1).map(snap);
      for (const [f, op, v] of filtros) docs = docs.filter(d => op === "==" ? d.data()[f] === v : true);
      if (ordem) docs.sort((a, b) => (a.data()[ordem[0]] > b.data()[ordem[0]] ? 1 : -1) * (ordem[1] === "desc" ? -1 : 1));
      if (lim) docs = docs.slice(0, lim);
      return { docs, size: docs.length, empty: !docs.length };
    },
    count: () => ({ get: async () => { const r = await consulta(col, filtros).get(); return { data: () => ({ count: r.size }) }; } })
  });
  let fila = Promise.resolve();
  const db = {
    doc: docRef,
    collection: c => consulta(c),
    batch: () => { const ops = []; return { set: (r, d, o) => ops.push(() => r.set(d, o)), commit: async () => { for (const op of ops) await op(); } }; },
    // transações em série (como se o Firestore travasse os documentos)
    runTransaction: fn => { const p = fila.then(async () => {
      const ops = [];
      const t = { get: r => r.get(), set: (r, d, o) => ops.push(() => r.set(d, o)), update: (r, d) => ops.push(() => r.update(d)), delete: r => ops.push(() => r.delete()) };
      const res = await fn(t); for (const op of ops) await op(); return res; });
      fila = p.catch(() => {}); return p; }
  };
  const auth = { verifyIdToken: async tk => { const u = tokens[tk]; if (!u) throw new Error("token inválido"); return { uid: u.uid, email: u.email, email_verified: true }; } };
  const FieldValue = { serverTimestamp: () => ({ __sv: "ts" }) };
  globalThis.__firebaseFalso = { auth, db, FieldValue };
  return { store, tokens };
}

/* resposta falsa no formato da Vercel (res.status().json()/send()) */
export function resposta() {
  const r = { code: 200, corpo: null, status(c) { r.code = c; return r; }, json(j) { r.corpo = j; return r; }, send(t) { r.corpo = t; return r; } };
  return r;
}
