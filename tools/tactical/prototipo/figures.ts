/**
 * Os soldadinhos, desenhados à mão no código (visão 3/4, como num jogo de estratégia antigo).
 * Cada figura tem os pés em (0, 0) e cresce para cima; "s" é a escala.
 * Nada aqui decide a luta: é só desenho.
 */
import { Role, SquadKind } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { House } from "./data";
import { Sprite, fallenSprite, pixelSprite, shipSprite, whiteSprite } from "./sprites";
import { soldierSprite } from "./soldiers";
import { dragonFrame, knightSprite } from "./pixelart";

export type Kind = "foot" | "horse" | "siege" | "dragon" | "tower" | "ship";

export interface Pose {
  role: Role;
  kind: Kind;
  house: House;
  /** de costas (olhando para cima da tela) */
  back: boolean;
  /** virado para a esquerda */
  flip: boolean;
  /** fase do passo (andando) */
  walk: number;
  /** golpe / puxar a corda, 0..1 */
  atk: number;
  /** lança abaixada, em combate */
  fight?: boolean;
  /** variação (cor do cavalo, etc.) */
  seed?: number;
  /** dragão pousado no chão */
  landed?: boolean;
  /** tempo (bandeira, asas) */
  time?: number;
  /** acabou de levar golpe: pisca branco (0..1) */
  flash?: number;
  /** andamento do golpe corpo a corpo (0..1), ou ausente se não está golpeando */
  atkPhase?: number;
  /** arqueiro acabou de soltar a flecha */
  release?: boolean;
  /** está andando (balança o corpo) */
  moving?: boolean;
  /** em combate (fica em guarda entre os golpes) */
  guard?: boolean;
}

export function kindOf(k: SquadKind): Kind {
  if (k == "knight") return "horse";
  if (k == "siege-engine") return "siege";
  if (k == "dragon") return "dragon";
  if (k == "garrison") return "tower";
  if (k == "ship") return "ship";
  return "foot";
}

/** Quantos bonequinhos cada peça vira no mini-mapa. */
export const MEN: Record<Kind, number> = { foot: 4, horse: 4, siege: 1, dragon: 1, tower: 1, ship: 3 };

const STEEL = "#c9ced3";
const STEEL_D = "#7d858c";
const SKIN = "#e4c19c";
const SKIN_D = "#b88d68";
const LEATHER = "#5a3d24";
const WOOD = "#8a6238";
const WOOD_D = "#4f3519";
const CLOTH_D = "#2f2820";
const LINE = "rgba(20,14,8,.85)";

function mix(hex: string, t: number, to = 255): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
const light = (hex: string, t: number): string => mix(hex, t, 255);
const shade = (hex: string, t: number): string => mix(hex, t, 0);

function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, rot = 0): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

/** Retângulo de cantos redondos (sem depender do roundRect do navegador). */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const k = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

function outline(ctx: CanvasRenderingContext2D, w = 0.9): void {
  ctx.strokeStyle = LINE;
  ctx.lineWidth = w;
  ctx.lineJoin = "round";
  ctx.stroke();
}

export function groundShadow(ctx: CanvasRenderingContext2D, rx: number, ry: number, a = 0.32): void {
  ell(ctx, 0.8, 0.4, rx, ry, `rgba(0,0,0,${a})`);
}

// ---------------------------------------------------------------- a pé
function drawFoot(ctx: CanvasRenderingContext2D, p: Pose): void {
  const h = p.house;
  const d = p.flip ? -1 : 1; // lado da mão da arma
  const sw = Math.sin(p.walk);
  const bob = Math.abs(sw) * 0.7;
  const lift = [Math.max(0, sw) * 1.8, Math.max(0, -sw) * 1.8];
  groundShadow(ctx, 6.5, 2.4);

  // aljava nas costas (vista de frente fica atrás do corpo)
  if (p.role == "arqueiro" && !p.back) quiver(ctx, -3 * d, -14 - bob, d, false);
  // escudo de costas (vista de frente: fica atrás)
  if (p.role == "escudeiro" && p.back) {
    ctx.save();
    ctx.translate(-5.2 * d, -12.5 - bob);
    kite(ctx, 3.4, 6.8, WOOD, WOOD_D);
    ctx.strokeStyle = "rgba(40,25,10,.8)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-2.2, -2);
    ctx.lineTo(2.2, -2);
    ctx.moveTo(-2.2, 1.5);
    ctx.lineTo(2.2, 1.5);
    ctx.stroke();
    ctx.restore();
  }
  // pernas e botas
  [-1, 1].forEach((k, i) => {
    const x = k * 1.9;
    const top = -8.5 - bob;
    const bot = -lift[i];
    ctx.fillStyle = CLOTH_D;
    ctx.beginPath();
    rr(ctx, x - 1.35, top, 2.7, bot - top - 1.6, 0.8);
    ctx.fill();
    ctx.fillStyle = "#1c140d";
    ctx.beginPath();
    rr(ctx, x - 1.5, bot - 2.4, 3, 2.4, 0.9);
    ctx.fill();
  });
  // braço de trás (do escudo / do arco)
  const torsoTop = -18.5 - bob;
  const torsoBot = -7.2 - bob;
  // corpo: túnica com a cor da Casa
  const g = ctx.createLinearGradient(-5, 0, 5, 0);
  g.addColorStop(0, light(h.color, 0.22));
  g.addColorStop(0.55, h.color);
  g.addColorStop(1, shade(h.color, 0.32));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-4.3, torsoTop + 1);
  ctx.quadraticCurveTo(0, torsoTop - 0.8, 4.3, torsoTop + 1);
  ctx.lineTo(5.1, torsoBot);
  ctx.quadraticCurveTo(0, torsoBot + 1.4, -5.1, torsoBot);
  ctx.closePath();
  ctx.fill();
  outline(ctx);
  // faixa e cinto
  ctx.fillStyle = h.dark;
  if (p.back) ctx.fillRect(-1.1, torsoTop + 0.6, 2.2, torsoBot - torsoTop - 0.4);
  else {
    // brasão simples no peito: um losango com a cor da tinta da Casa
    ctx.fillStyle = h.ink;
    ctx.globalAlpha *= 0.85;
    ctx.beginPath();
    ctx.moveTo(0, torsoTop + 2.2);
    ctx.lineTo(1.8, torsoTop + 4.4);
    ctx.lineTo(0, torsoTop + 6.6);
    ctx.lineTo(-1.8, torsoTop + 4.4);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha /= 0.85;
  }
  ctx.fillStyle = LEATHER;
  ctx.fillRect(-4.8, torsoBot - 3.4, 9.6, 1.4);
  // ombros de malha
  ell(ctx, -4.3, torsoTop + 1.6, 1.9, 1.6, STEEL_D);
  ell(ctx, 4.3, torsoTop + 1.6, 1.9, 1.6, STEEL_D);
  // cabeça
  const hy = torsoTop - 3.1;
  head(ctx, p, hy, d);
  // arma e mão
  const hand: [number, number] = [5.3 * d, torsoBot - 3.6];
  if (p.role == "lanceiro" || p.role == "abordagem") spear(ctx, hand, d, p.atk, p.back);
  else if (p.role == "escudeiro") {
    sword(ctx, hand, d, p.atk);
    if (!p.back) {
      ctx.save();
      ctx.translate(-2.2 * d, -12.6 - bob);
      kite(ctx, 4.9, 7.4, h.color, h.dark, h.ink);
      ctx.restore();
    }
  } else if (p.role == "arqueiro" || p.role == "flechas") {
    bow(ctx, d, -13.5 - bob, p.atk, p.back);
    if (p.back) quiver(ctx, -2.6 * d, -14 - bob, d, true);
  } else {
    // mão nua
    ell(ctx, hand[0], hand[1], 1.3, 1.3, SKIN);
  }
}

function head(ctx: CanvasRenderingContext2D, p: Pose, hy: number, d: number): void {
  const h = p.house;
  if (p.role == "arqueiro" || p.role == "flechas") {
    // capuz
    ctx.fillStyle = h.dark;
    ctx.beginPath();
    ctx.ellipse(0, hy + 0.3, 3.9, 3.9, 0, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, 0.8);
    if (!p.back) {
      ell(ctx, 0, hy + 0.9, 2.5, 2.6, SKIN);
      ell(ctx, 0, hy + 2.6, 2.3, 0.9, SKIN_D);
      eyes(ctx, hy + 0.7);
    } else {
      ctx.fillStyle = shade(h.dark, 0.25);
      ctx.beginPath();
      ctx.moveTo(-1.6, hy + 2.5);
      ctx.lineTo(0, hy + 6.5);
      ctx.lineTo(1.6, hy + 2.5);
      ctx.fill();
    }
    return;
  }
  // rosto ou nuca
  ell(ctx, 0, hy + 0.6, 3.1, 3.3, p.back ? "#4a3a2a" : SKIN);
  if (!p.back) {
    ell(ctx, 0, hy + 2.6, 2.6, 1, SKIN_D);
    eyes(ctx, hy + 0.9);
  }
  const g = ctx.createLinearGradient(-4, hy - 4, 4, hy + 2);
  g.addColorStop(0, "#f2f4f6");
  g.addColorStop(0.5, STEEL);
  g.addColorStop(1, STEEL_D);
  ctx.fillStyle = g;
  if (p.role == "lanceiro") {
    // chapéu de ferro com aba
    ctx.beginPath();
    ctx.ellipse(0, hy - 0.4, 5.3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, 0.7);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, hy - 0.9, 3.1, 3, 0, Math.PI, 0);
    ctx.fill();
    outline(ctx, 0.7);
  } else if (p.role == "cavalaria") {
    // elmo fechado com pluma da Casa
    ctx.beginPath();
    rr(ctx, -3.4, hy - 3.6, 6.8, 6.6, 2.6);
    ctx.fill();
    outline(ctx, 0.7);
    ctx.fillStyle = "#22201c";
    if (!p.back) ctx.fillRect(-2.4, hy - 0.4, 4.8, 0.9);
    ctx.fillStyle = h.color;
    ctx.beginPath();
    ctx.ellipse(-0.6 * d, hy - 4.8, 1.3, 2.4, -0.5 * d, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // elmo com nasal
    ctx.beginPath();
    ctx.ellipse(0, hy - 0.4, 3.5, 3.6, 0, Math.PI, 0);
    ctx.lineTo(3.5, hy + 0.6);
    ctx.lineTo(-3.5, hy + 0.6);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 0.7);
    if (!p.back) {
      ctx.fillStyle = STEEL_D;
      ctx.fillRect(-0.45, hy - 0.2, 0.9, 2.6);
    }
  }
}

function eyes(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.fillStyle = "#2a1d12";
  ctx.fillRect(-1.5, y, 0.9, 0.9);
  ctx.fillRect(0.6, y, 0.9, 0.9);
}

/** Escudo em forma de pipa, centrado em (0,0). */
function kite(ctx: CanvasRenderingContext2D, w: number, hgt: number, face: string, edge: string, ink?: string): void {
  const path = new Path2D();
  path.moveTo(-w, -hgt * 0.55);
  path.quadraticCurveTo(0, -hgt * 0.75, w, -hgt * 0.55);
  path.quadraticCurveTo(w * 1.02, hgt * 0.15, 0, hgt * 0.62);
  path.quadraticCurveTo(-w * 1.02, hgt * 0.15, -w, -hgt * 0.55);
  const g = ctx.createLinearGradient(-w, -hgt, w, hgt);
  g.addColorStop(0, light(face.startsWith("#") ? face : "#888888", 0.25));
  g.addColorStop(0.6, face);
  g.addColorStop(1, edge);
  ctx.fillStyle = g;
  ctx.fill(path);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.1;
  ctx.stroke(path);
  if (ink) {
    // divisão heráldica: uma faixa em "V"
    ctx.save();
    ctx.clip(path);
    ctx.strokeStyle = ink;
    ctx.globalAlpha *= 0.8;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-w, -hgt * 0.25);
    ctx.lineTo(0, hgt * 0.15);
    ctx.lineTo(w, -hgt * 0.25);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 0.7;
    ctx.stroke(path);
  }
  // cravo do meio
  ell(ctx, 0, -hgt * 0.18, 0.75, 0.75, "rgba(235,235,225,.85)");
}

function spear(ctx: CanvasRenderingContext2D, hand: [number, number], d: number, atk: number, back: boolean): void {
  // lança em pé; no golpe ela inclina para a frente e sobe
  const lean = (0.08 + atk * 0.55) * d;
  const up = atk * 3;
  const len = 31;
  const bx = hand[0] - Math.sin(lean) * 7;
  const by = hand[1] + 7 - up;
  const tx = hand[0] + Math.sin(lean) * len;
  const ty = hand[1] - Math.cos(lean) * len - up;
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 1.7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // ponta
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(lean);
  ctx.fillStyle = STEEL;
  ctx.beginPath();
  ctx.moveTo(0, -4.6);
  ctx.quadraticCurveTo(1.6, -1.4, 0, 0.8);
  ctx.quadraticCurveTo(-1.6, -1.4, 0, -4.6);
  ctx.fill();
  ctx.strokeStyle = STEEL_D;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
  ell(ctx, hand[0], hand[1] - up * 0.5, 1.3, 1.3, back ? SKIN_D : SKIN);
}

function sword(ctx: CanvasRenderingContext2D, hand: [number, number], d: number, atk: number): void {
  const ang = (-0.25 + atk * 1.6) * d; // de pé para baixo, na frente
  const L = 9;
  const ex = hand[0] + Math.sin(ang) * L;
  const ey = hand[1] - Math.cos(ang) * L;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#5f666c";
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(hand[0], hand[1]);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.strokeStyle = "#eef1f3";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // guarda
  ctx.strokeStyle = "#b08d3c";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hand[0] - Math.cos(ang) * 2, hand[1] - Math.sin(ang) * 2);
  ctx.lineTo(hand[0] + Math.cos(ang) * 2, hand[1] + Math.sin(ang) * 2);
  ctx.stroke();
  ell(ctx, hand[0], hand[1] + 0.6, 1.3, 1.3, SKIN);
}

function bow(ctx: CanvasRenderingContext2D, d: number, y: number, atk: number, back: boolean): void {
  // arco na mão da frente; ao atirar, a corda é puxada até o rosto
  const bx = 6.2 * d;
  const pull = atk * 4.2;
  ctx.lineCap = "round";
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx - 1.4 * d, y - 9);
  ctx.quadraticCurveTo(bx + 3.4 * d, y, bx - 1.4 * d, y + 9);
  ctx.stroke();
  ctx.strokeStyle = "rgba(245,238,220,.9)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(bx - 1.4 * d, y - 9);
  ctx.lineTo(bx - (1.4 + pull) * d, y);
  ctx.lineTo(bx - 1.4 * d, y + 9);
  ctx.stroke();
  if (atk > 0.15) {
    // flecha armada
    ctx.strokeStyle = "#d9cfb6";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bx - (1.4 + pull) * d, y);
    ctx.lineTo(bx + 4.5 * d, y - 0.5);
    ctx.stroke();
  }
  ell(ctx, bx + 0.6 * d, y, 1.3, 1.3, back ? SKIN_D : SKIN);
  ell(ctx, bx - (1.4 + pull) * d, y, 1.1, 1.1, SKIN_D);
}

function quiver(ctx: CanvasRenderingContext2D, x: number, y: number, d: number, front: boolean): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.35 * d);
  ctx.fillStyle = LEATHER;
  ctx.beginPath();
  rr(ctx, -1.4, -4.5, 2.8, 9, 1);
  ctx.fill();
  if (front) outline(ctx, 0.6);
  ctx.fillStyle = "#efe8d6";
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 0.9, -4.5);
    ctx.lineTo(i * 0.9 - 0.6, -7);
    ctx.lineTo(i * 0.9 + 0.6, -7);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- a cavalo (de lado)
const HORSE_COATS = ["#6b4528", "#4a3220", "#8d6a45", "#cfc7b8", "#2e2723"];

function drawHorse(ctx: CanvasRenderingContext2D, p: Pose): void {
  const h = p.house;
  const d = p.flip ? -1 : 1;
  const coat = HORSE_COATS[Math.abs(p.seed ?? 0) % HORSE_COATS.length];
  const coatD = shade(coat, 0.3);
  const heavy = p.role == "cavalaria";
  const gal = p.walk;
  const bob = Math.sin(gal * 2) * 0.8;
  groundShadow(ctx, 13, 3.2);
  ctx.save();
  ctx.scale(d, 1);
  // pernas (as de trás primeiro, mais escuras)
  const leg = (x: number, ph: number, far: boolean): void => {
    const a = Math.sin(gal + ph) * 0.55;
    ctx.save();
    ctx.translate(x, -11 + bob);
    ctx.rotate(a);
    ctx.strokeStyle = far ? shade(coat, 0.45) : coatD;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(Math.sin(a) * 1.5 + 0.6, 10.5);
    ctx.stroke();
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(-0.6 + Math.sin(a) * 1.5, 9.6, 2.4, 1.6);
    ctx.restore();
  };
  leg(-7, 1.6, true);
  leg(6.5, 0, true);
  // cauda
  ctx.strokeStyle = shade(coat, 0.55);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-10.5, -16 + bob);
  ctx.quadraticCurveTo(-15, -13 + bob + Math.sin(gal) * 1.5, -14, -7 + bob);
  ctx.stroke();
  // corpo
  const g = ctx.createLinearGradient(0, -21, 0, -8);
  g.addColorStop(0, light(coat, 0.18));
  g.addColorStop(1, coatD);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -14.5 + bob, 11.5, 5.6, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 0.8);
  // pescoço e cabeça
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(6, -18 + bob);
  ctx.quadraticCurveTo(9.5, -25 + bob, 12, -27 + bob);
  ctx.lineTo(15, -24.5 + bob);
  ctx.quadraticCurveTo(12, -20 + bob, 10.5, -13 + bob);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 0.8);
  ctx.save();
  ctx.translate(14.4, -24.6 + bob);
  ctx.rotate(0.55);
  ell(ctx, 0, 0, 4.6, 2.2, coat);
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.6, 2.2, 0, 0, Math.PI * 2);
  outline(ctx, 0.7);
  ell(ctx, 3.2, 0.4, 1.1, 1, "#2a1d14");
  ctx.restore();
  // crina
  ctx.strokeStyle = shade(coat, 0.6);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(6.6, -20 + bob);
  ctx.quadraticCurveTo(9.4, -26 + bob, 12, -28.3 + bob);
  ctx.stroke();
  // orelha
  ctx.fillStyle = coatD;
  ctx.beginPath();
  ctx.moveTo(12, -28 + bob);
  ctx.lineTo(12.6, -30.6 + bob);
  ctx.lineTo(13.6, -27.8 + bob);
  ctx.fill();
  // pernas da frente (perto)
  leg(-5.5, 3.6, false);
  leg(8, 2, false);
  // manta com a cor da Casa
  if (heavy) {
    const cg = ctx.createLinearGradient(0, -20, 0, -7);
    cg.addColorStop(0, light(h.color, 0.15));
    cg.addColorStop(1, shade(h.color, 0.3));
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(-11, -17 + bob);
    ctx.quadraticCurveTo(0, -21 + bob, 9.5, -17.5 + bob);
    ctx.lineTo(10.5, -9 + bob);
    for (let i = 0; i <= 6; i++) {
      const x = 10.5 - (21.5 * i) / 6;
      ctx.quadraticCurveTo(x + 1.8, -6.6 + bob, x, -8.6 + bob);
    }
    ctx.closePath();
    ctx.fill();
    outline(ctx, 0.7);
    ctx.fillStyle = h.ink;
    ctx.globalAlpha *= 0.75;
    ctx.fillRect(-11, -12.6 + bob, 21.5, 1.3);
    ctx.globalAlpha /= 0.75;
  } else {
    ctx.fillStyle = h.color;
    ctx.beginPath();
    rr(ctx, -5, -19.5 + bob, 9, 6, 1.5);
    ctx.fill();
    outline(ctx, 0.6);
  }
  ctx.restore();

  // cavaleiro (desenhado sem espelho para o rosto ficar certo)
  const rx = -1 * d;
  const ry = -19 + bob;
  ctx.save();
  ctx.translate(rx, ry);
  // perna à mostra
  ctx.fillStyle = heavy ? STEEL_D : CLOTH_D;
  ctx.beginPath();
  rr(ctx, -1.3 + 1.5 * d, -1, 2.6, 7, 1);
  ctx.fill();
  // tronco
  const tg = ctx.createLinearGradient(-4, 0, 4, 0);
  tg.addColorStop(0, light(h.color, 0.2));
  tg.addColorStop(1, shade(h.color, 0.3));
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(-3.8, -9.5);
  ctx.lineTo(3.8, -9.5);
  ctx.lineTo(4.4, 0.5);
  ctx.lineTo(-4.4, 0.5);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 0.8);
  ell(ctx, -3.6, -8.5, 1.7, 1.5, STEEL_D);
  ell(ctx, 3.6, -8.5, 1.7, 1.5, STEEL_D);
  head(ctx, { ...p, back: false }, -12.4, d);
  if (heavy) {
    // escudo pequeno no braço de fora e lança
    ctx.save();
    ctx.translate(-3.6 * d, -4);
    kite(ctx, 3, 4.6, h.color, h.dark, h.ink);
    ctx.restore();
    const lower = p.fight ? 1 : 0;
    const ang = (lower ? 1.42 : 0.22) * d;
    const L = 30;
    const hx = 3.6 * d;
    const hy = -5;
    const back = 9;
    ctx.strokeStyle = WOOD_D;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hx - Math.sin(ang) * back, hy + Math.cos(ang) * back);
    const tx = hx + Math.sin(ang) * L + (lower ? p.atk * 3 * d : 0);
    const ty = hy - Math.cos(ang) * L;
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.strokeStyle = light(WOOD, 0.2);
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ell(ctx, tx, ty, 1.2, 1.2, STEEL);
    if (!lower) {
      // flâmula
      const wave = Math.sin((p.time ?? 0) * 6 + (p.seed ?? 0)) * 1.2;
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.moveTo(tx - Math.sin(ang) * 1, ty + 1.5);
      ctx.lineTo(tx - 7 * d, ty + 3 + wave);
      ctx.lineTo(tx - Math.sin(ang) * 4, ty + 5);
      ctx.closePath();
      ctx.fill();
    }
    ell(ctx, hx, hy, 1.3, 1.3, STEEL_D);
  } else {
    // batedores: dardo erguido
    const ang = (0.15 + p.atk * 0.9) * d;
    const hx = 4 * d;
    const hy = -6;
    ctx.strokeStyle = WOOD_D;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(hx - Math.sin(ang) * 5, hy + Math.cos(ang) * 5);
    ctx.lineTo(hx + Math.sin(ang) * 17, hy - Math.cos(ang) * 17);
    ctx.stroke();
    ctx.fillStyle = STEEL;
    ctx.beginPath();
    ctx.arc(hx + Math.sin(ang) * 17, hy - Math.cos(ang) * 17, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ell(ctx, hx, hy, 1.2, 1.2, SKIN);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- cerco, torre, navio, dragão
function drawSiege(ctx: CanvasRenderingContext2D, p: Pose): void {
  const h = p.house;
  groundShadow(ctx, 15, 4.5);
  // base
  ctx.fillStyle = WOOD_D;
  ctx.fillRect(-13, -7, 26, 4);
  ctx.fillStyle = WOOD;
  ctx.fillRect(-13, -9, 26, 3);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-13, -9, 26, 6);
  // rodas
  for (const x of [-9, 9]) {
    ell(ctx, x, -3, 3.6, 3.6, WOOD_D);
    ell(ctx, x, -3, 2.2, 2.2, WOOD);
    ell(ctx, x, -3, 0.8, 0.8, "#2a1d12");
  }
  // cavaletes
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(0, -20);
  ctx.lineTo(6, -8);
  ctx.stroke();
  // braço que arremessa (atk = disparo)
  const a = -1.15 + p.atk * 1.9;
  ctx.save();
  ctx.translate(0, -19);
  ctx.rotate(a);
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(19, 0);
  ctx.stroke();
  ell(ctx, 19, 0, 2.6, 2.2, WOOD_D);
  if (p.atk < 0.5) ell(ctx, 19, -1.4, 1.8, 1.8, "#5a5650");
  ell(ctx, -6, 0, 3.4, 3.4, "#55514a");
  ctx.restore();
  ell(ctx, 0, -19, 1.4, 1.4, "#2a1d12");
  // bandeirinha da Casa
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-12, -9);
  ctx.lineTo(-12, -24);
  ctx.stroke();
  ctx.fillStyle = h.color;
  ctx.beginPath();
  ctx.moveTo(-12, -24);
  ctx.lineTo(-5.5, -22 + Math.sin((p.time ?? 0) * 5) * 0.8);
  ctx.lineTo(-12, -19.5);
  ctx.fill();
}

function drawTower(ctx: CanvasRenderingContext2D, p: Pose): void {
  const h = p.house;
  groundShadow(ctx, 15, 5, 0.38);
  const g = ctx.createLinearGradient(-12, 0, 12, 0);
  g.addColorStop(0, "#cfc8b7");
  g.addColorStop(0.5, "#aaa290");
  g.addColorStop(1, "#7a7363");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(-10, -30);
  ctx.lineTo(10, -30);
  ctx.lineTo(11, 0);
  ctx.closePath();
  ctx.fill();
  outline(ctx);
  // pedras
  ctx.strokeStyle = "rgba(60,54,44,.35)";
  ctx.lineWidth = 0.6;
  for (let y = -26; y < 0; y += 4.5) {
    ctx.beginPath();
    ctx.moveTo(-10.6, y);
    ctx.lineTo(10.6, y);
    ctx.stroke();
  }
  // ameias
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? "#a49c8a" : "#bdb6a4";
    ctx.fillRect(-11 + i * 6, -35, 4.4, 5.5);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 0.7;
    ctx.strokeRect(-11 + i * 6, -35, 4.4, 5.5);
  }
  // seteiras e porta
  ctx.fillStyle = "#1e1a15";
  ctx.fillRect(-1, -22, 2, 6);
  ctx.beginPath();
  ctx.moveTo(-3.5, 0);
  ctx.lineTo(-3.5, -6);
  ctx.quadraticCurveTo(0, -10, 3.5, -6);
  ctx.lineTo(3.5, 0);
  ctx.fill();
  // estandarte
  const wave = Math.sin((p.time ?? 0) * 4) * 1.2;
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.lineTo(0, -49);
  ctx.stroke();
  ctx.fillStyle = h.color;
  ctx.beginPath();
  ctx.moveTo(0, -49);
  ctx.quadraticCurveTo(5, -48 + wave, 10, -47 + wave);
  ctx.lineTo(10, -41 + wave);
  ctx.quadraticCurveTo(5, -42 + wave, 0, -42);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 0.6);
}

function drawShip(ctx: CanvasRenderingContext2D, p: Pose): void {
  // navio visto de cima, apontando para "cima" (o chamador gira)
  const h = p.house;
  ell(ctx, 3, 4, 10, 22, "rgba(0,20,40,.3)");
  // remos
  const row = Math.sin(p.walk * 1.5) * 0.4;
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    const y = -8 + i * 6;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 7, y);
      ctx.lineTo(s * 15, y + 3 + row * 6 * s);
      ctx.stroke();
    }
  }
  const g = ctx.createLinearGradient(-9, 0, 9, 0);
  g.addColorStop(0, "#8a6238");
  g.addColorStop(0.5, "#a77a4a");
  g.addColorStop(1, "#5e4020");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.quadraticCurveTo(10, -10, 8.5, 17);
  ctx.quadraticCurveTo(0, 21, -8.5, 17);
  ctx.quadraticCurveTo(-10, -10, 0, -25);
  ctx.fill();
  outline(ctx, 1);
  ctx.strokeStyle = "rgba(50,30,12,.45)";
  ctx.lineWidth = 0.6;
  for (const x of [-4, 0, 4]) {
    ctx.beginPath();
    ctx.moveTo(x, -18 + Math.abs(x));
    ctx.lineTo(x, 16);
    ctx.stroke();
  }
  // vela com a cor da Casa
  const sg = ctx.createLinearGradient(-12, 0, 12, 0);
  sg.addColorStop(0, light(h.color, 0.2));
  sg.addColorStop(1, shade(h.color, 0.25));
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(-12, -5);
  ctx.quadraticCurveTo(0, -9 - p.atk * 2, 12, -5);
  ctx.lineTo(12, -1);
  ctx.quadraticCurveTo(0, -4, -12, -1);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 0.7);
  ctx.fillStyle = h.ink;
  ctx.fillRect(-1.2, -7, 2.4, 4.5);
  // tripulação
  for (const [x, y] of [[-3, 7], [3, 9], [0, 12], [-2, -12]] as [number, number][]) {
    ell(ctx, x, y, 1.8, 1.8, h.dark);
    ell(ctx, x, y - 0.3, 1, 1, STEEL);
  }
}

function drawDragon(ctx: CanvasRenderingContext2D, p: Pose): void {
  // visto de cima, apontando para "cima" (o chamador gira); voa alto: sombra longe
  const h = p.house;
  const t = p.time ?? 0;
  const flap = Math.sin(t * 7 + (p.seed ?? 0)) * 0.3;
  ctx.save();
  ctx.translate(10, 34);
  ctx.globalAlpha *= 0.28;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.scale(s, 1);
    ctx.rotate(flap);
    const wg = ctx.createLinearGradient(0, 0, 34, 0);
    wg.addColorStop(0, h.dark);
    wg.addColorStop(1, light(h.color, 0.1));
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.moveTo(3, -6);
    ctx.lineTo(18, -16);
    ctx.lineTo(34, -10);
    ctx.quadraticCurveTo(28, -4, 30, 2);
    ctx.quadraticCurveTo(22, 0, 21, 6);
    ctx.quadraticCurveTo(13, 3, 10, 9);
    ctx.quadraticCurveTo(6, 4, 3, 5);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 0.9);
    ctx.strokeStyle = shade(h.dark, 0.4);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(3, -6);
    ctx.lineTo(18, -16);
    ctx.lineTo(34, -10);
    ctx.moveTo(18, -16);
    ctx.lineTo(30, 2);
    ctx.moveTo(18, -16);
    ctx.lineTo(21, 6);
    ctx.moveTo(18, -16);
    ctx.lineTo(10, 9);
    ctx.stroke();
    ctx.restore();
  }
  // cauda
  ctx.strokeStyle = h.color;
  ctx.lineWidth = 3.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.quadraticCurveTo(5 * Math.sin(t * 3), 22, -3 * Math.sin(t * 3 + 1), 30);
  ctx.stroke();
  // corpo e cabeça
  const bg = ctx.createLinearGradient(-6, 0, 6, 0);
  bg.addColorStop(0, light(h.color, 0.25));
  bg.addColorStop(1, shade(h.color, 0.35));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(0, 2, 5.6, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 0.9);
  ctx.beginPath();
  ctx.ellipse(0, -13, 3.6, 5.4, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 0.9);
  ctx.fillStyle = "#e8dcc0";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 2.2, -16);
    ctx.lineTo(s * 4.6, -21);
    ctx.lineTo(s * 1, -17);
    ctx.fill();
  }
  ell(ctx, -1.5, -14, 0.8, 0.8, "#ffd35a");
  ell(ctx, 1.5, -14, 0.8, 0.8, "#ffd35a");
  // espinhos nas costas
  ctx.fillStyle = shade(h.dark, 0.3);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-1, -6 + i * 4);
    ctx.lineTo(0, -8 + i * 4);
    ctx.lineTo(1, -6 + i * 4);
    ctx.fill();
  }
}

// ---------------------------------------------------------------- sprites (pixel art)
let darkDragonCache: HTMLCanvasElement | null = null;
/** Dragão caído: o quadro "pousado", mais escuro. */
function darkDragon(img: CanvasImageSource, sx: number, sy: number, w: number, h: number): HTMLCanvasElement {
  if (darkDragonCache) return darkDragonCache;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "rgba(20,10,8,.55)";
  ctx.fillRect(0, 0, w, h);
  darkDragonCache = c;
  return c;
}

const Q = Math.PI / 2;

/** O sprite (pixel art) de uma figura, virado para a esquerda. Nulo enquanto as imagens não carregam. */
function spriteOf(p: Pose, dir: number): [Sprite, string] | null {
  const h = p.house;
  if (p.kind == "foot") {
    const a = footFrame(p);
    const sp = soldierSprite(h, p.role, a);
    return sp ? [sp, `s|${h.name}|${p.role}|${a}`] : null;
  }
  if (!soldierSprite(h, "lanceiro", 0)) return null; // imagens ainda não chegaram
  if (p.kind == "horse") {
    const f = ((Math.floor(p.walk / Q) % 4) + 4) % 4;
    const coat = Math.abs(p.seed ?? 0) % 5;
    const a = p.atk > 0.5 ? 1 : 0; // golpe: lança empurrada / dardo inclinado
    // parado (fora da luta): pernas retas
    const fr = !p.moving && !p.fight ? 4 : f;
    const id = `kn|${h.name}|${p.role}|${fr}|${p.fight ? 1 : 0}|${coat}|${a}`;
    return [knightSprite(h, p.role, fr, !!p.fight, coat, a as 0 | 1), id];
  }
  if (p.kind == "siege") {
    const f = p.atk > 0.66 ? 2 : p.atk > 0.2 ? 1 : 0;
    const id = `c|${h.name}|${f}`;
    return [pixelSprite(id, 64, 50, 32, 44, (ctx) => drawSiege(ctx, { ...p, atk: [0, 0.5, 1][f], time: 0 })), id];
  }
  if (p.kind == "tower") {
    const f = Math.floor(((p.time ?? 0) * 3) % 3);
    const id = `t|${h.name}|${f}`;
    return [pixelSprite(id, 40, 60, 18, 56, (ctx) => drawTower(ctx, { ...p, time: f * 0.5 })), id];
  }
  if (p.kind == "ship") {
    void dir;
    const f: 0 | 1 = Math.floor((p.time ?? 0) * 2.2) % 2 ? 1 : 0;
    return [shipSprite(h, p.role, f), `ship|${h.name}|${p.role}|${f}`];
  }
  return null;
}

/** Navio é desenhado menor que a escala dos bonecos (31/out: 3 navios por peça, então menores que antes, 0,72). */
export const SHIP_SCALE = 0.42;

/*
 * Golpe em 4 tempos, como nos jogos de pixel art:
 *   preparação curta (recua) → rastro (1 quadro rápido) → golpe esticado SEGURANDO um pouco → volta,
 *   e no fim um "passinho" de 1 px para trás. Entre os golpes, fica em guarda.
 * Tempos do golpe (q de 0 a 1, o golpe todo leva 0,4 s; o acerto é em q = 0,4):
 */
const Q_PREP = 0.15;
const Q_SMEAR = 0.3;
const Q_HOLD = 0.68;
const Q_BACK = 0.88;

/** Qual das 4 poses mostrar. */
function footFrame(p: Pose): 0 | 1 | 2 | 3 {
  const ranged = p.role == "arqueiro" || p.role == "flechas";
  if (ranged) {
    if (p.release) return 3;
    return p.atk < 0.3 ? 0 : p.atk < 0.7 ? 1 : 2;
  }
  const lance = p.role == "lanceiro" || p.role == "abordagem";
  // guarda: lança deitada apontada para o inimigo; espada pronta, erguida
  const guard: 0 | 1 | 2 = p.guard ? (lance ? 2 : 1) : 0;
  const q = p.atkPhase;
  if (q == null || q < 0 || q >= 1) return guard;
  if (lance) return q < Q_PREP ? 2 : q < Q_HOLD ? 3 : 2;
  return q < Q_PREP ? 1 : q < Q_SMEAR ? 2 : q < Q_HOLD ? 3 : 1;
}

/** Deslocamento do corpo para a frente (px): recua na preparação, passo no golpe, 1 px para trás no fim. */
function shiftOf(p: Pose): number {
  if (p.kind != "foot") return 0;
  if (p.release) return -1.5; // arqueiro: coice do arco
  const q = p.atkPhase;
  if (q == null || q < 0 || q >= 1) return 0;
  if (q < Q_PREP) return -2;
  if (q < Q_SMEAR) return 1;
  if (q < Q_HOLD) return 3.5;
  if (q < Q_BACK) return 1;
  return -1;
}

/** Inclinação: balança andando; no golpe só um pouco (a cabeça fica no nível); joga para trás quando apanha. */
function leanOf(p: Pose): number {
  let a = p.moving ? Math.sin(p.walk) * 0.06 : Math.sin((p.time ?? 0) * 2.2) * 0.012;
  const q = p.atkPhase;
  if (q != null && q >= 0 && q < 1) a += q < Q_PREP ? -0.05 : q < Q_HOLD ? 0.06 : 0;
  if (p.flash) a -= p.flash * 0.22;
  return p.kind == "horse" ? a * 0.4 : a;
}

/** Rastro do golpe (1–2 quadros): meia-lua da espada ou riscos da estocada da lança. */
function drawSmear(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, p: Pose, faceRight: boolean): void {
  const q = p.atkPhase;
  if (q == null || q < Q_PREP || q >= Q_SMEAR + 0.08) return;
  const k = 1 - (q - Q_PREP) / (Q_SMEAR + 0.08 - Q_PREP);
  const d = faceRight ? 1 : -1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(d * s, s);
  if (p.role == "lanceiro" || p.role == "abordagem") {
    ctx.strokeStyle = `rgba(255,255,255,${0.75 * k})`;
    ctx.lineWidth = 1.4;
    for (const [dy, len] of [[-17, 22], [-15, 30], [-13, 18]]) {
      ctx.beginPath();
      ctx.moveTo(14, dy);
      ctx.lineTo(14 + len, dy);
      ctx.stroke();
    }
  } else if (p.role == "escudeiro") {
    // meia-lua do alto para a frente
    const g = ctx.createLinearGradient(0, -34, 26, -12);
    g.addColorStop(0, `rgba(255,255,255,0)`);
    g.addColorStop(1, `rgba(255,255,255,${0.85 * k})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(2, -16, 22, -2.0, 0.15);
    ctx.arc(2, -16, 14, 0.15, -2.0, true);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function blitSprite(ctx: CanvasRenderingContext2D, sp: Sprite, x: number, y: number, s: number, faceRight: boolean, rot = 0): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  if (rot) ctx.rotate(faceRight ? rot : -rot);
  ctx.scale(faceRight ? -s : s, s);
  ctx.drawImage(sp.c, -sp.ax, -sp.ay);
  ctx.restore();
}

/** Dragão da folha de sprites (voando; cuspindo fogo quando atk > 0). */
/** O dragão é grande (o sprite já tem ~100 px; aqui fica um pouco maior que um cavaleiro × 3). */
export const DRAGON_SCALE = 1.15;

function drawDragonSprite(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, p: Pose, faceRight: boolean): boolean {
  const t = p.time ?? 0;
  const k = s * DRAGON_SCALE;
  // pousado (ataque no chão, 31/out): agachado; no golpe empina (asas para cima) e desce as patas
  if (p.landed) {
    const q = p.atk;
    const fr = q > 0.02 && q < 0.75 ? dragonFrame("flight", q < 0.3 ? 4 : q < 0.55 ? 5 : 3) : dragonFrame("idle", Math.floor(t * 6) % 6);
    const rear = q > 0.02 && q < 0.55 ? Math.sin((q / 0.55) * Math.PI) * 10 * k : 0;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.34)";
    ctx.beginPath();
    ctx.ellipse(x, y + 1 * k, 42 * k, 7 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y - rear);
    ctx.scale(faceRight ? k : -k, k);
    // a folha tem o dragão pousado no alto do quadro (≈ 46 px de altura): os pés ficam na linha y
    const idle = !(q > 0.02 && q < 0.75);
    ctx.drawImage(fr.img, fr.sx, fr.sy, fr.w, fr.h, -fr.w / 2, idle ? -fr.h * 0.42 : -fr.h * 0.8, fr.w, fr.h);
    ctx.restore();
    return true;
  }
  // cuspindo fogo: segura as asas abertas (o fogo é desenhado pela luta, da boca até o alvo)
  const flying = p.walk != 0 || p.fight !== false;
  const fr = p.atk > 0.05 ? dragonFrame("special", 0) : !flying ? dragonFrame("idle", Math.floor(t * 4) % 6) : dragonFrame("flight", Math.floor(t * 9) % 6);
  ctx.save();
  // sombra no chão: voando fica longe e clara; pousado, embaixo das patas
  ctx.fillStyle = flying ? "rgba(0,0,0,.2)" : "rgba(0,0,0,.32)";
  ctx.beginPath();
  if (flying) ctx.ellipse(x, y + 40 * s, 30 * s, 7 * s, 0, 0, Math.PI * 2);
  else ctx.ellipse(x - 4 * k, y + 1 * k, 40 * k, 6 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  ctx.scale(faceRight ? k : -k, k);
  // pousado (peça no campo, cartão): a folha tem o dragão pousado no alto do quadro, então os pés vão para a linha
  // y (31/out: antes ele ficava flutuando acima da base)
  const sheetIdle = !flying && p.atk <= 0.05 && fr.h == 110;
  ctx.drawImage(fr.img, fr.sx, fr.sy, fr.w, fr.h, -fr.w / 2, sheetIdle ? -fr.h * 0.42 : -fr.h * 0.62, fr.w, fr.h);
  ctx.restore();
  return true;
}

/**
 * Desenha uma figura em (x, y) (os pés). Para navio e dragão, "dir" diz para onde vão.
 */
export function drawUnit(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, p: Pose, dir = -Math.PI / 2): void {
  const faceRight = !p.flip;
  if (p.kind == "dragon" && drawDragonSprite(ctx, x, y, s, p, faceRight)) return;
  const got = spriteOf(p, dir);
  if (got) {
    const [sp] = got;
    // sombra
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (p.kind == "ship") {
      // espuma na linha da água
      const k = SHIP_SCALE;
      ell(ctx, 0, 1, 44 * k, 5 * k, "rgba(10,30,50,.35)");
      ell(ctx, -2, 0, 40 * k, 3.5 * k, `rgba(230,245,255,${0.35 + 0.15 * Math.sin((p.time ?? 0) * 3)})`);
    } else groundShadow(ctx, p.kind == "horse" ? 14 : p.kind == "foot" ? 7 : 15, p.kind == "foot" ? 2.4 : 4);
    ctx.restore();
    if (p.kind == "ship") {
      // navio balança nas ondas
      const tt = p.time ?? 0;
      const sk = s * SHIP_SCALE;
      const yy = y + Math.sin(tt * 2.1) * 1.5 * s;
      const rot = Math.sin(tt * 1.6) * 0.035 + (p.flash ? -p.flash * 0.08 : 0);
      blitSprite(ctx, sp, x, yy, sk, faceRight, rot);
      if (p.flash && p.flash > 0.02) {
        ctx.save();
        ctx.globalAlpha *= Math.min(1, p.flash) * 0.8;
        blitSprite(ctx, whiteSprite(got[1], sp), x, yy, sk, faceRight, rot);
        ctx.restore();
      }
      return;
    }
    const bob = p.kind == "foot" ? Math.round(Math.abs(Math.sin(p.walk)) * 1.5) : p.kind == "horse" && p.moving ? Math.round(Math.abs(Math.sin(p.walk * 2)) * 2) : 0;
    const fr = faceRight;
    const rot = p.kind == "foot" || p.kind == "horse" ? leanOf(p) : 0;
    const sx = x + shiftOf(p) * s * (fr ? 1 : -1);
    blitSprite(ctx, sp, sx, y - bob * s, s, fr, rot);
    if (p.flash && p.flash > 0.02) {
      ctx.save();
      ctx.globalAlpha *= Math.min(1, p.flash);
      blitSprite(ctx, whiteSprite(got[1], sp), sx, y - bob * s, s, fr, rot);
      ctx.restore();
    }
    if (p.kind == "foot") drawSmear(ctx, sx, y - bob * s, s, p, fr);
    return;
  }
  // sem as imagens ainda: desenho em vetor
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (p.kind == "foot") drawFoot(ctx, p);
  else if (p.kind == "horse") drawHorse(ctx, p);
  else if (p.kind == "siege") drawSiege(ctx, p);
  else if (p.kind == "tower") drawTower(ctx, p);
  else {
    ctx.rotate(dir + Math.PI / 2);
    if (p.kind == "ship") drawShip(ctx, p);
    else drawDragon(ctx, p);
  }
  ctx.restore();
}

/** Corpo caído. */
export function drawFallen(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, p: Pose, age: number): void {
  const k = Math.min(1, age / 0.3);
  // sangue
  if (p.kind == "foot" || p.kind == "horse") {
    const r = Math.min(1, age / 1.5);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ell(ctx, p.flip ? -4 : 4, -1, (p.kind == "horse" ? 12 : 8) * r, (p.kind == "horse" ? 4 : 2.6) * r, "rgba(110,14,10,.55)");
    ctx.restore();
  }
  if (p.kind == "dragon") {
    // cai rodando do céu, bate no chão e fica caído
    const fall = Math.min(1, age / 0.9);
    const k = s * DRAGON_SCALE;
    const drop = fall * fall * 46 * s;
    const fr = fall < 1 ? dragonFrame("flight", 2) : dragonFrame("idle", 0);
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.18 + fall * 0.15})`;
    ctx.beginPath();
    ctx.ellipse(x, y + 46 * s, (30 - fall * 6) * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y + drop);
    ctx.rotate((p.flip ? -1 : 1) * (fall < 1 ? fall * 1.1 : 0.12));
    ctx.scale(p.flip ? -k : k, k);
    const img = fall < 1 ? null : darkDragon(fr.img, fr.sx, fr.sy, fr.w, fr.h);
    // caído no chão: a folha tem o dragão pousado no alto do quadro (pés na linha do chão com −0,42)
    if (img) ctx.drawImage(img, -fr.w / 2, -fr.h * 0.42);
    else ctx.drawImage(fr.img, fr.sx, fr.sy, fr.w, fr.h, -fr.w / 2, -fr.h * 0.62, fr.w, fr.h);
    ctx.restore();
    return;
  }
  if (p.kind == "siege") {
    // máquina de cerco destruída: tábuas quebradas e a roda caída
    const tt = Math.min(1, age / 0.4);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ell(ctx, 0, 1, 18, 4, "rgba(0,0,0,.28)");
    const planks: [number, number, number, number][] = [[-14, -2, 16, 0.3], [-4, -5, 18, -0.5], [4, 0, 14, 0.9], [-10, 2, 12, -0.2], [8, -6, 10, 1.4]];
    planks.forEach(([dx, dy, len, ang], i) => {
      ctx.save();
      ctx.translate(dx * tt, dy * tt);
      ctx.rotate(ang * tt);
      ctx.fillStyle = i % 2 ? "#6a4020" : "#8c5a2c";
      ctx.fillRect(-len / 2, -1.5, len, 3);
      ctx.fillStyle = "#3a2410";
      ctx.fillRect(-len / 2, 1, len, 1);
      ctx.restore();
    });
    ctx.strokeStyle = "#3a2410";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(10, 2, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (p.kind == "ship") {
    // afunda: inclina e desce; o que fica abaixo da linha da água some; depois só destroços boiando
    const got = spriteOf(p, 0);
    if (!got) return;
    // 31/out: o navio parte ao meio — as duas metades se afastam, inclinam para o buraco e afundam até a metade,
    // ficando a proa e a popa para fora d'água; em volta, tábuas boiando
    const sink = Math.min(1, age / 2.2);
    const e = 1 - (1 - sink) * (1 - sink);
    const tt = p.time ?? 0;
    const sc = s * SHIP_SCALE;
    const sp = got[0];
    const faceRight = !p.flip;
    // tábuas boiando (atrás das metades)
    for (let i = 0; i < 8; i++) {
      const dx = Math.sin(i * 1.7) * (14 + 26 * e) * s;
      const dy = Math.cos(i * 2.1) * 6 * s + Math.sin(tt * 2 + i) * 1.2;
      ctx.fillStyle = i % 2 ? "#6a4020" : "#8c5a2c";
      ctx.fillRect(Math.round(x + dx), Math.round(y + dy), Math.round((4 + (i % 3) * 2) * s), Math.max(1, Math.round(1.5 * s)));
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 400, y - 400, 800, 400 + 1.5 * s); // só o que está acima da linha da água
    ctx.clip();
    const gap = 3 + e * 9;
    const ang = 0.12 + e * 0.42;
    const down = e * 30;
    for (const half of [-1, 1]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(faceRight ? -sc : sc, sc);
      ctx.translate(half * gap, down);
      ctx.rotate(-half * ang); // a ponta de fora sobe, a do buraco desce
      ctx.beginPath();
      ctx.rect(half < 0 ? -sp.ax - 2 : 0, -sp.ay - 2, half < 0 ? sp.ax + 2 : sp.c.width - sp.ax + 2, sp.c.height + 4);
      ctx.clip();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sp.c, -sp.ax, -sp.ay);
      // lascas na quebra
      ctx.fillStyle = "#3b2412";
      for (let k2 = 0; k2 < 7; k2++) ctx.fillRect(half < 0 ? -3 - (k2 % 2) * 2 : 0, -3 - k2 * 5, 3 + (k2 % 2) * 2, 3);
      ctx.fillStyle = "#c79a62";
      for (let k2 = 0; k2 < 4; k2++) ctx.fillRect(half < 0 ? -2 : 1, -6 - k2 * 9, 1, 2);
      ctx.restore();
    }
    ctx.restore();
    // espuma e bolhas enquanto afunda
    if (sink < 1) {
      ctx.fillStyle = `rgba(235,248,255,${0.6 * (1 - sink)})`;
      for (let i = 0; i < 6; i++) {
        const bx = x + Math.sin(i * 2.3 + tt * 3) * 18 * s;
        const by = y - ((tt * 20 + i * 9) % 14) * s;
        ctx.fillRect(Math.round(bx), Math.round(by), 2, 2);
      }
    }
    ell(ctx, x, y + 1 * s, 46 * sc, 5 * sc, `rgba(235,248,255,${0.25 + 0.25 * (1 - sink)})`);
    return;
  }
  const got = spriteOf({ ...p, atk: 0, walk: 0, fight: true }, 0);
  if (got && (p.kind == "foot" || p.kind == "horse")) {
    const [sp, id] = got;
    if (k < 1 && p.kind == "foot") {
      // caindo: ainda em pé, tombando
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((p.flip ? -1 : 1) * k * 1.2);
      blitSprite(ctx, sp, 0, 0, s, !p.flip);
      ctx.restore();
      return;
    }
    if (p.kind == "horse") {
      // cavalo tombado de lado: inclinado e achatado
      ctx.save();
      ctx.translate(x, y + 3 * s);
      ctx.rotate((p.flip ? 1 : -1) * 0.28);
      ctx.scale(1, 0.62);
      blitSprite(ctx, fallenSprite(id, sp, false), 0, 0, s, !p.flip);
      ctx.restore();
      return;
    }
    blitSprite(ctx, fallenSprite(id, sp), x, y, s, !p.flip);
    return;
  }
  if (got) {
    ctx.save();
    ctx.globalAlpha *= 0.55;
    blitSprite(ctx, got[0], x, y, s, false);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha *= 0.6;
  if (p.kind == "foot") {
    ctx.rotate(-(p.flip ? -1 : 1) * k * Q);
    drawFoot(ctx, { ...p, walk: 0, atk: 0 });
  } else if (p.kind == "horse") {
    ctx.scale(1, 0.6);
    drawHorse(ctx, { ...p, walk: 0, atk: 0, fight: true });
  } else drawTower(ctx, p);
  ctx.restore();
}

/**
 * Um esquadrão parado (4 bonequinhos em 2 × 2), virado para o inimigo.
 * Devolve a caixa ocupada, para o toque.
 */
export function drawSquad(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  kind: SquadKind,
  role: Role,
  house: House,
  o: { back?: boolean; scale?: number; selected?: boolean; ghost?: boolean; time?: number; num?: number; flip?: boolean } = {}
): { x: number; y: number; w: number; h: number } {
  const k = kindOf(kind);
  const s = o.scale ?? 1;
  // flip: é do inimigo, de frente para você
  const back = o.flip ? false : o.back ?? true;
  const n = MEN[k];
  const dx = (k == "horse" ? 25 : 14) * s;
  const dy = (k == "horse" ? 11 : 10) * s;
  const pos: [number, number][] =
    n == 4
      ? [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([a, b]) => [cx + a * dx + (b > 0 ? 0 : 3 * s), cy + b * dy])
      : n == 3
        ? // 3 navios: dois atrás, um na frente
          [[-0.62, -0.25], [0.62, -0.25], [0, 0.55]].map(([a, b]) => [cx + a * 17 * s, cy + 2 * s + b * 12 * s])
        : [[cx, cy + 6 * s]];
  const us = n == 3 ? s * 0.8 : s;
  const bw = (k == "horse" ? 62 : k == "foot" ? 40 : k == "dragon" ? 66 : 44) * s;
  const bh = (k == "horse" ? 26 : 22) * s;
  ctx.save();
  if (o.ghost) ctx.globalAlpha *= 0.45;
  // base (como a de uma miniatura)
  ctx.fillStyle = "rgba(15,10,6,.35)";
  ctx.beginPath();
  ctx.ellipse(cx + 1.5 * s, cy + 3 * s, bw / 2, bh / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = house.dark;
  ctx.globalAlpha *= 0.55;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1.5 * s, bw / 2, bh / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha /= 0.55;
  ctx.strokeStyle = o.selected ? "rgba(255,214,110,.98)" : house.color;
  ctx.lineWidth = o.selected ? 3 : 1.4;
  ctx.stroke();
  pos.forEach(([x, y], i) => drawUnit(ctx, x, y, us, { role, kind: k, house, back, flip: !!o.flip, walk: 0, atk: 0, fight: false, seed: i * 3 + role.length, time: n == 3 ? (o.time ?? 0) + i * 0.7 : o.time }));
  if (o.num) {
    // número da peça (o mesmo da faixa de peças embaixo)
    const bx = cx - bw / 2 + 1 * s;
    const by = cy + 2 * s;
    const R = 11 * s;
    ctx.fillStyle = o.selected ? "#f2cf7e" : "#1d1610";
    ctx.beginPath();
    ctx.arc(bx, by, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = o.selected ? "#6e4f16" : house.color;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = o.selected ? "#23180a" : "#fff6e2";
    ctx.font = `800 ${Math.round(15 * s)}px 'Alegreya Sans', 'Trebuchet MS', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(o.num), bx, by + 0.5);
  }
  ctx.restore();
  const top = k == "foot" ? 50 : k == "horse" ? 44 : k == "tower" ? 52 : 30;
  return { x: cx - bw / 2, y: cy - top * s, w: bw, h: top * s + bh / 2 + 4 * s };
}
