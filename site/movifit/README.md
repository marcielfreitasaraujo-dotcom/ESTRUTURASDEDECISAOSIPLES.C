# Movifit Academia — site institucional

Site estático da **Movifit Academia**, em Estreito - MA.

Identidade visual: preto + amarelo `#FFD000`, com o logotipo oficial.

## Como publicar

Publique a pasta `movifit/` como site estático (Netlify, GitHub Pages, Vercel ou qualquer hospedagem).

## Configurar WhatsApp e Instagram

Edite `js/config.js`:

```js
window.MOVIFIT_CONFIG = {
  whatsapp: "5599999999999", // DDI + DDD + número, só dígitos
  instagram: "https://www.instagram.com/contaoficial/",
  mapsQuery: "Av. Chico Brito, 94, Loteamento São Bernardo, Estreito - MA, 65975-000",
  mensagemWhatsApp: "Olá! Gostaria de conhecer a Movifit Academia e saber mais sobre os planos.",
};
```

Enquanto esses campos estiverem vazios, o site mostra “em breve” e o formulário de contato continua funcionando como convite para visitar a academia.

## Trocar fotos reais

Substitua os arquivos em `img/` mantendo os mesmos nomes:

- `hero.jpg` / `hero.webp`
- `sobre.jpg` / `sobre.webp`
- `estrutura.jpg` / `estrutura.webp`
- `experiencia.jpg` / `experiencia.webp`
- `fachada.jpg` / `fachada.webp`
- `cta.jpg` / `cta.webp`
- `galeria-1.jpg` … `galeria-6.jpg` (e `.webp`)

O logotipo oficial está em `logo.png` e `logo-transparente.png`. Não distorça o arquivo.

As fotos atuais são **conceituais**, alinhadas à identidade da marca, até as fotos reais da estrutura serem adicionadas.

## Horários oficiais

- Segunda a sexta: 05h às 21:30h
- Sábado: 06h às 10:00h

## Endereço

Av. Chico Brito, 94  
Loteamento São Bernardo  
Estreito - MA  
CEP 65975-000
