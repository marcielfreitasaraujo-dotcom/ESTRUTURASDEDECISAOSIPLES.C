# Realiza Consultoria Caixa

Site institucional da **Realiza Consultoria Caixa** — Estreito — MA.

Pronto para publicar na web. As fotos do Eduardo Guimarães podem ser trocadas depois.

## Dados

| Item | Valor |
|------|--------|
| Nome | Realiza Consultoria Caixa |
| Endereço | R. Graça Aranha, n° 1567 — Centro, Estreito — MA, 65975-000 |
| WhatsApp | (99) 98468-1048 |
| Consultor | Eduardo Guimarães |

## Publicar hoje (GitHub Pages)

1. Abra: https://github.com/marcielfreitasaraujo-dotcom/ESTRUTURASDEDECISAOSIPLES.C/settings/pages  
2. Em **Build and deployment → Source**, escolha **GitHub Actions**  
3. Salve. O workflow `Deploy GitHub Pages` sobe o site automaticamente.  
4. Link público (após o deploy):  
   **https://marcielfreitasaraujo-dotcom.github.io/ESTRUTURASDEDECISAOSIPLES.C/**

Também funciona com Netlify Drop: arraste a pasta do projeto em https://app.netlify.com/drop

## Fotos depois (sem republicar o site inteiro)

Substitua **mantendo o mesmo nome**:

| Arquivo | Onde aparece |
|---------|----------------|
| `assets/img/team/eduardo-hero.jpg` | Primeira tela (hero) — vertical |
| `assets/img/team/eduardo-sobre.jpg` | Sobre / Quem somos — horizontal |
| `assets/img/team/eduardo-atendimento.jpg` | Destaque e páginas internas |

Depois: `git add` → `git commit` → `git push` (o Pages atualiza sozinho).

Checklist interno: `pages/revisao.html` (não aparece no menu).

## Rodar local

```bash
git checkout cursor/site-correspondente-caixa-f09a
git pull
python3 -m http.server 8080
```

Abra http://localhost:8080

## Domínio próprio

Domínio oficial: **https://realizaconsultoriaoficial.com.br**

No GitHub: Settings → Pages → Custom domain = `realizaconsultoriaoficial.com.br` → Enforce HTTPS.
