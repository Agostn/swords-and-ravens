/**
 * Combate tático (mini-mapa de batalha): os números das regras.
 *
 * Tudo que define o equilíbrio fica aqui, num lugar só, para o simulador
 * (tools/tactical) testar e ajustar sem mexer no resto do código.
 * Explicação das regras: docs/PLANO-COMBATE-TATICO.md
 */

/** Tipo de peça do tabuleiro que entra no mini-mapa como um esquadrão. */
export type SquadKind = "footman" | "knight" | "siege-engine" | "ship" | "dragon" | "garrison";

/** Função do esquadrão no mini-mapa. Só o soldado (e o navio) escolhe. */
export type Role =
  | "lanceiro"
  | "escudeiro"
  | "arqueiro"
  | "cavalaria"
  | "batedores"
  | "catapulta"
  | "dragao"
  | "torre"
  | "ariete"
  | "abordagem"
  | "flechas";

/** Funções que cada tipo de peça pode escolher (a primeira é a padrão). */
export const ROLES_BY_KIND: Record<SquadKind, Role[]> = {
  footman: ["lanceiro", "escudeiro", "arqueiro"],
  knight: ["cavalaria", "batedores"],
  "siege-engine": ["catapulta"],
  ship: ["abordagem", "ariete", "flechas"],
  dragon: ["dragao"],
  garrison: ["torre"]
};

/**
 * Valor de cada esquadrão: 3 × a força da peça no jogo original
 * (soldado 1 → 3, cavaleiro 2 → 6, navio 1 → 3). A máquina de cerco vale 0 no
 * jogo fora de castelo; aqui ela vale um pouco (2), e muito contra muralha.
 * Dragão e guarnição: 3 × a força dele no momento.
 */
export const BASE_VALUE: Record<SquadKind, number> = {
  footman: 3,
  knight: 6,
  "siege-engine": 2,
  ship: 3,
  dragon: 3,
  garrison: 3
};

/** Quantas bolinhas cada esquadrão mostra na animação. */
export const FIGURES: Record<SquadKind, number> = {
  footman: 3,
  knight: 2,
  "siege-engine": 1,
  ship: 1,
  dragon: 1,
  garrison: 1
};

/**
 * Vantagem de uma função (linha) lutando contra outra (coluna).
 * > 1: bate mais forte; < 1: rende menos. É o "pedra-papel-tesoura":
 *   entre os soldados: arqueiro > lanceiro > escudeiro > arqueiro;
 *   o cavaleiro escolhe: "cavalaria" (carga: vence arqueiro e escudeiro, perde para o lanceiro)
 *   ou "batedores" (cavalaria leve: vence o lanceiro, perde para o escudeiro).
 *   No mar: abordagem > aríete > flechas > abordagem.
 */
export const ADVANTAGE: Record<Role, Partial<Record<Role, number>>> = {
  lanceiro: { cavalaria: 1.6, batedores: 0.8, arqueiro: 0.75, escudeiro: 1.3, lanceiro: 1.0, catapulta: 1.5, dragao: 0.7, torre: 0.6 },
  escudeiro: { arqueiro: 1.5, cavalaria: 0.8, batedores: 1.25, lanceiro: 0.75, escudeiro: 1.0, catapulta: 1.5, dragao: 0.7, torre: 0.8 },
  arqueiro: { lanceiro: 1.4, escudeiro: 0.6, cavalaria: 0.75, batedores: 1.0, arqueiro: 1.0, catapulta: 1.5, dragao: 1.1, torre: 0.6 },
  cavalaria: { arqueiro: 1.8, escudeiro: 1.3, lanceiro: 0.6, cavalaria: 1.0, batedores: 1.2, catapulta: 2.0, dragao: 0.7, torre: 0.5 },
  batedores: { lanceiro: 1.3, arqueiro: 1.0, escudeiro: 0.8, cavalaria: 0.85, batedores: 1.0, catapulta: 1.8, dragao: 0.7, torre: 0.5 },
  catapulta: { lanceiro: 0.7, escudeiro: 0.7, arqueiro: 0.7, cavalaria: 0.5, batedores: 0.5, catapulta: 1.0, dragao: 0.3, torre: 1.5 },
  dragao: { lanceiro: 1.5, escudeiro: 1.5, arqueiro: 1.2, cavalaria: 1.5, batedores: 1.5, catapulta: 1.5, dragao: 1.0, torre: 1.3 },
  torre: { lanceiro: 1.0, escudeiro: 0.7, arqueiro: 1.0, cavalaria: 1.0, batedores: 1.0, catapulta: 1.0, dragao: 1.0, torre: 1.0 },
  ariete: { flechas: 1.6, abordagem: 0.7, ariete: 1.0 },
  abordagem: { ariete: 1.6, flechas: 0.7, abordagem: 1.0 },
  flechas: { abordagem: 1.6, ariete: 0.7, flechas: 1.0 }
};

/** Linha do esquadrão: frente ou trás. */
export type Row = "frente" | "tras";

/** Quanto cada função rende em cada linha. Arqueiro e catapulta preferem trás; quem é corpo a corpo, frente. */
export const ROW_FACTOR: Record<Role, Record<Row, number>> = {
  lanceiro: { frente: 1.0, tras: 0.6 },
  escudeiro: { frente: 1.0, tras: 0.6 },
  arqueiro: { frente: 0.8, tras: 1.2 },
  cavalaria: { frente: 1.0, tras: 0.6 },
  batedores: { frente: 1.0, tras: 0.8 },
  catapulta: { frente: 0.7, tras: 1.0 },
  dragao: { frente: 1.0, tras: 1.0 },
  torre: { frente: 1.0, tras: 1.0 },
  ariete: { frente: 1.0, tras: 0.6 },
  abordagem: { frente: 1.0, tras: 0.6 },
  flechas: { frente: 0.8, tras: 1.2 }
};

/**
 * Proteção da linha de trás: se a frente do mesmo lado (na mesma faixa) tem
 * pelo menos esta fração do valor de quem está atrás, a cavalaria inimiga não
 * consegue "furar" e perde o bônus contra arqueiros/catapultas de trás.
 */
export const SCREEN_RATIO = 0.5;

/** Terreno de cada faixa. */
export type Terrain = "aberto" | "mata" | "colina" | "rio" | "vau" | "muralha" | "portao" | "bloqueado" | "mar";

export interface TerrainRules {
  /** multiplicador por função, para os dois lados */
  role?: Partial<Record<Role, number>>;
  /** multiplicador extra para quem ataca e para quem defende */
  attacker?: number;
  defender?: number;
  /** muralha: a catapulta do atacante derruba e anula o bônus do defensor */
  wall?: boolean;
}

export const TERRAIN: Record<Terrain, TerrainRules> = {
  aberto: { role: { cavalaria: 1.25, batedores: 1.15 } },
  mata: { role: { arqueiro: 0.6, cavalaria: 0.7, batedores: 0.8, lanceiro: 1.1, escudeiro: 1.1, catapulta: 0.6 } },
  colina: { role: { arqueiro: 1.2 }, defender: 1.25 },
  rio: { attacker: 0.75, role: { cavalaria: 0.8, batedores: 0.8 } },
  vau: { attacker: 0.9 },
  muralha: { defender: 1.4, role: { cavalaria: 0.7, batedores: 0.7 }, wall: true },
  portao: { defender: 1.15, wall: true },
  bloqueado: {},
  mar: {}
};

/** Quanto a catapulta do atacante rende numa faixa com muralha (derrubando). */
export const SIEGE_VS_WALL = 3.0;

/** Tipos de campo (vem da área do tabuleiro). Faixas: esquerda, centro, direita. */
export type FieldType = "planicie" | "floresta" | "montanha" | "rio" | "castelo" | "fortaleza" | "mar";

export const FIELD_LANES: Record<FieldType, [Terrain, Terrain, Terrain]> = {
  planicie: ["aberto", "aberto", "aberto"],
  floresta: ["mata", "aberto", "mata"],
  montanha: ["colina", "aberto", "bloqueado"],
  rio: ["rio", "vau", "rio"],
  castelo: ["muralha", "portao", "aberto"],
  fortaleza: ["muralha", "portao", "muralha"],
  mar: ["mar", "mar", "mar"]
};

/** Carta de Casa: a força dela vira moral; espadas, ataque; torres, defesa. */
export const CARD_STRENGTH_FACTOR = 0.06; // por ponto de força
export const CARD_SWORD_FACTOR = 0.05; // por espada: +5% no que você causa
export const CARD_TOWER_FACTOR = 0.05; // por torre: −5% no que o inimigo causa

/** Esquadrão de apoio (vizinho): chega depois, rende um pouco menos. */
export const SUPPORT_FACTOR = 0.8;

/** Flanco: quem vence uma faixa ganha este bônus nas faixas vizinhas. */
export const FLANK_BONUS = 0.2;

/**
 * Faixa sem inimigo não conta como vitória (senão o exército maior sempre
 * ganharia só por ocupar mais faixas). Quem está sozinho numa faixa ataca pelo
 * lado: soma esta fração do que causaria nas faixas vizinhas em que há luta.
 */
export const UNOPPOSED_FLANK_SHARE = 0.3;

/** Diferença mínima para uma faixa não ser empate (10%). */
export const LANE_TIE_MARGIN = 0.05;

/** Bônus na batalha do tabuleiro para quem vence o mini-mapa. */
export const BONUS_ALL_LANES = 2;
export const BONUS_MAJORITY = 1;
