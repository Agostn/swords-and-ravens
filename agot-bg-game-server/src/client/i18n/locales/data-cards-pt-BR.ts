// Textos das cartas em português do Brasil (gerado a partir de tools/i18n/dump-card-texts.ts).
// Westeros, Selvagens, empréstimos e objetivos: pelo id da carta.
// Habilidades das cartas de Casa: pelo id da habilidade. Nomes das cartas de Casa: pelo nome em inglês.

export interface CardTexts {
  westeros: {
    [id: string]: {
      name: string;
      description: string;
      shortDescription: string;
    };
  };
  wildling: {
    [id: string]: {
      name: string;
      lowest: string;
      everyone: string;
      nightsWatch: string;
    };
  };
  loan: { [id: string]: { name: string; description: string } };
  objective: { [id: string]: { name: string; description: string } };
  houseCardAbilities: { [id: string]: string };
  houseCardNames: { [englishName: string]: string };
}

const cardsPtBR: CardTexts = {
  westeros: {
    "last-days-of-summer": {
      name: "Últimos Dias de Verão",
      description: "Nada acontece.",
      shortDescription: "Nada acontece"
    },
    "winter-is-coming": {
      name: "O Inverno Está Chegando",
      description:
        "Embaralhe este baralho imediatamente. Depois compre e resolva uma nova carta.",
      shortDescription: "Embaralhar o baralho"
    },
    supply: {
      name: "Suprimento",
      description: "Ajuste a trilha de Suprimento. Ajuste os exércitos.",
      shortDescription: ""
    },
    "game-of-thrones": {
      name: "Jogo dos Tronos",
      description:
        "Cada Casa ganha Fichas de Poder por cada ícone de coroa e porto que controla.",
      shortDescription: "Ganhar FP"
    },
    mustering: {
      name: "Recrutamento",
      description: "Recrute novas unidades em fortalezas e castelos.",
      shortDescription: ""
    },
    "a-throne-of-blades": {
      name: "Um Trono de Lâminas",
      description:
        "Quem tem a ficha do Trono de Ferro escolhe se a) todos atualizam o Suprimento e ajustam os exércitos, b) todos recrutam unidades, ou c) esta carta não tem efeito.",
      shortDescription: "Trono de Ferro decide"
    },
    "mustering-affc": {
      name: "Recrutamento",
      description: "Recrute novas unidades em Fortalezas e Castelos.",
      shortDescription: ""
    },
    "rally-the-men": {
      name: "Reunir os Homens",
      description:
        "Na ordem dos turnos, os jogadores recrutam novas unidades em cada uma das suas áreas com Castelo.",
      shortDescription: "Recrutar em Castelos"
    },
    "the-burden-of-power": {
      name: "O Fardo do Poder",
      description:
        'Quem tem a ficha do Trono de Ferro escolhe se a) a trilha dos Selvagens volta para a posição "0", ou b) todos recrutam unidades em Fortalezas e Castelos.',
      shortDescription: "Trono de Ferro decide"
    },
    famine: {
      name: "Fome",
      description:
        "Cada jogador desce uma posição na trilha de Suprimento e depois, na ordem dos turnos, ajusta os exércitos.",
      shortDescription: "Suprimento -1"
    },
    "ironborn-raid": {
      name: "Incursão dos Homens de Ferro",
      description:
        "Cada jogador com pelo menos 2 cartas de Objetivo cumpridas na sua área de jogo desce uma posição na trilha de Vitória.",
      shortDescription: "PV -1"
    },
    "shifting-ambitions": {
      name: "Ambições Mutáveis",
      description:
        "Cada jogador escolhe 1 carta de Objetivo da mão e a coloca virada para baixo numa área comum. Embaralhe as cartas viradas e revele-as. Depois, na ordem dos turnos, cada jogador escolhe 1 dessas cartas e a coloca na mão.",
      shortDescription: "Trocar objetivos"
    },
    "new-information": {
      name: "Novas Informações",
      description:
        "Na ordem dos turnos, cada jogador compra uma carta de Objetivo. Depois cada jogador escolhe uma carta de Objetivo da mão e a embaralha de volta no baralho de objetivos.",
      shortDescription: "Novo objetivo"
    },
    "clash-of-kings": {
      name: "A Fúria dos Reis",
      description: "Lances nas três Trilhas de Influência.",
      shortDescription: "Lances nas trilhas"
    },
    "dark-wings-dark-words": {
      name: "Asas Negras, Palavras Negras",
      description:
        "Quem tem a ficha do Corvo Mensageiro escolhe se a) todos dão lances nas três Trilhas de Influência, b) todos ganham uma Ficha de Poder por cada ícone de poder nas áreas que controlam, ou c) esta carta não tem efeito.",
      shortDescription: "Corvo decide"
    },
    "feast-for-crows": {
      name: "O Festim dos Corvos",
      description:
        "Ordens de Consolidar Poder não podem ser jogadas nesta Fase de Planejamento.",
      shortDescription: "Sem Consolidar Poder"
    },
    "sea-of-storms": {
      name: "Mar de Tormentas",
      description:
        "Ordens de Incursão não podem ser jogadas nesta Fase de Planejamento.",
      shortDescription: "Sem Incursão"
    },
    "web-of-lies": {
      name: "Teia de Mentiras",
      description:
        "Ordens de Apoio não podem ser jogadas nesta Fase de Planejamento.",
      shortDescription: "Sem Apoio"
    },
    "storm-of-swords": {
      name: "A Tormenta de Espadas",
      description:
        "Ordens de Defesa não podem ser jogadas nesta Fase de Planejamento.",
      shortDescription: "Sem Defesa"
    },
    "rains-of-autumn": {
      name: "Chuvas de Outono",
      description:
        "Ordens de Marcha +1 não podem ser jogadas nesta Fase de Planejamento.",
      shortDescription: "Sem Marcha +1"
    },
    "put-to-the-sword": {
      name: "Passar a Fio de Espada",
      description:
        "Quem tem a Espada de Aço Valiriano escolhe uma destas condições para esta Fase de Planejamento: a) ordens de Defesa não podem ser jogadas, b) ordens de Marcha +1 não podem ser jogadas, ou c) nenhuma restrição.",
      shortDescription: "Espada decide"
    },
    "wildlings-attack": {
      name: "Ataque dos Selvagens",
      description: "Os selvagens atacam Westeros.",
      shortDescription: ""
    },
    "domestic-disputes": {
      name: "Disputas Domésticas",
      description:
        "O jogador Targaryen pode descartar 1 Ficha de Poder para escolher até 4 outras Casas. Coloque 1 Ficha de Lealdade nas áreas natais dessas Casas.",
      shortDescription: "Fichas de Lealdade nas áreas natais"
    },
    "empty-promises": {
      name: "Promessas Vazias",
      description:
        "O jogador Targaryen pode descartar 1 Ficha de Poder para colocar uma Ficha de Lealdade em: Montanhas da Lua ou Fosso Cailin.",
      shortDescription: "Colocar Fichas de Lealdade"
    },
    "fire-made-flesh": {
      name: "Fogo Feito Carne",
      description:
        "O jogador Targaryen pode: a) destruir um Dragão para mover qualquer ficha de força dos dragões da trilha de rodadas para o quadro de força dos dragões, b) colocar um Dragão destruído na sua área natal (se puder), ou c) não fazer nada.",
      shortDescription: "Aumentar a força dos dragões ou recuperar um dragão"
    },
    "playing-with-fire": {
      name: "Brincando com Fogo",
      description:
        "O jogador Targaryen pode descartar 1 Ficha de Poder para escolher 1 área terrestre sem dono e 1 outro jogador. Coloque 1 Ficha de Lealdade e 1 unidade do jogador escolhido (à escolha dele) na área escolhida.",
      shortDescription: "Ficha de Lealdade numa área sem dono"
    },
    "scattering-dissent": {
      name: "Semeando a Discórdia",
      description:
        "Na ordem inversa dos turnos, cada jogador move uma Ficha de Lealdade para uma área vizinha (se puder). O jogador Targaryen pode cancelar cada movimento na hora descartando 1 Ficha de Poder.",
      shortDescription: "Mover Fichas de Lealdade em ordem inversa"
    },
    "southron-ambitions": {
      name: "Ambições Sulistas",
      description:
        "O jogador Targaryen pode descartar 1 Ficha de Poder para colocar uma Ficha de Lealdade em: Água Negra ou Caminho dos Ossos.",
      shortDescription: "Colocar Fichas de Lealdade"
    },
    "strongholds-of-resistance": {
      name: "Fortalezas da Resistência",
      description:
        "O jogador Targaryen pode descartar 1 Ficha de Poder para colocar uma Ficha de Lealdade em: Harrenhal ou Porto Branco.",
      shortDescription: "Colocar Fichas de Lealdade"
    },
    "the-long-plan": {
      name: "O Plano Longo",
      description:
        "O jogador Targaryen pode descartar 1 Ficha de Poder para escolher 1 outro jogador. O jogador escolhido coloca 1 Ficha de Lealdade em 2 áreas terrestres diferentes.",
      shortDescription: "Outro jogador coloca 2 Fichas de Lealdade"
    },
    "watering-the-seed": {
      name: "Regando a Semente",
      description:
        "O jogador Targaryen pode descartar Fichas de Poder em número igual à sua posição atual na trilha de vitória para colocar 1 Ficha de Lealdade em 2 áreas terrestres diferentes que ele não controla e que fiquem perto de um rio.",
      shortDescription: "Fichas de Lealdade perto de um rio"
    },
    "word-spreads-quickly": {
      name: "A Notícia Corre Rápido",
      description:
        "Na ordem dos turnos, cada jogador move uma Ficha de Lealdade para uma área vizinha (se puder). O jogador Targaryen pode cancelar cada movimento na hora descartando 2 Fichas de Poder.",
      shortDescription: "Mover Fichas de Lealdade na ordem dos turnos"
    },
    "dense-fog": {
      name: "Névoa Densa",
      description: "A distância de visão diminui em um nesta rodada.",
      shortDescription: ""
    }
  },
  wildling: {
    "silence-at-the-wall": {
      name: "Silêncio na Muralha",
      lowest: "Nada acontece.",
      everyone: "Nada acontece.",
      nightsWatch: "Nada acontece."
    },
    "preemptive-raid": {
      name: "Ataque Preventivo",
      lowest:
        "Escolhe uma opção: A) destrói 2 das suas unidades em qualquer lugar; B) desce 2 posições na sua Trilha de Influência mais alta.",
      everyone: "Nada acontece.",
      nightsWatch:
        "Os selvagens atacam de novo na hora, com força 6. Você não participa dos lances contra este ataque (nem recebe recompensas ou penalidades)."
    },
    "crow-killers": {
      name: "Matadores de Corvos",
      lowest:
        "Substitui todos os seus Cavaleiros por Soldados disponíveis. Qualquer Cavaleiro que não puder ser substituído é destruído.",
      everyone:
        "Substitui 2 dos seus Cavaleiros por Soldados disponíveis. Qualquer Cavaleiro que não puder ser substituído é destruído.",
      nightsWatch:
        "Pode substituir na hora até 2 dos seus Soldados, em qualquer lugar, por Cavaleiros disponíveis."
    },
    "rattleshirts-raiders": {
      name: "Saqueadores de Camisa de Chocalho",
      lowest: "Desce 2 posições na trilha de Suprimento (no mínimo 0).",
      everyone: "Desce 1 posição na trilha de Suprimento (no mínimo 0).",
      nightsWatch: "Sobe 1 posição na trilha de Suprimento (no máximo 6)."
    },
    "massing-on-the-milkwater": {
      name: "Concentração no Água de Leite",
      lowest:
        "Se tiver mais de uma carta de Casa na mão, descarta todas as cartas de maior força de combate.",
      everyone:
        "Se tiver mais de uma carta de Casa na mão, precisa escolher e descartar uma delas.",
      nightsWatch:
        "Devolve toda a sua pilha de descarte de cartas de Casa para a mão."
    },
    "a-king-beyond-the-wall": {
      name: "Um Rei Além da Muralha",
      lowest:
        "Move suas fichas para a última posição de todas as Trilhas de Influência.",
      everyone:
        "Na ordem dos turnos, cada jogador escolhe a trilha dos Feudos ou da Corte do Rei e move sua ficha para a última posição dessa trilha.",
      nightsWatch:
        "Move sua ficha para o topo de uma Trilha de Influência à sua escolha e pega a ficha de Domínio correspondente."
    },
    "mammoth-riders": {
      name: "Cavaleiros de Mamutes",
      lowest: "Destrói 3 das suas unidades em qualquer lugar.",
      everyone: "Destrói 2 das suas unidades em qualquer lugar.",
      nightsWatch:
        "Pode pegar de volta 1 carta de Casa à sua escolha da pilha de descarte de cartas de Casa."
    },
    "the-horde-descends": {
      name: "A Horda Desce",
      lowest:
        "Destrói 2 das suas unidades num dos seus Castelos ou Fortalezas. Se não puder, destrói 2 das suas unidades em qualquer lugar.",
      everyone: "Destrói 1 das suas unidades em qualquer lugar.",
      nightsWatch:
        "Pode recrutar forças (seguindo as regras normais de recrutamento) em qualquer área de Castelo ou Fortaleza que controle."
    },
    "skinchanger-scout": {
      name: "Batedor Troca-Peles",
      lowest: "Descarta todas as Fichas de Poder disponíveis.",
      everyone: "Descarta 2 Fichas de Poder disponíveis, ou quantas puder.",
      nightsWatch:
        "Todas as Fichas de Poder que deu de lance neste ataque voltam na hora para o seu Poder disponível."
    }
  },
  loan: {
    "customs-officer": {
      name: "Fiscal da Alfândega",
      description: "Ganhe 10 Fichas de Poder."
    },
    "expert-artificer": {
      name: "Artífice Especialista",
      description:
        "Escolha qualquer área terrestre e coloque uma melhoria de poder lá.\nDepois ganhe 8 Fichas de Poder."
    },
    "full-host": {
      name: "Hoste Completa",
      description:
        "Coloque um Soldado, um Cavaleiro, uma Máquina de Cerco e um Navio em áreas que você controla\nou onde já tem unidades."
    },
    "loyal-maester": {
      name: "Meistre Leal",
      description:
        "Escolha duas áreas terrestres quaisquer e coloque uma melhoria de suprimento em cada uma."
    },
    "master-at-arms": {
      name: "Mestre de Armas",
      description:
        "Escolha duas áreas quaisquer com castelo.\nTransforme esses castelos em fortalezas."
    },
    pyromancer: {
      name: "Piromante",
      description:
        "Escolha qualquer área com castelo e rebaixe-o.\nDepois coloque uma melhoria de poder ou de suprimento nessa área."
    },
    "savvy-steward": {
      name: "Intendente Astuto",
      description:
        "Escolha qualquer área terrestre e coloque uma melhoria de suprimento lá.\nDepois suba uma posição na trilha de suprimento."
    },
    "sea-raiders": {
      name: "Saqueadores do Mar",
      description:
        "Coloque um Soldado e 3 Navios em áreas que você controla ou onde já tem unidades."
    },
    "siege-engineers": {
      name: "Engenheiros de Cerco",
      description:
        "Coloque um Soldado e 2 Máquinas de Cerco em áreas que você controla ou onde já tem unidades."
    },
    spymaster: {
      name: "Mestre dos Sussurradores",
      description:
        "Compre as duas cartas do topo de qualquer baralho de Westeros. Depois de lê-las em segredo,\ncoloque quantas quiser no fundo do baralho, na ordem que quiser,\ne as outras no topo do baralho, na ordem que quiser."
    },
    "the-faceless-men": {
      name: "Os Homens Sem Rosto",
      description:
        "Destrua um Cavaleiro em qualquer área e um Soldado em qualquer outra área.\nAs unidades podem ser de qualquer jogador ou vassalo."
    },
    "vanguard-cavalry": {
      name: "Cavalaria de Vanguarda",
      description:
        "Coloque 3 Cavaleiros em áreas que você controla ou onde já tem unidades."
    }
  },
  objective: {
    "stop-the-storm": {
      name: "Deter a Tempestade",
      description: "Controle Ponta Tempestade."
    },
    "cavalry-charge": {
      name: "Carga de Cavalaria",
      description: "Tenha todas as suas 5 unidades de Cavaleiro no tabuleiro."
    },
    "backdoor-politics": {
      name: "Política de Bastidores",
      description:
        "Todas as outras Casas estão acima de você na trilha de Vitória."
    },
    "home-invasion": {
      name: "Invasão Domiciliar",
      description: "Controle a área natal de outra Casa."
    },
    "land-grab": {
      name: "Apropriação de Terras",
      description: "Controle mais áreas terrestres do que qualquer outra Casa."
    },
    "arbor-gold": {
      name: "Ouro da Árvore",
      description: "Controle A Árvore."
    },
    "extend-your-reach": {
      name: "Estenda Seu Alcance",
      description: "Controle mais áreas marítimas do que cada outra Casa."
    },
    "take-the-black": {
      name: "Vestir o Negro",
      description: "Controle Castelo Negro."
    },
    "the-raven": {
      name: "O Corvo",
      description: "Tenha a ficha do Corvo Mensageiro."
    },
    "support-the-crown": {
      name: "Apoiar a Coroa",
      description:
        "Tenha 3 unidades em Ponta da Garra Rachada e nenhuma unidade em Porto Real."
    },
    "the-throne": {
      name: "O Trono",
      description: "Tenha a ficha do Trono de Ferro."
    },
    "the-blade": {
      name: "A Espada",
      description: "Tenha a ficha da Espada de Aço Valiriano."
    },
    "hold-court": {
      name: "Manter a Corte",
      description: "Controle Porto Real."
    },
    "crossing-guard": {
      name: "Guarda da Travessia",
      description: "Controle duas áreas ligadas pela mesma ponte."
    },
    "naval-superiority": {
      name: "Superioridade Naval",
      description:
        "Tenha mais unidades de Navio no tabuleiro do que cada outra Casa."
    },
    "pull-the-weeds": {
      name: "Arrancar as Ervas Daninhas",
      description: "Controle Marcas da Estrada do Mar, Água Negra e Campina."
    },
    "ample-harvest": {
      name: "Colheita Farta",
      description: "Chegue à posição 5 ou 6 na trilha de Suprimento."
    },
    "mercantile-ventures": {
      name: "Empreendimentos Mercantis",
      description: "Controle mais Portos do que cada outra Casa."
    },
    "a-firm-grip": {
      name: "Um Domínio Firme",
      description: "Controle Ponta da Garra Rachada e Mata do Rei."
    },
    "a-stalwart-position": {
      name: "Uma Posição Inabalável",
      description: "Controle mais Fortalezas do que cada outra Casa."
    },
    "spreading-the-wealth": {
      name: "Distribuindo a Riqueza",
      description:
        "Tenha mais Fichas de Poder no tabuleiro do que cada outra Casa."
    },
    "protect-the-neck": {
      name: "Proteger o Gargalo",
      description:
        "Controle Guardamar, Atalaia da Água Cinzenta e Dedo de Pederneira."
    },
    "nothing-but-ghosts": {
      name: "Nada Além de Fantasmas",
      description:
        "Tenha 1 unidade em Harrenhal e nenhuma unidade nas áreas vizinhas a Harrenhal."
    },
    "the-final-hour": {
      name: "A Hora Final",
      description: "Tenha só 1 carta de Casa na mão."
    },
    "the-peoples-chosen": {
      name: "O Escolhido do Povo",
      description: "Controle 4 ou mais áreas com ícones de Poder."
    },
    "a-mountainous-task": {
      name: "Uma Tarefa Montanhosa",
      description: "Controle o Ninho da Águia."
    },
    "a-riper-fruit": {
      name: "Um Fruto Mais Maduro",
      description: "Controle Winterfell."
    },
    "friendly-confines": {
      name: "Território Amigo",
      description: "Controle mais Castelos do que cada outra Casa."
    }
  },
  houseCardAbilities: {
    "theon-greyjoy":
      "Se você estiver defendendo uma área com Fortaleza ou Castelo, esta carta ganha +1 de força de combate e um ícone de espada.",
    "ser-davos-seaworth":
      'Se a sua carta de Casa "Stannis Baratheon" estiver na sua pilha de descarte, esta carta ganha +1 de força de combate e um ícone de espada.',
    "renly-baratheon":
      "Se você vencer esta batalha, pode promover um dos seus Soldados participantes (ou um Soldado Baratheon que esteja apoiando) a Cavaleiro.",
    "tywin-lannister":
      "Se você vencer esta batalha, ganhe duas Fichas de Poder.",
    "salladhor-saan":
      "Se você estiver recebendo apoio nesta batalha, a força de combate de todos os navios que não sejam Baratheon cai para zero.",
    "asha-greyjoy":
      "Se você não estiver recebendo apoio nesta batalha, esta carta ganha dois ícones de espada e um ícone de fortificação.",
    "queen-of-thorns":
      "Remova na hora uma das fichas de ordem do oponente em qualquer área vizinha à área em combate. Você não pode remover a ordem de Marcha usada para começar esta batalha.",
    "victarion-greyjoy":
      "Se você estiver atacando, todos os seus Navios participantes (inclusive Navios Greyjoy que estejam apoiando) somam +2 de força de combate em vez de +1.",
    "balon-greyjoy":
      "A força de combate impressa na carta de Casa do oponente cai para 0.",
    "doran-martell":
      "Mova na hora o oponente para o fim de uma Trilha de Influência à sua escolha.",
    patchface:
      "Depois da batalha, você pode olhar a mão do oponente e descartar uma carta à sua escolha.",
    "ser-loras-tyrell":
      "Se você estiver atacando e vencer esta batalha, mova a ficha de ordem de Marcha para a área conquistada (em vez de descartá-la). Ela pode ser resolvida de novo mais tarde nesta rodada.",
    "stannis-baratheon":
      "Se o oponente estiver acima de você na Trilha de Influência do Trono de Ferro, esta carta ganha +1 de força de combate.",
    "nymeria-sand":
      "Se você estiver defendendo, esta carta ganha um ícone de fortificação. Se estiver atacando, ganha um ícone de espada.",
    "roose-bolton":
      "Se você perder esta batalha, devolva toda a sua pilha de descarte de cartas de Casa para a mão (inclusive esta carta).",
    "tyrion-lannister":
      "Você pode cancelar na hora a carta de Casa escolhida pelo oponente e devolvê-la à mão dele. Ele precisa escolher outra carta de Casa; se não tiver outras cartas de Casa na mão, não pode usar carta de Casa nesta batalha.",
    "ser-kevan-lannister":
      "Se você estiver atacando, todos os seus Soldados participantes (inclusive Soldados Lannister que estejam apoiando) somam +2 de força de combate em vez de +1.",
    "catelyn-stark":
      "Se você tiver uma ficha de ordem de Defesa na área em combate, o valor dela dobra.",
    "aeron-damphair":
      "Você pode descartar na hora duas das suas Fichas de Poder disponíveis para descartar Aeron Cabelo-Molhado e escolher outra carta de Casa da mão (se puder).",
    "arianne-martell":
      "Se você estiver defendendo e perder esta batalha, o oponente não pode mover suas unidades para a área em combate. Elas voltam para a área de onde marcharam. Suas próprias unidades ainda precisam recuar.",
    "mace-tyrell":
      "Destrua na hora um dos Soldados do oponente que esteja atacando ou defendendo.",
    "cersei-lannister":
      "Se você vencer esta batalha, pode remover uma das fichas de ordem do oponente derrotado de qualquer lugar do tabuleiro.",
    "the-blackfish":
      "Você não sofre baixas nesta batalha por habilidades de cartas de Casa, ícones de combate ou cartas de Marés de Batalha.",
    "robb-stark":
      "Se você vencer esta batalha, pode escolher a área para onde o oponente recua. Ela precisa ser uma área válida onde o oponente perca o menor número de unidades.",
    rayder:
      "Sua força de combate final é igual à posição atual da ficha de Ameaça Selvagem.",
    "melisandre-dwd":
      "Depois da batalha, você pode devolver à mão qualquer carta de Casa da sua pilha de descarte (inclusive esta) descartando Fichas de Poder disponíveis em número igual à força de combate impressa nessa carta.",
    "jon-snow":
      "Se você vencer esta batalha, pode descer ou subir a trilha dos Selvagens em uma casa (mínimo 0, máximo 10).",
    "stannis-baratheon-dwd":
      "Se você não estiver recebendo apoio nesta batalha, remova todas as ordens de Apoio (inclusive as suas) vizinhas à área em combate, cancelando a força de apoio que elas dariam.",
    "aeron-damphair-dwd":
      "Você pode descartar quantas Fichas de Poder disponíveis quiser para aumentar a força de combate desta carta em uma para cada ficha descartada.",
    "qarl-the-maid":
      "Se você estiver atacando e perder esta batalha, ganhe três Fichas de Poder.",
    "rodrik-the-reader":
      "Se você vencer esta batalha, pode procurar em qualquer baralho de Westeros uma carta à sua escolha. Embaralhe as cartas restantes e coloque a carta escolhida virada para baixo no topo do baralho.",
    "euron-crows-eye-dwd":
      "Se o oponente estiver acima de você na Trilha de Influência dos Feudos, esta carta ganha +1 de força de combate.",
    qyburn:
      "Você pode descartar duas das suas Fichas de Poder disponíveis para escolher uma carta de Casa na pilha de descarte de qualquer jogador. Qyburn ganha a força de combate e os ícones de combate impressos nessa carta, ignorando o texto da habilidade.",
    "ser-addam-marbrand":
      "Se você estiver atacando, todos os seus Cavaleiros participantes (inclusive Cavaleiros Lannister que estejam apoiando) somam +3 de força de combate em vez de +2.",
    "ser-ilyn-payne":
      "Se você vencer esta batalha, pode destruir um Soldado do oponente em qualquer área (além das baixas normais). Se for a última unidade da área, remova também a ficha de ordem que estiver lá.",
    "quentyn-martell":
      "Para cada carta de Casa na sua pilha de descarte, esta carta ganha +1 de força de combate.",
    "ser-gerris-drinkwater":
      "Se você vencer esta batalha, pode subir uma posição numa Trilha de Influência à sua escolha.",
    "doran-martell-dwd":
      "Para cada carta de Casa na sua mão, esta carta ganha um ícone de fortificação e um ícone de espada, e perde 1 de força de combate (mínimo 0).",
    reek: 'Se a sua carta de Casa "Ramsay Bolton" estiver na sua pilha de descarte, devolva-a na hora à mão. Se você perder esta batalha, pode devolver Fedor à mão.',
    "walder-frey":
      "Qualquer jogador (que não seja o oponente) que der apoio ao oponente precisa dar esse apoio a você.",
    "ramsay-bolton":
      'Se a sua carta de Casa "Fedor" ainda estiver na sua mão, esta carta ganha +1 de força de combate e três ícones de espada.',
    "queen-of-thorns-dwd":
      "Ignore todos os textos de habilidade impressos na carta de Casa do oponente.",
    "paxter-redwyne":
      "Se a área em combate for uma área marítima, todos os seus Navios participantes (inclusive Navios Tyrell que estejam apoiando) somam +2 de força de combate em vez de +1.",
    "margaery-tyrell-dwd":
      "Se você estiver defendendo sua área natal ou uma área com uma das suas Fichas de Poder, a força de combate final do oponente é 2.",
    varys:
      "Depois da batalha, mova este Vassalo para o topo da trilha dos Feudos, descendo todas as outras Casas.",
    "jaqen-h-ghar":
      "Cancele a carta de Casa escolhida pelo oponente e devolva-a à mão dele. Depois sorteie uma carta de Casa da mão dele para ser revelada como a carta escolhida.",
    "syrio-forel":
      "Se este vassalo estiver defendendo, a força de combate de todos os Soldados que não sejam de vassalos cai para 0.",
    "jon-connington":
      "Se este vassalo perder esta batalha, depois dela você pode recrutar 1 Cavaleiro deste vassalo na área para onde ele recuou ou na sua área natal (se puder).",
    "beric-dondarrion":
      "Se você vencer esta batalha, depois das baixas, precisa destruir 1 unidade deste vassalo na área em combate.",
    bronn:
      "Depois que as cartas de Casa forem reveladas, o oponente pode descartar 2 das suas Fichas de Poder disponíveis para reduzir a força de combate desta carta a 0.",
    "bronze-yohn-royce-ffc":
      "Se você tiver mais Fichas de Poder disponíveis do que o oponente, esta carta ganha +1 de força de combate.",
    littlefinger:
      "Se você controlar o Ninho da Águia depois desta batalha, ganhe Fichas de Poder em número igual ao dobro da força de combate impressa na carta de Casa jogada pelo oponente.",
    "alayne-stone":
      "Se você vencer esta batalha e controlar o Ninho da Águia, pode descartar 2 das suas Fichas de Poder disponíveis para obrigar o oponente a descartar todas as Fichas de Poder disponíveis dele.",
    "lysa-arryn-ffc":
      "Depois desta batalha, se o oponente tiver mais Fichas de Poder disponíveis do que você, ganhe 3 Fichas de Poder.",
    "ser-vardis-egen":
      "Se a força de combate impressa na carta de Casa do oponente for 2 ou menos, esta carta ganha +1 de força de combate e 2 ícones de fortificação.",
    "godric-borrell":
      "Se você estiver defendendo numa área marítima, esta carta ganha +1 de força de combate para cada área terrestre que você controla vizinha à área em combate.",
    "anya-waynwood":
      "Se você vencer esta batalha, você e todos os jogadores que te apoiaram ganham 3 Fichas de Poder cada.",
    "lysa-arryn-mod":
      "Se você tiver uma ficha de ordem de Defesa na área em combate e vencer esta batalha, pode devolver esta carta à mão em vez de descartá-la.",
    "robert-arryn":
      'Se você estiver defendendo, depois da batalha, pode remover da partida "Robert Arryn" e a carta de Casa de menor força da pilha de descarte do oponente.',
    "khal-drogo":
      'Esta carta ganha 1 ícone de espada e +1 de força para cada um dos seus Cavaleiros na área em combate. Depois da batalha, remova "Khal Drogo" da partida.',
    "xaro-xhoan-daxos":
      "Se você tiver mais Navios na área em combate do que o oponente, cada um dos seus Navios na área em combate soma +2 de força de combate (em vez de +1).",
    "daenerys-targaryen-a":
      "Se a área em combate tiver um Dragão, esta carta ganha +2 de força de combate.",
    "viserys-targaryen":
      'Você pode descartar uma carta de Casa da mão para somar a força de combate impressa nela à sua força de combate. Se você perder esta batalha, remova "Viserys Targaryen" da partida.',
    "illyrio-mopatis":
      'Depois da batalha, ganhe Fichas de Poder em número igual à diferença entre as forças de combate finais. Depois, se você tiver 5 ou mais Fichas de Poder disponíveis, remova "Illyrio Mopatis" da partida.',
    "daenerys-targaryen-b":
      "Depois da batalha, o oponente precisa descartar Fichas de Poder disponíveis em número igual à diferença entre as forças de combate finais.",
    rakharo:
      "Se a área em combate for uma área terrestre sem fortaleza nem castelo, cada um dos seus Cavaleiros na área em combate soma +4 de força de combate (em vez de +2).",
    missandei:
      "Se você perder esta batalha por 2 de força de combate ou menos, pode devolver à mão qualquer outra carta de Casa da sua pilha de descarte.",
    "captain-groleo":
      "Se você estiver atacando uma área terrestre usando transporte por navios, esta carta ganha +1 de força de combate para cada Navio Targaryen em áreas vizinhas à área em combate.",
    "aeron-damphair-asos":
      "Depois de revelar, você pode gastar duas Fichas de Poder e descartar esta carta para escolher outra carta de Casa da mão (se puder) e usá-la nesta batalha com -1 de força de combate.",
    "asha-greyjoy-asos":
      "Se você estiver recebendo apoio nesta batalha, ganhe dois ícones de espada.",
    "balon-greyjoy-asos":
      "Se você vencer esta batalha, ganhe Fichas de Poder em número igual à diferença de força total na batalha.",
    "mace-tyrell-asos":
      "Se você vencer esta batalha, pode colocar na hora uma ordem de Apoio ou de Defesa nesta área (não pode ser uma ordem especial), removendo as ordens que já estiverem nela.",
    "bran-stark":
      "Você pode pegar de volta uma carta de Casa da sua pilha de descarte no fim da batalha.",
    "catelyn-stark-asos":
      "Se você estiver recebendo apoio nesta batalha, ganhe +2 de força de combate e um ícone de fortificação.",
    "cersei-lannister-asos":
      "O oponente precisa perder duas Fichas de Poder no fim da batalha.",
    "doran-martell-asos":
      "Mova na hora o oponente para o fim da trilha dos Feudos. Depois suba os outros jogadores e passe a Espada de Aço Valiriano para quem for preciso.",
    "melisandre-of-asshai":
      "Ganhe na hora Fichas de Poder em número igual à força da carta de Casa do oponente.",
    "salladhar-saan-asos":
      "Se você vencer esta batalha, você ganha duas Fichas de Poder e o oponente perde duas Fichas de Poder.",
    "ser-davos-seaworth-asos":
      "Se você perder esta batalha, suas unidades não são derrotadas e você pode gastar duas Fichas de Poder para ganhar um ícone de fortificação.",
    "ser-gregor-clegane-asos":
      "Ganhe um número de ícones de espada igual a três menos a força da carta de Casa do oponente.",
    "ser-ilyn-payne-asos":
      "Se você vencer esta batalha, o oponente precisa sofrer uma baixa, não importa quantos ícones de fortificação ele tenha.",
    "tyrion-lannister-asos":
      "Você pode devolver a carta de Casa do oponente à mão dele e obrigá-lo a escolher outra. Se ele não tiver outras cartas de Casa, não pode usar carta de Casa nesta batalha.",
    "stannis-baratheon-asos":
      'Se o oponente tiver a ficha de Influência do Trono de Ferro, você pode roubá-la até a próxima "Fúria dos Reis" e ganhar um ícone de espada.',
    "victarion-greyjoy-asos":
      "Se esta batalha for vizinha a uma área marítima, ganhe +1 de força de combate e um ícone de fortificação.",
    "willas-tyrell-asos":
      "Se você estiver defendendo nesta batalha, esta carta de Casa tem força 3.",
    "jaime-lannister-1st":
      "Se você vencer esta batalha, ganhe na hora 2 Fichas de Poder.",
    "vargo-hoat-1st":
      "Os Soldados atacantes do seu exército somam +2 à sua força de combate.",
    "robb-stark-1st":
      "Os Cavaleiros atacantes do seu exército somam +3 à sua força de combate em vez de +2.",
    "maester-luwin-1st":
      "Se você vencer esta batalha, pode devolver à mão uma das suas cartas de Casa descartadas.",
    "salladhor-saan-1st":
      "A força de combate de qualquer navio adversário que esteja apoiando cai para 0.",
    "melisandre-of-asshai-1st":
      "Se você vencer esta batalha, pode gastar 1 Ficha de Poder para escolher e descartar 1 carta de Casa da mão do jogador derrotado.",
    "asha-greyjoy-1st":
      "Se você vencer esta batalha, pode remover na hora uma ordem de Apoio ou de Consolidar Poder em qualquer área marítima ou terrestre vizinha à batalha.",
    "victarion-greyjoy-1st":
      "Os Navios atacantes do seu exército somam +2 à sua força de combate em vez de +1.",
    "obara-sand-1st": "Ao atacar, você ganha um ícone de espada.",
    "ellaria-sand-1st":
      "Se estiver defendendo, você pode promover na hora 1 dos seus Soldados defensores a Cavaleiro.",
    "doran-martell-1st":
      'Se você vencer esta batalha, pode roubar qualquer 1 ficha de Influência (Trono de Ferro, Espada de Aço Valiriano ou Corvo Mensageiro) que esteja com o oponente e usar a habilidade dela até a próxima "Fúria dos Reis".',
    "arianne-martell-1st":
      "Se você perder esta batalha, pode matar na hora 1 das unidades do oponente que participaram da batalha. Se era a última unidade inimiga, você ainda precisa recuar, mas o oponente não é considerado dono da área.",
    "brienne-of-tarth-1st":
      "Descarte na hora a ordem de Defesa do oponente na área da batalha."
  },
  houseCardNames: {
    "Aeron Damphair": "Aeron Cabelo-Molhado",
    "Alayne Stone": "Alayne Stone",
    "Alester Florent": "Alester Florent",
    "Andrik the Unsmiling": "Andrik, o Sério",
    "Anya Waynwood": "Anya Waynwood",
    "Areo Hotah": "Areo Hotah",
    "Arianne Martell": "Arianne Martell",
    "Arstan Whitebeard": "Arstan Barba-Branca",
    "Asha Greyjoy": "Asha Greyjoy",
    "Balon Greyjoy": "Balon Greyjoy",
    "Bastard of Godsgrace": "Bastardo de Graçadivina",
    "Bastard of Nightsong": "Bastardo de Cantonoite",
    "Big Man": "Grandalhão",
    "Black Walder": "Walder Negro",
    "Bran Stark": "Bran Stark",
    "Brienne of Tarth": "Brienne de Tarth",
    "Bronze Yohn Royce": "Yohn Royce Bronze",
    "Captain Groleo": "Capitão Groleo",
    "Catelyn Stark": "Catelyn Stark",
    "Cersei Lannister": "Cersei Lannister",
    "Daario Naharis": "Daario Naharis",
    "Daenerys Targaryen": "Daenerys Targaryen",
    "Dagmar Cleftjaw": "Dagmer Queixo Rachado",
    "Dagmer Cleftjaw": "Dagmer Queixo Rachado",
    "Damon Dance-For-Me": "Damon Dança-Para-Mim",
    Darkstar: "Estrela Negra",
    "Daven Lannister": "Daven Lannister",
    "Devan Seaworth": "Devan Seaworth",
    "Doran Martell": "Doran Martell",
    "Eddard Stark": "Eddard Stark",
    "Ellaria Sand": "Ellaria Sand",
    "Euron Crow's Eye": "Euron Olho de Corvo",
    "Godric Borrell": "Godric Borrell",
    "Gray Worm": "Verme Cinzento",
    "Greatjon Umber": "Grande-Jon Umber",
    "Harry Hardyng": "Harry Hardyng",
    "House Blacktyde Captain": "Capitão da Casa Blacktyde",
    "House Florent Lord": "Lorde da Casa Florent",
    "House Lannister Captain": "Capitão da Casa Lannister",
    "House Mormont Lord": "Lorde da Casa Mormont",
    "House Tyrell Captain": "Capitão da Casa Tyrell",
    "Illyrio Mopatis": "Illyrio Mopatis",
    "Joffrey Lannister": "Joffrey Lannister",
    "Jon Snow": "Jon Snow",
    "Jory Cassel": "Jory Cassel",
    "Kevan Lannister": "Kevan Lannister",
    "Khal Drogo": "Khal Drogo",
    Littlefinger: "Mindinho",
    "Lothor Brune": "Lothor Brune",
    "Lyn Corbray": "Lyn Corbray",
    "Lysa Arryn": "Lysa Arryn",
    "Mace Tyrell": "Mace Tyrell",
    "Maege Mormont": "Maege Mormont",
    "Maester Caleotte": "Meistre Caleotte",
    "Maester Luwin": "Meistre Luwin",
    "Mance Rayder": "Mance Rayder",
    "Margaery Tyrell": "Margaery Tyrell",
    Melisandre: "Melisandre",
    "Melisandre of Asshai": "Melisandre de Asshai",
    Missandei: "Missandei",
    "Nestor Royce": "Nestor Royce",
    "Nymeria Sand": "Nymeria Sand",
    "Obara Sand": "Obara Sand",
    Patchface: "Cara-Malhada",
    "Paxter Redwyne": "Paxter Redwyne",
    "Qarl the Maid": "Qarl, a Donzela",
    "Queen of Thorns": "Rainha dos Espinhos",
    "Quentyn Martell": "Quentyn Martell",
    Qyburn: "Qyburn",
    Rakharo: "Rakharo",
    "Ramsay Bolton": "Ramsay Bolton",
    "Randyll Tarly": "Randyll Tarly",
    Reek: "Fedor",
    "Renly Baratheon": "Renly Baratheon",
    "Robb Stark": "Robb Stark",
    "Robert Arryn": "Robert Arryn",
    "Rodrik The Reader": "Rodrik, o Leitor",
    "Roose Bolton": "Roose Bolton",
    "Salladhar Saan": "Salladhor Saan",
    "Salladhor Saan": "Salladhor Saan",
    "Ser Addam Marbrand": "Sor Addam Marbrand",
    "Ser Axell Florent": "Sor Axell Florent",
    "Ser Davos Seaworth": "Sor Davos Seaworth",
    "Ser Garlan Tyrell": "Sor Garlan Tyrell",
    "Ser Gerris Drinkwater": "Sor Gerris Drinkwater",
    "Ser Gregor Clegane": "Sor Gregor Clegane",
    "Ser Harras Harlaw": "Sor Harras Harlaw",
    "Ser Ilyn Payne": "Sor Ilyn Payne",
    "Ser Jaime Lannister": "Sor Jaime Lannister",
    "Ser Jon Fossoway": "Sor Jon Fossoway",
    "Ser Jorah Mormont": "Sor Jorah Mormont",
    "Ser Kevan Lannister": "Sor Kevan Lannister",
    "Ser Loras Tyrell": "Sor Loras Tyrell",
    "Ser Rodrick Cassel": "Sor Rodrik Cassel",
    "Ser Vardis Egen": "Sor Vardis Egen",
    "Smalljon Umber": "Pequeno-Jon Umber",
    "Stannis Baratheon": "Stannis Baratheon",
    "Steelshanks Walton": "Walton Canelas-de-Aço",
    "Strong Belwas": "Belwas, o Forte",
    "The Blackfish": "Peixe Negro",
    "The Hound": "Cão de Caça",
    "The Red Viper": "Víbora Vermelha",
    "Theon Greyjoy": "Theon Greyjoy",
    "Tyrion Lannister": "Tyrion Lannister",
    "Tywin Lannister": "Tywin Lannister",
    "Vargo Hoat": "Vargo Hoat",
    "Victarion Greyjoy": "Victarion Greyjoy",
    "Viserys Targaryen": "Viserys Targaryen",
    "Walder Frey": "Walder Frey",
    "Willas Tyrell": "Willas Tyrell",
    "Xaro Xhoan Daxos": "Xaro Xhoan Daxos"
  }
};

export default cardsPtBR;
