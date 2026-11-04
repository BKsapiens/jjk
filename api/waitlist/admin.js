// /api/waitlist/admin — só para o e-mail do mestre (ADMIN_EMAILS).
// GET  → lista da fila (ordenada por position) + quantos esperam e quantos têm beta.
// POST { acao: "liberar", uid }            → marca usuarios/{uid}.beta = true e tira da contagem de espera.
// POST { acao: "remover", uid }            → apaga waitlist/{uid} e tira o beta, se tiver.
// POST { acao: "liberarJogadoresAtuais" }  → libera beta para todo mundo que já tem personagem (coleção jogadores).

import { fb, usuarioDoPedido, limitar, lerCorpo, responderErro, ErroHttp } from "../_firebase.js";

const quando = v => (v && typeof v.toMillis === "function") ? v.toMillis() : (+v || null);

export default async function handler(req, res) {
  try {
    const u = await usuarioDoPedido(req);
    if (!u.admin) throw new ErroHttp(403, "Só o mestre pode usar o painel da lista de espera.");
    await limitar(u.uid, "waitlist-admin", 60, 60_000);
    const { db, FieldValue } = fb();
    const refMeta = db.doc("meta/waitlist");

    if (req.method === "GET") {
      const [fila, meta, liberados] = await Promise.all([
        db.collection("waitlist").orderBy("position", "asc").limit(500).get(),
        refMeta.get(),
        db.collection("usuarios").where("beta", "==", true).count().get()
      ]);
      const lista = fila.docs.map(d => {
        const x = d.data();
        return { uid: d.id, position: x.position, nome: x.nome, email: x.email, comoConheceu: x.comoConheceu, oQueEspera: x.oQueEspera,
          termsVersion: x.termsVersion, liberado: x.liberado === true, createdAt: quando(x.createdAt) };
      });
      res.status(200).json({ lista, esperando: +(meta.exists ? meta.data().esperando : 0) || 0, liberados: liberados.data().count });
      return;
    }

    if (req.method !== "POST") throw new ErroHttp(405, "Use GET ou POST.");
    const b = lerCorpo(req);

    if (b.acao === "liberarJogadoresAtuais") {
      const jog = await db.collection("jogadores").select().get();
      let n = 0, lote = db.batch();
      for (const d of jog.docs) {
        lote.set(db.doc("usuarios/" + d.id), { beta: true, liberadoEm: FieldValue.serverTimestamp(), liberadoPor: u.email }, { merge: true });
        if (++n % 400 === 0) { await lote.commit(); lote = db.batch(); }
      }
      await lote.commit();
      res.status(200).json({ ok: true, liberados: n });
      return;
    }

    const uid = String(b.uid || "");
    if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid)) throw new ErroHttp(400, "Jogador inválido.");
    const refFila = db.doc("waitlist/" + uid), refUsu = db.doc("usuarios/" + uid);

    if (b.acao === "liberar") {
      await db.runTransaction(async t => {
        const [fila, meta] = await Promise.all([t.get(refFila), t.get(refMeta)]);
        const esperava = fila.exists && fila.data().liberado !== true;
        t.set(refUsu, { beta: true, liberadoEm: FieldValue.serverTimestamp(), liberadoPor: u.email }, { merge: true });
        if (fila.exists) t.update(refFila, { liberado: true, liberadoEm: FieldValue.serverTimestamp() });
        if (esperava) t.set(refMeta, { esperando: Math.max(0, (+meta.data()?.esperando || 0) - 1) }, { merge: true });
      });
      res.status(200).json({ ok: true });
      return;
    }

    if (b.acao === "remover") {
      await db.runTransaction(async t => {
        const [fila, meta] = await Promise.all([t.get(refFila), t.get(refMeta)]);
        const esperava = fila.exists && fila.data().liberado !== true;
        if (fila.exists) t.delete(refFila);
        t.set(refUsu, { beta: false, removidoEm: FieldValue.serverTimestamp() }, { merge: true });
        if (esperava) t.set(refMeta, { esperando: Math.max(0, (+meta.data()?.esperando || 0) - 1) }, { merge: true });
      });
      res.status(200).json({ ok: true });
      return;
    }

    throw new ErroHttp(400, "Ação desconhecida.");
  } catch (e) { responderErro(res, e); }
}
