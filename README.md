# Horizonte Correspondente Caixa

Site institucional para correspondente bancário autorizado da Caixa Econômica Federal.

## Estrutura de pastas

```
/
├── index.html                 # Página inicial
├── pages/                     # Páginas internas
│   ├── servicos.html
│   ├── fgts.html
│   ├── consignado.html
│   ├── habitacao.html
│   ├── quem-somos.html
│   └── contato.html
├── assets/
│   ├── css/                   # Estilos (variáveis, base, componentes, páginas)
│   ├── js/                    # Scripts (nav, animações, formulário)
│   ├── icons/                 # Ícones SVG
│   └── img/                   # Imagens locais (opcional)
└── components/                # Espaço para trechos reutilizáveis futuros
```

## Como visualizar

Na raiz do projeto:

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`.

## Personalização rápida

Substitua os dados de exemplo do cliente:

| Item | Onde alterar |
|------|----------------|
| Nome da marca | Textos `Horizonte` nos HTML + `assets/icons/logo.svg` |
| WhatsApp | Links `wa.me/5511999999999` e `data-whatsapp` no formulário |
| Telefone / e-mail / endereço | Rodapé e `pages/contato.html` |
| Mapa | Bloco `.map-embed` em `pages/contato.html` |

## Observação legal

Este site representa um **correspondente autorizado**, não a Caixa Econômica Federal. Mantenha o aviso no rodapé e use apenas a marca do correspondente de forma adequada às regras de comunicação da Caixa.