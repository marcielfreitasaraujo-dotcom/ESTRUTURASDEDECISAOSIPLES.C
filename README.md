# Comanda IA

Plataforma SaaS para restaurantes e pizzarias: cardápio digital, comanda no celular do garçom, PDV no computador do caixa, KDS e painel da plataforma. Multi-tenant, um único sistema na nuvem.

Documentação: [ARCHITECTURE.md](./ARCHITECTURE.md) · [ROADMAP.md](./ROADMAP.md) · [docs/surfaces.md](./docs/surfaces.md) · [docs/](./docs/)

## Requisitos

- Node.js 20.9+
- PostgreSQL 16
- npm

## Local

```bash
cp .env.example .env
# ajuste DATABASE_URL e BETTER_AUTH_SECRET
npx prisma migrate dev
npm run db:seed
npm run dev
```

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000).

**Somente desenvolvimento (seed)**

| Papel | Usuário | Senha |
|---|---|---|
| Admin (você) | `admin` | Maciel.2004 |
| Dona | `dona` | CentralPizza!2026 |
| Gerente | `gerente` | Gerente!2026 |
| Caixa | `caixa` | Caixa!2026 |
| Garçom | `garcom` | Garcom!2026 |
| Cozinha | `cozinha` | Cozinha!2026 |
| Motoboy | `motoboy` | Entrega!2026 |
| Apoio | `apoio` | Staff!2026 |

Também entra com o e-mail antigo, se preferir. O PDV é `/entrar`. O cliente pede em `/loja/central-da-pizza` (mesa: `?mesa=7`).
| Owner tenant B | wendy.h@example.net | PizzariaTeste!2026 |

Cardápio piloto: `/loja/central-da-pizza`  
Garçom: `/garcom` (no celular: Adicionar à tela inicial)  
Caixa: `/caixa`  
Cozinha: `/app/cozinha`  
Motoboy: `/entrega`  
Gestão da loja: `/app` (clientes, equipe, estoque, financeiro, cupons, entregas, loja)  
Admin da plataforma: `/admin`

Altere essas senhas antes de qualquer ambiente compartilhado. Em produção o seed não deve rodar.

## Scripts

- `npm run lint` / `npm run typecheck` / `npm test` / `npm run build`
- `npm run db:seed`

## Netlify

O site já está ligado ao repositório (`monumental-cannoli-6648ef`). O Netlify detecta o Next.js sozinho — não use `publish = .next`.

1. No painel, confira as variáveis:
   - `DATABASE_URL` (Postgres, por exemplo Neon)
   - `BETTER_AUTH_SECRET` (pelo menos 32 caracteres)
   - `BETTER_AUTH_URL` = URL pública do site
   - `NODE_ENV=production`
2. Rode **uma vez** no banco: `npx prisma migrate deploy` e `npm run db:seed` (cria o admin `admin` / `Maciel.2004`).

O PDV abre em `/entrar`. O cliente pede em `/loja/central-da-pizza`.

## Segurança

Nunca commite `.env`. Segredos só em variáveis de ambiente. Ver [docs/security.md](./docs/security.md).
