# ADR 003 — Marca Comanda IA e superfícies operacionais

Status: aceito  
Data: 2026-09-09

O produto se chama **Comanda IA**. A identidade visual (laranja + preto, logotipo com cúpula) substitui a marca temporária Forno.

Um único backend/nuvem atende:

1. Painel da plataforma (`/admin`) — dono do SaaS  
2. Computador do caixa (`/caixa`) — PDV  
3. Celular do garçom (`/garcom`) — PWA / comanda de mesa  

Papel `WAITER` e fulfillment `DINE_IN` + `tableNumber` entram no schema para não misturar salão com delivery.
