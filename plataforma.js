// Camada de plataforma: dá ao jogo os mesmos recursos que ele tinha dentro do Claude
// (banco de dados em tempo real, login e IA), agora usando Firebase e a função /api/mestre.
// O jogo chama window.claude.use("db" | "user" | "sample") e recebe estas implementações.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc as fsDoc, collection as fsCollection, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, onSnapshot as fsOnSnapshot, query, orderBy as fsOrderBy, limit as fsLimit,
  where as fsWhere, addDoc, FieldPath
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const configOk = window.FIREBASE_CONFIG && !String(window.FIREBASE_CONFIG.apiKey || "").includes("COLE_AQUI");
const ADMINS = (window.ADMINS || []).map(e => String(e).toLowerCase());

/* ---------- Tela de login ---------- */
const tela = document.createElement("div");
tela.id = "tela-login";
tela.innerHTML = `
  <div class="login-box">
    <div class="hanko" aria-hidden="true">呪</div>
    <h1>Era dos Feiticeiros</h1>
    <p id="login-msg">Entre com sua conta Google para criar sua ficha e jogar com o grupo.</p>
    <button class="btn primary" id="btn-login" type="button">Entrar com Google</button>
  </div>`;
const estilo = document.createElement("style");
estilo.textContent = `
  #tela-login{position:fixed;inset:0;z-index:100;background:var(--ink,#100e12);display:none;align-items:center;justify-content:center;padding:16px}
  #tela-login.show{display:flex}
  #tela-login .login-box{max-width:420px;width:100%;border:1px solid var(--line,#332d35);border-radius:12px;background:var(--ink-2,#1a171d);padding:28px;display:flex;flex-direction:column;gap:14px;align-items:flex-start}
  #tela-login h1{font-size:28px}
  #tela-login p{margin:0;color:var(--ash,#a39a8e)}
  #btn-sair{position:fixed;bottom:12px;left:12px;z-index:20;font-size:12px;opacity:.7}
`;
document.head.appendChild(estilo);
document.body.appendChild(tela);

let resolverLogin;
const loginPronto = new Promise(r => { resolverLogin = r; });
let app, auth, fs;

if (!configOk) {
  tela.classList.add("show");
  tela.querySelector("#login-msg").textContent = "O site ainda não foi configurado: preencha o arquivo config.js com os dados do seu projeto Firebase (veja o README).";
  tela.querySelector("#btn-login").hidden = true;
} else {
  app = initializeApp(window.FIREBASE_CONFIG);
  auth = getAuth(app);
  fs = getFirestore(app);
  tela.querySelector("#btn-login").addEventListener("click", async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { tela.querySelector("#login-msg").textContent = "Não deu para entrar: " + (e.code === "auth/popup-blocked" ? "o navegador bloqueou a janela de login. Libere pop-ups para este site." : (e.message || e.code)); }
  });
  onAuthStateChanged(auth, u => {
    if (u) {
      tela.classList.remove("show");
      resolverLogin(u);
      if (!document.getElementById("btn-sair")) {
        const b = document.createElement("button");
        b.id = "btn-sair"; b.className = "btn small"; b.type = "button"; b.textContent = "Sair (" + (u.email || "conta") + ")";
        b.addEventListener("click", async () => { await signOut(auth); location.reload(); });
        document.body.appendChild(b);
      }
    } else {
      tela.classList.add("show");
    }
  });
}

/* ---------- Banco de dados (mesma interface que o jogo usava) ---------- */
const erro = e => {
  const c = e && e.code;
  if (c === "permission-denied" || c === "not-found" || c === "invalid-argument") return { code: "invalid_argument", message: e.message };
  if (c === "resource-exhausted") return { code: "resource_exhausted", message: e.message };
  return { code: "unavailable", message: e && e.message };
};
const adaptarDoc = d => ({ id: d.id, exists: d.exists(), data: () => d.exists() ? d.data() : undefined, metadata: d.metadata });
const adaptarQuery = s => ({
  docs: s.docs.map(adaptarDoc), size: s.size, empty: s.empty, metadata: s.metadata,
  docChanges: () => s.docChanges().map(c => ({ type: c.type, doc: adaptarDoc(c.doc), oldIndex: c.oldIndex, newIndex: c.newIndex }))
});
// update() do jogo mescla objetos aninhados; no Firestore isso vira caminhos de campo.
function paresDeCampo(obj, prefixo = [], saida = []) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length) paresDeCampo(v, [...prefixo, k], saida);
    else saida.push(new FieldPath(...prefixo, k), v === undefined ? null : v);
  }
  return saida;
}
function refDoc(caminho) {
  const r = () => fsDoc(fs, caminho);
  return {
    id: caminho.split("/").pop(), path: caminho,
    get: async () => { try { return adaptarDoc(await getDoc(r())); } catch (e) { throw erro(e); } },
    set: async data => { try { await setDoc(r(), data); } catch (e) { throw erro(e); } },
    update: async data => { try { const p = paresDeCampo(data); if (p.length) await updateDoc(r(), ...p); } catch (e) { throw erro(e); } },
    delete: async () => { try { await deleteDoc(r()); } catch (e) { throw erro(e); } },
    onSnapshot: (next, err) => fsOnSnapshot(r(), { includeMetadataChanges: false }, s => next(adaptarDoc(s)), e => err && err(erro(e))),
    collection: sub => refColecao(caminho + "/" + sub),
    acquire: async () => ({ acquired: true })
  };
}
function refColecao(caminho, restricoes = []) {
  const q = () => restricoes.length ? query(fsCollection(fs, caminho), ...restricoes) : fsCollection(fs, caminho);
  return {
    path: caminho,
    where: (f, op, v) => refColecao(caminho, [...restricoes, fsWhere(f, op, v)]),
    orderBy: (f, d) => refColecao(caminho, [...restricoes, fsOrderBy(f, d || "asc")]),
    limit: n => refColecao(caminho, [...restricoes, fsLimit(n)]),
    get: async () => { try { return adaptarQuery(await getDocs(q())); } catch (e) { throw erro(e); } },
    onSnapshot: (next, err) => fsOnSnapshot(q(), s => next(adaptarQuery(s)), e => err && err(erro(e))),
    doc: id => refDoc(caminho + "/" + (id || fsDoc(fsCollection(fs, caminho)).id)),
    add: async data => { try { const r = await addDoc(fsCollection(fs, caminho), data); return refDoc(caminho + "/" + r.id); } catch (e) { throw erro(e); } }
  };
}
const db = { doc: refDoc, collection: c => refColecao(c) };

/* ---------- Usuário ---------- */
const user = {
  id: async () => auth.currentUser ? auth.currentUser.uid : null,
  me: async () => auth.currentUser ? auth.currentUser.uid : null,
  isOwner: () => !!(auth.currentUser && ADMINS.includes(String(auth.currentUser.email || "").toLowerCase())),
  canEdit: () => user.isOwner(),
  can: () => true,
  profiles: async ids => Object.fromEntries((ids || []).map(id => [id, { name: "" }]))
};

/* ---------- IA (Gemini pela função /api/mestre) ---------- */
async function sample(entrada, opts = {}) {
  const prompt = typeof entrada === "string" ? entrada : (entrada || []).map(m => m.content).join("\n\n");
  const token = await auth.currentUser.getIdToken();
  let r;
  try {
    r = await fetch("/api/mestre", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + token },
      body: JSON.stringify({ prompt, tier: opts.modelTier || "default" })
    });
  } catch (e) { throw { code: "unavailable", message: "sem conexão com o servidor" }; }
  if (r.status === 429) throw { code: "rate_limited", message: "limite de mensagens da IA" };
  if (r.status === 401) throw { code: "not_granted", message: "login expirado" };
  if (!r.ok) throw { code: "unavailable", message: await r.text() };
  const j = await r.json();
  return { text: j.text || "", truncated: false };
}

window.claude = {
  use: async nome => {
    if (!configOk) return null;
    await loginPronto;
    if (nome === "db") return db;
    if (nome === "user") return user;
    if (nome === "sample") return sample;
    return null;
  }
};
