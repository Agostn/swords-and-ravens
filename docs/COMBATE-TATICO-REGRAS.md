# Combate tático — regras e números (versão 6, 31/out, para aprovar)

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
- **Decidido (31/out):** o Corvo vale em **1 batalha por rodada** (como no jogo original, o Corvo é usado uma vez por rodada). Quem tem o Corvo escolhe em qual batalha usar.

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

## Formação e duelo de campeões (versão 6, 31/out)
**Pesquisa (como outros jogos tiram a sorte do "adivinhar"):**
- *Dune* (1979/2019): na batalha os dois montam o plano escondido, mas os Atreides podem obrigar o outro a
  revelar uma parte do plano; vantagem ligada a um poder, não a todo mundo.
- *Battle for Rokugan*: fichas de combate viradas para baixo, mas o Batedor espia uma ficha e o Shugenja revela
  e descarta uma; **empate fica com quem defende**; tudo é conta fixa, sem dado.
- *A Guerra dos Tronos* original: a carta de Casa usada só volta quando todas forem usadas (dá para deduzir o
  que o outro ainda tem), e quem está mais alto nos Feudos desempata.
- Game design (Sirlin, Gamasutra): pedra-papel-tesoura "dura" com escolha às cegas é sorte; o que dá habilidade
  é contra suave, informação sobre o outro e escolhas "seguras" que valem menos mas arriscam menos.
**O que entrou:**
1. **Formação +15%** (`FORMATION_BONUS`): numa faixa, corpo a corpo **na frente** + atirador **atrás** rende +15%.
   Misturar é a escolha segura; ir tudo numa função só vira aposta. Testado com 0, 15% e 25%:
   | | sem formação | **15%** | 25% |
   |---|---|---|---|
   | Carta 2 × 0: quem tem a carta perde o mini-mapa | 38% | **15%** | 0% |
   | Carta 4 × 0: perde | 6% | **0%** | 0% |
   | Marcha +1: perde | 29% | **10%** | 10% |
   | Jogador bom × novato | +0,77 | **+0,92** | +0,96 |
   | Exércitos iguais | 29/33/38 | **36/37/27** | 100% empate (sem graça) |
   Com 25% todo mundo jogava igual e sempre empatava; 15% é o meio. O arqueiro voltou a ser bem usado.
2. **Empate → duelo de campeões:** se as faixas empatarem, os outros param e assistem; os dois campeões lutam no
   meio do campo e **vence quem tem a Lâmina de Aço Valiriano** (o mais alto nos Feudos — no jogo original é ele
   quem desempata): **+1**. No protótipo, sem ninguém marcado, a Lâmina fica com quem defende.
   O empate da batalha do tabuleiro segue a mesma regra. (`bladeHolder` na entrada da conta; `duel` no resultado.)
3. **Corvo Mensageiro:** 1 batalha por rodada.

## Animação: luta mais longa e mais mortes (31/out)
- A luta dura mais (fuga aos 10,4 s em vez de 7,4 s; fim aos 13,5 s).
- **Só visual:** quem PERDEU a batalha do tabuleiro fica com 1 boneco só em cada esquadrão (foge sozinho); a peça
  morta pelas espadas ⚔ morre inteira (qualquer tipo de tropa). Quem venceu perde metade dos bonecos dos esquadrões
  que lutaram (metade + 1 onde perdeu a faixa, sempre sobra alguém).
  Figura única (dragão, navio, catapulta) só morre se a peça foi destruída. A conta e o tabuleiro não mudam.
- Cada Casa tem armadura própria (`houseStyle.ts`): Stark cinza com pele e escudo redondo; Lannister dourado com
  capa carmesim e juba de leão; Baratheon aço escuro e amarelo, cavaleiro com galhadas; Greyjoy ferro escuro,
  braços de fora e machado; Tyrell verde esmaltado com pluma; Martell escamas de cobre, seda e pano no elmo, lança
  mais comprida; Arryn aço claro, capa azul-céu e asas de falcão; Targaryen armadura negra com espinhos vermelhos.

## Ordem de batalha (31/out, versão 2: 3 de ataque × 3 de defesa)
Quando aperta "Pronto", cada lado escolhe escondido como o comandante vai lutar: **quem ataca escolhe uma ordem
de ataque, quem defende uma de defesa.** O bônus depende das tropas (até +18%). **Quem vence a ordem do outro ganha
+5% a mais; a do outro continua valendo** (anular era forte demais; +10% pesava demais no chute, 31/out). Referências: táticas do *Crusader Kings II* (dependem das tropas, têm
contra-táticas), formações de *Total War* (parede de escudos para flechas, muro de lanças para cavalo, flanco fraco)
e cartas de batalha de *Hannibal: Rome vs Carthage*.
| Ataque | Precisa de | Bônus | Vence | Perde para |
|---|---|---|---|---|
| 🐎 Carga | cavalaria | +8% cada | Reserva | Muro de lanças |
| ⇆ Cercar | lanceiros/batedores, tropas em 2+ faixas | +6% cada | Parede de escudos | Reserva |
| 🏹 Chuva de flechas | arqueiros | +6% cada | Muro de lanças | Parede de escudos |

| Defesa | Precisa de | Bônus | Vence | Perde para |
|---|---|---|---|---|
| 🛡 Parede de escudos | escudeiros | +6% cada | Chuva de flechas | Cercar |
| 🔱 Muro de lanças | lanceiros | +6% cada | Carga | Chuva de flechas |
| ⛨ Reserva | esquadrões na linha de trás | +5% cada | Cercar | Carga |
**Na animação, cada exército faz o que a ordem manda:** a Carga vem correndo; o Cercar abre pelos lados e entra
de lado; a Chuva de flechas solta uma saraivada junta e atira mais rápido; a Parede e o Muro seguram a linha e
esperam (a parede defende mais golpes; no muro, o cavalo que carrega se joga nas lanças e leva o golpe); a Reserva
deixa quem está atrás esperando e entra correndo depois.
**Todas as tropas seguem a ordem, não só as que dão o bônus (31/out):** na Parede, no Muro e na Reserva os
arqueiros ficam atrás da linha e só atiram em quem chega no alcance; na Chuva de flechas a infantaria espera a
saraivada antes de avançar; na Carga a infantaria vem mais rápido atrás dos cavalos; no Cercar os arqueiros
também abrem para os lados.
O computador escolhe como no CK2: sorteia entre as que pode usar, com mais peso para a que rende mais.
**Balanço do "vencer a ordem do outro" (31/out, `tools/tactical/taticas.ts`, 1.560 batalhas sorteadas de 2 a 4
peças, testando os 9 pares de ordem):**
| Bônus por vencer a ordem | A ordem muda quem ganha | Nessas batalhas, quem acertou a do outro vence |
|---|---|---|
| 0% | 14% | 33% |
| +3% | 16% | 40% |
| **+5% (agora)** | **18%** | **44%** |
| +10% (antes) | 21% | 52% |
Acertar a ordem do outro é chute (os dois escolhem escondido), então ficou em +5%: ainda vale a pena pensar no que
o outro vai fazer, mas o que mais conta é escolher a ordem que combina com as SUAS tropas. Máximo: +23% (18% + 5%).

## Cartas fora das faixas e bônus que cresce (31/out)
- **As cartas de Casa não entram na luta das faixas** (`CARDS_IN_TACTICAL = false`): contam só na batalha do
  tabuleiro, como no jogo original. A Mesa de Batalha usa só tropas, posições, terreno, ordem de marcha e a ordem
  de batalha.
- **O bônus da batalha cresce com o tamanho dos exércitos:** +1, e mais +1 a cada 4 de força do MENOR exército
  (`BONUS_STRENGTH_STEP = 4`). Vencendo todas as faixas, +1 a mais. Exemplos: 2 contra 2 → +1; 4 contra 5 → +2;
  8 contra 9 → +3. Assim, no fim do jogo, com exércitos grandes, o bônus não fica pequeno demais. O Duelo de
  campeões dá o mesmo bônus base.
- **Ordem dos cálculos (31/out):** 1) luta nas faixas (sem cartas) → bônus da batalha; 2) batalha do tabuleiro
  (tropas + carta + ordem + bônus) → quem vence; 3) espadas ⚔ do vencedor − torres ▲ do perdedor → quais peças
  morrem. Só DEPOIS disso a animação toca, então ela já mostra o resultado de tudo. Das cartas, na animação só
  importam as espadas e as torres (quem morre). Um esquadrão só morre inteiro na animação se a peça morreu no
  tabuleiro; os outros perdem bonecos, mas sempre sobra pelo menos 1. No fim aparece "X VENCE A BATALHA" com quantas
  peças morreram, e o resultado de cada faixa fica numa etiqueta pequena.

## Navios só no mar (31/out)
- Em batalha de terra (inclusive no rio) **os navios não entram no campo**. Barco no meio do rio ao lado de
  cavaleiro ficava estranho.
- Navio apoiando de fora vira um **bônus pronto, do mesmo tipo da ordem**: cada navio de apoio vale +1, como a
  Marcha +1 (+6% na luta das faixas). Na batalha do tabuleiro ele soma +1 de força, como no jogo original
  ("navios de apoio +N" na conta).
- Na batalha naval (campo Mar) os navios continuam sendo as peças do campo.
- O motor ainda aceita navio de apoio como peça em terra (função "flechas"); quem decide não colocar é a tela.
  Quando ligar no jogo de verdade, fazer o mesmo: navio de apoio em terra entra como ponto de ordem.

## Bandeira, limite de peças e muralha (31/out)
- **Bandeira:** no fim da batalha, um soldado que sobrou da Casa vencedora (o campeão do duelo, se houver) anda
  até o meio da luta e finca a bandeira com o brasão da Casa. No mar, a bandeira sobe no navio. A animação dura
  1,5 s a mais para dar tempo.
- **Limite de peças, como no jogo original:** a trilha de Suprimento só deixa ter exército de até **4 peças**
  (o nível mais alto é 4, 3, 2, 2, 2). No fim do jogo a batalha típica tem um exército de 3 ou 4 peças e mais 1
  ou 2 áreas apoiando. Então: exército até 4 peças; apoio no campo até 4; **no máximo 2 peças por casinha**.
  6 casinhas × 2 = 12 lugares para no máximo 8 peças (na montanha, com uma faixa fechada, 4 × 2 = 8: ainda dá).
  Tentar pôr a 3.ª peça numa casinha pisca "cheia: máx. 2" e não coloca.
- **Muralha:** quem defende fica em pé no caminho de ronda, em cima do muro, e quem ataca fica no pé do muro.
  Os dois golpeiam por cima das ameias (antes, ninguém conseguia acertar e os bonecos morriam sem levar golpe).
  **No portão**, quem defende abre e sai para lutar na frente do muro (antes a luta ficava em cima da pedra e
  parecia "dentro do muro").

## Mais volume: peça vira esquadrões (31/out)
- Cada peça do tabuleiro vira mais de um esquadrão na Mesa, e a força da peça é dividida entre eles
  (`share` no motor): **soldado = 2 esquadrões**; **cavaleiro = 2 esquadrões a cavalo ou 4 a pé** (botão
  "A pé" / "Montar"; a força no tabuleiro continua 2); **máquina de cerco = 2**; soldado de apoio = 2. Dragão,
  navio e guarnição continuam 1.
- Assim, quem tem mais cavaleiros que soldados pode desmontar e cobrir as funções de soldado (lanceiro,
  escudeiro, arqueiro).
- O bônus das ordens conta por PEÇA (um soldado dividido em 2 lanceiros conta 1), para não dobrar.
- Baixas continuam por peça: se a peça morre no tabuleiro, todos os esquadrões dela morrem.
- Limites: exército até 4 peças; apoio no campo até 2 peças; até **12 esquadrões por lado**, 2 por casinha
  (na montanha, com uma faixa fechada, 3 por casinha). Quem sobra na reserva ao apertar "Pronto" vai para a
  casinha livre mais perto do centro.
- O computador: com muitos esquadrões a lista de jogadas fica gigante, então ele sorteia 450 jogadas (metade
  concentrando a força em 1 ou 2 faixas) em vez de testar todas.
- **Guarnição x máquina de cerco:** guarnição é a defesa fixa do castelo de quem defende (a ficha de guarnição
  do jogo), fica no centro e não é peça do exército. Máquina de cerco é peça de quem ataca: a catapulta que
  derruba muralha e portão, e só vale contra castelo e fortaleza. Agora cada máquina tem 2 soldados operando e
  atira onde houver luta.
- **Dragão contra dragão:** se os dois lados têm dragão, eles brigam no ar, rodando um em volta do outro, e o
  fogo entre eles não queima o chão.
- **Estandarte:** no fim, o vencedor finca um estandarte maior, no estilo dos estandartes pendurados (travessa,
  pano comprido com o brasão, ponta com franja), nas cores de cada Casa.
- **Ordem de batalha:** tocar numa ordem só marca; precisa apertar "Confirmar" (ou "Voltar").
- A etiqueta "faixa: X" do fim saiu (confundia); fica só o resultado final.
