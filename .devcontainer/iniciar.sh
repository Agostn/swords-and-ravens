#!/usr/bin/env bash
# Roda toda vez que o Codespace é aberto: liga o banco, o servidor do jogo e o site.
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Atualiza sozinho para a versão mais nova do GitHub (só se não houver mudança local).
# Depois de atualizar, roda de novo a versão nova deste arquivo.
if [ "$1" != "--ja-atualizado" ] && git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
  echo "---> Procurando atualização no GitHub"
  ANTES="$(git rev-parse HEAD)"
  if git pull --ff-only -q >/tmp/atualizar.log 2>&1; then
    if [ "$(git rev-parse HEAD)" != "$ANTES" ]; then
      echo "     Atualizado: $(git log -1 --format=%s)"
      if git diff --name-only "$ANTES" HEAD | grep -qE "agot-bg-game-server/(package.json|yarn.lock)"; then
        echo "---> Instalando pacotes novos do jogo"
        (cd agot-bg-game-server && yarn install >/tmp/yarn-install.log 2>&1 && yarn run generate-json-schemas >/dev/null 2>&1) \
          || echo "     Aviso: falhou (veja /tmp/yarn-install.log)."
      fi
      if git diff --name-only "$ANTES" HEAD | grep -q "^agot-bg-game-server/src/messages/"; then
        (cd agot-bg-game-server && yarn run generate-json-schemas >/dev/null 2>&1) || true
      fi
    else
      echo "     Já está na versão mais nova."
    fi
  else
    echo "     Não deu para atualizar agora (seguindo com a versão atual; detalhes em /tmp/atualizar.log)."
  fi
  exec bash "$ROOT/.devcontainer/iniciar.sh" --ja-atualizado
fi

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

cd "$ROOT/agot-bg-website-dotnet/agot-bg-website"
export ASPNETCORE_ENVIRONMENT=Development
export PublicSiteUrl="$URL"
echo "---> Ligando o site (1 a 2 minutos na primeira vez; log em /tmp/site.log)"
dotnet run --no-launch-profile > /tmp/site.log 2>&1 &
SITE_PID=$!

# Espera o site responder e só então mostra o link
for i in $(seq 1 300); do
  if ! kill -0 "$SITE_PID" 2>/dev/null; then
    tail -40 /tmp/site.log
    echo ""
    echo "ERRO: o site não ligou (veja as mensagens acima ou /tmp/site.log)."
    exit 1
  fi
  curl -s -o /dev/null --max-time 2 http://localhost:8000/ && break
  sleep 2
done
curl -s -o /dev/null --max-time 5 http://localhost:8000/ \
  || echo "O site ainda está ligando. Espere aparecer \"Application started\" em /tmp/site.log e abra o link abaixo."

cat <<MSG

==============================================================
  PRONTO! O site está no ar. Abra este link:

  $URL

  (ou na aba "Portas", linha "Site (abra este)")

  1. Cada pessoa cria a sua conta (só nome de usuário e senha).
  2. Em "Todas as partidas", crie a partida.
  3. Na sala de espera, copie o link do convite e mande
     para os amigos. Cada um escolhe a Casa.
  4. Escolha o cenário e as regras e clique em "Iniciar partida".

  Deixe este terminal aberto enquanto estiverem jogando.
==============================================================

MSG

# Mantém o terminal ligado ao site (Ctrl+C desliga)
wait "$SITE_PID"
