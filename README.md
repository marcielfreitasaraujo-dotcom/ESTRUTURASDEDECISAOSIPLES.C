# Forno

Plataforma SaaS para pizzarias: cardápio digital, montagem de pizza, pedidos, KDS e gestão do estabelecimento. Multi-tenant desde a primeira linha.

Documentação: [ARCHITECTURE.md](./ARCHITECTURE.md) · [ROADMAP.md](./ROADMAP.md) · [docs/](./docs/)

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

| Papel | E-mail | Senha |
|---|---|---|
| Super admin | xavier.y@example.org | FornoAdmin!2026 |
| Owner Central da Pizza | maria.s@example.com | CentralPizza!2026 |
| Owner tenant B | wendy.h@example.net | PizzariaTeste!2026 |

Cardápio piloto: `/loja/central-da-pizza`

Altere essas senhas antes de qualquer ambiente compartilhado. Em produção o seed não deve rodar.

## Scripts

- `npm run lint` / `npm run typecheck` / `npm test` / `npm run build`
- `npm run db:seed`

## Segurança

Nunca commite `.env`. Segredos só em variáveis de ambiente. Ver [docs/security.md](./docs/security.md).
