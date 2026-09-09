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

| Papel | E-mail | Senha |
|---|---|---|
| Super admin (plataforma) | xavier.y@example.org | FornoAdmin!2026 |
| Owner Central da Pizza | maria.s@example.com | CentralPizza!2026 |
| Gerente | xavier.y@example.org | Gerente!2026 |
| Caixa | marco.r@example.org | Caixa!2026 |
| Garçom | paula.r@example.org | Garcom!2026 |
| Cozinha | leo.a@example.org | Cozinha!2026 |
| Motoboy | marco.r@example.org | Entrega!2026 |
| Apoio | paula.r@example.org | Staff!2026 |
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

## Segurança

Nunca commite `.env`. Segredos só em variáveis de ambiente. Ver [docs/security.md](./docs/security.md).
