#!/usr/bin/env bash
# Roda uma vez, quando o Codespace é criado: instala as dependências do jogo.
set -e
cd "$(dirname "$0")/../agot-bg-game-server"
# Sem isso o corepack para e pergunta "Do you want to continue? [Y/n]" e a instalação fica travada.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack enable >/dev/null 2>&1 || npm install -g yarn
yarn install
yarn run generate-json-schemas
[ -f .env ] || cp .env.dev.local .env
