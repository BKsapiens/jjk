// Testes das rotas da lista de espera e da trava de beta do mestre de IA.
// Rodar: node testes/api.test.js
import { instalarFirebaseFalso, resposta } from "./firebase-falso.js";
const f = instalarFirebaseFalso({ tokens: {
  "tk-ana": { uid: "ana_123456", email: "ana@x.com" },
  "tk-beto": { uid: "beto_123456", email: "beto@x.com" },
  "tk-mestre": { uid: "mestre_123456", email: "bksapiens007@gmail.com" }
} });
const join = (await import("../api/waitlist/join.js")).default;
const admin = (await import("../api/waitlist/admin.js")).default;
const mestre = (await import("../api/mestre.js")).default;
const { TERMS_VERSION } = await import("../legal.js");

let falhas = 0;
const ok = (c, t) => { console.log((c ? "OK    " : "FALHA ") + t); if (!c) falhas++; };
const pedir = async (fn, { metodo = "POST", tk, corpo } = {}) => { const res = resposta(); await fn({ method: metodo, headers: tk ? { authorization: "Bearer " + tk } : {}, body: corpo }, res); return res; };
const valido = { nome: "  Ana  Souza ", comoConheceu: "TikTok", oQueEspera: "Jogar com amigos", ageConfirmed: true, termsAccepted: true };

let r = await pedir(join, { corpo: valido });
ok(r.code === 401, "sem login: 401");
r = await pedir(join, { tk: "tk-falso", corpo: valido });
ok(r.code === 401, "token inválido: 401");
r = await pedir(join, { tk: "tk-ana", corpo: { ...valido, ageConfirmed: false, nome: "", comoConheceu: "Orkut" } });
ok(r.code === 400 && r.corpo.campos.nome && r.corpo.campos.ageConfirmed && r.corpo.campos.comoConheceu, "validação no servidor recusa campos ruins");
r = await pedir(join, { tk: "tk-ana", corpo: { ...valido, oQueEspera: "x".repeat(501) } });
ok(r.code === 400 && r.corpo.campos.oQueEspera, "o que espera com mais de 500 caracteres: recusado");
r = await pedir(join, { tk: "tk-ana", corpo: valido });
ok(r.code === 200 && r.corpo.position === 1 && !r.corpo.jaExistia, "Ana entra como nº 1");
const doc = f.store.get("waitlist/ana_123456");
ok(doc.nome === "Ana Souza" && doc.email === "ana@x.com" && doc.comoConheceu === "TikTok" && doc.ageConfirmed === true && doc.termsAccepted === true && doc.termsVersion === TERMS_VERSION && doc.position === 1 && doc.createdAt?.__ts, "documento gravado com todos os campos");
r = await pedir(join, { tk: "tk-ana", corpo: { ...valido, nome: "Outro nome" } });
ok(r.code === 200 && r.corpo.position === 1 && r.corpo.jaExistia && f.store.get("waitlist/ana_123456").nome === "Ana Souza", "segunda inscrição devolve a existente sem criar outra");
// concorrência: duas pessoas ao mesmo tempo ganham números diferentes
const [rb] = await Promise.all([pedir(join, { tk: "tk-beto", corpo: { ...valido, nome: "Beto" } })]);
ok(rb.corpo.position === 2, "Beto é o nº 2");
ok(f.store.get("meta/waitlist").esperando === 2 && f.store.get("meta/waitlist").ultimaPosicao === 2, "contador: 2 esperando");
// rate limit
let ultimo; for (let i = 0; i < 5; i++) ultimo = await pedir(join, { tk: "tk-beto", corpo: valido });
ok(ultimo.code === 429, "rate limit: 429 depois de muitas tentativas no mesmo minuto");

// mestre de IA: sem beta não passa (com uma chave falsa para passar da checagem de provedor)
process.env.ANTHROPIC_API_KEY = "teste";
r = await pedir(mestre, { tk: "tk-ana", corpo: { prompt: "oi" } });
ok(r.code === 403, "mestre de IA bloqueia quem não tem beta (403)");

// painel
r = await pedir(admin, { metodo: "GET", tk: "tk-ana" });
ok(r.code === 403, "painel recusa quem não é o mestre");
r = await pedir(admin, { metodo: "GET", tk: "tk-mestre" });
ok(r.code === 200 && r.corpo.lista.map(x => x.position).join() === "1,2" && r.corpo.esperando === 2 && r.corpo.liberados === 0, "painel lista a fila em ordem");
r = await pedir(admin, { tk: "tk-mestre", corpo: { acao: "liberar", uid: "ana_123456" } });
ok(r.code === 200 && f.store.get("usuarios/ana_123456").beta === true && f.store.get("meta/waitlist").esperando === 1, "liberar beta: Ana liberada, 1 esperando");
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: "Narração." }] }) });
r = await pedir(mestre, { tk: "tk-ana", corpo: { prompt: "oi" } });
ok(r.code === 200 && r.corpo.text === "Narração.", "mestre de IA responde para quem tem beta");
r = await pedir(mestre, { tk: "tk-mestre", corpo: { prompt: "oi" } });
ok(r.code === 200, "o mestre (admin) sempre usa a IA");
r = await pedir(join, { tk: "tk-ana", corpo: valido });
ok(r.code === 200 && r.corpo.beta === true, "quem já tem beta recebe beta:true no join");
r = await pedir(admin, { tk: "tk-mestre", corpo: { acao: "remover", uid: "beto_123456" } });
ok(r.code === 200 && !f.store.has("waitlist/beto_123456") && f.store.get("meta/waitlist").esperando === 0, "remover: Beto sai da fila, 0 esperando");
r = await pedir(admin, { metodo: "GET", tk: "tk-mestre" });
ok(r.corpo.liberados === 1 && r.corpo.lista.length === 1, "contagem de liberados");
f.store.set("jogadores/velho_123456", { nome: "Ino" });
r = await pedir(admin, { tk: "tk-mestre", corpo: { acao: "liberarJogadoresAtuais" } });
ok(r.code === 200 && f.store.get("usuarios/velho_123456").beta === true, "liberar todos os jogadores atuais");
r = await pedir(admin, { tk: "tk-mestre", corpo: { acao: "liberar", uid: "../hack" } });
ok(r.code === 400, "uid inválido recusado");

console.log(falhas ? `\n${falhas} FALHA(S)` : "\nTudo certo.");
process.exit(falhas ? 1 : 0);
