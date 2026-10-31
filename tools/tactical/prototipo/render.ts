/** Desenho do campo (posicionamento e luta) no canvas. */
import { Lane } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { FIELD_LANES, FieldType, Role, Row, SquadKind, Terrain } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { rng } from "../solver";
import { House, TERRAIN_NAMES } from "./data";
import { grassImage } from "./assets";
import { drawSquad, kindOf } from "./figures";
import { drawWallBadges, drawWallLane, drawWalls, paintCastleGround } from "./walls";

export const W = 600;
export const H = 780;
export const LW = W / 3;

export const ease = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// ---------------------------------------------------------------- terreno (pintado uma vez por campo)
const terrainCache = new Map<string, HTMLCanvasElement>();

const BASE: Record<Terrain, [string, string]> = {
  aberto: ["#7d8a4b", "#66733c"],
  mata: ["#4d6a3b", "#3a522c"],
  colina: ["#8c7a50", "#76653f"],
  rio: ["#76864e", "#606f3e"],
  vau: ["#76864e", "#606f3e"],
  pantano: ["#5d6a45", "#4a5638"],
  calcada: ["#5d6a45", "#4a5638"],
  areia: ["#d6b874", "#c29f58"],
  muralha: ["#79844b", "#646e3c"],
  portao: ["#79844b", "#646e3c"],
  bloqueado: ["#6c675f", "#57524b"],
  mar: ["#2f5d7c", "#244a64"]
};

/** Terrenos com chão de grama (usam a textura). */
const GRASSY: Partial<Record<Terrain, number>> = { aberto: 0.62, mata: 0.5, colina: 0.32, rio: 0.55, vau: 0.55, pantano: 0.4, calcada: 0.4, muralha: 0.6, portao: 0.6 };

function paintLane(ctx: CanvasRenderingContext2D, x: number, w: number, t: Terrain, seed: number): void {
  const r = rng(seed);
  const [a, b] = BASE[t];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, a);
  g.addColorStop(0.5, b);
  g.addColorStop(1, a);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, w, H);
  ctx.clip();
  const grass = grassImage();
  const ga = GRASSY[t];
  if (grass && ga) {
    // textura de grama (CC0) por baixo, tingida com a cor do terreno por cima
    const pat = ctx.createPattern(grass, "repeat") as CanvasPattern;
    pat.setTransform(new DOMMatrix().translate(seed % 97, (seed * 7) % 131).scale(0.6));
    ctx.fillStyle = pat;
    ctx.fillRect(x, 0, w, H);
    ctx.globalAlpha = 1 - ga;
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(190,180,140,.35)";
    ctx.fillRect(x, 0, w, H);
    ctx.globalCompositeOperation = "source-over";
  } else {
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, H);
  }
  // grão do chão
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = r() < 0.5 ? "rgba(255,250,220,.05)" : "rgba(0,0,0,.06)";
    ctx.fillRect(x + r() * w, r() * H, 2 + r() * 3, 1 + r() * 2);
  }
  const blob = (cx: number, cy: number, rad: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  };
  if (t == "aberto" || t == "muralha" || t == "portao") {
    ctx.strokeStyle = "rgba(230,240,180,.16)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 160; i++) {
      const gx = x + r() * w;
      const gy = r() * H;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 2 - r() * 4, gy - 5 - r() * 4);
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) blob(x + r() * w, r() * H, 14 + r() * 20, "rgba(120,140,70,.18)");
  }
  if (t == "mata") {
    for (let i = 0; i < 46; i++) {
      const tx = x + r() * w;
      const ty = r() * H;
      if (Math.abs(ty - H / 2) < 46) continue;
      const rad = 11 + r() * 12;
      // árvore vista de cima: sombra, contorno escuro, copa em 3 tons e brilho
      blob(tx + 5, ty + 6, rad + 1, "rgba(8,16,6,.42)");
      blob(tx, ty, rad + 1, "#1b2d14");
      blob(tx, ty, rad, "#2c4623");
      blob(tx - rad * 0.2, ty - rad * 0.25, rad * 0.72, "#3b5c2c");
      blob(tx + rad * 0.35, ty - rad * 0.05, rad * 0.4, "#35532a");
      blob(tx - rad * 0.38, ty - rad * 0.42, rad * 0.32, "#5a8240");
      blob(tx - rad * 0.48, ty - rad * 0.52, rad * 0.12, "rgba(190,220,140,.55)");
    }
  }
  if (t == "colina") {
    for (let k = 7; k >= 0; k--) {
      ctx.fillStyle = `rgba(${120 + k * 6},${100 + k * 5},${60 + k * 3},${0.18 + k * 0.03})`;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, H * 0.22, w * (0.12 + k * 0.06), H * (0.04 + k * 0.025), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(60,40,20,.35)";
    ctx.lineWidth = 1.5;
    for (let k = 1; k < 7; k++) {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, H * 0.22, w * (0.12 + k * 0.06), H * (0.04 + k * 0.025), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (t == "rio" || t == "vau") {
    const top = (i: number): number => H * 0.455 + Math.sin(i * 0.9 + x * 0.02) * 7;
    const bot = (i: number): number => H * 0.545 + Math.sin(i * 0.9 + x * 0.02 + 1.4) * 7;
    ctx.fillStyle = "#a99a6c";
    ctx.beginPath();
    ctx.moveTo(x, top(0) - 6);
    for (let i = 0; i <= 12; i++) ctx.lineTo(x + (w * i) / 12, top(i) - 6);
    for (let i = 12; i >= 0; i--) ctx.lineTo(x + (w * i) / 12, bot(i) + 6);
    ctx.fill();
    const wg = ctx.createLinearGradient(0, H * 0.45, 0, H * 0.55);
    wg.addColorStop(0, "#3f7798");
    wg.addColorStop(0.5, "#2e6283");
    wg.addColorStop(1, "#3f7798");
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.moveTo(x, top(0));
    for (let i = 0; i <= 12; i++) ctx.lineTo(x + (w * i) / 12, top(i));
    for (let i = 12; i >= 0; i--) ctx.lineTo(x + (w * i) / 12, bot(i));
    ctx.fill();
    ctx.strokeStyle = "rgba(225,240,255,.45)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) {
      const wx = x + r() * w;
      const wy = H * 0.48 + r() * H * 0.04;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 7, wy - 3, wx + 14, wy);
      ctx.stroke();
    }
    if (t == "vau") {
      for (let i = 0; i < 9; i++) {
        blob(x + w * 0.3 + r() * w * 0.4, H * 0.465 + i * 7, 6 + r() * 3, "#b9ae8c");
      }
    }
  }
  if (t == "pantano" || t == "calcada") {
    for (let i = 0; i < 22; i++) {
      ctx.fillStyle = "rgba(40,70,60,.55)";
      ctx.beginPath();
      ctx.ellipse(x + r() * w, r() * H, 18 + r() * 26, 7 + r() * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(170,190,110,.7)";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 90; i++) {
      const rx = x + r() * w;
      const ry = r() * H;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + (r() - 0.5) * 5, ry - 10);
      ctx.stroke();
    }
    if (t == "calcada") {
      ctx.fillStyle = "#8e7552";
      ctx.fillRect(x + w * 0.4, 0, w * 0.2, H);
      ctx.strokeStyle = "rgba(50,30,12,.55)";
      ctx.lineWidth = 1;
      for (let y = 0; y < H; y += 12) {
        ctx.beginPath();
        ctx.moveTo(x + w * 0.4, y);
        ctx.lineTo(x + w * 0.6, y);
        ctx.stroke();
      }
    }
  }
  if (t == "areia") {
    ctx.lineWidth = 2;
    for (let k = 0; k < 14; k++) {
      const yy = r() * H;
      ctx.strokeStyle = "rgba(150,105,45,.35)";
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.quadraticCurveTo(x + w / 2, yy - 16 - r() * 10, x + w, yy + 6);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,240,200,.25)";
      ctx.beginPath();
      ctx.moveTo(x, yy - 3);
      ctx.quadraticCurveTo(x + w / 2, yy - 19 - r() * 10, x + w, yy + 3);
      ctx.stroke();
    }
  }
  if (t == "bloqueado") {
    for (let i = 0; i < 24; i++) {
      const bx = x + r() * w;
      const by = r() * H;
      const s = 18 + r() * 18;
      ctx.fillStyle = "#4e4a44";
      ctx.beginPath();
      ctx.moveTo(bx, by - s);
      ctx.lineTo(bx + s, by + s * 0.6);
      ctx.lineTo(bx - s, by + s * 0.6);
      ctx.fill();
      ctx.fillStyle = "#857f75";
      ctx.beginPath();
      ctx.moveTo(bx, by - s);
      ctx.lineTo(bx - s * 0.2, by + s * 0.6);
      ctx.lineTo(bx - s, by + s * 0.6);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.65)";
      ctx.beginPath();
      ctx.moveTo(bx, by - s);
      ctx.lineTo(bx + s * 0.25, by - s * 0.6);
      ctx.lineTo(bx - s * 0.25, by - s * 0.6);
      ctx.fill();
    }
  }
  if (t == "mar") {
    ctx.strokeStyle = "rgba(210,235,255,.28)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 60; i++) {
      const wx = x + r() * w;
      const wy = r() * H;
      ctx.beginPath();
      ctx.arc(wx, wy, 7 + r() * 5, 3.5, 5.9);
      ctx.stroke();
    }
  }
  // vinheta
  const v = ctx.createLinearGradient(x, 0, x + w, 0);
  v.addColorStop(0, "rgba(0,0,0,.18)");
  v.addColorStop(0.12, "rgba(0,0,0,0)");
  v.addColorStop(0.88, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,.18)");
  ctx.fillStyle = v;
  ctx.fillRect(x, 0, w, H);
  ctx.restore();
}

export function terrainImage(field: FieldType): HTMLCanvasElement {
  const key = field + (grassImage() ? "+g" : "");
  const cached = terrainCache.get(key);
  if (cached) return cached;
  // pintado em 1× e ampliado sem suavizar: o chão fica com o mesmo "pixel" dos bonequinhos
  const c1 = document.createElement("canvas");
  c1.width = W;
  c1.height = H;
  const ctx = c1.getContext("2d") as CanvasRenderingContext2D;
  FIELD_LANES[field].forEach((t, i) => paintLane(ctx, i * LW, LW, t, 1000 + i * 77 + field.length));
  paintCastleGround(ctx, field);
  // sombra de nuvens e luz vindo de cima à esquerda: o chão fica com volume, sem poluir
  const sr = rng(field.length * 13 + 5);
  for (let k = 0; k < 9; k++) {
    const cx = sr() * W;
    const cy = sr() * H;
    const rad = 70 + sr() * 110;
    const g = ctx.createRadialGradient(cx, cy, rad * 0.2, cx, cy, rad);
    g.addColorStop(0, "rgba(10,14,8,.16)");
    g.addColorStop(1, "rgba(10,14,8,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
  const light = ctx.createLinearGradient(0, 0, W, H);
  light.addColorStop(0, "rgba(255,244,214,.07)");
  light.addColorStop(0.55, "rgba(0,0,0,0)");
  light.addColorStop(1, "rgba(0,0,0,.14)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(25,18,10,.6)";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  [1, 2].forEach((i) => {
    ctx.beginPath();
    ctx.moveTo(i * LW, 0);
    ctx.lineTo(i * LW, H);
    ctx.stroke();
  });
  ctx.setLineDash([]);
  const c = document.createElement("canvas");
  c.width = W * 2;
  c.height = H * 2;
  const big = c.getContext("2d") as CanvasRenderingContext2D;
  big.imageSmoothingEnabled = false;
  big.drawImage(c1, 0, 0, W * 2, H * 2);
  terrainCache.set(key, c);
  return c;
}

/** Uma faixa de muralha (para o tutorial). O desenho mora em walls.ts. */
export function drawWall(ctx: CanvasRenderingContext2D, lane: number, gate: boolean, broken: boolean): void {
  drawWallLane(ctx, lane, gate, broken);
}

// ---------------------------------------------------------------- posicionamento
export interface Slot {
  lane: Lane;
  row: Row;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function slots(field: FieldType): Slot[] {
  const out: Slot[] = [];
  const rows: [Row, number][] = [
    ["frente", H * 0.535],
    ["tras", H * 0.735]
  ];
  ([0, 1, 2] as Lane[]).forEach((lane) => {
    if (FIELD_LANES[field][lane] == "bloqueado") return;
    rows.forEach(([row, y]) => out.push({ lane, row, x: lane * LW + 8, y, w: LW - 16, h: H * 0.18 }));
  });
  return out;
}

export interface PlacedToken {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlaceView {
  field: FieldType;
  house: House;
  enemy: House;
  enemyCount: number;
  squads: { id: string; kind: SquadKind; role: Role; lane: Lane | null; row: Row; locked?: boolean }[];
  selected: string | null;
  hoverSlot: { lane: Lane; row: Row } | null;
  dragging: string | null;
  showHint: boolean;
  /** quanto a peça escolhida rende em cada casinha (só pelo lugar) */
  preview?: { lane: Lane; row: Row; pct: number; best: boolean }[] | null;
  /** legenda dos números, ex.: "Peça 2 · Lanceiro" */
  previewLabel?: string;
  /** cor da bandeira das torres (de quem defende) */
  wallFlag?: string;
}

// ---------------------------------------------------------------- névoa (pixel art)
const FOG_CELL = 4; // cada "pixel" da névoa
const FOG_W = W / FOG_CELL; // 150
const FOG_H = Math.ceil((H * 0.56) / FOG_CELL);
const fogLayers: HTMLCanvasElement[] = [];

/** Nuvens de névoa: ruído suave, que se repete na horizontal, em poucos tons (cara de pixel art). */
function fogLayer(seed: number, light: [number, number, number], dark: [number, number, number], density: number): HTMLCanvasElement {
  const r = rng(seed);
  const grid = (n: number, m: number): number[][] => Array.from({ length: m + 1 }, () => Array.from({ length: n }, () => r()));
  const octaves = [
    { n: 6, m: 5, w: 0.55 },
    { n: 12, m: 9, w: 0.3 },
    { n: 25, m: 18, w: 0.15 }
  ].map((o) => ({ ...o, g: grid(o.n, o.m) }));
  const sm = (x: number): number => x * x * (3 - 2 * x);
  const c = document.createElement("canvas");
  c.width = FOG_W;
  c.height = FOG_H;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const img = ctx.createImageData(FOG_W, FOG_H);
  for (let y = 0; y < FOG_H; y++)
    for (let x = 0; x < FOG_W; x++) {
      let v = 0;
      for (const o of octaves) {
        const fx = (x / FOG_W) * o.n;
        const fy = (y / FOG_H) * o.m;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = sm(fx - x0);
        const ty = sm(fy - y0);
        const a = o.g[y0][x0 % o.n];
        const b = o.g[y0][(x0 + 1) % o.n];
        const cc = o.g[y0 + 1][x0 % o.n];
        const d = o.g[y0 + 1][(x0 + 1) % o.n];
        v += o.w * ((a * (1 - tx) + b * tx) * (1 - ty) + (cc * (1 - tx) + d * tx) * ty);
      }
      // poucos degraus de tom e de transparência
      const k = Math.max(0, Math.min(1, (v - (1 - density)) / density));
      const step = Math.round(k * 4) / 4;
      const fade = y > FOG_H * 0.78 ? Math.max(0, 1 - (y - FOG_H * 0.78) / (FOG_H * 0.22)) : 1;
      const i = (y * FOG_W + x) * 4;
      const col = step > 0.5 ? light : dark;
      img.data[i] = col[0];
      img.data[i + 1] = col[1];
      img.data[i + 2] = col[2];
      img.data[i + 3] = Math.round(step * 200 * Math.round(fade * 4) / 4);
    }
  ctx.putImageData(img, 0, 0);
  return c;
}

function drawFog(ctx: CanvasRenderingContext2D, t: number, enemy: House, count: number): void {
  if (!fogLayers.length) {
    fogLayers.push(fogLayer(11, [150, 160, 172], [88, 98, 110], 0.75));
    fogLayers.push(fogLayer(29, [205, 212, 220], [130, 140, 152], 0.55));
  }
  // o lado inimigo fica escuro e frio
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.53);
  g.addColorStop(0, "rgba(16,20,26,.82)");
  g.addColorStop(0.75, "rgba(16,20,26,.62)");
  g.addColorStop(1, "rgba(16,20,26,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.53);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const speeds = [7, -11];
  fogLayers.forEach((layer, i) => {
    const off = (((t * speeds[i]) % W) + W) % W;
    const x = Math.round(off / FOG_CELL) * FOG_CELL;
    ctx.globalAlpha = i == 0 ? 0.9 : 0.55;
    ctx.drawImage(layer, x - W, 0, W, FOG_H * FOG_CELL);
    ctx.drawImage(layer, x, 0, W, FOG_H * FOG_CELL);
  });
  ctx.restore();
  // estandarte do inimigo
  const cx = W / 2;
  const top = H * 0.08;
  const bw = 150;
  const bh = 72;
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(cx - bw / 2 - 10, top - 6, bw + 20, 6);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.moveTo(cx - bw / 2 + 4, top + 4);
  ctx.lineTo(cx + bw / 2 + 4, top + 4);
  ctx.lineTo(cx + bw / 2 + 4, top + bh + 4);
  ctx.lineTo(cx + 4, top + bh - 14 + 4);
  ctx.lineTo(cx - bw / 2 + 4, top + bh + 4);
  ctx.fill();
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.moveTo(cx - bw / 2, top);
  ctx.lineTo(cx + bw / 2, top);
  ctx.lineTo(cx + bw / 2, top + bh);
  ctx.lineTo(cx, top + bh - 14);
  ctx.lineTo(cx - bw / 2, top + bh);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = enemy.dark;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = enemy.ink;
  ctx.font = "24px 'IM Fell English SC', Georgia, serif";
  ctx.fillText(enemy.name, cx, top + 24);
  ctx.font = "800 13px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
  ctx.fillText(`${count} ${count == 1 ? "peça escondida" : "peças escondidas"}`, cx, top + 46);
}

export function drawPlacement(ctx: CanvasRenderingContext2D, v: PlaceView, t: number): PlacedToken[] {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(terrainImage(v.field), 0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  const lanesT = FIELD_LANES[v.field];
  drawFog(ctx, t, v.enemy, v.enemyCount);
  // a muralha é do terreno (todo mundo sabe onde ela está): fica por cima da névoa
  drawWalls(ctx, v.field, [false, false, false], v.wallFlag ?? v.enemy.color);
  drawWallBadges(ctx, v.field);
  // nome do terreno de cada faixa (na linha do meio)
  lanesT.forEach((tt, i) => {
    const label = TERRAIN_NAMES[tt];
    ctx.font = "700 16px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    const tw = ctx.measureText(label).width + 20;
    const cx = i * LW + LW / 2;
    ctx.fillStyle = "rgba(18,14,10,.78)";
    roundRect(ctx, cx - tw / 2, H * 0.49 - 14, tw, 28, 14);
    ctx.fill();
    ctx.fillStyle = "#efe3c6";
    ctx.fillText(label, cx, H * 0.49 + 1);
  });
  // casinhas
  const pulse = 0.5 + 0.5 * Math.sin(t * 3);
  for (const s of slots(v.field)) {
    const hover = v.hoverSlot && v.hoverSlot.lane == s.lane && v.hoverSlot.row == s.row;
    const empty = !v.squads.some((q) => q.lane == s.lane && q.row == s.row);
    ctx.fillStyle = hover ? "rgba(255,214,110,.22)" : "rgba(15,12,8,.22)";
    roundRect(ctx, s.x, s.y, s.w, s.h, 12);
    ctx.fill();
    ctx.setLineDash(hover ? [] : [7, 6]);
    ctx.lineWidth = hover ? 3 : 2;
    ctx.strokeStyle = hover ? "rgba(255,214,110,.95)" : v.showHint && empty ? `rgba(255,236,190,${0.35 + pulse * 0.4})` : "rgba(255,236,190,.38)";
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "700 12px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255,240,205,.8)";
    ctx.fillText(s.row == "frente" ? "FRENTE" : "TRÁS", s.x + 10, s.y + 8);
    // quanto a peça escolhida rende aqui
    const pv = v.preview?.find((x) => x.lane == s.lane && x.row == s.row);
    if (pv) {
      const txt = pv.pct == 0 ? "força normal" : `força ${pv.pct > 0 ? "+" : "−"}${Math.abs(pv.pct)}%`;
      ctx.font = "800 15px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
      const tw = ctx.measureText(txt).width + 18;
      const bx = s.x + s.w - tw - 6;
      const by = s.y + 6;
      ctx.fillStyle = pv.pct > 0 ? "#2f6b2a" : pv.pct < 0 ? "#8a2f25" : "rgba(30,24,18,.85)";
      roundRect(ctx, bx, by, tw, 26, 13);
      ctx.fill();
      if (pv.best && pv.pct > 0) {
        ctx.strokeStyle = "#f2cf7e";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = "#fff6e2";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, bx + tw / 2, by + 13.5);
    }
  }
  // esquadrões posicionados: cada peça vira 4 bonequinhos; cabem pelo menos 2 peças por casinha
  const placed: PlacedToken[] = [];
  const SQ = 1.1;
  const widthOf = (k: SquadKind): number => (kindOf(k) == "horse" ? 70 : kindOf(k) == "foot" ? 46 : 50) * SQ * 0.92;
  for (const s of slots(v.field)) {
    const here = v.squads.filter((q) => q.lane == s.lane && q.row == s.row);
    if (!here.length) continue;
    // arruma em linhas
    const lines: (typeof here)[] = [[]];
    let used = 0;
    for (const q of here) {
      const w = widthOf(q.kind);
      if (used + w > s.w - 6 && lines[lines.length - 1].length) {
        lines.push([]);
        used = 0;
      }
      lines[lines.length - 1].push(q);
      used += w;
    }
    const n = lines.length;
    lines.forEach((line, li) => {
      const total = line.reduce((acc, q) => acc + widthOf(q.kind), 0);
      let x = s.x + s.w / 2 - total / 2;
      const fy = n == 1 ? s.y + s.h * 0.8 : s.y + s.h * (0.5 + (0.42 * li) / (n - 1));
      const scale = n > 2 ? SQ * 0.85 : SQ;
      line.forEach((q) => {
        const w = widthOf(q.kind);
        const box = drawSquad(ctx, x + w / 2, fy, q.kind, q.role, v.house, { scale, selected: v.selected == q.id, ghost: v.dragging == q.id, time: t, num: v.squads.indexOf(q) + 1 });
        placed.push({ id: q.id, ...box });
        x += w;
      });
    });
  }
  if (v.preview && v.previewLabel) {
    const txt = `${v.previewLabel}: força em cada casinha (verde = rende mais)`;
    ctx.font = "700 14px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tw = Math.min(W - 16, ctx.measureText(txt).width + 24);
    ctx.fillStyle = "rgba(18,14,10,.85)";
    roundRect(ctx, W / 2 - tw / 2, H - 34, tw, 26, 13);
    ctx.fill();
    ctx.fillStyle = "#f2cf7e";
    ctx.fillText(txt, W / 2, H - 20.5, W - 30);
  }
  return placed;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

