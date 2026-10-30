/**
 * Combate tático: qual campo de batalha cada área do tabuleiro usa.
 *
 * - Mar: sempre "mar".
 * - Terra com castelo (nível atual): Castelo (1) ou Fortaleza (2). Se uma carta
 *   destruir o castelo, a área volta para o terreno dela abaixo.
 * - Terra sem castelo: o terreno de cada área, escolhido pelo desenho do mapa e
 *   pela história (lista aprovada pelo Agostinho; ajustar aqui).
 */
import { FieldType } from "./tacticalBattleData";

export const REGION_TERRAIN: Record<string, FieldType> = {
  // Norte
  "castle-black": "planicie",
  karhold: "planicie",
  "the-stony-shore": "montanha",
  "white-harbor": "rio",
  "widows-watch": "planicie",
  "moat-cailin": "rio",
  "greywater-watch": "rio",
  "flints-finger": "montanha",
  winterfell: "floresta",
  // Terras dos Rios e Ilhas de Ferro
  "the-twins": "rio",
  seagard: "planicie",
  riverrun: "rio",
  harrenhal: "rio",
  "stoney-sept": "planicie",
  pyke: "montanha",
  // Oeste
  lannisport: "planicie",
  "searoad-marches": "planicie",
  // Vale
  "the-eyrie": "montanha",
  "the-mountains-of-the-moon": "montanha",
  "the-fingers": "montanha",
  "the-vale-of-arryn": "planicie",
  // Terras da Coroa e da Tempestade
  "crackclaw-point": "floresta",
  blackwater: "rio",
  "kings-landing": "planicie",
  kingswood: "floresta",
  dragonstone: "montanha",
  "storms-end": "floresta",
  // Campina
  "the-reach": "planicie",
  highgarden: "planicie",
  oldtown: "planicie",
  "the-arbor": "planicie",
  "three-towers": "planicie",
  // Dorne
  "dornish-marches": "montanha",
  "the-boneway": "montanha",
  "princes-pass": "montanha",
  starfall: "rio",
  yronwood: "montanha",
  "salt-shore": "planicie",
  sunspear: "planicie",
  // Essos (Mãe dos Dragões)
  braavos: "rio",
  pentos: "planicie",
  myr: "planicie",
  norvos: "montanha",
  volantis: "rio",
  "the-disputed-lands": "planicie",
  "the-rhoyne": "rio"
};

/** Campo da batalha numa área, conforme o tipo dela e o nível ATUAL do castelo. */
export function getBattleField(regionId: string, isSea: boolean, castleLevel: number): FieldType {
  if (isSea) return "mar";
  if (castleLevel >= 2) return "fortaleza";
  if (castleLevel == 1) return "castelo";
  return REGION_TERRAIN[regionId] ?? "planicie";
}
