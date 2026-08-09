# Realiza Consultoria Caixa

Site institucional premium da **Realiza Consultoria Caixa** — Estreito — MA.

## Dados do negócio

| Item | Valor |
|------|--------|
| Nome | Realiza Consultoria Caixa |
| Endereço | R. Graça Aranha, n° 1567 — Centro, Estreito — MA, 65975-000 |
| Telefone / WhatsApp | (99) 98468-1048 |

## Estrutura

```
/
├── index.html
├── pages/
├── assets/
│   ├── css/
│   ├── js/          # site-config, components (header/footer), nav, faq, form
│   ├── icons/
│   └── img/         # logo + espaços para fotos reais
├── robots.txt
├── sitemap.xml
└── README.md
```

## Componentes reutilizáveis

Header e footer são injetados via `assets/js/components.js` + `site-config.js`.
Alterações de menu, WhatsApp ou endereço no config refletem em todas as páginas.

## Fotos reais

Substitua os placeholders `.photo-slot` por imagens em `assets/img/`:

1. Fachada
2. Consultor Eduardo Guimarães
3. Equipe / atendimento
4. Interior

## Como visualizar

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`.

> Ao publicar, atualize o domínio em `robots.txt`, `sitemap.xml` e tags `canonical` / Open Graph.
