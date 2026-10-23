#!/usr/bin/env bash
# Roda uma vez, quando o Codespace é criado: instala tudo que o site precisa.
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
# Sem isso o corepack para e pergunta "Do you want to continue? [Y/n]" e a instalação fica travada.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export DEBIAN_FRONTEND=noninteractive

echo "---> Banco de dados (PostgreSQL) e Redis"
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends postgresql redis-server
sudo service postgresql start
# No Codespaces o usuário "vscode" só pode usar o sudo como root sem senha; "sudo -u postgres"
# pede uma senha que não existe e a instalação trava. Por isso: sudo (root) + su postgres.
pg() { sudo su postgres -c "psql -v ON_ERROR_STOP=1 -tA"; }
echo "ALTER USER postgres PASSWORD 'example';" | pg
echo "SELECT 1 FROM pg_database WHERE datname='snr_dotnet';" | pg | grep -q 1 \
  || echo "CREATE DATABASE snr_dotnet;" | pg

echo "---> Jogo (Node)"
cd "$ROOT/agot-bg-game-server"
corepack enable >/dev/null 2>&1 || npm install -g yarn
yarn install
yarn run generate-json-schemas
[ -f .env ] || cp .env.dev.local .env

echo "---> Site (.NET)"
cd "$ROOT/agot-bg-website-dotnet"
dotnet restore agot-bg-website/agot-bg-website.csproj

echo "---> Gerando a página do jogo (1 a 3 minutos)"
bash "$ROOT/.devcontainer/gerar-jogo.sh"

echo "Instalação concluída."
