/**
 * Combate tático (mini-mapa de batalha): a conta.
 *
 * Função pura e determinística: a mesma batalha dá sempre o mesmo resultado.
 * É usada pelo servidor (que decide), pelo navegador (que só mostra a animação
 * do resultado) e pelo simulador de equilíbrio (tools/tactical).
 */
import {
  advantage,
  COUNTER_SCALE,
  BASE_VALUE,
  BONUS_ALL_LANES,
  BONUS_MAJORITY,
  BONUS_STRENGTH_STEP,
  CARDS_IN_TACTICAL,
  CARD_STRENGTH_FACTOR,
  CARD_SWORD_FACTOR,
  CARD_TOWER_FACTOR,
  FIELD_LANES,
  FieldType,
  FLANK_BONUS,
  FORMATION_BONUS,
  LANE_TIE_MARGIN,
  Role,
  ROLES_BY_KIND,
  ROW_FACTOR,
  Row,
  SCREEN_RATIO,
  SIEGE_OPEN_FACTOR,
  SIEGE_STRENGTH_VS_CASTLE,
  BOARD_STRENGTH,
  ORDER_FACTOR,
  SquadKind,
  SUPPORT_FACTOR,
  Terrain,
  TERRAIN,
  UNOPPOSED_FLANK_SHARE,
  FAR_FLANK_SHARE,
  NO_CONTACT_RULE,
  Tactic,
  TACTIC_BEATS,
  TACTIC_MAX,
  TACTIC_STEP,
  TACTIC_WIN_BONUS,
  SIZE_EQUALIZE
} from "./tacticalBattleData";

export type Side = "attacker" | "defender";
export type Lane = 0 | 1 | 2;

export interface Squad {
  /** id da peça no tabuleiro (ou "garrison") */
  id: string;
  kind: SquadKind;
  role: Role;
  lane: Lane;
  row: Row;
  /** força da peça quando ela varia (dragão, guarnição); senão a do jogo original */
  strength?: number;
  /**
   * Parte da peça que este esquadrão representa (31/out: uma peça do tabuleiro vira vários esquadrões na Mesa:
   * soldado = 2 esquadrões, cavaleiro = 2 de cavalaria ou 4 a pé, máquina de cerco = 2). Padrão 1.
   */
  share?: number;
  /** peça do tabuleiro de onde o esquadrão saiu (para as baixas: a peça morre inteira) */
  piece?: string;
  /** veio de apoio de uma área vizinha */
  support?: boolean;
  /** bônus da ordem de Apoio de quem mandou este esquadrão (+0/+1) */
  supportOrderBonus?: number;
  /** peça ferida (recuou numa batalha): no jogo original vale 0 e não entra */
  wounded?: boolean;
  /** calculado pela conta: valor do esquadrão nesta batalha */
  value?: number;
}

export interface CardInfo {
  strength: number;
  swords: number;
  towers: number;
}

export interface TacticalSideInput {
  squads: Squad[];
  card?: CardInfo | null;
  /** ordem da área: Marcha −1/0/+1 (atacante) ou Defesa +1/+2 (defensor) */
  orderBonus?: number;
  /** ordem de batalha (tática) escolhida; sem ela, nenhuma */
  tactic?: Tactic | null;
}

export interface TacticInfo {
  tactic: Tactic | null;
  /** bônus que a tática daria com essas tropas (0 se não pode usar) */
  bonus: number;
  /** a tática do outro venceu a sua (a sua continua valendo; ele ganha +10%) */
  countered: boolean;
  /** a sua venceu a do outro: +10% a mais */
  beats: boolean;
}

/** Quanto a tática rende com estas tropas (0 = não dá para usar). */
export function tacticBonus(t: Tactic | null | undefined, squads: Squad[]): number {
  if (!t) return 0;
  // conta por PEÇA (um soldado dividido em 2 esquadrões ainda conta 1), para o bônus não dobrar
  const n = (r: Role): number => squads.filter((s) => s.role == r).reduce((a, s) => a + (s.share ?? 1), 0);
  const lanes = new Set(squads.filter((s) => s.kind != "garrison").map((s) => s.lane)).size;
  const back = squads.filter((s) => s.row == "tras" && s.kind != "garrison").reduce((a, s) => a + (s.share ?? 1), 0);
  const count =
    t == "carga" ? n("cavalaria") : t == "cercar" ? (lanes >= 2 ? n("lanceiro") + n("batedores") : 0) : t == "flechas" ? n("arqueiro") + n("flechas") : t == "parede" ? n("escudeiro") : t == "lancas" ? n("lanceiro") : back;
  return Math.min(TACTIC_MAX, count * TACTIC_STEP[t]);
}

export interface TacticalBattleInput {
  field: FieldType;
  attacker: TacticalSideInput;
  defender: TacticalSideInput;
  /**
   * Quem tem a Lâmina de Aço Valiriano (o mais alto na trilha dos Feudos, que no jogo original
   * desempata as batalhas). Se o mini-mapa empatar, os campeões duelam e ele vence: +1.
   */
  bladeHolder?: Side;
}

/** Um motivo que pesou numa faixa (vira frase no resumo depois da animação). */
export interface LaneFactor {
  side: Side;
  kind: "counter" | "weak" | "terrain" | "wall-breach" | "wall" | "flank" | "far-flank" | "card" | "screen" | "empty" | "formation";
  role?: Role;
  vs?: Role;
  terrain?: Terrain;
}

export interface LaneResult {
  terrain: Terrain;
  blocked: boolean;
  attackerScore: number;
  defenderScore: number;
  /** null: faixa bloqueada ou ninguém lutou nela */
  winner: Side | "tie" | null;
  factors: LaneFactor[];
}

export interface TacticalBattleResult {
  lanes: LaneResult[];
  lanesWon: Record<Side, number>;
  winner: Side | null;
  /** bônus que o vencedor soma na batalha do tabuleiro (0, 1 ou 2) */
  bonus: number;
  /**
   * Os dois lados se esquivaram (nenhuma faixa com os dois): o ataque não pode
   * passar sem luta, então os exércitos se encontram no centro (cada um mantém
   * a linha e a função) e a conta é feita de novo lá.
   */
  metInCenter?: boolean;
  /** empatou e foi decidido no duelo de campeões (vence quem tem a Lâmina de Aço Valiriano) */
  duel?: boolean;
  /** ordem de batalha de cada lado */
  tactics?: Record<Side, TacticInfo>;
}

/** Força da peça nesta batalha, como no jogo original. */
export function boardStrength(s: Squad, side: Side, field: FieldType): number {
  if (s.wounded) return 0;
  if (s.kind == "siege-engine") {
    // só vale quando ataca (ou apoia o ataque a) castelo/fortaleza
    return side == "attacker" && (field == "castelo" || field == "fortaleza") ? SIEGE_STRENGTH_VS_CASTLE * (s.share ?? 1) : 0;
  }
  return (s.strength ?? BOARD_STRENGTH[s.kind]) * (s.share ?? 1);
}

export function squadValue(s: Squad): number {
  if (s.value != null) return s.value;
  const strength = (s.strength ?? BOARD_STRENGTH[s.kind]) * (s.share ?? 1);
  return BASE_VALUE[s.kind] * strength * (s.support ? SUPPORT_FACTOR : 1);
}

/** Prepara os esquadrões: calcula o valor e tira quem vale 0 (não luta). */
function prepare(squads: Squad[], side: Side, field: FieldType): Squad[] {
  return squads
    .map((s) => ({
      ...s,
      value: BASE_VALUE[s.kind] * boardStrength(s, side, field) * (s.support ? SUPPORT_FACTOR : 1)
    }))
    .filter((s) => (s.value ?? 0) > 0);
}

export function isValidRole(kind: SquadKind, role: Role): boolean {
  return ROLES_BY_KIND[kind].includes(role);
}

function other(side: Side): Side {
  return side == "attacker" ? "defender" : "attacker";
}

function cardFactor(card: CardInfo | null | undefined, enemyCard: CardInfo | null | undefined, orderBonus = 0): number {
  let f = 1 + ORDER_FACTOR * orderBonus;
  if (!CARDS_IN_TACTICAL) return f;
  if (card) {
    f *= 1 + CARD_STRENGTH_FACTOR * card.strength + CARD_SWORD_FACTOR * card.swords;
  }
  if (enemyCard) {
    f *= 1 - CARD_TOWER_FACTOR * enemyCard.towers;
  }
  return f;
}

/**
 * O que um lado causa numa faixa, sem flanco.
 * Cada esquadrão rende: valor × vantagem média contra o inimigo da faixa
 * (ponderada pelo valor de cada inimigo) × linha × terreno × carta.
 */
function laneDamage(
  side: Side,
  mine: Squad[],
  theirs: Squad[],
  terrain: Terrain,
  card: number,
  factors: LaneFactor[]
): number {
  const rules = TERRAIN[terrain];
  const theirTotal = theirs.reduce((a, s) => a + squadValue(s), 0);
  if (mine.length == 0) return 0;
  if (theirTotal == 0) {
    return mine.reduce((a, s) => a + squadValue(s), 0);
  }

  // A frente inimiga protege a linha de trás contra a cavalaria?
  const theirFront = theirs.filter((s) => s.row == "frente").reduce((a, s) => a + squadValue(s), 0);
  const theirBack = theirs.filter((s) => s.row == "tras").reduce((a, s) => a + squadValue(s), 0);
  const screened = theirBack > 0 && theirFront >= SCREEN_RATIO * theirBack;

  // Muralha derrubada? (catapulta do atacante na faixa)
  const breached =
    rules.wall && side == "attacker" && mine.some((s) => s.role == "catapulta");
  const enemyBreached =
    rules.wall && side == "defender" && theirs.some((s) => s.role == "catapulta");

  let total = 0;
  for (const s of mine) {
    let adv = 0;
    for (const t of theirs) {
      let a = advantage(s.role, t.role);
      if (screened && t.row == "tras" && a > 1 && (s.role == "cavalaria" || s.role == "batedores")) {
        a = 1;
      }
      adv += a * squadValue(t);
    }
    adv /= theirTotal;

    let f = adv * ROW_FACTOR[s.role][s.row];
    f *= rules.role?.[s.role] ?? 1;
    if (side == "attacker") f *= rules.attacker ?? 1;
    if (side == "defender") f *= rules.defender != null && !enemyBreached ? rules.defender : 1;
    if (s.role == "catapulta" && !rules.wall) f *= SIEGE_OPEN_FACTOR;
    if (s.supportOrderBonus) f *= 1 + ORDER_FACTOR * s.supportOrderBonus;
    total += squadValue(s) * f;

    if (adv >= 1 + 0.3 * COUNTER_SCALE) factors.push({ side, kind: "counter", role: s.role, vs: dominantEnemy(theirs) });
    else if (adv <= 1 - 0.2 * COUNTER_SCALE) factors.push({ side, kind: "weak", role: s.role, vs: dominantEnemy(theirs) });
  }

  // formação: corpo a corpo na frente + atirador atrás, na mesma faixa
  if (FORMATION_BONUS > 0 && hasFormation(mine)) {
    total *= 1 + FORMATION_BONUS;
    factors.push({ side, kind: "formation" });
  }

  if (breached) factors.push({ side, kind: "wall-breach", terrain });
  if (rules.wall && side == "defender" && !enemyBreached && rules.defender) factors.push({ side, kind: "wall", terrain });
  if (screened && mine.some((s) => s.role == "cavalaria" || s.role == "batedores")) factors.push({ side: other(side), kind: "screen" });

  return total * card;
}

const SHOOTERS: Role[] = ["arqueiro", "flechas", "catapulta"];
/** Tem corpo a corpo na frente e atirador atrás? */
export function hasFormation(squads: Squad[]): boolean {
  const MELEE: Role[] = ["lanceiro", "escudeiro", "cavalaria", "batedores", "abordagem", "ariete"];
  return squads.some((s) => s.row == "frente" && MELEE.includes(s.role)) && squads.some((s) => s.row == "tras" && SHOOTERS.includes(s.role));
}

function dominantEnemy(theirs: Squad[]): Role | undefined {
  const byRole = new Map<Role, number>();
  for (const t of theirs) byRole.set(t.role, (byRole.get(t.role) ?? 0) + squadValue(t));
  let best: Role | undefined;
  let bestV = -1;
  byRole.forEach((v, r) => {
    if (v > bestV) {
      bestV = v;
      best = r;
    }
  });
  return best;
}

function compare(a: number, d: number): Side | "tie" | null {
  if (a == 0 && d == 0) return null;
  const hi = Math.max(a, d);
  if (Math.abs(a - d) <= LANE_TIE_MARGIN * hi) return "tie";
  return a > d ? "attacker" : "defender";
}

const NEIGHBOURS: Record<Lane, Lane[]> = { 0: [1], 1: [0, 2], 2: [1] };

export function resolveTacticalBattle(input: TacticalBattleInput): TacticalBattleResult {
  const first = resolveOnce(input);
  const fought = first.lanes.some((l) => !l.blocked && l.winner != null);
  const hasA = prepare(input.attacker.squads, "attacker", input.field).length > 0;
  const hasD = prepare(input.defender.squads, "defender", input.field).length > 0;
  if (fought || !hasA || !hasD) return first;
  if (NO_CONTACT_RULE == "draw") return first;
  if (NO_CONTACT_RULE == "defender") return { ...first, winner: "defender", bonus: BONUS_MAJORITY };
  const toCenter = (side: TacticalSideInput): TacticalSideInput => ({
    ...side,
    squads: side.squads.map((s) => ({ ...s, lane: 1 as Lane }))
  });
  const again = resolveOnce({ ...input, attacker: toCenter(input.attacker), defender: toCenter(input.defender) });
  return { ...again, metInCenter: true };
}

function resolveOnce(input: TacticalBattleInput): TacticalBattleResult {
  const terrains = FIELD_LANES[input.field];
  // ordem de batalha: bônus pelas tropas; anulado se a do outro vence a sua
  const tacA = input.attacker.tactic ?? null;
  const tacD = input.defender.tactic ?? null;
  const tinfo = (mine: Tactic | null, theirs: Tactic | null, squads: Squad[]): TacticInfo => {
    const bonus = tacticBonus(mine, squads);
    const countered = !!mine && !!theirs && TACTIC_BEATS[theirs] == mine;
    const beats = !!mine && !!theirs && TACTIC_BEATS[mine] == theirs && bonus > 0;
    return { tactic: mine, bonus, countered, beats };
  };
  const tactics: Record<Side, TacticInfo> = {
    attacker: tinfo(tacA, tacD, input.attacker.squads),
    defender: tinfo(tacD, tacA, input.defender.squads)
  };
  // a tática vencida continua valendo (anular era forte demais); quem vence ganha um pouco a mais
  const tf = (side: Side): number => 1 + tactics[side].bonus + (tactics[side].beats ? TACTIC_WIN_BONUS : 0);
  const atkCard = cardFactor(input.attacker.card, input.defender.card, input.attacker.orderBonus ?? 0) * tf("attacker");
  const defCard = cardFactor(input.defender.card, input.attacker.card, input.defender.orderBonus ?? 0) * tf("defender");
  const prepared: Record<Side, Squad[]> = {
    attacker: prepare(input.attacker.squads, "attacker", input.field),
    defender: prepare(input.defender.squads, "defender", input.field)
  };
  // aproxima o tamanho dos dois exércitos (o tamanho já conta no tabuleiro)
  const total = (side: Side): number => prepared[side].reduce((a, s) => a + (s.value ?? 0), 0);
  const tA = total("attacker");
  const tD = total("defender");
  if (tA > 0 && tD > 0 && SIZE_EQUALIZE > 0) {
    const avg = (tA + tD) / 2;
    (["attacker", "defender"] as Side[]).forEach((side) => {
      const k = Math.pow(avg / (side == "attacker" ? tA : tD), SIZE_EQUALIZE);
      prepared[side] = prepared[side].map((s) => ({ ...s, value: (s.value ?? 0) * k }));
    });
  }
  const squadsIn = (side: Side, lane: Lane): Squad[] => prepared[side].filter((s) => s.lane == lane);
  const cardOf = (side: Side): number => (side == "attacker" ? atkCard : defCard);

  // 1ª passada: cada faixa sozinha. Só há luta onde os dois lados têm esquadrões.
  const lanes: LaneResult[] = ([0, 1, 2] as Lane[]).map((lane) => {
    const terrain = terrains[lane];
    const blocked = terrain == "bloqueado";
    const factors: LaneFactor[] = [];
    const atk = blocked ? [] : squadsIn("attacker", lane);
    const def = blocked ? [] : squadsIn("defender", lane);
    if (atk.length == 0 || def.length == 0) {
      if (atk.length > 0) factors.push({ side: "attacker", kind: "empty" });
      if (def.length > 0) factors.push({ side: "defender", kind: "empty" });
      return { terrain, blocked, attackerScore: 0, defenderScore: 0, winner: null, factors };
    }
    const a = laneDamage("attacker", atk, def, terrain, atkCard, factors);
    const d = laneDamage("defender", def, atk, terrain, defCard, factors);
    return { terrain, blocked, attackerScore: a, defenderScore: d, winner: compare(a, d), factors };
  });
  const contested = (lane: Lane): boolean => !lanes[lane].blocked && lanes[lane].winner != null;

  // Quem está sozinho numa faixa ataca pelo lado as faixas vizinhas com luta.
  ([0, 1, 2] as Lane[]).forEach((lane) => {
    if (lanes[lane].blocked || contested(lane)) return;
    for (const side of ["attacker", "defender"] as Side[]) {
      const mine = squadsIn(side, lane);
      if (mine.length == 0) continue;
      // ajuda a vizinha com luta; se não houver, a faixa da outra ponta (rende menos)
      let targets = NEIGHBOURS[lane].filter((n) => contested(n));
      let share = UNOPPOSED_FLANK_SHARE;
      let far = false;
      if (targets.length == 0) {
        targets = ([0, 1, 2] as Lane[]).filter((n) => Math.abs(n - lane) == 2 && contested(n));
        share = FAR_FLANK_SHARE;
        far = true;
      }
      targets.forEach((n) => {
        const t = lanes[n];
        const dmg = laneDamage(side, mine, squadsIn(other(side), n), t.terrain, cardOf(side), []) * (share / targets.length);
        if (side == "attacker") t.attackerScore += dmg;
        else t.defenderScore += dmg;
        t.factors.push({ side, kind: far ? "far-flank" : "flank" });
      });
    }
  });
  ([0, 1, 2] as Lane[]).forEach((lane) => {
    if (contested(lane)) lanes[lane].winner = compare(lanes[lane].attackerScore, lanes[lane].defenderScore);
  });

  // 2ª passada: quem venceu uma faixa ajuda as vizinhas (uma vez só, sem efeito em cadeia).
  const first = lanes.map((l) => l.winner);
  ([0, 1, 2] as Lane[]).forEach((lane) => {
    if (!contested(lane)) return;
    const l = lanes[lane];
    for (const side of ["attacker", "defender"] as Side[]) {
      const flanks = NEIGHBOURS[lane].filter((n) => first[n] == side).length;
      if (flanks > 0) {
        const mult = 1 + FLANK_BONUS * flanks;
        if (side == "attacker") l.attackerScore *= mult;
        else l.defenderScore *= mult;
        l.factors.push({ side, kind: "flank" });
      }
    }
    l.winner = compare(l.attackerScore, l.defenderScore);
  });

  const lanesWon: Record<Side, number> = { attacker: 0, defender: 0 };
  lanes.forEach((l) => {
    if (l.winner == "attacker" || l.winner == "defender") lanesWon[l.winner]++;
  });
  const fights = ([0, 1, 2] as Lane[]).filter(contested).length;
  // bônus cresce com o tamanho da batalha (força do menor exército no tabuleiro)
  const boardTotal = (side: Side): number => prepared[side].reduce((a, q) => a + boardStrength(q, side, input.field), 0);
  const base = BONUS_MAJORITY + Math.floor(Math.min(boardTotal("attacker"), boardTotal("defender")) / BONUS_STRENGTH_STEP);
  const allLanes = base + (BONUS_ALL_LANES - BONUS_MAJORITY);

  let winner: Side | null = null;
  let bonus = 0;
  if (lanesWon.attacker > lanesWon.defender) winner = "attacker";
  else if (lanesWon.defender > lanesWon.attacker) winner = "defender";
  if (winner) {
    bonus = fights >= 2 && lanesWon[winner] == fights ? allLanes : base;
  } else if (fights > 0) {
    // mesmo número de faixas: desempata pela soma de todas as faixas com luta (+1)
    const sum = (side: Side): number =>
      lanes.reduce((a, l) => a + (l.winner != null ? (side == "attacker" ? l.attackerScore : l.defenderScore) : 0), 0);
    const tb = compare(sum("attacker"), sum("defender"));
    if (tb == "attacker" || tb == "defender") {
      winner = tb;
      bonus = base;
    }
  }
  // empate de verdade: duelo de campeões; vence quem tem a Lâmina de Aço Valiriano (+1)
  if (!winner && fights > 0 && input.bladeHolder) {
    return { lanes, lanesWon, winner: input.bladeHolder, bonus: base, duel: true, tactics };
  }

  return { lanes, lanesWon, winner, bonus, tactics };
}
