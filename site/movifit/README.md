# Movifit Academia — site institucional

Pasta **pronta para publicar**. É um site estático: copie `movifit/` para qualquer hospedagem ou domínio.

Identidade: preto + amarelo `#FFD000`, com o logotipo oficial.

## Publicar em qualquer domínio

1. Use **somente** o conteúdo desta pasta (`index.html`, `css/`, `js/`, `img/`, `fonts/`).
2. No Netlify / Vercel / GitHub Pages / Hostinger / cPanel, o diretório publicado deve ser esta pasta (a raiz do site).
3. Não precisa de servidor Python, banco nem build.
4. O site funciona na raiz (`seusite.com.br`) ou em subpasta (`seusite.com.br/movifit/`).

Quando tiver o domínio, opcionalmente preencha `siteUrl` em `js/config.js`.

## Configurar WhatsApp, Instagram e domínio

Edite `js/config.js`:

```js
window.MOVIFIT_CONFIG = {
  siteUrl: "https://www.seudominio.com.br",
  whatsapp: "5599999999999",
  instagram: "https://www.instagram.com/contaoficial/",
  mapsQuery: "Av. Chico Brito, 94, Loteamento São Bernardo, Estreito, Maranhão, Brasil, 65975-000",
  mensagemWhatsApp: "Olá! Gostaria de conhecer a Movifit Academia e saber mais sobre os planos.",
};
```

Campos vazios não inventam contato: os ícones de WhatsApp e Instagram continuam visíveis. Quando o número e o perfil oficiais forem preenchidos, os ícones abrem a conversa e o Instagram.

## Trocar fotos reais

Substitua os arquivos em `img/` mantendo os mesmos nomes (`hero`, `sobre`, `estrutura`, `experiencia`, `fachada`, `cta`, `galeria-1` … `galeria-6`, `.jpg` e `.webp`).

O logotipo oficial está em `logo.png` e `logo-transparente.png`. Não distorça.

## Horários oficiais

- Segunda a sexta: 05h às 21:30h
- Sábado: 06h às 10:00h

## Endereço

Av. Chico Brito, 94  
Loteamento São Bernardo  
Estreito - MA  
CEP 65975-000
