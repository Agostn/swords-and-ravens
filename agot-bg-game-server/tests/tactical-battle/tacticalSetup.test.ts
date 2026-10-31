import { buildSquads, defaultSquadsFor, isValidTactic, slotsOk, TacticalPiece } from "../../src/common/tactical-battle/tacticalSetup";
import { resolveTacticalBattle } from "../../src/common/tactical-battle/tacticalBattle";

const army: TacticalPiece[] = [
  { piece: "11", kind: "footman", strength: 1 },
  { piece: "12", kind: "knight", strength: 2 },
  { piece: "garrison", kind: "garrison", strength: 2 }
];

describe("Mesa de Batalha no jogo completo (tacticalSetup)", () => {
  it("sem nada mandado: peças padrão, todas no campo, garrison fixa no centro atrás", () => {
    const r = buildSquads(army, null, "planicie", "defender");
    if ("error" in r) throw new Error(r.error);
    expect(r.squads).toHaveLength(5);
    expect(r.squads.every((s) => s.lane != null)).toBe(true);
    const g = r.squads.find((s) => s.kind == "garrison");
    expect(g).toMatchObject({ lane: 1, row: "tras", role: "torre", share: 1 });
    // a força total das peças não muda com a divisão
    const total = r.squads.reduce((a, s) => a + (s.strength ?? 0) * (s.share ?? 1), 0);
    expect(total).toBeCloseTo(5);
  });

  it("aceita cavaleiro a pé (4 soldados) e recusa forma inventada", () => {
    const foot = [0, 1, 2, 3].map((k) => ({ piece: "12", kind: "footman" as const, role: "lanceiro" as const, lane: (k % 3) as 0 | 1 | 2, row: "frente" as const }));
    const ok = buildSquads(army, foot, "planicie", "attacker");
    expect("error" in ok).toBe(false);
    const bad = buildSquads(army, foot.slice(0, 3), "planicie", "attacker");
    expect("error" in bad).toBe(true);
    const fake = buildSquads(army, [{ piece: "99", kind: "footman", role: "lanceiro", lane: 0, row: "frente" }], "planicie", "attacker");
    expect("error" in fake).toBe(true);
  });

  it("recusa função proibida, faixa fechada e casinha cheia", () => {
    const role = buildSquads(army, [{ piece: "11", kind: "footman", role: "cavalaria", lane: 0, row: "frente" }, { piece: "11", kind: "footman", role: "lanceiro", lane: 0, row: "frente" }], "planicie", "attacker");
    expect("error" in role).toBe(true);
    // montanha: faixa da direita fechada
    const closed = buildSquads(army, [{ piece: "11", kind: "footman", role: "lanceiro", lane: 2, row: "frente" }, { piece: "11", kind: "footman", role: "lanceiro", lane: 0, row: "frente" }], "montanha", "attacker");
    expect("error" in closed).toBe(true);
    const many: TacticalPiece[] = [1, 2, 3].map((i) => ({ piece: String(i), kind: "footman", strength: 1 }));
    const full = buildSquads(many, many.flatMap((p) => defaultSquadsFor(p, false).map((q) => ({ ...q, lane: 0 as const, row: "frente" as const }))), "planicie", "attacker");
    expect("error" in full).toBe(true);
  });

  it("navio no mar: 1 esquadrão de abordagem/aríete/flechas", () => {
    const r = buildSquads([{ piece: "5", kind: "ship", strength: 1 }], [{ piece: "5", kind: "ship", role: "ariete", lane: 2, row: "frente" }], "mar", "attacker");
    if ("error" in r) throw new Error(r.error);
    expect(r.squads[0]).toMatchObject({ role: "ariete", lane: 2 });
  });

  it("ordem de batalha só do lado certo", () => {
    expect(isValidTactic("carga", "attacker")).toBe(true);
    expect(isValidTactic("carga", "defender")).toBe(false);
    expect(isValidTactic("qualquer", "attacker")).toBe(false);
  });

  it("modo decisivo com as peças do jogo: muito mais forte vence quase sempre", () => {
    const A = buildSquads([{ piece: "1", kind: "knight", strength: 2 }, { piece: "2", kind: "knight", strength: 2 }, { piece: "3", kind: "footman", strength: 1 }], null, "planicie", "attacker");
    const D = buildSquads([{ piece: "4", kind: "footman", strength: 1 }], null, "planicie", "defender");
    if ("error" in A || "error" in D) throw new Error("forma");
    expect(slotsOk(A.squads, "planicie")).toBe(true);
    const r = resolveTacticalBattle({ field: "planicie", attacker: { squads: A.squads, boardTotal: 9 }, defender: { squads: D.squads, boardTotal: 2 }, bladeHolder: "defender" });
    expect(r.decisive).toBe(true);
    expect(r.winner).toBe("attacker");
  });
});
