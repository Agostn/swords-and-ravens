#!/usr/bin/env bash
# Publica o site do seu PC na internet com um túnel GRATUITO (Cloudflare "quick tunnel"),
# sem conta e sem abrir portas no roteador. Gera um link https://<algo>.trycloudflare.com
# para mandar aos amigos. O jogo passa pelo próprio site ("/game-ws"), então basta um link.
#
#   bash .devcontainer/jogar-online.sh          liga o túnel e mostra o link
#   bash .devcontainer/jogar-online.sh --parar  desliga o túnel
#
# O link muda toda vez que o túnel é ligado de novo. O PC precisa ficar ligado.
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
BIN="$HOME/.local/bin/cloudflared"
LOG=/tmp/tunel.log

if [ "$1" == "--parar" ]; then
  pkill -f "cloudflared tunnel" >/dev/null 2>&1 && echo "Túnel desligado." || echo "O túnel não estava ligado."
  exit 0
fi

# 1) O site precisa estar ligado
if ! curl -s -o /dev/null --max-time 3 http://localhost:8000/; then
  echo "---> O site não está ligado; ligando agora (1 a 3 minutos)..."
  bash "$ROOT/.devcontainer/iniciar.sh" || exit 1
fi

# 2) Baixa o cloudflared uma vez (programa oficial e gratuito da Cloudflare)
if ! command -v cloudflared >/dev/null 2>&1 && [ ! -x "$BIN" ]; then
  echo "---> Baixando o cloudflared (só na primeira vez)"
  case "$(uname -m)" in
    aarch64 | arm64) ARCH=arm64 ;;
    *) ARCH=amd64 ;;
  esac
  mkdir -p "$(dirname "$BIN")"
  curl -fsSL -o "$BIN" "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$ARCH" \
    || { echo "ERRO: não deu para baixar o cloudflared. Confira a internet e tente de novo."; exit 1; }
  chmod +x "$BIN"
fi
CF="$(command -v cloudflared || echo "$BIN")"

# 3) Liga o túnel (fica ligado mesmo se fechar o terminal)
pkill -f "cloudflared tunnel" >/dev/null 2>&1 || true
rm -f "$LOG"
echo "---> Ligando o túnel"
setsid nohup "$CF" tunnel --no-autoupdate --url http://localhost:8000 > "$LOG" 2>&1 < /dev/null &

URL=""
for i in $(seq 1 60); do
  URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1)"
  [ -n "$URL" ] && break
  sleep 1
done
if [ -z "$URL" ]; then
  tail -20 "$LOG"
  echo "ERRO: o túnel não deu o link. Tente de novo em 1 minuto (log em $LOG)."
  exit 1
fi

# espera o link responder (o endereço novo leva alguns segundos para funcionar)
for i in $(seq 1 30); do
  curl -s -o /dev/null --max-time 5 "$URL" && break
  sleep 2
done

cat <<MSG

==============================================================
  PRONTO! O site está na internet. Mande este link aos amigos:

  $URL

  - Cada um cria a conta e entra na partida por esse link.
  - O link vale enquanto o PC e o túnel estiverem ligados.
  - Se ligar de novo, o link muda (mande o novo).
  - Para desligar: bash .devcontainer/jogar-online.sh --parar
==============================================================

MSG
echo "$URL" > /tmp/link-do-site.txt
