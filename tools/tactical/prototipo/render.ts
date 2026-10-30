/** Desenho do campo (posicionamento e luta) no canvas. */
import { Lane, Side, Squad, TacticalBattleResult } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { FIELD_LANES, FieldType, FIGURES, Role, Row, SquadKind, Terrain } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { rng } from "../solver";
import { House, TERRAIN_NAMES } from "./data";

export const W = 600;
export const H = 780;
export const LW = W / 3;

const ease = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

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

function paintLane(ctx: CanvasRenderingContext2D, x: number, w: number, t: Terrain, seed: number): void {
  const r = rng(seed);
  const [a, b] = BASE[t];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, a);
  g.addColorStop(0.5, b);
  g.addColorStop(1, a);
  ctx.fillStyle = g;
  ctx.fillRect(x, 0, w, H);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, w, H);
  ctx.clip();
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
      blob(tx + 4, ty + 5, rad, "rgba(10,20,8,.35)");
      blob(tx, ty, rad, "#2f4a25");
      blob(tx - rad * 0.25, ty - rad * 0.3, rad * 0.62, "#456a35");
      blob(tx - rad * 0.4, ty - rad * 0.45, rad * 0.25, "rgba(160,200,120,.35)");
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
  const cached = terrainCache.get(field);
  if (cached) return cached;
  const c = document.createElement("canvas");
  c.width = W * 2;
  c.height = H * 2;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.scale(2, 2);
  FIELD_LANES[field].forEach((t, i) => paintLane(ctx, i * LW, LW, t, 1000 + i * 77 + field.length));
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
  terrainCache.set(field, c);
  return c;
}

export function drawWall(ctx: CanvasRenderingContext2D, lane: number, gate: boolean, broken: boolean): void {
  const x = lane * LW;
  const y = H * 0.415;
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    const sx = x + (LW / segs) * i + 1;
    const sw = LW / segs - 2;
    const gateSeg = gate && (i == 3 || i == 4);
    const gap = broken && i >= 2 && i <= 5;
    if (gap) continue;
    if (gateSeg) {
      ctx.fillStyle = "#5e3d22";
      ctx.fillRect(sx, y - 7, sw, 14);
      ctx.strokeStyle = "#2c1b0d";
      ctx.strokeRect(sx, y - 7, sw, 14);
      continue;
    }
    const g = ctx.createLinearGradient(0, y - 12, 0, y + 12);
    g.addColorStop(0, "#c2bcae");
    g.addColorStop(1, "#8a8476");
    ctx.fillStyle = g;
    ctx.fillRect(sx, y - 10, sw, 20);
    ctx.fillRect(sx + 2, y - 16, sw / 3, 7);
    ctx.fillRect(sx + sw - sw / 3 - 2, y - 16, sw / 3, 7);
    ctx.strokeStyle = "rgba(40,36,30,.7)";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, y - 10, sw, 20);
  }
  if (broken) {
    const r = rng(lane * 31 + 5);
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = r() < 0.5 ? "#9b958a" : "#77716a";
      ctx.beginPath();
      ctx.arc(x + LW * 0.3 + r() * LW * 0.4, y + (r() - 0.5) * 18, 3 + r() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------- fichas (as "bolinhas")
export function glyphPath(ctx: CanvasRenderingContext2D, role: Role): void {
  // desenha na caixa 0..24
  const p = new Path2D();
  const fill: Path2D | null = role == "dragao" || role == "lanceiro" ? new Path2D() : null;
  switch (role) {
    case "lanceiro":
      p.moveTo(6.5, 17.5);
      p.lineTo(16.5, 7.5);
      fill?.moveTo(18.5, 5.5);
      fill?.lineTo(13, 6.8);
      fill?.lineTo(17.2, 11);
      fill?.closePath();
      break;
    case "escudeiro":
      p.moveTo(12, 4.5);
      p.lineTo(18.5, 6.8);
      p.lineTo(18.5, 12);
      p.bezierCurveTo(18.5, 15.8, 15.3, 18.4, 12, 20);
      p.bezierCurveTo(8.7, 18.4, 5.5, 15.8, 5.5, 12);
      p.lineTo(5.5, 6.8);
      p.closePath();
      p.moveTo(12, 7);
      p.lineTo(12, 17);
      break;
    case "arqueiro":
    case "flechas":
      p.moveTo(8, 4.5);
      p.bezierCurveTo(16, 7.5, 16, 16.5, 8, 19.5);
      p.moveTo(8, 4.5);
      p.lineTo(8, 19.5);
      p.moveTo(5, 12);
      p.lineTo(18, 12);
      p.moveTo(15.5, 9.5);
      p.lineTo(18, 12);
      p.lineTo(15.5, 14.5);
      break;
    case "cavalaria":
      p.moveTo(5.5, 17);
      p.lineTo(12, 6);
      p.lineTo(18.5, 17);
      p.moveTo(8.8, 12.8);
      p.lineTo(15.2, 12.8);
      break;
    case "batedores":
      p.moveTo(5, 9);
      p.lineTo(13, 9);
      p.moveTo(10, 6);
      p.lineTo(13, 9);
      p.lineTo(10, 12);
      p.moveTo(9, 15);
      p.lineTo(18, 15);
      p.moveTo(15, 12);
      p.lineTo(18, 15);
      p.lineTo(15, 18);
      break;
    case "catapulta":
      p.moveTo(5.5, 17.5);
      p.lineTo(18.5, 17.5);
      p.moveTo(8.5, 17.5);
      p.lineTo(12, 11);
      p.lineTo(15.5, 17.5);
      p.moveTo(12, 11);
      p.lineTo(17.5, 5.5);
      p.arc(17.5, 5.5, 1.6, 0, Math.PI * 2);
      break;
    case "dragao":
      fill?.moveTo(3.5, 14);
      fill?.lineTo(12, 6.5);
      fill?.lineTo(20.5, 14);
      fill?.lineTo(15, 12);
      fill?.lineTo(12, 18);
      fill?.lineTo(9, 12);
      fill?.closePath();
      break;
    case "torre":
      p.moveTo(7, 18.5);
      p.lineTo(7, 8);
      p.lineTo(9, 8);
      p.lineTo(9, 5.5);
      p.lineTo(11, 5.5);
      p.lineTo(11, 8);
      p.lineTo(13, 8);
      p.lineTo(13, 5.5);
      p.lineTo(15, 5.5);
      p.lineTo(15, 8);
      p.lineTo(17, 8);
      p.lineTo(17, 18.5);
      p.closePath();
      break;
    case "ariete":
      p.moveTo(4.5, 14);
      p.lineTo(15, 14);
      p.lineTo(19.5, 12);
      p.lineTo(15, 10);
      p.lineTo(4.5, 10);
      break;
    case "abordagem":
      p.moveTo(6.5, 17.5);
      p.lineTo(17.5, 6.5);
      p.moveTo(6.5, 6.5);
      p.lineTo(17.5, 17.5);
      break;
  }
  ctx.stroke(p);
  if (fill) ctx.fill(fill);
}

export interface TokenOpts {
  dead?: number; // 0..1
  selected?: boolean;
  ghost?: boolean;
}

export function drawToken(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, house: House, role: Role, kind: SquadKind, o: TokenOpts = {}): void {
  const d = o.dead ?? 0;
  ctx.save();
  ctx.globalAlpha *= o.ghost ? 0.55 : 1 - d * 0.7;
  // sombra no chão
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(x + r * 0.15, y + r * 0.75, r * 0.95, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  if (o.selected) {
    ctx.strokeStyle = "rgba(255,214,110,.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  // borda escura (a "espessura" da ficha)
  ctx.fillStyle = d > 0 ? "#3d3a35" : house.dark;
  ctx.beginPath();
  ctx.arc(x, y + r * 0.14, r, 0, Math.PI * 2);
  ctx.fill();
  // face com brilho
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r);
  g.addColorStop(0, d > 0 ? "#7a766f" : lighten(house.color, 0.35));
  g.addColorStop(0.7, d > 0 ? "#5c5852" : house.color);
  g.addColorStop(1, d > 0 ? "#4a4741" : house.dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.55)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // anel interno
  ctx.strokeStyle = d > 0 ? "rgba(0,0,0,.3)" : "rgba(255,255,255,.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
  ctx.stroke();
  // símbolo
  ctx.translate(x - r * 0.78, y - r * 0.78);
  ctx.scale((r * 1.56) / 24, (r * 1.56) / 24);
  ctx.strokeStyle = d > 0 ? "#26231f" : house.ink;
  ctx.fillStyle = d > 0 ? "#26231f" : house.ink;
  ctx.lineWidth = kind == "knight" || kind == "dragon" ? 2.4 : 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  glyphPath(ctx, role);
  ctx.restore();
}

function lighten(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function tokenRadius(kind: SquadKind): number {
  return kind == "knight" || kind == "dragon" || kind == "siege-engine" || kind == "garrison" ? 14 : 10.5;
}

/** Posições das bolinhas de um esquadrão em volta de (cx, cy). */
export function squadLayout(kind: SquadKind, cx: number, cy: number, flip: boolean): [number, number][] {
  const n = FIGURES[kind];
  const r = tokenRadius(kind);
  if (n == 3) return [[cx - r * 1.05, cy + (flip ? -r * 0.55 : r * 0.55)], [cx + r * 1.05, cy + (flip ? -r * 0.55 : r * 0.55)], [cx, cy - (flip ? -r * 0.95 : r * 0.95)]];
  if (n == 2) return [[cx - r * 1.05, cy], [cx + r * 1.05, cy]];
  return [[cx, cy]];
}

export function squadWidth(kind: SquadKind): number {
  const r = tokenRadius(kind);
  return FIGURES[kind] == 1 ? r * 2.4 : r * 4.4;
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
}

export function drawPlacement(ctx: CanvasRenderingContext2D, v: PlaceView, t: number): PlacedToken[] {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.drawImage(terrainImage(v.field), 0, 0, W, H);
  const lanesT = FIELD_LANES[v.field];
  lanesT.forEach((tt, i) => {
    if (tt == "muralha" || tt == "portao") drawWall(ctx, i, tt == "portao", false);
  });
  // névoa sobre o lado do inimigo
  const fog = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  fog.addColorStop(0, "rgba(22,18,14,.92)");
  fog.addColorStop(0.85, "rgba(22,18,14,.78)");
  fog.addColorStop(1, "rgba(22,18,14,0)");
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, W, H * 0.5);
  const fr = rng(Math.floor(t * 2));
  ctx.fillStyle = "rgba(255,255,255,.025)";
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(((fr() * W + t * 14 * (i + 1)) % (W + 200)) - 100, 40 + fr() * H * 0.35, 120, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#efe3c6";
  ctx.font = "26px 'IM Fell English SC', Georgia, serif";
  ctx.fillText(`${v.enemy.name}`, W / 2, H * 0.17);
  ctx.font = "600 17px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(239,227,198,.75)";
  ctx.fillText(`${v.enemyCount} esquadrão(ões) escondidos na névoa`, W / 2, H * 0.17 + 30);
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
  }
  // esquadrões posicionados
  const placed: PlacedToken[] = [];
  for (const s of slots(v.field)) {
    const here = v.squads.filter((q) => q.lane == s.lane && q.row == s.row);
    if (!here.length) continue;
    const perRow = Math.max(1, Math.floor((s.w - 10) / 62));
    here.forEach((q, i) => {
      const col = i % perRow;
      const line = Math.floor(i / perRow);
      const cols = Math.min(perRow, here.length - line * perRow);
      const cw = (s.w - 10) / cols;
      const cx = s.x + 5 + cw * (col + 0.5);
      const cy = s.y + s.h * 0.58 + line * 44 - (Math.ceil(here.length / perRow) - 1) * 22;
      const ghost = v.dragging == q.id;
      squadLayout(q.kind, cx, cy, false).forEach(([x, y]) => drawToken(ctx, x, y, tokenRadius(q.kind), v.house, q.role, q.kind, { selected: v.selected == q.id, ghost }));
      placed.push({ id: q.id, x: cx - 30, y: cy - 26, w: 60, h: 52 });
    });
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

// ---------------------------------------------------------------- luta
interface Fig {
  side: Side;
  lane: Lane;
  role: Role;
  kind: SquadKind;
  x0: number;
  y0: number;
  tx: number;
  ty: number;
  r: number;
  dieAt: number;
  flank: boolean;
  jit: number;
}

interface Shot {
  from: [number, number];
  to: [number, number];
  t0: number;
  dur: number;
  kind: "arrow" | "stone" | "fire";
}

export interface BattleScene {
  field: FieldType;
  res: TacticalBattleResult;
  figs: Fig[];
  shots: Shot[];
  houses: Record<Side, House>;
  breach: boolean[];
}

export const T_END = 8.4;

export function prepareBattle(field: FieldType, res: TacticalBattleResult, squads: Record<Side, Squad[]>, houses: Record<Side, House>, seed: number): BattleScene {
  const rand = rng(seed);
  const rowY: Record<Side, Record<Row, number>> = {
    attacker: { frente: H * 0.64, tras: H * 0.82 },
    defender: { frente: H * 0.36, tras: H * 0.18 }
  };
  const figs: Fig[] = [];
  const shots: Shot[] = [];
  (["attacker", "defender"] as Side[]).forEach((side) => {
    squads[side].forEach((sq) => {
      const same = squads[side].filter((o) => o.lane == sq.lane && o.row == sq.row);
      const idx = same.findIndex((o) => o.id == sq.id);
      const spread = Math.min(70, (LW - 24) / Math.max(1, same.length));
      const cx = sq.lane * LW + LW / 2 + (idx - (same.length - 1) / 2) * spread;
      squadLayout(sq.kind, cx, rowY[side][sq.row], side == "defender").forEach(([x, y]) =>
        figs.push({ side, lane: sq.lane, role: sq.role, kind: sq.kind, x0: x, y0: y, tx: x, ty: y, r: tokenRadius(sq.kind), dieAt: Infinity, flank: false, jit: rand() * 6.28 })
      );
    });
  });
  if (res.metInCenter) figs.forEach((f) => (f.lane = 1));
  const ranged = (f: Fig): boolean => f.role == "arqueiro" || f.role == "flechas" || f.role == "catapulta" || f.role == "torre";
  const breach = [false, false, false];
  ([0, 1, 2] as Lane[]).forEach((lane) => {
    const L = res.lanes[lane];
    const here = figs.filter((f) => f.lane == lane);
    if (L.winner != null) {
      breach[lane] = L.factors.some((f) => f.kind == "wall-breach");
      here.forEach((f) => {
        const laneCx = lane * LW + LW / 2;
        const origLane = Math.min(2, Math.max(0, Math.floor(f.x0 / LW)));
        if (ranged(f)) {
          f.tx = origLane == lane ? f.x0 : laneCx + (rand() - 0.5) * LW * 0.5;
          f.ty = f.y0 + (f.side == "attacker" ? -14 : 14);
        } else {
          f.tx = laneCx + (rand() - 0.5) * LW * 0.55;
          f.ty = H * 0.5 + (f.side == "attacker" ? 1 : -1) * (14 + rand() * 24);
        }
      });
      const a = L.attackerScore;
      const d = L.defenderScore;
      const lossFor = (side: Side): number => {
        if (L.winner == "tie") return 0.4;
        if (L.winner == side) return Math.min(0.5, 0.12 + 0.5 * (Math.min(a, d) / Math.max(a, d)));
        return 0.85;
      };
      (["attacker", "defender"] as Side[]).forEach((side) => {
        const mine = here.filter((f) => f.side == side);
        const k = Math.round(mine.length * lossFor(side));
        const order = [...mine].sort(() => rand() - 0.5).sort((p, q) => Number(ranged(p)) - Number(ranged(q)));
        order.slice(0, k).forEach((f, i) => (f.dieAt = 3.4 + (i / Math.max(1, k)) * 2.5 + rand() * 0.3));
      });
      here.filter(ranged).forEach((f) => {
        const targets = here.filter((x) => x.side != f.side);
        for (let tt = 1.1; tt < 5.6; tt += 0.5 + rand() * 0.4) {
          const tg = targets[Math.floor(rand() * targets.length)];
          if (!tg) break;
          shots.push({ from: [f.x0, f.y0], to: [tg.tx, tg.ty], t0: tt, dur: 0.6, kind: f.role == "catapulta" ? "stone" : "arrow" });
        }
      });
      here
        .filter((f) => f.role == "dragao")
        .forEach((f) => {
          for (let tt = 2.0; tt < 5.6; tt += 0.9) shots.push({ from: [f.x0, f.y0], to: [lane * LW + LW / 2 + (rand() - 0.5) * 60, H * 0.5 + (f.side == "attacker" ? -40 : 40)], t0: tt, dur: 0.45, kind: "fire" });
        });
    } else {
      const targets = ([0, 1, 2] as Lane[]).filter((n) => Math.abs(n - lane) == 1 && res.lanes[n].winner != null);
      here.forEach((f, i) => {
        if (targets.length) {
          const n = targets[i % targets.length];
          f.flank = true;
          f.tx = n * LW + LW / 2 + (n > lane ? -1 : 1) * LW * 0.33;
          f.ty = H * 0.5 + (f.side == "attacker" ? 1 : -1) * 44;
        } else {
          f.tx = f.x0;
          f.ty = f.y0 + (f.side == "attacker" ? -36 : 36);
        }
      });
    }
  });
  return { field, res, figs, shots, houses, breach };
}

function figPos(f: Fig, t: number): [number, number] {
  const adv = ease((t - 1) / 2);
  let x = f.x0 + (f.tx - f.x0) * adv;
  let y = f.y0 + (f.ty - f.y0) * adv;
  if (t > 3 && t < 6.2 && !f.flank) {
    x += Math.sin(t * 9 + f.jit) * 2.2;
    y += Math.cos(t * 7 + f.jit) * 1.6;
  }
  return [x, y];
}

export function drawBattle(ctx: CanvasRenderingContext2D, sc: BattleScene, t: number): void {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.drawImage(terrainImage(sc.field), 0, 0, W, H);
  const lanesT = FIELD_LANES[sc.field];
  lanesT.forEach((tt, i) => {
    if (tt == "muralha" || tt == "portao") drawWall(ctx, i, tt == "portao", sc.breach[i] && t > 3.1);
  });
  // rótulos
  const tag = (text: string, cx: number, y: number, bg: string, ink: string): void => {
    ctx.font = "700 16px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tw = ctx.measureText(text).width + 22;
    ctx.fillStyle = bg;
    roundRect(ctx, cx - tw / 2, y - 13, tw, 26, 13);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.fillText(text, cx, y + 1);
  };
  lanesT.forEach((tt, i) => tag(TERRAIN_NAMES[tt], i * LW + LW / 2, 20, "rgba(18,14,10,.75)", "#efe3c6"));
  tag(`${sc.houses.defender.name} defende`, W / 2, 52, sc.houses.defender.color, sc.houses.defender.ink);
  tag(`${sc.houses.attacker.name} ataca`, W / 2, H - 22, sc.houses.attacker.color, sc.houses.attacker.ink);
  // poeira do choque
  if (t > 2.6 && t < 6.6) {
    sc.res.lanes.forEach((L, i) => {
      if (L.winner == null) return;
      const a = Math.min(1, (t - 2.6) / 0.6) * Math.min(1, (6.6 - t) / 0.6);
      const g = ctx.createRadialGradient(i * LW + LW / 2, H * 0.5, 5, i * LW + LW / 2, H * 0.5, LW * 0.55);
      g.addColorStop(0, `rgba(200,180,140,${0.35 * a})`);
      g.addColorStop(1, "rgba(200,180,140,0)");
      ctx.fillStyle = g;
      ctx.fillRect(i * LW, H * 0.3, LW, H * 0.4);
    });
  }
  const appear = ease(t / 0.8);
  [...sc.figs]
    .map((f) => {
      const [x, y] = figPos(f, t);
      return { f, x, y };
    })
    .sort((a, b) => a.y - b.y)
    .forEach(({ f, x, y }) => {
      const d = t < f.dieAt ? 0 : Math.min(1, (t - f.dieAt) / 0.5);
      let ry = 0;
      const L = sc.res.lanes[f.lane];
      if (t > 6.2 && L.winner && L.winner != "tie" && L.winner != f.side && d == 0) ry = (f.side == "attacker" ? 1 : -1) * ease((t - 6.2) / 1.4) * 80;
      ctx.save();
      ctx.globalAlpha = appear;
      const yy = y + ry + (f.kind == "dragon" ? -10 + Math.sin(t * 4 + f.jit) * 4 : 0);
      if (f.kind == "dragon") {
        const h = sc.houses[f.side];
        ctx.fillStyle = h.dark;
        const flap = Math.sin(t * 8 + f.jit) * 6;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x - f.r * 2.6, yy - f.r * 0.6 + flap);
        ctx.lineTo(x - f.r * 1.2, yy + f.r * 0.5);
        ctx.closePath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + f.r * 2.6, yy - f.r * 0.6 + flap);
        ctx.lineTo(x + f.r * 1.2, yy + f.r * 0.5);
        ctx.closePath();
        ctx.fill();
      }
      drawToken(ctx, x, yy, f.r * (1 - d * 0.3), sc.houses[f.side], f.role, f.kind, { dead: d });
      ctx.restore();
    });
  // disparos
  sc.shots.forEach((s) => {
    const p = (t - s.t0) / s.dur;
    if (p < 0 || p > 1) return;
    const x = s.from[0] + (s.to[0] - s.from[0]) * p;
    const arc = s.kind == "stone" ? 70 : s.kind == "fire" ? 0 : 34;
    const y = s.from[1] + (s.to[1] - s.from[1]) * p - Math.sin(p * Math.PI) * arc;
    if (s.kind == "arrow") {
      const dx = s.to[0] - s.from[0];
      const dy = s.to[1] - s.from[1] - Math.cos(p * Math.PI) * arc * 3;
      const len = Math.hypot(dx, dy) || 1;
      ctx.strokeStyle = "#f6edd6";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - (dx / len) * 11, y - (dy / len) * 11);
      ctx.stroke();
    } else if (s.kind == "stone") {
      ctx.fillStyle = "#3b3833";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const g = ctx.createRadialGradient(x, y, 1, x, y, 10 + p * 22);
      g.addColorStop(0, `rgba(255,240,170,${0.9 - p * 0.5})`);
      g.addColorStop(0.5, `rgba(255,140,40,${0.7 - p * 0.4})`);
      g.addColorStop(1, "rgba(200,50,10,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 10 + p * 22, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // faíscas
  if (t > 3 && t < 6) {
    sc.res.lanes.forEach((L, i) => {
      if (L.winner == null) return;
      const rr = rng(Math.floor(t * 14) + i * 97);
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = "rgba(255,244,210,.95)";
        const sx = i * LW + LW * (0.22 + rr() * 0.56);
        const sy = H * 0.5 + (rr() - 0.5) * 34;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 4);
        ctx.lineTo(sx + 1.5, sy);
        ctx.lineTo(sx, sy + 4);
        ctx.lineTo(sx - 1.5, sy);
        ctx.fill();
      }
    });
  }
  // quem venceu cada faixa
  if (t > 6.4) {
    sc.res.lanes.forEach((L, i) => {
      if (L.winner == null) return;
      const a = ease((t - 6.4) / 0.6);
      ctx.save();
      ctx.globalAlpha = a;
      const label = L.winner == "tie" ? "EMPATE" : sc.houses[L.winner].name.toUpperCase();
      const bg = L.winner == "tie" ? "#2a2722" : sc.houses[L.winner].color;
      const ink = L.winner == "tie" ? "#f1e7d0" : sc.houses[L.winner].ink;
      ctx.font = "700 19px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tw = ctx.measureText(label).width + 30;
      const cx = i * LW + LW / 2;
      // bandeirola
      ctx.fillStyle = "rgba(0,0,0,.35)";
      roundRect(ctx, cx - tw / 2 + 3, H / 2 - 15, tw, 34, 6);
      ctx.fill();
      ctx.fillStyle = bg;
      roundRect(ctx, cx - tw / 2, H / 2 - 18, tw, 34, 6);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.fillText(label, cx, H / 2 - 0.5);
      ctx.restore();
    });
  }
}
