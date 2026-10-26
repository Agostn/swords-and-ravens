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
      export ATUALIZOU=1
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
  DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
  URL="https://${CODESPACE_NAME}-8000.${DOMAIN}"
else
  URL="http://localhost:8000"
fi

# As portas 8000 (site) e 5000 (servidor do jogo) precisam ser PÚBLICAS. Se ficarem
# privadas, só o dono do Codespace abre as páginas, os formulários (entrar, criar conta)
# falham com erro HTTP e os amigos não conseguem entrar.
tornar_publico() {
  [ -n "$CODESPACE_NAME" ] || return 0
  for i in $(seq 1 10); do
    gh codespace ports visibility 8000:public 5000:public -c "$CODESPACE_NAME" >/tmp/portas.log 2>&1
    PRIV="$(gh codespace ports -c "$CODESPACE_NAME" --json sourcePort,visibility \
      --jq '.[] | select(.sourcePort==8000 or .sourcePort==5000) | select(.visibility!="public") | .sourcePort' 2>>/tmp/portas.log)"
    OK8000="$(gh codespace ports -c "$CODESPACE_NAME" --json sourcePort --jq '.[] | select(.sourcePort==8000) | .sourcePort' 2>/dev/null)"
    if [ -z "$PRIV" ] && [ -n "$OK8000" ]; then
      PORTAS_OK=1
      return 0
    fi
    sleep 3
  done
  PORTAS_OK=0
}

site_ok() { curl -s -o /dev/null --max-time 3 http://localhost:8000/; }
jogo_ok() { pgrep -f "ts-node -T src/server/""server.ts" >/dev/null; }

echo "---> Ligando o banco de dados e o Redis"
sudo service postgresql start >/dev/null 2>&1 || true
(redis-cli ping >/dev/null 2>&1) || sudo service redis-server start >/dev/null 2>&1 || redis-server --daemonize yes --dir /tmp >/dev/null

# Se a página do jogo vai ser refeita, desliga antes o site e o servidor do jogo:
# o webpack precisa de muita memória e, com tudo ligado, o sistema mata ele.
if bash "$ROOT/.devcontainer/gerar-jogo.sh" --precisa; then
  echo "---> Versão nova: desligando o site por alguns minutos para refazer a página do jogo"
  pkill -f "ts-node -T src/server/""server.ts" >/dev/null 2>&1 || true
  pkill -f "agot-bg-website.dll" >/dev/null 2>&1 || true
  pkill -f "bin/Debug/net10.0/agot-bg-website" >/dev/null 2>&1 || true
  pkill -f "dotnet run --no-launch-profile" >/dev/null 2>&1 || true
  sleep 2
fi

echo "---> Conferindo a página do jogo"
VERSAO_ANTES="$(cat agot-bg-website-dotnet/agot-bg-website/wwwroot/static_game/.versao 2>/dev/null)"
bash "$ROOT/.devcontainer/gerar-jogo.sh" || { echo "ERRO ao gerar a página do jogo. Veja as mensagens acima."; exit 1; }
VERSAO_DEPOIS="$(cat agot-bg-website-dotnet/agot-bg-website/wwwroot/static_game/.versao 2>/dev/null)"

# Abrir o Codespace de novo (ou em outro aparelho) NÃO derruba o site de quem está jogando:
# se já está tudo ligado e nada mudou, só mostra o link.
# Versão do código que está rodando: se o código mudou (mesmo atualizado por fora, ex.: botão
# de sincronizar do VS Code), religa o site e o servidor do jogo para usar a versão nova.
CODIGO="$(git log -1 --format=%H -- agot-bg-website-dotnet agot-bg-game-server/src 2>/dev/null)"
if site_ok && jogo_ok && [ "$VERSAO_ANTES" == "$VERSAO_DEPOIS" ] && [ "$ATUALIZOU" != "1" ] \
   && [ "$(cat /tmp/rodando.versao 2>/dev/null)" == "$CODIGO" ]; then
  echo "---> O site já está ligado."
else
  # Para o que estiver rodando de uma vez anterior
  pkill -f "ts-node -T src/server/""server.ts" >/dev/null 2>&1 || true
  pkill -f "agot-bg-website.dll" >/dev/null 2>&1 || true
  pkill -f "bin/Debug/net10.0/agot-bg-website" >/dev/null 2>&1 || true
  pkill -f "dotnet run --no-launch-profile" >/dev/null 2>&1 || true
  sleep 1

  echo "---> Ligando o servidor do jogo (log em /tmp/servidor-do-jogo.log)"
  (
    cd "$ROOT/agot-bg-game-server"
    MASTER_API_ENABLED=true \
    MASTER_API_USERNAME=game-server \
    MASTER_API_PASSWORD=change-me-in-user-secrets \
    MASTER_API_BASE_URL=http://localhost:8001/api \
    setsid nohup yarn run run-server > /tmp/servidor-do-jogo.log 2>&1 < /dev/null &
  )

  echo "---> Ligando o site (1 a 2 minutos na primeira vez; log em /tmp/site.log)"
  (
    cd "$ROOT/agot-bg-website-dotnet/agot-bg-website"
    ASPNETCORE_ENVIRONMENT=Development \
    PublicSiteUrl="$URL" \
    setsid nohup dotnet run --no-launch-profile > /tmp/site.log 2>&1 < /dev/null &
    echo $! > /tmp/site.pid
  )

  # Espera o site responder (até 10 minutos)
  for i in $(seq 1 300); do
    site_ok && break
    if ! kill -0 "$(cat /tmp/site.pid)" 2>/dev/null; then
      tail -40 /tmp/site.log
      echo ""
      echo "ERRO: o site não ligou (veja as mensagens acima ou /tmp/site.log)."
      exit 1
    fi
    sleep 2
  done
  site_ok || { tail -20 /tmp/site.log; echo "ERRO: o site não respondeu em 10 minutos (veja /tmp/site.log)."; exit 1; }
  echo "$CODIGO" > /tmp/rodando.versao
fi

echo "---> Deixando o site público (para você e os amigos)"
tornar_publico

if [ "${PORTAS_OK:-1}" != "1" ]; then
  cat <<AVISO

  ATENÇÃO: não consegui deixar as portas públicas sozinho.
  Faça isto uma vez: aba "PORTAS" (ao lado do Terminal) -> clique com o
  botão direito na linha 8000 -> "Port Visibility" -> "Public".
  Repita na linha 5000. Sem isso, entrar e criar conta dá erro.

AVISO
fi

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

  O site continua ligado mesmo se você fechar esta aba, até o
  Codespace desligar por falta de uso.
==============================================================

MSG
