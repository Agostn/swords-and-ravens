#!/usr/bin/env bash
# Gera o cliente do jogo e coloca dentro do site (.NET), que serve a página /play/<partida>.
# Só refaz se o código do jogo mudou desde a última vez (ex.: depois de um "git pull").
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

STAMP="$ROOT/agot-bg-website-dotnet/agot-bg-website/wwwroot/static_game/.versao"
VERSAO="$(git log -1 --format=%H -- agot-bg-game-server/src agot-bg-game-server/public agot-bg-game-server/webpack.client.local.js agot-bg-game-server/package.json 2>/dev/null || echo sem-git)"
if [ -f "$STAMP" ] && [ "$(cat "$STAMP")" == "$VERSAO" ] && [ "$1" != "--forcar" ]; then
  echo "Página do jogo já está atualizada."
  exit 0
fi

cd "$ROOT/agot-bg-game-server"
# Pular a compressão das imagens: sem isso leva mais de meia hora com 2 CPUs.
SKIP_IMAGE_OPTIMIZATION=1 yarn run build-local-client

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
