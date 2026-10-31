import en from "./en";
import ptBRIngame from "./pt-BR-ingame";
import ptBRAuto from "./pt-BR-auto";

// Textos em português do Brasil.
// O tipo abaixo obriga a traduzir TODAS as chaves de en.ts: se faltar uma
// ou sobrar uma chave inexistente, o TypeScript acusa erro na compilação.
//
// Terminologia (edição brasileira de A Guerra dos Tronos: Board Game):
// Fichas de Poder, Pontos de Vitória (PV), Cartas de Casa, Cartas de
// Westeros, Trilhas de Influência, Vassalos, Banco de Ferro, Marés de
// Batalha, Guarnições, Cavaleiros, Soldados, Navios, Recrutamento (Mustering),
// ordens: Marcha, Defesa, Apoio, Incursão (Raid), Consolidar Poder.
// Expansões: Mãe dos Dragões (MdD), A Dança dos Dragões, O Festim dos
// Corvos, A Tormenta de Espadas (1ª ed.), A Fúria dos Reis (1ª ed.).
// Lugares: nomes da série da HBO (ver glossário do projeto).

const ptBR: { [key in keyof typeof en]: string } = {
  // Textos da partida ficam em pt-BR-ingame.ts
  ...ptBRIngame,
  ...ptBRAuto,

  // ---------- Idioma ----------
  "language.label": "Idioma",

  // ---------- Lobby ----------
  "lobby.seat": "Assento {n}",
  "lobby.spectators": "Espectadores:",
  "lobby.readyCheckOngoing": "Confirmação de presença em andamento",
  "lobby.notEnoughPlayers":
    "Mais jogadores precisam entrar para a partida poder começar.",
  "lobby.targaryenMustBePlayer":
    "A Casa Targaryen precisa ser escolhida por um jogador",
  "lobby.onlyOwnerCanStart": "Só o criador da partida pode iniciá-la",
  "lobby.onlyOwnerCanCancel": "Só o criador da partida pode cancelá-la",
  "lobby.start": "Iniciar",
  "lobby.launchReadyCheck": "Confirmar presença de todos e começar",
  "lobby.cancel": "Cancelar",
  "lobby.confirmCancel": "Tem certeza de que quer cancelar a partida?",
  "lobby.mute": "Silenciar",
  "lobby.unmute": "Ativar som",
  "lobby.volume.notifications": "Notificações",
  "lobby.volume.music": "Música",
  "lobby.volume.sfx": "Efeitos sonoros",
  "lobby.password.ownerTooltip":
    "Você pode definir uma senha aqui para impedir que desconhecidos entrem na sua partida.",
  "lobby.password.joinTooltip":
    "Digite a senha aqui para desbloquear e entrar na partida.",
  "lobby.password.ownerPlaceholder": "Definir senha",
  "lobby.password.joinPlaceholder": "Digite a senha para desbloquear a partida",
  "lobby.ready": "Pronto",
  "lobby.choose": "Escolher",
  "lobby.leave": "Sair",
  "lobby.kick": "Expulsar",

  // ---------- Cenários ----------
  "setup.base-game": "Jogo Base – 2ª edição (3–6 jogadores)",
  "setup.mother-of-dragons": "Mãe dos Dragões (7 ou 8 jogadores)",
  "setup.a-dance-with-dragons": "A Dança dos Dragões (6 jogadores)",
  "setup.a-feast-for-crows": "O Festim dos Corvos (4 jogadores)",
  "setup.a-dance-with-mother-of-dragons":
    "A Dança com a Mãe dos Dragões (8 jogadores)",
  "setup.struggle-in-the-north": "Luta pelo Norte (4 ou 5 jogadores)",
  "setup.rumble-in-the-south": "Confusão no Sul (4 jogadores)",
  "setup.race-to-kings-landing": "Corrida a Porto Real (5 jogadores)",
  "setup.no-kraken-for-dinner": "Sem Kraken no Jantar (5 jogadores)",
  "setup.learn-the-game": "Ensinar o Jogo (2 jogadores)",

  "setupTooltip.base-game.title":
    "O jogo oficial <i>A Guerra dos Tronos: Board Game – 2ª edição</i>",
  "setupTooltip.base-game.text":
    "Este cenário aceita partidas de 3 a 6 jogadores. O livro de regras está disponível online.<br/>As fichas de Força Neutra para 4 e 5 jogadores não foram implementadas, porque as variantes não oficiais<br/>e os Vassalos da expansão Mãe dos Dragões funcionam muito melhor.",
  "setupTooltip.mother-of-dragons.title":
    "A expansão oficial <i>Mãe dos Dragões</i>",
  "setupTooltip.mother-of-dragons.text":
    "Esta expansão adiciona 2 novas Casas, Arryn e Targaryen, e mais algumas mecânicas interessantes:<br/>Vassalos, Ordens Marítimas e o Banco de Ferro. Com 8 jogadores e a Casa Targaryen,<br/>uma parte totalmente nova do mapa, 'Essos', também entra no jogo. O livro de regras está disponível online.",
  "setupTooltip.a-dance-with-dragons.title":
    "A expansão oficial <i>A Dança dos Dragões</i>",
  "setupTooltip.a-dance-with-dragons.text":
    "Esta expansão retrata um momento mais avançado da história de Game of Thrones<br/>e por isso <i>dura só <b>6</b> rodadas!</i> Ela traz novas cartas de Casa e novas posições iniciais<br/>para as 6 Casas do jogo base.",
  "setupTooltip.a-feast-for-crows.title":
    "A expansão oficial <i>O Festim dos Corvos</i>",
  "setupTooltip.a-feast-for-crows.text":
    "Esta é uma expansão para 4 jogadores. Ela adiciona a Casa Arryn e um jeito totalmente novo de marcar pontos de vitória.<br/>Em vez de conquistar castelos, você precisa cumprir objetivos secretos.<br/>As regras completas ficam na dica da aba Objetivos, dentro da partida.",
  "setupTooltip.a-dance-with-mother-of-dragons.title":
    "A variante não oficial <i>A Dança com a Mãe dos Dragões</i>",
  "setupTooltip.a-dance-with-mother-of-dragons.text":
    "Esta é uma variante criada pela comunidade que junta <i>A Dança dos Dragões</i> e Mãe dos Dragões.<br/>Por isso também <i>dura só <b>6</b> rodadas</i>, tem novas posições iniciais e é jogada com as<br/>cartas de Casa de A Dança dos Dragões / O Festim dos Corvos e o baralho B de Mãe dos Dragões para Targaryen.",
  "setupTooltip.struggle-in-the-north.title":
    "A variante não oficial <i>Luta pelo Norte</i>",
  "setupTooltip.struggle-in-the-north.text":
    "Esta é uma variante criada pela comunidade, só para 4 e 5 jogadores.<br/>É bem parecida com o jogo base com menos jogadores, mas em vez das fichas de Força Neutra,<br/>os territórios do sul da Casa Martell e da Casa Tyrell, respectivamente, ficam bloqueados.",
  "setupTooltip.rumble-in-the-south.title":
    "A variante não oficial <i>Confusão no Sul</i>",
  "setupTooltip.rumble-in-the-south.text":
    "Esta é uma variante criada pela comunidade, só para 4 jogadores.<br/>A Casa Stark e a Casa Greyjoy não participam, então Pyke fica bloqueada<br/>junto com quase todo o Norte.",
  "setupTooltip.race-to-kings-landing.title":
    "A variante não oficial <i>Corrida a Porto Real</i>",
  "setupTooltip.race-to-kings-landing.text":
    "Esta é uma variante criada pela comunidade, só para 5 jogadores.<br/>A Casa Baratheon não participa, então Pedra do Dragão fica bloqueada.",
  "setupTooltip.no-kraken-for-dinner.title":
    "A variante não oficial <i>Sem Kraken no Jantar</i>",
  "setupTooltip.no-kraken-for-dinner.text":
    "Esta é uma variante criada pela comunidade, só para 5 jogadores.<br/>A Casa Greyjoy não participa, então Pyke fica bloqueada.",
  "setupTooltip.learn-the-game.title": "Modo Ensinar o Jogo",
  "setupTooltip.learn-the-game.text":
    "Este modo permite começar uma partida com só 2 jogadores, para explicar as mecânicas básicas a um amigo.<br/>Ele também pode ser usado com os vassalos da expansão Mãe dos Dragões<br/>e a opção 'Distribuir vassalos aleatoriamente', deixando o jogo mais ou menos jogável a dois.<br/>Mas as vitórias não contam para a taxa de vitórias.",

  // ---------- Configurações da partida ----------
  "settings.live.label": "Partida ao vivo",
  "settings.pbem.label": "Partida por e-mail",
  "settings.mode.tooltip":
    "<b>Partida ao vivo</b><br/>Jogada com todos os jogadores online ao mesmo tempo. Cada um é avisado com um som quando chega a sua vez.<br/><br/><b>Partida por e-mail (PBEM)</b><br/>O modo sem horário marcado. Os jogadores recebem um e-mail quando é a vez deles. Essas partidas costumam durar dias ou semanas.",
  "settings.startWhenFull.label": "Começar quando lotar",
  "settings.startWhenFull.tooltip":
    "Com esta opção ativada, a partida começa sozinha assim que todos os lugares forem ocupados.",
  "settings.gameClock.label": "Relógio de jogo",
  "settings.gameClock.tooltip":
    "Com esta opção ativada, cada jogador tem um relógio de 30, 45, 60, 75, 90 ou 120 minutos.<br/>Quando o tempo de um jogador acaba, a Casa dele vira vassala automaticamente, e isso não pode ser desfeito!<br/>O último jogador restante vence a partida na hora.<br/>Os relógios podem ser estendidos por votação: uma vez por 15 minutos e outra vez na última rodada.<br/>Depois de 2 votações recusadas, nenhuma nova votação pode ser aberta.<br/>Essas partidas podem ser pausadas, mas partidas públicas voltam sozinhas depois de 10 minutos,<br/>e o anfitrião não pode mudar a partida para o modo por e-mail depois que ela começar.",
  "settings.gameClock.minutes": "min",
  "settings.fixedClock.label": "Relógio fixo",
  "settings.fixedClock.tooltip":
    "Com esta opção ativada, os jogadores não podem votar para estender seus relógios.",
  "settings.private.label": "Partida privada",
  "settings.private.tooltip":
    "Ative esta opção se você conhece todos os participantes e quer evitar que os mecanismos de segurança e de substituição de jogadores sejam ativados.",
  "settings.players": "jogadores",
  "settings.vps": "PV",
  "settings.vps.tooltip":
    "Define quantos Pontos de Vitória (PV) são necessários para vencer a partida.",
  "settings.lts": "FL",
  "settings.lts.tooltip":
    "Define quantas Fichas de Lealdade (FL) são necessárias para vencer a partida.",
  "settings.eyriePort.label": "Adicionar um porto ao Ninho da Águia",
  "settings.eyriePort.tooltip":
    "Com esta opção ativada, o Ninho da Águia ganha um porto e a Casa Arryn marca só 1 ponto de vitória com Empreendimentos Mercantis (o objetivo dos portos).",
  "settings.adwdCards.label": "Cartas de Casa de <i>A Dança dos Dragões</i>",
  "settings.adwdCards.tooltip":
    "Com esta opção ativada, são usadas as cartas de Casa das expansões <b>A Dança dos Dragões</b> e <b>O Festim dos Corvos</b>.",
  "settings.asosCards.label": "Cartas de Casa de <i>A Tormenta de Espadas</i>",
  "settings.asosCards.tooltip":
    "Com esta opção ativada, são usadas as cartas de Casa da expansão <b>A Tormenta de Espadas</b>, da 1ª edição.",
  "settings.firstEditionCards.label": "Cartas de Casa da <i>1ª edição</i>",
  "settings.firstEditionCards.tooltip":
    "Com esta opção ativada, são usadas as cartas de Casa do jogo base da <b>1ª edição</b>. Disponível só para até 6 jogadores, porque a força de combate dessas cartas é diferente das cartas da 2ª edição e das expansões.",
  "settings.cardsEvolution.label": "Evolução das cartas de Casa",
  "settings.cardsEvolution.tooltip":
    "Variante da comunidade que começa com as cartas de Casa do jogo base. A partir da rodada <b>5</b>, cada Casa recebe seu baralho alternativo quando jogar a última carta de Casa.",
  "settings.cardsEvolution.round": "– Rodada:",
  "settings.customBalancing.label": "Balanceamento da comunidade",
  "settings.customBalancing.modTooltip":
    "Uma proposta da comunidade para evitar que todos se unam contra Targaryen logo no começo. Para detalhes, veja",
  "settings.customBalancing.modLink": "a proposta de balanceamento do Tex",
  "settings.customBalancing.tooltip":
    "Uma proposta da comunidade para melhorar a posição inicial da Casa Tyrell, adicionando um navio nos Estreitos de Redwyne.",
  "settings.vassals.label": "Vassalos (MdD)",
  "settings.vassals.tooltip":
    "As Casas sem jogador viram vassalas, como na expansão <b>Mãe dos Dragões</b>.",
  "settings.ironBank.label": "Banco de Ferro (MdD)",
  "settings.ironBank.tooltip":
    "Ativa o Banco de Ferro da expansão <b>Mãe dos Dragões</b>. Todas as Casas de jogadores começam com 7 Fichas de Poder em vez de 5.<br/><br/><i>Obs.: ativar o Banco de Ferro libera a Ordem Marítima do Banco de Ferro, mesmo se as Ordens Marítimas estiverem desativadas.</i>",
  "settings.seaOrders.label": "Ordens Marítimas (MdD)",
  "settings.seaOrders.tooltip":
    "Ativa as fichas de Ordem Marítima da expansão <b>Mãe dos Dragões</b>.",
  "settings.giftPowerTokens.label": "Presentear Fichas de Poder (MdD)",
  "settings.giftPowerTokens.tooltip":
    "Os jogadores podem dar Fichas de Poder livremente a outros jogadores.",
  "settings.randomVassalAssignment.label": "Distribuir vassalos aleatoriamente",
  "settings.randomVassalAssignment.tooltip":
    "Os vassalos são distribuídos aleatoriamente entre as Casas dos jogadores.",
  "settings.dragonWar.label": "Guerra dos Dragões",
  "settings.dragonWar.tooltip":
    "Todas as Casas, exceto Targaryen, trocam seu cavaleiro inicial por um dragão. <small><i>(Inspirado por LordWazza)</i></small>",
  "settings.dragonRevenge.label": "Vingança do Dragão",
  "settings.dragonRevenge.tooltip":
    "Se um jogador ficar com só uma unidade terrestre que não seja dragão e nenhum castelo, ela vira um dragão.",
  "settings.randomHouses.label": "Casas aleatórias",
  "settings.randomHouses.tooltip": "As Casas são sorteadas entre os jogadores.",
  "settings.randomChosenHouses.label": "Sortear só as Casas escolhidas",
  "settings.randomChosenHouses.tooltip":
    "Só as Casas já escolhidas são trocadas aleatoriamente. Assim você define quais Casas serão de jogadores e quais serão vassalas, mas ainda sorteia quem fica com cada Casa.",
  "settings.tidesOfBattle.label": "Marés de Batalha",
  "settings.tidesOfBattle.tooltip":
    "Módulo opcional que deixa o combate mais arriscado e imprevisível.",
  "settings.removeTob3.label": "Tirar as cartas de 3 das Marés",
  "settings.removeTob3.tooltip":
    "Com esta opção ativada, as cartas de valor 3 são retiradas do baralho de Marés de Batalha.",
  "settings.removeTobSkulls.label": "Tirar as caveiras das Marés",
  "settings.removeTobSkulls.tooltip":
    "Com esta opção ativada, as cartas de caveira são retiradas do baralho de Marés de Batalha.",
  "settings.limitTob2.label": "Limitar cartas de 2 das Marés",
  "settings.limitTob2.tooltip":
    "Com esta opção ativada, o baralho de Marés de Batalha tem só duas cartas de valor 2 em vez de quatro.",
  "settings.mixedWd1.label": "Baralho de Westeros I misto",
  "settings.mixedWd1.tooltip":
    "Com esta opção ativada, uma carta <b>Recrutamento</b> é trocada por <b>Reunir os Homens</b>, uma carta <b>Um Trono de Lâminas</b> por <b>O Fardo do Poder</b> e a carta <b>Últimos Dias de Verão</b> por <b>Fome</b>.",
  "settings.cokWesterosPhase.label": "Fase de Westeros de A Fúria dos Reis",
  "settings.cokWesterosPhase.tooltip":
    "Os jogadores podem ver as próximas 3 cartas de cada baralho de Westeros a qualquer momento.",
  "settings.endless.label": "Sem fim",
  "settings.endless.tooltip": "O número de rodadas da partida sobe para 1000.",
  "settings.faceless.label": "Homens Sem Rosto",
  "settings.faceless.tooltip":
    "Os nomes dos jogadores ficam escondidos e só são revelados quando a partida acaba.",
  "settings.faceless.confirm":
    "Ativar Homens Sem Rosto é permanente e não pode ser desfeito.\n\nTem certeza de que quer ativar?",
  "settings.fogOfWar.label": "Névoa de guerra",
  "settings.fogOfWar.tooltip":
    "Você só vê as áreas que controla, as áreas vizinhas e as áreas que você ataca ou de onde é atacado.",
  "log.tacticalBattle.result":
    "<b>Mesa de Batalha</b>: {p0} venceu nas faixas ({p1} {p3} × {p4} {p2}).",
  "log.tacticalBattle.duel":
    "<b>Mesa de Batalha</b>: empate nas faixas ({p1} {p3} × {p4} {p2}); {p0} venceu no duelo (trilha dos Feudos).",
  "tactical.title": "Mesa de Batalha",
  "tactical.status.done": "pronto",
  "tactical.status.placing": "posicionando as tropas…",
  "tactical.raven": "{p0} tem o Corvo Mensageiro: está vendo onde está o outro exército e pode mudar 1 esquadrão.",
  "tactical.open": "Abrir a Mesa",
  "tactical.openRaven": "Abrir a Mesa (Corvo)",
  "settings.tacticalCombat.label": "Mesa de Batalha (combate tático)",
  "settings.tacticalCombat.tooltip":
    "Depois das cartas, do apoio e da Lâmina, os dois lados posicionam as tropas num campo de 3 faixas. A força total da batalha reforça as tropas; quem vencer mais faixas vence a batalha. As baixas continuam vindo das espadas e torres.",
  "settings.noPrivateChats.label": "Desativar chats privados",
  "settings.noPrivateChats.tooltip":
    "Os jogadores não podem criar salas de chat privadas.",
  "settings.precedingMustering.label": "Recrutamento antes do início",
  "settings.precedingMustering.tooltip":
    "Antes da partida começar, todos os jogadores podem recrutar unidades nos seus castelos, como numa carta de Recrutamento.",
  "settings.randomStartPositions.label": "Posições iniciais aleatórias",
  "settings.randomStartPositions.tooltip":
    "As Casas trocam de posição inicial aleatoriamente.",
  "settings.vassalPositions.label": "Posições iniciais de vassalo",
  "settings.vassalPositions.tooltip":
    "As Casas dos jogadores também começam nas posições iniciais que teriam como vassalas.",
  "settings.holdVps.label": "Manter os pontos de vitória",
  "settings.holdVps.tooltip":
    "Com esta opção ativada, ninguém vence na hora em que alcança os pontos de vitória necessários. É preciso manter esses pontos até o fim da rodada para vencer.",
  "settings.tournamentMode.label": "Modo torneio",
  "settings.tournamentMode.tooltip":
    "Opção feita para torneios. Ela impede que as seguintes votações sejam abertas:<br/>Oferecer substituição, Substituir vassalo, Trocar Casas, Estender relógios, Declarar vencedor, Abortar partida e Encerrar partida.",
  "settings.draftHouseCards.label": "Draft de cartas de Casa",
  "settings.draftHouseCards.tooltip":
    "Antes da partida começar, os jogadores escolhem suas cartas de Casa uma a uma, numa ordem sorteada.<br/>Se <b>Draft das Trilhas de Influência</b> estiver ativado, também dá para escolher uma posição numa Trilha de Influência em vez de uma carta de Casa.<br/>As cartas podem ser escolhidas entre todas as cartas de Casa do jogo base da 2ª edição e de todas as expansões (A Tormenta de Espadas, A Dança dos Dragões, O Festim dos Corvos, Mãe dos Dragões).",
  "settings.thematicDraft.label": "Draft temático",
  "settings.thematicDraft.tooltip":
    "Todos os jogadores escolhem suas cartas de Casa ao mesmo tempo, entre os baralhos disponíveis para a sua Casa.",
  "settings.selectedRandomDraft.label": "Draft com sorteio",
  "settings.selectedRandomDraft.tooltip":
    "Todos os jogadores escolhem ao mesmo tempo as cartas de Casa que vão ser usadas. Depois do draft, as cartas e as posições de Influência (se <b>Draft das Trilhas de Influência</b> estiver ativado) são sorteadas entre as Casas. Pode ser combinado com <b>Draft limitado</b>.",
  "settings.randomDraft.label": "Draft aleatório",
  "settings.randomDraft.tooltip":
    "Os jogadores recebem cartas de Casa aleatórias e, se <b>Draft das Trilhas de Influência</b> estiver ativado, posições de Influência aleatórias. Pode ser combinado com <b>Draft limitado</b>.",
  "settings.draftMap.label": "Draft do cenário",
  "settings.draftMap.tooltip":
    "<p>Os jogadores podem ajustar as posições iniciais adicionando e removendo Unidades, Fichas de Poder ou Guarnições.<br/><small>Os limites de unidades e de suprimento precisam ser respeitados o tempo todo.</small></p><p>Os territórios sem dono são divididos de forma justa entre as Casas:<ul><li>Territórios vizinhos de uma única Casa ficam com essa Casa.</li><li>Territórios vizinhos de várias Casas continuam sem dono.</li></ul>Todos os jogadores precisam confirmar as mudanças antes da partida começar.</p>",
  "settings.draftTracks.label": "Draft das Trilhas de Influência",
  "settings.draftTracks.tooltip":
    "Com esta opção ativada, na sua vez do draft você pode escolher uma posição numa das três Trilhas de Influência em vez de uma carta de Casa.<br/>Nos modos <b>Aleatório</b> ou <b>Às cegas</b>, as Trilhas de Influência também são sorteadas junto com as cartas de Casa.",
  "settings.limitedDraft.label": "Draft limitado",
  "settings.limitedDraft.tooltip":
    "Esta opção retira os baralhos de cartas de Casa das Casas que não estão na partida.",
  "settings.blindDraft.label": "Draft às cegas",
  "settings.blindDraft.tooltip":
    "Os jogadores recebem cartas de Casa aleatórias e, se <b>Draft das Trilhas de Influência</b> estiver ativado, posições de Influência aleatórias. As cartas de Casa ficam escondidas durante toda a partida. Pode ser combinado com <b>Draft limitado</b>.",
  "settings.perpetuumRandom.label": "Aleatório sem fim",
  "settings.perpetuumRandom.tooltip":
    "Os jogadores recebem um baralho novo toda vez que jogam a última carta de Casa.",
  "settings.baseDeck.label": "Base 2ª ed. e MdD A",
  "settings.baseDeck.tooltip":
    "Esta opção adiciona os baralhos do <b>jogo base da 2ª edição</b> e os baralhos <b>A de Mãe dos Dragões</b> para <b>Arryn</b> e <b>Targaryen</b>.",
  "settings.alternativeDeck.label": "Dança, Festim e MdD B",
  "settings.alternativeDeck.tooltip":
    "Esta opção adiciona os baralhos da expansão <b>A Dança dos Dragões</b> para as Casas do jogo base, o baralho de <b>O Festim dos Corvos</b> para <b>Arryn</b> e o baralho <b>B de Mãe dos Dragões</b> para <b>Targaryen</b>.",
  "settings.sosDeck.label": "Tormenta e MdD A",
  "settings.sosDeck.tooltip":
    "Esta opção adiciona os baralhos da expansão <b>A Tormenta de Espadas</b> e os baralhos <b>A de Mãe dos Dragões</b> para <b>Arryn</b> e <b>Targaryen</b>.",
  "settings.firstEditionDeck.label": "1ª edição",
  "settings.firstEditionDeck.tooltip":
    "Esta opção adiciona os baralhos do jogo base da <b>1ª edição</b>.",

  // ---------- Configurações do usuário ----------
  "userSettings.chatHouseNames.label": "Nomes das Casas no chat",
  "userSettings.chatHouseNames.tooltip":
    "Mostra o nome das Casas em vez do nome dos usuários nas janelas de chat.",
  "userSettings.mapScrollbar.label":
    "Barra de rolagem no mapa (só no computador)",
  "userSettings.mapScrollbar.tooltip":
    "Deixa o mapa fixo com uma barra de rolagem. A altura do mapa acompanha a altura da janela. Deixar ativado não muda nada no celular.",
  "userSettings.gameStateColumnRight.label": "Coluna da partida à direita",
  "userSettings.gameStateColumnRight.tooltip":
    "Troca a coluna das Casas com a coluna do andamento da partida, para que o andamento fique à direita do mapa.",
  "userSettings.faq": "Perguntas frequentes (em inglês)"
};

export default ptBR;
