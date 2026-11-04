# Era dos Feiticeiros RPG

RPG de Jujutsu Kaisen (sistema Era dos Feiticeiros 0.3) com mestre de IA: criador de ficha, mapa de Tóquio, canais por local, combate, duelos, missões, inventário e painel do mestre.

Roda na Vercel, com:
- **Firebase Firestore** como banco de dados em tempo real (fichas, chat, combates, missões);
- **Login com Google** pelo Firebase Authentication;
- **Claude (Haiku 5.5)** ou **Gemini** como mestre, chamado pela função `api/mestre.js` (a chave fica só na Vercel).

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | O jogo pronto (gerado pelo `build.py`) |
| `src/app.src.html`, `src/data.json` | Código do jogo e regras extraídas do livro |
| `plataforma.js` | Liga o jogo ao Firebase, ao login e à função do Gemini |
| `config.js` | Configuração do Firebase e e-mail do mestre |
| `api/mestre.js` | Função da Vercel que conversa com a IA (só com beta) |
| `api/waitlist/join.js`, `api/waitlist/admin.js`, `api/_firebase.js` | Lista de espera, painel e acesso de servidor ao Firebase |
| `listaespera.js`, `waitlist-regras.js`, `legal.js` | Tela da lista de espera, regras do formulário, versão dos termos |
| `termos/`, `privacidade/`, `legal.css` | Páginas de Termos de Uso e Privacidade |
| `testes/` | Testes locais das rotas da API |
| `firestore.rules` | Regras de segurança do banco |
| `build.py` | Gera o `index.html` a partir de `src/` |

## Configuração (uma vez só)

### 1. Firebase
1. Entre em https://console.firebase.google.com e crie um projeto (pode desativar o Google Analytics).
2. **Authentication** > Começar > Método de login > **Google** > Ativar > Salvar.
3. **Firestore Database** > Criar banco de dados > modo de produção > escolha a região (ex.: `southamerica-east1`).
4. Em **Firestore > Regras**, cole o conteúdo de `firestore.rules`, troque `seu-email@gmail.com` pelo e-mail do mestre e clique em **Publicar**.
5. **Configurações do projeto** (engrenagem) > Seus apps > ícone `</>` (Web) > registre o app. Copie os valores do `firebaseConfig` para o `config.js`.
6. No `config.js`, coloque o e-mail do mestre em `ADMINS`.

### 2. IA do mestre (Claude ou Gemini)
- **Claude:** em https://platform.claude.com, compre créditos em Billing e crie uma chave em API Keys (começa com `sk-ant-`).
- **Gemini:** em https://aistudio.google.com/apikey, clique em **Create API key** (começa com `AIza`).
- Não coloque a chave no código: ela vai só na Vercel (passo 3). Se as duas existirem, o Claude é usado.

### 3. Vercel
1. Em https://vercel.com, entre com o GitHub e clique em **Add New > Project**.
2. Escolha este repositório. Framework: **Other**. Não precisa de comando de build.
3. Em **Environment Variables**, adicione:
   - `FIREBASE_API_KEY` = o mesmo `apiKey` do `config.js`
   - `ANTHROPIC_API_KEY` = a chave do Claude Console (mestre com Claude Haiku 5.5)
   - ou `GEMINI_API_KEY` = a chave do AI Studio (mestre com Gemini)
   - (opcional) `CLAUDE_MODEL` / `GEMINI_MODEL` para trocar o modelo da narração, e `MESTRE_PROVEDOR` (`claude` ou `gemini`) para escolher quando as duas chaves existirem
4. Clique em **Deploy**.
5. Depois do primeiro deploy, copie o domínio do site (ex.: `jjk.vercel.app`) e adicione em **Firebase > Authentication > Configurações > Domínios autorizados**. Sem isso o login com Google não abre.

Pronto: a cada push no GitHub, a Vercel publica a versão nova sozinha.

## Lista de espera (beta fechado)

Depois do login, o site decide a tela:
- `usuarios/{uid}.beta == true` (ou e-mail do mestre) → entra no jogo;
- já tem `waitlist/{uid}` → tela final com o número na fila;
- senão → formulário.

Só o servidor grava fila, contador e beta (rotas `api/waitlist/join.js` e `api/waitlist/admin.js`, com `firebase-admin`).
O mestre de IA (`api/mestre.js`) e as regras do Firestore também exigem beta.

Configuração extra na Vercel (Environment Variables):
- `FIREBASE_SERVICE_ACCOUNT` = JSON da conta de serviço (Firebase > Configurações do projeto > Contas de serviço > Gerar nova chave privada). Pode colar o JSON inteiro ou em base64.
- (opcional) `ADMIN_EMAILS` = e-mails do mestre separados por vírgula (padrão: o do `config.js`).
- `FIREBASE_API_KEY` não é mais usada.

Outras constantes:
- `config.js` → `DISCORD_CONVITE` (link do convite do Discord).
- `legal.js` → `TERMS_VERSION` (versão dos termos) e o aviso de fã do rodapé.
- `waitlist-regras.js` → opções de "Por onde conheceu" e limites de caracteres.

Antes do primeiro deploy com a lista: publique o `firestore.rules` novo e, no Painel do mestre, use "Liberar todos os jogadores atuais" para quem já jogava não ficar preso na fila.

Testes locais das rotas: `npm install` e depois `node testes/api.test.js`.

## Mudar o jogo

Edite `src/app.src.html` ou `src/data.json`, rode `python3 build.py` e faça commit do `index.html` gerado junto.
