/**
 * Simulador de equilíbrio do combate tático.
 *
 * Para cada cenário (campo + exércitos + cartas), procura o jeito ÓTIMO de os
 * dois lados posicionarem (equilíbrio de Nash aproximado, "double oracle"):
 * cada lado escolhe a melhor resposta contra a mistura de jogadas do outro,
 * até ninguém conseguir melhorar. Mostra:
 *  - valor: bônus médio do atacante jogando bem dos dois lados (−2..+2);
 *  - quanto cada lado vence o mini-mapa;
 *  - quanto cada função do soldado é usada (nenhuma pode ficar "morta").
 *
 * Uso (na pasta agot-bg-game-server):
 *   npx ts-node -T ../tools/tactical/equilibrio.ts            (todos os cenários)
 *   npx ts-node -T ../tools/tactical/equilibrio.ts planicie   (só os que contêm o texto)
 */
import { Piece, Scenario, solveScenario } from "./solver";
import { FieldType } from "../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";

export { solveScenario };

// ---------------- cenários ----------------
const F: Piece = { kind: "footman" };
const K: Piece = { kind: "knight" };
const S: Piece = { kind: "siege-engine" };
const SH: Piece = { kind: "ship" };
const G = (strength: number): Piece => ({ kind: "garrison", strength, fixed: { lane: 1, row: "tras", role: "torre" } });
const rep = (p: Piece, n: number): Piece[] => new Array(n).fill(p);

export const SCENARIOS: Scenario[] = [];
const fields: FieldType[] = ["planicie", "colinas", "floresta", "montanha", "rio", "pantano", "deserto", "castelo", "fortaleza"];
for (const field of fields) {
  SCENARIOS.push({ name: `${field}: 2 soldados x 2 soldados`, field, attacker: rep(F, 2), defender: rep(F, 2) });
  SCENARIOS.push({ name: `${field}: 1 sold+1 cav x 1 sold+1 cav`, field, attacker: [F, K], defender: [F, K] });
  SCENARIOS.push({ name: `${field}: 3 soldados x 1 sold+1 cav`, field, attacker: rep(F, 3), defender: [F, K] });
  SCENARIOS.push({ name: `${field}: 2 sold+1 cav x 2 soldados`, field, attacker: [F, F, K], defender: rep(F, 2) });
  SCENARIOS.push({ name: `${field}: 1 soldado x 3 soldados`, field, attacker: [F], defender: rep(F, 3) });
  SCENARIOS.push({ name: `${field}: 4 soldados x 2 soldados`, field, attacker: rep(F, 4), defender: rep(F, 2) });
  SCENARIOS.push({ name: `${field}: 2 cavaleiros x 3 soldados`, field, attacker: rep(K, 2), defender: rep(F, 3) });
}
SCENARIOS.push({ name: "castelo: 2 sold+1 cerco x 2 soldados", field: "castelo", attacker: [F, F, S], defender: rep(F, 2) });
SCENARIOS.push({ name: "castelo: 2 sold+1 cerco x 3 soldados", field: "castelo", attacker: [F, F, S], defender: rep(F, 3) });
SCENARIOS.push({ name: "fortaleza: 1 sold+1 cerco x 3 soldados", field: "fortaleza", attacker: [F, S], defender: rep(F, 3) });
SCENARIOS.push({ name: "planicie: 2 sold+1 cerco x 2 soldados (cerco vale 0)", field: "planicie", attacker: [F, F, S], defender: rep(F, 2) });
SCENARIOS.push({ name: "planicie: Marcha +1 x Defesa +1 (2 sold x 2 sold)", field: "planicie", attacker: rep(F, 2), defender: rep(F, 2), attackerOrder: 1, defenderOrder: 1 });
SCENARIOS.push({ name: "planicie: Marcha +1 x sem ordem (2 sold x 2 sold)", field: "planicie", attacker: rep(F, 2), defender: rep(F, 2), attackerOrder: 1 });
SCENARIOS.push({ name: "planicie: Marcha -1 x Defesa +2 (2 sold x 2 sold)", field: "planicie", attacker: rep(F, 2), defender: rep(F, 2), attackerOrder: -1, defenderOrder: 2 });
SCENARIOS.push({ name: "rio: 2 sold + apoio de navio x 2 sold", field: "rio", attacker: [F, F, { kind: "ship", support: true }], defender: rep(F, 2) });
SCENARIOS.push({ name: "fortaleza: 2 sold+1 cerco x 2 sold + guarnição 2", field: "fortaleza", attacker: [F, F, S], defender: [F, F, G(2)] });
SCENARIOS.push({ name: "fortaleza: 3 soldados x 2 sold + guarnição 2", field: "fortaleza", attacker: rep(F, 3), defender: [F, F, G(2)] });
SCENARIOS.push({ name: "planicie: dragão (força 2) x 2 soldados", field: "planicie", attacker: [{ kind: "dragon", strength: 2 }], defender: rep(F, 2) });
SCENARIOS.push({ name: "planicie: 2 sold + 1 apoio x 3 soldados", field: "planicie", attacker: [F, F, { kind: "footman", support: true }], defender: rep(F, 3) });
SCENARIOS.push({ name: "mar: 2 navios x 2 navios", field: "mar", attacker: rep(SH, 2), defender: rep(SH, 2) });
SCENARIOS.push({ name: "mar: 3 navios x 1 navio", field: "mar", attacker: rep(SH, 3), defender: [SH] });
SCENARIOS.push({
  name: "planicie: cartas 3⚔ x 0 (2 sold x 2 sold)",
  field: "planicie",
  attacker: rep(F, 2),
  defender: rep(F, 2),
  attackerCard: { strength: 3, swords: 1, towers: 0 },
  defenderCard: { strength: 0, swords: 0, towers: 0 }
});
SCENARIOS.push({
  name: "planicie: cartas 4 x 1▲▲ (1sold+1cav x 1sold+1cav)",
  field: "planicie",
  attacker: [F, K],
  defender: [F, K],
  attackerCard: { strength: 4, swords: 0, towers: 0 },
  defenderCard: { strength: 1, swords: 0, towers: 2 }
});

if (require.main === module) {
  const filter = process.argv[2];
  const list = SCENARIOS.filter((s) => !filter || s.name.includes(filter));
  const pct = (v: number) => `${Math.round(v * 100)}%`.padStart(4);
  for (const sc of list) {
    const r = solveScenario(sc);
    const roles = Object.entries(r.roles)
      .map(([k, v]) => `${k} ${v.toFixed(2)}`)
      .join(", ");
    console.log(
      `${r.name.padEnd(52)} valor ${r.value >= 0 ? "+" : ""}${r.value.toFixed(2)} | ótimo: atac ${pct(r.attackerWins)} def ${pct(r.defenderWins)} emp ${pct(r.draws)} | chute: atac ${pct(r.random.attacker)} def ${pct(r.random.defender)} emp ${pct(r.random.draw)} | ${roles}`
    );
  }
}
