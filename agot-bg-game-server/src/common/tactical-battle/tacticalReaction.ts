/**
 * Reação (depois da revelação): os dois exércitos aparecem e cada lado pode mudar
 * UM esquadrão — de lugar (faixa/linha) e/ou de função. Quem defende muda primeiro;
 * quem ataca responde por último (ele escolheu onde atacar; o defensor já tem
 * terreno, muralha e ordem de Defesa a seu favor).
 *
 * Isto tira o "chute": quem escolheu mal pode consertar uma parte, e quem lê melhor
 * o campo leva vantagem. O servidor usa isValidReaction para não aceitar trapaça.
 */
import { Side, Squad } from "./tacticalBattle";
import { ROLES_BY_KIND, FIELD_LANES, FieldType, rolesFor } from "./tacticalBattleData";

export const REACTION_ORDER: Side[] = ["defender", "attacker"];

/** Quantos esquadrões cada lado pode mudar na reação. */
export const REACTION_CHANGES = 1;

const same = (a: Squad, b: Squad): boolean => a.lane == b.lane && a.row == b.row && a.role == b.role;

/** ids dos esquadrões que mudaram (lugar ou função). */
export function changedSquads(before: Squad[], after: Squad[]): string[] {
  return after.filter((s) => {
    const b = before.find((x) => x.id == s.id);
    return !b || !same(b, s);
  }).map((s) => s.id);
}

/** A reação é válida? Mesmos esquadrões, no máximo REACTION_CHANGES mudados, função e faixa permitidas. */
export function isValidReaction(before: Squad[], after: Squad[], field: FieldType): boolean {
  if (before.length != after.length) return false;
  for (const s of after) {
    const b = before.find((x) => x.id == s.id);
    if (!b || b.kind != s.kind || !!b.support != !!s.support || (b.strength ?? null) != (s.strength ?? null)) return false;
    if (!rolesFor(s.kind, field == "mar").includes(s.role) && !ROLES_BY_KIND[s.kind].includes(s.role)) return false;
    if (FIELD_LANES[field][s.lane] == "bloqueado") return false;
    // guarnição não sai do lugar
    if (s.kind == "garrison" && !same(b, s)) return false;
  }
  return changedSquads(before, after).length <= REACTION_CHANGES;
}
