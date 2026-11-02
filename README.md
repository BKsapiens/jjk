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
| `api/mestre.js` | Função da Vercel que conversa com o Gemini |
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

## Mudar o jogo

Edite `src/app.src.html` ou `src/data.json`, rode `python3 build.py` e faça commit do `index.html` gerado junto.
