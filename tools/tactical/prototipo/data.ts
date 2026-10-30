/** Textos, Casas e batalhas prontas do protótipo do combate tático. */
import { FieldType, Role, SquadKind, Terrain } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { CardInfo } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";

export interface House {
  name: string;
  color: string;
  dark: string;
  ink: string;
}

export const HOUSES: Record<string, House> = {
  stark: { name: "Stark", color: "#d9d6cc", dark: "#8f8b80", ink: "#24211c" },
  lannister: { name: "Lannister", color: "#c0303a", dark: "#6e1218", ink: "#fff3e3" },
  baratheon: { name: "Baratheon", color: "#e0b236", dark: "#8a6410", ink: "#24190a" },
  greyjoy: { name: "Greyjoy", color: "#6b757d", dark: "#2c3236", ink: "#f4f4f4" },
  tyrell: { name: "Tyrell", color: "#4f9a44", dark: "#24521d", ink: "#f4faee" },
  martell: { name: "Martell", color: "#e5832b", dark: "#8a420b", ink: "#24160a" },
  arryn: { name: "Arryn", color: "#4690cc", dark: "#1d4b72", ink: "#f2f8fd" },
  targaryen: { name: "Targaryen", color: "#7a35c4", dark: "#3b1366", ink: "#f7f0ff" }
};

export const FIELD_NAMES: Record<FieldType, string> = {
  planicie: "Planície",
  colinas: "Colinas",
  floresta: "Floresta",
  montanha: "Montanha",
  rio: "Rio",
  pantano: "Pântano",
  deserto: "Deserto",
  castelo: "Castelo",
  fortaleza: "Fortaleza",
  mar: "Mar"
};

export const FIELD_EXAMPLE: Record<FieldType, string> = {
  planicie: "Campina, Porto Real",
  colinas: "Septo de Pedra, Os Dedos",
  floresta: "Mata do Rei, Mata dos Lobos",
  montanha: "Ninho da Águia, Passo do Príncipe",
  rio: "Correrrio, As Gêmeas",
  pantano: "o Gargalo",
  deserto: "Lançassolar, Costa do Sal",
  castelo: "Harrenhal, Ponta Tempestade",
  fortaleza: "Winterfell, Pedra do Dragão",
  mar: "Mar Estreito"
};

export const TERRAIN_NAMES: Record<Terrain, string> = {
  aberto: "Campo aberto",
  mata: "Mata",
  colina: "Colina",
  rio: "Rio",
  vau: "Vau",
  pantano: "Pântano",
  calcada: "Calçada",
  areia: "Areia",
  muralha: "Muralha",
  portao: "Portão",
  bloqueado: "Fechado",
  mar: "Mar aberto"
};

/** Efeito do terreno em palavras simples. */
export const TERRAIN_HINT: Record<Terrain, string> = {
  aberto: "Bom para cavalos: cavalaria +25%, batedores +15%.",
  mata: "Árvores atrapalham flechas e cavalos. Lanceiros e escudeiros +10%.",
  colina: "Quem defende fica no alto: +25%. Arqueiros +20%.",
  rio: "Quem ataca atravessa a água: −20%. Cavalos −20%.",
  vau: "Passagem rasa: quem ataca −5%.",
  pantano: "Cavalos e máquinas atolam. Quem ataca −10%, quem defende +10%.",
  calcada: "Estrada sobre o brejo: quem ataca −10%.",
  areia: "Calor de Dorne: armadura pesada sofre, batedores +20%.",
  muralha: "Quem defende +30%. Uma catapulta do atacante aqui derruba a muralha.",
  portao: "Quem defende +10%. A catapulta também derruba.",
  bloqueado: "Montanha fechada: ninguém passa.",
  mar: "Batalha de navios."
};

export const ROLE_NAMES: Record<Role, string> = {
  lanceiro: "Lanceiro",
  escudeiro: "Escudeiro",
  arqueiro: "Arqueiro",
  cavalaria: "Cavalaria",
  batedores: "Batedores",
  catapulta: "Catapulta",
  dragao: "Dragão",
  torre: "Torre",
  ariete: "Aríete",
  abordagem: "Abordagem",
  flechas: "Flechas"
};

export const ROLE_PLURAL: Record<Role, string> = {
  lanceiro: "os lanceiros",
  escudeiro: "os escudeiros",
  arqueiro: "os arqueiros",
  cavalaria: "a cavalaria",
  batedores: "os batedores",
  catapulta: "a catapulta",
  dragao: "o dragão",
  torre: "a torre",
  ariete: "o aríete",
  abordagem: "a abordagem",
  flechas: "as flechas"
};

/** Uma linha curta: o que vence e o que teme. */
export const ROLE_SHORT: Record<Role, { vence: string; teme: string }> = {
  lanceiro: { vence: "cavalaria e escudeiros", teme: "arqueiros e batedores" },
  escudeiro: { vence: "arqueiros e batedores", teme: "lanceiros e cavalaria" },
  arqueiro: { vence: "lanceiros", teme: "escudeiros e cavalaria" },
  cavalaria: { vence: "arqueiros e escudeiros", teme: "lanceiros" },
  batedores: { vence: "lanceiros", teme: "escudeiros" },
  catapulta: { vence: "muralhas", teme: "quem chega perto" },
  dragao: { vence: "quase tudo", teme: "arqueiros juntos" },
  torre: { vence: "—", teme: "—" },
  ariete: { vence: "flechas", teme: "abordagem" },
  abordagem: { vence: "aríete", teme: "flechas" },
  flechas: { vence: "abordagem e lanceiros", teme: "aríete e escudeiros" }
};

export const ROLE_TIP: Partial<Record<Role, string>> = {
  arqueiro: "Rende mais atrás.",
  flechas: "Rende mais atrás.",
  catapulta: "Fica atrás; só vale contra muralha.",
  lanceiro: "Rende mais na frente.",
  escudeiro: "Rende mais na frente; protege quem está atrás.",
  cavalaria: "Rende mais na frente.",
  batedores: "Pode ficar atrás sem perder muito."
};

export const KIND_NAMES: Record<SquadKind, string> = {
  footman: "Soldado",
  knight: "Cavaleiro",
  "siege-engine": "Máquina de cerco",
  ship: "Navio",
  dragon: "Dragão",
  garrison: "Guarnição"
};

// ---------------------------------------------------------------- batalhas prontas
export interface SideConfig {
  house: string;
  footmen: number;
  knights: number;
  siege: number;
  ships: number;
  dragon: number;
  supportFootmen: number;
  supportShips: number;
  garrison: number;
  card: CardInfo;
  order: number;
}

export interface Preset {
  id: string;
  name: string;
  story: string;
  field: FieldType;
  place: string;
  tag?: string;
  attacker: Partial<SideConfig> & { house: string };
  defender: Partial<SideConfig> & { house: string };
}

export const EMPTY_SIDE: SideConfig = {
  house: "stark",
  footmen: 0,
  knights: 0,
  siege: 0,
  ships: 0,
  dragon: 0,
  supportFootmen: 0,
  supportShips: 0,
  garrison: 0,
  card: { strength: 1, swords: 0, towers: 0 },
  order: 0
};

export const PRESETS: Preset[] = [
  {
    id: "primeira",
    name: "Primeira batalha",
    tag: "Comece aqui",
    story: "Dois soldados de cada lado, campo aberto. Ideal para aprender quem vence quem.",
    field: "planicie",
    place: "Campina",
    attacker: { house: "stark", footmen: 2 },
    defender: { house: "lannister", footmen: 2 }
  },
  {
    id: "sussurros",
    name: "Bosque dos Sussurros",
    story: "Os Stark esperam na mata. Os cavaleiros Lannister entram nas árvores, onde cavalo rende menos.",
    field: "floresta",
    place: "Correrrio (perto da mata)",
    attacker: { house: "lannister", footmen: 1, knights: 2, card: { strength: 2, swords: 1, towers: 0 }, order: 1 },
    defender: { house: "stark", footmen: 3, card: { strength: 3, swords: 0, towers: 1 }, order: 1 }
  },
  {
    id: "sinos",
    name: "Batalha dos Sinos",
    story: "Robert Baratheon se esconde nas ruas do Septo de Pedra, no alto do morro. Os Targaryen precisam subir.",
    field: "colinas",
    place: "Septo de Pedra",
    attacker: { house: "targaryen", footmen: 2, knights: 1, card: { strength: 2, swords: 0, towers: 0 }, order: 0 },
    defender: { house: "baratheon", footmen: 2, knights: 1, card: { strength: 4, swords: 1, towers: 0 }, order: 1 }
  },
  {
    id: "gemeas",
    name: "Travessia das Gêmeas",
    story: "Os Stark precisam atravessar o Ramo Verde. Use o vau ou ataque pela água?",
    field: "rio",
    place: "As Gêmeas",
    attacker: { house: "stark", footmen: 2, knights: 1, card: { strength: 2, swords: 1, towers: 0 }, order: 1 },
    defender: { house: "lannister", footmen: 2, knights: 1, supportFootmen: 1, card: { strength: 1, swords: 0, towers: 1 }, order: 1 }
  },
  {
    id: "tempestade",
    name: "Cerco de Ponta Tempestade",
    story: "Os Tyrell trazem uma máquina de cerco contra as muralhas Baratheon. Onde ela vai derrubar?",
    field: "castelo",
    place: "Ponta Tempestade",
    attacker: { house: "tyrell", footmen: 2, knights: 1, siege: 1, card: { strength: 1, swords: 0, towers: 0 }, order: 1 },
    defender: { house: "baratheon", footmen: 2, knights: 1, garrison: 1, card: { strength: 2, swords: 0, towers: 1 }, order: 0 }
  },
  {
    id: "cailin",
    name: "Fosso Cailin",
    story: "Os homens de ferro seguram o Gargalo. Cavalos atolam no brejo; a calçada é o único caminho firme.",
    field: "pantano",
    place: "Fosso Cailin",
    attacker: { house: "stark", footmen: 2, knights: 2, card: { strength: 2, swords: 1, towers: 0 }, order: 1 },
    defender: { house: "greyjoy", footmen: 3, card: { strength: 1, swords: 0, towers: 1 }, order: 1 }
  },
  {
    id: "dorne",
    name: "Areias de Dorne",
    story: "A cavalaria pesada da Campina sofre no calor. As lanças e os batedores de Dorne esperam.",
    field: "deserto",
    place: "Lançassolar",
    attacker: { house: "tyrell", footmen: 1, knights: 2, card: { strength: 3, swords: 0, towers: 0 }, order: 0 },
    defender: { house: "martell", footmen: 2, knights: 1, card: { strength: 2, swords: 1, towers: 0 }, order: 1 }
  },
  {
    id: "dragoes",
    name: "Dragões em Porto Real",
    story: "Um dragão ataca a fortaleza. Os Lannister têm arqueiros e uma guarnição na muralha.",
    field: "fortaleza",
    place: "Porto Real",
    attacker: { house: "targaryen", footmen: 1, dragon: 3, card: { strength: 2, swords: 1, towers: 0 }, order: 1 },
    defender: { house: "lannister", footmen: 3, garrison: 1, card: { strength: 2, swords: 0, towers: 1 }, order: 1 }
  },
  {
    id: "naval",
    name: "Baía da Água Negra",
    story: "Batalha de navios: aríete, abordagem ou flechas? Adivinhe o que a outra frota vai fazer.",
    field: "mar",
    place: "Baía da Água Negra",
    attacker: { house: "baratheon", ships: 3, card: { strength: 2, swords: 0, towers: 0 }, order: 1 },
    defender: { house: "lannister", ships: 3, card: { strength: 1, swords: 0, towers: 1 }, order: 0 }
  }
];
