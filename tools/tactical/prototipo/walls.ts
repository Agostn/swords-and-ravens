/**
 * Muralhas, portão e torres em pixel art (desenho próprio, no estilo de jogos 2D de castelo):
 * pedras com sombra, ameias, seteiras, musgo, torres redondas com telhado cônico e bandeira
 * na cor de quem defende, portão de madeira em arco. Dentro da muralha o chão é pátio de pedra.
 * Tudo é pintado em 1× (1 px = 1 pixel da arte) e ampliado sem suavizar, como o resto.
 */
import { FIELD_LANES, FieldType, Terrain, GATE_DEF, WALL_DEF } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { rng } from "../solver";

export const W = 600;
export const H = 780;
export const LW = W / 3;
/** Linha da muralha (o meio do muro). */
export const WALL_Y = Math.round(H * 0.415);

const isWall = (t: Terrain): boolean => t == "muralha" || t == "portao";

type RGB = [number, number, number];
const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const css = (c: RGB, k = 1): string => `rgb(${Math.round(Math.min(255, c[0] * k))},${Math.round(Math.min(255, c[1] * k))},${Math.round(Math.min(255, c[2] * k))})`;

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// pedra da muralha: 3 tons + argamassa
const STONE: RGB = [120, 114, 106];
const MORTAR = "#3c3833";
const OUTLINE = "#1e1a16";

/** Paredão de tijolos de pedra, com luz em cima, sombra embaixo e um tom diferente por pedra. */
function bricks(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, r: () => number, shadeCols?: (x: number) => number): void {
  rect(ctx, x0, y0, w, h, MORTAR);
  const rowH = 5;
  for (let row = 0, y = y0; y < y0 + h; row++, y += rowH) {
    let x = x0 - (row % 2 ? 5 : 0);
    while (x < x0 + w) {
      const bw = 8 + Math.floor(r() * 5);
      const bx = Math.max(x0, x);
      const bxe = Math.min(x0 + w, x + bw - 1);
      if (bxe > bx) {
        const tone = 0.82 + r() * 0.3;
        const k = shadeCols ? shadeCols((bx + bxe) / 2) : 1;
        rect(ctx, bx, y, bxe - bx, rowH - 1, css(STONE, tone * k));
        rect(ctx, bx, y, bxe - bx, 1, css(STONE, tone * k * 1.18)); // luz em cima da pedra
        rect(ctx, bx, y + rowH - 2, bxe - bx, 1, css(STONE, tone * k * 0.78)); // sombra embaixo
      }
      x += bw;
    }
  }
  // luz de cima a baixo: mais escuro perto do chão
  const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, "rgba(255,240,210,.08)");
  g.addColorStop(1, "rgba(0,0,0,.28)");
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, w, h);
}

function moss(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, r: () => number, n: number): void {
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const len = 2 + Math.floor(r() * 5);
    rect(ctx, x, y + Math.floor(r() * 3) - 1, len, 1 + Math.floor(r() * 2), r() < 0.5 ? "#4f6b2e" : "#6b8a3a");
  }
}

/** Torre redonda com telhado cônico e bandeira. (cx, base) = meio da torre e chão. */
function tower(ctx: CanvasRenderingContext2D, cx: number, base: number, w: number, hBody: number, flag: string, r: () => number): void {
  const x0 = Math.round(cx - w / 2);
  const top = base - hBody;
  // sombra no chão
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(cx + 4, base + 2, w * 0.62, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // corpo (redondo: claro à esquerda, escuro à direita)
  bricks(ctx, x0, top, w, hBody, r, (x) => 1.15 - ((x - x0) / w) * 0.45);
  rect(ctx, x0 - 1, top, 1, hBody, OUTLINE);
  rect(ctx, x0 + w, top, 1, hBody, OUTLINE);
  // beiral de pedra
  rect(ctx, x0 - 2, top - 3, w + 4, 4, css(STONE, 0.95));
  rect(ctx, x0 - 2, top - 3, w + 4, 1, css(STONE, 1.2));
  rect(ctx, x0 - 2, top + 1, w + 4, 1, OUTLINE);
  // janela/seteira
  rect(ctx, cx - 1, top + 14, 3, 10, "#15110d");
  rect(ctx, cx - 1, top + 13, 3, 1, css(STONE, 1.3));
  rect(ctx, cx - 1, top + 40, 3, 8, "#15110d");
  // telhado cônico com telhas
  const roofH = Math.round(w * 1.05);
  const rTop = top - 3 - roofH;
  for (let row = 0; row < roofH; row++) {
    const half = ((row + 1) / roofH) * (w / 2 + 3);
    const y = rTop + row;
    const xs = Math.round(cx - half);
    const xe = Math.round(cx + half);
    for (let x = xs; x <= xe; x++) {
      const u = (x - xs) / Math.max(1, xe - xs);
      const shingle = row % 4 == 3 ? 0.78 : 1;
      const base = u < 0.3 ? [222, 128, 64] : u < 0.72 ? [188, 94, 42] : [128, 58, 26];
      rect(ctx, x, y, 1, 1, css(base as RGB, shingle));
    }
    rect(ctx, xs - 1, y, 1, 1, OUTLINE);
    rect(ctx, xe + 1, y, 1, 1, OUTLINE);
  }
  rect(ctx, cx - (w / 2 + 4), top - 3, w + 8, 1, OUTLINE);
  // bandeira na ponta
  rect(ctx, cx, rTop - 11, 1, 12, "#3a2a18");
  const f = hex(flag);
  rect(ctx, cx + 1, rTop - 11, 8, 5, css(f));
  rect(ctx, cx + 1, rTop - 7, 8, 1, css(f, 0.7));
  rect(ctx, cx + 9, rTop - 10, 2, 3, css(f));
}

/** Um trecho de muralha entre x0 e x1, com ameias, seteiras e musgo; "broken" = buraco com entulho. */
function wallSegment(ctx: CanvasRenderingContext2D, x0: number, x1: number, r: () => number, broken: boolean): void {
  const top = WALL_Y - 22;
  const bot = WALL_Y + 16;
  // sombra da muralha no chão (para o lado de fora)
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.fillRect(x0, bot, x1 - x0, 7);
  ctx.fillStyle = "rgba(0,0,0,.12)";
  ctx.fillRect(x0, bot + 7, x1 - x0, 5);
  const gapL = (x0 + x1) / 2 - 34;
  const gapR = (x0 + x1) / 2 + 34;
  const parts: [number, number][] = broken ? [[x0, gapL], [gapR, x1]] : [[x0, x1]];
  for (const [a, b] of parts) {
    bricks(ctx, a, top, b - a, bot - top, r);
    // caminho de ronda (topo) e ameias
    rect(ctx, a, top - 2, b - a, 2, css(STONE, 1.15));
    for (let x = a + 3; x + 9 <= b; x += 15) {
      rect(ctx, x, top - 11, 10, 9, css(STONE, 0.98));
      rect(ctx, x, top - 11, 10, 1, css(STONE, 1.25));
      rect(ctx, x + 9, top - 10, 1, 8, css(STONE, 0.7));
      rect(ctx, x - 1, top - 11, 1, 9, OUTLINE);
      rect(ctx, x + 10, top - 11, 1, 9, OUTLINE);
      rect(ctx, x - 1, top - 12, 12, 1, OUTLINE);
    }
    rect(ctx, a, top - 2, b - a, 1, OUTLINE);
    rect(ctx, a, bot, b - a, 1, OUTLINE);
    // seteiras
    for (let x = a + 16; x + 3 < b; x += 36) {
      rect(ctx, x, top + 9, 3, 11, "#15110d");
      rect(ctx, x - 2, top + 13, 7, 2, "#15110d");
    }
    moss(ctx, a, b, bot - 2, r, Math.round((b - a) / 9));
    moss(ctx, a, b, top - 2, r, Math.round((b - a) / 16));
  }
  if (broken) {
    // buraco: pontas quebradas e entulho no chão
    for (const [edge, dir] of [[gapL, 1], [gapR, -1]] as [number, number][]) {
      for (let y = top - 2; y < bot; y += 3) {
        const bite = Math.floor(r() * 6);
        ctx.clearRect(Math.round(dir > 0 ? edge : edge - bite), y, bite, 3);
        rect(ctx, dir > 0 ? edge + bite - 1 : edge - bite, y, 1, 3, OUTLINE);
      }
    }
    for (let i = 0; i < 46; i++) {
      const x = gapL - 6 + r() * (gapR - gapL + 12);
      const y = bot - 6 + r() * 14 - Math.max(0, 8 - Math.abs(x - (gapL + gapR) / 2) / 4);
      const s = 2 + Math.floor(r() * 4);
      const tone = 0.7 + r() * 0.4;
      rect(ctx, x, y, s + 1, s, css(STONE, tone));
      rect(ctx, x, y, s + 1, 1, css(STONE, tone * 1.2));
      rect(ctx, x, y + s, s + 1, 1, OUTLINE);
    }
  }
}

/** Portão: guarita com porta de madeira em arco (aberta em pedaços quando a catapulta derruba). */
function gate(ctx: CanvasRenderingContext2D, cx: number, r: () => number, broken: boolean): void {
  const bot = WALL_Y + 16;
  const gw = 72;
  const top = WALL_Y - 40;
  const x0 = Math.round(cx - gw / 2);
  bricks(ctx, x0, top, gw, bot - top, r);
  rect(ctx, x0 - 1, top, 1, bot - top, OUTLINE);
  rect(ctx, x0 + gw, top, 1, bot - top, OUTLINE);
  // ameias da guarita
  for (let x = x0 + 1; x + 8 <= x0 + gw; x += 12) {
    rect(ctx, x, top - 9, 8, 9, css(STONE, 1));
    rect(ctx, x, top - 9, 8, 1, css(STONE, 1.25));
    rect(ctx, x - 1, top - 10, 10, 1, OUTLINE);
  }
  rect(ctx, x0, top - 1, gw, 1, OUTLINE);
  // arco de pedra clara
  const dw = 32;
  const dh = 36;
  const dx = Math.round(cx - dw / 2);
  const dy = bot - dh;
  ctx.fillStyle = css(STONE, 1.3);
  ctx.beginPath();
  ctx.moveTo(dx - 3, bot);
  ctx.lineTo(dx - 3, dy + dw / 2);
  ctx.arc(cx, dy + dw / 2, dw / 2 + 3, Math.PI, 0);
  ctx.lineTo(dx + dw + 3, bot);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dx, bot);
  ctx.lineTo(dx, dy + dw / 2);
  ctx.arc(cx, dy + dw / 2, dw / 2, Math.PI, 0);
  ctx.lineTo(dx + dw, bot);
  ctx.closePath();
  ctx.clip();
  if (!broken) {
    // porta de tábuas com ferragens
    for (let x = dx; x < dx + dw; x += 4) {
      rect(ctx, x, dy, 4, dh, x % 8 == 0 ? "#7a4c26" : "#6a4020");
      rect(ctx, x + 3, dy, 1, dh, "#3e240f");
    }
    for (const yy of [dy + 14, dy + 26]) {
      rect(ctx, dx, yy, dw, 2, "#2e2b28");
      for (let x = dx + 2; x < dx + dw; x += 5) rect(ctx, x, yy, 1, 1, "#9a948a");
    }
    rect(ctx, cx + 6, dy + 20, 2, 3, "#b08d3c"); // argola
  } else {
    rect(ctx, dx, dy, dw, dh, "#120e0b");
    for (let i = 0; i < 6; i++) rect(ctx, dx + r() * dw, bot - 3 - r() * 6, 5, 2, "#6a4020");
  }
  ctx.restore();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  // sombra no chão
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.fillRect(x0, bot + 1, gw, 7);
}

const layerCache = new Map<string, HTMLCanvasElement>();

/** Camada com todas as muralhas, portões e torres de um campo (transparente no resto). */
export function wallLayer(lanes: Terrain[], breach: boolean[], flag: string): HTMLCanvasElement {
  const key = lanes.join(",") + "|" + breach.map((b) => (b ? 1 : 0)).join("") + "|" + flag;
  const hit = layerCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const r = rng(91);
  lanes.forEach((t, i) => {
    if (!isWall(t)) return;
    wallSegment(ctx, i * LW, (i + 1) * LW, r, breach[i] && t == "muralha");
    if (t == "portao") gate(ctx, i * LW + LW / 2, r, breach[i]);
  });
  // torres nas pontas de cada trecho de muralha
  for (let b = 0; b <= 3; b++) {
    const left = b > 0 && isWall(lanes[b - 1]);
    const right = b < 3 && isWall(lanes[b]);
    if (!left && !right) continue;
    tower(ctx, b * LW, WALL_Y + 19, 38, 68, flag, r);
  }
  layerCache.set(key, c);
  return c;
}

/** Desenha as muralhas do campo (por cima do chão e de quem está atrás delas). */
export function drawWalls(ctx: CanvasRenderingContext2D, field: FieldType, breach: boolean[], flag: string): void {
  const lanes = FIELD_LANES[field];
  if (!lanes.some(isWall)) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(wallLayer(lanes, breach, flag), 0, 0, W, H);
  ctx.restore();
}

/** Uma faixa só (para as imagens do tutorial). */
export function drawWallLane(ctx: CanvasRenderingContext2D, lane: number, gateLane: boolean, broken: boolean, flag = "#c0303a"): void {
  const lanes: Terrain[] = ["aberto", "aberto", "aberto"];
  lanes[lane] = gateLane ? "portao" : "muralha";
  const br = [false, false, false];
  br[lane] = broken;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(wallLayer(lanes, br, flag), 0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------- chão do castelo
/** Pátio de pedra dentro da muralha e estrada de terra até o portão (pintado no chão, em 1×). */
export function paintCastleGround(ctx: CanvasRenderingContext2D, field: FieldType): void {
  const lanes = FIELD_LANES[field];
  if (!lanes.some(isWall)) return;
  const r = rng(57);
  lanes.forEach((t, i) => {
    if (!isWall(t)) return;
    const x0 = i * LW;
    const x1 = x0 + LW;
    // pátio: pedras arredondadas, cada uma com luz e sombra
    rect(ctx, x0, 0, LW, WALL_Y, "#4c4842");
    for (let y = 0, row = 0; y < WALL_Y; y += 6, row++) {
      for (let x = x0 - (row % 2 ? 4 : 0); x < x1; x += 8) {
        const w = 6 + Math.floor(r() * 2);
        const tone = 0.72 + r() * 0.3;
        const base: RGB = r() < 0.12 ? [104, 112, 84] : [122, 116, 106]; // algumas com musgo
        rect(ctx, x + 1, y + 1, w - 1, 4, css(base, tone));
        rect(ctx, x + 1, y + 1, w - 2, 1, css(base, tone * 1.2));
        rect(ctx, x + 2, y + 4, w - 2, 1, css(base, tone * 0.72));
      }
    }
    // luz desigual (manchas de sujeira e sombra), sem poluir
    for (let k = 0; k < 7; k++) {
      const g = ctx.createRadialGradient(x0 + r() * LW, r() * WALL_Y, 2, x0 + r() * LW, r() * WALL_Y, 40 + r() * 40);
      g.addColorStop(0, r() < 0.5 ? "rgba(30,24,16,.25)" : "rgba(255,240,210,.08)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x0, 0, LW, WALL_Y);
    }
    if (t == "portao") {
      // estrada de terra que leva ao portão
      const cx = x0 + LW / 2;
      for (let y = WALL_Y + 16; y < H; y++) {
        const half = 17 + Math.sin(y * 0.05) * 2 + (y > H * 0.8 ? (y - H * 0.8) * 0.06 : 0);
        rect(ctx, cx - half, y, half * 2, 1, "#8a7552");
        rect(ctx, cx - half, y, 1, 1, "#6b5a3d");
        rect(ctx, cx + half - 1, y, 1, 1, "#6b5a3d");
        // sulcos das rodas
        rect(ctx, cx - 7, y, 2, 1, "#6e5c3e");
        rect(ctx, cx + 5, y, 2, 1, "#6e5c3e");
      }
      for (let k = 0; k < 40; k++) rect(ctx, cx - 15 + r() * 30, WALL_Y + 14 + r() * (H - WALL_Y - 14), 2, 1, r() < 0.5 ? "#a08a62" : "#5f4f35");
    }
  });
}

/** Plaquinha na muralha, só na hora de posicionar: quanto ela ajuda quem defende. */
export function drawWallBadges(ctx: CanvasRenderingContext2D, field: FieldType): void {
  FIELD_LANES[field].forEach((t, i) => {
    if (!isWall(t)) return;
    const pct = Math.round(((t == "muralha" ? WALL_DEF : GATE_DEF) - 1) * 100);
    if (pct <= 0) return; // portão: é a entrada, sem bônus de defesa
    const text = `defesa +${pct}%`;
    const cx = i * LW + LW / 2 + (t == "portao" ? 0 : 0);
    const y = WALL_Y + 34;
    ctx.font = "800 13px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    const tw = ctx.measureText(text).width + 30;
    ctx.fillStyle = "rgba(14,11,8,.88)";
    ctx.beginPath();
    ctx.moveTo(cx - tw / 2 + 10, y - 11);
    ctx.arcTo(cx + tw / 2, y - 11, cx + tw / 2, y + 11, 10);
    ctx.arcTo(cx + tw / 2, y + 11, cx - tw / 2, y + 11, 10);
    ctx.arcTo(cx - tw / 2, y + 11, cx - tw / 2, y - 11, 10);
    ctx.arcTo(cx - tw / 2, y - 11, cx + tw / 2, y - 11, 10);
    ctx.closePath();
    ctx.fill();
    // escudinho
    const sx = cx - tw / 2 + 12;
    ctx.fillStyle = "#e0b354";
    ctx.beginPath();
    ctx.moveTo(sx - 5, y - 6);
    ctx.lineTo(sx + 5, y - 6);
    ctx.lineTo(sx + 5, y);
    ctx.quadraticCurveTo(sx + 5, y + 5, sx, y + 7);
    ctx.quadraticCurveTo(sx - 5, y + 5, sx - 5, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f2cf7e";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, sx + 9, y + 0.5);
  });
}
