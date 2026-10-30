/**
 * A luta animada: homenzinhos vistos de cima, em formação, que marcham, escolhem um inimigo
 * e lutam. O RESULTADO já foi decidido pela conta; aqui só se encena: quem morre e quando
 * vem do resultado de cada faixa, e o resto (marcha, choque, flechas) é simulado.
 */
import { Lane, Side, Squad, TacticalBattleResult } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { FIELD_LANES, FieldType, Role, Row, SquadKind } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { rng } from "../solver";
import { House, TERRAIN_NAMES } from "./data";
import { Kind, Pose, drawFallen, drawUnit, kindOf } from "./figures";
import { H, LW, W, drawWall, ease, roundRect, terrainImage } from "./render";

export const T_END = 9;
const T_FIGHT = 3.0; // começam as baixas
const T_ROUT = 6.6; // quem perdeu foge

interface Man {
  side: Side;
  lane: Lane; // faixa onde luta (muda no flanco ou no "encontro no centro")
  homeLane: Lane;
  role: Role;
  kind: Kind;
  x: number;
  y: number;
  fx: number; // posição na formação
  fy: number;
  dir: number; // para onde olha (radianos)
  speed: number;
  reach: number;
  target: Man | null;
  dieAt: number;
  dead: boolean;
  deadAt: number;
  swing: number; // fase do golpe
  nextShot: number;
  flank: boolean;
  phase: number;
  flip: boolean; // virado para a esquerda
  walk: number; // fase do passo
  atk: number; // golpe, 0..1
  fight: boolean;
  shotAt: number;
  seed: number;
}

interface Arrow {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t0: number;
  dur: number;
  kind: "arrow" | "stone" | "fire";
}

interface Spark {
  x: number;
  y: number;
  t0: number;
}

export interface Sim {
  field: FieldType;
  res: TacticalBattleResult;
  houses: Record<Side, House>;
  men: Man[];
  arrows: Arrow[];
  sparks: Spark[];
  t: number;
  breach: boolean[];
  rand: () => number;
}

const ranged = (r: Role): boolean => r == "arqueiro" || r == "flechas";

/** Tamanho dos bonequinhos na luta. */
export const FIG = 1.35;

/** Formação de um esquadrão: 4 bonequinhos (2 × 2) em volta do centro. */
function formation(kind: Kind, cx: number, cy: number, side: Side): [number, number][] {
  const s = side == "attacker" ? 1 : -1;
  if (kind == "foot") return [[cx - 11, cy], [cx + 11, cy], [cx - 7, cy + s * 19], [cx + 15, cy + s * 19]];
  if (kind == "horse") return [[cx - 20, cy], [cx + 20, cy], [cx - 14, cy + s * 30], [cx + 26, cy + s * 30]];
  return [[cx, cy]];
}

export function createSim(field: FieldType, res: TacticalBattleResult, squads: Record<Side, Squad[]>, houses: Record<Side, House>, seed: number): Sim {
  const rand = rng(seed);
  const rowY: Record<Side, Record<Row, number>> = {
    attacker: { frente: H * 0.66, tras: H * 0.82 },
    defender: { frente: H * 0.34, tras: H * 0.18 }
  };
  const men: Man[] = [];
  (["attacker", "defender"] as Side[]).forEach((side) => {
    squads[side].forEach((sq) => {
      const same = squads[side].filter((o) => o.lane == sq.lane && o.row == sq.row);
      const idx = same.findIndex((o) => o.id == sq.id);
      const spread = Math.min(96, (LW - 20) / Math.max(1, same.length));
      const cx = sq.lane * LW + LW / 2 + (idx - (same.length - 1) / 2) * spread;
      const kind = kindOf(sq.kind);
      formation(kind, cx, rowY[side][sq.row], side).forEach(([x, y]) => {
        const jx = (rand() - 0.5) * 2.5;
        const jy = (rand() - 0.5) * 2.5;
        men.push({
          side,
          lane: sq.lane,
          homeLane: sq.lane,
          role: sq.role,
          kind,
          x: x + jx,
          y: y + jy,
          fx: x + jx,
          fy: y + jy,
          dir: side == "attacker" ? -Math.PI / 2 : Math.PI / 2,
          speed: kind == "horse" ? 62 : kind == "dragon" ? 70 : kind == "ship" ? 30 : kind == "foot" ? 30 + rand() * 4 : 0,
          reach: kind == "horse" ? 26 : kind == "dragon" ? 50 : kind == "ship" ? 40 : sq.role == "lanceiro" ? 26 : 19,
          target: null,
          dieAt: Infinity,
          dead: false,
          deadAt: 0,
          swing: rand() * 6,
          nextShot: 1 + rand() * 0.8,
          flank: false,
          phase: rand() * 6.28,
          flip: kind == "horse" ? sq.lane == 2 || (sq.lane == 1 && side == "defender") : rand() < 0.3,
          walk: rand() * 6,
          atk: 0,
          fight: false,
          shotAt: -9,
          seed: Math.floor(rand() * 1000)
        });
      });
    });
  });
  if (res.metInCenter) men.forEach((m) => (m.lane = 1));

  // flanco: quem ficou sozinho numa faixa vai ajudar a vizinha com luta
  ([0, 1, 2] as Lane[]).forEach((lane) => {
    if (res.lanes[lane].winner != null) return;
    const targets = ([0, 1, 2] as Lane[]).filter((n) => Math.abs(n - lane) == 1 && res.lanes[n].winner != null);
    if (!targets.length) return;
    men
      .filter((m) => m.lane == lane)
      .forEach((m, i) => {
        m.lane = targets[i % targets.length];
        m.flank = true;
      });
  });

  // baixas: vêm do resultado de cada faixa
  const breach = [false, false, false];
  ([0, 1, 2] as Lane[]).forEach((lane) => {
    const L = res.lanes[lane];
    if (L.winner == null) return;
    breach[lane] = L.factors.some((f) => f.kind == "wall-breach");
    const a = L.attackerScore;
    const d = L.defenderScore;
    const loss = (side: Side): number => {
      if (L.winner == "tie") return 0.45;
      if (L.winner == side) return Math.min(0.5, 0.12 + 0.45 * (Math.min(a, d) / Math.max(a, d)));
      return 0.8;
    };
    (["attacker", "defender"] as Side[]).forEach((side) => {
      const mine = men.filter((m) => m.lane == lane && m.side == side && m.kind != "tower" && m.kind != "siege");
      const k = Math.round(mine.length * loss(side));
      // morrem primeiro os da frente (corpo a corpo), depois os de trás
      const order = [...mine].sort(() => rand() - 0.5).sort((p, q) => Number(ranged(p.role)) - Number(ranged(q.role)));
      order.slice(0, k).forEach((m, i) => (m.dieAt = T_FIGHT + 0.4 + (i / Math.max(1, k)) * 2.9 + rand() * 0.35));
    });
  });

  return { field, res, houses, men, arrows: [], sparks: [], t: 0, breach, rand };
}

function nearestEnemy(sim: Sim, m: Man): Man | null {
  let best: Man | null = null;
  let bd = Infinity;
  for (const o of sim.men) {
    if (o.side == m.side || o.dead || o.lane != m.lane) continue;
    if (o.kind == "tower" && m.kind != "siege") continue;
    const d = (o.x - m.x) ** 2 + (o.y - m.y) ** 2;
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  return best;
}

export function stepSim(sim: Sim, dt: number): void {
  const t0 = sim.t;
  sim.t = Math.min(T_END, sim.t + dt);
  const t = sim.t;
  const r = sim.rand;
  const contested = (lane: Lane): boolean => sim.res.lanes[lane].winner != null;
  const before = sim.men.map((m) => [m.x, m.y]);
  for (const m of sim.men) {
    m.atk = 0;
    m.fight = false;
    if (m.dead) continue;
    if (t >= m.dieAt) {
      m.dead = true;
      m.deadAt = t;
      sim.sparks.push({ x: m.x, y: m.y - 4, t0: t });
      continue;
    }
    if (t < 0.9) continue; // ainda se arrumando
    const L = sim.res.lanes[m.lane];
    const lost = t > T_ROUT && L.winner && L.winner != "tie" && L.winner != m.side;
    // quem perdeu foge para trás
    if (lost && m.kind != "tower" && m.kind != "siege") {
      const ty = m.side == "attacker" ? H + 40 : -40;
      m.dir = Math.atan2(ty - m.y, 0);
      m.y += Math.sign(ty - m.y) * m.speed * 1.2 * dt;
      continue;
    }
    if (m.kind == "tower" || m.kind == "siege") {
      // atira de onde está
      if (t > m.nextShot && t < T_ROUT && contested(m.lane)) {
        const tg = nearestEnemy(sim, m);
        const wallY = H * 0.415;
        if (m.kind == "siege" && sim.breach[m.lane] && t < T_FIGHT + 0.6) {
          sim.arrows.push({ x0: m.x, y0: m.y - 34 * FIG, x1: m.lane * LW + LW / 2 + (r() - 0.5) * 40, y1: wallY, t0: t, dur: 0.9, kind: "stone" });
        } else if (tg) {
          sim.arrows.push({ x0: m.x, y0: m.y - (m.kind == "siege" ? 34 : 33) * FIG, x1: tg.x, y1: tg.y - 10 * FIG, t0: t, dur: m.kind == "siege" ? 0.9 : 0.55, kind: m.kind == "siege" ? "stone" : "arrow" });
        }
        m.shotAt = t;
        m.nextShot = t + (m.kind == "siege" ? 1.3 : 0.7) + r() * 0.4;
      }
      continue;
    }
    if (!contested(m.lane)) {
      // ninguém para lutar aqui: avança um pouco e espera
      const ty = m.fy + (m.side == "attacker" ? -40 : 40);
      if (Math.abs(m.y - ty) > 2) m.y += Math.sign(ty - m.y) * m.speed * 0.5 * dt;
      continue;
    }
    if (!m.target || m.target.dead || r() < 0.01) m.target = nearestEnemy(sim, m);
    const tg = m.target;
    if (!tg) continue;
    const dx = tg.x - m.x;
    const dy = tg.y - m.y;
    const dist = Math.hypot(dx, dy) || 1;
    m.dir = Math.atan2(dy, dx);
    if (ranged(m.role)) {
      // arqueiro: chega até a distância de tiro e atira de onde está
      const range = 170;
      if (dist > range) {
        m.x += (dx / dist) * m.speed * dt;
        m.y += (dy / dist) * m.speed * dt;
      } else if (t < T_ROUT) {
        // puxa a corda e solta
        m.atk = Math.max(0, Math.min(1, 1 - (m.nextShot - t) / 0.55));
        if (t > m.nextShot) {
          const d = Math.cos(m.dir) < 0 ? -1 : 1;
          sim.arrows.push({ x0: m.x + 9 * d * FIG, y0: m.y - 14 * FIG, x1: tg.x + (r() - 0.5) * 8, y1: tg.y - 10 * FIG + (r() - 0.5) * 8, t0: t, dur: Math.max(0.3, dist / 380), kind: "arrow" });
          m.nextShot = t + 0.75 + r() * 0.6;
        }
      }
      continue;
    }
    if (m.kind == "dragon") {
      // dragão: voa por cima e solta fogo
      const ox = tg.x + Math.cos(t * 1.7 + m.phase) * 50;
      const oy = tg.y + (m.side == "attacker" ? 60 : -60) + Math.sin(t * 1.7 + m.phase) * 20;
      const ddx = ox - m.x;
      const ddy = oy - m.y;
      const dd = Math.hypot(ddx, ddy) || 1;
      m.x += (ddx / dd) * Math.min(dd, m.speed * dt * 1.4);
      m.y += (ddy / dd) * Math.min(dd, m.speed * dt * 1.4);
      m.dir = Math.atan2(tg.y - m.y, tg.x - m.x);
      if (t > m.nextShot && t < T_ROUT) {
        const d = Math.cos(m.dir) < 0 ? -1 : 1;
        sim.arrows.push({ x0: m.x + 42 * d * FIG, y0: m.y - 30 * FIG, x1: tg.x, y1: tg.y - 8 * FIG, t0: t + 0.25, dur: 0.45, kind: "fire" });
        m.shotAt = t;
        m.nextShot = t + 1.0 + r() * 0.4;
      }
      continue;
    }
    // corpo a corpo: vai até o inimigo e luta
    m.fight = m.kind == "horse" && dist < 110 && t > 1.2;
    if (dist > m.reach) {
      const sp = m.speed * (t < 1.6 ? 0.6 : 1);
      // não passar por cima dos aliados: pequeno desvio
      let ax = 0;
      let ay = 0;
      for (const o of sim.men) {
        if (o === m || o.dead || o.side != m.side || o.kind == "dragon") continue;
        const ex = m.x - o.x;
        const ey = m.y - o.y;
        const e2 = ex * ex + ey * ey;
        if (e2 < 480 && e2 > 0.01) {
          ax += ex / e2;
          ay += ey / e2;
        }
      }
      m.x += ((dx / dist) * sp + ax * 40) * dt;
      m.y += ((dy / dist) * sp + ay * 40) * dt;
    } else {
      m.swing += dt * (m.kind == "horse" ? 9 : 11);
      m.atk = Math.max(0, Math.sin(m.swing));
      if (Math.floor(m.swing / Math.PI) != Math.floor((m.swing - dt * 11) / Math.PI) && r() < 0.35 && t > T_FIGHT - 0.5) {
        sim.sparks.push({ x: (m.x + tg.x) / 2, y: (m.y + tg.y) / 2 - 12 * FIG, t0: t });
      }
    }
  }
  // passo e para que lado olha
  sim.men.forEach((m, i) => {
    if (m.dead) return;
    const moved = Math.hypot(m.x - before[i][0], m.y - before[i][1]);
    if (moved > 0.01) m.walk += moved * (m.kind == "horse" ? 0.32 : 0.42);
    const c = Math.cos(m.dir);
    if (Math.abs(c) > 0.35) m.flip = c < 0;
    if ((m.kind == "siege" || m.kind == "tower") && t - m.shotAt < 0.5) m.atk = 1 - (t - m.shotAt) / 0.5;
    if (m.kind == "dragon" && t - m.shotAt < 0.7) m.atk = 1 - (t - m.shotAt) / 0.7;
  });
  // limpa o que já passou
  sim.arrows = sim.arrows.filter((a) => t - a.t0 < a.dur + 0.05);
  sim.sparks = sim.sparks.filter((s) => t - s.t0 < 0.35);
  void t0;
}

// ---------------------------------------------------------------- desenho
function pose(m: Man, h: House, t: number): Pose {
  return { role: m.role, kind: m.kind, house: h, back: Math.sin(m.dir) < -0.15, flip: m.flip, walk: m.walk, atk: m.atk, fight: m.fight, seed: m.seed, time: t + m.phase };
}

export function drawSim(ctx: CanvasRenderingContext2D, sim: Sim): void {
  const t = sim.t;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.drawImage(terrainImage(sim.field), 0, 0, W, H);
  const lanesT = FIELD_LANES[sim.field];
  lanesT.forEach((tt, i) => {
    if (tt == "muralha" || tt == "portao") drawWall(ctx, i, tt == "portao", sim.breach[i] && t > T_FIGHT + 0.2);
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
  // poeira do choque
  sim.res.lanes.forEach((L, i) => {
    if (L.winner == null || t < T_FIGHT - 0.6 || t > T_ROUT + 0.4) return;
    const a = Math.min(1, (t - (T_FIGHT - 0.6)) / 0.6) * Math.min(1, (T_ROUT + 0.4 - t) / 0.6);
    const g = ctx.createRadialGradient(i * LW + LW / 2, H * 0.5, 5, i * LW + LW / 2, H * 0.5, LW * 0.6);
    g.addColorStop(0, `rgba(205,185,145,${0.28 * a})`);
    g.addColorStop(1, "rgba(205,185,145,0)");
    ctx.fillStyle = g;
    ctx.fillRect(i * LW, H * 0.28, LW, H * 0.44);
  });
  const appear = ease(t / 0.8);
  // mortos embaixo, vivos por cima, ordenados pela altura
  const order = [...sim.men].sort((a, b) => Number(b.dead) - Number(a.dead) || (a.kind == "dragon" ? 1 : 0) - (b.kind == "dragon" ? 1 : 0) || a.y - b.y);
  ctx.save();
  ctx.globalAlpha = appear;
  for (const m of order) {
    if (m.dead) drawFallen(ctx, m.x, m.y, FIG, pose(m, sim.houses[m.side], t), t - m.deadAt);
    else drawUnit(ctx, m.x, m.y, FIG, pose(m, sim.houses[m.side], t), m.dir);
  }
  ctx.restore();
  // flechas, pedras e fogo
  for (const a of sim.arrows) {
    const p = (t - a.t0) / a.dur;
    if (p < 0 || p > 1) continue;
    const x = a.x0 + (a.x1 - a.x0) * p;
    const lift = a.kind == "stone" ? 60 : a.kind == "fire" ? 0 : 22;
    const y = a.y0 + (a.y1 - a.y0) * p - Math.sin(p * Math.PI) * lift;
    if (a.kind == "arrow") {
      const ang = Math.atan2(a.y1 - a.y0 - Math.cos(p * Math.PI) * lift * Math.PI, a.x1 - a.x0);
      ctx.strokeStyle = "#f6edd6";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.cos(ang) * 9, y - Math.sin(ang) * 9);
      ctx.stroke();
    } else if (a.kind == "stone") {
      ctx.fillStyle = "#3b3833";
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const rad = 8 + p * 22;
      const g = ctx.createRadialGradient(x, y, 1, x, y, rad);
      g.addColorStop(0, `rgba(255,240,170,${0.95 - p * 0.5})`);
      g.addColorStop(0.5, `rgba(255,130,30,${0.75 - p * 0.4})`);
      g.addColorStop(1, "rgba(200,40,10,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const s of sim.sparks) {
    const p = (t - s.t0) / 0.35;
    ctx.strokeStyle = `rgba(255,245,215,${1 - p})`;
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 4; k++) {
      const ang = (k / 4) * Math.PI * 2 + s.t0;
      ctx.beginPath();
      ctx.moveTo(s.x + Math.cos(ang) * 2, s.y + Math.sin(ang) * 2);
      ctx.lineTo(s.x + Math.cos(ang) * (4 + p * 6), s.y + Math.sin(ang) * (4 + p * 6));
      ctx.stroke();
    }
  }
  lanesT.forEach((tt, i) => tag(TERRAIN_NAMES[tt], i * LW + LW / 2, 20, "rgba(18,14,10,.75)", "#efe3c6"));
  tag(`${sim.houses.defender.name} defende`, W / 2, 52, sim.houses.defender.color, sim.houses.defender.ink);
  tag(`${sim.houses.attacker.name} ataca`, W / 2, H - 22, sim.houses.attacker.color, sim.houses.attacker.ink);
  // quem venceu cada faixa
  if (t > T_ROUT + 0.2) {
    sim.res.lanes.forEach((L, i) => {
      if (L.winner == null) return;
      const a = ease((t - T_ROUT - 0.2) / 0.6);
      ctx.save();
      ctx.globalAlpha = a;
      const label = L.winner == "tie" ? "EMPATE" : sim.houses[L.winner].name.toUpperCase();
      const bg = L.winner == "tie" ? "#2a2722" : sim.houses[L.winner].color;
      const ink = L.winner == "tie" ? "#f1e7d0" : sim.houses[L.winner].ink;
      ctx.font = "700 19px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tw = ctx.measureText(label).width + 30;
      const cx = i * LW + LW / 2;
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

/** Para as imagens do tutorial: um bonequinho parado. */
export function drawFigure(ctx: CanvasRenderingContext2D, x: number, y: number, role: Role, kind: SquadKind, side: Side, h: House, swing = 0, scale = 1.05): void {
  const k = kindOf(kind);
  const dir = side == "attacker" ? -Math.PI / 2 : Math.PI / 2;
  drawUnit(ctx, x, y, scale, { role, kind: k, house: h, back: side == "attacker" && k != "horse", flip: k == "horse" ? side == "defender" : false, walk: 0, atk: swing, fight: false, seed: Math.round(x), time: 0 }, dir);
}
