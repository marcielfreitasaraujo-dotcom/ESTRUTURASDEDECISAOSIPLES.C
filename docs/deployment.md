# Deploy

Ambientes: development, staging, production — cada um com banco e secrets próprios.

## Local

```bash
cp .env.example .env
# PostgreSQL 16 em localhost (docker compose up -d)
npx prisma migrate dev
npm run db:seed
npm run dev
```

App: http://127.0.0.1:3000  
Health: http://127.0.0.1:3000/api/health

## Vercel

- `DATABASE_URL` (Postgres gerenciado, SSL)
- `BETTER_AUTH_SECRET` (≥ 32 chars)
- `BETTER_AUTH_URL` (URL pública)
- Cron: `GET /api/cron?job=expire-coupons` com `Authorization: Bearer $CRON_SECRET`

Build: `npm run build` (gera Prisma Client + Next).

## Railway

Igual ao FinUP: um projeto no Railway + Postgres do próprio Railway. Este app é Next.js (não Flask): o `railway.json` faz `npm run build`, `npx prisma migrate deploy` e `npm run start` na porta `PORT`.

1. [railway.app](https://railway.app) → **New Project** → **GitHub repo** → este repositório.
2. Branch: `cursor/forno-saas-foundation-658e` (não `main`).
3. **+ New** → **Database** → **PostgreSQL**.
4. No serviço do app, **Variables**:
   - `DATABASE_URL` = referência `${{Postgres.DATABASE_URL}}` (Add Reference Variable)
   - `BETTER_AUTH_SECRET` = texto aleatório ≥ 32 caracteres
   - `BETTER_AUTH_URL` = URL pública (depois de Generate Domain)
   - `NODE_ENV=production`
5. **Settings → Networking → Generate Domain**.
6. Ajuste `BETTER_AUTH_URL` para `https://<dominio>.up.railway.app` e redeploy.
7. Seed **uma vez** (Railway CLI ou um one-off): `npm run db:seed`.

Login: usuário `admin`, senha `Maciel.2004`. Health: `GET /api/health`.

Se o painel não ler o `railway.json` (projetos novos usam IaC), copie no serviço: Build `npm run build`, Pre-deploy `npx prisma migrate deploy`, Start `npm run start`, Health `/api/health`.

## Netlify

`netlify.toml` na raiz fixa o comando de build (`npm run build`) e o Node 22. Não definir diretório de publicação — o runtime Next.js do Netlify detecta o app.

Variáveis (painel → Variáveis ambientais → Production e Preview):

- `DATABASE_URL` — Postgres (Neon, Supabase ou Netlify Database)
- `BETTER_AUTH_SECRET` (≥ 32 caracteres; não usar a senha de login)
- `BETTER_AUTH_URL` — URL pública (`https://comandaia.netlify.app`); em preview o Netlify `DEPLOY_PRIME_URL` entra como fallback
- `NODE_ENV=production`

Migrations e seed não rodam no deploy. Depois que o banco existir:

```bash
DATABASE_URL="<mesma-url-do-site>" npx prisma migrate deploy
DATABASE_URL="<mesma-url-do-site>" npm run db:seed
```

Login da equipe: usuário `admin`, senha `Maciel.2004`.

## Backups

Usar backups automáticos do provedor Postgres (retenção ≥ 7 dias em staging, ≥ 30 em produção). Restore testado em staging. Procedimento detalhado entra na fase 13; não restaurar em produção sem runbook.
