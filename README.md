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

## Railway

Hospedagem igual ao FinUP (Railway + Postgres). Projeto **novo** — não reutilize o serviço Flask do FinUP.

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Repo: `ESTRUTURASDEDECISAOSIPLES.C`. Branch: `cursor/forno-saas-foundation-658e`.
3. **+ New** → **Database** → **PostgreSQL**.
4. No serviço web, Variables:
   - `DATABASE_URL` → Add Variable Reference → `Postgres.DATABASE_URL`
   - `BETTER_AUTH_SECRET` → 32+ caracteres aleatórios
   - `NODE_ENV` → `production`
5. Settings → Networking → **Generate Domain**.
6. `BETTER_AUTH_URL` = `https://SEU-SERVICO.up.railway.app` (a URL gerada) → Redeploy.
7. Uma vez, no terminal do serviço ou `railway run npm run db:seed`.

Login: `admin` / `Maciel.2004`. Detalhes em [docs/deployment.md](./docs/deployment.md).

## Segurança

Nunca commite `.env`. Segredos só em variáveis de ambiente. Ver [docs/security.md](./docs/security.md).
