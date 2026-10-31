/**
 * Modo decisivo (31/out: a Mesa decide a batalha). Mede, para batalhas sorteadas com cartas, ordens e apoio,
 * quanto quem tem MAIS força no tabuleiro vence a Mesa, por diferença de força. Jogando bem (Nash) e no chute.
 * Alvo: diferença 0 ≈ 50%; 1 ≈ 60–65%; 2 ≈ 75%; 3 ≈ 85%; 4+ ≈ 93%+ (estratégia pesa nas batalhas apertadas).
 * Uso (na pasta agot-bg-game-server):
 *   EDGE=0.5 npx ts-node -T -r ../tools/tactical/cs.js ../tools/tactical/vantagem.ts
 */
import { Piece, solveScenario } from "./solver";
import { EDGE_EXP, FieldType } from "../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";

let rs = 2026;
const rnd = (): number => ((rs = (rs * 1103515245 + 12345) & 0x7fffffff), rs / 0x7fffffff);
const ri = (a: number, b: number): number => a + Math.floor(rnd() * (b - a + 1));
const fields: FieldType[] = process.env.FIELDS ? (process.env.FIELDS.split(",") as FieldType[]) : ["planicie", "colinas", "floresta", "rio", "castelo"];
const army = (): Piece[] => Array.from({ length: ri(1, 4) }, () => ({ kind: rnd() < 0.35 ? "knight" : "footman" } as Piece));
const str = (ps: Piece[]): number => ps.reduce((a, p) => a + (p.kind == "knight" ? 2 : p.kind == "garrison" ? p.strength ?? 0 : 1), 0);
const N = Number(process.env.N ?? 140);
const buckets: Record<string, { n: number; nash: number; rand: number }> = {};
for (let i = 0; i < N; i++) {
  const field = fields[ri(0, fields.length - 1)];
  const A = army();
  const D = army();
  if (field == "castelo" && rnd() < 0.6) D.push({ kind: "garrison", strength: ri(1, 2), fixed: { lane: 1, row: "tras", role: "torre" } });
  const Ta = str(A) + ri(0, 4) + ri(-1, 1) + (rnd() < 0.4 ? ri(1, 2) : 0);
  const Td = str(D) + ri(0, 4) + ri(0, 2) + (rnd() < 0.4 ? ri(1, 2) : 0);
  const r = solveScenario({ name: "v", field, attacker: A, defender: D, attackerTotal: Math.max(0, Ta), defenderTotal: Math.max(0, Td) });
  const gap = Math.abs(Ta - Td);
  const key = gap >= 4 ? "4+" : String(gap);
  const b = buckets[key] ?? (buckets[key] = { n: 0, nash: 0, rand: 0 });
  b.n++;
  // pontos de quem tem mais força (empate de força: o defensor como "líder", para ver se a defesa pesa)
  const leadAtk = Ta > Td;
  const nash = leadAtk ? r.attackerWins + r.draws / 2 : r.defenderWins + r.draws / 2;
  const rand = leadAtk ? r.random.attacker + r.random.draw / 2 : r.random.defender + r.random.draw / 2;
  b.nash += nash;
  b.rand += rand;
}
const order = ["0", "1", "2", "3", "4+"];
console.log(
  `EDGE_EXP=${EDGE_EXP}: ` +
    order
      .filter((k) => buckets[k])
      .map((k) => `dif ${k} (${buckets[k].n}): ${((100 * buckets[k].nash) / buckets[k].n).toFixed(0)}% bem / ${((100 * buckets[k].rand) / buckets[k].n).toFixed(0)}% chute`)
      .join(" · ")
);
