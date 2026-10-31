/**
 * Sprites em pixel art: soldados vêm da imagem (arte/), com as cores trocadas
 * para a Casa; cavalo, máquina de cerco, torre e navio são desenhados e "pixelados" no
 * mesmo tamanho de pixel, para ficar tudo no mesmo estilo.
 *
 * Todas as funções devolvem um canvas pequeno (1 px = 1 pixel da arte) virado para a
 * ESQUERDA, com os pés no ponto (ax, ay).
 */
import { Role } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { soldiersImage } from "./assets";
import { House } from "./data";

export interface Sprite {
  c: HTMLCanvasElement;
  ax: number;
  ay: number;
}

type RGB = [number, number, number];

const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mixc = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;
const key = (r: number, g: number, b: number): number => (r << 16) | (g << 8) | b;

/** Tons da Casa: -2 bem escuro … 2 bem claro. */
function teamTone(h: House, level: number): RGB {
  const c = hex(h.color);
  const d = hex(h.dark);
  if (level <= -2) return mixc(d, [0, 0, 0], 0.35);
  if (level <= -1) return d;
  if (level < 0) return mixc(c, d, 0.5);
  if (level == 0) return c;
  if (level < 1.5) return mixc(c, [255, 255, 255], 0.28);
  return mixc(c, [255, 255, 255], 0.5);
}

// recortes da folha de soldados (arte/soldados.png): 4 células de 26 × 34
const CELL = { capuz: 0, escudo: 1, golpe: 2, lanca: 3 } as const;
const CELL_SIZE: Record<keyof typeof CELL, [number, number]> = { capuz: [19, 32], escudo: [19, 34], golpe: [25, 34], lanca: [19, 32] };

// cores da arte original que viram a cor da Casa (valor = tom)
const TEAM: Record<keyof typeof CELL, [number, number][]> = {
  capuz: [
    [key(112, 110, 136), 1],
    [key(100, 99, 133), 0],
    [key(100, 96, 134), 0],
    [key(83, 81, 106), -0.5],
    [key(82, 80, 107), -0.5]
  ],
  escudo: [
    [key(59, 82, 131), 0],
    [key(50, 68, 107), -1],
    [key(226, 226, 226), 1],
    [key(181, 177, 177), 0],
    [key(191, 0, 0), -1],
    [key(154, 4, 4), -2]
  ],
  golpe: [
    [key(59, 82, 131), 0],
    [key(50, 68, 107), -1],
    [key(226, 226, 226), 1],
    [key(181, 177, 177), 0],
    [key(191, 0, 0), -1],
    [key(154, 4, 4), -2]
  ],
  lanca: [
    [key(186, 184, 58), 0],
    [key(52, 88, 136), -1],
    [key(96, 133, 181), -0.5]
  ]
};
// cores do escudo (pintado com as cores da Casa)
const SHIELD_FACE = [key(93, 98, 110), key(81, 86, 99), key(71, 78, 90), key(70, 76, 89), key(74, 80, 93), key(79, 84, 97), key(86, 91, 102)];
// espada que sai (lanceiro e arqueiro trocam por lança e arco)
const SWORD = [key(167, 168, 169), key(131, 132, 133)];

const OUTLINE: RGB = [26, 18, 12];
const PAD = 42;

function newCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

/** Contorno escuro de 1 px em volta (ajuda a ler em cima da grama). */
function addOutline(c: HTMLCanvasElement): void {
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const w = c.width;
  const h = c.height;
  const solid = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 110;
  const out: number[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) out.push(y * w + x);
    }
  for (const i of out) {
    d[i * 4] = OUTLINE[0];
    d[i * 4 + 1] = OUTLINE[1];
    d[i * 4 + 2] = OUTLINE[2];
    d[i * 4 + 3] = 235;
  }
  ctx.putImageData(img, 0, 0);
}

/** Deixa um desenho suave com cara de pixel art: alfa 0/1 e cores em degraus. */
function crisp(c: HTMLCanvasElement): void {
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a < 100) {
      d[i + 3] = 0;
      continue;
    }
    for (let k = 0; k < 3; k++) {
      const v = Math.min(255, (d[i + k] * 255) / a);
      d[i + k] = Math.round(v / 12) * 12;
    }
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function line(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) px(ctx, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, color);
}

const cache = new Map<string, Sprite>();

/** Recorta e pinta um soldado da folha. */
function cellCanvas(cell: keyof typeof CELL, h: House, opts: { dropSword?: boolean; shieldTeam?: boolean } = {}): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const img = soldiersImage() as HTMLImageElement;
  const [w, hh] = CELL_SIZE[cell];
  const [c, ctx] = newCanvas(w + PAD * 2, hh + PAD + 4);
  ctx.drawImage(img, CELL[cell] * 26, 0, w, hh, PAD, PAD, w, hh);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const d = data.data;
  const team = new Map(TEAM[cell]);
  const sword = new Set(SWORD);
  const face = new Set(SHIELD_FACE);
  const ink = hex(h.ink);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] == 0) continue;
    const k = key(d[i], d[i + 1], d[i + 2]);
    let out: RGB | null = null;
    if (opts.dropSword && sword.has(k)) {
      d[i + 3] = 0;
      continue;
    }
    const lvl = team.get(k);
    if (lvl != null) out = teamTone(h, lvl);
    else if (opts.shieldTeam && face.has(k)) {
      // escudo: cor da Casa com uma faixa da cor de destaque no meio
      const x = (i / 4) % c.width;
      const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
      out = Math.abs(x - (PAD + 13)) < 1 ? ink : teamTone(h, lum > 82 ? 0.5 : lum > 75 ? 0 : -0.5);
    }
    if (out) {
      d[i] = out[0];
      d[i + 1] = out[1];
      d[i + 2] = out[2];
    }
  }
  ctx.putImageData(data, 0, 0);
  return [c, ctx];
}

/** Soldado a pé: lanceiro, escudeiro ou arqueiro (atk 0 = parado, 1 = golpe/tiro). */
/**
 * Soldado a pé: lanceiro, escudeiro ou arqueiro, em 4 poses de golpe (0 = parado … 3 = golpe esticado):
 * - lanceiro: lança em pé → inclinando → deitada → estocada (lança empurrada para a frente)
 * - escudeiro: espada para baixo → erguida → descendo → estocada passando o escudo
 * - arqueiro: arco parado → puxando → corda toda puxada (flecha armada) → corda solta
 */
export function soldierSprite(h: House, role: Role, frame: 0 | 1 | 2 | 3): Sprite | null {
  if (!soldiersImage()) return null;
  const id = `s|${h.name}|${role}|${frame}`;
  const hit = cache.get(id);
  if (hit) return hit;
  let c: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let ay: number;
  const wood = "#6e4a26";
  const woodD = "#40280f";
  const steel = "#d7dce0";
  const steelD = "#8a9298";
  const blade = (x0: number, y0: number, x1: number, y1: number): void => {
    // lâmina com fio claro e sombra
    line(ctx, x0, y0, x1, y1, "#e9edf0");
    line(ctx, x0, y0 + 1, x1, y1 + 1, "#8a9298");
  };
  if (role == "escudeiro") {
    // a arte original segura escudo e espada do lado direito: no fim espelhamos, para ele
    // olhar para o mesmo lado dos outros soldados (escudo e golpe virados para o inimigo)
    if (frame == 0) [c, ctx] = cellCanvas("escudo", h, { shieldTeam: true });
    else {
      [c, ctx] = cellCanvas("escudo", h, { shieldTeam: true, dropSword: true });
      const hx = PAD + 4;
      const hy = PAD + 18;
      if (frame == 1) {
        // erguida para trás, pronta para descer
        blade(hx, hy - 2, hx - 7, hy - 17);
        px(ctx, hx - 2, hy - 3, "#b08d3c", 4, 1);
      } else if (frame == 2) {
        // descendo na diagonal, para a frente
        blade(hx + 2, hy - 1, hx + 18, hy - 9);
        px(ctx, hx + 1, hy - 3, "#b08d3c", 1, 4);
      } else {
        // estocada: reta para a frente, passando o escudo
        px(ctx, hx + 1, hy - 2, "#b08d3c", 1, 5);
        blade(hx + 2, hy, hx + 24, hy);
        px(ctx, hx + 25, hy, "#e9edf0");
      }
      px(ctx, hx - 1, hy - 1, "#5a3d24", 2, 2); // mão/punho
    }
    ay = PAD + 34;
  } else if (role == "arqueiro" || role == "flechas") {
    [c, ctx] = cellCanvas("capuz", h, { dropSword: true });
    // aljava nas costas
    px(ctx, PAD + 11, PAD + 5, woodD, 2, 8);
    px(ctx, PAD + 11, PAD + 3, "#efe6d0");
    px(ctx, PAD + 12, PAD + 2, "#efe6d0");
    px(ctx, PAD + 12, PAD + 4, "#c9483a");
    // arco na mão da frente (à esquerda); puxado, ele enverga mais
    const bx = PAD - 2;
    const pull = [0, 3, 6, 0][frame];
    const top = PAD + 6 + (frame == 2 ? 1 : 0);
    const bot = PAD + 24 - (frame == 2 ? 1 : 0);
    const bendMax = frame == 2 ? 4 : frame == 1 ? 3.5 : 3;
    for (let y = top; y <= bot; y++) {
      const t = (y - top) / (bot - top);
      const bend = Math.round(Math.sin(t * Math.PI) * bendMax);
      px(ctx, bx - bend, y, y == top || y == bot ? woodD : wood);
    }
    const mid = Math.round((top + bot) / 2);
    if (frame == 3) {
      // corda solta: reta e vibrando para a frente
      line(ctx, bx - 1, top, bx - 2, mid, "#f2ead6");
      line(ctx, bx - 2, mid, bx - 1, bot, "#f2ead6");
    } else {
      line(ctx, bx, top, bx + 1 + pull, mid, "#f2ead6");
      line(ctx, bx + 1 + pull, mid, bx, bot, "#f2ead6");
    }
    if (frame == 1 || frame == 2) {
      line(ctx, bx - 5, mid, bx + pull, mid, "#e8dcc0");
      px(ctx, bx - 6, mid, steel);
      px(ctx, bx + pull, mid - 1, "#c9483a");
    }
    ay = PAD + 32;
  } else {
    // lanceiro: a lança gira em volta da mão, de pé até deitada, e na estocada vai para a frente
    [c, ctx] = cellCanvas("lanca", h, { dropSword: true });
    const ang = [0, 0.75, 1.45, 1.5][frame]; // radianos a partir de "em pé", inclinando para a frente (esquerda)
    const push = frame == 3 ? 7 : 0;
    const hx = PAD + 2;
    const hy = PAD + 16;
    const fx = -Math.sin(ang);
    const fy = -Math.cos(ang);
    const tipX = hx + fx * 28 - push * Math.sin(ang);
    const tipY = hy + fy * 28;
    const buttX = hx - fx * 13 - push * Math.sin(ang);
    const buttY = hy - fy * 13;
    line(ctx, Math.round(buttX), Math.round(buttY), Math.round(tipX), Math.round(tipY), woodD);
    line(ctx, Math.round(buttX + (frame == 0 ? 1 : 0)), Math.round(buttY + (frame == 0 ? 0 : -1)), Math.round(tipX + (frame == 0 ? 1 : 0)), Math.round(tipY + (frame == 0 ? 0 : -1)), wood);
    // ponta de ferro (losango na direção da lança)
    for (let k = 0; k < 4; k++) px(ctx, Math.round(tipX + fx * k), Math.round(tipY + fy * k), steel, 2, 2);
    px(ctx, Math.round(tipX + fx * 4), Math.round(tipY + fy * 4), steel);
    px(ctx, Math.round(tipX - fy * 1.5), Math.round(tipY + fx * 1.5), steelD);
    ay = PAD + 32;
  }
  addOutline(c);
  let out = { c, ax: PAD + 9, ay };
  if (role == "escudeiro") {
    const [m, mctx] = newCanvas(c.width, c.height);
    mctx.translate(c.width, 0);
    mctx.scale(-1, 1);
    mctx.drawImage(c, 0, 0);
    out = { c: m, ax: c.width - (PAD + 9), ay };
  }
  cache.set(id, out);
  return out;
}

/**
 * Pixela um desenho feito em vetor (1 unidade = 1 pixel). O desenho deve estar virado
 * para a ESQUERDA e com os pés em (ax, ay).
 */
export function pixelSprite(id: string, w: number, h: number, ax: number, ay: number, draw: (ctx: CanvasRenderingContext2D) => void): Sprite {
  const hit = cache.get(id);
  if (hit) return hit;
  const [c, ctx] = newCanvas(w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.translate(ax, ay);
  draw(ctx);
  crisp(c);
  addOutline(c);
  const s = { c, ax, ay };
  cache.set(id, s);
  return s;
}

/** Versão caída (deitada e mais escura). O cavalo não gira: só escurece (quem desenha inclina). */
export function fallenSprite(id: string, sp: Sprite, turn = true): Sprite {
  const hit = cache.get("x|" + id);
  if (hit) return hit;
  const [c, ctx] = turn ? newCanvas(sp.c.height, sp.c.width) : newCanvas(sp.c.width, sp.c.height);
  if (turn) {
    // gira 90° (deitado para a direita)
    ctx.translate(sp.c.height, 0);
    ctx.rotate(Math.PI / 2);
  }
  ctx.drawImage(sp.c, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] + d[i + 1] + d[i + 2]) / 3;
    d[i] = Math.round((d[i] * 0.5 + g * 0.5) * 0.62);
    d[i + 1] = Math.round((d[i + 1] * 0.5 + g * 0.5) * 0.58);
    d[i + 2] = Math.round((d[i + 2] * 0.5 + g * 0.5) * 0.56);
  }
  ctx.putImageData(img, 0, 0);
  // depois de girar, os pés (ax, ay) ficam em (H - ay, ax); o corpo deitado fica em cima da linha dos pés
  const s = turn ? { c, ax: sp.c.height - sp.ay, ay: sp.ax + 4 } : { c, ax: sp.ax, ay: sp.ay };
  cache.set("x|" + id, s);
  return s;
}

/** Silhueta branca (o "pisca" quando leva um golpe). */
export function whiteSprite(id: string, sp: Sprite): Sprite {
  const hit = cache.get("w|" + id);
  if (hit) return hit;
  const [c, ctx] = newCanvas(sp.c.width, sp.c.height);
  ctx.drawImage(sp.c, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  const s = { c, ax: sp.ax, ay: sp.ay };
  cache.set("w|" + id, s);
  return s;
}

// ---------------------------------------------------------------- navio (pixel art, de lado)
/**
 * Navio de lado (caravela/galé de Westeros), proa virada para a ESQUERDA:
 * casco de tábuas com friso dourado e escotilhas, castelo de popa, três mastros, velas creme com
 * faixa da Casa, bandeiras e cordas. Função: abordagem (ganchos), aríete (esporão de ferro), flechas (arqueiros).
 * frame 0/1: vela e bandeira mexendo.
 */
export function shipSprite(h: House, role: Role, frame: 0 | 1): Sprite {
  const id = `ship|${h.name}|${role}|${frame}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const [c, ctx] = newCanvas(104, 96);
  const team = hex(h.color);
  const teamD = hex(h.dark);
  const col = (k: RGB, f = 1): string => `rgb(${Math.min(255, Math.round(k[0] * f))},${Math.min(255, Math.round(k[1] * f))},${Math.min(255, Math.round(k[2] * f))})`;
  const deck = (x: number): number => (x >= 72 ? 52 : x < 24 ? 62 - (24 - x) * 0.45 : 62);
  const keel = (x: number): number => Math.round(78 - Math.pow((x - 52) / 41, 2) * 13);
  const W0 = 11;
  const W1 = 93;
  // mastros (atrás das velas)
  const mast = (x: number, top: number, bot: number): void => {
    px(ctx, x, top, "#5a3a1c", 2, bot - top);
    px(ctx, x, top, "#8a5e34", 1, bot - top);
  };
  mast(31, 24, 62);
  mast(52, 10, 62);
  mast(80, 24, 52);
  // cordas
  const rope = (x0: number, y0: number, x1: number, y1: number): void => line(ctx, x0, y0, x1, y1, "rgba(50,34,18,.75)");
  rope(52, 11, 14, 58);
  rope(52, 11, 90, 50);
  rope(31, 25, 6, 56);
  rope(80, 25, 92, 50);
  // velas
  const billow = frame ? 3 : 2;
  const squareSail = (x0: number, x1: number, y0: number, y1: number): void => {
    // verga
    px(ctx, x0 - 2, y0 - 1, "#5a3a1c", x1 - x0 + 5, 2);
    for (let y = y0; y <= y1; y++) {
      const u = (y - y0) / (y1 - y0);
      const bulge = Math.round(Math.sin(u * Math.PI) * billow);
      for (let x = x0 - bulge; x <= x1 + bulge; x++) {
        const v = (x - (x0 - bulge)) / (x1 - x0 + bulge * 2);
        let cc = v < 0.6 ? "#f1e7cc" : v < 0.85 ? "#ddd0ad" : "#c5b48e";
        if ((x - x0) % 5 == 0) cc = "#cfc09a";
        px(ctx, x, y, cc);
      }
      // borda de baixo curvada
      if (y == y1) for (let x = x0; x <= x1; x++) px(ctx, x, y + Math.round(Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 2), "#c5b48e");
    }
    // faixa da Casa
    const sy = Math.round(y0 + (y1 - y0) * 0.42);
    for (let y = sy; y < sy + 5; y++) {
      const u = (y - y0) / (y1 - y0);
      const bulge = Math.round(Math.sin(u * Math.PI) * billow);
      for (let x = x0 - bulge; x <= x1 + bulge; x++) {
        const v = (x - (x0 - bulge)) / (x1 - x0 + bulge * 2);
        px(ctx, x, y, col(team, v < 0.6 ? 1.08 : 0.82));
      }
    }
    px(ctx, x0 - billow, sy - 1, col(teamD), x1 - x0 + billow * 2 + 1, 1);
    px(ctx, x0 - billow, sy + 5, col(teamD), x1 - x0 + billow * 2 + 1, 1);
  };
  squareSail(37, 67, 15, 45);
  squareSail(22, 40, 28, 48);
  // vela latina (triângulo) na popa
  for (let y = 26; y <= 48; y++) {
    const u = (y - 26) / 22;
    const xa = Math.round(80 - u * 10);
    const xb = Math.round(80 + u * 13);
    for (let x = xa; x <= xb; x++) px(ctx, x, y, x > 82 ? "#d6c8a4" : "#efe4c8");
  }
  line(ctx, 69, 49, 94, 49, "#5a3a1c");
  // bandeiras no alto dos mastros
  const flag = (x: number, y: number, big: boolean): void => {
    px(ctx, x, y, "#3a2a18", 1, 6);
    const fw = big ? 10 : 7;
    for (let k = 0; k < fw; k++) {
      const wave = Math.round(Math.sin(k * 0.9 + frame * 2) * 1);
      px(ctx, x + 1 + k, y + wave, col(team, 1), 1, 4);
      px(ctx, x + 1 + k, y + 3 + wave, col(team, 0.7), 1, 1);
    }
  };
  flag(52, 3, true);
  flag(31, 18, false);
  flag(80, 18, false);
  // casco
  for (let x = W0; x <= W1; x++) {
    const top = Math.round(deck(x));
    const bot = keel(x);
    for (let y = top; y <= bot; y++) {
      const row = Math.floor((y - top) / 3);
      let cc = row % 2 ? "#8c4f22" : "#a5602a";
      if (y == top) cc = "#c98a48";
      if (y >= bot - 1) cc = "#5e3313";
      px(ctx, x, y, cc);
    }
    // friso dourado e escotilhas
    px(ctx, x, top + 3, "#d9a441");
    if (x > 26 && x < 70 && (x - 27) % 9 == 0) px(ctx, x, top + 7, "#2a160a", 2, 2);
  }
  // castelo de popa com janelas e grade
  for (let x = 72; x <= 92; x += 3) px(ctx, x, 47, "#6b4423", 1, 5);
  px(ctx, 71, 47, "#8a5e34", 23, 1);
  px(ctx, 84, 56, "#f2cf7e", 2, 2);
  px(ctx, 88, 56, "#f2cf7e", 2, 2);
  // proa: gurupés
  line(ctx, 14, 58, 2, 51, "#6b4423");
  // tripulação no convés (com a cor da Casa)
  const sailor = (x: number, y: number, tool: "hook" | "bow" | "none"): void => {
    px(ctx, x, y - 5, "#e4c19c");
    px(ctx, x - 1, y - 4, col(team), 3, 3);
    px(ctx, x - 1, y - 1, col(teamD), 3, 1);
    if (tool == "hook") {
      line(ctx, x + 2, y - 4, x - 3, y - 9, "#6b4423");
      px(ctx, x - 4, y - 10, "#c9ced3", 2, 1);
    } else if (tool == "bow") {
      px(ctx, x - 2, y - 6, "#6b4423", 1, 5);
      px(ctx, x - 3, y - 5, "#6b4423", 1, 3);
    }
  };
  const tool = role == "abordagem" ? "hook" : role == "flechas" ? "bow" : "none";
  sailor(44, 61, tool);
  sailor(59, 61, tool);
  sailor(66, 61, tool);
  sailor(78, 51, tool);
  if (role == "ariete") {
    // esporão de ferro na proa, na linha da água
    for (let k = 0; k < 12; k++) px(ctx, 1 + k, 70 - Math.floor(k / 4), k < 3 ? "#c9ced3" : "#7d858c", 1, 3 + Math.floor(k / 4));
    px(ctx, 1, 70, "#eef1f3", 3, 1);
  }
  addOutline(c);
  const s = { c, ax: 52, ay: 74 };
  cache.set(id, s);
  return s;
}
