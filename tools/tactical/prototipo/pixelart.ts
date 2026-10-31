/**
 * Pixel art própria (desenhada aqui, sem imagem de fora):
 *  - cavaleiro de perfil, no estilo das miniaturas normandas: cavalo galopando, elmo cônico com
 *    nasal, cota de malha, escudo de pipa com as cores da Casa; "cavalaria" leva lança com
 *    flâmula, "batedores" levam espada;
 *  - dragão vermelho de escamas, ventre claro, asas enormes cor de vinho, chifres de osso,
 *    olho em brasa e cauda comprida que pende e enrola (como os dragões de ilustração medieval).
 * Desenha em vetor a 1 px = 1 pixel e passa por pixelSprite (cores em degraus + contorno).
 */
import { Role } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { House } from "./data";
import { Sprite, pixelSprite } from "./sprites";

type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

function poly(ctx: Ctx, pts: Pt[], fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}
function stroke(ctx: Ctx, pts: Pt[], color: string, w: number, cap: CanvasLineCap = "round"): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = cap;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}
function curve(ctx: Ctx, a: Pt, c: Pt, b: Pt, color: string, w: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]);
  ctx.stroke();
}
function ell(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, rot = 0): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}
function rect(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}
const rad = (d: number): number => (d * Math.PI) / 180;

// ---------------------------------------------------------------- cavaleiro
interface Coat {
  hi: string;
  mid: string;
  lo: string;
  mane: string;
}
const COATS: Coat[] = [
  { hi: "#9a6236", mid: "#7a4826", lo: "#55301a", mane: "#22150d" }, // baio
  { hi: "#b8733a", mid: "#965826", lo: "#6c3c18", mane: "#5a2c12" }, // alazão
  { hi: "#e2ddd3", mid: "#bdb7ad", lo: "#8f8a82", mane: "#5d5852" }, // tordilho
  { hi: "#4a413d", mid: "#332c29", lo: "#211c1a", mane: "#110d0c" }, // negro
  { hi: "#d8ad6a", mid: "#b98c4c", lo: "#8a6434", mane: "#3e2a18" } // baio-claro
];
const MAIL_HI = "#b4b9c0";
const MAIL = "#8b9098";
const MAIL_LO = "#5e636b";
const LEATHER = "#6a4322";
const SKIN = "#e0b08a";

/** Ângulos (graus) de cada perna [coxa, canela] por quadro do galope; positivo = para a frente. */
const GALLOP: [number, number][][] = [
  // frente perto, frente longe, trás perto, trás longe
  [[48, 22], [36, 8], [-42, -16], [-30, -6]], // esticado
  [[16, -6], [28, 30], [-14, 12], [-26, -22]],
  [[-12, 48], [0, 64], [24, -30], [12, -12]], // recolhido
  [[12, 76], [-6, 34], [-4, -44], [6, -62]]
];
const STAND: [number, number][] = [[4, 0], [-2, 0], [-4, 2], [3, 0]];
const BOB = [0, -1, 1, 0, 0];

/**
 * Cavaleiro virado para a ESQUERDA, pés em (32, 60). frame 0..3 = galope, 4 = parado.
 * fight: lança baixa (cavalaria) / espada erguida (batedores). atk: golpe (lança empurrada / espada descendo).
 */
export function knightSprite(h: House, role: Role, frame: number, fight: boolean, coatI: number, atk: 0 | 1): Sprite {
  const id = `kn|${h.name}|${role}|${frame}|${fight ? 1 : 0}|${coatI}|${atk}`;
  return pixelSprite(id, 64, 66, 32, 60, (ctx) => drawKnight(ctx, h, role, frame, fight, COATS[coatI % COATS.length], atk));
}

function drawKnight(ctx: Ctx, h: House, role: Role, frame: number, fight: boolean, coat: Coat, atk: 0 | 1): void {
  const heavy = role == "cavalaria";
  const legs = frame >= 4 ? STAND : GALLOP[frame];
  const by = BOB[frame] ?? 0;
  const L1 = 8;
  const L2 = 9;
  const hipY = -18 + by;
  const leg = (hx: number, a: [number, number], far: boolean): void => {
    const [a1, a2] = a;
    const kx = hx - Math.sin(rad(a1)) * L1;
    const ky = hipY + Math.cos(rad(a1)) * L1;
    const fx = kx - Math.sin(rad(a2)) * L2;
    const fy = Math.min(0, ky + Math.cos(rad(a2)) * L2);
    const c = far ? coat.lo : coat.mid;
    stroke(ctx, [[hx, hipY - 2], [kx, ky]], c, far ? 3 : 3.6);
    stroke(ctx, [[kx, ky], [fx, fy]], far ? coat.lo : coat.mid, 2.2);
    rect(ctx, fx - 1.6, fy - 1.2, 3.2, 1.8, "#1a120c"); // casco
  };
  // pernas de longe (mais escuras), atrás do corpo
  leg(-9, legs[1], true);
  leg(12, legs[3], true);
  // cauda (voa para trás)
  const tw = frame >= 4 ? 0 : [2, -1, 1, 3][frame];
  curve(ctx, [14, -27 + by], [21, -26 + by + tw], [22, -14 + by + tw], coat.mane, 3.4);
  curve(ctx, [15, -26 + by], [23, -22 + by + tw], [25, -16 + by + tw], coat.mane, 1.6);
  // corpo: peito, barriga, garupa
  ell(ctx, 1, -24 + by, 14, 6.8, coat.mid);
  ell(ctx, -10, -25 + by, 6.6, 6.4, coat.mid);
  ell(ctx, 10, -25.5 + by, 6.8, 6.6, coat.mid);
  ell(ctx, 1, -27.5 + by, 12, 3, coat.hi); // luz no lombo
  ell(ctx, 1, -19.5 + by, 11, 2.2, coat.lo); // sombra da barriga
  // pescoço e cabeça (para a esquerda, um pouco abaixada no galope)
  const hb = frame == 2 ? 1 : frame == 0 ? -1 : 0;
  poly(ctx, [[-9, -30 + by], [-15, -39 + by + hb], [-20, -42 + by + hb], [-23, -37 + by + hb], [-16, -27 + by], [-12, -21 + by]], coat.mid);
  poly(ctx, [[-19, -43 + by + hb], [-23, -42 + by + hb], [-29, -33 + by + hb], [-27, -31 + by + hb], [-22, -33 + by + hb], [-18, -37 + by + hb]], coat.mid);
  stroke(ctx, [[-21, -41 + by + hb], [-27.5, -33 + by + hb]], coat.hi, 1.2); // chanfro
  rect(ctx, -22, -39 + by + hb, 1.5, 1.4, "#120c08"); // olho
  rect(ctx, -28.5, -33.5 + by + hb, 1.2, 1.2, "#2a1a12"); // narina
  poly(ctx, [[-18, -42 + by + hb], [-17.5, -46 + by + hb], [-16, -42 + by + hb]], coat.lo); // orelha
  // crina
  stroke(ctx, [[-9, -31 + by], [-13, -37 + by + hb], [-18, -42.5 + by + hb]], coat.mane, 2.4);
  // rédea
  stroke(ctx, [[-26, -34 + by + hb], [-20, -36 + by], [-6, -36 + by]], LEATHER, 0.9);
  // pernas de perto
  leg(-11, legs[0], false);
  leg(10, legs[2], false);
  // manta (cavalaria pesada: caparazão com a cor da Casa; batedores: só a manta da sela)
  if (heavy) {
    poly(ctx, [[-15, -29 + by], [14, -30 + by], [16, -17 + by], [-15, -17 + by]], h.dark);
    poly(ctx, [[-14, -30 + by], [13, -31 + by], [14, -19 + by], [-14, -19 + by]], h.color);
    for (let x = -14; x < 14; x += 4) ell(ctx, x + 2, -18.5 + by, 2, 1.6, h.color);
    rect(ctx, -14, -24 + by, 27, 1.6, h.ink);
    rect(ctx, -14, -29.5 + by, 27, 1, "rgba(255,255,255,.25)");
  } else {
    poly(ctx, [[-6, -31 + by], [7, -31 + by], [8, -23 + by], [-6, -23 + by]], h.color);
    rect(ctx, -6, -24.5 + by, 14, 1.2, h.ink);
  }
  // sela
  poly(ctx, [[-6, -31 + by], [6, -31 + by], [8, -35 + by], [5, -33 + by], [-4, -33 + by], [-6, -34 + by]], LEATHER);

  // ---------- cavaleiro sentado
  const ry = -31 + by;
  // arma do braço de longe (atrás do corpo)
  if (heavy) {
    if (!fight) {
      // lança em pé com flâmula
      stroke(ctx, [[3, ry + 4], [8, ry - 29]], "#6b4a2a", 1.6);
      poly(ctx, [[8, ry - 29], [9.5, ry - 33], [7, ry - 30]], "#c9ccd0");
      poly(ctx, [[8, ry - 27], [17, ry - 25.5], [14, ry - 23.5], [17, ry - 21.5], [7.5, ry - 22]], h.color);
      rect(ctx, 8, ry - 25, 6, 1, h.ink);
    }
  } else if (fight && atk == 0) {
    // espada erguida atrás da cabeça
    stroke(ctx, [[4, ry - 12], [9, ry - 25]], "#d9dde2", 1.8);
    stroke(ctx, [[2.5, ry - 11], [6, ry - 12]], "#7a5a2a", 1.4);
  }
  // perna (malha) com estribo
  poly(ctx, [[-1, ry], [3, ry], [-2, ry + 7], [-4, ry + 6]], MAIL);
  poly(ctx, [[-4, ry + 6], [-2, ry + 7], [-2, ry + 13], [-4, ry + 13]], MAIL_LO);
  rect(ctx, -6, ry + 13, 4, 1.4, "#2a1d14");
  // tronco: cota de malha + sobreveste da Casa
  poly(ctx, [[-3.5, ry - 12], [3.5, ry - 12], [4.5, ry + 1], [-4, ry + 1]], MAIL);
  poly(ctx, [[-3, ry - 9], [3.5, ry - 9], [5, ry + 3], [-4.5, ry + 3]], h.color);
  rect(ctx, -3, ry - 9, 6.5, 1, "rgba(255,255,255,.2)");
  rect(ctx, -4, ry - 1, 8.5, 1.2, LEATHER); // cinto
  // cabeça: rosto, elmo cônico com nasal
  ell(ctx, -1, ry - 15, 2.8, 3, MAIL_LO); // capuz de malha
  rect(ctx, -3.6, ry - 16, 2, 2.6, SKIN);
  poly(ctx, [[-3.8, ry - 16.5], [2.2, ry - 16.5], [0.4, ry - 22], [-1.2, ry - 22.4]], MAIL_HI);
  rect(ctx, -3.8, ry - 17, 6, 1.2, MAIL_LO);
  rect(ctx, -4.2, ry - 16.5, 1, 3, MAIL_LO); // nasal
  // escudo de pipa no braço de perto
  const sx = heavy && fight ? -2 : -3;
  poly(ctx, [[sx - 5, ry - 11], [sx - 3, ry - 13], [sx + 3, ry - 13], [sx + 4, ry - 11], [sx + 1, ry + 5], [sx - 1, ry + 6]], h.dark);
  poly(ctx, [[sx - 4, ry - 10.5], [sx - 2.5, ry - 12], [sx + 2.5, ry - 12], [sx + 3, ry - 10.5], [sx + 0.5, ry + 4], [sx - 1, ry + 4.5]], h.color);
  stroke(ctx, [[sx - 0.5, ry - 11.5], [sx - 0.3, ry + 3.5]], h.ink, 1.1);
  stroke(ctx, [[sx - 3.5, ry - 7], [sx + 2.5, ry - 7]], h.ink, 1.1);
  rect(ctx, sx - 1.2, ry - 8, 1.6, 1.6, "#e8d38a"); // umbo
  // arma na frente
  if (heavy && fight) {
    // lança baixa (deitada), empurrada no golpe
    const push = atk ? -4 : 0;
    stroke(ctx, [[12 + push, ry - 7], [-27 + push, ry - 9]], "#6b4a2a", 1.8);
    poly(ctx, [[-27 + push, ry - 10], [-31 + push, ry - 9], [-27 + push, ry - 8]], "#c9ccd0");
    poly(ctx, [[-22 + push, ry - 10], [-15 + push, ry - 13], [-17 + push, ry - 11], [-14 + push, ry - 9.5], [-22 + push, ry - 9]], h.color);
    rect(ctx, 2 + push, ry - 9, 3, 3, MAIL); // mão
  } else if (!heavy) {
    if (!fight) {
      // espada descansando, ponta para cima
      stroke(ctx, [[3, ry - 6], [5, ry - 18]], "#d9dde2", 1.6);
      stroke(ctx, [[1.5, ry - 6], [4.5, ry - 6.5]], "#7a5a2a", 1.4);
    } else if (atk == 1) {
      // espada descendo na frente
      stroke(ctx, [[-2, ry - 10], [-16, ry - 16]], "#e6e9ec", 1.8);
      stroke(ctx, [[-1, ry - 11.5], [-2.5, ry - 8]], "#7a5a2a", 1.4);
      rect(ctx, -2, ry - 11, 3, 3, MAIL);
    }
  }
}

// ---------------------------------------------------------------- dragão
// dragão vermelho (escamas vermelho-ferrugem, ventre cor de areia queimada, asas vinho)
const SC_HI = "#c0573a";
const SC = "#923322";
const SC_LO = "#5e1d14";
const BELLY = "#d39256";
const BELLY_LO = "#9c5d30";
const MEMB = "#7e2318";
const MEMB_HI = "#b2402c";
const MEMB_LO = "#4a130d";
const BONE = "#ecdcb4";

/** Elevação da asa (rad) em cada um dos 6 quadros do voo. */
const WING_E = [1.2, 0.8, 0.3, -0.25, 0.1, 0.7];

/**
 * Dragão virado para a DIREITA, ponto de apoio em (56, 70).
 * mode "fly": quadro 0..5 do bater de asas; "breath": asas abertas e boca aberta (cuspindo fogo);
 * "idle": pousado, quadro 0..3 (respira e mexe a cauda).
 * A boca fica em (+54, −10) no voo (ver dragonMouth na luta).
 */
export function dragonSprite(mode: "fly" | "breath" | "idle", frame: number): Sprite {
  const id = `dr|${mode}|${frame}`;
  return pixelSprite(id, 112, 112, 56, 70, (ctx) => (mode == "idle" ? drawDragonIdle(ctx, frame) : drawDragonFly(ctx, mode == "breath" ? 0.95 : WING_E[frame % 6], mode == "breath", frame)));
}

function wing(ctx: Ctx, sh: Pt, root: Pt, e: number, far: boolean, fold = 1): void {
  const wr: Pt = [sh[0] - Math.cos(e) * 19 * fold, sh[1] - Math.sin(e) * 19 * fold];
  const fingers: [number, number][] = [
    [e + 0.55, 24],
    [e + 0.08, 30],
    [e - 0.42, 25],
    [e - 0.95, 17]
  ];
  const tips: Pt[] = fingers.map(([a, l]) => [wr[0] - Math.cos(a) * l * fold, wr[1] - Math.sin(a) * l * fold]);
  // membrana (entre os dedos, com a borda recortada)
  const pts: Pt[] = [sh, wr, tips[0]];
  for (let i = 1; i < tips.length; i++) {
    const a = tips[i - 1];
    const b = tips[i];
    // recorte: ponto do meio puxado para o pulso
    pts.push([(a[0] + b[0]) / 2 * 0.8 + wr[0] * 0.2, (a[1] + b[1]) / 2 * 0.8 + wr[1] * 0.2]);
    pts.push(b);
  }
  pts.push([(tips[3][0] + root[0]) / 2, (tips[3][1] + root[1]) / 2 + 3]);
  pts.push(root);
  poly(ctx, pts, far ? MEMB_LO : MEMB);
  if (!far) {
    // luz na membrana perto do braço
    poly(ctx, [sh, wr, tips[1], [(sh[0] + tips[1][0]) / 2, (sh[1] + tips[1][1]) / 2 + 4]], MEMB_HI);
  }
  // ossos
  const bone = far ? SC_LO : SC;
  stroke(ctx, [sh, wr], bone, far ? 3 : 3.6);
  tips.forEach((t) => stroke(ctx, [wr, t], bone, 1.6));
  // garra do polegar
  poly(ctx, [wr, [wr[0] + 1, wr[1] - 4], [wr[0] + 2.5, wr[1] - 0.5]], BONE);
}

function dragonHead(ctx: Ctx, hx: number, hy: number, open: boolean, glow: number): void {
  // pescoço já desenhado; (hx, hy) = base do crânio. A cabeça é 20% maior (mais ameaçadora).
  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(1.2, 1.2);
  ctx.translate(-hx, -hy);
  // chifres longos, curvados para trás
  ctx.strokeStyle = BONE;
  ctx.lineCap = "round";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(hx + 1, hy - 4);
  ctx.quadraticCurveTo(hx - 9, hy - 11, hx - 16, hy - 6);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(hx + 4, hy - 5);
  ctx.quadraticCurveTo(hx - 3, hy - 13, hx - 9, hy - 13);
  ctx.stroke();
  // crânio e focinho
  poly(ctx, [[hx - 2, hy - 4], [hx + 6, hy - 6], [hx + 15, hy - 1], [hx + 20, hy + 3], [hx + 19, hy + 6], [hx + 8, hy + 5], [hx - 1, hy + 4]], SC);
  poly(ctx, [[hx + 1, hy - 4], [hx + 7, hy - 5.5], [hx + 15, hy - 1], [hx + 8, hy - 2]], SC_HI);
  // mandíbula (abre para cuspir fogo)
  if (open) {
    poly(ctx, [[hx + 2, hy + 4], [hx + 18, hy + 6], [hx + 19, hy + 10], [hx + 5, hy + 9]], "#ff8a2a"); // boca em brasa
    poly(ctx, [[hx, hy + 5], [hx + 17, hy + 11], [hx + 16, hy + 13], [hx + 2, hy + 10]], SC);
    for (let x = hx + 6; x < hx + 17; x += 3) poly(ctx, [[x, hy + 6], [x + 1, hy + 8], [x + 2, hy + 6]], "#f2ead2");
  } else {
    poly(ctx, [[hx, hy + 4], [hx + 18, hy + 6], [hx + 15, hy + 8], [hx + 2, hy + 7]], SC_LO);
    for (let x = hx + 7; x < hx + 16; x += 3) rect(ctx, x, hy + 5.5, 1, 1.4, "#f2ead2");
  }
  // olho em brasa e crista sobre o olho
  rect(ctx, hx + 6, hy - 2.5, 3, 1.6, glow > 0.5 ? "#ffd34a" : "#ffb02e");
  rect(ctx, hx + 7, hy - 2.5, 1, 1.6, "#fff2b0");
  poly(ctx, [[hx + 4, hy - 4.5], [hx + 10, hy - 4], [hx + 5, hy - 6]], SC_LO);
  rect(ctx, hx + 18, hy + 1.5, 1.2, 1, "#120d0c"); // narina
  // espinhos no queixo
  poly(ctx, [[hx, hy + 6], [hx - 3, hy + 10], [hx + 2, hy + 7]], BONE);
  poly(ctx, [[hx + 4, hy + 7], [hx + 2, hy + 11], [hx + 6, hy + 8]], BONE);
  ctx.restore();
}

function spines(ctx: Ctx, pts: Pt[], size: number): void {
  pts.forEach(([x, y], i) => {
    const s = size * (1 - i / (pts.length + 2));
    poly(ctx, [[x - s * 0.6, y], [x - s * 0.2, y - s * 1.3], [x + s * 0.6, y]], BONE);
  });
}

function drawDragonFly(ctx: Ctx, e: number, breath: boolean, frame: number): void {
  const sh: Pt = [2, -11];
  const root: Pt = [-15, -5];
  // asa de longe (atrás do corpo)
  wing(ctx, [sh[0] + 4, sh[1] - 1], [root[0] + 4, root[1] - 1], e + 0.18, true, 1.1);
  // cauda longa com ponta em lança
  const sway = Math.sin((frame / 6) * Math.PI * 2) * 2;
  ctx.strokeStyle = SC;
  ctx.lineCap = "round";
  ctx.lineWidth = 6;
  // a cauda pende para baixo e enrola na ponta
  ctx.beginPath();
  ctx.moveTo(-14, -2);
  ctx.quadraticCurveTo(-26, 14 + sway, -38, 18 + sway);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-36, 18 + sway);
  ctx.quadraticCurveTo(-50, 22 + sway, -50, 12 + sway);
  ctx.stroke();
  poly(ctx, [[-49, 13 + sway], [-54, 7 + sway], [-47, 8 + sway]], BONE);
  // perna de trás pendurada e corpo
  stroke(ctx, [[-8, 2], [-6, 11], [-10, 17]], SC_LO, 4);
  poly(ctx, [[-13, 17], [-10, 15], [-7, 18]], BONE);
  ell(ctx, 0, -3, 17, 8.5, SC, -0.08);
  ell(ctx, 1, -7, 14, 3.2, SC_HI, -0.08); // luz nas costas
  // ventre de placas vermelhas
  ell(ctx, 2, 2, 14, 3.6, BELLY, -0.08);
  for (let x = -10; x <= 14; x += 4) rect(ctx, x, 0 + (x > 0 ? -0.5 : 0.5), 1, 4.5, BELLY_LO);
  // pescoço em S
  poly(ctx, [[10, -9], [18, -16], [27, -21], [31, -15], [24, -11], [16, -1], [10, 2]], SC);
  poly(ctx, [[13, -2], [20, -9], [27, -14], [29, -12], [22, -6], [16, 1]], BELLY);
  spines(ctx, [[-18, -8], [-11, -11], [-4, -12], [3, -12], [10, -11], [16, -16], [22, -20]], 4);
  // perna da frente (garras para a frente)
  stroke(ctx, [[10, 1], [14, 7], [18, 7]], SC_LO, 3.2);
  poly(ctx, [[17, 6], [21, 6.5], [18, 8.5]], BONE);
  // cabeça: boca em (+54, −10) quando está cuspindo
  dragonHead(ctx, 30, -20, breath, frame % 2);
  // asa de perto (na frente), bem grande
  wing(ctx, sh, root, e, false, 1.15);
}

function drawDragonIdle(ctx: Ctx, frame: number): void {
  const br = frame % 2 ? -1 : 0; // respiração
  const tail = [0, 1, 2, 1][frame % 4];
  // asa de longe dobrada
  wing(ctx, [4, -27 + br], [-12, -18 + br], 1.25, true, 0.62);
  // cauda enrolada no chão
  ctx.strokeStyle = SC;
  ctx.lineCap = "round";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-14, -12);
  ctx.quadraticCurveTo(-30, -2, -42, -2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-40, -2);
  ctx.quadraticCurveTo(-50, -2, -52, -7 - tail);
  ctx.stroke();
  poly(ctx, [[-50, -7 - tail], [-55, -12 - tail], [-56, -6 - tail], [-52, -4 - tail]], BONE);
  // pernas de longe
  stroke(ctx, [[-6, -12], [-2, -5], [-6, 0]], SC_LO, 4);
  stroke(ctx, [[12, -12], [14, -5], [17, 0]], SC_LO, 3.2);
  // corpo (mais alto, sentado)
  ell(ctx, 0, -17 + br, 16, 8.5, SC, -0.15);
  ell(ctx, 0, -21 + br, 13, 3, SC_HI, -0.15);
  ell(ctx, 3, -12 + br, 13, 3.6, BELLY, -0.15);
  for (let x = -8; x <= 14; x += 4) rect(ctx, x, -14 + br - x * 0.12, 1, 4.5, BELLY_LO);
  // pescoço erguido
  poly(ctx, [[8, -22 + br], [14, -32 + br], [20, -40 + br], [26, -35 + br], [19, -26 + br], [15, -14 + br]], SC);
  poly(ctx, [[13, -16 + br], [17, -26 + br], [22, -34 + br], [24, -32 + br], [19, -24 + br], [16, -13 + br]], BELLY);
  spines(ctx, [[-14, -23], [-7, -25], [0, -26], [7, -25], [12, -30], [16, -36]].map(([x, y]) => [x, y + br] as Pt), 4);
  // pernas de perto (garras no chão)
  stroke(ctx, [[-8, -14 + br], [-3, -6], [-8, 0]], SC, 4.6);
  poly(ctx, [[-12, 0], [-9, -2], [-5, 0]], BONE);
  stroke(ctx, [[10, -12 + br], [13, -5], [16, 0]], SC, 3.6);
  poly(ctx, [[14, 0], [17, -2], [20, 0]], BONE);
  // cabeça
  dragonHead(ctx, 24, -40 + br, false, frame);
  // asa de perto dobrada sobre as costas
  wing(ctx, [0, -26 + br], [-14, -17 + br], 1.15, false, 0.62);
}

/** Quadro do dragão no formato que o desenho usa (virado para a DIREITA, apoio em w/2, h·0,62). */
export function dragonFrame(row: "idle" | "flight" | "special", i: number): { img: HTMLCanvasElement; sx: number; sy: number; w: number; h: number } {
  const sp = row == "idle" ? dragonSprite("idle", i % 4) : row == "special" ? dragonSprite("breath", 0) : dragonSprite("fly", i % 6);
  return { img: sp.c, sx: 0, sy: 0, w: sp.c.width, h: sp.c.height };
}
