"""Monta o index.html publicado na Vercel a partir de src/app.src.html e src/data.json.

Uso:  python3 build.py
Depois faça commit do index.html gerado (a Vercel serve os arquivos estáticos da raiz).
"""
import json, pathlib

raiz = pathlib.Path(__file__).parent
html = (raiz / "src" / "app.src.html").read_text(encoding="utf-8")
dados = (raiz / "src" / "data.json").read_text(encoding="utf-8")
json.loads(dados)  # garante que o JSON é válido

troca = {
    "/*__DATA__*/": dados,
    # a camada de plataforma (login + Firebase + Gemini) entra antes do jogo
    "<script>\nconst DATA =": '<script src="/config.js"></script>\n<script type="module" src="/plataforma.js"></script>\n<script>\nconst DATA =',
    # o login pode demorar: espera a plataforma por mais tempo
    "for(let i=0;i<30&&!(w&&typeof w.use==='function');i++)": "for(let i=0;i<150&&!(w&&typeof w.use==='function');i++)",
    "'Sem conexão com o armazenamento do grupo: a ficha fica salva só neste navegador.'": "'Entre com sua conta Google para salvar a ficha no grupo.'",
    "Abra a página no Claude e permita o uso da IA.": "Confira se você está logado e se a Vercel tem a chave do Gemini configurada.",
    "Abra a página no Claude com login.": "Entre com a conta Google do mestre.",
    "Para o grupo ver, abra a página com login no Claude.": "Para o grupo ver, entre com sua conta Google.",
    "Você não tem permissão para salvar aqui. Peça ao dono da página acesso de edição.": "Você não tem permissão para salvar aqui. Confira as regras do Firestore.",
}
for velho, novo in troca.items():
    if velho not in html:
        raise SystemExit(f"Trecho não encontrado no app: {velho[:60]!r}")
    html = html.replace(velho, novo, 1)

(raiz / "index.html").write_text(html, encoding="utf-8")
print("index.html gerado:", len(html), "bytes")
