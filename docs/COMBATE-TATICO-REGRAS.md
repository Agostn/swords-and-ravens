# Combate tático — regras e números (versão 4, 30/out, para aprovar)

Regra opcional (liga/desliga na sala de espera). O tabuleiro e a batalha do jogo original não mudam:
o mini-mapa só soma **+1 ou +2** para quem lutar melhor. Plano das etapas: `docs/PLANO-COMBATE-TATICO.md`.

Os números moram em `agot-bg-game-server/src/common/tactical-battle/tacticalBattleData.ts`,
a conta em `tacticalBattle.ts` e o campo de cada área em `tacticalFields.ts`.
O teste de equilíbrio é `tools/tactical/equilibrio.ts` (resultado em `tools/tactical/resultado.txt`).

## Em uma frase
Cada peça vira um esquadrão; os dois lados escondem onde põem cada esquadrão (3 faixas × frente/trás)
e qual função ele tem; quem tem o **Corvo Mensageiro** vê o exército do outro e pode mudar **1 esquadrão**;
o servidor compara faixa por faixa; quem vencer mais faixas com luta ganha o bônus.

## 1. Esquadrões
| Peça | Esquadrão (bolinhas) | Valor | Funções para escolher |
|---|---|---|---|
| Soldado | 4 bonecos | 1 | **Lanceiro**, **Escudeiro** ou **Arqueiro** |
| Cavaleiro | 4 bonecos | 2 | **Cavalaria** (carga) ou **Batedores** (cavalaria leve) |
| Máquina de cerco | 1 | **4 só quando ataca castelo/fortaleza**; senão 0 (não entra) | Catapulta |
| Navio no mar | 1 | 1 | **Abordagem**, **Aríete** ou **Flechas** |
| Navio apoiando batalha em terra | 1 | 1 × 80% | **Flechas** (atira do litoral, como arqueiro) |
| Dragão | 1 | força do dragão na rodada | — |
| Guarnição (só de quem defende) | torre fixa atrás, no centro | valor da guarnição | — |
| Apoio de vizinho | como a peça | 80% do valor (chega depois) | igual à peça |
| Peça ferida (que recuou) | não entra | 0 | — |

O valor é **a força da peça no jogo original, na situação da batalha** — o mesmo número do tabuleiro
(antes era 3 ×; a conta é proporcional, então nada muda no resultado, só fica mais fácil de entender). Assim o exército maior
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

Tabela (quanto rende quem está na linha contra quem está na coluna). **Desde a versão 4 a conta usa só 70% do
efeito** (`COUNTER_SCALE` = 0,7): 1,5 vira 1,35 e 0,6 vira 0,72. Dragão, torre e catapulta ficam com o valor inteiro.

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
| Rio | quem ataca −20%; cavalos −20% |
| Vau | quem ataca −5% |
| Pântano | cavalaria −40%, batedores −30%, catapulta −50%, escudeiro −10%; quem ataca −10%, quem defende +10% (conhece o caminho) |
| Calçada | a estrada por cima do pântano: cavalos −10%, quem ataca −10% |
| Areia | armadura pesada sofre no calor: cavalaria −20%, escudeiro −10%; batedores +20% e lanceiro +5% (lanças dornesas); quem ataca −10% |
| Muralha | quem defende +30%; cavalos −30%. **Catapulta do atacante na faixa derruba**: o defensor perde o bônus |
| Portão | quem defende +10%; catapulta também derruba |
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
- **Ninguém se encontrou?** Se em nenhuma faixa os dois lados estão, o ataque não passa sem luta:
  os exércitos marcham e **se encontram no centro** (cada esquadrão mantém a linha e a função)
  e a conta é feita lá. Testamos também "empate" e "a defesa segura a área": o empate deixava
  metade das batalhas sem nada acontecer, e dar a vitória à defesa a deixava forte demais.
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
apoio (inclusive de navio), ordens, mar e cartas. Resultado completo: `tools/tactical/resultado.txt`.

- **Exércitos iguais (é onde o mini-mapa decide mais):** em Planície, Colinas, Floresta, Montanha e
  Deserto ninguém tem vitória garantida (cerca de 35–40% para cada lado, o resto empate, jogando perfeito).
  Toda função é usada: não existe escolha que sempre ganha.
- **Quem defende** leva vantagem onde faz sentido: **Rio, Pântano, Castelo e Fortaleza**
  (média de −0,2 a −0,55 para quem ataca).
- **Exército maior:** jogando perfeito, quem tem mais tropas vence o mini-mapa (+1, raramente +2).
  Jogando normal (no chute), o menor ainda vence de 2% a 28% das vezes, conforme a diferença. Isso combina com o jogo
  original: a força das tropas manda; o mini-mapa decide as batalhas parelhas.
- **Lanceiros contra cavaleiros:** dois cavaleiros contra três soldados no Pântano, no Rio ou no Castelo
  não têm vitória garantida.
- **Máquina de cerco:** contra castelo ela decide o mini-mapa a favor de quem ataca (+1), mesmo contra
  3 soldados; fora de castelo não muda nada (igual ao jogo original).
- **Ordens:** Marcha +1 contra Defesa +1 se anulam; Marcha +1 sozinha: +0,27; Marcha −1 contra Defesa +2: −0,34.
- **Carta forte (3–4):** ajuda um pouco (+0,3 a +0,5).
- **Dragão** (força 2 contra 2 soldados): se o outro juntar arqueiros, empata; com força maior, domina.
- **Mar:** igual entre iguais; 3 navios contra 1 vence.
- **Empates:** raros agora (cerca de 6% jogando no chute), porque os exércitos sempre se encontram.

Próximo passo: o protótipo jogável (etapa 4) — feito, link no chat e em `tools/tactical/prototipo`.

## Ajuda de longe (30/out)
Quem fica sozinho numa faixa ajuda onde tem luta: a faixa vizinha recebe 30% do que ele causaria lá.
Se não houver luta na vizinha, ele atravessa o campo e ajuda a faixa da outra ponta com 15% (metade).
Assim nenhuma peça fica inútil, mas ficar longe da luta custa caro. (`UNOPPOSED_FLANK_SHARE` = 0,30; `FAR_FLANK_SHARE` = 0,15.)

## Corvo Mensageiro (versão 5, 31/out)
Testamos os dois lados mudarem 1 esquadrão depois de revelar (versão 4): ficou confuso e pouco intuitivo.
Agora **só quem tem o Corvo Mensageiro** (o primeiro da trilha da Corte do Rei) recebe o recado: quando os dois
ficam prontos, ele vê o exército do outro e pode mudar **1 esquadrão** (lugar e/ou função). O outro lado não muda nada.
- É uma vantagem ligada a uma mecânica do jogo original, como as outras do Corvo (trocar uma ordem, espiar os selvagens).
  No futuro, heróis ou cartas também podem dar esse poder.
- Servidor: `tacticalReaction.ts` (`isValidReaction`: mesmos esquadrões, no máximo 1 mudado, guarnição parada).
  Computador: `bestReply` em `tools/tactical/solver.ts` (a melhor troca vendo tudo).
- **Para decidir:** se o Corvo deve ser usado uma vez por rodada (em uma batalha só) ou em todas as batalhas da rodada.

## Batalha no tabuleiro e baixas (versão 4, 30/out)
O mini-mapa só dá **+1 ou +2**. A batalha continua a do jogo original:
força das peças (com apoio) + carta de Casa + ordem + bônus do mini-mapa. Quem perde sofre
**baixas = espadas do vencedor − torres do perdedor** (o perdedor escolhe quais peças; no protótipo é sorteado).
Apoio não sofre baixa; máquina de cerco de quem perde é destruída.
**A animação segue isso:** peça destruída = o grupo inteiro de bonecos morre; peça que sobrevive perde 1 ou 2
bonecos (só visual, e só se houve baixa) e o resto foge; o vencedor não perde peça; sem espada, ninguém morre e
quem perdeu recua. Dragão (1 figura) só morre se for uma das baixas.

## Sorte x estratégia: o que o teste mostrou (versão 4, 30/out)
Teste novo: `tools/tactical/influencia.ts` — batalha inteira (tropas + apoio + carta de Casa sorteada do baralho
Stark + mini-mapa jogado bem pelos dois), em 6 tipos de exército × 3 campos × 25 pares de carta.
| | Antes (tabela inteira, sem Reação) | Agora (70% + Reação) |
|---|---|---|
| Mini-mapa muda quem vence a batalha | 13,7% | ~11% |
| Carta de Casa muda quem vence | 15,7% | ~10% |
| Carta 4 × 0, exércitos iguais: quem tem a carta perde o mini-mapa | 35% | 6% (sem Corvo) |
| Marcha +1, exércitos iguais: quem tem a ordem perde | 30% | 0–8% |
| Jogador bom contra novato (bônus médio, de −2 a +2) | +0,67 | +0,8 (sem Corvo); +1,3 a +1,4 (quando os dois mudavam) |
| Exércitos iguais, tudo igual: atacante / defensor / empate | 41% / 42% / 17% | ~50% / ~15% / ~35% |
- **Leitura:** a vantagem de fora (mais tropas, carta, ordem, apoio) agora quase sempre se confirma, e pensar
  rende o dobro. O que ainda decide entre exércitos idênticos é ler o campo na Reação.
- Com a versão 5 (só o Corvo muda), a vantagem de "última palavra" do atacante acabou: ela vai para quem tem o Corvo.
- Arqueiro ficou um pouco menos usado no jogo ótimo (0,8 de 4 escolhas); ainda é a resposta ao lanceiro.

