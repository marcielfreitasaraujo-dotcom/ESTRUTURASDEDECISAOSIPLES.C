# Arquitetura — Forno

Forno é uma plataforma SaaS multi-tenant para pizzarias. O repositório anterior (FinUP / Flask) foi substituído neste branch: o produto agora é Next.js, PostgreSQL e domínio de restaurante, não finanças pessoais.

## Princípios

- Isolamento de tenant no servidor, nunca só no frontend.
- Preço, cupom, estoque e status de pedido são autoridade do servidor.
- Regras de negócio vivem em `src/domain`, não em `page.tsx`.
- Integrações (pagamento, WhatsApp, impressão, IA, e-mail, storage) entram por interfaces.
- Dados mock não substituem funcionalidade marcada como pronta.

## Stack

| Camada | Escolha | Motivo |
|---|---|---|
| App | Next.js 16 App Router + TypeScript strict | RSC, rotas, deploy Vercel |
| UI | Tailwind 4 + shadcn/ui + Lucide | Acessível, dono do código |
| Auth | Better Auth (sessão + e-mail/senha) | Self-hosted, RBAC próprio, MFA plugável |
| ORM | Prisma 6 | Migrations maduras; Prisma 7 ainda conflita com o CLI do Better Auth |
| Banco | PostgreSQL 16 | Produção e RLS futuro |
| Validação | Zod | Cliente e servidor |
| Testes | Vitest + Playwright | Unidade, integração, E2E |
| Jobs | Route Handler `/api/cron` | Pronto para Vercel Cron / GitHub Actions |

## Mapa do código

```
src/
  app/                 rotas (marketing, auth, /app, /admin, /loja, APIs)
  components/          UI
  domain/              regras puras (preço, cupom, RBAC, status)
  server/              contexto, tenancy, serviços, providers, jobs
  lib/                 db, auth, env, logger, money, errors
prisma/                schema + seed
docs/                  arquitetura, segurança, tenancy, API
```

## Multi-tenancy

Limite de isolamento: `Tenant` (um estabelecimento). `Organization` existe para franquias futuras, sem bloquear o modelo.

Toda entidade operacional tem `tenantId`. O client `createTenantPrisma(tenantId)` injeta o filtro. Serviços de pedido/catálogo sempre consultam `tenantId` + id. Teste explícito: `tests/integration/tenant-isolation.test.ts`.

Resolução de tenant hoje: slug em `/loja/[slug]`. Preparado para host customizado (`Tenant.customDomain`) e painel em `app.seusaas.com`.

## Auth e RBAC

Better Auth guarda sessão httpOnly. Papel de plataforma no `User.platformRole`. Papel do estabelecimento em `TenantMembership`. Permissões em `src/domain/rbac`. MFA: campo e plugin documentados; não habilitados até existir fluxo de enrollment.

## Dinheiro

Valores em **centavos inteiros**. Cálculo de pizza: modo padrão `HIGHEST_FLAVOR` (sabor mais caro), configurável por tamanho.

## Providers

- `PaymentProvider` — adapter manual agora; Mercado Pago / Stripe depois.
- `WhatsAppProvider` — null object.
- `PrintProvider` — null object.
- `AIProvider` — não configurado; só dados do tenant autorizado.
- `EmailProvider` — console em desenvolvimento.

## Observabilidade

Logs JSON em stdout. `/api/health` verifica banco. AuditLog para ações sensíveis. AnalyticsEvent para funil.

## Decisão provisória

Row-Level Security no PostgreSQL ainda não está nas migrations. Isolamento é application-level + testes. RLS entra no hardening (fase 13). Ver `docs/decisions/`.
