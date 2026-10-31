# Protótipo do combate tático ("Mesa de Batalha")

Página única (HTML com o código dentro) para testar o mini-mapa antes de ele entrar no jogo.
Usa exatamente a mesma conta do jogo (`agot-bg-game-server/src/common/tactical-battle`) e o mesmo
"computador" do teste de equilíbrio (`tools/tactical/solver.ts`).

- `app.ts`: telas (início com batalhas prontas, montar batalha, posicionar, luta e resultado) e o arrastar/tocar.
- `render.ts`: desenho do campo no canvas (terreno pintado, fichas, muralhas, névoa).
- `battle.ts`: a luta animada com soldadinhos (andam, lutam, atiram e fogem). Só ilustra o resultado que a conta já decidiu.
- `figures.ts`: desenha cada figura (usa os sprites; se as imagens ainda não carregaram, usa um desenho em vetor). Cada peça vira 4 bonequinhos.
- `sprites.ts`: ferramentas de pixel art (contorno, pixelar) e catapulta, torre e navio.
- `soldiers.ts`: soldados a pé (lanceiro, escudeiro, arqueiro) em pixel art, desenhados no código, no mesmo modelo para todas as Casas.
- `houseStyle.ts`: armadura de cada Casa (metal, capa, elmo, escudo e brasão), pesquisada nos livros e na série.
- `pixelart.ts`: cavaleiro normando (cavalo galopando, escudo de pipa, lança com flâmula ou espada) e dragão vermelho, desenhados no próprio código.
- `ground.ts`: detalhes do chão de cada terreno (árvores, pedras, juncos, dunas, ondas do mar).
- `assets.ts`: a única imagem embutida (textura de grama, CC0).
- `galeria.ts`: página de teste com todas as figuras (só para conferir o desenho).
- `walls.ts`: muralhas, portão, torres, pátio de pedra e estrada (pixel art desenhada no código).
- `teste/`: teste de 400 lutas aleatórias (`node tools/tactical/prototipo/teste/rodar.js`).
- `tutorial.ts`: o tutorial ilustrado do botão "?" (7 telas, inclui a Reação).
- `data.ts`: textos, Casas e batalhas prontas (inspiradas nos livros).
- `worker.ts`: o computador pensa em segundo plano (Web Worker), para a tela não travar.
- `template.html`: estilo e estrutura da página.
- `build.js`: junta tudo em `combate-tatico.html` (usa o webpack e o ts-loader do servidor do jogo).

Gerar: `node tools/tactical/prototipo/build.js` (na raiz do repositório).
Abrir: qualquer navegador abre o `combate-tatico.html` direto do disco.

## Arte e créditos
- Nenhuma imagem de terceiros além da grama (CC0): soldados, cavaleiros e dragão são desenhados no código (31/out).
  **Falta confirmar autor e licença** antes de usar no site público (ver RISCOS H45).
- Textura de grama: "Seamless grass texture II", de athile, OpenGameArt, licença CC0.
