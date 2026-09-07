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

- Logo provisória em `public/brand/logo.svg`, na paleta da marca. Substitua pelo arquivo oficial **sem distorcer nem recolorir**.
- Fotos em `public/images/` são acervo gastronômico de placeholder. Troque pelos arquivos reais do salão, da brasa e dos pratos, mantendo os mesmos nomes ou atualizando `src/data/*`.

## Publicar

Pasta de publish: `cabana-house/dist` após o build. Há `netlify.toml` neste diretório.
