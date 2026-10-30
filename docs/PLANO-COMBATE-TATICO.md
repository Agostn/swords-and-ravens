# Plano: Combate tático (mini-mapa de batalha) e depois Heróis

Regra opcional, ligada/desligada pelo criador da partida na sala de espera (como "Marés da Batalha").
Com ela desligada, o jogo continua exatamente como o original.

## Como a batalha fica (resumo das decisões de 30/out)

1. Ataque declarado, apoios escolhidos e Cartas de Casa escolhidas escondido: **igual ao jogo original**.
2. As cartas são reveladas e os efeitos "imediatos" das cartas acontecem (igual ao original).
3. **Novo: mini-mapa.** Os dois posicionam os esquadrões escondido, ao mesmo tempo, com tempo limitado
   (quando os dois clicam "Pronto", passa; botão "posicionar automático").
4. O servidor faz a **conta** e decide quem ganhou o mini-mapa e por quanto. A animação só mostra a conta.
5. Quem ganhou o mini-mapa soma **+1** (venceu por pouco) ou **+2** (arrasou) na força da batalha normal.
6. Depois segue igual ao original: Espada de Aço Valiriano, soma final, vencedor, baixas, retirada.

A conta oficial (tropas + apoio + carta + guarnição + espada) continua mandando; o mini-mapa só soma até +2.

### O campo
- Visto de cima (2D), atacante embaixo, defensor em cima.
- **3 faixas** (esquerda, centro, direita) × **2 linhas** (frente, trás) para cada lado.
- O tipo de campo vem da área do tabuleiro: **Planície, Floresta, Montanha, Rio, Castelo, Fortaleza, Mar**.
  Cada área dos 4 mapas recebe um campo (lista para o Agostinho aprovar).

| Campo | Efeito |
|---|---|
| Planície | campo aberto: cavalaria mais forte |
| Floresta | protege das flechas, atrapalha cavalo |
| Montanha | passagem estreita (2 faixas) e colina para arqueiros |
| Rio | vau no centro; nas laterais atravessa devagar (atacante perde força) |
| Castelo | defensor atrás de muralha; máquina de cerco derruba |
| Fortaleza | muralha mais forte + torre que atira |
| Mar | só navios: vento e abordagem |

### As tropas (o tabuleiro NÃO muda; cada peça vira um esquadrão só dentro da batalha)
| Peça do tabuleiro | No mini-mapa | Função |
|---|---|---|
| Soldado | 3 bolinhas | escolhe: **Lanceiro** (para cavalaria), **Escudeiro** (segura a linha, aguenta flecha), **Arqueiro** (de longe, fraco de perto) |
| Cavaleiro | 2 bolinhas grandes | escolhe: **Cavalaria** (carga: destrói arqueiros, perde para lanças) ou **Batedores** (leve: contorna lanças, perde para escudos) |
| Máquina de cerco | 1 catapulta | quebra muralha, acerta grupos; fraca em campo aberto |
| Navio | 1 navio | só no Mar |
| Dragão | 1 dragão | voa por cima de uma faixa e solta fogo |
| Apoio de vizinhos | reforço | entra pela lateral numa faixa escolhida por quem recebe o apoio |
| Guarnição / Força Neutra | torre fixa | atrás, no lado do defensor |

Bolinhas na cor da Casa com o desenho da arma.

### A conta (faixa por faixa)
1. força das tropas na faixa (frente pesa mais; arqueiro atrás atira por cima);
2. vantagens de tipo (lança×cavalo, cavalo×arqueiro, arqueiro×escudeiro…);
3. terreno da faixa;
4. Carta de Casa: força da carta = moral; espadas ⚔ = ataque; torres ▲ = defesa;
5. herói (quando existir) na faixa dele;
6. flanco: quem vence uma faixa ganha +1 na faixa vizinha.
Resultado: quem venceu mais faixas / com mais folga → +1 ou +2.
Não existe posicionamento perfeito: o melhor depende do que o outro fez.

Depois da animação aparece um **resumo por faixa** ("Esquerda: seus lanceiros pararam a cavalaria dele (+2)…").

### Casos especiais (a decidir no protótipo)
- Batalha muito pequena (1 peça contra 1): pular o mini-mapa (configurável).
- Atacar Força Neutra ou área só com guarnição: o lado neutro é posicionado pelo computador.
- Vassalos: quem posiciona é o jogador que comanda o vassalo.
- Partida por turnos (PBEM): cada um posiciona quando entrar; os dois assistem a mesma animação depois.
- Efeitos de cartas que trocam a carta (Tyrion, Aeron…) acontecem antes do mini-mapa.

## Etapas

| # | Etapa | O que sai | Aprovação do Agostinho |
|---|---|---|---|
| 1 | **Regras no papel** — FEITO 30/out (`docs/COMBATE-TATICO-REGRAS.md`) | tabela de números (força, vantagens, terreno, carta) e lista área → campo dos 4 mapas | ⏳ aguardando aprovação |
| 2 | **Motor da conta** — FEITO 30/out (`src/common/tactical-battle`, 7 testes) | código da conta separado do resto (mesmo código no servidor, no protótipo e nos testes), sempre dá o mesmo resultado | — |
| 3 | **Equilíbrio** — FEITO 30/out (`tools/tactical/equilibrio.ts`, 51 cenários) | o computador procura o jogo ótimo dos dois lados em cada campo; ajuste até nenhuma tropa/carta vencer demais e o castelo não ficar impossível | relatório no fim das regras |
| 4 | **Protótipo jogável** | página separada: posicionar, escolher funções, conta, animação, 2×/pular, resumo; contra robô ou passando o celular | ✅ testar com os amigos |
| 5 | **No jogo** | opção na sala de espera; etapa nova da batalha (depois das cartas, antes da Espada); relógio, "Pronto", automático; +1/+2 no total; histórico; painel e quadro da batalha mostram o bônus | — |
| 6 | **Telas** | posicionamento e animação no computador e no celular, no visual da tela nova | ✅ prints |
| 7 | **Testes** | robô posiciona automático; partidas inteiras com a regra ligada (computador e celular) no teste do GitHub; RISCOS.md | — |

Onde entra no código: `CombatGameState.onBeforeCombatResolutionFinish` (hoje vai para a Espada de Aço Valiriano)
passa antes por um `TacticalBattleGameState` novo quando a opção estiver ligada. O bônus entra no cálculo de
força total do `CombatGameState`, como o das Marés da Batalha.

## Depois: Heróis (resumo do combinado)
- Regra opcional (liga/desliga).
- Cada Casa tem um **deck de 5 heróis** (personagens que NÃO são Cartas de Casa); 1 carta na mão de cada vez.
  Mão visível para todos (como as Cartas de Casa) — pode virar opção.
- No **planejamento**, a carta vai virada numa área sua junto com as ordens; revela junto com as ordens;
  paga **Fichas de Poder** (força 2 = 2 fichas, força 3 = 3 fichas). Sem fichas, não dá para colocar.
- O herói vira uma peça no mapa por **2 ou 3 rodadas**; conta no limite de exércitos do suprimento.
- Sai: a carta vai para o fundo do deck e compra a próxima. Troca da carta da mão: 1 Ficha de Poder no começo da rodada.
- Depois que um herói sai, espera 1 rodada para baixar outro.
- No mini-mapa: bolinha maior com anel dourado e uma habilidade (ex.: Jon Snow inspira os vizinhos,
  Arya ataca os arqueiros por trás, Brienne segura a frente); o jogador escolhe QUANDO a habilidade dispara.
- Equilíbrio também testado com o computador jogando sozinho.
