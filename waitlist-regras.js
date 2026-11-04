// Regras do formulário da lista de espera. Usadas no navegador (validação na hora)
// e no servidor (api/waitlist/join.js), para as duas validações serem sempre iguais.

export const ORIGENS = ["Instagram", "TikTok", "YouTube", "Amigo", "Discord", "Outro"];
export const LIMITE_NOME = 60;
export const LIMITE_ESPERA = 500;

const limpar = v => String(v ?? "").replace(/\s+/g, " ").trim();

/* Devolve { ok, dados, erros }. erros é um objeto campo -> mensagem. */
export function validarInscricao(entrada) {
  const e = entrada || {};
  const dados = {
    nome: limpar(e.nome),
    comoConheceu: limpar(e.comoConheceu),
    oQueEspera: String(e.oQueEspera ?? "").trim(),
    ageConfirmed: e.ageConfirmed === true,
    termsAccepted: e.termsAccepted === true
  };
  const erros = {};
  if (!dados.nome) erros.nome = "Escreva seu nome.";
  else if (dados.nome.length > LIMITE_NOME) erros.nome = `O nome pode ter no máximo ${LIMITE_NOME} caracteres.`;
  if (!ORIGENS.includes(dados.comoConheceu)) erros.comoConheceu = "Escolha por onde você conheceu o site.";
  if (!dados.oQueEspera) erros.oQueEspera = "Conte o que você espera do site.";
  else if (dados.oQueEspera.length > LIMITE_ESPERA) erros.oQueEspera = `Use no máximo ${LIMITE_ESPERA} caracteres.`;
  if (!dados.ageConfirmed) erros.ageConfirmed = "Confirme que você tem 13 anos ou mais.";
  if (!dados.termsAccepted) erros.termsAccepted = "Aceite os Termos de Uso para continuar.";
  return { ok: Object.keys(erros).length === 0, dados, erros };
}
