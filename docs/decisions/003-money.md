# ADR 003 — Dinheiro em centavos

Status: aceito  
Data: 2026-09-09

Valores monetários são `Int` (centavos). Evita float e `Decimal` no caminho quente de checkout. Formatação só na borda (`formatBRL`).
