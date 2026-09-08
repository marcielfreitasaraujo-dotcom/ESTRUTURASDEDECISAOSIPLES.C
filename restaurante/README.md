# Casa do Rio — site do restaurante

Site institucional **independente** para o restaurante Casa do Rio, em Estreito - MA.

Este projeto vive só na pasta `restaurante/`. Ele **não altera** o FinUP, o site de vendas, a EXTRA PAPELARIA, a academia nem os demais projetos já existentes neste repositório.

## O que o site faz

- Página única com sobre, cardápio, galeria, reservas, horários e mapa
- Pedido: o visitante adiciona pratos e envia no WhatsApp
- Reserva de mesa: formulário abre a conversa no WhatsApp com os dados prontos
- Layout para celular e computador

## Como abrir no computador

Na pasta `restaurante/`:

```bash
python3 -m http.server 8080
```

Abra [http://127.0.0.1:8080](http://127.0.0.1:8080).

Não use a porta 5000 se o FinUP estiver rodando.

## Personalizar (nome, telefone, endereço)

Edite `js/site-data.js`:

- `telefoneE164` — número do WhatsApp com DDI, só dígitos (ex.: `5599999990000`)
- `instagram` — usuário sem @
- `endereco`, `mapaQuery`, `horarios`, `cardapio`

O número e o Instagram atuais são **placeholders** para você trocar pelos dados reais do restaurante.

## Publicar

A pasta já traz `netlify.toml` e `_headers`. No Netlify, publique só o diretório `restaurante/` (Publish directory: `restaurante`).

## Testes

```bash
python3 restaurante/test_site.py
```
