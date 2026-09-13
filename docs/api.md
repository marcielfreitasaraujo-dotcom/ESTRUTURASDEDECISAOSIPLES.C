# API

Route handlers e Server Actions. Resposta JSON de erro:

```json
{ "error": { "code": "FORBIDDEN", "message": "..." } }
```

| Método | Caminho | Auth | Descrição |
|---|---|---|---|
| GET | `/api/health` | pública | status, database, version, timestamp |
| GET/POST | `/api/auth/*` | Better Auth | login, sessão, reset |
| GET | `/api/cron?job=` | `CRON_SECRET` | jobs |

Mutações de cardápio, pedido e checkout são Server Actions em `src/app/actions`. Elas validam sessão, tenant e permissão.

Checkout ignora preço do cliente. `idempotencyKey` evita pedido duplicado.
