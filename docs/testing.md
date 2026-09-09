# Testes

```bash
npm test          # Vitest (unidade + integração)
npm run test:e2e  # Playwright (opcional, app no ar)
```

Unidade: preço de pizza, cupom, checkout, RBAC, transições de pedido.  
Integração: Tenant A não acessa Tenant B (produto e pedido).  
E2E: landing + cardápio piloto.

Integração exige Postgres migrado e seed. CI sobe Postgres 16, `migrate deploy`, `db:seed`, depois lint/typecheck/test/build.

Não apontar testes para um banco de produção.
