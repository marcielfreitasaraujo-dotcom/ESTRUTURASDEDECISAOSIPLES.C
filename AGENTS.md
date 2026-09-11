<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Product

Comanda IA is a multi-tenant SaaS for restaurants (Next.js 16 + PostgreSQL + Prisma + Better Auth). Same cloud system for platform admin (`/admin`), cashier POS (`/caixa`) and waiter phone (`/garcom`). Pilot tenant: Central da Pizza (`/loja/central-da-pizza`).

## Start / stop

- `cp .env.example .env` then `npx prisma migrate dev && npm run db:seed && npm run dev`
- App: `http://127.0.0.1:3000` (also `0.0.0.0:3000`)
- Health: `GET /api/health`
- Dev logins (seed only): admin `admin` / `Maciel.2004`; gerente (dono da loja) `gerente` / `Gerente!2026`; cashier `caixa` / `Caixa!2026`; waiter `garcom` / `Garcom!2026`; delivery `motoboy` / `Entrega!2026`. E-mail also works.

## Lint / test / build

- `npm run lint`
- `npm run typecheck`
- `npm test` (Vitest; uses `DATABASE_URL`, default test DB `forno_test` in CI)
- `npm run build`

## Gotchas

- Do not point tests at a production database.
- Tenant isolation is server-side. Never trust a client-sent `tenantId`.
- Money is integer cents.
- Prisma 6 on purpose (Better Auth). See `docs/decisions/002-orm.md`.
- PostgreSQL must be running locally (`docker compose up -d` or system cluster).
- Production Railway tracks `cursor/forno-saas-foundation-658e`. Merge there so every cashier/waiter shortcut picks up the new build via `/api/version`.
