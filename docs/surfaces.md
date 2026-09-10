# Superfícies do Comanda IA

O produto é **um único sistema na nuvem**. Não há bases separadas para garçom, caixa e admin. Cada pessoa entra com o próprio login e o servidor abre a interface do papel.

| Superfície | Rota | Quem | Dispositivo |
|---|---|---|---|
| Plataforma | `/admin` | Você (admin) | Qualquer |
| Gestão da loja | `/app` | Gerente (dono) e admin | Computador ou tablet |
| Equipe | `/app/equipe` | Gerente e admin (gerente não mexe no admin) | Computador |
| Cardápio | `/app/cardapio` | Gerente e admin | Computador |
| Caixa | `/caixa` | Caixa, gerente e admin | Computador do PDV |
| Salão (mesas) | `/caixa` | Caixa vê mesas livres/ocupadas no PDV | Computador do PDV |
| Estoque do cardápio | `/caixa/estoque` | Caixa, gerente e admin | Computador do PDV |
| Fechar caixa | `/caixa/fechamento` | Gerente e admin | Computador |
| Garçom | `/garcom` | Garçom | Celular (PWA) |
| Motoboy | `/entrega` | Motoboy | Celular |
| Cliente | `/loja/[slug]` | Cliente final | Celular — casa, retirada ou `?mesa=7` |

Pedido lançado no celular do garçom aparece no caixa e no KDS na hora, no mesmo tenant.
