/**
 * Teste da animação da luta: roda 400 batalhas aleatórias e conta soldados "parados"
 * (corpo a corpo, numa faixa com luta, com inimigo vivo longe, sem lutar e sem andar).
 * Rodar: node tools/tactical/prototipo/teste/rodar.js  (precisa do Chromium do Playwright)
 */
import { resolveTacticalBattle, Squad } from "../../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { FieldType, Role, SquadKind } from "../../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { T_END, createSim, hitStats, setGore, stepSim } from "../battle";
import { HOUSES } from "../data";

setGore(false);
const fields: FieldType[] = ["planicie", "floresta", "rio", "castelo", "colinas", "pantano"];
const roles: Record<string, Role[]> = { footman: ["lanceiro", "escudeiro", "arqueiro"], knight: ["cavalaria", "batedores"] };
let seed = 7;
const R = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = <T>(a: T[]): T => a[Math.floor(R() * a.length)];
const out: string[] = [];
let idleCases = 0;
let flagsOk = 0;
const roleStat: Record<string, { t: number; atk: number }> = {};
const flagFail: string[] = [];
let crossings = 0; // alguém atravessou o próprio inimigo (deu a volta nele) para lutar do outro lado
let crossBattles = 0;
let closeIdle = 0; // perto do inimigo (arma alcança) e sem golpear por mais de 1,5 s
const closeDbg: string[] = [];
const dbg: string[] = [];
for (let n = 0; n < 400; n++) {
  const field = pick(fields);
  const mk = (side: string, count: number): Squad[] =>
    Array.from({ length: count }, (_, i) => {
      const kind: SquadKind = R() < 0.3 ? "knight" : "footman";
      return { id: side + i, kind, role: pick(roles[kind]), lane: Math.floor(R() * 3) as 0 | 1 | 2, row: R() < 0.5 ? "frente" : "tras" } as Squad;
    });
  const A = mk("a", 1 + Math.floor(R() * 4));
  const D = mk("d", 1 + Math.floor(R() * 4));
  const res = resolveTacticalBattle({ field, attacker: { squads: A }, defender: { squads: D }, bladeHolder: n % 2 ? "attacker" : "defender" });
  const sim = createSim(field, res, { attacker: A, defender: D }, { attacker: HOUSES.stark, defender: HOUSES.lannister }, n + 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const men = sim.men as any[];
  let idleTime = 0;
  // olha de 4,2 s a 6,2 s: quem fica parado o tempo todo nesse intervalo
  const still = new Map<number, number>();
  const lastSide = new Map<number, number>();
  const closeT = new Map<number, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastFoe = new Map<number, any>();
  let crossedHere = 0;
  const where = new Map<number, string>();
  const lastAtk = new Map<number, number>();
  while (sim.t < 9.6) {
    stepSim(sim, 0.02);
    men.forEach((m, i) => {
      if (m.dead || !m.foe || m.foe.dead || m.kind == "dragon" || m.kind == "ship") return;
      if (Math.abs(m.y - m.foe.y) > 30) return;
      const ddx = m.x - m.foe.x;
      if (Math.abs(ddx) < 8) return; // perto demais para dizer de que lado está
      const sd = Math.sign(ddx);
      const prevSd = lastSide.get(i);
      if (prevSd != null && sd != 0 && prevSd != 0 && sd != prevSd && lastFoe.get(i) === m.foe) {
        crossedHere++;
        if (dbg.length < 12) dbg.push(`#${n} t${sim.t.toFixed(1)} ${m.side[0]}${m.role}/${m.kind} vs ${m.foe.role} mutual=${m.foe.foe === m} eng=${m.engaged} spot=${m.spot} sdir=${m.sdir} foeSdir=${m.foe.sdir} dy=${Math.round(m.y - m.foe.y)}`);
      }
      lastSide.set(i, sd);
      lastFoe.set(i, m.foe);
    });
    men.forEach((m, i) => {
      if (m.dead || m.kind == "dragon" || m.kind == "ship" || m.kind == "tower" || m.kind == "siege" || m.role == "arqueiro" || m.role == "flechas") return;
      if (sim.t < 4 || sim.t > 9.5) return;
      if (sim.duel && sim.t >= 6.4) return;
      const near = men.some((o) => o.side != m.side && !o.dead && o.kind != "tower" && Math.abs(o.x - m.x) <= m.reach + 6 && Math.abs(o.y - m.y) <= 14);
      const attacking = sim.t - m.atkStart < 0.8;
      if (near && !attacking) {
        closeT.set(i, (closeT.get(i) ?? 0) + 0.02);
        if ((closeT.get(i) ?? 0) > 1.5 && (closeT.get(i) ?? 0) < 1.52) {
          closeIdle++;
          if (closeDbg.length < 8) closeDbg.push(`#${n} ${m.side[0]}${m.role} foe=${m.foe ? m.foe.role : "-"} mutual=${m.foe && m.foe.foe === m} eng=${m.engaged} gap=${m.foe ? Math.round(Math.abs(m.foe.x - m.x)) + "," + Math.round(Math.abs(m.foe.y - m.y)) : "-"}`);
        }
      } else closeT.set(i, 0);
    });
    // golpes por papel: tempo com inimigo perto (até 80 px) e quantos golpes começou nesse tempo
    if (sim.t > 3.4 && sim.t < 9.9 && !(sim.duel && sim.t >= 6.4))
      men.forEach((m, i) => {
        if (m.dead || !["lanceiro", "escudeiro", "cavalaria", "batedores"].includes(m.role)) return;
        const near = men.some((o) => o.side != m.side && !o.dead && o.kind != "tower" && Math.hypot(o.x - m.x, o.y - m.y) <= 80);
        if (!near) return;
        const st = roleStat[m.role] ?? (roleStat[m.role] = { t: 0, atk: 0 });
        st.t += 0.02;
        if (m.atkStart > sim.t - 0.021 && lastAtk.get(i) !== m.atkStart) st.atk++;
        lastAtk.set(i, m.atkStart);
      });
    if (sim.t < 4.2 || sim.t > 6.2) continue;
    if (sim.duel && sim.t >= 4.9) continue; // duelo de campeões: os outros param para assistir (de propósito)
    men.forEach((m, i) => {
      if (m.dead || m.kind == "tower" || m.kind == "siege" || m.kind == "dragon" || m.role == "arqueiro" || m.role == "flechas") return;
      if (res.lanes[m.lane].winner == null) return;
      if (m.onWall || m.atWall) return; // defensor em cima da muralha segurando a posição: é de propósito
      const enemies = men.filter((o) => o.side != m.side && o.lane == m.lane && !o.dead && o.kind != "tower");
      if (!enemies.length) return;
      const nearest = Math.min(...enemies.map((o) => Math.hypot(o.x - m.x, o.y - m.y)));
      if (!m.engaged && nearest > 70 && Math.hypot(m.vx, m.vy) < 8) {
        still.set(i, (still.get(i) ?? 0) + 0.02);
        where.set(i, `${m.side[0]}${m.role[0]} x${Math.round(m.x)} y${Math.round(m.y)} foe${m.foe ? Math.round(m.foe.x) + "," + Math.round(m.foe.y) : "-"}`);
      }
    });
  }
  // bandeira: com o resultado do tabuleiro, quem vence tem que fincar a bandeira até o fim
  {
    const win = res.winner && res.winner != null ? res.winner : n % 2 ? "attacker" : "defender";
    const s2 = createSim(field, res, { attacker: A, defender: D }, { attacker: HOUSES.stark, defender: HOUSES.lannister }, n + 1, { loser: win == "attacker" ? "defender" : "attacker", destroyed: [], winner: win });
    while (s2.t < T_END) stepSim(s2, 0.05);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fl = (s2 as any).flag;
    if (fl && fl.planted < T_END) flagsOk++;
    else if (flagFail.length < 5) flagFail.push(`#${n} ${field} sem bandeira (${fl ? "não chegou" : "ninguém"})`);
  }
  still.forEach((v) => (idleTime = Math.max(idleTime, v)));
  crossings += crossedHere;
  if (crossedHere > 0) crossBattles++;
  if (idleTime > 1.0) {
    idleCases++;
    if (out.length < 10) out.push(`#${n} ${field} A=${A.map((s) => s.role[0] + s.lane).join(",")} D=${D.map((s) => s.role[0] + s.lane).join(",")} parado ${idleTime.toFixed(1)} s ${[...where.values()].slice(0, 3).join(" | ")}`);
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__RESULT__ = `batalhas 400, com soldado parado mais de 1 s: ${idleCases}; atravessou o inimigo: ${crossings} vezes em ${crossBattles} batalhas; perto sem atacar: ${closeIdle}; bandeira fincada: ${flagsOk}/400\ngolpes por segundo perto do inimigo: ${Object.entries(roleStat).map(([r, v]) => `${r} ${(v.atk / v.t).toFixed(2)}`).join(", ")}\nacertos: ${Object.entries(hitStats).map(([r, v]) => `${r} ${v.land}/${v.start} (errou ${v.miss})`).join(", ")}\n` + flagFail.join("\n") + "\n" + closeDbg.join("\n") + "\n" + out.join("\n") + "\n" + dbg.join("\n");
