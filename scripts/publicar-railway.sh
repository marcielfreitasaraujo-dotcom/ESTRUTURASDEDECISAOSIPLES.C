#!/usr/bin/env bash
# Publica o branch atual no branch que o Railway usa, para todos os atalhos recarregarem.
set -euo pipefail

TARGET="cursor/forno-saas-foundation-658e"
SOURCE="${1:-$(git branch --show-current)}"

if [[ -z "$SOURCE" || "$SOURCE" == "HEAD" ]]; then
  echo "Não dá para publicar: você não está em um branch."
  exit 1
fi

if [[ "$SOURCE" == "main" ]]; then
  echo "Produção do Comanda IA não é main. Use um branch cursor/…-658e."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Há mudanças sem commit. Faça commit (ou stash) antes de publicar."
  exit 1
fi

git fetch origin "$SOURCE" "$TARGET"

if ! git merge-base --is-ancestor "$TARGET" "$SOURCE" && ! git merge-base --is-ancestor "origin/$TARGET" "$SOURCE"; then
  echo "O branch $SOURCE não contém $TARGET. Faça merge/rebase nele antes de publicar."
  exit 1
fi

ORIGINAL="$SOURCE"
git checkout "$TARGET"
git pull --ff-only origin "$TARGET"
git merge --ff-only "$ORIGINAL"
git push origin "$TARGET"
git checkout "$ORIGINAL"

SHORT="$(git rev-parse --short HEAD)"
echo "Publicado $ORIGINAL em $TARGET ($SHORT)."
echo "Espere o Railway e confira GET /api/version — o build tem que ser o commit, não 0.1.0."
