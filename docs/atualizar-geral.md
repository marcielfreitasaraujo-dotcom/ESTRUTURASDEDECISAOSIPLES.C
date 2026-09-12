# Atualizar o Comanda IA para todo mundo

Toda tela nova (caixa, garçom, loja, login) só chega nos atalhos quando o código entra no branch que o Railway publica: `cursor/forno-saas-foundation-658e`.

Não apague o ícone. Não precisa reinstalar o atalho.

## O que a equipe faz na pizzaria

1. Espere o deploy terminar (o site `/api/health` responde ok).
2. Abra o atalho de novo no computador e no celular.
3. Se aparecer a faixa **Nova versão do Comanda IA**, toque em **Atualizar agora**.
4. Em `/entrar`, confira o código curto **Versão xxxxxxxx**. Se mudou, aquele aparelho já está na versão nova.

O atalho consulta `GET /api/version` sozinho (cerca de 12 segundos, ou ao voltar para a tela). Quando o código muda, ele limpa o cache e recarrega.

## O que publicar a cada atualização

1. Termine e teste a feature no branch `cursor/…-658e`.
2. Commit e push desse branch.
3. Publique no Railway:

```bash
npm run publish:railway
```

O script junta o branch atual em `cursor/forno-saas-foundation-658e` (só fast-forward) e faz push.

4. Espere o Railway terminar o deploy.
5. Confira `GET /api/version`. O campo `build` tem que ser o commit novo — nunca `0.1.0` nem `dev`.
6. Abra `/entrar` e confira se o código curto mudou.

Sem o passo 3, o atalho continua na versão antiga mesmo com a feature pronta no GitHub.

## Se um aparelho não atualizar

1. Abra o atalho de novo (não o Chrome/Safari “solto”, o ícone da tela inicial).
2. Toque em **Atualizar agora** se a faixa aparecer.
3. Compare o código em `/entrar` com o `build` de `/api/version`.
4. Só então limpe dados do site, se ainda estiver diferente. O ícone pode ficar.
