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
