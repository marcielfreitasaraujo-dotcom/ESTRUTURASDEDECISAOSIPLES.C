# Segurança

- Sessões Better Auth, cookies prefixados `forno`, `secure` em produção.
- Senhas com hash do Better Auth (`better-auth/crypto`). Nunca bcrypt manual.
- RBAC estruturado; nenhum `if (email === ...)`.
- Isolamento de tenant no servidor.
- Validação Zod nas actions.
- Rate limit nativo do Better Auth (memória). Produção: Redis como secondary storage.
- Headers: `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Secrets só em variáveis de ambiente.
- AuditLog em login, logout, CRUD sensível, cancelamento, preço, suspensão de tenant.
- `/api/cron` exige `CRON_SECRET` quando definido.
- Erros públicos não vazam stack trace (`publicErrorMessage`).

TODO: CSRF extra nas actions já usa cookies SameSite=lax + origem same-site do Next. MFA enrollment. RLS. WAF na borda.
