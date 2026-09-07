# Paulo Henrique Advocacia Previdenciária

Site institucional premium do escritório **Paulo Henrique Advocacia Previdenciária**, em Estreito - MA.

Este projeto é **independente** do FinUP. Pode ser extraído para um repositório GitHub próprio sem alterar o restante do código.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Lucide Icons

## Desenvolvimento

```bash
cd paulo-henrique-advocacia
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Produção

```bash
npm run build
npm start
```

## Publicação

1. Na Vercel, importe este diretório (root directory: `paulo-henrique-advocacia` se estiver neste monorepo).
2. Na Netlify, defina o diretório base `paulo-henrique-advocacia` e o plugin oficial do Next.js.
3. Aponte o domínio `paulohenriqueadvocacia.com.br` para o deploy.

Para um repositório separado:

```bash
cd paulo-henrique-advocacia
git init
git add .
git commit -m "Site institucional Paulo Henrique Advocacia"
```

Em seguida, crie o repositório no GitHub e faça o push.

## Conteúdo editável

Tudo que muda com frequência está em `src/lib/`:

- `site.ts` — telefone, WhatsApp, e-mail, endereço, Instagram, Facebook, Google
- `areas.ts` — áreas de atuação
- `articles.ts` — artigos (estrutura de blog)
- `faq.ts` — perguntas frequentes
- `testimonials.ts` — apenas depoimentos reais autorizados

Cole o link oficial da página do Facebook em `site.facebook` quando existir. Enquanto estiver vazio, o ícone não aparece no rodapé.

## Imagens

As fotos atuais são **institucionais ilustrativas**, geradas para apresentação, e devem ser substituídas por:

1. fotografia profissional do advogado
2. fotos reais do escritório
3. imagens autorizadas do atendimento

Arquivos em `public/images/`. Os textos `alt` e as legendas já identificam o que precisa ser trocado.

## WhatsApp

Número: `(99) 98160-2780`

Mensagem padrão:

`Olá, gostaria de obter informações sobre atendimento jurídico previdenciário.`

## SEO

- Title e meta description locais (Estreito - MA)
- Open Graph
- `sitemap.xml` e `robots.txt`
- JSON-LD de escritório de advocacia / local business
- URLs amigáveis para áreas e conteúdos
