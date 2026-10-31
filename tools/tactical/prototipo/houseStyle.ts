/**
 * Como se vestem os soldados de cada Casa (pesquisa: livros de George R. R. Martin / A Wiki of Ice and Fire,
 * e o figurino da série). Usado para desenhar soldados e cavaleiros em pixel art no mesmo modelo,
 * mudando metal, capa, elmo, escudo e brasão:
 *  - Stark: cota de malha e capacete de aço simples, capa de lã cinza com borda branca e gola de pele;
 *    escudo redondo de madeira (nortenhos). Mais couro e pele que placa.
 *  - Lannister: armadura com dourado, capa carmesim ("mantos vermelhos"), elmo com crista de leão.
 *  - Baratheon: aço escuro, sobreveste amarela com o veado preto; cavaleiros com elmo de galhadas (como Robert).
 *  - Greyjoy (filhos do ferro): ferro escuro e couro, sem capa, braços de fora, machado; lula dourada no preto.
 *  - Tyrell: armadura esmaltada de verde com dourado, pluma, rosa dourada no escudo.
 *  - Martell (Dorne): armadura leve de escamas de cobre, sedas cor de areia, elmo com pano enrolado,
 *    escudo redondo com o sol; lança comprida.
 *  - Arryn (Vale): aço claro brilhante, capa azul-céu com borda creme, elmo com asas de falcão, lua no escudo.
 *  - Targaryen: armadura negra com detalhes vermelhos, elmo com asas de dragão, dragão vermelho no escudo.
 */
import { House } from "./data";

export type Helm = "cap" | "lion" | "antler" | "iron" | "plume" | "wrap" | "wings" | "dragon";
export type ShieldShape = "round" | "heater" | "kite";
export type Glyph = "wolf" | "lion" | "stag" | "kraken" | "rose" | "sun" | "moon" | "dragon";

export interface HouseStyle {
  /** metal: claro, médio, escuro */
  metal: [string, string, string];
  /** detalhe/realce do metal (ouro, prata, vermelho…) */
  trim: string;
  /** capa (nenhuma = sem capa) */
  cloak: string | null;
  cloakTrim?: string;
  fur?: boolean;
  /** braços de fora (armadura leve) */
  bare?: boolean;
  /** pano/seda por cima (Dorne) */
  silk?: string;
  helm: Helm;
  /** elmo do cavaleiro (pode ser mais enfeitado que o do soldado) */
  knightHelm: Helm;
  shield: ShieldShape;
  /** campo do escudo e cor do brasão */
  field: string;
  charge: string;
  glyph: Glyph;
  /** escudeiro usa machado em vez de espada */
  axe?: boolean;
}

const STYLES: Record<string, HouseStyle> = {
  Stark: { metal: ["#b9bec4", "#8a9097", "#5c6168"], trim: "#e8e6df", cloak: "#5f625f", cloakTrim: "#e8e6df", fur: true, helm: "cap", knightHelm: "cap", shield: "round", field: "#9a9d9e", charge: "#f0eee8", glyph: "wolf" },
  Lannister: { metal: ["#e8c766", "#b8913a", "#7a5b1c"], trim: "#f4dc8a", cloak: "#a8202a", cloakTrim: "#e8c766", helm: "lion", knightHelm: "lion", shield: "heater", field: "#b3222c", charge: "#f0c95a", glyph: "lion" },
  Baratheon: { metal: ["#6f7378", "#4a4d52", "#2c2e31"], trim: "#e0b236", cloak: null, helm: "cap", knightHelm: "antler", shield: "heater", field: "#e0b236", charge: "#1c1a18", glyph: "stag" },
  Greyjoy: { metal: ["#5f666c", "#40464b", "#25292c"], trim: "#d8b04a", cloak: null, bare: true, helm: "iron", knightHelm: "iron", shield: "round", field: "#1e2124", charge: "#d8b04a", glyph: "kraken", axe: true },
  Tyrell: { metal: ["#a9c99a", "#6f9a5f", "#3f6436"], trim: "#e6c75a", cloak: "#2f6a28", cloakTrim: "#e6c75a", helm: "plume", knightHelm: "plume", shield: "heater", field: "#3f8a36", charge: "#f0d060", glyph: "rose" },
  Martell: { metal: ["#e0a46a", "#b87a3e", "#7c4c22"], trim: "#f2c45a", cloak: null, bare: true, silk: "#e8d2a2", helm: "wrap", knightHelm: "wrap", shield: "round", field: "#e5832b", charge: "#c8281e", glyph: "sun" },
  Arryn: { metal: ["#e4e9ee", "#b4bcc4", "#7a838c"], trim: "#f2ede0", cloak: "#4690cc", cloakTrim: "#f2ede0", helm: "wings", knightHelm: "wings", shield: "kite", field: "#4690cc", charge: "#f4f4f0", glyph: "moon" },
  Targaryen: { metal: ["#4a4448", "#2c282b", "#161415"], trim: "#c4282c", cloak: "#2a1416", cloakTrim: "#c4282c", helm: "dragon", knightHelm: "dragon", shield: "kite", field: "#1c1a1b", charge: "#d0302c", glyph: "dragon" }
};

export function styleOf(h: House): HouseStyle {
  return STYLES[h.name] ?? STYLES.Stark;
}

/**
 * Brasões em 7×7 pixels ("#" = cor do brasão). Pequenos, mas dá para reconhecer a forma.
 */
const GLYPHS: Record<Glyph, string[]> = {
  wolf: ["#.....#", "##...##", ".#####.", ".#.#.#.", ".#####.", "..###..", "...#..."],
  lion: [".###...", "#####..", "##.###.", "#####..", ".####.#", ".#.#.##", ".#.#..."],
  stag: ["#.#.#.#", "#.#.#.#", ".##.##.", "...#...", "..###..", "..###..", "...#..."],
  kraken: ["..###..", ".#####.", ".#.#.#.", ".#####.", "#.#.#.#", "#.#.#.#", ".#.#.#."],
  rose: ["..#.#..", ".#####.", "##.#.##", ".#####.", "..###..", "...#...", "..##..."],
  sun: ["#..#..#", ".#.#.#.", "..###..", "#######", "..###..", ".#.#.#.", "#..#..#"],
  moon: ["..###..", ".##....", "##.....", "##.....", "##.....", ".##....", "..###.."],
  dragon: ["#.#.#..", ".###...", "..###.#", "..#####", ".####..", "#.#.#..", "..#.#.."]
};

/** As linhas do brasão (7×7, "#" = cor), para quem desenha linha por linha (bandeira tremulando). */
export function glyphRows(g: Glyph): string[] {
  return GLYPHS[g];
}

/**
 * Cores do estandarte de cada Casa (31/out, estilo dos estandartes em pixel art: pano comprido pendurado numa
 * travessa, ponta embaixo com franja). Desenho nosso; só as cores e o bicho de cada Casa.
 */
export const BANNERS: Record<string, { field: string; charge: string; edge: string; fringe: string; charge2?: string; band?: string }> = {
  Stark: { field: "#ecebe6", charge: "#6f757b", edge: "#b9bec4", fringe: "#c9ccd0" },
  Lannister: { field: "#b3222c", charge: "#f0c95a", edge: "#8f1820", fringe: "#e8c766", charge2: "#c8902c", band: "#e8c766" },
  Baratheon: { field: "#e8b923", charge: "#1d1a17", edge: "#a37e10", fringe: "#2a2622" },
  Greyjoy: { field: "#1f2226", charge: "#d9b13f", edge: "#0f1113", fringe: "#d9b13f" },
  Tyrell: { field: "#3f8a3a", charge: "#f0cf4a", edge: "#285a25", fringe: "#e7e3d0" },
  Martell: { field: "#e5801f", charge: "#b8261a", edge: "#a2540f", fringe: "#f2c14b" },
  Arryn: { field: "#3c6db4", charge: "#f3f1e8", edge: "#244878", fringe: "#d8dde4" },
  Targaryen: { field: "#1b1716", charge: "#cf2a20", edge: "#0b0a09", fringe: "#cf2a20" }
};

/**
 * Brasões grandes (13 × 13) para o estandarte (31/out). Desenho nosso, no estilo dos estandartes em pixel art
 * que o Agostinho mandou de referência (não copia a imagem).
 */
const SIGILS: Record<string, string[]> = {
  Stark: [".#.........#.", ".##.......##.", ".###.....###.", ".###########.", "..#########..", "..##.###.##..", "..#########..", "...#######...", "....#####....", "....##.##....", ".....###.....", "......#......"],
  Lannister: ["...++++......", "..++++++.....", ".++#.##++....", "###.####+...#", ".#####+++..#.", "..#.#++++..#.", "##..######.#.", ".##.#######.#", "..##########.", ".....######..", "....#######..", "...###..###..", "..##....###..", ".##......##..", "##......###.."],
  Baratheon: ["#..#.....#..#", "#.#.#...#.#.#", ".##.#...#.##.", "..###...###..", "....#####....", "...#######...", "...##.#.##...", "...#######...", "....#####....", "....#####....", ".....###.....", ".....###.....", "......#......"],
  Greyjoy: ["....#####....", "...#######...", "..##.###.##..", "..#########..", "...#######...", "..#.#.#.#.#..", ".#.#..#..#.#.", ".#..#.#.#..#.", "#..#..#..#..#", "#..#.....#..#", ".#..#...#..#.", "..#.......#.."],
  Tyrell: [".....###.....", "...##...##...", "..#..###..#..", ".#..#...#..#.", ".#.#.###.#.#.", ".#.#.#.#.#.#.", ".#..#.#.#..#.", "..#..###..#..", "...##...##...", ".....###.....", "......#......", "....###.##...", "......#......"],
  Martell: ["#.....#.....#", ".#....#....#.", "..#..###..#..", "....#####....", "...#######...", "#.#########.#", "...#######...", "....#####....", "..#..###..#..", ".#....#....#.", "#.....#.....#"],
  Arryn: ["....####.....", "..###....#...", ".##.....###..", ".##...#.###.#", "##....#######", "##.....#####.", "##......###..", ".##.....#.#..", ".##.....#.#..", "..###........", "....####....."],
  Targaryen: ["#...#...#....", "##.###.##....", ".#######.....", "..#####..#...", "...######.#..", "..########...", ".##.####.....", "##..####.....", "#...#..#.....", "...##..##...."]
};

/** Letras 5 × 7 (a inicial da Casa no alto do estandarte). */
const LETTERS: Record<string, string[]> = {
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  G: [".####", "#....", "#....", "#..##", "#...#", "#...#", ".###."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"]
};

export const SIGIL_H = 15;
/** Brasão do estandarte, sempre 13 × 15 (completa com linhas vazias, centralizado). */
export function bannerSigil(house: string): string[] {
  const g = SIGILS[house] ?? SIGILS.Stark;
  const rows = g.map((r) => r.padEnd(13, ".").slice(0, 13));
  const top = Math.floor((SIGIL_H - rows.length) / 2);
  return [...Array(top).fill(".".repeat(13)), ...rows, ...Array(SIGIL_H - rows.length - top).fill(".".repeat(13))];
}
export function bannerLetter(house: string): string[] {
  return LETTERS[house[0]] ?? LETTERS.S;
}

/** Desenha o brasão (7×7) em (x, y), com 1 px por ponto. */
export function drawGlyph(ctx: CanvasRenderingContext2D, g: Glyph, x: number, y: number, color: string, scale = 1): void {
  ctx.fillStyle = color;
  GLYPHS[g].forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] == "#") ctx.fillRect(Math.round(x + i * scale), Math.round(y + j * scale), Math.ceil(scale), Math.ceil(scale));
  });
}
