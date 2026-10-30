import { resolveTacticalBattle, Squad } from "../../src/common/tactical-battle/tacticalBattle";
import { getBattleField, REGION_TERRAIN } from "../../src/common/tactical-battle/tacticalFields";
import { ADVANTAGE, ROLES_BY_KIND } from "../../src/common/tactical-battle/tacticalBattleData";
import * as fs from "fs";
import * as path from "path";

const sq = (id: string, kind: Squad["kind"], role: Squad["role"], lane: 0 | 1 | 2, row: Squad["row"] = "frente"): Squad => ({
  id,
  kind,
  role,
  lane,
  row
});

describe("combate tático", () => {
  it("dá sempre o mesmo resultado para a mesma batalha", () => {
    const input = {
      field: "planicie" as const,
      attacker: { squads: [sq("a1", "footman", "lanceiro", 0), sq("a2", "knight", "cavalaria", 1)] },
      defender: { squads: [sq("d1", "footman", "arqueiro", 1, "tras"), sq("d2", "footman", "escudeiro", 1)] }
    };
    expect(resolveTacticalBattle(input)).toEqual(resolveTacticalBattle(input));
  });

  it("lanceiro vence cavalaria de carga, e batedores vencem lanceiro", () => {
    const r1 = resolveTacticalBattle({
      field: "planicie",
      attacker: { squads: [sq("k", "knight", "cavalaria", 1)] },
      defender: { squads: [sq("f1", "footman", "lanceiro", 1), sq("f2", "footman", "lanceiro", 1)] }
    });
    expect(r1.winner).toBe("defender");
    const r2 = resolveTacticalBattle({
      field: "planicie",
      attacker: { squads: [sq("k", "knight", "batedores", 1)] },
      defender: { squads: [sq("f1", "footman", "lanceiro", 1), sq("f2", "footman", "lanceiro", 1)] }
    });
    expect(r2.winner).toBe("attacker");
  });

  it("faixa sem inimigo não conta como vitória", () => {
    const r = resolveTacticalBattle({
      field: "planicie",
      attacker: { squads: [sq("a", "footman", "lanceiro", 0)] },
      defender: { squads: [sq("d", "footman", "lanceiro", 2)] }
    });
    expect(r.winner).toBeNull();
    expect(r.bonus).toBe(0);
  });

  it("vencer todas as faixas com luta (2 ou mais) dá +2", () => {
    const r = resolveTacticalBattle({
      field: "planicie",
      attacker: { squads: [sq("a1", "footman", "arqueiro", 0, "tras"), sq("a2", "footman", "arqueiro", 2, "tras")] },
      defender: { squads: [sq("d1", "footman", "lanceiro", 0), sq("d2", "footman", "lanceiro", 2)] }
    });
    expect(r.winner).toBe("attacker");
    expect(r.bonus).toBe(2);
  });

  it("catapulta derruba a muralha", () => {
    const sem = resolveTacticalBattle({
      field: "fortaleza",
      attacker: { squads: [sq("a1", "footman", "lanceiro", 0), sq("a2", "footman", "lanceiro", 0)] },
      defender: { squads: [sq("d1", "footman", "lanceiro", 0)] }
    });
    const com = resolveTacticalBattle({
      field: "fortaleza",
      attacker: {
        squads: [sq("a1", "footman", "lanceiro", 0), sq("a2", "footman", "lanceiro", 0), sq("s", "siege-engine", "catapulta", 0, "tras")]
      },
      defender: { squads: [sq("d1", "footman", "lanceiro", 0)] }
    });
    expect(com.lanes[0].attackerScore).toBeGreaterThan(sem.lanes[0].attackerScore);
    expect(com.lanes[0].defenderScore).toBeLessThan(sem.lanes[0].defenderScore);
  });

  it("máquina de cerco só luta quando ataca castelo/fortaleza (como no jogo original)", () => {
    const campo = resolveTacticalBattle({
      field: "planicie",
      attacker: { squads: [sq("s", "siege-engine", "catapulta", 0, "tras")] },
      defender: { squads: [sq("d", "footman", "lanceiro", 0)] }
    });
    expect(campo.lanes[0].winner).toBeNull();
    const defendendo = resolveTacticalBattle({
      field: "castelo",
      attacker: { squads: [sq("a", "footman", "lanceiro", 0)] },
      defender: { squads: [sq("s", "siege-engine", "catapulta", 0, "tras")] }
    });
    expect(defendendo.lanes[0].winner).toBeNull();
  });

  it("Marcha +1 ajuda o atacante e Defesa +2 ajuda o defensor", () => {
    const base = {
      field: "planicie" as const,
      attacker: { squads: [sq("a", "footman", "lanceiro", 1)] },
      defender: { squads: [sq("d", "footman", "lanceiro", 1)] }
    };
    expect(resolveTacticalBattle(base).winner).toBeNull();
    expect(resolveTacticalBattle({ ...base, attacker: { ...base.attacker, orderBonus: 1 } }).winner).toBe("attacker");
    expect(resolveTacticalBattle({ ...base, defender: { ...base.defender, orderBonus: 2 } }).winner).toBe("defender");
  });

  it("peça ferida não luta", () => {
    const r = resolveTacticalBattle({
      field: "planicie",
      attacker: { squads: [sq("a", "footman", "lanceiro", 1)] },
      defender: { squads: [{ ...sq("d", "footman", "lanceiro", 1), wounded: true }] }
    });
    expect(r.lanes[1].winner).toBeNull();
  });

  it("toda função tem vantagem contra todas as outras da mesma família", () => {
    for (const role of [...ROLES_BY_KIND.footman, ...ROLES_BY_KIND.knight]) {
      for (const vs of [...ROLES_BY_KIND.footman, ...ROLES_BY_KIND.knight]) {
        expect(ADVANTAGE[role][vs]).toBeDefined();
      }
    }
  });

  it("toda área de terra dos 4 mapas tem um campo", () => {
    const maps = ["westeros", "westeros-7p", "westeros-with-essos", "ffc-eyrie-with-port"];
    for (const m of maps) {
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data", `${m}.json`), "utf8"));
      const regions = data.layers.find((l: { name: string }) => l.name == "Regions").objects;
      for (const o of regions) {
        const props = Object.fromEntries((o.properties ?? []).map((p: { name: string; value: unknown }) => [p.name, p.value]));
        if (props.type == "land") expect(REGION_TERRAIN[props.id as string]).toBeDefined();
      }
    }
    expect(getBattleField("winterfell", false, 2)).toBe("fortaleza");
    expect(getBattleField("winterfell", false, 0)).toBe("floresta");
    expect(getBattleField("moat-cailin", false, 0)).toBe("pantano");
    expect(getBattleField("the-narrow-sea", true, 0)).toBe("mar");
  });
});
