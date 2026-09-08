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

O site usa caminhos absolutos (`/images/...`, `/brand/...`), então precisa ser servido na raiz de um domínio. Hospedagem em subpasta (ex.: GitHub Pages de projeto) exigiria reescrever esses caminhos com `import.meta.env.BASE_URL`.

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
