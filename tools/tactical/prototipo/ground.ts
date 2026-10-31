/**
 * Detalhes do chão em pixel art (pintados em 1× e ampliados sem suavizar):
 * tufos de grama, flores, pedrinhas, arbustos, carvalhos e pinheiros, troncos, rio com margem,
 * juncos, pântano com vitórias-régias, dunas, rochas, mar com ondas. Tudo desenho próprio.
 * O meio do campo (onde as linhas se chocam) fica mais limpo, para a luta aparecer bem.
 */
import { Terrain } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";

const H = 780;
const MID = H / 2;

type R = () => number;

function px(ctx: CanvasRenderingContext2D, x: number, y: number, c: string, w = 1, h = 1): void {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, rad: number, c: string, sy = 1): void {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(Math.round(cx), Math.round(cy), Math.max(0.5, rad), Math.max(0.5, rad * sy), 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Longe da linha do choque? (deixa o meio mais limpo) */
const clearMid = (y: number, band: number): boolean => Math.abs(y - MID) > band;

// ---------------------------------------------------------------- peças pequenas
function tuft(ctx: CanvasRenderingContext2D, x: number, y: number, r: R, dark = "#3b5524", mid = "#58783a", light = "#89aa5c"): void {
  px(ctx, x, y, dark);
  px(ctx, x - 1, y - 1, mid);
  px(ctx, x + 1, y - 1, mid);
  px(ctx, x + (r() < 0.5 ? -1 : 1), y - 2, light);
  if (r() < 0.4) px(ctx, x + 2, y, dark);
}

function flower(ctx: CanvasRenderingContext2D, x: number, y: number, r: R): void {
  const c = ["#e8d36a", "#f2efe0", "#b99be0", "#e48a6a"][Math.floor(r() * 4)];
  px(ctx, x, y + 1, "#3b5524");
  px(ctx, x, y, c);
  if (r() < 0.5) px(ctx, x + 1, y, c);
}

function pebble(ctx: CanvasRenderingContext2D, x: number, y: number, r: R, big = false): void {
  const w = big ? 3 + Math.floor(r() * 3) : 2;
  const h = big ? 2 + Math.floor(r() * 2) : 1;
  px(ctx, x, y + h, "rgba(0,0,0,.3)", w + 1, 1);
  px(ctx, x, y, "#8d877c", w, h);
  px(ctx, x, y, "#b4ad9f", w - 1, 1);
  if (big) px(ctx, x + w - 1, y + 1, "#5f5a52", 1, h - 1);
}

function bush(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, r: R, tone: [string, string, string, string] = ["#1c2f15", "#2f4c22", "#43682f", "#6c9447"]): void {
  disc(ctx, x + 3, y + 3, rad + 1, "rgba(0,0,0,.28)", 0.7);
  disc(ctx, x, y, rad + 1, tone[0]);
  disc(ctx, x, y, rad, tone[1]);
  for (let k = 0; k < 3; k++) disc(ctx, x - rad * 0.3 + r() * rad * 0.6, y - rad * 0.3 + r() * rad * 0.4, rad * 0.55, tone[2]);
  disc(ctx, x - rad * 0.35, y - rad * 0.4, rad * 0.28, tone[3]);
}

/** Carvalho visto de cima: copa com vários "lóbulos", contorno escuro, luz em cima à esquerda. */
function oak(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, r: R): void {
  disc(ctx, x + rad * 0.45, y + rad * 0.55, rad * 1.05, "rgba(6,14,4,.4)", 0.75);
  const lobes: [number, number, number][] = [[0, 0, 1]];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + r();
    lobes.push([Math.cos(a) * rad * 0.55, Math.sin(a) * rad * 0.5, 0.55 + r() * 0.15]);
  }
  for (const [dx, dy, s] of lobes) disc(ctx, x + dx, y + dy, rad * s + 1, "#17280f");
  for (const [dx, dy, s] of lobes) disc(ctx, x + dx, y + dy, rad * s, "#2a4520");
  for (const [dx, dy, s] of lobes) disc(ctx, x + dx - rad * 0.12, y + dy - rad * 0.15, rad * s * 0.7, "#3a5d2b");
  for (const [dx, dy, s] of lobes) if (dx < rad * 0.2 && dy < rad * 0.2) disc(ctx, x + dx - rad * 0.22, y + dy - rad * 0.25, rad * s * 0.34, "#5b8640");
  for (let k = 0; k < 4; k++) px(ctx, x - rad * 0.5 + r() * rad * 0.5, y - rad * 0.6 + r() * rad * 0.4, "#86b05e");
}

/** Pinheiro visto de cima: estrela de galhos em camadas, mais escuro. */
function pine(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, r: R): void {
  disc(ctx, x + rad * 0.5, y + rad * 0.6, rad, "rgba(6,14,4,.42)", 0.75);
  const spokes = 8;
  for (const [k, c] of [[1, "#12210f"], [0.82, "#1f3a1d"], [0.6, "#2c5129"], [0.36, "#3f6b37"]] as [number, string][]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    for (let i = 0; i <= spokes * 2; i++) {
      const a = (i / (spokes * 2)) * Math.PI * 2 + r() * 0.1;
      const rr = rad * k * (i % 2 ? 0.62 : 1);
      ctx.lineTo(Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr));
    }
    ctx.fill();
  }
  px(ctx, x - 1, y - 1, "#6f9a58", 2, 1);
}

function log(ctx: CanvasRenderingContext2D, x: number, y: number, len: number): void {
  px(ctx, x, y + 3, "rgba(0,0,0,.3)", len, 2);
  px(ctx, x, y, "#5a3d22", len, 4);
  px(ctx, x, y, "#7a5530", len, 1);
  px(ctx, x + len - 1, y, "#b08a5a", 2, 4);
  px(ctx, x + len, y + 1, "#7a5530", 1, 2);
}

function rock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, r: R): void {
  disc(ctx, x + 2, y + s * 0.5, s * 1.05, "rgba(0,0,0,.3)", 0.6);
  ctx.fillStyle = "#6b665d";
  ctx.beginPath();
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = s * (0.8 + r() * 0.35);
    ctx.lineTo(Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr * 0.75));
  }
  ctx.fill();
  disc(ctx, x - s * 0.25, y - s * 0.2, s * 0.55, "#8d877c", 0.75);
  disc(ctx, x - s * 0.35, y - s * 0.35, s * 0.25, "#b0a99b", 0.75);
  px(ctx, x + s * 0.4, y + s * 0.2, "#4a463f", 2, 1);
}

function reeds(ctx: CanvasRenderingContext2D, x: number, y: number, r: R): void {
  for (let k = 0; k < 4; k++) {
    const xx = x + k * 2 - 3 + Math.floor(r() * 2);
    const h = 4 + Math.floor(r() * 5);
    px(ctx, xx, y - h, r() < 0.5 ? "#6f8a3a" : "#8aa34c", 1, h);
    if (r() < 0.5) px(ctx, xx, y - h - 2, "#6b4a2a", 1, 2);
  }
}

// ---------------------------------------------------------------- por terreno
function grassland(ctx: CanvasRenderingContext2D, x0: number, w: number, r: R, density = 1): void {
  // manchas de terra
  for (let i = 0; i < 5 * density; i++) {
    const cx = x0 + r() * w;
    const cy = r() * H;
    if (!clearMid(cy, 60)) continue;
    const rad = 6 + r() * 12;
    disc(ctx, cx, cy, rad, "rgba(110,92,58,.32)", 0.6);
    disc(ctx, cx - 1, cy - 1, rad * 0.6, "rgba(130,110,70,.25)", 0.6);
  }
  for (let i = 0; i < 300 * density; i++) tuft(ctx, x0 + r() * w, r() * H, r);
  for (let i = 0; i < 40 * density; i++) flower(ctx, x0 + r() * w, r() * H, r);
  for (let i = 0; i < 26 * density; i++) pebble(ctx, x0 + r() * w, r() * H, r, r() < 0.3);
  for (let i = 0; i < 5 * density; i++) {
    const y = r() * H;
    if (clearMid(y, 80)) bush(ctx, x0 + 8 + r() * (w - 16), y, 4 + r() * 4, r);
  }
}

function forest(ctx: CanvasRenderingContext2D, x0: number, w: number, r: R): void {
  // chão de folhas mais escuro
  for (let i = 0; i < 260; i++) px(ctx, x0 + r() * w, r() * H, r() < 0.5 ? "rgba(70,52,28,.35)" : "rgba(30,50,20,.35)", 2, 1);
  for (let i = 0; i < 160; i++) tuft(ctx, x0 + r() * w, r() * H, r, "#2a3f1b", "#3f5c2a", "#5f7f40");
  for (let i = 0; i < 8; i++) {
    const y = r() * H;
    if (clearMid(y, 70)) log(ctx, x0 + 10 + r() * (w - 40), y, 10 + Math.floor(r() * 10));
  }
  for (let i = 0; i < 18; i++) {
    const y = r() * H;
    if (clearMid(y, 55)) bush(ctx, x0 + r() * w, y, 3 + r() * 3, r, ["#16260f", "#26401c", "#365a28", "#5b8640"]);
  }
  // árvores: mais densas nas bordas da faixa, meio mais livre
  const trees: [number, number, number, boolean][] = [];
  for (let i = 0; i < 46; i++) {
    const y = r() * H;
    if (!clearMid(y, 52)) continue;
    const edge = r() < 0.65;
    const x = edge ? (r() < 0.5 ? x0 + r() * w * 0.28 : x0 + w - r() * w * 0.28) : x0 + r() * w;
    trees.push([x, y, 9 + r() * 10, r() < 0.4]);
  }
  trees.sort((a, b) => a[1] - b[1]).forEach(([x, y, rad, isPine]) => (isPine ? pine(ctx, x, y, rad, r) : oak(ctx, x, y, rad, r)));
}

function hills(ctx: CanvasRenderingContext2D, x0: number, w: number, r: R): void {
  grassland(ctx, x0, w, r, 0.6);
  // morro com curvas de nível: cada degrau com luz em cima e sombra embaixo
  const cx = x0 + w / 2;
  const cy = H * 0.2;
  for (let k = 6; k >= 0; k--) {
    const rx = w * (0.14 + k * 0.065);
    const ry = H * (0.035 + k * 0.022);
    disc(ctx, cx + 3, cy + 4, rx, "rgba(60,44,20,.22)", ry / rx);
    disc(ctx, cx, cy, rx, k % 2 ? "#8a7a4e" : "#7f7045", ry / rx);
    disc(ctx, cx - 2, cy - 2, rx * 0.96, k % 2 ? "#978757" : "#8c7c4f", ry / rx);
  }
  for (let i = 0; i < 9; i++) rock(ctx, x0 + 12 + r() * (w - 24), H * 0.05 + r() * H * 0.32, 3 + r() * 4, r);
  for (let i = 0; i < 60; i++) tuft(ctx, x0 + r() * w, H * 0.05 + r() * H * 0.33, r, "#5a5a2a", "#76763a", "#9a9a5a");
}

function river(ctx: CanvasRenderingContext2D, x0: number, w: number, r: R, ford: boolean): void {
  grassland(ctx, x0, w, r, 0.7);
  const top = (i: number): number => H * 0.45 + Math.sin(i * 0.9 + x0 * 0.02) * 7;
  const bot = (i: number): number => H * 0.55 + Math.sin(i * 0.9 + x0 * 0.02 + 1.4) * 7;
  const N = 20;
  const path = (off: number, ff: (i: number) => number, gg: (i: number) => number): void => {
    ctx.beginPath();
    ctx.moveTo(x0, ff(0) - off);
    for (let i = 0; i <= N; i++) ctx.lineTo(x0 + (w * i) / N, ff((i * 12) / N) - off);
    for (let i = N; i >= 0; i--) ctx.lineTo(x0 + (w * i) / N, gg((i * 12) / N) + off);
    ctx.closePath();
  };
  // margem de areia e cascalho
  ctx.fillStyle = "#a3946a";
  path(7, top, bot);
  ctx.fill();
  for (let i = 0; i < 70; i++) pebble(ctx, x0 + r() * w, H * 0.43 + r() * H * 0.14, r, r() < 0.2);
  // água: mais escura no fundo, clara perto da margem
  ctx.fillStyle = "#4f86a2";
  path(0, top, bot);
  ctx.fill();
  ctx.fillStyle = ford ? "#4a7f99" : "#326886";
  path(-6, top, bot);
  ctx.fill();
  ctx.fillStyle = ford ? "#47799a" : "#285a78";
  path(-12, top, bot);
  ctx.fill();
  // brilhos e correnteza
  for (let i = 0; i < 26; i++) {
    const xx = x0 + r() * w;
    const yy = H * 0.465 + r() * H * 0.07;
    px(ctx, xx, yy, "rgba(220,240,255,.55)", 3 + Math.floor(r() * 4), 1);
  }
  for (let i = 0; i < 18; i++) px(ctx, x0 + r() * w, H * 0.455 + r() * H * 0.005, "rgba(255,255,255,.6)", 2, 1);
  // juncos na margem
  for (let i = 0; i < 10; i++) reeds(ctx, x0 + 6 + r() * (w - 12), r() < 0.5 ? H * 0.445 : H * 0.565, r);
  if (ford) {
    // pedras do vau, por onde dá para atravessar
    for (let i = 0; i < 11; i++) {
      const yy = H * 0.455 + i * 7.5;
      const xx = x0 + w * 0.5 + Math.sin(i) * 10;
      disc(ctx, xx + 1, yy + 2, 6, "rgba(0,0,0,.25)", 0.6);
      disc(ctx, xx, yy, 6, "#9c9585", 0.6);
      disc(ctx, xx - 1, yy - 1, 3.5, "#c2bba9", 0.6);
    }
  }
}

function swamp(ctx: CanvasRenderingContext2D, x0: number, w: number, r: R, causeway: boolean): void {
  for (let i = 0; i < 260; i++) px(ctx, x0 + r() * w, r() * H, r() < 0.5 ? "rgba(50,42,24,.35)" : "rgba(40,60,40,.3)", 2, 1);
  // poças escuras com reflexo
  for (let i = 0; i < 16; i++) {
    const cx = x0 + r() * w;
    const cy = r() * H;
    const rx = 12 + r() * 20;
    disc(ctx, cx, cy, rx + 2, "#3b4a2f", 0.45);
    disc(ctx, cx, cy, rx, "#24392f", 0.45);
    px(ctx, cx - rx * 0.4, cy - 2, "rgba(190,220,210,.35)", Math.round(rx * 0.5), 1);
    // vitórias-régias
    for (let k = 0; k < 3; k++) {
      const lx = cx - rx * 0.6 + r() * rx * 1.2;
      const ly = cy - 3 + r() * 6;
      disc(ctx, lx, ly, 2.5, "#4f7a34", 0.8);
      px(ctx, lx, ly - 1, "#24392f", 1, 2);
      if (r() < 0.3) px(ctx, lx + 1, ly - 1, "#efd7e8");
    }
  }
  for (let i = 0; i < 40; i++) reeds(ctx, x0 + r() * w, r() * H, r);
  for (let i = 0; i < 120; i++) tuft(ctx, x0 + r() * w, r() * H, r, "#3a4a24", "#55683a", "#7a8c4f");
  for (let i = 0; i < 4; i++) {
    const y = r() * H;
    if (!clearMid(y, 60)) continue;
    const sx = x0 + 10 + r() * (w - 20);
    disc(ctx, sx + 2, y + 2, 5, "rgba(0,0,0,.3)");
    disc(ctx, sx, y, 5, "#4a3420");
    disc(ctx, sx, y, 3, "#6a4c2c");
    px(ctx, sx - 1, y - 1, "#8a6a44", 2, 1);
  }
  if (causeway) {
    // calçada de madeira por cima do pântano
    const cx = x0 + w / 2;
    for (let y = 0; y < H; y += 5) {
      px(ctx, cx - 17, y, "#6a4c2c", 34, 4);
      px(ctx, cx - 17, y, "#8a6a44", 34, 1);
      px(ctx, cx - 17, y + 4, "#3a2814", 34, 1);
      if (y % 40 == 0) {
        px(ctx, cx - 20, y, "#4a3420", 3, 6);
        px(ctx, cx + 17, y, "#4a3420", 3, 6);
      }
    }
  }
}

function desert(ctx: CanvasRenderingContext2D, x0: number, w: number, r: R): void {
  for (let i = 0; i < 500; i++) px(ctx, x0 + r() * w, r() * H, r() < 0.5 ? "rgba(255,240,200,.25)" : "rgba(150,110,60,.18)", 1, 1);
  // dunas: crista clara e sombra embaixo
  for (let k = 0; k < 12; k++) {
    const yy = r() * H;
    const amp = 8 + r() * 10;
    for (let x = x0; x < x0 + w; x++) {
      const y = yy + Math.sin((x - x0) / w * Math.PI) * -amp + Math.sin(x * 0.07 + k) * 2;
      px(ctx, x, y, "rgba(255,238,196,.55)");
      px(ctx, x, y + 1, "rgba(160,112,52,.35)", 1, 3);
    }
  }
  for (let i = 0; i < 10; i++) rock(ctx, x0 + r() * w, r() * H, 2 + r() * 4, r);
  for (let i = 0; i < 14; i++) {
    const y = r() * H;
    if (clearMid(y, 60)) bush(ctx, x0 + r() * w, y, 2 + r() * 2.5, r, ["#4a3a1c", "#6e6a32", "#8a8442", "#b0a85e"]);
  }
}

function sea(ctx: CanvasRenderingContext2D, x0: number, w: number, r: R): void {
  // fundo com profundidade
  for (let i = 0; i < 18; i++) disc(ctx, x0 + r() * w, r() * H, 20 + r() * 40, r() < 0.5 ? "rgba(20,50,80,.25)" : "rgba(80,140,170,.12)", 0.5);
  for (let i = 0; i < 90; i++) {
    const xx = x0 + r() * w;
    const yy = r() * H;
    const len = 4 + Math.floor(r() * 6);
    px(ctx, xx, yy, "rgba(200,230,250,.35)", len, 1);
    px(ctx, xx + 1, yy + 1, "rgba(20,50,80,.35)", len, 1);
  }
}

function mountain(ctx: CanvasRenderingContext2D, x0: number, w: number, r: R): void {
  for (let i = 0; i < 26; i++) {
    const bx = x0 + r() * w;
    const by = r() * H;
    const s = 16 + r() * 18;
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
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.beginPath();
    ctx.moveTo(bx, by - s);
    ctx.lineTo(bx + s * 0.25, by - s * 0.6);
    ctx.lineTo(bx - s * 0.25, by - s * 0.6);
    ctx.fill();
  }
}

/** Pinta os detalhes de uma faixa (o chão de base já foi pintado). */
export function detailLane(ctx: CanvasRenderingContext2D, x0: number, w: number, t: Terrain, r: R): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, 0, w, H);
  ctx.clip();
  if (t == "aberto" || t == "muralha" || t == "portao") grassland(ctx, x0, w, r);
  else if (t == "mata") forest(ctx, x0, w, r);
  else if (t == "colina") hills(ctx, x0, w, r);
  else if (t == "rio" || t == "vau") river(ctx, x0, w, r, t == "vau");
  else if (t == "pantano" || t == "calcada") swamp(ctx, x0, w, r, t == "calcada");
  else if (t == "areia") desert(ctx, x0, w, r);
  else if (t == "mar") sea(ctx, x0, w, r);
  else if (t == "bloqueado") mountain(ctx, x0, w, r);
  ctx.restore();
}

// ---------------------------------------------------------------- água animada (mar)
let waveCanvas: HTMLCanvasElement | null = null;
/** Cristas de onda que andam devagar por cima do mar (desenhado a cada quadro). */
export function drawSeaWaves(ctx: CanvasRenderingContext2D, t: number, W: number): void {
  if (!waveCanvas) {
    waveCanvas = document.createElement("canvas");
    waveCanvas.width = W;
    waveCanvas.height = H;
    const c = waveCanvas.getContext("2d") as CanvasRenderingContext2D;
    let s = 17;
    const r = (): number => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 160; i++) {
      const x = r() * W;
      const y = r() * H;
      const len = 5 + Math.floor(r() * 8);
      // crista: arco de pixels claros com espuma
      for (let k = 0; k < len; k++) {
        const yy = y + Math.round(Math.sin((k / len) * Math.PI) * -2);
        c.fillStyle = "rgba(230,245,255,.75)";
        c.fillRect(Math.round(x + k), yy, 1, 1);
        c.fillStyle = "rgba(20,60,90,.4)";
        c.fillRect(Math.round(x + k), yy + 1, 1, 1);
      }
    }
  }
  const off = Math.round((t * 6) % W);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.8;
  ctx.drawImage(waveCanvas, off - W, Math.round(Math.sin(t * 0.8) * 2), W, H);
  ctx.drawImage(waveCanvas, off, Math.round(Math.sin(t * 0.8) * 2), W, H);
  ctx.restore();
}
