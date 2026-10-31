/**
 * Quanto a escolha de TÁTICA pesa. Para formações sorteadas (as que o jogo deixa montar),
 * testa os 9 pares de tática (3 de ataque x 3 de defesa) e mede:
 *  - "decide": % de batalhas em que o vencedor muda conforme as táticas escolhidas
 *  - "acertar vira": % em que o lado que VENCE a tática do outro vira uma batalha que perderia
 *  - "vence-tática ganha": % de vitórias de quem acertou a tática do outro
 * Uso (na pasta agot-bg-game-server):
 *   TACWIN=0.05 npx ts-node -T -r ../tools/tactical/cs.js ../tools/tactical/taticas.ts
 */
import { Piece, enumerate } from "./solver";
import { resolveTacticalBattle } from "../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { ATTACK_TACTICS, DEFENSE_TACTICS, TACTIC_BEATS, Tactic } from "../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";

let rs = 7;
const rnd = (): number => ((rs = (rs * 1103515245 + 12345) & 0x7fffffff), rs / 0x7fffffff);
const army = (n: number): Piece[] => Array.from({ length: n }, () => ({ kind: rnd() < 0.35 ? "knight" : "footman" } as Piece));
let total = 0, decide = 0, flips = 0, flipBase = 0, beatW = 0, beatN = 0;
const winner = (a: any, d: any, ta: Tactic, td: Tactic): number => {
  const r = resolveTacticalBattle({ field: "planicie" as any, attacker: { squads: a, card: null, tactic: ta }, defender: { squads: d, card: null, tactic: td } } as any);
  return r.winner == "attacker" ? 1 : r.winner == "defender" ? -1 : 0;
};
for (let s = 0; s < 260; s++) {
  const na = 2 + Math.floor(rnd() * 3), nd = 2 + Math.floor(rnd() * 3);
  const A = enumerate(army(na), "planicie" as any), D = enumerate(army(nd), "planicie" as any);
  for (let k = 0; k < 6; k++) {
    const a = A[Math.floor(rnd() * A.length)], d = D[Math.floor(rnd() * D.length)];
    const res = new Set<number>();
    const loc: [boolean, boolean, number][] = [];
    for (const ta of ATTACK_TACTICS) for (const td of DEFENSE_TACTICS) {
      const w = winner(a, d, ta, td);
      res.add(w);
      const aBeats = TACTIC_BEATS[ta] == td, dBeats = TACTIC_BEATS[td] == ta;
      loc.push([aBeats, dBeats, w]);
    }
    total++;
    if (res.size > 1) {
      decide++;
      for (const [ab, db, w] of loc) if (ab || db) { beatN++; if ((ab && w == 1) || (db && w == -1)) beatW++; }
    }
  }
}
console.log(`TACWIN=${process.env.TACWIN ?? 0.1} TACMAX=${process.env.TACMAX ?? 0.18}: tática decide ${((100 * decide) / total).toFixed(0)}% das batalhas; nessas batalhas apertadas, quem acerta a tática do outro vence ${((100 * beatW) / beatN).toFixed(0)}%`);
