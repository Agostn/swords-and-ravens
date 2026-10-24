#!/usr/bin/env bash
# Gera o cliente do jogo e coloca dentro do site (.NET), que serve a página /play/<partida>.
# Só refaz se o código do jogo mudou desde a última vez (ex.: depois de um "git pull").
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

STAMP="$ROOT/agot-bg-website-dotnet/agot-bg-website/wwwroot/static_game/.versao"
VERSAO="$(git log -1 --format=%H -- agot-bg-game-server/src agot-bg-game-server/public agot-bg-game-server/webpack.client.local.js agot-bg-game-server/package.json 2>/dev/null || echo sem-git)"
# "--precisa": só responde se precisa refazer (sai 0 = precisa, 1 = não precisa)
if [ "$1" == "--precisa" ]; then
  if [ -f "$STAMP" ] && [ "$(cat "$STAMP")" == "$VERSAO" ]; then exit 1; fi
  exit 0
fi

if [ -f "$STAMP" ] && [ "$(cat "$STAMP")" == "$VERSAO" ] && [ "$1" != "--forcar" ]; then
  echo "Página do jogo já está atualizada."
  exit 0
fi

cd "$ROOT/agot-bg-game-server"
# Pular a compressão das imagens: sem isso leva mais de meia hora com 2 CPUs.
echo "Gerando a página do jogo (1 a 3 minutos)... log em /tmp/gerar-jogo.log"
# Memória: o Codespace tem 8 GB; o site e o servidor do jogo são desligados antes
# (iniciar.sh) e o webpack fica limitado, senão o sistema mata o processo ("Terminated").
export NODE_OPTIONS="--max-old-space-size=3072"
ok=0
for tentativa in 1 2; do
  if SKIP_IMAGE_OPTIMIZATION=1 yarn run build-local-client > /tmp/gerar-jogo.log 2>&1; then
    ok=1
    break
  fi
  echo "A geração parou na tentativa $tentativa; tentando de novo..."
  sleep 3
done
if [ "$ok" != "1" ]; then
  tail -40 /tmp/gerar-jogo.log
  echo "ERRO ao gerar a página do jogo (veja acima)."
  exit 1
fi

cd "$ROOT"
dest="agot-bg-website-dotnet/agot-bg-website/wwwroot/static_game"
rm -rf "$dest"
mkdir -p "$dest"
find agot-bg-game-server/dist -mindepth 1 -maxdepth 1 ! -name "index.html" -exec cp -r {} "$dest/" \;
mkdir -p agot-bg-website-dotnet/agot-bg-website/GameClientTemplates
cp agot-bg-game-server/dist/index.html agot-bg-website-dotnet/agot-bg-website/GameClientTemplates/play.html
# o "dotnet run" copia o modelo para a pasta bin só quando compila; garante a versão nova
for d in agot-bg-website-dotnet/agot-bg-website/bin/*/net10.0/GameClientTemplates; do
  [ -d "$d" ] && cp agot-bg-game-server/dist/index.html "$d/play.html"
done
echo "$VERSAO" > "$STAMP"
echo "Página do jogo gerada."
