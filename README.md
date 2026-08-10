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

Substitua os arquivos abaixo pelas fotos do Eduardo / Realiza (mantenha o mesmo nome):

| Arquivo | Uso no site |
|---------|-------------|
| `assets/img/team/eduardo-hero.jpg` | Hero (primeira dobra) |
| `assets/img/team/eduardo-sobre.jpg` | Seção Sobre / Quem somos |
| `assets/img/team/eduardo-atendimento.jpg` | Destaque de atendimento |

Imagens de casas (já no site): `assets/img/houses/casa-1.jpg` … `casa-4.jpg`.

Dica: envie fotos em boa luz, preferencialmente na vertical para o hero.

## Como visualizar

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`.

> Ao publicar, atualize o domínio em `robots.txt`, `sitemap.xml` e tags `canonical` / Open Graph.
