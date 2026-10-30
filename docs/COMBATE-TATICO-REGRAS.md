# Combate tático — regras e números (versão 1, 30/out, para aprovar)

Regra opcional (liga/desliga na sala de espera). O tabuleiro e a batalha do jogo original não mudam:
o mini-mapa só soma **+1 ou +2** para quem lutar melhor. Plano das etapas: `docs/PLANO-COMBATE-TATICO.md`.

Os números moram em `agot-bg-game-server/src/common/tactical-battle/tacticalBattleData.ts`,
a conta em `tacticalBattle.ts` e o campo de cada área em `tacticalFields.ts`.
O teste de equilíbrio é `tools/tactical/equilibrio.ts` (resultado em `tools/tactical/resultado.txt`).

## Em uma frase
Cada peça vira um esquadrão; os dois lados escondem onde põem cada esquadrão (3 faixas × frente/trás)
e qual função ele tem; o servidor compara faixa por faixa; quem vencer mais faixas com luta ganha o bônus.

## 1. Esquadrões
| Peça | Esquadrão (bolinhas) | Valor | Funções para escolher |
|---|---|---|---|
| Soldado | 3 | 3 | **Lanceiro**, **Escudeiro** ou **Arqueiro** |
| Cavaleiro | 2 | 6 | **Cavalaria** (carga) ou **Batedores** (cavalaria leve) |
| Máquina de cerco | 1 | 2 (muito forte contra muralha) | Catapulta |
| Navio (só no mar) | 1 | 3 | **Abordagem**, **Aríete** ou **Flechas** |
| Dragão | 1 | 3 × força do dragão | — |
| Guarnição | torre fixa atrás, no centro | 3 × valor da guarnição | — |
| Apoio de vizinho | como a peça | 80% do valor (chega depois) | igual à peça |

O valor é 3 × a força da peça no jogo original, então um exército maior continua mais forte.

## 2. Quem vence quem (o "pedra-papel-tesoura")
- **Soldados entre si:** Arqueiro > Lanceiro > Escudeiro > Arqueiro.
- **Cavalaria (carga)** atropela Arqueiro e Escudeiro, mas morre no Lanceiro.
- **Batedores** (cavalaria leve) contornam o Lanceiro, mas não passam pelo Escudeiro.
- **Catapulta:** fraca em campo aberto; derruba muralha.
- **Dragão:** forte contra todos; o que mais o machuca são arqueiros juntos.
- **Mar:** Abordagem > Aríete > Flechas > Abordagem.

Tabela (quanto rende quem está na linha contra quem está na coluna):

| | Lanceiro | Escudeiro | Arqueiro | Cavalaria | Batedores |
|---|---|---|---|---|---|
| **Lanceiro** | 1 | 1,3 | 0,75 | **1,6** | 0,8 |
| **Escudeiro** | 0,75 | 1 | **1,5** | 0,8 | 1,25 |
| **Arqueiro** | **1,4** | 0,6 | 1 | 0,75 | 1 |
| **Cavalaria** | 0,6 | 1,3 | **1,8** | 1 | 1,2 |
| **Batedores** | **1,3** | 0,8 | 1 | 0,85 | 1 |

## 3. Frente e trás
- Arqueiro e catapulta rendem mais **atrás** (1,2 / 1,0); na frente, menos (0,8 / 0,7).
- Quem luta corpo a corpo rende **na frente** (1,0); atrás vira reserva (0,6; batedores 0,8).
- **Proteção:** se a sua frente tiver pelo menos metade do valor de quem está atrás,
  a cavalaria inimiga não consegue furar e perde a vantagem contra os seus arqueiros/catapulta.

## 4. Terreno de cada faixa
| Terreno | Efeito |
|---|---|
| Aberto | Cavalaria +25%, Batedores +15% |
| Mata | Arqueiro −40%, Cavalaria −30%, Batedores −20%, Catapulta −40%; Lanceiro e Escudeiro +10% |
| Colina | Arqueiro +20%; quem defende +25% |
| Rio | quem ataca −25%; cavalos −20% |
| Vau | quem ataca −10% |
| Muralha | quem defende +40%; cavalos −30%. **Catapulta do atacante na faixa derruba** (defensor perde o bônus e a catapulta rende 3×) |
| Portão | quem defende +15%; catapulta também derruba |
| Bloqueado | faixa fechada (montanha) |

## 5. Os campos (esquerda · centro · direita)
| Campo | Faixas |
|---|---|
| Planície | aberto · aberto · aberto |
| Floresta | mata · aberto · mata |
| Montanha | colina · aberto · **bloqueado** (só 2 faixas) |
| Rio | rio · vau · rio |
| Castelo | muralha · portão · aberto |
| Fortaleza | muralha · portão · muralha |
| Mar | mar · mar · mar |

Área com castelo usa Castelo; com fortaleza, Fortaleza (pelo nível **atual**: se uma carta destruir
o castelo, vale o terreno da área). Mar é sempre Mar. As outras áreas estão na lista do item 9.

## 6. Carta de Casa
Vale do mesmo jeito para os dois lados, e é pequena de propósito (a carta já conta na batalha normal):
- cada ponto de **força** da carta: +6% em tudo o que você causa;
- cada **espada ⚔**: +5% no que você causa;
- cada **torre ▲**: −5% no que o inimigo causa.

## 7. A conta, faixa por faixa
1. **Só há luta onde os dois lados têm esquadrões.** Faixa vazia de um lado não conta como vitória
   (senão o exército maior ganharia só por ocupar mais faixas).
2. Cada esquadrão rende: valor × vantagem média contra os inimigos da faixa × frente/trás × terreno × carta.
3. **Ataque pelo lado:** quem ficou sozinho numa faixa soma 30% do que causaria nas faixas vizinhas que têm luta.
4. **Flanco:** quem vence uma faixa ganha +20% em cada faixa vizinha (uma vez só).
5. Diferença de até 5% numa faixa = empate na faixa.

## 8. Resultado
- Quem vencer **mais faixas com luta** ganha o mini-mapa.
- **+2** se venceu **todas** as faixas com luta (e houve pelo menos 2); senão **+1**.
- Mesmo número de faixas: desempata pela soma das faixas (+1). Igual de novo: empate, ninguém ganha bônus.
- Não há mini-mapa contra Força Neutra (não tem ninguém para adivinhar).

## 9. Campo de cada área sem castelo (para corrigir à vontade)
| Campo | Áreas |
|---|---|
| **Planície** | Castelo Negro, Karhold, Atalaia da Viúva, Guardamar, Septo de Pedra, Lannisporto, Marcas da Estrada do Mar, Vale de Arryn, Porto Real, Campina, Jardim de Cima, Vilavelha, A Árvore, Três Torres, Costa do Sal, Lançassolar, Pentos, Myr, Terras Disputadas |
| **Floresta** | Winterfell (Mata dos Lobos), Ponta da Garra Rachada, Mata do Rei, Ponta Tempestade (Mata da Chuva) |
| **Montanha** | Costa Pedregosa, Dedo de Pederneira, Pyke, Ninho da Águia, Montanhas da Lua, Os Dedos, Pedra do Dragão, Marcas de Dorne, Caminho dos Ossos, Passo do Príncipe, Paloferro, Norvos |
| **Rio** | Porto Branco, Fosso Cailin, Atalaia da Água Cinzenta, As Gêmeas, Correrrio, Harrenhal, Água Negra, Tombastela, Braavos, Volantis, Roine |

Lembrando: quem tem castelo (ex.: Correrrio, Winterfell, Porto Real) luta no Castelo/Fortaleza;
o terreno da lista só vale se o castelo for destruído.

## 10. O que o teste de equilíbrio mostrou
O computador procurou o jeito ótimo de os dois lados jogarem (e também jogou "no chute") em
51 batalhas diferentes: 7 tipos de exército em cada campo, mais cerco, guarnição, dragão, apoio, mar e cartas.

- **Exércitos iguais:** em todos os campos ninguém tem vitória garantida (valor ≈ 0). Toda função é usada
  — não existe uma escolha que sempre ganha. O melhor posicionamento depende do que o outro fez.
- **Exército maior:** leva vantagem, mas não certeza: ganha de 0 a 55% das vezes jogando perfeito
  (37–81% no chute), e a média do bônus fica entre 0 e +0,5. Dois cavaleiros contra três soldados,
  por exemplo, não têm vitória garantida: o lado dos soldados pode adivinhar e pôr lanceiros.
- **Exército muito menor (1 contra 3):** quase sempre perde ou empata (2–10% de vitória), o que combina
  com o jogo original — e o bônus é no máximo +1 para quem é maior.
- **Quem defende:** leve vantagem no Rio e na Fortaleza (média −0,1 a −0,3 para quem ataca);
  no Castelo e na Montanha fica equilibrado.
- **Máquina de cerco:** atacar um castelo com ela muda a média de 0 para +0,2.
- **Carta forte (3–4):** ajuda pouco (+0,1 a +0,2), como queríamos.
- **Dragão** (força 2 contra 2 soldados): perde se o outro adivinhar e juntar arqueiros; com força maior, domina.
- **Mar:** igual entre iguais; 3 navios contra 1 vence na média.
- **Empates:** jogando perfeito, os dois lados se anulam em cerca de metade das batalhas (ninguém
  ganha bônus); jogando "no chute", cerca de 1 em cada 4 batalhas empata (23% em média).

Próximo passo depois da aprovação: o protótipo jogável (etapa 4).
