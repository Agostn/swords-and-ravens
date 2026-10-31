/**
 * Combate tático: procura o jogo ótimo dos dois lados (equilíbrio de Nash aproximado,
 * "double oracle" + "regret matching+"). Usado pelo simulador de equilíbrio
 * (equilibrio.ts) e pelo computador do protótipo.
 */
import { resolveTacticalBattle, Squad, Lane, CardInfo, TacticalBattleResult } from "../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import {
  FIELD_LANES,
  FieldType,
  slotMaxFor,
  rolesFor,
  Role,
  Row,
  SquadKind
} from "../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";

export type Option = { lane: Lane; row: Row; role: Role };
export type Strategy = Squad[];

export interface Piece {
  kind: SquadKind;
  strength?: number;
  /** parte da peça do tabuleiro (31/out: uma peça vira 2 ou 4 esquadrões) */
  share?: number;
  piece?: string;
  support?: boolean;
  fixed?: Option; // guarnição: posição fixa
}

export function optionsFor(p: Piece, field: FieldType): Option[] {
  if (p.fixed) return [p.fixed];
  const lanes = ([0, 1, 2] as Lane[]).filter((l) => FIELD_LANES[field][l] != "bloqueado");
  const out: Option[] = [];
  for (const lane of lanes) for (const row of ["frente", "tras"] as Row[]) for (const role of rolesFor(p.kind, field == "mar")) out.push({ lane, row, role });
  return out;
}

/** Todas as jogadas de um lado (peças iguais são intercambiáveis: combinações com repetição). */
/** Quantas jogadas teria a lista completa (para não montar uma lista gigante). */
export function countStrategies(pieces: Piece[], field: FieldType): number {
  const groups = new Map<string, Piece[]>();
  pieces.forEach((p) => {
    const k = `${p.kind}|${p.strength ?? 1}|${p.support ? 1 : 0}|${p.fixed ? 1 : 0}|${p.share ?? 1}`;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  });
  let total = 1;
  groups.forEach((ps) => {
    const n = optionsFor(ps[0], field).length;
    let c = 1;
    for (let i = 0; i < ps.length; i++) c = (c * (n + i)) / (i + 1);
    total *= c;
  });
  return total;
}

/** Jogadas sorteadas (quando a lista completa é grande demais), respeitando o limite por casinha. */
export function sampleStrategies(pieces: Piece[], field: FieldType, n: number, rand: () => number): Strategy[] {
  const cap = slotMaxFor(field);
  const out: Strategy[] = [];
  for (let k = 0; k < n * 3 && out.length < n; k++) {
    const cnt = new Map<string, number>();
    // às vezes concentra numa faixa ou duas (jogadas "de verdade" costumam juntar a força)
    const focus = rand() < 0.5 ? (([0, 1, 2] as Lane[]).filter(() => rand() < 0.6) as Lane[]) : [];
    const st: Strategy = [];
    let ok = true;
    pieces.forEach((p, i) => {
      if (!ok) return;
      let opts = optionsFor(p, field).filter((o) => (cnt.get(o.lane + o.row) ?? 0) < cap);
      const f = opts.filter((o) => focus.includes(o.lane));
      if (f.length && rand() < 0.8) opts = f;
      if (!opts.length) {
        ok = false;
        return;
      }
      const o = opts[Math.floor(rand() * opts.length)];
      cnt.set(o.lane + o.row, (cnt.get(o.lane + o.row) ?? 0) + 1);
      st.push({ id: `${p.kind}-${i}`, kind: p.kind, strength: p.strength, share: p.share, support: p.support, ...o });
    });
    if (ok) out.push(st);
  }
  return out;
}

/** Lista completa se for pequena; senão, sorteada. */
export function strategiesFor(pieces: Piece[], field: FieldType, n: number, rand: () => number): Strategy[] {
  // sorteio: menos jogadas (cada uma tem mais esquadrões e custa mais para testar)
  return countStrategies(pieces, field) <= 20000 ? enumerate(pieces, field) : sampleStrategies(pieces, field, Math.min(n, 450), rand);
}

export function enumerate(pieces: Piece[], field: FieldType): Strategy[] {
  const cap = slotMaxFor(field);
  // agrupa peças idênticas
  const groups = new Map<string, Piece[]>();
  pieces.forEach((p) => {
    const k = `${p.kind}|${p.strength ?? 1}|${p.support ? 1 : 0}|${p.fixed ? 1 : 0}|${p.share ?? 1}`;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  });
  let partial: Strategy[] = [[]];
  let idc = 0;
  groups.forEach((ps) => {
    const opts = optionsFor(ps[0], field);
    const combos: number[][] = [];
    const rec = (start: number, acc: number[]) => {
      if (acc.length == ps.length) {
        combos.push([...acc]);
        return;
      }
      for (let i = start; i < opts.length; i++) {
        acc.push(i);
        rec(i, acc);
        acc.pop();
      }
    };
    rec(0, []);
    const next: Strategy[] = [];
    for (const base of partial) {
      for (const c of combos) {
        next.push([
          ...base,
          ...c.map((oi, j) => ({
            id: `${ps[j].kind}-${idc + j}`,
            kind: ps[j].kind,
            strength: ps[j].strength,
            share: ps[j].share,
            support: ps[j].support,
            ...opts[oi]
          }))
        ]);
      }
    }
    idc += ps.length;
    // no máximo SLOT_MAX peças por casinha
    partial = next.filter((st) => {
      const cnt = new Map<string, number>();
      for (const q of st) {
        const k = q.lane + q.row;
        const c = (cnt.get(k) ?? 0) + 1;
        if (c > cap) return false;
        cnt.set(k, c);
      }
      return true;
    });
  });
  return partial;
}

let ORDERS: [number, number] = [0, 0];
export function setOrders(a: number, d: number): void {
  ORDERS = [a, d];
}
export function payoff(field: FieldType, a: Strategy, d: Strategy, ac: CardInfo | null, dc: CardInfo | null): number {
  const r = resolveTacticalBattle({
    field,
    attacker: { squads: a, card: ac, orderBonus: ORDERS[0] },
    defender: { squads: d, card: dc, orderBonus: ORDERS[1] }
  });
  if (!r.winner) return 0;
  return r.winner == "attacker" ? r.bonus : -r.bonus;
}

/** Resolve um jogo de soma zero pequeno (matriz) com "regret matching+". */
export function solveMatrix(M: number[][], iters = 4000): { x: number[]; y: number[]; v: number } {
  const n = M.length;
  const m = M[0].length;
  const rx = new Array(n).fill(0);
  const ry = new Array(m).fill(0);
  const sx = new Array(n).fill(0);
  const sy = new Array(m).fill(0);
  const norm = (r: number[]) => {
    const s = r.reduce((a, b) => a + Math.max(0, b), 0);
    return s > 0 ? r.map((v) => Math.max(0, v) / s) : r.map(() => 1 / r.length);
  };
  for (let t = 1; t <= iters; t++) {
    const x = norm(rx);
    const y = norm(ry);
    const ux = M.map((row) => row.reduce((a, v, j) => a + v * y[j], 0));
    const uy = new Array(m).fill(0).map((_, j) => -M.reduce((a, row, i) => a + row[j] * x[i], 0));
    const vx = ux.reduce((a, v, i) => a + v * x[i], 0);
    const vy = uy.reduce((a, v, j) => a + v * y[j], 0);
    for (let i = 0; i < n; i++) rx[i] = Math.max(0, rx[i] + ux[i] - vx);
    for (let j = 0; j < m; j++) ry[j] = Math.max(0, ry[j] + uy[j] - vy);
    for (let i = 0; i < n; i++) sx[i] += t * x[i];
    for (let j = 0; j < m; j++) sy[j] += t * y[j];
  }
  const tx = sx.reduce((a, b) => a + b, 0);
  const ty = sy.reduce((a, b) => a + b, 0);
  const x = sx.map((v) => v / tx);
  const y = sy.map((v) => v / ty);
  const v = M.reduce((a, row, i) => a + x[i] * row.reduce((b, val, j) => b + val * y[j], 0), 0);
  return { x, y, v };
}

export interface Scenario {
  name: string;
  field: FieldType;
  attacker: Piece[];
  defender: Piece[];
  attackerCard?: CardInfo | null;
  defenderCard?: CardInfo | null;
  attackerOrder?: number;
  defenderOrder?: number;
}

export interface ScenarioResult {
  name: string;
  value: number;
  attackerWins: number;
  defenderWins: number;
  draws: number;
  roles: Record<string, number>;
  sizes: [number, number];
  /** jogando "no chute" (posição e função aleatórias dos dois lados) */
  random: { attacker: number; defender: number; draw: number };
}

/** Mistura de equilíbrio: as jogadas usadas por cada lado e com que frequência. */
export function solveScenarioMix(sc: Scenario): { A: Strategy[]; x: number[]; D: Strategy[]; y: number[]; v: number } {
  const r = doubleOracle(sc);
  return { A: r.SA.map((i) => r.A[i]), x: r.sol.x, D: r.SD.map((j) => r.D[j]), y: r.sol.y, v: r.sol.v };
}

function doubleOracle(sc: Scenario): { A: Strategy[]; D: Strategy[]; SA: number[]; SD: number[]; sol: { x: number[]; y: number[]; v: number } } {
  ORDERS = [sc.attackerOrder ?? 0, sc.defenderOrder ?? 0];
  const A = enumerate(sc.attacker, sc.field);
  const D = enumerate(sc.defender, sc.field);
  const ac = sc.attackerCard ?? null;
  const dc = sc.defenderCard ?? null;
  const SA: number[] = [0];
  const SD: number[] = [0];
  let sol = { x: [1], y: [1], v: payoff(sc.field, A[0], D[0], ac, dc) };
  for (let it = 0; it < 80; it++) {
    const M = SA.map((i) => SD.map((j) => payoff(sc.field, A[i], D[j], ac, dc)));
    sol = solveMatrix(M);
    // melhor resposta do atacante contra a mistura do defensor
    let bestA = -1;
    let bestAV = -Infinity;
    for (let i = 0; i < A.length; i++) {
      let u = 0;
      for (let j = 0; j < SD.length; j++) if (sol.y[j] > 1e-4) u += sol.y[j] * payoff(sc.field, A[i], D[SD[j]], ac, dc);
      if (u > bestAV) {
        bestAV = u;
        bestA = i;
      }
    }
    let bestD = -1;
    let bestDV = Infinity;
    for (let j = 0; j < D.length; j++) {
      let u = 0;
      for (let i = 0; i < SA.length; i++) if (sol.x[i] > 1e-4) u += sol.x[i] * payoff(sc.field, A[SA[i]], D[j], ac, dc);
      if (u < bestDV) {
        bestDV = u;
        bestD = j;
      }
    }
    let added = false;
    if (bestAV > sol.v + 0.02 && !SA.includes(bestA)) {
      SA.push(bestA);
      added = true;
    }
    if (bestDV < sol.v - 0.02 && !SD.includes(bestD)) {
      SD.push(bestD);
      added = true;
    }
    if (!added) break;
  }
  return { A, D, SA, SD, sol };
}

export function solveScenario(sc: Scenario): ScenarioResult {
  const { A, D, SA, SD, sol } = doubleOracle(sc);
  const ac = sc.attackerCard ?? null;
  const dc = sc.defenderCard ?? null;
  // estatísticas na mistura final
  let aw = 0;
  let dw = 0;
  let dr = 0;
  const roles: Record<string, number> = {};
  SA.forEach((i, ii) =>
    SD.forEach((j, jj) => {
      const p = sol.x[ii] * sol.y[jj];
      const u = payoff(sc.field, A[i], D[j], ac, dc);
      if (u > 0) aw += p;
      else if (u < 0) dw += p;
      else dr += p;
    })
  );
  const addRoles = (strat: Strategy, p: number) =>
    strat.forEach((s) => {
      if (s.kind == "footman" || s.kind == "ship" || s.kind == "knight") roles[s.role] = (roles[s.role] ?? 0) + p;
    });
  SA.forEach((i, ii) => addRoles(A[i], sol.x[ii]));
  SD.forEach((j, jj) => addRoles(D[j], sol.y[jj]));
  // jogo "no chute": mostra o quanto o mini-mapa decide quando ninguém joga perfeito
  let ra = 0;
  let rd = 0;
  let rr = 0;
  let seed = 12345;
  const rnd = (n: number) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % n;
  };
  const N = 3000;
  for (let k = 0; k < N; k++) {
    const u = payoff(sc.field, A[rnd(A.length)], D[rnd(D.length)], ac, dc);
    if (u > 0) ra++;
    else if (u < 0) rd++;
    else rr++;
  }
  return {
    name: sc.name,
    value: sol.v,
    attackerWins: aw,
    defenderWins: dw,
    draws: dr,
    roles,
    sizes: [A.length, D.length],
    random: { attacker: ra / N, defender: rd / N, draw: rr / N }
  };
}


/** Gerador de números pseudoaleatórios com semente (mesma semente → mesma sequência). */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function sample<T>(arr: T[], max: number, rand: () => number): T[] {
  if (arr.length <= max) return arr;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(arr[Math.floor(rand() * arr.length)]);
  return out;
}

/**
 * Jogada do computador: calcula a mistura de equilíbrio (sem olhar a jogada do outro lado,
 * que ainda está escondida) e sorteia uma jogada dela. Para exércitos grandes, usa uma
 * amostra das jogadas possíveis, para caber no tempo do navegador.
 */
export function computerStrategy(sc: Scenario, side: "attacker" | "defender", seed: number, maxStrategies = 1200): Strategy {
  const rand = rng(seed);
  ORDERS = [sc.attackerOrder ?? 0, sc.defenderOrder ?? 0];
  const A = sample(strategiesFor(sc.attacker, sc.field, maxStrategies, rand), maxStrategies, rand);
  const D = sample(strategiesFor(sc.defender, sc.field, maxStrategies, rand), maxStrategies, rand);
  const ac = sc.attackerCard ?? null;
  const dc = sc.defenderCard ?? null;
  const SA: number[] = [Math.floor(rand() * A.length)];
  const SD: number[] = [Math.floor(rand() * D.length)];
  let sol = { x: [1], y: [1], v: 0 };
  for (let it = 0; it < 20; it++) {
    const M = SA.map((i) => SD.map((j) => payoff(sc.field, A[i], D[j], ac, dc)));
    sol = solveMatrix(M, 600);
    let bestA = -1;
    let bestAV = -Infinity;
    for (let i = 0; i < A.length; i++) {
      let u = 0;
      for (let j = 0; j < SD.length; j++) if (sol.y[j] > 1e-3) u += sol.y[j] * payoff(sc.field, A[i], D[SD[j]], ac, dc);
      if (u > bestAV + 1e-9) {
        bestAV = u;
        bestA = i;
      }
    }
    let bestD = -1;
    let bestDV = Infinity;
    for (let j = 0; j < D.length; j++) {
      let u = 0;
      for (let i = 0; i < SA.length; i++) if (sol.x[i] > 1e-3) u += sol.x[i] * payoff(sc.field, A[SA[i]], D[j], ac, dc);
      if (u < bestDV - 1e-9) {
        bestDV = u;
        bestD = j;
      }
    }
    let added = false;
    if (bestAV > sol.v + 0.02 && !SA.includes(bestA)) {
      SA.push(bestA);
      added = true;
    }
    if (bestDV < sol.v - 0.02 && !SD.includes(bestD)) {
      SD.push(bestD);
      added = true;
    }
    if (!added) break;
  }
  const probs = side == "attacker" ? sol.x : sol.y;
  const set = side == "attacker" ? SA : SD;
  const pool = side == "attacker" ? A : D;
  let r = rand();
  for (let k = 0; k < set.length; k++) {
    r -= probs[k];
    if (r <= 0) return pool[set[k]];
  }
  return pool[set[set.length - 1]];
}


// ---------------------------------------------------------------- reação (depois da revelação)
/** Todas as reações de um lado: não mudar nada, ou mudar UM esquadrão (lugar e/ou função). */
export function reactionsOf(strat: Strategy, field: FieldType): Strategy[] {
  const out: Strategy[] = [strat];
  strat.forEach((s, i) => {
    if (s.kind == "garrison") return;
    for (const o of optionsFor({ kind: s.kind }, field)) {
      if (o.lane == s.lane && o.row == s.row && o.role == s.role) continue;
      if ((o.lane != s.lane || o.row != s.row) && strat.filter((q) => q.lane == o.lane && q.row == o.row).length >= slotMaxFor(field)) continue;
      const n = strat.slice();
      n[i] = { ...s, ...o };
      out.push(n);
    }
  });
  return out;
}

/** Nota da luta do ponto de vista do atacante: bônus (peso grande) + folga média nas faixas (desempate). */
function scoreOf(r: TacticalBattleResult): number {
  const b = !r.winner ? 0 : r.winner == "attacker" ? r.bonus : -r.bonus;
  let m = 0;
  r.lanes.forEach((l) => {
    if (l.winner != null && l.attackerScore + l.defenderScore > 0) m += (l.attackerScore - l.defenderScore) / (l.attackerScore + l.defenderScore);
  });
  return b * 10 + m;
}

function evalPair(sc: Scenario, a: Strategy, d: Strategy): number {
  return scoreOf(
    resolveTacticalBattle({
      field: sc.field,
      attacker: { squads: a, card: sc.attackerCard ?? null, orderBonus: sc.attackerOrder ?? 0 },
      defender: { squads: d, card: sc.defenderCard ?? null, orderBonus: sc.defenderOrder ?? 0 }
    })
  );
}

/** Melhor troca de 1 esquadrão para quem tem a última palavra (vê tudo): o atacante maximiza, o defensor minimiza. */
export function bestReply(sc: Scenario, side: "attacker" | "defender", a: Strategy, d: Strategy): Strategy {
  const mine = side == "attacker" ? a : d;
  const sign = side == "attacker" ? 1 : -1;
  let best = mine;
  let bv = sign * evalPair(sc, a, d) + 1e-6; // em empate, não muda
  for (const m2 of reactionsOf(mine, sc.field)) {
    const v = sign * (side == "attacker" ? evalPair(sc, m2, d) : evalPair(sc, a, m2));
    if (v > bv + 1e-9) {
      bv = v;
      best = m2;
    }
  }
  return best;
}

