# Tenancy

## Modelo

`Organization` (opcional, futuro) → `Tenant` (estabelecimento) → dados operacionais.

O isolamento **obrigatório** é por `tenantId`. Uma empresa com várias lojas virará vários tenants sob a mesma organization; isso não está na UI ainda, mas o schema não impede.

## Regras

1. Nunca confiar em `tenantId` enviado pelo cliente como única fonte.
2. Sessão traz `activeTenantId` definido no servidor.
3. Super admin pode operar a plataforma sem membership; ações de tenant exigem tenant alvo explícito e audit log.
4. Tenant `SUSPENDED` ou `CANCELLED` não processa operação operacional.

## Implementação atual

- Filtro Prisma em `createTenantPrisma`
- `assertTenantId` / `assertNoCrossTenantOrderAccess`
- Teste de integração que tenta vazar produto e pedido do tenant B para o A

## RLS (TODO fase 13)

Policies `tenant_id = current_setting('app.tenant_id')` por tabela. A aplicação seta o GUC no início da request. Isso é defesa em profundidade, não substituto do filtro no serviço.
