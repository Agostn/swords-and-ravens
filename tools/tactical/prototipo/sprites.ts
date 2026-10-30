/**
 * Sprites em pixel art: soldados e dragão vêm das imagens (arte/), com as cores trocadas
 * para a Casa; cavalo, máquina de cerco, torre e navio são desenhados e "pixelados" no
 * mesmo tamanho de pixel, para ficar tudo no mesmo estilo.
 *
 * Todas as funções devolvem um canvas pequeno (1 px = 1 pixel da arte) virado para a
 * ESQUERDA, com os pés no ponto (ax, ay).
 */
import { Role } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { dragonImage, soldiersImage } from "./assets";
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
const PAD = 14;

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
export function soldierSprite(h: House, role: Role, atk: 0 | 1): Sprite | null {
  if (!soldiersImage()) return null;
  const id = `s|${h.name}|${role}|${atk}`;
  const hit = cache.get(id);
  if (hit) return hit;
  let c: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let ay: number;
  const wood = "#6e4a26";
  const woodD = "#40280f";
  const steel = "#d7dce0";
  const steelD = "#8a9298";
  if (role == "escudeiro") {
    if (atk == 0) [c, ctx] = cellCanvas("escudo", h, { shieldTeam: true });
    else {
      // espada erguida + o escudo da outra pose (só os pixels do escudo)
      [c, ctx] = cellCanvas("golpe", h);
      const [sc] = cellCanvas("escudo", h, { shieldTeam: true });
      const raw = newCanvas(26, 34);
      raw[1].drawImage(soldiersImage() as HTMLImageElement, CELL.escudo * 26, 0, 26, 34, 0, 0, 26, 34);
      const rd = raw[1].getImageData(0, 0, 26, 34).data;
      const sd = (sc.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, sc.width, sc.height).data;
      const shield = new Set([...SHIELD_FACE, key(69, 57, 47)]);
      for (let y = 0; y < 34; y++)
        for (let x = 8; x < 19; x++) {
          const i = (y * 26 + x) * 4;
          if (rd[i + 3] == 0 || !shield.has(key(rd[i], rd[i + 1], rd[i + 2]))) continue;
          const j = ((y + PAD) * sc.width + x + PAD) * 4;
          px(ctx, PAD + x + 5, PAD + y, `rgb(${sd[j]},${sd[j + 1]},${sd[j + 2]})`);
        }
    }
    ay = PAD + 34;
  } else if (role == "arqueiro" || role == "flechas") {
    [c, ctx] = cellCanvas("capuz", h, { dropSword: true });
    // aljava nas costas
    px(ctx, PAD + 11, PAD + 5, woodD, 2, 8);
    px(ctx, PAD + 11, PAD + 3, "#efe6d0");
    px(ctx, PAD + 12, PAD + 2, "#efe6d0");
    px(ctx, PAD + 12, PAD + 4, "#c9483a");
    // arco na mão da frente (à esquerda)
    const bx = PAD - 2;
    const top = PAD + 6;
    const bot = PAD + 24;
    const pull = atk ? 6 : 0;
    for (let y = top; y <= bot; y++) {
      const t = (y - top) / (bot - top);
      const bend = Math.round(Math.sin(t * Math.PI) * 3);
      px(ctx, bx - bend, y, y == top || y == bot ? woodD : wood);
    }
    const mid = (top + bot) / 2;
    line(ctx, bx, top, bx + 1 + pull, mid, "#f2ead6");
    line(ctx, bx + 1 + pull, mid, bx, bot, "#f2ead6");
    if (atk) {
      line(ctx, bx - 5, mid, bx + pull, mid, "#e8dcc0");
      px(ctx, bx - 6, mid, steel);
      px(ctx, bx + pull, mid - 1, "#c9483a");
    }
    ay = PAD + 32;
  } else {
    // lanceiro: lança comprida no lugar da espada
    [c, ctx] = cellCanvas("lanca", h, { dropSword: true });
    if (atk == 0) {
      const x = PAD + 1;
      line(ctx, x, PAD - 12, x, PAD + 29, woodD);
      line(ctx, x + 1, PAD - 9, x + 1, PAD + 29, wood);
      px(ctx, x, PAD - 16, steel, 2, 4);
      px(ctx, x - 1, PAD - 13, steelD, 1, 2);
      px(ctx, x + 2, PAD - 13, steelD, 1, 2);
      px(ctx, x, PAD - 17, steel);
    } else {
      // abaixada para a frente
      line(ctx, PAD + 16, PAD + 13, PAD - 12, PAD + 17, woodD);
      line(ctx, PAD + 16, PAD + 12, PAD - 10, PAD + 16, wood);
      px(ctx, PAD - 16, PAD + 16, steel, 4, 2);
      px(ctx, PAD - 17, PAD + 17, steel);
      px(ctx, PAD - 13, PAD + 15, steelD);
    }
    ay = PAD + 32;
  }
  addOutline(c);
  const s = { c, ax: PAD + 9, ay };
  cache.set(id, s);
  return s;
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

// ---------------------------------------------------------------- dragão
const DCW = 103;
const DCH = 110;
/** Quadro do dragão: "idle" (pousado), "flight" (voando, 6) ou "special" (cuspindo fogo, 6). Virado para a DIREITA. */
export function dragonFrame(row: "idle" | "flight" | "special", i: number): { img: HTMLImageElement; sx: number; sy: number; w: number; h: number } | null {
  const img = dragonImage();
  if (!img) return null;
  const r = row == "idle" ? 0 : row == "flight" ? 1 : 2;
  return { img, sx: (i % 6) * DCW, sy: r * DCH, w: DCW, h: DCH };
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
