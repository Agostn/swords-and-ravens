/**
 * Quadros da animação para conferir a olho (sem a tela de posicionar): monta uma batalha fixa e
 * desenha em vários momentos. Rodar: node quadros.js <cena> (cenas: mar, castelo-dragao).
 */
import { resolveTacticalBattle, Squad } from "../../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { FieldType } from "../../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { createSim, drawSim, stepSim } from "../battle";
import { HOUSES } from "../data";
import { loadAssets } from "../assets";

const CENAS: Record<string, { field: FieldType; A: Squad[]; D: Squad[]; destroyed: string[] }> = {
  mar: {
    field: "mar",
    A: [
      { id: "a0", kind: "ship", role: "ariete", lane: 0, row: "frente" },
      { id: "a1", kind: "ship", role: "abordagem", lane: 1, row: "frente" },
      { id: "a2", kind: "ship", role: "flechas", lane: 1, row: "tras" },
      { id: "a3", kind: "ship", role: "ariete", lane: 2, row: "frente" }
    ],
    D: [
      { id: "d0", kind: "ship", role: "abordagem", lane: 0, row: "frente" },
      { id: "d1", kind: "ship", role: "abordagem", lane: 1, row: "frente" },
      { id: "d2", kind: "ship", role: "flechas", lane: 2, row: "frente" }
    ],
    destroyed: ["d1"]
  },
  // como no print do Agostinho (01/nov): Baratheon ataca castelo da Lannister, luta na Muralha e no Portão
  "castelo-print": {
    field: "castelo",
    A: [
      { id: "a0", kind: "footman", role: "lanceiro", lane: 0, row: "frente", strength: 1, share: 0.5, piece: "p1" },
      { id: "a1", kind: "footman", role: "escudeiro", lane: 0, row: "frente", strength: 1, share: 0.5, piece: "p1" },
      { id: "a2", kind: "footman", role: "lanceiro", lane: 1, row: "frente", strength: 1, share: 0.5, piece: "p2" },
      { id: "a3", kind: "footman", role: "arqueiro", lane: 1, row: "tras", strength: 1, share: 0.5, piece: "p2" }
    ],
    D: [
      { id: "d0", kind: "footman", role: "arqueiro", lane: 0, row: "frente", strength: 1, share: 0.5, piece: "q1" },
      { id: "d1", kind: "footman", role: "lanceiro", lane: 0, row: "frente", strength: 1, share: 0.5, piece: "q1" },
      { id: "d2", kind: "footman", role: "escudeiro", lane: 1, row: "frente", strength: 1, share: 0.5, piece: "q2" },
      { id: "d3", kind: "footman", role: "arqueiro", lane: 1, row: "tras", strength: 1, share: 0.5, piece: "q2" },
      { id: "g", kind: "garrison", role: "torre", lane: 1, row: "tras", strength: 1 }
    ],
    destroyed: ["a0", "a1"]
  },
  "castelo-dragao": {
    field: "castelo",
    A: [
      { id: "a0", kind: "footman", role: "lanceiro", lane: 1, row: "frente" },
      { id: "a1", kind: "footman", role: "escudeiro", lane: 0, row: "frente" },
      { id: "a2", kind: "knight", role: "cavalaria", lane: 2, row: "frente" },
      { id: "adr", kind: "dragon", role: "dragao", lane: 1, row: "tras", strength: 3 }
    ],
    D: [
      { id: "d0", kind: "footman", role: "arqueiro", lane: 0, row: "frente" },
      { id: "d1", kind: "footman", role: "lanceiro", lane: 1, row: "frente" },
      { id: "d2", kind: "footman", role: "escudeiro", lane: 2, row: "frente" },
      { id: "g", kind: "garrison", role: "torre", lane: 1, row: "tras", strength: 2 }
    ],
    destroyed: []
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).run = async (name: string, times: number[]): Promise<string[]> => {
  await loadAssets();
  const c = CENAS[name];
  const res = resolveTacticalBattle({ field: c.field, attacker: { squads: c.A }, defender: { squads: c.D }, bladeHolder: "defender" });
  const win = res.winner ?? "defender";
  const sim = createSim(c.field, res, { attacker: c.A, defender: c.D }, { attacker: HOUSES.greyjoy, defender: HOUSES.lannister }, 5, { loser: win == "attacker" ? "defender" : "attacker", destroyed: c.destroyed, winner: win });
  const cv = document.createElement("canvas");
  cv.width = 1200;
  cv.height = 1560;
  const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
  const out: string[] = [];
  for (const tt of times) {
    while (sim.t < tt) stepSim(sim, 1 / 30);
    drawSim(ctx, sim);
    out.push(cv.toDataURL("image/png"));
  }
  return out;
};
