# Ferramentas de tradução e teste

Scripts usados para traduzir o cliente do jogo para PT-BR e testar a partida.
Ajuste os caminhos absolutos no topo de cada script antes de usar.

| Script | O que faz |
|---|---|
| `strings.js` | Lista os textos em inglês de arquivos `.ts/.tsx` (linha e texto). |
| `codemod-jsx.js` | Converte textos JSX em `t()`/`tr()` com chaves `auto.<arquivo>.<n>` e guarda o inglês num JSON. |
| `codemod-strings.js` | Segunda passada: textos entre aspas mostrados na tela (`title`, `confirm()`, ternários...). |
| `codemod-common.js` | Troca rótulos comuns (Confirm, Reset, Ready...) e "Waiting for X...". |
| `game.js` | Cria uma partida de teste de 3 jogadores (abas `#1`, `#2`, `#3`) e tira print. |
| `bot.js` | Joga a partida sozinho usando as funções do próprio jogo e tira print de cada tela nova. |

Para rodar o jogo localmente: ver `agot-bg-game-server/README.md`. Para começar
uma partida nova, apague `agot-bg-game-server/src/server/website-client/local-entire-game.json`
e reinicie o servidor.

As traduções ficam em `agot-bg-game-server/src/client/i18n/locales/`:
`en*.ts` definem as chaves (inglês) e `pt-BR*.ts` as traduções. O TypeScript
acusa erro se faltar alguma chave em português.
