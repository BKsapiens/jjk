// Lista de espera: decide o que a pessoa vê depois do login.
//   beta = true (usuarios/{uid})  → entra no jogo
//   já tem waitlist/{uid}          → tela final com o número na fila
//   senão                          → formulário
// A gravação na fila é feita só pelo servidor (/api/waitlist/join). Aqui só lemos os
// próprios documentos e o contador público meta/waitlist, como as regras do Firestore permitem.

import { doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ORIGENS, LIMITE_NOME, LIMITE_ESPERA, validarInscricao } from "./waitlist-regras.js";
import { AVISO_FA } from "./legal.js";

const DISCORD = () => String(window.DISCORD_CONVITE || "").trim();
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const CSS = `
#tela-fila{position:fixed;inset:0;z-index:110;background:#0b0a0c;color:#f3ede6;overflow:auto;font-family:var(--body,system-ui,sans-serif);
  background-image:repeating-linear-gradient(135deg,rgba(211,18,28,.07) 0 2px,transparent 2px 22px)}
#tela-fila *{box-sizing:border-box}
.fila-wrap{max-width:520px;margin:0 auto;padding:20px 16px 28px;display:flex;flex-direction:column;gap:16px;min-height:100%}
.fila-topo{display:flex;align-items:center;gap:12px}
.fila-hanko{width:52px;height:52px;flex:none;display:grid;place-items:center;background:#d3121c;color:#fff;font:900 30px/1 "Shippori Mincho B1",serif;border:3px solid #fff;transform:rotate(-6deg);box-shadow:4px 4px 0 #000}
.fila-topo h1{margin:0;font:900 22px/1.1 "Shippori Mincho B1",serif;letter-spacing:.5px}
.fila-topo small{display:block;color:#b9b0a6;font-size:13px}
.fila-cont{align-self:flex-start;background:#d3121c;color:#fff;font-weight:900;padding:6px 12px;border:2px solid #fff;transform:skew(-8deg);box-shadow:3px 3px 0 #000}
.fila-cont b{font-size:1.15em}
.fila-form{display:flex;flex-direction:column;gap:14px;background:#151216;border:2px solid #2c2530;padding:16px}
.fila-campo{display:flex;flex-direction:column;gap:6px;font-weight:700;font-size:15px}
.fila-campo input[type=text],.fila-campo select,.fila-campo textarea{width:100%;font:inherit;font-weight:400;font-size:16px;color:#fff;background:#0b0a0c;border:2px solid #3a3140;padding:10px 12px;border-radius:0}
.fila-campo textarea{min-height:110px;resize:vertical}
.fila-campo input:focus,.fila-campo select:focus,.fila-campo textarea:focus{outline:none;border-color:#d3121c;box-shadow:0 0 0 3px rgba(211,18,28,.35)}
.fila-campo .conta{align-self:flex-end;font-weight:400;font-size:12px;color:#8f867c}
.fila-erro{color:#ff6b72;font-weight:600;font-size:13px;min-height:0}
.fila-erro:empty{display:none}
.fila-check{display:flex;gap:10px;align-items:flex-start;font-size:15px;line-height:1.4;cursor:pointer}
.fila-check input{width:22px;height:22px;flex:none;margin-top:1px;accent-color:#d3121c}
.fila-check a{color:#ff6b72;font-weight:700}
.fila-discord{display:flex;flex-direction:column;gap:8px;border:2px dashed #d3121c;padding:12px;background:#1a0d10}
.fila-discord p{margin:0}
.fila-bt{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:10px 18px;font:900 16px/1 var(--body,system-ui,sans-serif);text-decoration:none;cursor:pointer;border:3px solid #fff;color:#fff;background:#d3121c;transform:skew(-6deg);box-shadow:4px 4px 0 #000}
.fila-bt:focus-visible{outline:3px solid #f6d32b;outline-offset:2px}
.fila-bt[disabled],.fila-bt[aria-disabled=true]{opacity:.45;cursor:not-allowed}
.fila-bt.discord{background:#5865f2}
.fila-bt.secundario{background:transparent;font-size:13px;min-height:36px;box-shadow:none;border-width:2px}
.fila-geral{background:#3a0b10;border:2px solid #d3121c;padding:10px 12px;font-weight:700}
.fila-geral:empty{display:none}
.fila-final{display:flex;flex-direction:column;align-items:center;text-align:center;gap:16px;padding:28px 16px;background:#0b0a0c;border:3px solid #d3121c;box-shadow:8px 8px 0 #d3121c}
.fila-final .grande{font:900 112px/1 "Shippori Mincho B1",serif;color:#d3121c;text-shadow:4px 4px 0 #000;transform:rotate(-6deg)}
.fila-final h2{margin:0;font:900 24px/1.2 var(--body,system-ui,sans-serif);letter-spacing:.5px}
.fila-final .num{font:900 34px/1.1 var(--body,system-ui,sans-serif);color:#fff;background:#d3121c;padding:8px 16px;transform:skew(-8deg);border:3px solid #fff}
.fila-final p{margin:0;color:#d9d0c6}
.fila-rodape{margin-top:auto;padding-top:10px;text-align:center;font-size:12px;color:#8f867c;line-height:1.5}
.fila-rodape a{color:#c9c0b6}
.fila-carregando{display:grid;place-items:center;min-height:60vh;font-weight:700;color:#b9b0a6}
@media (min-width:700px){.fila-wrap{padding-top:40px}.fila-final .grande{font-size:140px}}
`;

export function rodapeHtml() {
  return `<p class="fila-rodape">${esc(AVISO_FA)}<br><a href="/termos" target="_blank" rel="noopener">Termos de Uso</a> · <a href="/privacidade" target="_blank" rel="noopener">Privacidade</a></p>`;
}

function blocoDiscord(texto) {
  const url = DISCORD();
  return `<div class="fila-discord"><p>${esc(texto)}</p>${url
    ? `<a class="fila-bt discord" href="${esc(url)}" target="_blank" rel="noopener">Entrar no Discord</a>`
    : `<span class="fila-bt discord" aria-disabled="true">Convite do Discord em breve</span>`}</div>`;
}

/* Decide a tela. liberar() entra no jogo; sair() desloga. */
export async function portaoListaEspera({ fs, user, liberar, sair }) {
  let tela = document.getElementById("tela-fila");
  if (!document.getElementById("css-fila")) { const st = document.createElement("style"); st.id = "css-fila"; st.textContent = CSS; document.head.appendChild(st); }
  if (!tela) { tela = document.createElement("div"); tela.id = "tela-fila"; document.body.appendChild(tela); }
  tela.hidden = false;
  tela.innerHTML = `<div class="fila-wrap"><div class="fila-carregando">Conferindo seu acesso…</div>${rodapeHtml()}</div>`;

  const desligar = [];
  const fechar = () => { desligar.forEach(f => { try { f(); } catch {} }); tela.hidden = true; tela.innerHTML = ""; };

  // Se o beta for liberado enquanto a pessoa está nesta tela, entra no jogo na hora.
  let entrou = false;
  const entrar = () => { if (entrou) return; entrou = true; fechar(); liberar(); };
  desligar.push(onSnapshot(doc(fs, "usuarios", user.uid), s => { if (s.exists() && s.data()?.beta === true) entrar(); }, () => {}));
  try {
    const u = await getDoc(doc(fs, "usuarios", user.uid));
    if (u.exists() && u.data()?.beta === true) { entrar(); return; }
  } catch { /* sem documento ou regras antigas: segue para a fila */ }
  if (entrou) return;

  let fila = null;
  try { const f = await getDoc(doc(fs, "waitlist", user.uid)); if (f.exists()) fila = f.data(); }
  catch (e) {
    console.error("Lista de espera (leitura):", e);
    tela.innerHTML = `<div class="fila-wrap"><div class="fila-geral">Não consegui conferir sua vaga. Recarregue a página. Se continuar, avise o mestre: as regras do banco (firestore.rules) provavelmente ainda não foram publicadas.<br><code style="font-weight:400;font-size:12px">${esc((e && e.code) || "")} ${esc((e && e.message) || "")}</code></div>${botaoSair()}${rodapeHtml()}</div>`;
    tela.querySelector("[data-fila-sair]")?.addEventListener("click", sair);
    return;
  }
  if (fila) mostrarFinal(fila.position); else mostrarFormulario();

  function cabecalho() {
    return `<header class="fila-topo"><div class="fila-hanko" aria-hidden="true">呪</div><div><h1>Era dos Feiticeiros</h1><small>Lista de espera do beta</small></div></header>`;
  }
  function botaoSair() { return `<button type="button" class="fila-bt secundario" data-fila-sair style="align-self:center">Sair (${esc(user.email || "conta")})</button>`; }

  function mostrarFinal(pos) {
    tela.innerHTML = `<div class="fila-wrap">${cabecalho()}
      <section class="fila-final" aria-live="polite">
        <div class="grande" aria-hidden="true">呪</div>
        <h2>BOA, VOCÊ CONCLUIU O FORMULÁRIO!</h2>
        <div class="num">VOCÊ É O Nº ${esc(pos)} NA FILA!</div>
        ${blocoDiscord("Fique de olho em #novidades.")}
      </section>${botaoSair()}${rodapeHtml()}</div>`;
    tela.querySelector("[data-fila-sair]").addEventListener("click", sair);
  }

  function mostrarFormulario() {
    tela.innerHTML = `<div class="fila-wrap">${cabecalho()}
      <p class="fila-cont" id="fila-cont" aria-live="polite"><b>…</b> pessoas esperando</p>
      <p style="margin:0;color:#d9d0c6">O jogo está em beta fechado. Preencha o formulário para entrar na fila: avisamos quando sua vaga abrir.</p>
      <form class="fila-form" id="fila-form" novalidate>
        <label class="fila-campo">Nome
          <input type="text" name="nome" maxlength="${LIMITE_NOME}" autocomplete="name" required aria-describedby="erro-nome">
          <span class="fila-erro" id="erro-nome" role="alert"></span></label>
        <label class="fila-campo">Por onde conheceu
          <select name="comoConheceu" required aria-describedby="erro-comoConheceu"><option value="">Escolha uma opção</option>${ORIGENS.map(o => `<option>${esc(o)}</option>`).join("")}</select>
          <span class="fila-erro" id="erro-comoConheceu" role="alert"></span></label>
        <label class="fila-campo">O que espera do site
          <textarea name="oQueEspera" maxlength="${LIMITE_ESPERA}" required aria-describedby="erro-oQueEspera conta-espera"></textarea>
          <span class="conta" id="conta-espera">0/${LIMITE_ESPERA}</span>
          <span class="fila-erro" id="erro-oQueEspera" role="alert"></span></label>
        ${blocoDiscord("Entre no Discord para saber primeiro quando sua vaga abrir")}
        <label class="fila-check"><input type="checkbox" name="ageConfirmed" required> <span>Confirmo que tenho 13 anos ou mais</span></label>
        <span class="fila-erro" id="erro-ageConfirmed" role="alert"></span>
        <label class="fila-check"><input type="checkbox" name="termsAccepted" required> <span>Li e concordo com os <a href="/termos" target="_blank" rel="noopener">Termos de Uso</a></span></label>
        <span class="fila-erro" id="erro-termsAccepted" role="alert"></span>
        <div class="fila-geral" id="fila-geral" role="alert"></div>
        <button type="submit" class="fila-bt" id="fila-enviar" disabled>Entrar na fila</button>
      </form>${botaoSair()}${rodapeHtml()}</div>`;

    const form = tela.querySelector("#fila-form"), bt = tela.querySelector("#fila-enviar"), geral = tela.querySelector("#fila-geral");
    tela.querySelector("[data-fila-sair]").addEventListener("click", sair);
    desligar.push(onSnapshot(doc(fs, "meta", "waitlist"), s => {
      const n = s.exists() ? (+s.data()?.esperando || 0) : 0;
      const el = tela.querySelector("#fila-cont"); if (el) el.innerHTML = `<b>${n.toLocaleString("pt-BR")}</b> ${n === 1 ? "pessoa esperando" : "pessoas esperando"}`;
    }, () => { const el = tela.querySelector("#fila-cont"); if (el) el.hidden = true; }));

    const tocados = new Set();
    let enviando = false, errosServidor = {};
    const ler = () => ({
      nome: form.nome.value, comoConheceu: form.comoConheceu.value, oQueEspera: form.oQueEspera.value,
      ageConfirmed: form.ageConfirmed.checked, termsAccepted: form.termsAccepted.checked
    });
    const mostrarErros = (erros, todos) => {
      for (const k of ["nome", "comoConheceu", "oQueEspera", "ageConfirmed", "termsAccepted"]) {
        const el = tela.querySelector("#erro-" + k); if (!el) continue;
        const msg = errosServidor[k] || ((todos || tocados.has(k)) ? (erros[k] || "") : "");
        el.textContent = msg;
        const campo = form.elements[k]; if (campo) campo.setAttribute("aria-invalid", msg ? "true" : "false");
      }
    };
    const atualizar = () => {
      const v = validarInscricao(ler());
      tela.querySelector("#conta-espera").textContent = `${form.oQueEspera.value.length}/${LIMITE_ESPERA}`;
      bt.disabled = !v.ok || enviando;
      mostrarErros(v.erros, false);
      return v;
    };
    form.addEventListener("input", e => { if (e.target.name) { tocados.add(e.target.name); delete errosServidor[e.target.name]; } geral.textContent = ""; atualizar(); });
    form.addEventListener("change", e => { if (e.target.name) { tocados.add(e.target.name); delete errosServidor[e.target.name]; } atualizar(); });
    form.addEventListener("focusout", e => { if (e.target.name) { tocados.add(e.target.name); atualizar(); } });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (enviando) return;
      const v = atualizar();
      if (!v.ok) { mostrarErros(v.erros, true); return; }
      enviando = true; bt.disabled = true; bt.textContent = "Entrando na fila…"; geral.textContent = "";
      try {
        const token = await user.getIdToken();
        let r;
        try {
          r = await fetch("/api/waitlist/join", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + token }, body: JSON.stringify(v.dados) });
        } catch { throw new Error("Sem conexão. Confira sua internet e tente de novo."); }
        let j = {}; try { j = await r.json(); } catch {}
        if (r.ok && j.beta) { entrar(); return; }
        if (r.ok && j.position) { mostrarFinal(j.position); return; }
        if (r.status === 400 && j.campos) { errosServidor = { ...j.campos }; Object.keys(j.campos).forEach(k => tocados.add(k)); throw new Error(j.erro || "Confira os campos."); }
        throw new Error(j.erro || (r.status === 429 ? "Muitas tentativas seguidas. Espere um minuto." : "Não deu para entrar na fila agora. Tente de novo."));
      } catch (err) {
        geral.textContent = err.message || "Algo deu errado. Tente de novo.";
        enviando = false; bt.textContent = "Entrar na fila"; atualizar();
      }
    });
  }
}
