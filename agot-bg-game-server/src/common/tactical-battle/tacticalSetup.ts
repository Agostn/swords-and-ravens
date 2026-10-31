/**
 * Mesa de Batalha no jogo completo: das peças do tabuleiro aos esquadrões da Mesa.
 *
 * Uma peça vira vários esquadrões (soldado 2, cavaleiro 2 a cavalo ou 4 a pé, máquina de cerco 2,
 * navio/dragão/guarnição 1). Quem joga manda onde cada esquadrão fica e qual a função dele; o servidor
 * confere tudo aqui (nada de peça inventada, função proibida, casinha cheia ou faixa fechada) e põe no
 * campo quem ficou na reserva, do mesmo jeito que a Mesa faz quando o tempo acaba.
 */
import { Lane, Squad } from "./tacticalBattle";
import { FIELD_LANES, FieldType, Row, Role, SQUAD_MAX, SquadKind, rolesFor, slotMaxFor, Tactic, ATTACK_TACTICS, DEFENSE_TACTICS } from "./tacticalBattleData";

/** Uma peça do tabuleiro que luta (força > 0). */
export interface TacticalPiece {
  /** id da unidade no tabuleiro (ou "garrison") */
  piece: string;
  kind: SquadKind;
  /** força da peça nesta batalha (com os efeitos das cartas) */
  strength: number;
}

/** Como quem joga mandou um esquadrão (o cliente manda a lista; o servidor dá os ids). */
export interface PlacedSquad {
  piece: string;
  kind: SquadKind;
  role: Role;
  lane: Lane | null;
  row: Row;
}

const ROWS: Row[] = ["frente", "tras"];
/** onde vai quem ficou na reserva: centro primeiro, depois os lados */
const FILL_ORDER: [Lane, Row][] = [
  [1, "frente"],
  [1, "tras"],
  [0, "frente"],
  [2, "frente"],
  [0, "tras"],
  [2, "tras"]
];

/** Quantos esquadrões e de que tipo a peça pode virar. */
export function allowedExpansions(p: TacticalPiece): { kind: SquadKind; count: number }[] {
  switch (p.kind) {
    case "footman":
      return [{ kind: "footman", count: 2 }];
    case "knight":
      // a cavalo (2 de cavalaria) ou a pé (4 soldados)
      return [
        { kind: "knight", count: 2 },
        { kind: "footman", count: 4 }
      ];
    case "siege-engine":
      return [{ kind: "siege-engine", count: 2 }];
    default:
      return [{ kind: p.kind, count: 1 }];
  }
}

/** Esquadrões padrão de uma peça (primeira forma, funções alternadas), ainda sem lugar. */
export function defaultSquadsFor(p: TacticalPiece, sea: boolean): PlacedSquad[] {
  const { kind, count } = allowedExpansions(p)[0];
  const roles = rolesFor(kind, sea);
  if (p.kind == "garrison") return [{ piece: p.piece, kind, role: "torre", lane: 1, row: "tras" }];
  return Array.from({ length: count }, (_, k) => ({
    piece: p.piece,
    kind,
    role: roles[k % roles.length],
    lane: null,
    row: kind == "siege-engine" ? "tras" : "frente"
  }));
}

export function isBlockedLane(field: FieldType, lane: number): boolean {
  return FIELD_LANES[field][lane] == "bloqueado";
}

function isLane(x: unknown): x is Lane {
  return x === 0 || x === 1 || x === 2;
}

/**
 * Confere o que o jogador mandou e devolve os esquadrões prontos (todos com lugar), ou o motivo de
 * recusar. Peças que não vieram entram do jeito padrão; esquadrões sem lugar vão para o centro.
 */
export function buildSquads(
  pieces: TacticalPiece[],
  placed: PlacedSquad[] | null,
  field: FieldType,
  side: "attacker" | "defender"
): { squads: Squad[] } | { error: string } {
  const sea = field == "mar";
  const slotMax = slotMaxFor(field);
  const byPiece = new Map<string, PlacedSquad[]>();
  for (const q of placed ?? []) {
    if (!q || typeof q.piece != "string") return { error: "esquadrão sem peça" };
    const list = byPiece.get(q.piece) ?? [];
    list.push(q);
    byPiece.set(q.piece, list);
  }
  for (const key of byPiece.keys()) {
    if (!pieces.some((p) => p.piece == key)) return { error: `peça ${key} não está nesta batalha` };
  }

  const chosen: { p: TacticalPiece; list: PlacedSquad[] }[] = [];
  for (const p of pieces) {
    const got = byPiece.get(p.piece);
    if (!got || got.length == 0) {
      chosen.push({ p, list: defaultSquadsFor(p, sea) });
      continue;
    }
    const exp = allowedExpansions(p).find((e) => e.count == got.length && got.every((q) => q.kind == e.kind));
    if (!exp) return { error: `forma inválida para a peça ${p.piece}` };
    for (const q of got) {
      if (!rolesFor(q.kind, sea).includes(q.role)) return { error: `função ${q.role} não serve para ${q.kind}` };
      if (!ROWS.includes(q.row)) return { error: "linha inválida" };
      if (q.lane != null && !isLane(q.lane)) return { error: "faixa inválida" };
      if (q.lane != null && isBlockedLane(field, q.lane)) return { error: "faixa fechada" };
    }
    if (p.kind == "garrison") {
      // a guarnição não sai do lugar: torre no centro, atrás
      chosen.push({ p, list: defaultSquadsFor(p, sea) });
      continue;
    }
    chosen.push({ p, list: got.map((q) => ({ piece: p.piece, kind: q.kind, role: q.role, lane: q.lane, row: q.row })) });
  }

  const total = chosen.reduce((a, c) => a + c.list.length, 0);
  if (total > SQUAD_MAX) return { error: `mais de ${SQUAD_MAX} esquadrões` };

  // casinhas cheias?
  const count = (lane: Lane, row: Row): number => chosen.reduce((a, c) => a + c.list.filter((q) => q.lane == lane && q.row == row).length, 0);
  for (const lane of [0, 1, 2] as Lane[]) for (const row of ROWS) if (count(lane, row) > slotMax) return { error: "casinha cheia" };

  // reserva → centro (ou a casinha livre mais perto)
  for (const c of chosen)
    for (const q of c.list) {
      if (q.lane != null) continue;
      const spot = FILL_ORDER.find(([l, r]) => !isBlockedLane(field, l) && count(l, r) < slotMax) ?? FILL_ORDER[0];
      q.lane = spot[0];
      q.row = spot[1];
    }

  const squads: Squad[] = [];
  for (const c of chosen) {
    const share = 1 / c.list.length;
    c.list.forEach((q, k) =>
      squads.push({
        id: c.p.kind == "garrison" ? "garrison" : `${c.p.piece}-${k}`,
        piece: c.p.piece,
        kind: q.kind,
        role: q.role,
        lane: q.lane as Lane,
        row: q.row,
        strength: c.p.strength,
        share: c.p.kind == "garrison" ? 1 : share
      })
    );
  }
  void side;
  return { squads };
}

/** Casinhas sem passar do limite (para a reação do Corvo). */
export function slotsOk(squads: Squad[], field: FieldType): boolean {
  const slotMax = slotMaxFor(field);
  for (const lane of [0, 1, 2] as Lane[])
    for (const row of ROWS) if (squads.filter((s) => s.lane == lane && s.row == row).length > slotMax) return false;
  return squads.every((s) => !isBlockedLane(field, s.lane));
}

export function isValidTactic(t: unknown, side: "attacker" | "defender"): t is Tactic {
  return typeof t == "string" && (side == "attacker" ? ATTACK_TACTICS : DEFENSE_TACTICS).includes(t as Tactic);
}
