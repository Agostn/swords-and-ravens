#!/usr/bin/env bash
# Modo de teste rápido (sem site, sem contas): o jogo sozinho na porta 8080.
# Abra .../static/#1, #2, #3... e cada aba é um jogador. Uso: bash .devcontainer/modo-teste.sh
cd "$(dirname "$0")/../agot-bg-game-server"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
if [ -n "$CODESPACE_NAME" ]; then
  gh codespace ports visibility 5000:public 8080:public -c "$CODESPACE_NAME" >/dev/null 2>&1 || true
  DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
  URL="https://${CODESPACE_NAME}-8080.${DOMAIN}/static/#1"
else
  URL="http://localhost:8080/static/#1"
fi
pkill -f "ts-node -T src/server/server.ts" >/dev/null 2>&1 || true
pkill -f "webpack-dev-server" >/dev/null 2>&1 || true
yarn run run-server > /tmp/servidor-do-jogo.log 2>&1 &
echo ""
echo "  Espere \"compiled successfully\" e abra: $URL  (troque #1 por #2, #3...)"
echo ""
yarn run run-client --allowed-hosts all --client-web-socket-url "auto://0.0.0.0:0/ws"
