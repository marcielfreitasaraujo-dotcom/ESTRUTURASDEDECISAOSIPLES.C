# Banco de dados

PostgreSQL 16. ORM: Prisma 6 (`prisma/schema.prisma`).

Dinheiro: `Int` em centavos (`*Cents`). Estoque de ingrediente: `Decimal(12,3)`.

IDs: `cuid()` nas entidades de domínio; strings geradas pelo Better Auth nas tabelas `user`, `session`, `account`, `verification`.

Índices: `tenantId`, slugs compostos, status+createdAt, telefone do cliente, token de sessão.

Soft delete: `deletedAt` em Tenant, Category, Product.

Migrations: `npx prisma migrate dev`. Produção: `prisma migrate deploy`.

Seed de desenvolvimento: Central da Pizza (`/loja/central-da-pizza`) + Pizzaria Teste (isolamento). Não tratar o seed como dados oficiais do estabelecimento real.
