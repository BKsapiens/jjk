// Acesso de servidor ao Firebase (firebase-admin) para as funções da Vercel.
// Credencial: variável de ambiente FIREBASE_SERVICE_ACCOUNT com o JSON da conta de serviço
// (Firebase > Configurações do projeto > Contas de serviço > Gerar nova chave privada).
// Pode colar o JSON inteiro ou o JSON em base64.
//
// ADMIN_EMAILS (opcional): e-mails do mestre separados por vírgula. Padrão: bksapiens007@gmail.com

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export class ErroHttp extends Error {
  constructor(status, mensagem) { super(mensagem); this.status = status; }
}

let cache = null;
export function fb() {
  if (globalThis.__firebaseFalso) return globalThis.__firebaseFalso; // usado só nos testes locais
  if (cache) return cache;
  const bruto = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!bruto) throw new ErroHttp(500, "Falta a variável FIREBASE_SERVICE_ACCOUNT na Vercel (JSON da conta de serviço do Firebase).");
  let conta;
  try { conta = JSON.parse(bruto); }
  catch {
    try { conta = JSON.parse(Buffer.from(bruto, "base64").toString("utf8")); }
    catch { throw new ErroHttp(500, "FIREBASE_SERVICE_ACCOUNT não é um JSON válido."); }
  }
  const app = getApps()[0] || initializeApp({ credential: cert(conta) });
  cache = { auth: getAuth(app), db: getFirestore(app), FieldValue };
  return cache;
}

export const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || "bksapiens007@gmail.com")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

/* Confere o ID token do Firebase mandado no cabeçalho Authorization: Bearer <token>. */
export async function usuarioDoPedido(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new ErroHttp(401, "Faça login para continuar.");
  let dec;
  try { dec = await fb().auth.verifyIdToken(token); }
  catch (e) { if (e instanceof ErroHttp) throw e; throw new ErroHttp(401, "Login inválido ou expirado. Entre de novo."); }
  const email = String(dec.email || "").toLowerCase();
  return { uid: dec.uid, email, admin: !!email && ADMIN_EMAILS.includes(email) && dec.email_verified !== false };
}

/* Beta: só o servidor grava usuarios/{uid}.beta. O mestre sempre tem acesso. */
export async function temBeta(u) {
  if (u.admin) return true;
  const d = await fb().db.doc("usuarios/" + u.uid).get();
  return d.exists && d.data()?.beta === true;
}

/* Limite simples por uid, guardado no Firestore (vale entre instâncias da Vercel).
   max pedidos por janela (ms). Lança 429 quando passa. */
export async function limitar(uid, chave, max, janelaMs) {
  const { db } = fb();
  const ref = db.doc(`limites/${chave}__${uid}`);
  const agora = Date.now();
  const ok = await db.runTransaction(async t => {
    const s = await t.get(ref);
    const d = s.exists ? s.data() : null;
    if (!d || agora - (+d.inicio || 0) > janelaMs) { t.set(ref, { inicio: agora, n: 1 }); return true; }
    if ((+d.n || 0) >= max) return false;
    t.set(ref, { inicio: d.inicio, n: (+d.n || 0) + 1 });
    return true;
  });
  if (!ok) throw new ErroHttp(429, "Muitas tentativas seguidas. Espere um minuto e tente de novo.");
}

export function lerCorpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { throw new ErroHttp(400, "Pedido inválido."); }
}

/* Responde erros de forma padronizada (JSON com a mensagem em português). */
export function responderErro(res, e) {
  const status = e instanceof ErroHttp ? e.status : 500;
  if (!(e instanceof ErroHttp)) console.error(e);
  res.status(status).json({ erro: e instanceof ErroHttp ? e.message : "Erro interno. Tente de novo em instantes." });
}
