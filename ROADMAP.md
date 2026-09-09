# Roadmap — Forno

Não construir tudo de uma vez. Cada fase só avança com lint, typecheck, testes e build verdes.

## Fase 0 — Fundamentação (esta entrega)

- Repositório Next.js, TypeScript strict, ESLint, Prettier
- PostgreSQL + Prisma
- CI GitHub Actions
- Documentação de arquitetura, tenancy, segurança e API
- Health check, logs, headers de segurança

## Fase 1 — Core SaaS (esta entrega)

- Tenants, usuários, Better Auth, RBAC
- Painel do estabelecimento e super admin
- Seed Central da Pizza + tenant de isolamento
- Teste “Tenant A não acessa Tenant B”

## Fase 2 — Cardápio (esta entrega, base)

- Categorias, produtos, tamanhos, sabores, bordas, adicionais, combos no schema
- CRUD de categoria/produto
- Precificação de pizza no servidor

## Fase 3 — Cliente (esta entrega, base)

- Cardápio público `/loja/[slug]`
- Carrinho persistente
- Checkout com recálculo no servidor

## Fase 4 — Pedidos (esta entrega, base)

- Order + histórico de status
- Kanban operacional
- Idempotency key no checkout

## Fase 5 — Cozinha (esta entrega, base)

- KDS com timer e destaque de atraso
- Camada de impressão (adapter, sem marca)

## Fase 6 — Delivery

- Zonas (já no schema e checkout)
- Entregadores, atribuição, acompanhamento

## Fase 7 — CRM

- Histórico rico, fidelidade com ledger, cupons avançados, promoções

## Fase 8 — Estoque

- Movimentações, receitas, baixa na venda, custo/margem

## Fase 9 — Financeiro operacional

- Despesas, receitas, caixa, relatórios (não é ERP contábil)

## Fase 10 — Analytics

- Funil completo, dashboards de período

## Fase 11 — IA

- AIProvider + perguntas só com dados autorizados do tenant

## Fase 12 — Billing SaaS

- Planos, faturas, webhooks, entitlements reais de gateway

## Fase 13 — Hardening

- RLS, rate limit Redis, carga, backups automáticos, tracing

## Fase 14 — Produção

- Domínio, SSL, monitoramento, onboarding guiado de 7 passos

## Fora desta entrega (TODO explícito)

- Onboarding wizard com barra de progresso
- Tempo real (SSE/WebSocket) no kanban
- Upload S3 de logo/fotos
- PWA instalável
- Domínio customizado do tenant
- Gateway PIX/cartão de verdade
- WhatsApp Business API
- MFA enrollment
