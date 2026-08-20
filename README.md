# Realiza Consultoria Caixa

Site institucional premium da **Realiza Consultoria Caixa** — Estreito — MA.

## Dados do negócio

| Item | Valor |
|------|--------|
| Nome | Realiza Consultoria Caixa |
| Endereço | R. Graça Aranha, n° 1567 — Centro, Estreito — MA, 65975-000 |
| Telefone / WhatsApp | (99) 98468-1048 |
| Consultor | Eduardo Guimarães |

## Prévia para o cliente

Página de checklist das fotos: `pages/revisao.html`

### Mensagem pronta para enviar no WhatsApp

```
Olá, Eduardo! Segue a prévia do site da Realiza Consultoria Caixa para você analisar.

Link do site: [COLE O LINK AQUI]

O que já está pronto: identidade, serviços, endereço, WhatsApp, mapa, depoimentos e galeria.

Para finalizar, preciso de 3 fotos suas:
1) Retrato vertical (primeira tela)
2) Foto no atendimento/escritório (horizontal)
3) Mais uma foto de atendimento ou ambiente

Pode enviar por aqui mesmo. Qualquer ajuste de texto, me avise!
```

## Fotos necessárias

| Arquivo | Uso | Formato |
|---------|-----|---------|
| `assets/img/team/eduardo-hero.jpg` | Hero (primeira dobra) | Vertical |
| `assets/img/team/eduardo-sobre.jpg` | Sobre / Quem somos | Horizontal |
| `assets/img/team/eduardo-atendimento.jpg` | Destaque e páginas internas | Quadrada ou vertical |

Opcional: foto da fachada da Realiza.

## Estrutura

```
/
├── index.html
├── pages/           # serviços, habitação, fgts, consignado, quem-somos, contato, revisao
├── assets/
│   ├── css/
│   ├── js/
│   ├── icons/
│   └── img/
├── robots.txt
├── sitemap.xml
└── README.md
```

## Como visualizar localmente

```bash
git checkout cursor/site-correspondente-caixa-f09a
git pull
python3 -m http.server 8080
```

Abra `http://localhost:8080`.

## Publicar no GitHub Pages (link fixo)

1. No GitHub: **Settings → Pages**
2. Source: **GitHub Actions**
3. Após o deploy, o link ficará em:
   `https://marcielfreitasaraujo-dotcom.github.io/ESTRUTURASDEDECISAOSIPLES.C/`

Depois de publicar, atualize o domínio em `robots.txt`, `sitemap.xml` e tags `canonical` / Open Graph.
