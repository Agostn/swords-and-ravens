# Combate tático — regras e números (versão 2, 30/out, para aprovar)

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
| Máquina de cerco | 1 | **12 só quando ataca castelo/fortaleza**; senão 0 (não entra) | Catapulta |
| Navio no mar | 1 | 3 | **Abordagem**, **Aríete** ou **Flechas** |
| Navio apoiando batalha em terra | 1 | 3 × 80% | **Flechas** (atira do litoral, como arqueiro) |
| Dragão | 1 | 3 × força do dragão na rodada | — |
| Guarnição (só de quem defende) | torre fixa atrás, no centro | 3 × valor da guarnição | — |
| Apoio de vizinho | como a peça | 80% do valor (chega depois) | igual à peça |
| Peça ferida (que recuou) | não entra | 0 | — |

O valor é **3 × a força da peça no jogo original, na situação da batalha**. Assim o exército maior
continua mais forte, e tudo o que o jogo original diz sobre força continua valendo:
- **Máquina de cerco:** no jogo original vale 4 só quando ataca (ou apoia o ataque a) área com
  Castelo/Fortaleza, e 0 no resto (inclusive defendendo). Aqui é igual: fora disso ela fica de fora.
  Dentro do mini-mapa ela é feita para muralha: numa faixa sem muralha/portão rende só a metade.
- **Peça ferida** vale 0 no jogo original; aqui também não entra.

## 2. Quem vence quem (o "pedra-papel-tesoura")
- **Soldados entre si:** Arqueiro > Lanceiro > Escudeiro > Arqueiro.
- **Cavalaria (carga)** atropela Arqueiro e Escudeiro, mas morre no Lanceiro.
- **Batedores** (cavalaria leve) contornam o Lanceiro, mas não passam pelo Escudeiro.
- **Catapulta:** derruba muralha; fraca contra quem chega perto (cavalos 2×, lanças 1,5×).
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
| Pântano | cavalaria −40%, batedores −30%, catapulta −50%, escudeiro −10%; quem ataca −15%, quem defende +10% (conhece o caminho) |
| Calçada | a estrada por cima do pântano: cavalos −10%, quem ataca −10% |
| Areia | armadura pesada sofre no calor: cavalaria −20%, escudeiro −10%; batedores +20% e lanceiro +5% (lanças dornesas); quem ataca −10% |
| Muralha | quem defende +40%; cavalos −30%. **Catapulta do atacante na faixa derruba**: o defensor perde o bônus |
| Portão | quem defende +15%; catapulta também derruba |
| Bloqueado | faixa fechada (montanha) |

## 5. Os campos (esquerda · centro · direita)
| Campo | Faixas |
|---|---|
| Planície | aberto · aberto · aberto |
| Colinas | colina · aberto · colina |
| Floresta | mata · aberto · mata |
| Montanha | colina · aberto · **bloqueado** (só 2 faixas) |
| Rio | rio · vau · rio |
| Pântano | pântano · calçada · pântano |
| Deserto | areia · aberto · areia |
| Castelo | muralha · portão · aberto |
| Fortaleza | muralha · portão · muralha |
| Mar | mar · mar · mar |

Área com castelo usa Castelo; com fortaleza, Fortaleza (pelo nível **atual**: se uma carta destruir
o castelo, vale o terreno da área). Mar é sempre Mar. As outras áreas estão na lista do item 9.

## 6. Carta de Casa e ordens
Pequenas de propósito, porque já contam na batalha normal do tabuleiro:
- cada ponto de **força** da carta: +6% em tudo o que você causa;
- cada **espada ⚔**: +5% no que você causa;
- cada **torre ▲**: −5% no que o inimigo causa;
- **ordem da área**, como no jogo original: **Marcha −1 / +0 / +1** de quem ataca e **Defesa +1 / +2**
  de quem defende valem como pontos de força: +6% por ponto (Marcha −1: −6%);
- **Apoio +1:** os esquadrões que vieram daquele apoio rendem +6%.

Com isso, Marcha +1 contra Defesa +1 se anulam, como no tabuleiro.

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

### Regras do jogo original que continuam valendo
- A Espada de Aço Valiriano é usada **depois** do mini-mapa (quem tem a espada já vê o resultado).
- Efeitos escritos das Cartas de Casa (Tyrion, Aeron, Doran…) acontecem antes, como sempre.
- Máquina de cerco que perde a batalha é destruída (não recua); baixas pelas espadas e torres das cartas;
  retirada e peças feridas: tudo igual ao original.
- Incursão que tira uma ordem de Apoio antes da batalha: aquele apoio não vem (não aparece no mini-mapa).
- Vassalos: quem posiciona é o jogador que comanda o vassalo.

## 9. Campo de cada área (pesquisado nos livros, A Wiki of Ice and Fire)
Áreas com castelo ou fortaleza lutam no campo **Castelo/Fortaleza**; o terreno abaixo só vale se uma carta
destruir o castelo. Mar é sempre **Mar**.

| Campo | Áreas (o que dizem os livros) |
|---|---|
| **Planície** | Castelo Negro (o Dom, ao sul da Muralha; o castelo não tem muralha própria), Atalaia da Viúva (ponta de península), Guardamar, Lannisporto, Vale de Arryn (vale fértil), Porto Real, Campina, Jardim de Cima, Vilavelha, A Árvore, Três Torres, Marcas de Dorne (campo aberto de capim e charneca), Pentos, Myr (costa fértil), Terras Disputadas (capim seco, terra arrasada) |
| **Colinas** | Costa Pedregosa (costa de seixos; para dentro, colinas e lagos), Dedo de Pederneira (península rochosa), Septo de Pedra (cidade murada num morro), Marcas da Estrada do Mar (colinas do Oeste), Os Dedos (pedregoso, sem árvores, varrido pelo vento), Norvos (Colinas de Norvos, à beira do Noyne) |
| **Floresta** | Karhold (rio arborizado), Winterfell (Mata dos Lobos), Ponta da Garra Rachada (vales, brejos e mata fechada, que o povo de lá usa para lutar), Mata do Rei, Ponta Tempestade (Mata da Chuva) |
| **Montanha** | Pyke (ilhas de rocha), Ninho da Águia, Montanhas da Lua, Pedra do Dragão (ilha vulcânica), Caminho dos Ossos e Passo do Príncipe (Montanhas Vermelhas) |
| **Rio** | Porto Branco (foz do Faca Branca), As Gêmeas (Ramo Verde), Correrrio, Harrenhal (Olho de Deus), Água Negra, Tombastela (foz do Torrentine), Braavos (laguna), Volantis (foz do Roine), Roine |
| **Pântano** | Fosso Cailin e Atalaia da Água Cinzenta (o Gargalo) |
| **Deserto** | Paloferro (leste de Dorne, seco e pedregoso), Costa do Sal, Lançassolar |

## 10. O que o teste de equilíbrio mostrou
O computador procurou o jeito ótimo de os dois lados jogarem (e também jogou "no chute") em
**79 batalhas**: 7 tipos de exército em cada um dos 9 campos de terra, mais cerco, guarnição, dragão,
apoio (inclusive de navio), ordens, mar e cartas.

- **Exércitos iguais:** em Planície, Colinas, Floresta, Montanha, Deserto e Castelo ninguém tem vitória
  garantida (valor ≈ 0). Toda função é usada: não existe escolha que sempre ganha.
- **Quem defende** leva uma pequena vantagem onde faz sentido: **Rio, Pântano e Fortaleza**
  (média de −0,1 a −0,3 para quem ataca).
- **Exército maior:** leva vantagem, mas não certeza: jogando perfeito ganha de 0 a 53% das vezes
  (39–81% no chute), média do bônus entre 0 e +0,5. Dois cavaleiros contra três soldados não têm
  vitória garantida: o outro lado pode adivinhar e pôr lanceiros.
- **Exército muito menor (1 contra 3):** quase sempre perde ou empata (2–10% de vitória), como no jogo
  original. O bônus de quem é maior fica em +1.
- **Máquina de cerco:** contra castelo, 2 soldados + máquina contra 2 soldados → média +0,33; contra
  3 soldados fica equilibrado. Fora de castelo ela não muda nada (igual ao jogo original).
  Contra fortaleza com guarnição 2, 2 soldados + máquina contra 2 soldados ganha o mini-mapa sempre
  (+1): no tabuleiro esse ataque também é bem mais forte (6 contra 4).
- **Ordens:** Marcha +1 contra Defesa +1 se anulam; Marcha +1 sozinha: +0,09; Marcha −1 contra Defesa +2: −0,11.
- **Navio apoiando em terra:** +0,14 para quem recebe o apoio.
- **Carta forte (3–4):** ajuda pouco (+0,1 a +0,2), como queríamos.
- **Dragão** (força 2 contra 2 soldados): perde se o outro adivinhar e juntar arqueiros; com força maior, domina.
- **Mar:** igual entre iguais; 3 navios contra 1 vence na média.
- **Empates:** jogando perfeito, os dois lados se anulam em cerca de metade das batalhas (ninguém
  ganha bônus); jogando "no chute", cerca de 1 em cada 4 batalhas empata (24% em média).

Próximo passo depois da aprovação: o protótipo jogável (etapa 4).
