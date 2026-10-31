/**
 * Pixel art própria (desenhada aqui, sem imagem de fora):
 *  - cavaleiro de perfil, no estilo das miniaturas normandas: cavalo galopando, elmo cônico com
 *    nasal, cota de malha, escudo de pipa com as cores da Casa; "cavalaria" leva lança com
 *    flâmula, "batedores" levam espada;
 *  - dragão vermelho de escamas, ventre claro, asas enormes cor de vinho, chifres de osso,
 *    olho em brasa e cauda comprida que pende e enrola (como os dragões de ilustração medieval).
 * Desenha em vetor a 1 px = 1 pixel e passa por pixelSprite (cores em degraus + contorno).
 */
import { dragonImage } from "./assets";
import { Role } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { House } from "./data";
import { Sprite, pixelSprite } from "./sprites";
import { drawGlyph, styleOf } from "./houseStyle";

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
const LEATHER = "#6a4322";
const SKIN = "#e0b08a";

/**
 * Ângulos (graus) de cada perna [parte de cima, canela] por quadro do galope; positivo = para a frente.
 * Como num cavalo de verdade: o JOELHO da frente só dobra para trás (a canela fica mais para trás que o
 * antebraço) e o JARRETE de trás só dobra para a frente (a canela fica mais para a frente que a coxa).
 * Sequência do galope (Muybridge, simplificada): esticado → a frente apoia → a frente empurra → recolhido.
 */
const GALLOP: [number, number][][] = [
  // frente perto, frente longe, trás perto, trás longe
  [[40, 30], [26, 16], [-44, -34], [-30, -20]], // esticado no ar
  [[10, 5], [30, 24], [-12, 18], [-26, -2]], // a frente apoia, a de trás vem
  [[-24, -32], [-6, -10], [10, 16], [0, 10]], // a frente empurra, a de trás apoia embaixo da barriga
  [[22, -58], [36, -36], [-20, 32], [-10, 42]] // recolhido: joelhos dobrados
];
const STAND: [number, number][] = [[4, 0], [-2, 0], [-4, 2], [3, 0]];
const BOB = [-1, 0, 1, -1, 0];

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
  const trimCol = styleOf(h).trim;
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
    rect(ctx, -14, -24 + by, 27, 1.6, trimCol);
    rect(ctx, -14, -29.5 + by, 27, 1, "rgba(255,255,255,.25)");
  } else {
    poly(ctx, [[-6, -31 + by], [7, -31 + by], [8, -23 + by], [-6, -23 + by]], h.color);
    rect(ctx, -6, -24.5 + by, 14, 1.2, trimCol);
  }
  // sela
  poly(ctx, [[-6, -31 + by], [6, -31 + by], [8, -35 + by], [5, -33 + by], [-4, -33 + by], [-6, -34 + by]], LEATHER);

  // ---------- cavaleiro sentado (armadura, elmo e escudo de cada Casa)
  const st = styleOf(h);
  const [MAIL_HI, MAIL, MAIL_LO] = st.metal;
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
  // cabeça: rosto e elmo da Casa
  ell(ctx, -1, ry - 15, 2.8, 3, MAIL_LO); // capuz de malha
  rect(ctx, -3.6, ry - 16, 2, 2.6, h.name == "Martell" ? "#b47c50" : SKIN);
  if (st.knightHelm == "wrap") {
    // Dorne: elmo cônico com pano enrolado
    ell(ctx, -0.8, ry - 18.5, 3.4, 2.6, st.silk ?? "#e8d2a2");
    poly(ctx, [[-1.6, ry - 20.5], [0, ry - 24], [0.6, ry - 20.5]], MAIL);
    poly(ctx, [[1.5, ry - 18], [5, ry - 13], [3, ry - 13]], st.silk ?? "#e8d2a2");
  } else {
    poly(ctx, [[-3.8, ry - 16.5], [2.2, ry - 16.5], [1.6, ry - 21], [-3, ry - 21.4]], MAIL);
    poly(ctx, [[-3, ry - 21], [1.4, ry - 21], [0.4, ry - 22.6], [-2, ry - 22.8]], MAIL_HI);
    rect(ctx, -3.8, ry - 17, 6, 1.2, MAIL_LO);
    rect(ctx, -4.2, ry - 16.5, 1, 3, MAIL_LO); // nasal
  }
  // crista do elmo
  switch (st.knightHelm) {
    case "lion": // juba de leão dourada
      poly(ctx, [[-2.5, ry - 22], [3, ry - 24.5], [5.5, ry - 21], [3, ry - 19.5], [1, ry - 21]], st.trim);
      rect(ctx, 1, ry - 23.5, 2, 1, MAIL_LO);
      break;
    case "antler": // galhadas de veado (como o elmo do rei Robert)
      stroke(ctx, [[-2.4, ry - 22], [-4.5, ry - 27], [-7, ry - 29]], "#2a2422", 1.2);
      stroke(ctx, [[-4.5, ry - 27], [-3.5, ry - 30]], "#2a2422", 1);
      stroke(ctx, [[0.6, ry - 22], [2.5, ry - 27], [5, ry - 29]], "#2a2422", 1.2);
      stroke(ctx, [[2.5, ry - 27], [1.5, ry - 30]], "#2a2422", 1);
      break;
    case "iron": // barbatana de ferro
      poly(ctx, [[-2, ry - 22.5], [1, ry - 26], [3, ry - 21.5]], MAIL_LO);
      rect(ctx, -0.4, ry - 23.5, 1, 1, st.trim);
      break;
    case "plume": // pluma verde e dourada
      curve(ctx, [-0.5, ry - 22.5], [3, ry - 28], [7, ry - 24], h.color, 2);
      curve(ctx, [0.5, ry - 22.5], [4, ry - 26], [7, ry - 21], st.trim, 1.2);
      break;
    case "wings": // asas de falcão
      poly(ctx, [[0, ry - 21.5], [6, ry - 27], [5, ry - 23], [7.5, ry - 23], [2, ry - 20]], "#f4f4f0");
      break;
    case "dragon": // espinhos de dragão vermelhos
      poly(ctx, [[-2.5, ry - 22], [-1.5, ry - 25.5], [-0.3, ry - 22.4], [0.8, ry - 26], [2, ry - 21.8], [3.5, ry - 24.5], [3.6, ry - 20.5]], st.trim);
      break;
    case "cap":
    default: // Stark: pluma cinza curta
      poly(ctx, [[-1, ry - 22.6], [2.5, ry - 24.5], [4.5, ry - 21.8], [1.5, ry - 21.6]], "#8a8d90");
      break;
  }
  // escudo de pipa no braço de perto
  const sx = heavy && fight ? -2 : -3;
  if (st.shield == "round") {
    ell(ctx, sx - 0.5, ry - 4, 6, 6, MAIL_LO);
    ell(ctx, sx - 0.5, ry - 4, 5, 5, st.field);
  } else {
    poly(ctx, [[sx - 5, ry - 11], [sx - 3, ry - 13], [sx + 3, ry - 13], [sx + 4, ry - 11], [sx + 1, ry + 5], [sx - 1, ry + 6]], MAIL_LO);
    poly(ctx, [[sx - 4, ry - 10.5], [sx - 2.5, ry - 12], [sx + 2.5, ry - 12], [sx + 3, ry - 10.5], [sx + 0.5, ry + 4], [sx - 1, ry + 4.5]], st.field);
    rect(ctx, sx - 4, ry - 12, 7, 1, st.trim);
  }
  drawGlyph(ctx, st.glyph, sx - 4, ry - (st.shield == "round" ? 7.5 : 9), st.charge);
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
// dragão negro (31/out, nova referência do Agostinho): escamas cinza-carvão com brilho marrom, ventre marrom
// escuro e asas de membrana marrom-avermelhada escura (antes eram cor de bronze); chifres cor de osso velho.
// O volume vem do shadeVolume. Desenho nosso, só o estilo e as cores da referência.
const SC_HI = "#544640";
const SC = "#2b2422";
const SC_LO = "#121010";
const BELLY = "#4e2c22";
const BELLY_LO = "#2c1812";
const MEMB = "#5e3024";
const MEMB_HI = "#83493a";
const MEMB_LO = "#2e1610";
const BONE = "#c4b498";

/** Elevação da asa (rad) em cada um dos 6 quadros do voo. */
const WING_E = [1.2, 0.8, 0.3, -0.25, 0.1, 0.7];

/**
 * Dragão virado para a DIREITA, ponto de apoio em (64, 70).
 * mode "fly": quadro 0..5 do bater de asas; "breath": asas abertas e boca aberta (cuspindo fogo);
 * "idle": pousado, quadro 0..3 (respira e mexe a cauda).
 * A boca fica em (+58, +1) no voo (ver dragonMouth na luta).
 */
export function dragonSprite(mode: "fly" | "breath" | "idle", frame: number): Sprite {
  const id = `dr|${mode}|${frame}`;
  return pixelSprite(id, 128, 112, 64, 70, (ctx) => (mode == "idle" ? drawDragonIdle(ctx, frame) : drawDragonFly(ctx, mode == "breath" ? 0.95 : WING_E[frame % 6], mode == "breath", frame)));
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

/**
 * Voo no pose da referência do Agostinho (dragão vermelho cuspindo fogo, de lado):
 * pescoço comprido esticado para a frente e um pouco para baixo, asas enormes jogadas para trás e
 * para cima, patas penduradas e a cauda descendo e enrolando no fim. O bater de asas gira a asa no ombro.
 */
function drawDragonFly(ctx: Ctx, e: number, breath: boolean, frame: number): void {
  // e: 1,2 (asa lá em cima) … −0,25 (asa embaixo). Vira um giro em volta do ombro.
  const flap = (0.75 - e) * 0.55;
  const sh: Pt = [2, -12];
  const rot = (p: Pt, a: number, o: Pt = sh): Pt => {
    const dx = p[0] - o[0];
    const dy = p[1] - o[1];
    return [o[0] + dx * Math.cos(a) - dy * Math.sin(a), o[1] + dx * Math.sin(a) + dy * Math.cos(a)];
  };
  // asa (pontos no pose da referência), girada pelo bater
  const bigWing = (far: boolean): void => {
    const a = flap * (far ? 0.8 : 1) + (far ? -0.25 : 0);
    const o: Pt = far ? [6, -14] : sh;
    const W = (p: Pt): Pt => rot(far ? [p[0] + 6, p[1] - 3] : p, a, o);
    const wrist = W([-14, -40]);
    const tips = [W([-34, -52]), W([-54, -40]), W([-62, -20]), W([-52, -2]), W([-34, 4])];
    const root = W([-16, 0]);
    const pts: Pt[] = [W(sh), wrist, tips[0]];
    for (let k = 1; k < tips.length; k++) {
      const m: Pt = [(tips[k - 1][0] + tips[k][0]) / 2, (tips[k - 1][1] + tips[k][1]) / 2];
      pts.push([m[0] * 0.7 + wrist[0] * 0.3, m[1] * 0.7 + wrist[1] * 0.3]);
      pts.push(tips[k]);
    }
    pts.push(root);
    poly(ctx, pts, far ? MEMB_LO : MEMB);
    if (!far) {
      // borda da frente mais clara (pega luz) e veias escuras
      poly(ctx, [W(sh), wrist, tips[0], tips[1], [(wrist[0] + tips[1][0]) / 2, (wrist[1] + tips[1][1]) / 2 + 3]], MEMB_HI);
      tips.forEach((t, k) => k > 0 && stroke(ctx, [[(wrist[0] + t[0]) / 2, (wrist[1] + t[1]) / 2], [(wrist[0] + tips[k - 1][0]) / 2 + (t[0] - tips[k - 1][0]) * 0.25, (wrist[1] + tips[k - 1][1]) / 2 + (t[1] - tips[k - 1][1]) * 0.25 + 4]], MEMB_LO, 1.2));
    }
    const bone = far ? SC_LO : SC;
    stroke(ctx, [W(sh), wrist], bone, far ? 3 : 4);
    tips.forEach((t) => stroke(ctx, [wrist, t], bone, far ? 1.3 : 1.7));
    poly(ctx, [wrist, [wrist[0] + 1, wrist[1] - 4], [wrist[0] + 3, wrist[1] - 0.5]], BONE);
  };
  bigWing(true);
  // cauda: desce da garupa e enrola no fim
  const sway = Math.sin((frame / 6) * Math.PI * 2) * 1.5;
  ctx.strokeStyle = SC;
  ctx.lineCap = "round";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-14, 2);
  ctx.quadraticCurveTo(-20, 16 + sway, -32, 20 + sway);
  ctx.stroke();
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(-31, 20 + sway);
  ctx.quadraticCurveTo(-46, 25 + sway, -48, 15 + sway);
  ctx.stroke();
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-48, 15 + sway);
  ctx.quadraticCurveTo(-48, 9 + sway, -42, 11 + sway);
  ctx.stroke();
  poly(ctx, [[-42, 9 + sway], [-37, 10 + sway], [-41, 14 + sway]], BONE);
  // patas de trás penduradas (a de longe primeiro)
  stroke(ctx, [[-6, 2], [-3, 11], [-7, 18]], SC_LO, 3.6);
  // corpo inclinado (peito na frente e mais alto, garupa atrás e mais baixa)
  ell(ctx, -3, -3, 15, 8, SC, 0.32);
  ell(ctx, -3, -7, 12, 3.4, SC_HI, 0.32); // luz no dorso
  ell(ctx, -1, 1.5, 12, 3.6, BELLY, 0.32); // ventre claro
  for (let k = -9; k <= 8; k += 3) rect(ctx, k, -1 + k * 0.33 + 2.5, 1, 3.5, BELLY_LO);
  // escamas (pontinhos escuros)
  for (let k = 0; k < 14; k++) rect(ctx, -14 + k * 1.9, -8 + ((k * 7) % 5) + k * 0.6, 1, 1, SC_LO);
  stroke(ctx, [[-12, 3], [-10, 12], [-14, 19]], SC, 4.2);
  poly(ctx, [[-17, 19], [-14, 17], [-11, 20]], BONE);
  // pescoço comprido para a frente, descendo um pouco até a cabeça
  poly(ctx, [[6, -12], [16, -15], [26, -14], [34, -10], [33, -4], [25, -7], [15, -6], [8, -1]], SC);
  poly(ctx, [[9, -3], [16, -7], [25, -8], [32, -6], [31, -4], [24, -5], [15, -4], [10, 0]], BELLY);
  spines(ctx, [[-14, -10], [-8, -13], [-2, -15], [4, -15], [10, -15], [17, -17], [24, -16]], 3.6);
  // patinha da frente encolhida
  stroke(ctx, [[8, -1], [11, 4], [15, 4]], SC_LO, 3);
  poly(ctx, [[14, 3], [18, 4], [15, 6]], BONE);
  // cabeça (boca em +58, +1 quando cospe fogo)
  dragonHead(ctx, 34, -8, breath, frame % 2);
  // asa de perto, na frente de tudo
  bigWing(false);
}

/** Pousado, agachado como um bicho grande (referência): ancas fortes, pescoço curvado e cabeça baixa, asas dobradas para cima. */
function drawDragonIdle(ctx: Ctx, frame: number): void {
  const br = frame % 2 ? -1 : 0; // respiração
  const tail = [0, 1, 2, 1][frame % 4];
  // asa de longe (só as pontas aparecem por cima)
  wing(ctx, [2, -30 + br], [-14, -18 + br], 1.4, true, 0.85);
  // cauda comprida pelo chão, enrolando na ponta
  ctx.strokeStyle = SC;
  ctx.lineCap = "round";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-20, -10);
  ctx.quadraticCurveTo(-36, -1, -50, -3);
  ctx.stroke();
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-48, -3);
  ctx.quadraticCurveTo(-60, -4, -58, -12 - tail);
  ctx.stroke();
  poly(ctx, [[-56, -12 - tail], [-61, -18 - tail], [-60, -10 - tail]], BONE);
  // pernas de longe (mais escuras)
  stroke(ctx, [[-14, -14], [-8, -6], [-14, 0]], SC_LO, 5);
  stroke(ctx, [[8, -16], [10, -7], [12, 0]], SC_LO, 4);
  // corpo agachado
  ell(ctx, -4, -17 + br, 20, 10, SC, -0.12);
  ell(ctx, -4, -22 + br, 16, 3.4, SC_HI, -0.12);
  ell(ctx, 0, -11 + br, 16, 4, BELLY, -0.12);
  for (let x = -12; x <= 12; x += 3) rect(ctx, x, -13 + br - x * 0.1, 1, 4, BELLY_LO);
  // anca de trás forte
  ell(ctx, -14, -13 + br, 9, 8, SC, 0.3);
  ell(ctx, -16, -17 + br, 5, 3, SC_HI, 0.3);
  // pata de trás (dobrada, como um gato grande) e da frente
  stroke(ctx, [[-12, -8], [-6, -4], [-12, 0]], SC, 5.5);
  poly(ctx, [[-17, 0], [-13, -2], [-9, 0]], BONE);
  stroke(ctx, [[12, -16 + br], [15, -7], [17, 0]], SC, 4.6);
  poly(ctx, [[14, 0], [18, -2], [22, 0]], BONE);
  // pescoço sobe e curva, cabeça baixa olhando para a frente
  poly(ctx, [[8, -22 + br], [14, -34 + br], [22, -42 + br], [30, -40 + br], [24, -32 + br], [18, -20 + br], [14, -12 + br]], SC);
  poly(ctx, [[14, -14 + br], [18, -24 + br], [24, -34 + br], [27, -33 + br], [21, -22 + br], [17, -12 + br]], BELLY);
  spines(ctx, [[-18, -26], [-11, -28], [-4, -29], [3, -28], [9, -31], [14, -37], [20, -43]].map(([x, y]) => [x, y + br] as Pt), 4.2);
  dragonHead(ctx, 27, -38 + br, false, frame);
  // asa de perto dobrada, erguida
  wing(ctx, [-2, -28 + br], [-16, -16 + br], 1.3, false, 0.85);
}

/** Quadro do dragão no formato que o desenho usa (virado para a DIREITA, apoio em w/2, h·0,62). */
/** Folha de sprites do dragão (arte/dragao.png): 6 colunas × 3 linhas (pousado, voando, cuspindo fogo), 103 × 110. */
const DCW = 103;
const DCH = 110;

/**
 * Quadro do dragão, virado para a DIREITA. Usa a folha de sprites (animação mais fluida, 31/out); se a imagem
 * não carregou, usa o dragão desenhado no código.
 */
export function dragonFrame(row: "idle" | "flight" | "special", i: number): { img: CanvasImageSource; sx: number; sy: number; w: number; h: number } {
  const sheet = dragonImage();
  if (sheet) {
    const r = row == "idle" ? 0 : row == "flight" ? 1 : 2;
    return { img: sheet, sx: (i % 6) * DCW, sy: r * DCH, w: DCW, h: DCH };
  }
  return pixelDragonFrame(row, i);
}

function pixelDragonFrame(row: "idle" | "flight" | "special", i: number): { img: HTMLCanvasElement; sx: number; sy: number; w: number; h: number } {
  const sp = row == "idle" ? dragonSprite("idle", i % 4) : row == "special" ? dragonSprite("breath", 0) : dragonSprite("fly", i % 6);
  return { img: sp.c, sx: 0, sy: 0, w: sp.c.width, h: sp.c.height };
}
