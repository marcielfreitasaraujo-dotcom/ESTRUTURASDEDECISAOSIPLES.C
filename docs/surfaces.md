# Superfícies do Comanda IA

O produto é **um único sistema na nuvem**. Não há bases separadas para garçom, caixa e admin. Cada pessoa entra com o próprio login e o servidor abre a interface do papel.

| Superfície | Rota | Quem | Dispositivo |
|---|---|---|---|
| Plataforma | `/admin` | Você (SUPER_ADMIN) | Qualquer |
| Gestão da loja | `/app` | Dono / gerente | Computador ou tablet |
| Clientes | `/app/clientes` | Dono / gerente / caixa / garçom | Computador |
| Equipe | `/app/equipe` | Dono / gerente | Computador |
| Loja | `/app/configuracoes` | Dono / gerente | Computador |
| Entregas (cadastro) | `/app/entregas` | Dono / gerente | Computador |
| Cupons | `/app/cupons` | Dono / gerente | Computador |
| Estoque | `/app/estoque` | Dono / gerente | Computador |
| Financeiro | `/app/financeiro` | Dono / gerente | Computador |
| Caixa | `/caixa` | Caixa | Computador do PDV |
| Garçom | `/garcom` | Garçom / apoio | Celular (PWA) |
| Cozinha | `/app/cozinha` | Cozinha | Tablet / monitor |
| Motoboy | `/entrega` | Entregador | Celular |
| Cliente | `/loja/[slug]` | Cliente final | Celular — casa, retirada ou `?mesa=7` |

Pedido lançado no celular do garçom aparece no caixa e no KDS na hora, no mesmo tenant.
