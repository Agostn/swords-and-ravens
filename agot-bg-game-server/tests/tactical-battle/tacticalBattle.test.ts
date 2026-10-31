import { resolveTacticalBattle, Squad } from "../../src/common/tactical-battle/tacticalBattle";
import { getBattleField, REGION_TERRAIN } from "../../src/common/tactical-battle/tacticalFields";
import { ADVANTAGE, ROLES_BY_KIND, advantage, COUNTER_SCALE } from "../../src/common/tactical-battle/tacticalBattleData";
import { isValidReaction } from "../../src/common/tactical-battle/tacticalReaction";
import { squadValue } from "../../src/common/tactical-battle/tacticalBattle";
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

  it("quem fica na outra ponta ajuda menos, mas ajuda (15% em vez de 30%)", () => {
    const base = {
      field: "planicie" as const,
      defender: { squads: [sq("d1", "footman", "lanceiro", 0)] }
    };
    const alone = resolveTacticalBattle({ ...base, attacker: { squads: [sq("a1", "footman", "lanceiro", 0)] } });
    const far = resolveTacticalBattle({ ...base, attacker: { squads: [sq("a1", "footman", "lanceiro", 0), sq("a2", "footman", "lanceiro", 2)] } });
    const near = resolveTacticalBattle({ ...base, attacker: { squads: [sq("a1", "footman", "lanceiro", 0), sq("a2", "footman", "lanceiro", 1)] } });
    expect(far.lanes[0].attackerScore).toBeGreaterThan(alone.lanes[0].attackerScore);
    expect(near.lanes[0].attackerScore).toBeGreaterThan(far.lanes[0].attackerScore);
    expect(far.lanes[0].factors.some((f) => f.kind == "far-flank")).toBe(true);
  });

  it("faixa sem inimigo não conta como vitória", () => {
    const r = resolveTacticalBattle({
      field: "planicie",
      attacker: { squads: [sq("a1", "footman", "lanceiro", 0), sq("a2", "footman", "lanceiro", 2)] },
      defender: { squads: [sq("d1", "footman", "lanceiro", 2), sq("d2", "footman", "arqueiro", 1, "tras")] }
    });
    expect(r.lanes[0].winner).toBeNull();
    expect(r.lanesWon.attacker + r.lanesWon.defender).toBeLessThanOrEqual(2);
  });

  it("se ninguém se encontrar, os exércitos lutam no centro", () => {
    const r = resolveTacticalBattle({
      field: "planicie",
      attacker: { squads: [sq("a", "footman", "arqueiro", 0, "tras")] },
      defender: { squads: [sq("d", "footman", "lanceiro", 2)] }
    });
    expect(r.metInCenter).toBe(true);
    expect(r.lanes[1].winner).toBe("attacker");
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
    expect(sem.lanes[0].factors.some((f) => f.kind == "wall")).toBe(true);
    expect(com.lanes[0].factors.some((f) => f.kind == "wall-breach")).toBe(true);
    expect(com.lanes[0].factors.some((f) => f.kind == "wall")).toBe(false);
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

  it("a força no mini-mapa é a mesma do tabuleiro (soldado 1, cavaleiro 2)", () => {
    expect(squadValue(sq("a", "footman", "lanceiro", 1))).toBe(1);
    expect(squadValue(sq("b", "knight", "cavalaria", 1))).toBe(2);
  });

  it("a pedra-papel-tesoura é suavizada, mas o dragão continua inteiro", () => {
    expect(COUNTER_SCALE).toBeLessThan(1);
    expect(advantage("arqueiro", "escudeiro")).toBeCloseTo(1 + (0.6 - 1) * COUNTER_SCALE);
    expect(advantage("dragao", "lanceiro")).toBe(ADVANTAGE.dragao.lanceiro);
  });

  it("reação: só 1 esquadrão pode mudar, e a guarnição não sai do lugar", () => {
    const base: Squad[] = [sq("a", "footman", "arqueiro", 0, "tras"), sq("b", "footman", "escudeiro", 1), { ...sq("g", "garrison", "torre", 1, "tras"), strength: 2 }];
    expect(isValidReaction(base, base, "planicie")).toBe(true);
    expect(isValidReaction(base, [{ ...base[0], role: "lanceiro", lane: 2, row: "frente" }, base[1], base[2]], "planicie")).toBe(true);
    expect(isValidReaction(base, [{ ...base[0], role: "lanceiro" }, { ...base[1], lane: 2 }, base[2]], "planicie")).toBe(false);
    expect(isValidReaction(base, [base[0], base[1], { ...base[2], lane: 0 }], "planicie")).toBe(false);
    expect(isValidReaction(base, [{ ...base[0], role: "cavalaria" }, base[1], base[2]], "planicie")).toBe(false);
  });

  it("formação: corpo a corpo na frente + arqueiro atrás rende mais que tudo na frente", () => {
    const def = [sq("d0", "footman", "lanceiro", 1), sq("d1", "footman", "lanceiro", 1)];
    const misto = resolveTacticalBattle({ field: "planicie", attacker: { squads: [sq("a0", "footman", "escudeiro", 1), sq("a1", "footman", "arqueiro", 1, "tras")] }, defender: { squads: def } });
    expect(misto.lanes[1].factors.some((f) => f.side == "attacker" && f.kind == "formation")).toBe(true);
    const so = resolveTacticalBattle({ field: "planicie", attacker: { squads: [sq("a0", "footman", "escudeiro", 1), sq("a1", "footman", "escudeiro", 1)] }, defender: { squads: def } });
    expect(so.lanes[1].factors.some((f) => f.kind == "formation")).toBe(false);
  });

  it("empate: duelo de campeões, vence quem tem a Lâmina de Aço Valiriano (+1)", () => {
    const A = [sq("a0", "footman", "escudeiro", 1)];
    const D = [sq("d0", "footman", "escudeiro", 1)];
    const sem = resolveTacticalBattle({ field: "planicie", attacker: { squads: A }, defender: { squads: D } });
    expect(sem.winner).toBeNull();
    const com = resolveTacticalBattle({ field: "planicie", attacker: { squads: A }, defender: { squads: D }, bladeHolder: "attacker" });
    expect(com.winner).toBe("attacker");
    expect(com.bonus).toBe(1);
    expect(com.duel).toBe(true);
  });

  it("ordem de batalha: parede segura a carga, cercar vence a parede, carga vence o cercar", () => {
    const A: Squad[] = [sq("a0", "footman", "escudeiro", 1), sq("a1", "footman", "escudeiro", 0)];
    const D: Squad[] = [{ ...sq("d0", "knight", "cavalaria", 1) }, sq("d1", "footman", "lanceiro", 0)];
    const r = resolveTacticalBattle({ field: "planicie", attacker: { squads: A, tactic: "parede" }, defender: { squads: D, tactic: "carga" } });
    expect(r.tactics?.attacker.bonus).toBeCloseTo(0.12);
    expect(r.tactics?.attacker.countered).toBe(false);
    expect(r.tactics?.defender.countered).toBe(true);
    const r2 = resolveTacticalBattle({ field: "planicie", attacker: { squads: A, tactic: "parede" }, defender: { squads: D, tactic: "cercar" } });
    expect(r2.tactics?.attacker.countered).toBe(true);
    expect(r2.tactics?.defender.bonus).toBeCloseTo(0.06); // 1 lanceiro, tropas em 2 faixas
    // sem as tropas certas, a tática não dá nada
    const r3 = resolveTacticalBattle({ field: "planicie", attacker: { squads: A, tactic: "carga" }, defender: { squads: D } });
    expect(r3.tactics?.attacker.bonus).toBe(0);
  });
});
