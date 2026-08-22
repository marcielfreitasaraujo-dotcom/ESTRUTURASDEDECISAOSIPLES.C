# AraujoIA

Site institucional da AraujoIA — sites profissionais para empresas.

Publicado em: [https://araujoia.netlify.app](https://araujoia.netlify.app)

## O que é isto

O código-fonte original **não estava** neste repositório nem em nenhum outro repositório público da conta GitHub. Esta pasta é uma réplica fiel do site no ar (HTML, CSS e JS), para o projeto voltar a ter histórico no Git.

Os links de demo em Trabalhos (`teste-cidade`, `auditoria-final`, `demo-pendrive`) apontam para pastas irmãs que **não estavam publicadas** no Netlify. Eles foram mantidos como no site original.

## Arquivos

- `index.html` — página única (serviços, como funciona, trabalhos, contato)
- `style.css` — visual escuro com destaque em turquesa
- `script.js` — menu mobile, ano do rodapé e animações de entrada

## Como ver localmente

Na pasta `araujoia`:

```bash
python3 -m http.server 8080
```

Abra [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Como republicar no Netlify

1. Conecte este repositório no Netlify (ou faça deploy por pasta).
2. Defina o **publish directory** como `araujoia`.
3. Não há build: o site é estático.
