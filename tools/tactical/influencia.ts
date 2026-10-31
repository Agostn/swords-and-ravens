/**
 * Quanto o mini-mapa pesa na batalha INTEIRA e quanto é sorte x estratégia.
 *
 * 1) Batalha completa do jogo original: força das peças + apoio + ordem + carta de Casa
 *    + bônus do mini-mapa (jogado bem pelos dois lados). Mede quantas vezes o mini-mapa
 *    MUDA quem ganha, comparado com quantas vezes as cartas de Casa mudam.
 * 2) Peso das vantagens externas DENTRO do mini-mapa: carta, ordem, uma peça a mais.
 * 3) Habilidade: jogador bom x jogador no chute (quanto pensar compensa).
 *
 * Uso (na pasta agot-bg-game-server):
 *   CS=0.6 REACT=1 npx ts-node -T -r ../tools/tactical/cs.js ../tools/tactical/influencia.ts
 */
import { Piece, Scenario, Strategy, enumerate, optionsFor, payoff, setOrders, solveScenarioMix } from "./solver";
import { CardInfo } from "../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { FieldType } from "../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";

const F: Piece = { kind: "footman" };
const K: Piece = { kind: "knight" };
const SUP: Piece = { kind: "footman", support: true };
const REACT = process.env.REACT == "1";

/** força no tabuleiro do jogo original (sem carta) */
const boardOf = (ps: Piece[]): number => ps.reduce((a, p) => a + (p.kind == "knight" ? 2 : 1), 0);
/** cartas de Casa (Stark, do jogo original): força 4,3,2,2,1,1,0 */
const DECK = [4, 3, 2, 2, 1, 1, 0];
const card = (s: number): CardInfo => ({ strength: s, swords: 0, towers: 0 });

let rs = 99;
const rnd = (): number => {
  rs = (rs * 1103515245 + 12345) & 0x7fffffff;
  return rs / 0x7fffffff;
};
const pick = <T>(arr: T[], w?: number[]): T => {
  if (!w) return arr[Math.floor(rnd() * arr.length)];
  let r = rnd() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < arr.length; i++) if ((r -= w[i]) <= 0) return arr[i];
  return arr[arr.length - 1];
};

/** uma troca (lugar OU função) de um esquadrão depois de ver o outro lado */
function reactions(strat: Strategy, pieces: Piece[], field: FieldType): Strategy[] {
  const out: Strategy[] = [strat];
  strat.forEach((s, i) => {
    const p = pieces.find((pp) => pp.kind == s.kind && !!pp.support == !!s.support);
    if (!p || p.fixed) return;
    for (const o of optionsFor(p, field)) {
      if (o.lane == s.lane && o.row == s.row && o.role == s.role) continue;
      const n = strat.slice();
      n[i] = { ...s, ...o };
      out.push(n);
    }
  });
  return out;
}
/** defensor troca primeiro, atacante responde (tem a última palavra) */
function reactValue(sc: Scenario, a: Strategy, d: Strategy, ac: CardInfo | null, dc: CardInfo | null): number {
  const RA = reactions(a, sc.attacker, sc.field);
  let best = Infinity;
  for (const d2 of reactions(d, sc.defender, sc.field)) {
    let m = -Infinity;
    for (const a2 of RA) {
      const v = payoff(sc.field, a2, d2, ac, dc);
      if (v > m) m = v;
      if (m >= 2) break;
    }
    if (m < best) best = m;
    if (best <= -2) break;
  }
  return best;
}

interface Dist {
  att: number[]; // P(atacante ganha com bônus 1, 2)
  def: number[];
}
function miniDist(sc: Scenario, ac: CardInfo | null, dc: CardInfo | null, samples = 150): Dist {
  setOrders(sc.attackerOrder ?? 0, sc.defenderOrder ?? 0);
  const mix = solveScenarioMix({ ...sc, attackerCard: ac, defenderCard: dc });
  const d: Dist = { att: [0, 0, 0], def: [0, 0, 0] };
  for (let k = 0; k < samples; k++) {
    const a = pick(mix.A, mix.x);
    const b = pick(mix.D, mix.y);
    const v = REACT ? reactValue(sc, a, b, ac, dc) : payoff(sc.field, a, b, ac, dc);
    if (v > 0) d.att[v] += 1 / samples;
    else if (v < 0) d.def[-v] += 1 / samples;
  }
  return d;
}

// ---------------- 1) batalha inteira
const armies: [string, Piece[], Piece[]][] = [
  ["2 sold x 2 sold", [F, F], [F, F]],
  ["1s+1c x 1s+1c", [F, K], [F, K]],
  ["3 sold x 1s+1c", [F, F, F], [F, K]],
  ["2s+1c x 2 sold", [F, F, K], [F, F]],
  ["2 sold x 3 sold", [F, F], [F, F, F]],
  ["2s+apoio x 3 sold", [F, F, SUP], [F, F, F]]
];
const fields: FieldType[] = ["planicie", "floresta", "castelo"];
let tot = 0;
let flipMini = 0;
let flipCard = 0;
let attWinNo = 0;
let attWinMini = 0;
for (const field of fields)
  for (const [name, A, D] of armies) {
    let fm = 0;
    let fc = 0;
    let n = 0;
    for (const ca of [0, 1, 2, 3, 4])
      for (const cd of [0, 1, 2, 3, 4]) {
        const w = DECK.filter((x) => x == ca).length * DECK.filter((x) => x == cd).length;
        const sc: Scenario = { name, field, attacker: A, defender: D };
        const dist = miniDist(sc, card(ca), card(cd), 60);
        const base = boardOf(A) - boardOf(D) - (A.some((p) => p.support) ? 0 : 0);
        const sup = A.filter((p) => p.support).length; // apoio já está em boardOf
        void sup;
        const noMini = base + ca - cd;
        const noCard = base;
        // resultado: >0 atacante; empate = metade (Lâmina de Aço Valiriano decide)
        const res = (x: number): number => (x > 0 ? 1 : x < 0 ? 0 : 0.5);
        let withMini = 0;
        let cardFlip = 0;
        const pNone = 1 - dist.att[1] - dist.att[2] - dist.def[1] - dist.def[2];
        const outcomes: [number, number][] = [
          [0, pNone],
          [1, dist.att[1]],
          [2, dist.att[2]],
          [-1, dist.def[1]],
          [-2, dist.def[2]]
        ];
        let mf = 0;
        for (const [b, p] of outcomes) {
          withMini += p * res(noMini + b);
          mf += p * Math.abs(res(noMini + b) - res(noMini));
          cardFlip += p * Math.abs(res(noMini + b) - res(noCard + b));
        }
        fm += w * mf;
        fc += w * cardFlip;
        n += w;
        attWinNo += w * res(noMini);
        attWinMini += w * withMini;
      }
    tot += n;
    flipMini += fm;
    flipCard += fc;
    console.log(`${field.padEnd(9)} ${name.padEnd(18)} mini-mapa muda o vencedor ${(100 * fm / n).toFixed(0).padStart(3)}% | carta muda ${(100 * fc / n).toFixed(0).padStart(3)}%`);
  }
console.log(`TOTAL: mini-mapa muda ${(100 * flipMini / tot).toFixed(1)}% | carta de Casa muda ${(100 * flipCard / tot).toFixed(1)}% | atacante vence ${(100 * attWinNo / tot).toFixed(1)}% sem mini-mapa, ${(100 * attWinMini / tot).toFixed(1)}% com`);

// ---------------- 2) vantagens externas dentro do mini-mapa
const edge = (label: string, sc: Scenario): void => {
  const d = miniDist(sc, sc.attackerCard ?? null, sc.defenderCard ?? null, 300);
  const a = d.att[1] + d.att[2];
  const b = d.def[1] + d.def[2];
  console.log(`${label.padEnd(40)} quem tem a vantagem vence o mini-mapa ${(100 * a).toFixed(0)}% | perde ${(100 * b).toFixed(0)}%`);
};
edge("planície 2x2, carta 2 x 0", { name: "", field: "planicie", attacker: [F, F], defender: [F, F], attackerCard: card(2), defenderCard: card(0) });
edge("planície 2x2, carta 4 x 0", { name: "", field: "planicie", attacker: [F, F], defender: [F, F], attackerCard: card(4), defenderCard: card(0) });
edge("planície 2x2, Marcha +1", { name: "", field: "planicie", attacker: [F, F], defender: [F, F], attackerOrder: 1 });
edge("planície 3 sold x 2 sold", { name: "", field: "planicie", attacker: [F, F, F], defender: [F, F] });
edge("planície 2 sold+apoio x 2 sold", { name: "", field: "planicie", attacker: [F, F, SUP], defender: [F, F] });
edge("planície 2x2 iguais (sorte pura)", { name: "", field: "planicie", attacker: [F, F], defender: [F, F] });

// ---------------- 3) habilidade: bom x chute
const skill = (label: string, sc: Scenario): void => {
  setOrders(0, 0);
  const mix = solveScenarioMix(sc);
  const AD = enumerate(sc.defender, sc.field);
  let sum = 0;
  const N = 200;
  for (let k = 0; k < N; k++) {
    const a = pick(mix.A, mix.x);
    const d = pick(AD);
    if (!REACT) sum += payoff(sc.field, a, d, null, null);
    else {
      // novato troca no chute (ou não troca); bom responde da melhor forma
      const rd = reactions(d, sc.defender, sc.field);
      const d2 = pick(rd);
      let m = -Infinity;
      for (const a2 of reactions(a, sc.attacker, sc.field)) m = Math.max(m, payoff(sc.field, a2, d2, null, null));
      sum += m;
    }
  }
  console.log(`${label.padEnd(40)} bônus médio do jogador bom contra o novato: ${(sum / N >= 0 ? "+" : "")}${(sum / N).toFixed(2)} (de −2 a +2)`);
};
skill("habilidade: planície 2x2", { name: "", field: "planicie", attacker: [F, F], defender: [F, F] });
skill("habilidade: floresta 1s+1c x 1s+1c", { name: "", field: "floresta", attacker: [F, K], defender: [F, K] });
