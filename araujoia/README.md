# AraujoIA

Site institucional da AraujoIA — sites profissionais para empresas.

Publicado em: [https://araujoia.netlify.app](https://araujoia.netlify.app)

## O que é isto

O código-fonte original **não estava** neste repositório. Esta pasta é a réplica do site (HTML, CSS e JS) com histórico no Git.

Os links de demo em Trabalhos (`teste-cidade`, `auditoria-final`, `demo-pendrive`) apontam para pastas irmãs que **não estavam publicadas** no Netlify. Eles foram mantidos como no site original.

## Arquivos

- `index.html` — página única (serviços, como funciona, trabalhos, contato)
- `style.css` — visual escuro com destaque em turquesa
- `script.js` — menu mobile, ano do rodapé e animações de entrada
- `netlify.toml` — publish local quando a Base directory do Netlify for `araujoia`

## Contato (versão no Git)

- WhatsApp: só o ícone (abre `wa.me`)
- Instagram: ícone + [@araujo.ia](https://www.instagram.com/araujo.ia/)
- Sem e-mail e sem telefone escrito na página

## Como ver localmente

Na pasta `araujoia`:

```bash
python3 -m http.server 8080
```

Abra [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Como republicar no Netlify

### Opção A — projeto já ligado ao Git (`monumental-cannoli-6648ef`)

Na raiz do repo existe um `netlify.toml` com `publish = "araujoia"`. Depois que essa branch estiver na Production branch do projeto:

1. Site configuration → Build & deploy
2. Confirme Production branch (esta branch ou `main` após o merge)
3. Trigger deploy

Se preferir Base directory em vez do `netlify.toml` da raiz:

1. Base directory: `araujoia`
2. Publish directory: `.`
3. Production branch: esta branch

### Opção B — domínio `araujoia.netlify.app`

Se esse domínio estiver em outra conta/equipe Netlify, entre nessa conta e faça **Deploy manual** da pasta `araujoia/` (drag-and-drop ou CLI com o site certo).

### Opção C — CLI

```bash
npx netlify-cli deploy --dir=araujoia --prod --site=<SITE_ID>
```
