// POST /api/waitlist/join
// Entra na lista de espera. Confere o login, valida os campos e, numa transação do Firestore,
// pega o próximo número do contador (meta/waitlist) e grava waitlist/{uid}.
// Se a pessoa já estiver na fila, não cria outro cadastro: devolve o que já existe.
// Se já tiver beta liberado, avisa e não cria nada.

import { fb, usuarioDoPedido, temBeta, limitar, lerCorpo, responderErro, ErroHttp } from "../_firebase.js";
import { validarInscricao } from "../../waitlist-regras.js";
import { TERMS_VERSION } from "../../legal.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ erro: "Use POST." }); return; }
  try {
    const u = await usuarioDoPedido(req);
    await limitar(u.uid, "waitlist-join", 5, 60_000);

    if (await temBeta(u)) { res.status(200).json({ beta: true }); return; }

    const v = validarInscricao(lerCorpo(req));
    if (!v.ok) { res.status(400).json({ erro: "Confira os campos do formulário.", campos: v.erros }); return; }

    const { db, FieldValue } = fb();
    const refFila = db.doc("waitlist/" + u.uid);
    const refMeta = db.doc("meta/waitlist");

    const r = await db.runTransaction(async t => {
      const [fila, meta] = await Promise.all([t.get(refFila), t.get(refMeta)]);
      if (fila.exists) return { position: fila.data().position, jaExistia: true };
      const m = meta.exists ? meta.data() : {};
      const position = (+m.ultimaPosicao || 0) + 1;
      t.set(refMeta, { ultimaPosicao: position, esperando: (+m.esperando || 0) + 1, atualizado: FieldValue.serverTimestamp() }, { merge: true });
      t.set(refFila, {
        uid: u.uid,
        nome: v.dados.nome,
        email: u.email,
        comoConheceu: v.dados.comoConheceu,
        oQueEspera: v.dados.oQueEspera,
        ageConfirmed: true,
        termsAccepted: true,
        termsVersion: TERMS_VERSION,
        position,
        createdAt: FieldValue.serverTimestamp()
      });
      return { position, jaExistia: false };
    });

    res.status(200).json({ ok: true, position: r.position, jaExistia: r.jaExistia });
  } catch (e) {
    if (!(e instanceof ErroHttp)) e = Object.assign(new ErroHttp(500, "Não deu para entrar na fila agora. Tente de novo em instantes."), { causa: e });
    if (e.causa) console.error(e.causa);
    responderErro(res, e);
  }
}
