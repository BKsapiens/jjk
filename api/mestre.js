// Função da Vercel: recebe o pedido do jogo, confere se a pessoa está logada no Firebase
// e repassa o texto ao Gemini. A chave do Gemini fica só aqui, nas variáveis de ambiente.
//
// Variáveis de ambiente (Vercel > Project > Settings > Environment Variables):
//   GEMINI_API_KEY          chave do Google AI Studio (obrigatória)
//   FIREBASE_API_KEY        o mesmo apiKey do config.js (obrigatória, usada para conferir o login)
//   GEMINI_MODEL            opcional, modelo da narração (padrão: gemini-3-flash-preview)
//   GEMINI_MODEL_RAPIDO     opcional, modelo das checagens rápidas (padrão: gemini-3.1-flash-lite)

const PADRAO = ["gemini-3-flash-preview", "gemini-3-flash", "gemini-2.5-flash"];
const RAPIDO = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3-flash-preview"];

async function usuarioValido(token) {
  if (!token) return false;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: token })
  });
  if (!r.ok) return false;
  const j = await r.json();
  return Array.isArray(j.users) && j.users.length > 0;
}

async function chamarGemini(modelo, prompt) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 2048 }
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).send("Use POST"); return; }
  if (!process.env.GEMINI_API_KEY || !process.env.FIREBASE_API_KEY) {
    res.status(500).send("Faltam variáveis de ambiente na Vercel: GEMINI_API_KEY e FIREBASE_API_KEY.");
    return;
  }
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  try {
    if (!(await usuarioValido(token))) { res.status(401).send("Login inválido ou expirado."); return; }
  } catch { res.status(502).send("Não consegui conferir o login."); return; }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const prompt = String(body.prompt || "").slice(0, 60000);
  if (!prompt) { res.status(400).send("Pedido vazio."); return; }
  const rapido = body.tier === "quick";
  const preferido = rapido ? process.env.GEMINI_MODEL_RAPIDO : process.env.GEMINI_MODEL;
  const modelos = [...new Set([preferido, ...(rapido ? RAPIDO : PADRAO)].filter(Boolean))];

  for (const modelo of modelos) {
    let r;
    try { r = await chamarGemini(modelo, prompt); }
    catch { res.status(502).send("Falha de rede ao falar com o Gemini."); return; }
    if (r.status === 404) continue; // modelo não existe mais: tenta o próximo da lista
    if (r.status === 429) { res.status(429).send("Limite de mensagens do Gemini atingido."); return; }
    if (!r.ok) { res.status(502).send(`Gemini respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`); return; }
    const j = await r.json();
    const texto = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
    res.status(200).json({ text: texto, modelo });
    return;
  }
  res.status(502).send("Nenhum dos modelos do Gemini configurados está disponível. Defina GEMINI_MODEL na Vercel.");
}
