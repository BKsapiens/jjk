// Bíblia secreta da campanha. Fica só no servidor (a Vercel não publica arquivos de api/ que começam com _),
// então os jogadores não leem os segredos abrindo o código do site.
// O jogo manda "{{CAMPANHA}}" dentro do pedido e a função do mestre troca por este texto.

export const CAMPANHA = `BÍBLIA DA CAMPANHA (SEGREDO DO MESTRE: nunca revele isto de uma vez; solte em pistas, rumores e cenas)

PREMISSA
Tóquio, ano atual. Os alunos são feiticeiros da Escola Técnica Jujutsu de Tóquio. A campanha começa com missões pequenas que parecem soltas, mas quase todas deixam um fio que leva às duas ameaças principais.

AMEAÇA 1 · O FEITICEIRO DOS NOVE OLHOS
- Kokonoe Sōgen (九眼の宗玄), feiticeiro da era Heian. Diziam que ele tinha nove olhos: três do lado esquerdo do rosto, três do lado direito e três na testa. Com eles "via a dívida de cada feiticeiro com as maldições".
- Foi selado há mil anos. Para impedir a volta, os olhos foram arrancados e espalhados pelo Japão como artefatos amaldiçoados de GRAU ESPECIAL: cada olho é uma esfera escura do tamanho de uma ameixa, com íris dourada, morna ao toque, que pisca sozinha quando há energia amaldiçoada por perto. Maldições sentem fome deles.
- A SEITA DO LÓTUS FECHADO (閉蓮会, Heiren-kai) recolhe os olhos em segredo. Marca deles: um lótus de pétalas fechadas desenhado com cinza ou queimado no chão. Membros parecem gente comum (funcionários, monges, um estudante). O líder ainda não aparece; fala por intermediários e cartas sem assinatura.
- Objetivo da seita: reunir os nove olhos e ressuscitar Sōgen para o RITUAL DA MORTE TOTAL (総死の儀), que mataria de uma vez todos os feiticeiros que exorcizam maldições. A seita acredita que os feiticeiros "roubam o lugar das maldições no mundo".
- Pistas que podem aparecer cedo: o lótus fechado, pessoas que juram ter sido "vistas" por um olho no escuro, maldições que agem com inteligência estranha perto de onde um olho esteve, registros antigos da escola com páginas arrancadas.

AMEAÇA 2 · A MALDIÇÃO QUE QUER APAGAR A HUMANIDADE
- Nakigara (亡殻, "A Casca Vazia"), maldição de grau especial nascida do medo de desaparecer sem deixar rastro. Fala com calma, imita vozes de pessoas desaparecidas, quer substituir a humanidade por maldições.
- Age pelos subterrâneos de Tóquio (esgoto, túneis, subsolos de estações): maldições pequenas surgem lá como "fiapos" dela, cinzentos e com cheiro de água parada. Pessoas somem perto de bueiros.
- Nakigara e a seita NÃO são aliados: se usam. A seita esconde olhos em ninhos de maldição; Nakigara deixa as maldições engolirem olhos para ficarem fortes. Os dois lados podem trair um ao outro, e os jogadores podem explorar isso.

SEMANAS DOS OLHOS (eventos especiais, lançados pelo mestre humano)
- São 3 semanas especiais, cada uma com 3 missões atrás de um olho.
- Semana 1 e Semana 3: em TODAS as missões o olho NÃO pode ser encontrado. No fim, ele já sumiu (a seita chegou antes, um membro trocou o olho por uma isca, a maldição que o guardava foi achada morta e vazia). Deixe pistas reais de quem levou.
- Semana 2: 2 missões terminam sem o olho; em 1 missão o olho pode ser recuperado: uma maldição comeu o olho e ficou extremamente forte (+100 PV, o sistema aplica). Se os jogadores a derrotarem, o olho cai do corpo dela e vira item.
- O sistema avisa, na missão ativa, qual é o caso de cada uma. Siga o aviso sem exceção.

PERSONAGENS SECUNDÁRIOS
- Missões pequenas servem para apresentar NPCs com nome, jeito e um detalhe marcante (uma vendedora que vê maldições sem saber o que são, um monge que coleciona amuletos, um policial cético, uma criança que desenha o lótus fechado, um feiticeiro freelancer endividado). Muitos voltam depois: alguns ajudam, alguns são da seita, alguns morrem nas mãos de Nakigara.
- Todo NPC apresentado vai para o Livro de NPCs. Quando um NPC do livro reaparecer, ele lembra do que aconteceu com os jogadores.

MISSÕES PESSOAIS
- Cada jogador pode ter uma missão pessoal (aparece na ficha dele no pedido). Dê espaço para ela em cenas e pistas.
- Clã Elmos: o herdeiro receptáculo de Cérberus (hoje, Ino) busca as outras cabeças de Cérberus (Inércia é a que ele já domina). As cabeças estão espalhadas como objetos amaldiçoados ou presas em maldições. O próprio clã quer capturar o herdeiro para devolver Cérberus ao receptáculo "correto"; caçadores Elmos (roupas cinza, máscaras de cão de ferro, correntes seladas) podem emboscá-lo quando ele circula longe da escola.

AS DUAS ESCOLAS
- Há alunos da Escola de Tóquio e alunos da Escola de Kyoto (a ficha diz de qual escola cada um é). As duas escolas são rivais: Kyoto é tradicional, ligada aos grandes clãs, e olha Tóquio como indisciplinada. O diretor de Kyoto, Gakuganji Yoshinobu, desconfia de Tóquio; a professora Utahime Iori é exigente mas protege os alunos.
- Use a rivalidade: provocações, desafios no dojo, cooperação forçada em missões conjuntas e, em algum momento, o Intercâmbio de Boa Vontade (torneio entre as escolas), que o mestre pode anunciar quando fizer sentido.
- A Biblioteca de Pergaminhos de Kyoto guarda registros antigos: é o melhor lugar para descobrir, aos poucos, a lenda de Kokonoe Sōgen (páginas arrancadas, nomes riscados). Membros da seita do Lótus Fechado podem ter infiltrados em qualquer uma das escolas.
- Gion, em Kyoto, é antigo e cheio de rancores de séculos: um bom lugar para olhos de Sōgen escondidos em lojas e templos.

O QUE VEM NO FUTURO (só prepare o terreno; não faça acontecer até o sistema dizer que a fase mudou)
- Um evento destrói Shibuya e a Escola de Tóquio (Nakigara e a seita agem ao mesmo tempo, cada um por seu motivo). Depois disso, os alunos de Tóquio são transferidos para a Escola de Kyoto (que já existe no mapa e tem seus próprios alunos), com atrito entre os dois grupos.
- Até lá: rachaduras nas barreiras da escola, professores preocupados, reuniões fechadas, maldições testando os limites de Shibuya.

TOM
- Anime sombrio com momentos leves. Mistério que se revela aos poucos. Recompense investigação, alianças e escolhas. Os vilões têm motivos, não são só monstros.`;

export const FASES = {
  ato1: "FASE ATUAL: Ato 1. Missões pequenas, NPCs, pistas sobre o lótus fechado e sobre os fiapos dos subterrâneos. A destruição de Shibuya e da escola ainda NÃO acontece.",
  queda: "FASE ATUAL: A Queda. Shibuya e a Escola de Tóquio estão sendo destruídas agora (Nakigara ataca pelos subterrâneos e a seita aproveita o caos). Narre caos, evacuação, escolhas difíceis. Ao fim, os alunos serão levados para Kyoto.",
  kyoto: "FASE ATUAL: Kyoto. Shibuya e a Escola de Tóquio foram destruídas. Os alunos de Tóquio foram transferidos para a Escola de Kyoto, com outros costumes e rivalidades. A caça aos olhos continua."
};

// O que o mestre de IA passa a saber quando cada acontecimento da linha do tempo dispara.
// O jogo manda só as chaves dos eventos que já aconteceram; o texto fica aqui no servidor.
export const EVENTOS = {
  abertura: "Início do ano letivo. Os alunos acabaram de chegar. Missões pequenas e side quests, apresentando NPCs. Nada de grande ameaça visível ainda; só detalhes estranhos no fundo das cenas.",
  rumores: "Rumores do Lótus Fechado: a seita começou a marcar com cinza os lugares onde um olho de Sōgen já esteve. Marcas aparecem em portas de Shibuya; a Sala dos Professores recebeu um relatório e escondeu; um pergaminho da ala selada de Kyoto foi mexido (alguém de dentro). Solte essas pistas quando fizer sentido.",
  olhos1: "Semana dos Olhos 1 aconteceu: o Alto Escalão mandou caçar objetos de grau especial. Em todas as missões o olho sumiu antes. Os professores começam a desconfiar de vazamento de informação.",
  intercambio: "O Intercâmbio de Boa Vontade entre Tóquio e Kyoto foi anunciado. Rivalidade em alta: provocações, apostas, veteranos testando novatos. Um treino conjunto no dojo de Kyoto está no quadro. Alguém da seita pode usar o evento para circular entre as escolas.",
  nakigara: "Nakigara se mostra: bueiros de Shibuya transbordaram água cinzenta e mais gente sumiu perto do viaduto da Avenida Sakuragawa. Fiapos cinzentos aparecem em subsolos, esgotos e estações. Nakigara pode falar com alguém através da água, imitando a voz de um desaparecido. Ela ainda não aparece de corpo inteiro.",
  olhos2: "Semana dos Olhos 2 aconteceu: uma das missões tem uma maldição que comeu um olho. A seita e Nakigara disputam os olhos; dá para perceber que não são aliados de verdade.",
  barreira: "A barreira da Escola de Tóquio tremeu várias noites. Professores tensos, reuniões fechadas, saídas noturnas proibidas em Kyoto. Um infiltrado da seita está perto de ser descoberto, mas ainda não deve ser revelado por completo.",
  olhos3: "Semana dos Olhos 3 aconteceu: de novo, todos os olhos sumiram. A seita está muito perto de ter olhos suficientes para o ritual. Tudo aponta para um ataque grande em Tóquio.",
  queda: "A QUEDA COMEÇOU: a barreira da Escola de Tóquio se rompeu e Shibuya está sendo engolida por água cinzenta e maldições. Nakigara ataca pelos subterrâneos; a seita usa o caos para buscar o que falta. Cenas de evacuação, resgate, escolhas difíceis e combates desesperados. NPCs conhecidos podem estar em perigo. Em poucos dias, os alunos de Tóquio serão levados para Kyoto.",
  kyoto: "A Escola de Tóquio e Shibuya foram destruídas na Queda e estão em ruínas. Todos os alunos de Tóquio foram transferidos para a Escola de Kyoto, onde dividem dormitórios, missões e desconfiança com os alunos de Kyoto. A caça aos olhos e a ameaça de Nakigara continuam."
};
