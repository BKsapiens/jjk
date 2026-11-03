// Função da Vercel: recebe o pedido do jogo, confere se a pessoa está logada no Firebase
// e repassa o texto para a IA do mestre (Claude ou Gemini). As chaves ficam só aqui,
// nas variáveis de ambiente da Vercel, nunca no código do site.
//
// Variáveis de ambiente (Vercel > Project > Settings > Environment Variables):
//   FIREBASE_API_KEY      o mesmo apiKey do config.js (obrigatória, usada para conferir o login)
//
//   ANTHROPIC_API_KEY     chave do Claude Console (platform.claude.com). Se existir, o mestre usa o Claude.
//   CLAUDE_MODEL          opcional, modelo da narração (padrão: claude-haiku-5-5)
//   CLAUDE_MODEL_RAPIDO   opcional, modelo das checagens rápidas (padrão: claude-haiku-5-5)
//
//   GEMINI_API_KEY        chave do Google AI Studio. Usada se não houver ANTHROPIC_API_KEY.
//   GEMINI_MODEL          opcional, modelo da narração (padrão: gemini-3-flash-preview)
//   GEMINI_MODEL_RAPIDO   opcional, modelo das checagens rápidas (padrão: gemini-3.1-flash-lite)
//
//   MESTRE_PROVEDOR       opcional: "claude" ou "gemini", para forçar um dos dois quando as duas chaves existirem.

import { CAMPANHA, FASES, EVENTOS, ROTEIROS } from "./_campanha.js";

const GEMINI_PADRAO = ["gemini-3-flash-preview", "gemini-3-flash", "gemini-2.5-flash"];
const GEMINI_RAPIDO = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3-flash-preview"];

async function usuarioValido(token) {
  if (!token) return false;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: token })
  });
  if (!r.ok) return false;
  const j = await r.json();
  return Array.isArray(j.users) && j.users.length > 0;
}

function escolherProvedor() {
  const forcado = String(process.env.MESTRE_PROVEDOR || "").toLowerCase();
  if (forcado === "claude" && process.env.ANTHROPIC_API_KEY) return "claude";
  if (forcado === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

// ---------- Claude ----------
// Cache do prompt: tudo antes de {{FIXO_FIM}} (regras, campanha, "como narrar") é igual em todo pedido.
// O Claude guarda essa parte por 5 minutos (renovados a cada uso) e cobra 1/10 do preço para relê-la.
const MARCA_FIXO = "{{FIXO_FIM}}";
function blocosClaude(prompt) {
  const i = prompt.indexOf(MARCA_FIXO);
  if (i < 0) return prompt;
  const fixo = prompt.slice(0, i), resto = prompt.slice(i + MARCA_FIXO.length);
  return [
    { type: "text", text: fixo, cache_control: { type: "ephemeral" } },
    { type: "text", text: resto }
  ];
}

async function responderClaude(prompt, rapido) {
  const modelo = (rapido ? process.env.CLAUDE_MODEL_RAPIDO : process.env.CLAUDE_MODEL) || "claude-haiku-5-5";
  let r;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: rapido ? 1024 : 4096,
        messages: [{ role: "user", content: blocosClaude(prompt) }]
      })
    });
  } catch { return { status: 502, erro: "Falha de rede ao falar com o Claude." }; }
  if (r.status === 429 || r.status === 529) return { status: 429, erro: "Limite de mensagens do Claude atingido." };
  if (r.status === 401) return { status: 500, erro: "A ANTHROPIC_API_KEY na Vercel está errada ou foi revogada." };
  if (r.status === 400) {
    const t = await r.text();
    if (/credit|balance/i.test(t)) return { status: 402, erro: "Os créditos da API do Claude acabaram. Adicione créditos no Claude Console." };
    return { status: 502, erro: `Claude recusou o pedido: ${t.slice(0, 300)}` };
  }
  if (!r.ok) return { status: 502, erro: `Claude respondeu ${r.status}: ${(await r.text()).slice(0, 300)}` };
  const j = await r.json();
  const texto = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  return { status: 200, texto, modelo, uso: j.usage };
}

// ---------- Gemini ----------
async function responderGemini(prompt, rapido) {
  const preferido = rapido ? process.env.GEMINI_MODEL_RAPIDO : process.env.GEMINI_MODEL;
  const modelos = [...new Set([preferido, ...(rapido ? GEMINI_RAPIDO : GEMINI_PADRAO)].filter(Boolean))];
  for (const modelo of modelos) {
    let r;
    try {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, maxOutputTokens: 4096 } })
      });
    } catch { return { status: 502, erro: "Falha de rede ao falar com o Gemini." }; }
    if (r.status === 404) continue; // modelo não existe mais: tenta o próximo da lista
    if (r.status === 429) return { status: 429, erro: "Limite de mensagens do Gemini atingido." };
    if (!r.ok) return { status: 502, erro: `Gemini respondeu ${r.status}: ${(await r.text()).slice(0, 300)}` };
    const j = await r.json();
    const texto = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
    return { status: 200, texto, modelo };
  }
  return { status: 502, erro: "Nenhum dos modelos do Gemini configurados está disponível. Defina GEMINI_MODEL na Vercel." };
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).send("Use POST"); return; }
  if (!process.env.FIREBASE_API_KEY) { res.status(500).send("Falta a variável FIREBASE_API_KEY na Vercel."); return; }
  const provedor = escolherProvedor();
  if (!provedor) { res.status(500).send("Falta a chave da IA na Vercel: ANTHROPIC_API_KEY (Claude) ou GEMINI_API_KEY (Gemini)."); return; }

  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  try {
    if (!(await usuarioValido(token))) { res.status(401).send("Login inválido ou expirado."); return; }
  } catch { res.status(502).send("Não consegui conferir o login."); return; }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  let prompt = String(body.prompt || "").slice(0, 60000);
  if (prompt.includes("{{CAMPANHA}}")) {
    const fase = FASES[body.fase] || FASES.ato1;
    const ocorridos = (Array.isArray(body.eventos) ? body.eventos : []).filter(k => EVENTOS[k]);
    const linha = ocorridos.length ? "\n\nACONTECIMENTOS JÁ OCORRIDOS NA CAMPANHA (em ordem; o mundo reflete isso):\n" + ocorridos.map(k => "- " + EVENTOS[k]).join("\n") : "";
    prompt = prompt.replace("{{CAMPANHA}}", CAMPANHA + "\n\n" + fase + linha);
  }
  if (!prompt) { res.status(400).send("Pedido vazio."); return; }
  prompt = prompt.replace(/\{\{ROTEIRO:([a-z0-9]+)\}\}/g, (_, k) => ROTEIROS[k] || "(roteiro não encontrado: conduza como missão comum)");
  const rapido = body.tier === "quick";

  const r = provedor === "claude" ? await responderClaude(prompt, rapido) : await responderGemini(prompt.replace(MARCA_FIXO, ""), rapido);
  if (r.status !== 200) { res.status(r.status).send(r.erro); return; }
  const u = r.uso || {};
  res.status(200).json({ text: r.texto, modelo: r.modelo, provedor, uso: r.uso ? { entrada: u.input_tokens, cacheLido: u.cache_read_input_tokens || 0, cacheGravado: u.cache_creation_input_tokens || 0, saida: u.output_tokens } : undefined });
}
