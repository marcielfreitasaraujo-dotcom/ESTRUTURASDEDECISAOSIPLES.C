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

`netlify.toml` na raiz fixa o comando de build (`npm run build`, que roda `prisma generate` antes do
`next build`) e a versão do Node (22, mesma do `.nvmrc`). Não definir diretório de publicação — o runtime
Next.js do Netlify detecta o app automaticamente e provisiona as functions/edge functions necessárias.

Variáveis de ambiente (painel do site → Environment variables → contexto Production, e Preview se aplicável):

- `DATABASE_URL` — string de conexão Postgres (Netlify Database, Neon, Supabase etc.)
- `BETTER_AUTH_SECRET` (≥ 32 chars)
- `BETTER_AUTH_URL` — URL pública do site (ex.: `https://comandaia.netlify.app`)
- `NODE_ENV=production`

Migrations e seed não rodam automaticamente no deploy. Depois que o banco existir e a variável
`DATABASE_URL` estiver configurada no site, rodar uma vez (localmente ou em qualquer máquina com acesso ao
banco de produção):

```bash
DATABASE_URL="<mesma-url-do-site>" npx prisma migrate deploy
DATABASE_URL="<mesma-url-do-site>" npm run db:seed
```

Repetir `prisma migrate deploy` sempre que novas migrations forem adicionadas ao branch em produção.

## Backups

Usar backups automáticos do provedor Postgres (retenção ≥ 7 dias em staging, ≥ 30 em produção). Restore testado em staging. Procedimento detalhado entra na fase 13; não restaurar em produção sem runbook.
