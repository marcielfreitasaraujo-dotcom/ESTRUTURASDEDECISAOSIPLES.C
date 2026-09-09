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

## Backups

Usar backups automáticos do provedor Postgres (retenção ≥ 7 dias em staging, ≥ 30 em produção). Restore testado em staging. Procedimento detalhado entra na fase 13; não restaurar em produção sem runbook.
