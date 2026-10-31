/**
 * Teste da animação da luta: roda 400 batalhas aleatórias e conta soldados "parados"
 * (corpo a corpo, numa faixa com luta, com inimigo vivo longe, sem lutar e sem andar).
 * Rodar: node tools/tactical/prototipo/teste/rodar.js  (precisa do Chromium do Playwright)
 */
import { resolveTacticalBattle, Squad } from "../../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { FieldType, Role, SquadKind } from "../../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { createSim, setGore, stepSim } from "../battle";
import { HOUSES } from "../data";

setGore(false);
const fields: FieldType[] = ["planicie", "floresta", "rio", "castelo", "colinas", "pantano"];
const roles: Record<string, Role[]> = { footman: ["lanceiro", "escudeiro", "arqueiro"], knight: ["cavalaria", "batedores"] };
let seed = 7;
const R = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = <T>(a: T[]): T => a[Math.floor(R() * a.length)];
const out: string[] = [];
let idleCases = 0;
for (let n = 0; n < 400; n++) {
  const field = pick(fields);
  const mk = (side: string, count: number): Squad[] =>
    Array.from({ length: count }, (_, i) => {
      const kind: SquadKind = R() < 0.3 ? "knight" : "footman";
      return { id: side + i, kind, role: pick(roles[kind]), lane: Math.floor(R() * 3) as 0 | 1 | 2, row: R() < 0.5 ? "frente" : "tras" } as Squad;
    });
  const A = mk("a", 1 + Math.floor(R() * 4));
  const D = mk("d", 1 + Math.floor(R() * 4));
  const res = resolveTacticalBattle({ field, attacker: { squads: A }, defender: { squads: D } });
  const sim = createSim(field, res, { attacker: A, defender: D }, { attacker: HOUSES.stark, defender: HOUSES.lannister }, n + 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const men = sim.men as any[];
  let idleTime = 0;
  // olha de 4,2 s a 6,2 s: quem fica parado o tempo todo nesse intervalo
  const still = new Map<number, number>();
  while (sim.t < 6.2) {
    stepSim(sim, 0.02);
    if (sim.t < 4.2) continue;
    men.forEach((m, i) => {
      if (m.dead || m.kind == "tower" || m.kind == "siege" || m.kind == "dragon" || m.role == "arqueiro" || m.role == "flechas") return;
      if (res.lanes[m.lane].winner == null) return;
      const enemies = men.filter((o) => o.side != m.side && o.lane == m.lane && !o.dead && o.kind != "tower");
      if (!enemies.length) return;
      const nearest = Math.min(...enemies.map((o) => Math.hypot(o.x - m.x, o.y - m.y)));
      if (!m.engaged && nearest > 70 && Math.hypot(m.vx, m.vy) < 8) still.set(i, (still.get(i) ?? 0) + 0.02);
    });
  }
  still.forEach((v) => (idleTime = Math.max(idleTime, v)));
  if (idleTime > 1.0) {
    idleCases++;
    if (out.length < 10) out.push(`#${n} ${field} A=${A.map((s) => s.role[0] + s.lane).join(",")} D=${D.map((s) => s.role[0] + s.lane).join(",")} parado ${idleTime.toFixed(1)} s`);
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__RESULT__ = `batalhas 400, com soldado parado mais de 1 s: ${idleCases}\n` + out.join("\n");
