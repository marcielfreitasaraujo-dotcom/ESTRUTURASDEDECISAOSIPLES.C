# ADR 001 — Autenticação com Better Auth

Status: aceito  
Data: 2026-09-09

## Contexto

O produto precisa de sessões, recuperação de senha, MFA futuro e RBAC de pizzaria (OWNER, KITCHEN, etc.), além de SUPER_ADMIN da plataforma.

## Decisão

Better Auth self-hosted com Prisma, e-mail/senha, `nextCookies`, rate limit. RBAC **nosso** (`TenantMembership` + `ROLE_PERMISSIONS`), não o plugin Organizations (papéis demais específicos).

Não Clerk/Auth0 nesta fase: o modelo de usuário/tenant precisa viver no nosso Postgres e a operação brasileira não deve depender de billing de IdP para o núcleo.

## Consequências

- MFA via plugin oficial quando o enrollment existir.
- Password reset usa `EmailProvider` (console em dev).
