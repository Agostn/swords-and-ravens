/**
 * Soldados a pé em pixel art, desenhados aqui (sem imagem de fora), no mesmo modelo para todas as Casas:
 * o corpo é igual; mudam o metal, a capa, o elmo, o escudo e o brasão de cada Casa (houseStyle.ts).
 * Virado para a ESQUERDA, pés em (ax, ay). 4 poses por função (0 parado … 3 golpe esticado):
 *  - lanceiro: lança em pé → inclinando → deitada → estocada
 *  - escudeiro: espada para baixo → erguida → descendo → estocada passando o escudo (Greyjoy: machado)
 *  - arqueiro: arco parado → puxando → corda toda puxada → corda solta
 */
import { Role } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { House } from "./data";
import { drawGlyph, styleOf } from "./houseStyle";
import { Sprite, addOutline, line, newCanvas, px } from "./sprites";

const PAD = 42;
const cache = new Map<string, Sprite>();

const shade = (hex: string, f: number): string => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export function soldierSprite(h: House, role: Role, frame: 0 | 1 | 2 | 3): Sprite {
  const id = `sd|${h.name}|${role}|${frame}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const st = styleOf(h);
  const [c, ctx] = newCanvas(20 + PAD * 2, 34 + PAD + 4);
  const fx = PAD + 9;
  const fy = PAD + 33;
  const R = (x: number, y: number, w: number, hh: number, col: string): void => px(ctx, fx + x, fy + y, col, w, hh);
  const L = (x0: number, y0: number, x1: number, y1: number, col: string): void => line(ctx, fx + x0, fy + y0, fx + x1, fy + y1, col);
  const [mHi, mMid, mLo] = st.metal;
  const skin = h.name == "Martell" ? "#b47c50" : "#e0b08a";
  const archer = role == "arqueiro" || role == "flechas";
  const armCol = st.bare || archer ? skin : mMid;
  const wood = "#6e4a26";
  const woodD = "#40280f";
  const steel = "#dfe4e8";
  const steelD = "#8a9298";

  // capa (atrás de tudo)
  if (st.cloak && !archer) {
    R(1, -21, 5, 14, st.cloak);
    R(2, -8, 5, 2, st.cloak);
    R(5, -20, 1, 12, shade(st.cloak, 0.7));
    if (st.cloakTrim) R(1, -7, 6, 1, st.cloakTrim);
  }
  // perna de trás e de frente (com bota)
  const legCol = st.bare ? (st.silk ?? "#4a3626") : archer ? "#5a4a36" : mMid;
  R(1, -10, 3, 8, shade(legCol, 0.8));
  R(1, -2, 4, 2, "#2e1d10");
  R(-3, -10, 3, 8, legCol);
  R(-4, -2, 4, 2, "#3e2716");
  // braço de trás
  R(3, -20, 2, 7, shade(armCol, 0.85));
  // tronco: malha (ou couro do arqueiro / pele de fora)
  const body = archer ? "#6a5238" : st.bare ? "#5a4230" : mMid;
  R(-4, -21, 8, 11, body);
  R(-4, -21, 8, 1, archer ? "#7e6446" : mHi);
  if (!archer && !st.bare) for (let y = -19; y < -11; y += 2) for (let x = -4; x < 4; x += 2) R(x + ((y / 2) % 2 ? 1 : 0), y, 1, 1, mLo);
  // sobreveste com a cor da Casa
  R(-3, -19, 6, 10, h.color);
  R(-3, -19, 6, 1, st.trim);
  R(2, -18, 1, 9, shade(h.color, 0.75));
  R(-3, -10, 6, 2, h.dark);
  if (st.silk) {
    // Dorne: seda cor de areia nos ombros e faixa
    R(-4, -21, 8, 2, st.silk);
    L(-3, -18, 2, -12, st.trim);
  }
  // cinto
  R(-4, -11, 8, 1, "#4a2e18");
  R(-1, -11, 1, 1, st.trim);
  // cabeça
  R(-3, -27, 5, 6, skin);
  R(-3, -25, 1, 1, "#2a1a12");
  R(1, -27, 2, 6, "#5a3a22");
  if (st.fur && !archer) {
    R(-1, -22, 7, 2, "#d8cdb8");
    R(0, -23, 5, 1, "#bfb39c");
  }
  // elmo (arqueiro usa capuz)
  if (archer) {
    R(-3, -30, 6, 4, h.dark);
    R(1, -27, 3, 6, h.dark);
    R(-3, -30, 6, 1, shade(h.dark, 1.25));
  } else {
    switch (st.helm) {
      case "cap":
        R(-3, -29, 6, 3, mMid);
        R(-2, -30, 4, 1, mHi);
        R(-4, -27, 7, 1, mLo);
        R(-3, -27, 1, 2, mMid);
        R(1, -27, 3, 5, mLo);
        break;
      case "lion":
        R(-3, -29, 6, 3, mMid);
        R(-2, -30, 4, 1, mHi);
        R(-4, -27, 7, 1, mLo);
        R(-3, -27, 1, 2, mMid);
        // crista de leão (juba dourada)
        R(-1, -32, 5, 2, st.trim);
        R(1, -33, 3, 1, st.trim);
        R(3, -31, 2, 3, mMid);
        break;
      case "iron":
        R(-3, -30, 6, 4, mMid);
        R(-2, -31, 4, 1, mHi);
        R(-3, -27, 1, 3, mLo);
        R(1, -27, 3, 4, mLo);
        R(0, -32, 2, 1, st.trim);
        break;
      case "plume":
        R(-3, -29, 6, 3, mMid);
        R(-2, -30, 4, 1, mHi);
        R(-4, -27, 7, 1, mLo);
        R(1, -33, 2, 4, h.color);
        R(3, -32, 2, 2, st.trim);
        break;
      case "wrap":
        R(-3, -30, 6, 4, st.silk ?? "#e8d2a2");
        R(-3, -28, 6, 1, shade(st.silk ?? "#e8d2a2", 0.8));
        R(2, -27, 3, 5, shade(st.silk ?? "#e8d2a2", 0.85));
        R(-1, -32, 2, 2, mMid);
        break;
      case "wings":
        R(-3, -29, 6, 3, mMid);
        R(-2, -30, 4, 1, mHi);
        R(-4, -27, 7, 1, mLo);
        R(2, -32, 3, 3, "#f4f4f0");
        R(4, -34, 2, 2, "#f4f4f0");
        break;
      case "dragon":
      default:
        R(-3, -29, 6, 3, mMid);
        R(-2, -30, 4, 1, mHi);
        R(-4, -27, 7, 1, mLo);
        R(-1, -32, 1, 2, st.trim);
        R(1, -33, 1, 3, st.trim);
        R(3, -32, 1, 2, st.trim);
        break;
    }
  }

  if (role == "escudeiro") {
    // arma no braço de trás (atrás do escudo)
    const hand: [number, number][] = [
      [4, -12],
      [4, -22],
      [0, -22],
      [-3, -16]
    ];
    const tip: [number, number][] = [
      [2, -1],
      [9, -33],
      [-13, -31],
      [-25, -16]
    ];
    const [hx, hy] = hand[frame];
    const [tx, ty] = tip[frame];
    L(3, -19, hx, hy, armCol);
    if (st.axe) {
      L(hx, hy, tx, ty, wood);
      // cabeça do machado na ponta
      const dx = Math.sign(tx - hx) || 1;
      R(tx - (dx > 0 ? 1 : 2), ty - 2, 3, 5, steelD);
      R(tx - (dx > 0 ? 0 : 2), ty - 2, 2, 5, steel);
    } else {
      L(hx, hy, tx, ty, steel);
      L(hx, hy + 1, tx, ty + 1, steelD);
      R(hx - 1, hy - 1, 3, 1, "#b08d3c"); // guarda
    }
    R(hx, hy, 2, 2, skin);
    // escudo na frente
    const sh = st.shield;
    if (sh == "round") {
      for (let y = -6; y <= 6; y++) {
        const w = Math.round(Math.sqrt(36 - y * y));
        R(-5 - w, -15 + y, w * 2 + 1, 1, st.field);
      }
      for (let a = 0; a < 40; a++) R(-5 + Math.round(Math.cos((a / 40) * Math.PI * 2) * 6), -15 + Math.round(Math.sin((a / 40) * Math.PI * 2) * 6), 1, 1, mLo);
      drawGlyph(ctx, st.glyph, fx - 8, fy - 18, st.charge);
    } else {
      const top = sh == "kite" ? -23 : -22;
      const flat = sh == "kite" ? 6 : 8;
      const len = sh == "kite" ? 17 : 14;
      for (let y = 0; y < len; y++) {
        const w = y < flat ? 9 : Math.max(1, Math.round(9 * (1 - (y - flat) / (len - flat))));
        R(-10 + Math.round((9 - w) / 2), top + y, w, 1, st.field);
      }
      R(-10, top, 9, 1, st.trim);
      drawGlyph(ctx, st.glyph, fx - 9, fy + top + 2, st.charge);
    }
    if (frame == 3) {
      // na estocada a lâmina passa na frente do escudo
      L(-3, -16, -25, -16, steel);
      R(-26, -16, 1, 1, "#ffffff");
    }
  } else if (archer) {
    // aljava nas costas
    R(2, -28, 2, 8, woodD);
    R(2, -30, 1, 2, "#efe6d0");
    R(3, -31, 1, 2, "#efe6d0");
    R(3, -29, 1, 1, "#c9483a");
    const bx = -11;
    const pull = [0, 3, 6, 0][frame];
    const top = -27 + (frame == 2 ? 1 : 0);
    const bot = -9 - (frame == 2 ? 1 : 0);
    const bend = frame == 2 ? 4 : frame == 1 ? 3.5 : 3;
    for (let y = top; y <= bot; y++) {
      const t = (y - top) / (bot - top);
      R(bx - Math.round(Math.sin(t * Math.PI) * bend), y, 1, 1, y == top || y == bot ? woodD : wood);
    }
    const mid = Math.round((top + bot) / 2);
    L(-2, -20, bx + 1, mid, armCol); // braço do arco
    if (frame == 3) {
      L(bx - 1, top, bx - 2, mid, "#f2ead6");
      L(bx - 2, mid, bx - 1, bot, "#f2ead6");
    } else {
      L(bx, top, bx + 1 + pull, mid, "#f2ead6");
      L(bx + 1 + pull, mid, bx, bot, "#f2ead6");
    }
    if (frame == 1 || frame == 2) {
      L(bx - 5, mid, bx + pull, mid, "#e8dcc0");
      R(bx - 6, mid, 1, 1, steel);
      R(bx + pull, mid - 1, 1, 1, "#c9483a");
      L(3, -19, bx + pull + 1, mid, armCol); // mão que puxa
    }
  } else {
    // lanceiro: a lança gira em volta da mão (em pé → deitada) e vai para a frente na estocada
    const ang = [0, 0.75, 1.45, 1.5][frame];
    const push = frame == 3 ? 7 : 0;
    const hx = fx - 7;
    const hy = fy - 17;
    const long = h.name == "Martell" ? 33 : 28; // lança dornesa é mais comprida
    const dx = -Math.sin(ang);
    const dy = -Math.cos(ang);
    const tipX = hx + dx * long - push * Math.sin(ang);
    const tipY = hy + dy * long;
    const buttX = hx - dx * 13 - push * Math.sin(ang);
    const buttY = hy - dy * 13;
    L(3, -19, -7, -17, armCol);
    line(ctx, Math.round(buttX), Math.round(buttY), Math.round(tipX), Math.round(tipY), woodD);
    line(ctx, Math.round(buttX + (frame == 0 ? 1 : 0)), Math.round(buttY + (frame == 0 ? 0 : -1)), Math.round(tipX + (frame == 0 ? 1 : 0)), Math.round(tipY + (frame == 0 ? 0 : -1)), wood);
    for (let k = 0; k < 4; k++) px(ctx, Math.round(tipX + dx * k), Math.round(tipY + dy * k), steel, 2, 2);
    px(ctx, Math.round(tipX + dx * 4), Math.round(tipY + dy * 4), steel);
    px(ctx, Math.round(tipX - dy * 1.5), Math.round(tipY + dx * 1.5), steelD);
    // flâmula pequena com a cor da Casa
    if (frame < 2) px(ctx, Math.round(tipX + dx * 2) + 1, Math.round(tipY + dy * 2) + 2, h.color, 3, 2);
    R(-8, -18, 2, 2, skin);
  }
  addOutline(c);
  const out = { c, ax: fx, ay: fy };
  cache.set(id, out);
  return out;
}
