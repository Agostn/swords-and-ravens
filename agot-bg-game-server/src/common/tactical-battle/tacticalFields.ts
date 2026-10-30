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
  "castle-black": "planicie", // a Muralha fica ao norte; o castelo não tem muralha própria
  karhold: "floresta", // à beira de um rio arborizado
  "the-stony-shore": "colinas", // costa de seixos; para dentro, colinas e lagos
  "white-harbor": "rio", // foz do Faca Branca
  "widows-watch": "planicie", // ponta de península na costa
  "moat-cailin": "pantano", // o Gargalo
  "greywater-watch": "pantano", // o Gargalo (cranogmanos)
  "flints-finger": "colinas", // península rochosa
  winterfell: "floresta", // Mata dos Lobos
  // Terras dos Rios e Ilhas de Ferro
  "the-twins": "rio",
  seagard: "planicie",
  riverrun: "rio",
  harrenhal: "rio", // margem do lago Olho de Deus
  "stoney-sept": "colinas", // cidade murada num morro, perto do Bosque dos Três Tostões
  pyke: "montanha",
  // Oeste
  lannisport: "planicie",
  "searoad-marches": "colinas", // colinas do Oeste até a Campina
  // Vale
  "the-eyrie": "montanha",
  "the-mountains-of-the-moon": "montanha",
  "the-fingers": "colinas", // pedregoso, sem árvores e varrido pelo vento
  "the-vale-of-arryn": "planicie",
  // Terras da Coroa e da Tempestade
  "crackclaw-point": "floresta", // vales, brejos e mata fechada
  blackwater: "rio",
  "kings-landing": "planicie",
  kingswood: "floresta",
  dragonstone: "montanha",
  "storms-end": "floresta", // Mata da Chuva
  // Campina
  "the-reach": "planicie",
  highgarden: "planicie",
  oldtown: "planicie",
  "the-arbor": "planicie",
  "three-towers": "planicie",
  // Dorne
  "dornish-marches": "planicie", // campo aberto de capim e charneca
  "the-boneway": "montanha",
  "princes-pass": "montanha",
  starfall: "rio", // foz do Torrentine
  yronwood: "deserto", // leste de Dorne: seco e pedregoso
  "salt-shore": "deserto",
  sunspear: "deserto",
  // Essos (Mãe dos Dragões)
  braavos: "rio",
  pentos: "planicie",
  myr: "planicie", // costa fértil
  norvos: "colinas", // Colinas de Norvos, à beira do Noyne
  volantis: "rio",
  "the-disputed-lands": "planicie", // capim seco, terra arrasada
  "the-rhoyne": "rio"
};

/** Campo da batalha numa área, conforme o tipo dela e o nível ATUAL do castelo. */
export function getBattleField(regionId: string, isSea: boolean, castleLevel: number): FieldType {
  if (isSea) return "mar";
  if (castleLevel >= 2) return "fortaleza";
  if (castleLevel == 1) return "castelo";
  return REGION_TERRAIN[regionId] ?? "planicie";
}
