#!/usr/bin/env bash
# Roda uma vez, quando o Codespace é criado: instala as dependências do jogo.
set -e
cd "$(dirname "$0")/../agot-bg-game-server"
corepack enable >/dev/null 2>&1 || npm install -g yarn
yarn install
yarn run generate-json-schemas
[ -f .env ] || cp .env.dev.local .env
