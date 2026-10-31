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
  CARD_STRENGTH_FACTOR,
  CARD_SWORD_FACTOR,
  CARD_TOWER_FACTOR,
  FIELD_LANES,
  FieldType,
  FLANK_BONUS,
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
}

export interface TacticalBattleInput {
  field: FieldType;
  attacker: TacticalSideInput;
  defender: TacticalSideInput;
}

/** Um motivo que pesou numa faixa (vira frase no resumo depois da animação). */
export interface LaneFactor {
  side: Side;
  kind: "counter" | "weak" | "terrain" | "wall-breach" | "wall" | "flank" | "far-flank" | "card" | "screen" | "empty";
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
}

/** Força da peça nesta batalha, como no jogo original. */
export function boardStrength(s: Squad, side: Side, field: FieldType): number {
  if (s.wounded) return 0;
  if (s.kind == "siege-engine") {
    // só vale quando ataca (ou apoia o ataque a) castelo/fortaleza
    return side == "attacker" && (field == "castelo" || field == "fortaleza") ? SIEGE_STRENGTH_VS_CASTLE : 0;
  }
  return s.strength ?? BOARD_STRENGTH[s.kind];
}

export function squadValue(s: Squad): number {
  if (s.value != null) return s.value;
  const strength = s.strength ?? BOARD_STRENGTH[s.kind];
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

  if (breached) factors.push({ side, kind: "wall-breach", terrain });
  if (rules.wall && side == "defender" && !enemyBreached && rules.defender) factors.push({ side, kind: "wall", terrain });
  if (screened && mine.some((s) => s.role == "cavalaria" || s.role == "batedores")) factors.push({ side: other(side), kind: "screen" });

  return total * card;
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
  const atkCard = cardFactor(input.attacker.card, input.defender.card, input.attacker.orderBonus ?? 0);
  const defCard = cardFactor(input.defender.card, input.attacker.card, input.defender.orderBonus ?? 0);
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

  let winner: Side | null = null;
  let bonus = 0;
  if (lanesWon.attacker > lanesWon.defender) winner = "attacker";
  else if (lanesWon.defender > lanesWon.attacker) winner = "defender";
  if (winner) {
    bonus = fights >= 2 && lanesWon[winner] == fights ? BONUS_ALL_LANES : BONUS_MAJORITY;
  } else if (fights > 0) {
    // mesmo número de faixas: desempata pela soma de todas as faixas com luta (+1)
    const sum = (side: Side): number =>
      lanes.reduce((a, l) => a + (l.winner != null ? (side == "attacker" ? l.attackerScore : l.defenderScore) : 0), 0);
    const tb = compare(sum("attacker"), sum("defender"));
    if (tb == "attacker" || tb == "defender") {
      winner = tb;
      bonus = BONUS_MAJORITY;
    }
  }

  return { lanes, lanesWon, winner, bonus };
}
