import { getLanguage } from "./i18n";
import { translateDataText } from "./dataTranslations";

/**
 * Tradução de textos que chegam prontos do SERVIDOR (em inglês): perguntas e
 * opções das escolhas simples (SimpleChoice), verbos das votações etc.
 *
 * O servidor continua mandando inglês; aqui o cliente troca pelo português na
 * hora de mostrar. Textos que não estiverem na lista aparecem em inglês (nunca
 * quebra nada). Para achar textos novos: tools/i18n (ver docs/RISCOS.md, T4).
 */

const region = (name: string): string =>
  translateDataText("region", "", name.trim());
const regions = (list: string): string =>
  list
    .split(" or ")
    .map((r) => region(r))
    .join(" ou ");
const unitNames: { [en: string]: string } = {
  Footman: "Soldado",
  Knight: "Cavaleiro",
  "Siege Engine": "Máquina de Cerco",
  Ship: "Navio",
  Dragon: "Dragão"
};

const exactPtBR: { [en: string]: string } = {
  Activate: "Ativar",
  Ignore: "Ignorar",
  Nothing: "Nada",
  Finish: "Terminar",
  First: "Primeiro",
  Second: "Segundo",
  Third: "Terceiro",
  Fourth: "Quarto",
  Barrel: "Barril",
  Crown: "Coroa",
  Mustering: "Recrutamento",
  Supply: "Suprimento",
  "Clash of Kings": "A Fúria dos Reis",
  "Game of Thrones": "Jogo dos Tronos",
  "Iron Throne": "Trono de Ferro",
  Fiefdoms: "Feudos",
  "King's Court": "Corte do Rei",
  "Iron Throne Track": "Trilha do Trono de Ferro",
  "Fiefdoms Track": "Trilha dos Feudos",
  "King's Court Track": "Trilha da Corte do Rei",
  "Fiefdoms Track (Sword)": "Trilha dos Feudos (Espada)",
  "King's Court Track (Raven)": "Trilha da Corte do Rei (Corvo)",
  "Valyrian Steel Blade": "Espada de Aço Valiriano",
  Raven: "Corvo",
  "House card": "Carta de Casa",
  "Influence track": "Trilha de Influência",
  "Choose an influence track.": "Escolha uma Trilha de Influência.",
  "Decide whether to choose an Influence track position or to select a House card.":
    "Decida se vai escolher uma posição numa Trilha de Influência ou uma carta de Casa.",
  "Increase one space": "Subir uma casa",
  "Decrease one space": "Descer uma casa",
  "Destroy one dragon": "Destruir um dragão",
  "Destroy 2 of his units": "Destruir 2 das suas unidades",
  "Reduce position on his highest influence track":
    "Descer na sua Trilha de Influência mais alta",
  "Reduce the Wildling track to 0": "Levar a trilha dos Selvagens a 0",
  "No March +1 Orders": "Sem ordens de Marcha +1",
  "No Defense Orders": "Sem ordens de Defesa",
  "No restrictions": "Sem restrições",
  "Place another loyalty token": "Colocar outra Ficha de Lealdade",
  "Grant support": "Dar apoio",
  "Refuse support": "Recusar apoio",
  "Retrieve a House card": "Pegar de volta uma carta de Casa",
  "Return Lysa Arryn to hand": "Devolver Lysa Arryn à mão",
  "Return Reek to Hand": "Devolver Fedor à mão",
  "Select a Westeros deck": "Escolha um baralho de Westeros",
  "What kind of improvement do you choose?":
    "Que tipo de melhoria você escolhe?",
  "The lowest bidder chooses": "O menor lance escolhe",
  "The holder of the Iron Throne chooses which influence tracks will be reduced":
    "Quem tem o Trono de Ferro escolhe quais Trilhas de Influência vão descer",
  "The holder of the Iron Throne must choose between the highest bidders":
    "Quem tem o Trono de Ferro precisa escolher entre os maiores lances",
  "The holder of the Iron Throne must choose between the lowest bidders":
    "Quem tem o Trono de Ferro precisa escolher entre os menores lances",
  "The holder of the Iron Throne token can choose between Mustering, Supply, or nothing at all.":
    "Quem tem a ficha do Trono de Ferro pode escolher entre Recrutamento, Suprimento ou nada.",
  'The holder of the Iron Throne token chooses whether a) the Wilding track is reduced to the "0" position, or b) everyone musters units in Strongholds and Castles':
    'Quem tem a ficha do Trono de Ferro escolhe se a) a trilha dos Selvagens volta para a posição "0", ou b) todos recrutam unidades em Fortalezas e Castelos',
  // o servidor manda com ponto final
  'The holder of the Iron Throne token chooses whether a) the Wilding track is reduced to the "0" position, or b) everyone musters units in Strongholds and Castles.':
    'Quem tem a ficha do Trono de Ferro escolhe se a) a trilha dos Selvagens volta para a posição "0", ou b) todos recrutam unidades em Fortalezas e Castelos.',
  "The holder of the Messenger Raven token can choose between Clash of Kings, Game of Thrones, or nothing at all.":
    "Quem tem a ficha do Corvo Mensageiro pode escolher entre A Fúria dos Reis, Jogo dos Tronos ou nada.",
  "The holder of the Valyrian Steel Blade can choose between No March +1 Orders, no Defense Orders, or no restrictions.":
    "Quem tem a Espada de Aço Valiriano pode escolher entre sem ordens de Marcha +1, sem ordens de Defesa ou sem restrições.",
  // Verbos das votações ("X abriu uma votação para ...")
  "pause the game": "pausar a partida",
  "resume the game": "retomar a partida",
  "extend all player clocks by 15 minutes":
    "dar mais 15 minutos no relógio de todos",
  "cancel the game": "cancelar a partida",
  "end the game after the current round":
    "encerrar a partida no fim desta rodada",
  ...unitNames
};

type Rule = [RegExp, (m: RegExpMatchArray) => string];

const templatesPtBR: Rule[] = [
  [
    /^House (.+) may discard 1 Power token to place a loyalty token in (.+)\.$/,
    (m) =>
      `A Casa ${m[1]} pode descartar 1 Ficha de Poder para colocar uma Ficha de Lealdade em ${regions(m[2])}.`
  ],
  [
    /^House (.+) may discard 1 Power token to choose one other player who places 2 loyalty tokens in 2 different land areas in Westeros\.$/,
    (m) =>
      `A Casa ${m[1]} pode descartar 1 Ficha de Poder para escolher outro jogador, que coloca 2 Fichas de Lealdade em 2 áreas terrestres diferentes de Westeros.`
  ],
  [
    /^House (.+) may discard 1 power token to place a loyalty token in an uncontrolled land area and choose another player to place a unit of their choice in that area\.$/,
    (m) =>
      `A Casa ${m[1]} pode descartar 1 Ficha de Poder para colocar uma Ficha de Lealdade numa área terrestre sem dono e escolher outro jogador para colocar lá uma unidade à escolha dele.`
  ],
  [
    /^House (.+) may either: a\) destroy one Dragon to move any dragon strength token from the round track to the dragon strength box or b\) place a destroyed Dragon in their home area \(if able\) or c\) do nothing\.$/,
    (m) =>
      `A Casa ${m[1]} pode: a) destruir um Dragão para mover qualquer ficha de força dos dragões da trilha de rodadas para o quadro de força dos dragões, b) colocar um Dragão destruído na sua área natal (se puder), ou c) não fazer nada.`
  ],
  [
    /^House (.+) must choose a dragon strength token from the round track and place it to the current dragon strength box\.$/,
    (m) =>
      `A Casa ${m[1]} precisa escolher uma ficha de força dos dragões da trilha de rodadas e colocá-la no quadro de força dos dragões.`
  ],
  [
    /^House (.+) must choose an enemy which places a unit in (.+)\.$/,
    (m) =>
      `A Casa ${m[1]} precisa escolher um inimigo, que vai colocar uma unidade em ${region(m[2])}.`
  ],
  [
    /^House (.+) must choose a unit to place in (.+)\.$/,
    (m) =>
      `A Casa ${m[1]} precisa escolher uma unidade para colocar em ${region(m[2])}.`
  ],
  [
    /^House (.+) can choose to place another loyalty token\.$/,
    (m) => `A Casa ${m[1]} pode colocar mais uma Ficha de Lealdade.`
  ],
  [
    /^House (.+) may provide support against the Neutral Force in (.+)\.$/,
    (m) =>
      `A Casa ${m[1]} pode dar apoio contra a Força Neutra em ${region(m[2])}.`
  ],
  [
    /^House Targaryen may discard (\d+) Power tokens? to move the loyalty token from (.+) back to (.+)\.$/,
    (m) =>
      `A Casa Targaryen pode descartar ${m[1]} ${m[1] == "1" ? "Ficha" : "Fichas"} de Poder para mover a Ficha de Lealdade de ${region(m[2])} de volta para ${region(m[3])}.`
  ],
  [
    /^Discard (\d+) Power tokens? to cancel the previous movement$/,
    (m) =>
      `Descartar ${m[1]} ${m[1] == "1" ? "Ficha" : "Fichas"} de Poder para cancelar o movimento anterior`
  ],
  [/^Place a dragon in (.+)$/, (m) => `Colocar um dragão em ${region(m[1])}`],
  [
    /^declare House (.+) the winner$/,
    (m) => `declarar a Casa ${m[1]} vencedora`
  ],
  [
    /^replace (.+) \((.+)\) with a vassal$/,
    (m) => `substituir ${m[1]} (${m[2]}) por um vassalo`
  ],
  [/^replace Vassal house (.+)$/, (m) => `assumir a Casa vassala ${m[1]}`],
  [/^replace (.+) \((.+)\)$/, (m) => `substituir ${m[1]} (${m[2]})`],
  [
    /^swap houses with (.+) \((.+) <=> (.+)\)$/,
    (m) => `trocar de Casa com ${m[1]} (${m[2]} <=> ${m[3]})`
  ],
  [/^Deck (\d+)$/, (m) => `Baralho ${m[1]}`]
];

export function translateServerText(text: string): string {
  if (getLanguage() == "en" || !text) {
    return text;
  }
  const normalized = text.replace(/ /g, " ").trim();
  const exact = exactPtBR[normalized];
  if (exact != undefined) {
    return exact;
  }
  for (const [pattern, build] of templatesPtBR) {
    const match = normalized.match(pattern);
    if (match) {
      return build(match);
    }
  }
  // Nome de lugar sozinho (ex.: opção com uma área do mapa)
  const asRegion = region(normalized);
  return asRegion != normalized ? asRegion : text;
}

export interface LabeledChoice {
  // posição da opção na lista do servidor (é o que vai na resposta)
  index: number;
  // letra como está impressa na carta: a), b), c)
  letter: string;
  title: string;
  detail: string;
}

// Cartas de Westeros com opções a), b), c): os botões seguem as letras da
// carta e dizem o que acontece. Chave = descrição em inglês do servidor.
const LETTERED_CHOICES: {
  match: RegExp;
  options: { choice: string; letter: string; title: string; detail: string }[];
}[] = [
  {
    // Asas Negras, Palavras Negras
    match: /^The holder of the Messenger Raven token can choose between Clash of Kings/,
    options: [
      { choice: "Clash of Kings", letter: "a", title: "A Fúria dos Reis", detail: "lances nas três Trilhas de Influência" },
      { choice: "Game of Thrones", letter: "b", title: "Jogo dos Tronos", detail: "todos ganham Fichas de Poder" },
      { choice: "Nothing", letter: "c", title: "Nada", detail: "a carta não tem efeito" }
    ]
  },
  {
    // Um Trono de Lâminas
    match: /^The holder of the Iron Throne token can choose between Mustering, Supply/,
    options: [
      { choice: "Supply", letter: "a", title: "Suprimento", detail: "todos ajustam o Suprimento e os exércitos" },
      { choice: "Mustering", letter: "b", title: "Recrutamento", detail: "todos recrutam unidades" },
      { choice: "Nothing", letter: "c", title: "Nada", detail: "a carta não tem efeito" }
    ]
  },
  {
    // Passar a Fio de Espada
    match: /^The holder of the Valyrian Steel Blade can choose between No March \+1 Orders/,
    options: [
      { choice: "No Defense Orders", letter: "a", title: "Sem Defesa", detail: "ninguém pode usar ordens de Defesa" },
      { choice: "No March +1 Orders", letter: "b", title: "Sem Marcha +1", detail: "ninguém pode usar Marcha +1" },
      { choice: "No restrictions", letter: "c", title: "Sem restrições", detail: "todas as ordens liberadas" }
    ]
  },
  {
    // O Fardo do Poder
    match: /^The holder of the Iron Throne token chooses whether a\) the Wilding track/,
    options: [
      { choice: "Reduce the Wildling track to 0", letter: "a", title: "Selvagens a 0", detail: 'a trilha dos Selvagens volta para "0"' },
      { choice: "Mustering", letter: "b", title: "Recrutamento", detail: "todos recrutam em Fortalezas e Castelos" }
    ]
  }
];

/**
 * Para as cartas com opções a), b), c): devolve as opções na ordem da carta,
 * com letra, nome e o que acontece. Devolve null se não for uma dessas cartas
 * (ou se o servidor mandar opções diferentes das esperadas: aí os botões
 * normais aparecem, sem quebrar nada).
 */
export function letteredChoices(
  description: string,
  choices: string[]
): LabeledChoice[] | null {
  if (getLanguage() == "en") return null;
  const entry = LETTERED_CHOICES.find((e) => e.match.test(description.trim()));
  if (!entry) return null;
  const result: LabeledChoice[] = [];
  for (const o of entry.options) {
    const index = choices.indexOf(o.choice);
    if (index < 0) return null;
    result.push({ index, letter: o.letter, title: o.title, detail: o.detail });
  }
  if (result.length != choices.length) return null;
  return result;
}
