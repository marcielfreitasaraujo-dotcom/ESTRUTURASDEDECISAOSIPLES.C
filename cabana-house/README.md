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

## Dados editáveis

| Arquivo | Conteúdo |
|---|---|
| `src/data/restaurant.ts` | Nome, endereço, WhatsApp, mapa |
| `src/data/menu.ts` | Cardápio (**MOCK** até o oficial) |
| `src/data/gallery.ts` | Galeria (fotos de acervo até as oficiais) |
| `src/data/reviews.ts` | Nota 4,0 / 17 avaliações |

Logo provisória em `public/brand/logo.svg`, feita na paleta da marca. Substitua pelo arquivo oficial sem distorcer.

## Publicar

Pasta de publish: `cabana-house/dist` após o build. Há `netlify.toml` neste diretório.
