/** Desenho do campo (posicionamento e luta) no canvas. */
import { Lane } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { FIELD_LANES, FieldType, Role, Row, SquadKind, slotMaxFor, Terrain } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { rng } from "../solver";
import { House, TERRAIN_NAMES } from "./data";
import { grassImage } from "./assets";
import { drawSquad, kindOf } from "./figures";
import { detailLane, drawSeaWaves } from "./ground";
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
  detailLane(ctx, x, w, t, r);
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
  /** tentou pôr numa casinha cheia: pisca em vermelho (age = segundos desde o toque) */
  fullSlot?: { lane: Lane; row: Row; age: number } | null;
  dragging: string | null;
  showHint: boolean;
  /** quanto a peça escolhida rende em cada casinha (só pelo lugar) */
  preview?: { lane: Lane; row: Row; pct: number; best: boolean; force: number; base: number }[] | null;
  /** legenda dos números, ex.: "Peça 2 · Lanceiro" */
  previewLabel?: string;
  /** peça escolhida já está no campo (e pode voltar): mostra o botão "Voltar p/ reserva" no canto */
  canReturn?: boolean;
  /** cor da bandeira das torres (de quem defende) */
  wallFlag?: string;
  /** sua força em cada faixa se a luta for lá (quem está nela + ajuda de longe) */
  laneForce?: { total: number; here: number; help: number }[];
  /** força total do inimigo (as peças dele estão no tabuleiro, todo mundo sabe) */
  enemyForce?: number;
  /** se o inimigo vier todo para a faixa com cada função: você ganha, perde ou empata */
  outlook?: { role: Role; kind: SquadKind; out: "win" | "lose" | "tie" }[][];
  /** reação: o exército inimigo já aparece (sem névoa) */
  enemySquads?: { id: string; kind: SquadKind; role: Role; lane: Lane | null; row: Row }[];
  /** esquadrão que o inimigo mudou na reação (destacado) */
  enemyChanged?: string | null;
  /** esquadrão seu que você mudou na reação */
  changed?: string | null;
  /** faixas onde você tem formação (corpo a corpo na frente + atirador atrás): +15% */
  formation?: boolean[];
  /** reação: quem ganharia cada faixa se a luta fosse agora */
  laneOutcome?: ("win" | "lose" | "tie" | null)[];
}

/** Casinhas do inimigo (espelho das suas, do outro lado do campo). */
function enemySlot(field: FieldType, lane: Lane, row: Row): Slot | undefined {
  const s = slots(field).find((x) => x.lane == lane && x.row == row);
  if (!s) return undefined;
  return { ...s, y: H - s.y - s.h };
}

/** Reação: desenha o exército inimigo nas casinhas dele, virado para você. */
function drawEnemySquads(ctx: CanvasRenderingContext2D, v: PlaceView, t: number): void {
  const list = v.enemySquads ?? [];
  // fundo levemente escuro do lado dele (sem névoa: agora todo mundo vê)
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  g.addColorStop(0, "rgba(16,20,26,.35)");
  g.addColorStop(1, "rgba(16,20,26,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.5);
  ([0, 1, 2] as Lane[]).forEach((lane) =>
    (["frente", "tras"] as Row[]).forEach((row) => {
      const s = enemySlot(v.field, lane, row);
      if (!s) return;
      ctx.fillStyle = "rgba(15,12,8,.32)";
      roundRect(ctx, s.x, s.y, s.w, s.h, 12);
      ctx.fill();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(255,236,190,.18)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      const here = list.filter((q) => q.lane == lane && q.row == row);
      if (!here.length) return;
      const w = Math.min(64, (s.w - 8) / here.length);
      here.forEach((q, i) => {
        const x = s.x + s.w / 2 + (i - (here.length - 1) / 2) * w;
        const y = s.y + s.h * 0.72;
        const box = drawSquad(ctx, x, y, q.kind, q.role, v.enemy, { scale: here.length > 2 ? 0.85 : 1, selected: false, ghost: false, time: t, flip: true, num: list.indexOf(q) + 1 });
        if (v.enemyChanged == q.id) tagAbove(ctx, box.x + box.w / 2, box.y - 4, "mudou", "#c9302c");
      });
    })
  );
}

function tagAbove(ctx: CanvasRenderingContext2D, cx: number, y: number, txt: string, color: string): void {
  ctx.font = "800 12px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
  const tw = ctx.measureText(txt).width + 14;
  ctx.fillStyle = color;
  roundRect(ctx, cx - tw / 2, y - 18, tw, 18, 9);
  ctx.fill();
  ctx.fillStyle = "#fff6e2";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(txt, cx, y - 8.5);
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


function drawFog(ctx: CanvasRenderingContext2D, t: number, enemy: House, count: number, force?: number): void {
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
  const bw = 210;
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
  ctx.font = "800 17px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
  void force;
  ctx.fillText(`${count} ${count == 1 ? "esquadrão escondido" : "esquadrões escondidos"}`, cx, top + 47, bw - 10);
}

/** onde está o botão "Voltar p/ reserva" desenhado no campo (para o toque) */
export let backBtnRect: { x: number; y: number; w: number; h: number } | null = null;

export function drawPlacement(ctx: CanvasRenderingContext2D, v: PlaceView, t: number): PlacedToken[] {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(terrainImage(v.field), 0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  const lanesT = FIELD_LANES[v.field];
  if (v.field == "mar") drawSeaWaves(ctx, t, W);
  if (v.enemySquads) {
    // Corvo: o exército inimigo aparece POR CIMA da muralha (senão a pedra esconde quem está atrás)
    drawWalls(ctx, v.field, [false, false, false], v.wallFlag ?? v.enemy.color);
    drawEnemySquads(ctx, v, t);
  } else {
    drawFog(ctx, t, v.enemy, v.enemyCount, v.enemyForce);
    // a muralha é do terreno (todo mundo sabe onde ela está): fica por cima da névoa
    drawWalls(ctx, v.field, [false, false, false], v.wallFlag ?? v.enemy.color);
  }
  drawWallBadges(ctx, v.field);
  // nome do terreno de cada faixa (na linha do meio)
  lanesT.forEach((tt, i) => {
    const oc = v.laneOutcome?.[i];
    const label = TERRAIN_NAMES[tt] + (v.laneOutcome && tt != "bloqueado" ? (oc == "win" ? " · ✓ sua" : oc == "lose" ? " · ✗ dele" : oc == "tie" ? " · empate" : " · sem luta") : "");
    ctx.font = "700 19px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    const tw = Math.min(LW - 8, ctx.measureText(label).width + 20);
    const cx = i * LW + LW / 2;
    ctx.fillStyle = oc == "win" ? "rgba(36,96,34,.92)" : oc == "lose" ? "rgba(140,40,32,.92)" : "rgba(18,14,10,.78)";
    roundRect(ctx, cx - tw / 2, H * 0.49 - 16, tw, 32, 16);
    ctx.fill();
    ctx.fillStyle = "#efe3c6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, H * 0.49 + 1, LW - 20);
  });
  // aviso de casinha cheia: desenhado por último, em cima das peças (31/out: ficava escondido atrás delas)
  const fullMarks: (() => void)[] = [];
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
    ctx.font = "700 15px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255,240,205,.8)";
    ctx.fillText(s.row == "frente" ? "FRENTE" : "TRÁS", s.x + 10, s.y + 8);
    // casinha cheia (2 peças): avisa quando tem peça escolhida para pôr
    const others = v.squads.filter((q) => q.lane == s.lane && q.row == s.row && q.id != v.selected).length;
    const flash = v.fullSlot && v.fullSlot.lane == s.lane && v.fullSlot.row == s.row && v.fullSlot.age < 1.4 ? 1 - v.fullSlot.age / 1.4 : 0;
    if ((v.selected && others >= slotMaxFor(v.field) && !v.squads.some((q) => q.id == v.selected && q.lane == s.lane && q.row == s.row)) || flash > 0) fullMarks.push(() => {
      ctx.save();
      if (flash > 0) {
        ctx.strokeStyle = `rgba(230,70,50,${0.4 + 0.6 * flash})`;
        ctx.lineWidth = 4;
        roundRect(ctx, s.x, s.y, s.w, s.h, 12);
        ctx.stroke();
      }
      const txt = flash > 0 ? `cheia: máx. ${slotMaxFor(v.field)}` : "cheia";
      ctx.font = "800 13px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tw = ctx.measureText(txt).width + 16;
      ctx.fillStyle = flash > 0 ? "rgba(170,40,30,.95)" : "rgba(20,15,10,.8)";
      const ly = s.y + 38;
      roundRect(ctx, s.x + s.w / 2 - tw / 2, ly - 10, tw, 20, 10);
      ctx.fill();
      ctx.fillStyle = "#fff1dc";
      ctx.fillText(txt, s.x + s.w / 2, ly + 1);
      ctx.restore();
    });
    // quanto a peça escolhida rende aqui
    const pv = v.preview?.find((x) => x.lane == s.lane && x.row == s.row);
    if (pv) {
      // em palavras (sem número, para não confundir com a força do tabuleiro)
      const txt = pv.best && pv.pct > 0 ? "★ melhor" : pv.pct > 0 ? "▲ bom" : pv.pct < 0 ? "▼ fraco" : "normal";
      ctx.font = "800 19px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
      const tw = ctx.measureText(txt).width + 18;
      const bx = s.x + s.w - tw - 6;
      const by = s.y + 6;
      ctx.fillStyle = pv.pct > 0 ? "#2f6b2a" : pv.pct < 0 ? "#8a2f25" : "rgba(30,24,18,.85)";
      roundRect(ctx, bx, by, tw, 30, 15);
      ctx.fill();
      if (pv.best && pv.pct > 0) {
        ctx.strokeStyle = "#f2cf7e";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = "#fff6e2";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, bx + tw / 2, by + 15.5);
    }
  }
  // formação: selo dourado entre a frente e a trás da faixa
  v.formation?.forEach((on, i) => {
    if (!on) return;
    const cx = i * LW + LW / 2;
    const y = H * 0.725;
    const txt = "formação +15%";
    ctx.font = "800 17px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    const tw = ctx.measureText(txt).width + 18;
    ctx.fillStyle = "#c99a2e";
    roundRect(ctx, cx - tw / 2, y - 13, tw, 26, 13);
    ctx.fill();
    ctx.strokeStyle = "#5a3d0c";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#24180a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, cx, y + 1);
  });
  // esquadrões posicionados: cada peça vira 4 bonequinhos; cabem pelo menos 2 peças por casinha
  const placed: PlacedToken[] = [];
  // os números são desenhados no fim, por cima de todos os bonecos (senão um esconde o do outro)
  const badges: { x: number; y: number; n: number; sel: boolean; r: number }[] = [];
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
        const box = drawSquad(ctx, x + w / 2, fy, q.kind, q.role, v.house, { scale, selected: v.selected == q.id, ghost: v.dragging == q.id, time: t });
        badges.push({ x: box.x + 2 * scale, y: fy + 2 * scale, n: v.squads.indexOf(q) + 1, sel: v.selected == q.id, r: 11 * scale });
        if (v.changed == q.id) tagAbove(ctx, box.x + box.w / 2, box.y - 2, "mudou", "#b07a12");
        placed.push({ id: q.id, ...box });
        x += w;
      });
    });
  }
  for (const b of badges) {
    ctx.fillStyle = b.sel ? "#f2cf7e" : "#1d1610";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = b.sel ? "#6e4f16" : v.house.color;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = b.sel ? "#23180a" : "#fff6e2";
    ctx.font = `800 ${Math.round(b.r * 1.35)}px 'Alegreya Sans', 'Trebuchet MS', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(b.n), b.x, b.y + 0.5);
  }
  backBtnRect = null;
  if (v.canReturn) {
    // botão no canto de baixo, à direita (31/out): só aparece com uma peça do campo escolhida
    const bw = 210;
    const bh = 40;
    const bx = W - bw - 10;
    const by = H - bh - 8;
    backBtnRect = { x: bx, y: by, w: bw, h: bh };
    ctx.fillStyle = "rgba(18,14,10,.9)";
    roundRect(ctx, bx, by, bw, bh, 20);
    ctx.fill();
    ctx.strokeStyle = "#e0b354";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    roundRect(ctx, bx, by, bw, bh, 20);
    ctx.stroke();
    ctx.setLineDash([]);
    // seta de voltar
    ctx.strokeStyle = "#e0b354";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const ax = bx + 22;
    const ay = by + bh / 2;
    ctx.beginPath();
    ctx.moveTo(ax + 6, ay - 8);
    ctx.lineTo(ax - 2, ay - 2);
    ctx.lineTo(ax + 6, ay + 4);
    ctx.moveTo(ax - 1, ay - 2);
    ctx.lineTo(ax + 12, ay - 2);
    ctx.quadraticCurveTo(ax + 18, ay - 2, ax + 18, ay + 5);
    ctx.quadraticCurveTo(ax + 18, ay + 11, ax + 10, ay + 11);
    ctx.stroke();
    ctx.font = "800 19px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f2cf7e";
    ctx.fillText("Voltar p/ reserva", bx + 48, ay + 1, bw - 56);
  }
  if (v.preview && v.previewLabel) {
    // com o botão no canto, a legenda fica curta e à esquerda
    const txt = v.canReturn ? v.previewLabel : `${v.previewLabel}: onde ele rende mais (verde = melhor)`;
    ctx.font = "700 19px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const maxW = v.canReturn ? W - 250 : W - 16;
    const tw = Math.min(maxW, ctx.measureText(txt).width + 24);
    const cx = v.canReturn ? 10 + tw / 2 : W / 2;
    ctx.fillStyle = "rgba(18,14,10,.85)";
    roundRect(ctx, cx - tw / 2, H - 38, tw, 30, 15);
    ctx.fill();
    ctx.fillStyle = "#f2cf7e";
    ctx.fillText(txt, cx, H - 22.5, tw - 16);
  }
  fullMarks.forEach((f) => f());
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

