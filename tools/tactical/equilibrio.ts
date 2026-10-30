/**
 * Simulador de equilíbrio do combate tático.
 *
 * Para cada cenário (campo + exércitos + cartas), procura o jeito ÓTIMO de os
 * dois lados posicionarem (equilíbrio de Nash aproximado, "double oracle"):
 * cada lado escolhe a melhor resposta contra a mistura de jogadas do outro,
 * até ninguém conseguir melhorar. Mostra:
 *  - valor: bônus médio do atacante jogando bem dos dois lados (−2..+2);
 *  - quanto cada lado vence o mini-mapa;
 *  - quanto cada função do soldado é usada (nenhuma pode ficar "morta").
 *
 * Uso (na pasta agot-bg-game-server):
 *   npx ts-node -T ../tools/tactical/equilibrio.ts            (todos os cenários)
 *   npx ts-node -T ../tools/tactical/equilibrio.ts planicie   (só os que contêm o texto)
 */
import { resolveTacticalBattle, Squad, Lane, CardInfo } from "../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import {
  FIELD_LANES,
  FieldType,
  rolesFor,
  Role,
  Row,
  SquadKind
} from "../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";

type Option = { lane: Lane; row: Row; role: Role };
type Strategy = Squad[];

interface Piece {
  kind: SquadKind;
  strength?: number;
  support?: boolean;
  fixed?: Option; // guarnição: posição fixa
}

function optionsFor(p: Piece, field: FieldType): Option[] {
  if (p.fixed) return [p.fixed];
  const lanes = ([0, 1, 2] as Lane[]).filter((l) => FIELD_LANES[field][l] != "bloqueado");
  const out: Option[] = [];
  for (const lane of lanes) for (const row of ["frente", "tras"] as Row[]) for (const role of rolesFor(p.kind, field == "mar")) out.push({ lane, row, role });
  return out;
}

/** Todas as jogadas de um lado (peças iguais são intercambiáveis: combinações com repetição). */
function enumerate(pieces: Piece[], field: FieldType): Strategy[] {
  // agrupa peças idênticas
  const groups = new Map<string, Piece[]>();
  pieces.forEach((p) => {
    const k = `${p.kind}|${p.strength ?? 1}|${p.support ? 1 : 0}|${p.fixed ? 1 : 0}`;
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
            support: ps[j].support,
            ...opts[oi]
          }))
        ]);
      }
    }
    idc += ps.length;
    partial = next;
  });
  return partial;
}

let ORDERS: [number, number] = [0, 0];
function payoff(field: FieldType, a: Strategy, d: Strategy, ac: CardInfo | null, dc: CardInfo | null): number {
  const r = resolveTacticalBattle({
    field,
    attacker: { squads: a, card: ac, orderBonus: ORDERS[0] },
    defender: { squads: d, card: dc, orderBonus: ORDERS[1] }
  });
  if (!r.winner) return 0;
  return r.winner == "attacker" ? r.bonus : -r.bonus;
}

/** Resolve um jogo de soma zero pequeno (matriz) com "regret matching+". */
function solveMatrix(M: number[][], iters = 4000): { x: number[]; y: number[]; v: number } {
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

export function solveScenario(sc: Scenario): ScenarioResult {
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

// ---------------- cenários ----------------
const F: Piece = { kind: "footman" };
const K: Piece = { kind: "knight" };
const S: Piece = { kind: "siege-engine" };
const SH: Piece = { kind: "ship" };
const G = (strength: number): Piece => ({ kind: "garrison", strength, fixed: { lane: 1, row: "tras", role: "torre" } });
const rep = (p: Piece, n: number): Piece[] => new Array(n).fill(p);

export const SCENARIOS: Scenario[] = [];
const fields: FieldType[] = ["planicie", "colinas", "floresta", "montanha", "rio", "pantano", "deserto", "castelo", "fortaleza"];
for (const field of fields) {
  SCENARIOS.push({ name: `${field}: 2 soldados x 2 soldados`, field, attacker: rep(F, 2), defender: rep(F, 2) });
  SCENARIOS.push({ name: `${field}: 1 sold+1 cav x 1 sold+1 cav`, field, attacker: [F, K], defender: [F, K] });
  SCENARIOS.push({ name: `${field}: 3 soldados x 1 sold+1 cav`, field, attacker: rep(F, 3), defender: [F, K] });
  SCENARIOS.push({ name: `${field}: 2 sold+1 cav x 2 soldados`, field, attacker: [F, F, K], defender: rep(F, 2) });
  SCENARIOS.push({ name: `${field}: 1 soldado x 3 soldados`, field, attacker: [F], defender: rep(F, 3) });
  SCENARIOS.push({ name: `${field}: 4 soldados x 2 soldados`, field, attacker: rep(F, 4), defender: rep(F, 2) });
  SCENARIOS.push({ name: `${field}: 2 cavaleiros x 3 soldados`, field, attacker: rep(K, 2), defender: rep(F, 3) });
}
SCENARIOS.push({ name: "castelo: 2 sold+1 cerco x 2 soldados", field: "castelo", attacker: [F, F, S], defender: rep(F, 2) });
SCENARIOS.push({ name: "castelo: 2 sold+1 cerco x 3 soldados", field: "castelo", attacker: [F, F, S], defender: rep(F, 3) });
SCENARIOS.push({ name: "fortaleza: 1 sold+1 cerco x 3 soldados", field: "fortaleza", attacker: [F, S], defender: rep(F, 3) });
SCENARIOS.push({ name: "planicie: 2 sold+1 cerco x 2 soldados (cerco vale 0)", field: "planicie", attacker: [F, F, S], defender: rep(F, 2) });
SCENARIOS.push({ name: "planicie: Marcha +1 x Defesa +1 (2 sold x 2 sold)", field: "planicie", attacker: rep(F, 2), defender: rep(F, 2), attackerOrder: 1, defenderOrder: 1 });
SCENARIOS.push({ name: "planicie: Marcha +1 x sem ordem (2 sold x 2 sold)", field: "planicie", attacker: rep(F, 2), defender: rep(F, 2), attackerOrder: 1 });
SCENARIOS.push({ name: "planicie: Marcha -1 x Defesa +2 (2 sold x 2 sold)", field: "planicie", attacker: rep(F, 2), defender: rep(F, 2), attackerOrder: -1, defenderOrder: 2 });
SCENARIOS.push({ name: "rio: 2 sold + apoio de navio x 2 sold", field: "rio", attacker: [F, F, { kind: "ship", support: true }], defender: rep(F, 2) });
SCENARIOS.push({ name: "fortaleza: 2 sold+1 cerco x 2 sold + guarnição 2", field: "fortaleza", attacker: [F, F, S], defender: [F, F, G(2)] });
SCENARIOS.push({ name: "fortaleza: 3 soldados x 2 sold + guarnição 2", field: "fortaleza", attacker: rep(F, 3), defender: [F, F, G(2)] });
SCENARIOS.push({ name: "planicie: dragão (força 2) x 2 soldados", field: "planicie", attacker: [{ kind: "dragon", strength: 2 }], defender: rep(F, 2) });
SCENARIOS.push({ name: "planicie: 2 sold + 1 apoio x 3 soldados", field: "planicie", attacker: [F, F, { kind: "footman", support: true }], defender: rep(F, 3) });
SCENARIOS.push({ name: "mar: 2 navios x 2 navios", field: "mar", attacker: rep(SH, 2), defender: rep(SH, 2) });
SCENARIOS.push({ name: "mar: 3 navios x 1 navio", field: "mar", attacker: rep(SH, 3), defender: [SH] });
SCENARIOS.push({
  name: "planicie: cartas 3⚔ x 0 (2 sold x 2 sold)",
  field: "planicie",
  attacker: rep(F, 2),
  defender: rep(F, 2),
  attackerCard: { strength: 3, swords: 1, towers: 0 },
  defenderCard: { strength: 0, swords: 0, towers: 0 }
});
SCENARIOS.push({
  name: "planicie: cartas 4 x 1▲▲ (1sold+1cav x 1sold+1cav)",
  field: "planicie",
  attacker: [F, K],
  defender: [F, K],
  attackerCard: { strength: 4, swords: 0, towers: 0 },
  defenderCard: { strength: 1, swords: 0, towers: 2 }
});

if (require.main === module) {
  const filter = process.argv[2];
  const list = SCENARIOS.filter((s) => !filter || s.name.includes(filter));
  const pct = (v: number) => `${Math.round(v * 100)}%`.padStart(4);
  for (const sc of list) {
    const r = solveScenario(sc);
    const roles = Object.entries(r.roles)
      .map(([k, v]) => `${k} ${v.toFixed(2)}`)
      .join(", ");
    console.log(
      `${r.name.padEnd(52)} valor ${r.value >= 0 ? "+" : ""}${r.value.toFixed(2)} | ótimo: atac ${pct(r.attackerWins)} def ${pct(r.defenderWins)} emp ${pct(r.draws)} | chute: atac ${pct(r.random.attacker)} def ${pct(r.random.defender)} emp ${pct(r.random.draw)} | ${roles}`
    );
  }
}
