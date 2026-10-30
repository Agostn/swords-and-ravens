# Protótipo do combate tático ("Mesa de Batalha")

Página única (HTML com o código dentro) para testar o mini-mapa antes de ele entrar no jogo.
Usa exatamente a mesma conta do jogo (`agot-bg-game-server/src/common/tactical-battle`) e o mesmo
"computador" do teste de equilíbrio (`tools/tactical/solver.ts`).

- `app.ts`: telas (configurar a batalha, posicionar, animação e resumo).
- `template.html`: estilo e estrutura da página.
- `build.js`: junta tudo em `combate-tatico.html` (usa o webpack e o ts-loader do servidor do jogo).

Gerar: `node tools/tactical/prototipo/build.js` (na raiz do repositório).
Abrir: qualquer navegador abre o `combate-tatico.html` direto do disco.
