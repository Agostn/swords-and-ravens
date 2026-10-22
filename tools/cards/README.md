# Cartas e mapa em PT-BR

- `cardpt.py`: biblioteca que apaga o texto em inglês de uma área da carta e escreve o texto em português
  (fontes em `fonts/`, licença OFL). Ignora manchas grandes (desenhos), só apaga formas do tamanho de letras.
- `samples.py PASTA`: gera a amostra de cada tipo de carta (aprovação antes de fazer todas).
- `mappt.py ENTRADA SAIDA --use labels/X.json`: troca os nomes das plaquinhas do mapa usando uma tabela
  **conferida à mão** (posição + nome em inglês). Sem `--use`, tenta achar as plaquinhas sozinho com OCR,
  só para ajudar a montar a tabela — não usar o automático direto: ele já confundiu "East Summer Sea" com
  "West Summer Sea".
- `grid.py`: desenha uma grade sobre as imagens para medir as áreas.

As imagens em PT vão para `agot-bg-game-server/public/images/pt-BR/` (mesma estrutura de pastas);
o jogo escolhe pela língua escolhida, e o inglês continua com as imagens originais.
