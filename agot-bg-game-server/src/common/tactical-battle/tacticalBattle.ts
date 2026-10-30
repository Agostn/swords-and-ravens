/**
 * Combate tático (mini-mapa de batalha): a conta.
 *
 * Função pura e determinística: a mesma batalha dá sempre o mesmo resultado.
 * É usada pelo servidor (que decide), pelo navegador (que só mostra a animação
 * do resultado) e pelo simulador de equilíbrio (tools/tactical).
 */
import {
  ADVANTAGE,
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
  SIEGE_VS_WALL,
  SquadKind,
  SUPPORT_FACTOR,
  Terrain,
  TERRAIN,
  UNOPPOSED_FLANK_SHARE
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
  /** força da peça quando ela varia (dragão, guarnição); senão 1 */
  strength?: number;
  /** veio de apoio de uma área vizinha */
  support?: boolean;
}

export interface CardInfo {
  strength: number;
  swords: number;
  towers: number;
}

export interface TacticalSideInput {
  squads: Squad[];
  card?: CardInfo | null;
}

export interface TacticalBattleInput {
  field: FieldType;
  attacker: TacticalSideInput;
  defender: TacticalSideInput;
}

/** Um motivo que pesou numa faixa (vira frase no resumo depois da animação). */
export interface LaneFactor {
  side: Side;
  kind: "counter" | "weak" | "terrain" | "wall-breach" | "wall" | "flank" | "card" | "screen" | "empty";
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
}

export function squadValue(s: Squad): number {
  const strength = s.strength ?? 1;
  return BASE_VALUE[s.kind] * strength * (s.support ? SUPPORT_FACTOR : 1);
}

export function isValidRole(kind: SquadKind, role: Role): boolean {
  return ROLES_BY_KIND[kind].includes(role);
}

function other(side: Side): Side {
  return side == "attacker" ? "defender" : "attacker";
}

function cardFactor(card: CardInfo | null | undefined, enemyCard: CardInfo | null | undefined): number {
  let f = 1;
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
      let a = ADVANTAGE[s.role][t.role] ?? 1;
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
    if (breached && s.role == "catapulta") f *= SIEGE_VS_WALL;
    total += squadValue(s) * f;

    if (adv >= 1.3) factors.push({ side, kind: "counter", role: s.role, vs: dominantEnemy(theirs) });
    else if (adv <= 0.8) factors.push({ side, kind: "weak", role: s.role, vs: dominantEnemy(theirs) });
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
  const terrains = FIELD_LANES[input.field];
  const atkCard = cardFactor(input.attacker.card, input.defender.card);
  const defCard = cardFactor(input.defender.card, input.attacker.card);
  const squadsIn = (side: Side, lane: Lane): Squad[] => input[side].squads.filter((s) => s.lane == lane);
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
      const targets = NEIGHBOURS[lane].filter((n) => contested(n));
      targets.forEach((n) => {
        const t = lanes[n];
        const dmg =
          laneDamage(side, mine, squadsIn(other(side), n), t.terrain, cardOf(side), []) *
          (UNOPPOSED_FLANK_SHARE / targets.length);
        if (side == "attacker") t.attackerScore += dmg;
        else t.defenderScore += dmg;
        t.factors.push({ side, kind: "flank" });
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
