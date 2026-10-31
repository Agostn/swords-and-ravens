/**
 * Balanceamento do dragão na Mesa (31/out). Compara, com os dois lados jogando bem (Nash aproximado):
 *  - exército COM dragão de força S (+ soldados) contra um exército de MESMA força no tabuleiro sem dragão;
 *  - o mesmo exército, trocando o dragão por tropas comuns de mesma força (linha de base).
 * Justo = o dragão vencer a Mesa um pouco mais que tropas comuns de mesma força (é voador), mas não muito.
 * Uso (na pasta agot-bg-game-server):
 *   DAIR=0.9 DAIRF=0.8 npx ts-node -T -r ../tools/tactical/cs.js ../tools/tactical/dragao.ts
 */
import { Piece, solveScenario } from "./solver";
import { FieldType } from "../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";

const F: Piece = { kind: "footman" };
const K: Piece = { kind: "knight" };
const D = (s: number): Piece => ({ kind: "dragon", strength: s });
// tropas comuns com força total t (no máximo 4 peças): cavaleiros primeiro
const troops = (t: number, max = 4): Piece[] => {
  const out: Piece[] = [];
  let left = t;
  while (left > 0 && out.length < max) {
    const piecesLeft = max - out.length;
    if (left >= 2 && left > piecesLeft - 1) {
      out.push(K);
      left -= 2;
    } else {
      out.push(F);
      left -= 1;
    }
  }
  return out;
};
const fields: FieldType[] = process.env.FULL ? ["planicie", "colinas", "floresta", "castelo"] : ["planicie", "colinas", "castelo"];
const extras: Piece[][] = process.env.FULL ? [[F], [K], [F, F], [K, F]] : [[F], [K, F]];
let nashD = 0;
let nashB = 0;
let rndD = 0;
let rndB = 0;
let n = 0;
const rows: string[] = [];
const strength = (ps: Piece[]): number => ps.reduce((a, p) => a + (p.kind == "knight" ? 2 : p.kind == "dragon" ? p.strength ?? 0 : 1), 0);
for (const S of process.env.FULL ? [2, 3, 4, 5] : [2, 3, 4]) {
  for (const ex of extras) {
    for (const field of fields) {
      const mine = [D(S), ...ex];
      const T = strength(mine);
      const enemy = troops(T);
      const equal = troops(T);
      if (strength(enemy) != T) continue;
      for (const dragonSide of ["attacker", "defender"] as const) {
        const sc = (me: Piece[]) => ({ name: "x", field, attacker: dragonSide == "attacker" ? me : enemy, defender: dragonSide == "attacker" ? enemy : me });
        const r1 = solveScenario(sc(mine));
        const r0 = solveScenario(sc(equal));
        const adv = (r: ReturnType<typeof solveScenario>, rand: boolean): number => {
          const a = rand ? r.random.attacker - r.random.defender : r.attackerWins - r.defenderWins;
          return dragonSide == "attacker" ? a : -a;
        };
        nashD += adv(r1, false);
        nashB += adv(r0, false);
        rndD += adv(r1, true);
        rndB += adv(r0, true);
        n++;
        rows.push(`S${S}+${ex.map((p) => p.kind[0]).join("")} ${field} ${dragonSide[0]}: nash ${(100 * adv(r1, false)).toFixed(0)} vs ${(100 * adv(r0, false)).toFixed(0)} · chute ${(100 * adv(r1, true)).toFixed(0)} vs ${(100 * adv(r0, true)).toFixed(0)}`);
      }
    }
  }
}
if (process.env.V) console.log(rows.join("\n"));
const pc = (x: number): string => `${x >= 0 ? "+" : ""}${((100 * x) / n).toFixed(0)}`;
console.log(`DOUT=${process.env.DOUT ?? 1.5} DAIR=${process.env.DAIR ?? 0.9} DAIRF=${process.env.DAIRF ?? 0.8} (${n} batalhas): vantagem do lado do dragão — jogando bem ${pc(nashD)} (sem dragão ${pc(nashB)}) · jogando no chute ${pc(rndD)} (sem dragão ${pc(rndB)})`);
