#!/bin/bash
# Reinicia o servidor do jogo (nova partida).
SP=/tmp/claude-0/-home-claude/f29ad38a-3dc3-5174-b80f-ee4e26f7f62e/scratchpad
for pid in $(pgrep -f "ts-node -T src/server/server.ts"); do kill $pid; done
for pid in $(pgrep -f "yarn run run-server"); do kill $pid; done
sleep 2
cd /home/claude/swords-and-ravens/agot-bg-game-server
nohup yarn run run-server > $SP/server.log 2>&1 &
for i in $(seq 1 30); do grep -q "Launching" $SP/server.log && break; sleep 1; done
sleep 3; tail -1 $SP/server.log
