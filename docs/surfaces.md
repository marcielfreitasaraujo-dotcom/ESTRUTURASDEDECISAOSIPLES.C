# Superfícies do Comanda IA

O produto é **um único sistema na nuvem**. Não há bases separadas para garçom, caixa e admin. Cada pessoa entra com o próprio login e o servidor abre a interface do papel.

| Superfície | Rota | Quem | Dispositivo |
|---|---|---|---|
| Plataforma | `/admin` | Você (SUPER_ADMIN) | Qualquer |
| Gestão da loja | `/app` | Dono / gerente | Computador ou tablet |
| Caixa | `/caixa` | Caixa | Computador do PDV |
| Garçom | `/garcom` | Garçom | Celular (PWA) |
| Cozinha | `/app/cozinha` | Cozinha | Tablet / monitor |
| Cliente | `/loja/[slug]` | Cliente final | Celular |

Pedido lançado no celular do garçom aparece no caixa e no KDS na hora, no mesmo tenant.
