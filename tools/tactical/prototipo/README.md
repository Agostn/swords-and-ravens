# Protótipo do combate tático ("Mesa de Batalha")

Página única (HTML com o código dentro) para testar o mini-mapa antes de ele entrar no jogo.
Usa exatamente a mesma conta do jogo (`agot-bg-game-server/src/common/tactical-battle`) e o mesmo
"computador" do teste de equilíbrio (`tools/tactical/solver.ts`).

- `app.ts`: telas (início com batalhas prontas, montar batalha, posicionar, luta e resultado) e o arrastar/tocar.
- `render.ts`: desenho do campo no canvas (terreno pintado, fichas, muralhas, névoa).
- `battle.ts`: a luta animada com soldadinhos (andam, lutam, atiram e fogem). Só ilustra o resultado que a conta já decidiu.
- `tutorial.ts`: o tutorial ilustrado do botão "?" (6 telas).
- `data.ts`: textos, Casas e batalhas prontas (inspiradas nos livros).
- `worker.ts`: o computador pensa em segundo plano (Web Worker), para a tela não travar.
- `template.html`: estilo e estrutura da página.
- `build.js`: junta tudo em `combate-tatico.html` (usa o webpack e o ts-loader do servidor do jogo).

Gerar: `node tools/tactical/prototipo/build.js` (na raiz do repositório).
Abrir: qualquer navegador abre o `combate-tatico.html` direto do disco.
