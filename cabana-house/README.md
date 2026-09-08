# Cabana House — site institucional

Churrascaria em Estreito – MA. Projeto **independente** em `cabana-house/`. Não altera o FinUP nem o site Casa do Rio.

## Desenvolvimento

```bash
cd cabana-house
npm install
npm run dev
```

Abra [http://127.0.0.1:5173](http://127.0.0.1:5173).

Build: `npm run build`  
Preview: `npm run preview`

## Dados editáveis

| Arquivo | Conteúdo |
|---|---|
| `src/data/restaurant.ts` | Nome, endereço, WhatsApp, mapa, horário, Instagram |
| `src/data/menu.ts` | Cardápio (**MOCK** até o oficial) |
| `src/data/gallery.ts` | Galeria (fotos de acervo até as oficiais) |
| `src/data/reviews.ts` | Nota 4,0 / 17 avaliações — `quotes` vazio até depoimentos reais |
| `src/data/nav.ts` | Itens da navbar e do rodapé |

## Marca e fotos

- Logo oficial em `public/brand/logo.png` (selo circular, fundo transparente), com `apple-touch-icon.png` e os favicons derivados do mesmo arquivo. As cores e as proporções não foram alteradas: o recorte apenas isolou o selo do fundo branco do arquivo entregue.
- O arquivo recebido tem 305×218 px, o que dá um selo de 169 px. Isso cobre com folga os tamanhos usados (48–80 px, inclusive em telas 3x). Se surgir um vetor ou um PNG maior, substitua estes arquivos mantendo os nomes.
- Fotos em `public/images/` são acervo gastronômico de placeholder. Troque pelos arquivos reais do salão, da brasa e dos pratos, mantendo os mesmos nomes ou atualizando `src/data/*`.

## Publicar

Pasta de publish: `cabana-house/dist` após o build. Há `netlify.toml` neste diretório.

O build usa caminhos relativos (`base: './'` no `vite.config.ts`), então roda tanto na raiz de um domínio quanto em subpasta.

## Link pelo Git (githack)

O `dist/` fica versionado justamente para isso: o githack serve arquivo cru do repositório, então o build precisa estar commitado. **Depois de mexer no site, rode `npm run build` e commite o `dist` junto** — sem isso o link continua mostrando a versão antiga.

Fixo num commit, que é o formato para mandar ao cliente:

```
https://rawcdn.githack.com/marcielfreitasaraujo-dotcom/ESTRUTURASDEDECISAOSIPLES.C/<sha>/cabana-house/dist/index.html
```

Acompanhando o branch, que se atualiza sozinho a cada push:

```
https://raw.githack.com/marcielfreitasaraujo-dotcom/ESTRUTURASDEDECISAOSIPLES.C/cursor/site-restaurante-ccd9/cabana-house/dist/index.html
```

Duas coisas a saber antes de mandar para alguém:

- Na primeira visita o githack mostra um aviso ("External Content Notice") com o botão **Open the page**. É a tela padrão dele para conteúdo de terceiros, não é erro do site.
- `raw.githack.com` não tem cache e é limitado por taxa; `rawcdn.githack.com` passa por CDN e é o indicado para divulgar. Como o CDN guarda a resposta por URL, use-o sempre com o SHA do commit, nunca com o nome do branch.

O GitHub Pages deste repositório **não** é uma alternativa: já está ocupado pelo site da Realiza Consultoria, com domínio próprio apontando para ele.

## Link temporário para mostrar ao cliente

Gera uma URL HTTPS pública apontando para o build local, sem cadastro. Serve para apresentação; cai quando o processo termina.

```bash
npm run build
npx --yes serve -s dist -l 4180 &
cloudflared tunnel --url http://127.0.0.1:4180 --protocol http2
```

O `cloudflared` imprime a URL `https://<nome>.trycloudflare.com` no terminal.

O `--protocol http2` não é enfeite. No padrão o túnel usa QUIC (UDP), que em rede restrita cai com `failed to run the datagram handler` e entra num laço de reconexão até perder a URL. Forçando HTTP/2 ele passa a usar TCP e para de cair.

Ainda assim o túnel gratuito é efêmero: **a URL muda toda vez que o processo reinicia**, então ela não serve para deixar registrada com o cliente. Para um endereço fixo, publique em Netlify ou Vercel — a pasta é `dist` e o `netlify.toml` já está pronto.
