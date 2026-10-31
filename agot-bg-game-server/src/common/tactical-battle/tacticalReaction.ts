/**
 * Corvo Mensageiro no combate tático: quem tem o Corvo (topo da trilha da Corte do Rei) vê o
 * exército do outro depois de os dois posicionarem e pode mudar UM esquadrão — de lugar
 * (faixa/linha) e/ou de função. Só ele. (Testamos os dois lados mudarem: ficou confuso.)
 * O servidor usa isValidReaction para não aceitar trapaça.
 */
import { Squad } from "./tacticalBattle";
import { ROLES_BY_KIND, FIELD_LANES, FieldType, rolesFor } from "./tacticalBattleData";

/** Quantos esquadrões quem tem o Corvo pode mudar. */
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
