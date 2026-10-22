import { DataDictionary } from "../dataTranslations";

// Nomes vindos dos dados do jogo, em português do Brasil.
// Lugares: nomes da série da HBO; quando o lugar não aparece na série, nome
// dos livros em português. Lista completa e fontes: glossário do projeto.

const ptBRData: Omit<DataDictionary, "cards"> = {
  regions: {
    // Westeros — terra
    Winterfell: "Winterfell",
    "Castle Black": "Castelo Negro",
    Karhold: "Karhold",
    "The Stony Shore": "Costa Pedregosa",
    "White Harbor": "Porto Branco",
    "Widow's Watch": "Atalaia da Viúva",
    "Moat Cailin": "Fosso Cailin",
    "Greywater Watch": "Atalaia da Água Cinzenta",
    "Flint's Finger": "Dedo de Pederneira",
    "The Twins": "As Gêmeas",
    Seagard: "Guardamar",
    Riverrun: "Correrrio",
    Harrenhal: "Harrenhal",
    Pyke: "Pyke",
    Lannisport: "Lannisporto",
    "Stoney Sept": "Septo de Pedra",
    "Searoad Marches": "Marcas da Estrada do Mar",
    "The Eyrie": "Ninho da Águia",
    "The Mountains of the Moon": "Montanhas da Lua",
    "The Fingers": "Os Dedos",
    "The Vale of Arryn": "Vale de Arryn",
    "Crackclaw Point": "Ponta da Garra Rachada",
    Blackwater: "Água Negra",
    "King's Landing": "Porto Real",
    Kingswood: "Mata do Rei",
    Dragonstone: "Pedra do Dragão",
    "Storm's End": "Ponta Tempestade",
    "The Reach": "Campina",
    Highgarden: "Jardim de Cima",
    Oldtown: "Vilavelha",
    "The Arbor": "A Árvore",
    "Three Towers": "Três Torres",
    "Dornish Marches": "Marcas de Dorne",
    "The Boneway": "Caminho dos Ossos",
    "Prince's Pass": "Passo do Príncipe",
    Starfall: "Tombastela",
    Yronwood: "Paloferro",
    "Salt Shore": "Costa do Sal",
    Sunspear: "Lançassolar",
    // Mares
    "Bay of Ice": "Baía do Gelo",
    "The Shivering Sea": "Mar Tremente",
    "The Narrow Sea": "Mar Estreito",
    "Ironman's Bay": "Baía dos Homens de Ferro",
    "The Golden Sound": "Estreito Dourado",
    "Sunset Sea": "Mar do Poente",
    "Blackwater Bay": "Baía da Água Negra",
    "Shipbreaker Bay": "Baía dos Naufrágios",
    "Redwyne Straights": "Estreitos de Redwyne",
    "West Summer Sea": "Mar do Verão Oeste",
    "East Summer Sea": "Mar do Verão Leste",
    "Sea of Dorne": "Mar de Dorne",
    // Essos (Mãe dos Dragões)
    Braavos: "Braavos",
    Pentos: "Pentos",
    Myr: "Myr",
    Norvos: "Norvos",
    Volantis: "Volantis",
    "The Disputed Lands": "Terras Disputadas",
    "The Rhoyne": "Roine",
    "Braavosian Coastlands": "Costa Braavosi",
    "Bay of Pentos": "Baía de Pentos",
    "The Bite": "A Dentada",
    "Sea of Myrth": "Mar de Myrth",
    "The Orange Shore": "Costa Laranja"
  },
  portFormat: "Porto de {region}",
  trackNames: {
    "0": "Trono de Ferro",
    "1": "Feudos",
    "2": "Corte do Rei"
  },
  ports: {
    "Port of White Harbor": "Porto Branco (porto)",
    "Port of The Eyrie": "Porto do Ninho da Águia"
  },
  unitNames: {
    footman: "Soldado",
    knight: "Cavaleiro",
    "siege-engine": "Máquina de Cerco",
    ship: "Navio",
    dragon: "Dragão"
  },
  unitDescriptions: {
    footman:
      "Adiciona 1 de Força de Combate na batalha. Custa 1 ponto de recrutamento.",
    knight:
      "Adiciona 2 de Força de Combate na batalha. Custa 2 pontos de recrutamento (ou 1 ponto se for promovido de um Soldado).",
    "siege-engine":
      "Adiciona 4 de Força de Combate ao atacar (ou apoiar um ataque contra) uma área com Castelo ou Fortaleza; caso contrário, adiciona 0. Máquinas de Cerco não podem recuar ao perder um combate: são destruídas. Custa 2 pontos de recrutamento (ou 1 ponto se for promovida de um Soldado).",
    ship: "Adiciona 1 de Força de Combate na batalha. Custa 1 ponto de recrutamento.",
    dragon:
      "Adiciona de 0 a 5 de Força de Combate na batalha, conforme a posição atual da ficha de força dos dragões. Dragões são criaturas raríssimas e não podem ser recrutados como as outras unidades: já estão em jogo desde o começo da partida."
  },
  orderNames: {
    "march-minus-one": "Marcha -1",
    march: "Marcha",
    "march-plus-one": "Marcha +1",
    "defense-plus-one": "Defesa +1",
    "defense-plus-two": "Defesa +2",
    "defense-plus-three": "Defesa +3",
    support: "Apoio",
    "support-plus-one": "Apoio +1",
    "consolidate-power": "Consolidar Poder",
    "special-consolidate-power": "Consolidar Poder Especial",
    raid: "Incursão",
    "special-raid": "Incursão Especial",
    "raid-support-plus-one": "Incursão/Apoio +1",
    "defense-muster": "Defesa +1/Recrutamento",
    "sea-march": "Marcha Marítima -1",
    "sea-support": "Apoio Marítimo",
    "sea-iron-bank": "Banco de Ferro"
  }
};

export default ptBRData;
