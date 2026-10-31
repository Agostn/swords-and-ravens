/**
 * Combate tático (mini-mapa de batalha): os números das regras.
 *
 * Tudo que define o equilíbrio fica aqui, num lugar só, para o simulador
 * (tools/tactical) testar e ajustar sem mexer no resto do código.
 * Explicação das regras: docs/COMBATE-TATICO-REGRAS.md
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

/** Funções que cada tipo de peça pode escolher no mar ou em terra (a primeira é a padrão). */
export const ROLES_BY_KIND: Record<SquadKind, Role[]> = {
  footman: ["lanceiro", "escudeiro", "arqueiro"],
  knight: ["cavalaria", "batedores"],
  "siege-engine": ["catapulta"],
  ship: ["abordagem", "ariete", "flechas"],
  dragon: ["dragao"],
  garrison: ["torre"]
};

/**
 * Funções possíveis numa batalha. Navio em batalha de terra só entra como APOIO
 * (regra do jogo original: navio apoia área de terra vizinha) e atira de longe: "flechas".
 */
export function rolesFor(kind: SquadKind, seaBattle: boolean): Role[] {
  if (kind == "ship" && !seaBattle) return ["flechas"];
  return ROLES_BY_KIND[kind];
}

/**
 * Valor de cada esquadrão = a força da peça no jogo original, na situação da batalha
 * (soldado 1, cavaleiro 2, navio 1). É o MESMO número do tabuleiro, para não confundir
 * (antes era 3 × a força; a conta é proporcional, então o resultado não muda).
 *  - Máquina de cerco: força 4 só quando ATACA (ou apoia o ataque a) área com Castelo/Fortaleza;
 *    em qualquer outra situação vale 0 e nem entra no mini-mapa (igual ao jogo original).
 *  - Dragão e guarnição: a força deles no momento.
 *  - Peça ferida (derrotada e recuada) vale 0 no jogo original e também não entra.
 * Quem chama a conta passa a força da peça em `strength`.
 */
export const BASE_VALUE: Record<SquadKind, number> = {
  footman: 1,
  knight: 1,
  "siege-engine": 1,
  ship: 1,
  dragon: 1,
  garrison: 1
};

/** Força da peça no jogo original (sem contar dragão/guarnição, que variam). */
export const BOARD_STRENGTH: Record<SquadKind, number> = {
  footman: 1,
  knight: 2,
  "siege-engine": 0,
  ship: 1,
  dragon: 0,
  garrison: 0
};

/** Força da máquina de cerco quando ataca castelo/fortaleza (jogo original). */
export const SIEGE_STRENGTH_VS_CASTLE = 4;

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
/**
 * Dragão (31/out, balanceado com tools/tactical/dragao.ts): quanto ele bate em cada tropa (DRG_OUT) e quanto
 * cada tropa bate nele (DRG_IN). Arqueiro e lanceiro alcançam o dragão no ar (flechas, lança comprida);
 * escudeiro e cavalaria pouco (por isso, na animação, contra eles o dragão desce e luta no chão).
 */
const G = globalThis as { __DOUT__?: number; __DIN__?: number };
// 1,5 (antes): o lado do dragão vencia a Mesa quase sempre (+47 jogando bem); 1,2: −6; 1,3 com voo 75/60: +19
export const DRG_OUT: number = G.__DOUT__ ?? 1.3;
const DIN = G.__DIN__ ?? 1;
export const DRG_IN = { arqueiro: 1.3 * DIN, lanceiro: 1.05 * DIN, escudeiro: 0.75 * DIN, cavalaria: 0.75 * DIN };

export const ADVANTAGE: Record<Role, Partial<Record<Role, number>>> = {
  lanceiro: { cavalaria: 1.6, batedores: 0.8, arqueiro: 0.75, escudeiro: 1.3, lanceiro: 1.0, catapulta: 1.5, dragao: DRG_IN.lanceiro, torre: 0.6 },
  escudeiro: { arqueiro: 1.5, cavalaria: 0.8, batedores: 1.25, lanceiro: 0.75, escudeiro: 1.0, catapulta: 1.5, dragao: DRG_IN.escudeiro, torre: 0.8 },
  arqueiro: { lanceiro: 1.4, escudeiro: 0.6, cavalaria: 0.75, batedores: 1.0, arqueiro: 1.0, catapulta: 1.5, dragao: DRG_IN.arqueiro, torre: 0.6 },
  cavalaria: { arqueiro: 1.8, escudeiro: 1.3, lanceiro: 0.6, cavalaria: 1.0, batedores: 1.2, catapulta: 2.0, dragao: DRG_IN.cavalaria, torre: 0.5 },
  batedores: { lanceiro: 1.3, arqueiro: 1.0, escudeiro: 0.8, cavalaria: 0.85, batedores: 1.0, catapulta: 1.8, dragao: DRG_IN.cavalaria, torre: 0.5 },
  catapulta: { lanceiro: 0.7, escudeiro: 0.7, arqueiro: 0.7, cavalaria: 0.5, batedores: 0.5, catapulta: 1.0, dragao: 0.3, torre: 1.5 },
  dragao: { lanceiro: DRG_OUT, escudeiro: DRG_OUT, arqueiro: DRG_OUT * 0.87, cavalaria: DRG_OUT, batedores: DRG_OUT, catapulta: DRG_OUT, dragao: 1.0, torre: DRG_OUT * 0.87 },
  torre: { lanceiro: 1.0, escudeiro: 0.7, arqueiro: 1.0, cavalaria: 1.0, batedores: 1.0, catapulta: 1.0, dragao: 1.0, torre: 1.0 },
  ariete: { flechas: 1.6, abordagem: 0.7, ariete: 1.0 },
  abordagem: { ariete: 1.6, flechas: 0.7, abordagem: 1.0 },
  // navio: no mar, pedra-papel-tesoura; em terra (apoio), atira como arqueiro
  flechas: { abordagem: 1.6, ariete: 0.7, flechas: 1.0, lanceiro: 1.4, escudeiro: 0.6, arqueiro: 1.0, cavalaria: 0.75, batedores: 1.0, catapulta: 1.5, dragao: DRG_IN.arqueiro, torre: 0.6 }
};

/**
 * Quanto a "pedra-papel-tesoura" pesa: a vantagem usada na conta é 1 + (ADVANTAGE − 1) × COUNTER_SCALE.
 * 1 = a tabela inteira; 0,5 = metade do efeito. Assim dá para ajustar o peso da escolha de função
 * sem reescrever a tabela.
 * Testado (30/out, tools/tactical/influencia.ts): com 1, uma carta de força 4 contra 0 ainda perdia o
 * mini-mapa 35% das vezes só por causa da função escolhida. Com 0,7 (e a Reação), quem tem a carta
 * melhor, a ordem melhor ou mais tropas quase sempre vence, e jogar bem rende o dobro.
 */
export const COUNTER_SCALE: number = (globalThis as { __COUNTER_SCALE__?: number }).__COUNTER_SCALE__ ?? 0.7;

/**
 * Só a escolha de função (o "pedra-papel-tesoura") é suavizada. Dragão, torre e catapulta
 * não são escolha: a vantagem deles fica inteira (dragão continua sendo dragão).
 */
const CHOSEN_ROLES: Role[] = ["lanceiro", "escudeiro", "arqueiro", "cavalaria", "batedores", "abordagem", "ariete", "flechas"];
export function advantage(mine: Role, theirs: Role): number {
  const a = ADVANTAGE[mine][theirs] ?? 1;
  return CHOSEN_ROLES.includes(mine) && CHOSEN_ROLES.includes(theirs) ? 1 + (a - 1) * COUNTER_SCALE : a;
}

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
export type Terrain =
  | "aberto"
  | "mata"
  | "colina"
  | "rio"
  | "vau"
  | "pantano"
  | "calcada"
  | "areia"
  | "muralha"
  | "portao"
  | "bloqueado"
  | "mar";

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
  rio: { attacker: 0.8, role: { cavalaria: 0.8, batedores: 0.8 } },
  vau: { attacker: 0.95 },
  // Gargalo (Neck): cavalo e máquina atolam; quem é de lá conhece o caminho
  pantano: { role: { cavalaria: 0.6, batedores: 0.7, catapulta: 0.5, escudeiro: 0.9 }, attacker: 0.9, defender: 1.1 },
  calcada: { role: { cavalaria: 0.9, batedores: 0.9 }, attacker: 0.9 },
  // Dorne: armadura pesada sofre no calor; cavalaria leve e lanças dornesas brilham
  areia: { role: { cavalaria: 0.8, escudeiro: 0.9, batedores: 1.2, lanceiro: 1.05 }, attacker: 0.9 },
  muralha: { defender: 1.3, role: { cavalaria: 0.7, batedores: 0.7 }, wall: true },
  portao: { defender: 1.1, wall: true },
  bloqueado: {},
  mar: {}
};

/**
 * A catapulta foi feita para muralha: fora de faixa com muralha/portão ela rende só isto.
 * (Ela só entra quando o atacante ataca castelo/fortaleza; ver BASE_VALUE.)
 */
export const SIEGE_OPEN_FACTOR = 0.5;

/**
 * Limites de peças (31/out). No jogo original o exército maior possível tem 4 peças (trilha de Suprimento:
 * o nível mais alto é [4, 3, 2, 2, 2], data/baseGameData.json). No fim do jogo a batalha típica tem um exército
 * de 3 ou 4 peças mais 1 ou 2 áreas apoiando.
 * - ARMY_MAX: peças do exército na área (ataque ou defesa);
 * - SUPPORT_MAX: peças de apoio de cada tipo (o apoio NÃO entra no campo: vira bônus pronto, como a ordem);
 * - SLOT_MAX: esquadrões por casinha (2; na montanha 3, ver slotMaxFor).
 */
/**
 * Dragão voa: além da sua faixa, ajuda as outras faixas com luta: faixa ao lado 75% da força, a da outra ponta
 * 60% (no meio, ele alcança as duas com 75%). Balanceado em 31/out com tools/tactical/dragao.ts (ver DRG_OUT).
 */
export const DRAGON_AIR_SHARE: number = (globalThis as { __DAIR__?: number }).__DAIR__ ?? 0.75;
export const DRAGON_AIR_FAR_SHARE: number = (globalThis as { __DAIRF__?: number }).__DAIRF__ ?? 0.6;

export const ARMY_MAX = 4;
export const SUPPORT_MAX = 4;
export const SLOT_MAX = 2;
/**
 * Volume (31/out): cada peça vira mais de um esquadrão na Mesa (soldado 2, cavaleiro 2 a cavalo ou 4 a pé,
 * máquina de cerco 2). Teto de 12 esquadrões por lado = 6 casinhas × 2 (na montanha, com uma faixa fechada,
 * 4 × 3 = 12). Assim nunca falta lugar. O apoio de áreas vizinhas não entra no campo.
 */
export const SQUAD_MAX = 12;
export function slotMaxFor(field: FieldType): number {
  // 2 por casinha (o Agostinho confirmou que está bom); na montanha, com uma faixa fechada, 3 para caber 12
  return FIELD_LANES[field].includes("bloqueado") ? 3 : SLOT_MAX;
}

/** Tipos de campo (vem da área do tabuleiro). Faixas: esquerda, centro, direita. */
export type FieldType =
  | "planicie"
  | "colinas"
  | "floresta"
  | "montanha"
  | "rio"
  | "pantano"
  | "deserto"
  | "castelo"
  | "fortaleza"
  | "mar";

export const FIELD_LANES: Record<FieldType, [Terrain, Terrain, Terrain]> = {
  planicie: ["aberto", "aberto", "aberto"],
  colinas: ["colina", "aberto", "colina"],
  floresta: ["mata", "aberto", "mata"],
  montanha: ["colina", "aberto", "bloqueado"],
  rio: ["rio", "vau", "rio"],
  pantano: ["pantano", "calcada", "pantano"],
  deserto: ["areia", "aberto", "areia"],
  castelo: ["muralha", "portao", "aberto"],
  fortaleza: ["muralha", "portao", "muralha"],
  mar: ["mar", "mar", "mar"]
};

/** Carta de Casa: a força dela vira moral; espadas, ataque; torres, defesa. */
export const CARD_STRENGTH_FACTOR = 0.06; // por ponto de força
export const CARD_SWORD_FACTOR = 0.05; // por espada: +5% no que você causa
export const CARD_TOWER_FACTOR = 0.05; // por torre: −5% no que o inimigo causa

/**
 * Ordens (jogo original): Marcha −1/+0/+1 do atacante, Defesa +1/+2 do defensor e
 * Apoio +0/+1 de quem apoia valem como pontos de força da carta: +6% por ponto
 * (Marcha −1: −6%). Elas também continuam somando na batalha do tabuleiro.
 */
export const ORDER_FACTOR = 0.06;

/** Esquadrão de apoio (vizinho): chega depois, rende um pouco menos. */
export const SUPPORT_FACTOR = 0.8;

/**
 * Formação (armas combinadas, como em Total War e na maioria dos jogos de estratégia): numa faixa,
 * quem tem corpo a corpo NA FRENTE e atirador ATRÁS rende mais. Misturar funções protege contra o
 * "chute errado" da pedra-papel-tesoura; ir tudo numa função só vira aposta.
 */
export const FORMATION_BONUS: number = (globalThis as { __FORMATION__?: number }).__FORMATION__ ?? 0.15;

/** Flanco: quem vence uma faixa ganha este bônus nas faixas vizinhas. */
export const FLANK_BONUS = 0.2;

/**
 * Faixa sem inimigo não conta como vitória (senão o exército maior sempre
 * ganharia só por ocupar mais faixas). Quem está sozinho numa faixa ataca pelo
 * lado: soma esta fração do que causaria nas faixas vizinhas em que há luta.
 */
export const UNOPPOSED_FLANK_SHARE = 0.3;

/**
 * Se não houver luta na faixa vizinha, quem está sozinho ainda ajuda a faixa da outra ponta,
 * mas rende menos (tem que atravessar o campo): metade da ajuda à vizinha.
 */
export const FAR_FLANK_SHARE = 0.15;

/** Diferença mínima para uma faixa não ser empate (5%). */
export const LANE_TIE_MARGIN = 0.05;

/**
 * Quando nenhuma faixa tem os dois lados (os exércitos se esquivaram):
 *  - "center": eles se encontram no centro e a conta é feita lá;
 *  - "defender": o ataque não achou a defesa: quem defende segura a área (+1);
 *  - "draw": ninguém ganha bônus.
 */
export const NO_CONTACT_RULE: "center" | "defender" | "draw" = (globalThis as { __NO_CONTACT__?: "center" | "defender" | "draw" }).__NO_CONTACT__ ?? "center";

/**
 * O tamanho do exército já conta na batalha do tabuleiro. Para o mini-mapa medir mais
 * QUEM LUTOU MELHOR do que quem tem mais tropas, o valor de cada lado é aproximado do
 * outro: valor × (média dos dois totais / total do lado) ^ SIZE_EQUALIZE.
 * 0 = tamanho conta inteiro; 1 = os dois lados valem igual; 0,5 = no meio.
 * Testado (30/out): aproximar quase não ajuda o lado menor e estraga a máquina de cerco
 * (o valor dela era "diluído"), então fica 0.
 */
export const SIZE_EQUALIZE: number = (globalThis as { __SIZE_EQ__?: number }).__SIZE_EQ__ ?? 0;

/** Bônus na batalha do tabuleiro para quem vence o mini-mapa (exército pequeno). */
export const BONUS_ALL_LANES = 2;
export const BONUS_MAJORITY = 1;

/**
 * O bônus CRESCE com o tamanho da batalha (31/out), senão no fim do jogo, com exércitos grandes, +1 não
 * vale nada: bônus = 1 + (força do MENOR exército no tabuleiro ÷ 4, arredondado para baixo); vencer todas
 * as faixas dá +1 a mais. Exemplos: 2 contra 2 → +1 (todas: +2); 4 contra 5 → +2; 8 contra 9 → +3.
 */
export const BONUS_STRENGTH_STEP = 4;

/**
 * As cartas de Casa NÃO entram na luta das faixas (31/out): elas já somam na batalha do tabuleiro.
 * Assim a luta das faixas depende só das tropas, do lugar, das funções e da ordem de batalha.
 */
export const CARDS_IN_TACTICAL = false;

/**
 * ORDEM DE BATALHA (tática do comandante), escolhida escondida junto com o posicionamento.
 * Quem ataca escolhe uma das 3 de ATAQUE; quem defende, uma das 3 de DEFESA.
 * Inspirada nas táticas de Crusader Kings II (dependem das tropas e têm contra-táticas), nas formações
 * de Total War (parede de escudos para flechas, muro de lanças para cavalo, flanco fraco) e nas cartas
 * de batalha de Hannibal: Rome vs Carthage.
 *  Ataque:
 *  - Carga (cavalaria, +8% cada): vence a Reserva; perde para o Muro de lanças.
 *  - Cercar (lanceiros/batedores, tropas em 2+ faixas, +6% cada): vence a Parede; perde para a Reserva.
 *  - Chuva de flechas (arqueiros, +6% cada): vence o Muro de lanças; perde para a Parede.
 *  Defesa:
 *  - Parede de escudos (escudeiros, +6% cada): vence a Chuva de flechas; perde para Cercar.
 *  - Muro de lanças (lanceiros, +6% cada): vence a Carga; perde para a Chuva de flechas.
 *  - Reserva (cada esquadrão atrás, +5%): vence Cercar; perde para a Carga.
 * Bônus pelas tropas até +18%. Quem VENCE a tática do outro ganha +5% a mais (a do outro continua valendo; era +10%, pesava demais no chute).
 */
export type Tactic = "carga" | "cercar" | "flechas" | "parede" | "lancas" | "reserva";
export const ATTACK_TACTICS: Tactic[] = ["carga", "cercar", "flechas"];
export const DEFENSE_TACTICS: Tactic[] = ["parede", "lancas", "reserva"];
export const TACTIC_BEATS: Record<Tactic, Tactic> = { carga: "reserva", cercar: "parede", flechas: "lancas", parede: "flechas", lancas: "carga", reserva: "cercar" };
export const TACTIC_STEP: Record<Tactic, number> = { carga: 0.08, cercar: 0.06, flechas: 0.06, parede: 0.06, lancas: 0.06, reserva: 0.05 };
export const TACTIC_MAX: number = (globalThis as { __TACMAX__?: number }).__TACMAX__ ?? 0.18;
/** bônus a mais para quem vence a tática do outro */
export const TACTIC_WIN_BONUS: number = (globalThis as { __TACWIN__?: number }).__TACWIN__ ?? 0.05;
export const TACTIC_NAMES: Record<Tactic, string> = { carga: "Carga", cercar: "Cercar", flechas: "Chuva de flechas", parede: "Parede de escudos", lancas: "Muro de lanças", reserva: "Reserva" };
