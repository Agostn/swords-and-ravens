#!/usr/bin/env bash
# Roda toda vez que o Codespace é aberto: liga o servidor e o cliente do jogo.
cd "$(dirname "$0")/../agot-bg-game-server"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# O navegador precisa alcançar a porta do servidor (5000) e a do cliente (8080).
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

cat <<MSG

==============================================================
  O jogo está ligando. Espere aparecer "compiled successfully"
  aqui embaixo (pode levar 1 a 2 minutos) e então abra:

  $URL

  Cada aba é um jogador: troque o #1 no fim do endereço por
  #2, #3, #4... para entrar como outros jogadores.
==============================================================

MSG

yarn run run-client --allowed-hosts all --client-web-socket-url "auto://0.0.0.0:0/ws"
