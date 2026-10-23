#!/usr/bin/env bash
# Roda toda vez que o Codespace é aberto: liga o banco, o servidor do jogo e o site.
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Endereço público do site
if [ -n "$CODESPACE_NAME" ]; then
  # O navegador precisa alcançar o site (8000) e o servidor do jogo (5000).
  gh codespace ports visibility 8000:public 5000:public -c "$CODESPACE_NAME" >/dev/null 2>&1 || true
  DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
  URL="https://${CODESPACE_NAME}-8000.${DOMAIN}"
else
  URL="http://localhost:8000"
fi

echo "---> Ligando o banco de dados e o Redis"
sudo service postgresql start >/dev/null 2>&1 || true
(redis-cli ping >/dev/null 2>&1) || sudo service redis-server start >/dev/null 2>&1 || redis-server --daemonize yes --dir /tmp >/dev/null

echo "---> Conferindo a página do jogo"
bash "$ROOT/.devcontainer/gerar-jogo.sh" || { echo "ERRO ao gerar a página do jogo. Veja as mensagens acima."; exit 1; }

# Para o que estiver rodando de uma vez anterior
pkill -f "ts-node -T src/server/server.ts" >/dev/null 2>&1 || true
pkill -f "agot-bg-website.dll" >/dev/null 2>&1 || true
pkill -f "bin/Debug/net10.0/agot-bg-website" >/dev/null 2>&1 || true

echo "---> Ligando o servidor do jogo (log em /tmp/servidor-do-jogo.log)"
(
  cd "$ROOT/agot-bg-game-server"
  MASTER_API_ENABLED=true \
  MASTER_API_USERNAME=game-server \
  MASTER_API_PASSWORD=change-me-in-user-secrets \
  MASTER_API_BASE_URL=http://localhost:8001/api \
  nohup yarn run run-server > /tmp/servidor-do-jogo.log 2>&1 &
)

cat <<MSG

==============================================================
  O site está ligando (1 a 2 minutos na primeira vez).
  Quando aparecer "Application started" aqui embaixo, abra:

  $URL

  1. Cada pessoa cria a sua conta (não precisa confirmar e-mail).
  2. Em "Todas as partidas", crie a partida.
  3. Na sala de espera, copie o link do convite e mande
     para os amigos. Cada um escolhe a Casa.
  4. Escolha o cenário e as regras e clique em "Iniciar partida".

  Deixe este terminal aberto enquanto estiverem jogando.
==============================================================

MSG

cd "$ROOT/agot-bg-website-dotnet/agot-bg-website"
export ASPNETCORE_ENVIRONMENT=Development
# Sem servidor de e-mail no Codespaces: a conta entra direto após o cadastro.
export Accounts__RequireConfirmedEmail=false
export PublicSiteUrl="$URL"
exec dotnet run --no-launch-profile
