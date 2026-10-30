/**
 * A luta animada. O RESULTADO já foi decidido pela conta; aqui só se encena.
 *
 * Como é encenada:
 *  1. Cada esquadrão marcha da sua casinha até a linha de choque da faixa.
 *  2. Quem luta corpo a corpo forma DUPLAS: um de cada lado, frente a frente (de lado na tela),
 *     espalhadas pela faixa. Quem sobra entra na dupla de um companheiro (2 contra 1).
 *  3. Arqueiros param atrás e atiram de onde estão, num inimigo de verdade (a flecha chega nele).
 *  4. O dragão voa até o lado de um inimigo e solta fogo da boca até ele.
 *  5. Só morre quem já está lutando (ou levando flecha/fogo); quantos morrem vem da conta.
 *  6. No fim, quem perdeu a faixa foge.
 */
import { Lane, Side, Squad, TacticalBattleResult } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { FIELD_LANES, FieldType, Role, Row, SquadKind } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { rng } from "../solver";
import { House, TERRAIN_NAMES } from "./data";
import { Kind, Pose, drawFallen, drawUnit, kindOf } from "./figures";
import { H, LW, W, drawWall, ease, roundRect, terrainImage } from "./render";

export const T_END = 9.5;
const T_FIGHT = 3.2; // começam as baixas
const T_ROUT = 7.0; // quem perdeu foge

/** Tamanho dos bonequinhos na luta. */
export const FIG = 1.35;

interface Man {
  side: Side;
  lane: Lane;
  role: Role;
  kind: Kind;
  x: number;
  y: number;
  /** para onde está indo agora */
  gx: number;
  gy: number;
  dir: number;
  speed: number;
  foe: Man | null;
  dieAt: number;
  dead: boolean;
  deadAt: number;
  swing: number;
  nextShot: number;
  shotAt: number;
  phase: number;
  flip: boolean;
  walk: number;
  atk: number;
  fight: boolean;
  seed: number;
  /** já chegou na luta */
  engaged: boolean;
}

interface Shot {
  x0: number;
  y0: number;
  /** alvo (a flecha segue ele até chegar) */
  to: Man | null;
  /** ou um ponto fixo (pedra na muralha) */
  tx: number;
  ty: number;
  t0: number;
  dur: number;
  kind: "arrow" | "stone";
}

interface Breath {
  from: Man;
  to: Man;
  t0: number;
  dur: number;
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
  shots: Shot[];
  breaths: Breath[];
  sparks: Spark[];
  t: number;
  breach: boolean[];
  rand: () => number;
  frontY: number[];
}

const ranged = (r: Role): boolean => r == "arqueiro" || r == "flechas";
const isStatic = (m: Man): boolean => m.kind == "tower" || m.kind == "siege";
const melee = (m: Man): boolean => !ranged(m.role) && (m.kind == "foot" || m.kind == "horse" || m.kind == "ship");

/** Formação de um esquadrão: 4 bonequinhos (2 × 2) em volta do centro. */
function formation(kind: Kind, cx: number, cy: number, side: Side): [number, number][] {
  const s = side == "attacker" ? 1 : -1;
  if (kind == "foot") return [[cx - 11, cy], [cx + 11, cy], [cx - 7, cy + s * 19], [cx + 15, cy + s * 19]];
  if (kind == "horse") return [[cx - 20, cy], [cx + 20, cy], [cx - 14, cy + s * 30], [cx + 26, cy + s * 30]];
  return [[cx, cy]];
}

/** Meia distância entre os dois de uma dupla. */
function gap(a: Man, b: Man): number {
  if (a.kind == "ship" || b.kind == "ship") return 26;
  if (a.kind == "horse" || b.kind == "horse") return 19;
  return 12;
}

export function createSim(field: FieldType, res: TacticalBattleResult, squads: Record<Side, Squad[]>, houses: Record<Side, House>, seed: number): Sim {
  const rand = rng(seed);
  const rowY: Record<Side, Record<Row, number>> = {
    attacker: { frente: H * 0.68, tras: H * 0.84 },
    defender: { frente: H * 0.3, tras: H * 0.15 }
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
          role: sq.role,
          kind,
          x: x + jx,
          y: y + jy,
          gx: x + jx,
          gy: y + jy,
          dir: side == "attacker" ? -Math.PI / 2 : Math.PI / 2,
          speed: kind == "horse" ? 78 : kind == "dragon" ? 120 : kind == "ship" ? 40 : kind == "foot" ? 50 + rand() * 6 : 0,
          foe: null,
          dieAt: Infinity,
          dead: false,
          deadAt: 0,
          swing: rand() * 6,
          nextShot: 1.6 + rand() * 0.8,
          shotAt: -9,
          phase: rand() * 6.28,
          // atacante olha para a direita, defensor para a esquerda: nas duplas ficam frente a frente
          flip: side == "defender",
          walk: rand() * 6,
          atk: 0,
          fight: false,
          seed: Math.floor(rand() * 1000),
          engaged: false
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
    men.filter((m) => m.lane == lane && !isStatic(m)).forEach((m, i) => (m.lane = targets[i % targets.length]));
  });

  // linha de choque de cada faixa (na muralha, um pouco abaixo dela)
  const frontY = FIELD_LANES[field].map((t) => (t == "muralha" || t == "portao" ? H * 0.47 : H * 0.5));

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
      return 0.75;
    };
    (["attacker", "defender"] as Side[]).forEach((side) => {
      const mine = men.filter((m) => m.lane == lane && m.side == side && !isStatic(m));
      const k = Math.round(mine.length * loss(side));
      // morrem primeiro os que lutam corpo a corpo
      const order = [...mine].sort(() => rand() - 0.5).sort((p, q) => Number(ranged(p.role)) - Number(ranged(q.role)));
      order.slice(0, k).forEach((m, i) => (m.dieAt = T_FIGHT + 0.5 + (i / Math.max(1, k)) * 3.0 + rand() * 0.3));
    });
  });

  const sim: Sim = { field, res, houses, men, shots: [], breaths: [], sparks: [], t: 0, breach, rand, frontY };
  ([0, 1, 2] as Lane[]).forEach((lane) => {
    if (res.lanes[lane].winner != null) pairUp(sim, lane);
  });
  return sim;
}

/** Monta as duplas de uma faixa e diz para onde cada um vai. */
function pairUp(sim: Sim, lane: Lane): void {
  const A = sim.men.filter((m) => m.lane == lane && m.side == "attacker" && melee(m)).sort((p, q) => p.x - q.x);
  const D = sim.men.filter((m) => m.lane == lane && m.side == "defender" && melee(m)).sort((p, q) => p.x - q.x);
  const fy = sim.frontY[lane];
  const pairs = Math.min(A.length, D.length);
  if (pairs > 0) {
    // se todo mundo se encontrou no centro, a luta se espalha pelo campo inteiro
    const x0 = sim.res.metInCenter ? 16 : lane * LW + 10;
    const width = sim.res.metInCenter ? W - 32 : LW - 20;
    const cols = Math.max(1, Math.min(pairs, Math.floor(width / 66)));
    const rows = Math.ceil(pairs / cols);
    const colW = width / cols;
    for (let k = 0; k < pairs; k++) {
      const c = k % cols;
      const r = Math.floor(k / cols);
      const inRow = Math.min(cols, pairs - r * cols);
      const sx = x0 + width / 2 + (c - (inRow - 1) / 2) * colW + (r % 2 ? colW * 0.2 : 0);
      const sy = fy + (r - (rows - 1) / 2) * 40;
      const a = A[k];
      const d = D[k];
      const g = gap(a, d);
      a.foe = d;
      d.foe = a;
      a.gx = sx - g;
      a.gy = sy;
      d.gx = sx + g;
      d.gy = sy;
    }
    // quem sobra entra numa dupla (2 contra 1)
    const extra = A.length > D.length ? A.slice(pairs) : D.slice(pairs);
    extra.forEach((m, i) => joinFight(sim, m, i));
    return;
  }
  // um lado não tem quem lute corpo a corpo: os outros vão em cima dos arqueiros
  [...A, ...D].forEach((m, i) => joinFight(sim, m, i));
}

/** Põe um soldado sem dupla para lutar ao lado de um companheiro (ou contra quem estiver vivo). */
function joinFight(sim: Sim, m: Man, i = 0): void {
  const enemies = sim.men.filter((o) => o.side != m.side && o.lane == m.lane && !o.dead && !isStatic(o) && o.kind != "dragon" && o.dieAt > sim.t + 0.3);
  if (!enemies.length) {
    m.foe = null;
    return;
  }
  // prefere quem está mais perto e com menos gente em volta
  let best = enemies[0];
  let bd = Infinity;
  for (const o of enemies) {
    const busy = sim.men.filter((x) => x.foe === o && !x.dead && x.side == m.side).length;
    const d = Math.hypot(o.gx - m.x, o.gy - m.y) + busy * 40;
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  m.foe = best;
  const g = gap(m, best);
  // fica do lado "dele": atacante à esquerda do alvo, defensor à direita
  const s = m.side == "attacker" ? -1 : 1;
  const crowd = sim.men.filter((x) => x.foe === best && x !== m && !x.dead && x.side == m.side).length;
  m.gx = best.gx + s * (g * 2 + crowd * 8);
  m.gy = best.gy + (crowd % 2 ? 10 : -10) * Math.min(1, crowd) + (i % 2 ? 2 : -2);
  // se o alvo ainda não tem dupla, ele vem lutar com este
  if (!best.foe || best.foe.dead) {
    best.foe = m;
    best.gx = m.gx - s * g * 2;
    best.gy = m.gy;
  }
}

function nearestEnemy(sim: Sim, m: Man, prefer?: (o: Man) => boolean): Man | null {
  let best: Man | null = null;
  let bd = Infinity;
  for (const o of sim.men) {
    if (o.side == m.side || o.dead || o.lane != m.lane || o.kind == "dragon") continue;
    if (o.kind == "tower" && m.kind != "siege") continue;
    const d = (o.x - m.x) ** 2 + (o.y - m.y) ** 2 - (prefer && prefer(o) ? 1e5 : 0);
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  return best;
}

/** Anda até (x, y). Devolve true quando chegou. */
function moveTo(m: Man, x: number, y: number, sp: number, dt: number): boolean {
  const dx = x - m.x;
  const dy = y - m.y;
  const d = Math.hypot(dx, dy);
  if (d < 1.5) return true;
  const step = Math.min(d, sp * dt);
  m.x += (dx / d) * step;
  m.y += (dy / d) * step;
  m.dir = Math.atan2(dy, dx);
  return d - step < 1.5;
}

export function stepSim(sim: Sim, dt: number): void {
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
      // corpo a corpo só morre lutando; se ainda não chegou, espera
      if (melee(m) && !m.engaged && t < T_ROUT - 0.4) m.dieAt = t + 0.25;
      else {
        m.dead = true;
        m.deadAt = t;
        sim.sparks.push({ x: m.x, y: m.y - 14 * FIG, t0: t });
        // quem lutava com ele procura outro
        sim.men.forEach((o) => {
          if (o.foe === m && !o.dead) {
            o.engaged = false;
            if (o.kind != "dragon") joinFight(sim, o);
          }
        });
        continue;
      }
    }
    if (t < 0.6) continue; // ainda se arrumando
    const L = sim.res.lanes[m.lane];
    const lost = t > T_ROUT && L.winner && L.winner != "tie" && L.winner != m.side;
    if (lost && !isStatic(m)) {
      // quem perdeu foge para trás
      moveTo(m, m.x, m.side == "attacker" ? H + 60 : -60, m.speed * 1.25, dt);
      m.engaged = false;
      continue;
    }
    if (isStatic(m)) {
      // torre e catapulta atiram de onde estão
      if (t > m.nextShot && t < T_ROUT && contested(m.lane)) {
        if (m.kind == "siege" && sim.breach[m.lane] && t < T_FIGHT + 0.8) {
          sim.shots.push({ x0: m.x + 14, y0: m.y - 34 * FIG, to: null, tx: m.lane * LW + LW / 2 + (r() - 0.5) * 40, ty: H * 0.415, t0: t, dur: 0.9, kind: "stone" });
        } else {
          const tg = nearestEnemy(sim, m, (o) => o.engaged);
          if (tg) sim.shots.push({ x0: m.x, y0: m.y - (m.kind == "siege" ? 34 : 42) * FIG, to: tg, tx: 0, ty: 0, t0: t, dur: m.kind == "siege" ? 0.9 : 0.55, kind: m.kind == "siege" ? "stone" : "arrow" });
        }
        m.shotAt = t;
        m.nextShot = t + (m.kind == "siege" ? 1.4 : 0.8) + r() * 0.4;
      }
      continue;
    }
    if (!contested(m.lane)) {
      // ninguém para lutar aqui: avança um pouco e espera
      moveTo(m, m.gx, m.gy + (m.side == "attacker" ? -40 : 40), m.speed * 0.5, dt);
      continue;
    }
    if (m.kind == "dragon") {
      stepDragon(sim, m, dt);
      continue;
    }
    if (ranged(m.role)) {
      // arqueiro: chega até a distância de tiro, para e atira num inimigo de verdade
      const tg = nearestEnemy(sim, m, (o) => o.engaged);
      if (!tg) continue;
      const dist = Math.hypot(tg.x - m.x, tg.y - m.y);
      if (dist > 200) moveTo(m, tg.x, tg.y, m.speed * 0.8, dt);
      else if (t < T_ROUT) {
        m.flip = tg.x < m.x;
        m.atk = Math.max(0, Math.min(1, 1 - (m.nextShot - t) / 0.55));
        if (t > m.nextShot) {
          const d = m.flip ? -1 : 1;
          sim.shots.push({ x0: m.x + 9 * d * FIG, y0: m.y - 15 * FIG, to: tg, tx: 0, ty: 0, t0: t, dur: Math.max(0.35, dist / 360), kind: "arrow" });
          m.nextShot = t + 0.85 + r() * 0.6;
        }
      }
      continue;
    }
    // corpo a corpo: vai até o seu lugar na dupla e luta
    if (!m.foe || m.foe.dead) {
      joinFight(sim, m);
      if (!m.foe) continue;
    }
    const foe = m.foe;
    const arrived = moveTo(m, m.gx, m.gy, m.speed * (t < 1.2 ? 0.7 : 1), dt);
    m.fight = m.kind == "horse" && Math.hypot(foe.x - m.x, foe.y - m.y) < 120;
    if (arrived) {
      m.flip = foe.x < m.x;
      const close = Math.hypot(foe.x - m.x, foe.y - m.y) < gap(m, foe) * 2 + 22;
      if (close) {
        m.engaged = true;
        const before2 = m.swing;
        m.swing += dt * (m.kind == "horse" ? 8 : 10);
        m.atk = Math.max(0, Math.sin(m.swing));
        if (Math.floor(m.swing / Math.PI) != Math.floor(before2 / Math.PI) && r() < 0.4) {
          sim.sparks.push({ x: (m.x + foe.x) / 2, y: (m.y + foe.y) / 2 - 14 * FIG, t0: t });
        }
      }
    }
  }
  // flechas e pedras: some quando chega
  sim.shots = sim.shots.filter((s) => {
    if (t - s.t0 < s.dur) return true;
    if (s.to && !s.to.dead && s.kind == "arrow") sim.sparks.push({ x: s.to.x, y: s.to.y - 12 * FIG, t0: t });
    return false;
  });
  sim.breaths = sim.breaths.filter((b) => t - b.t0 < b.dur);
  sim.sparks = sim.sparks.filter((s) => t - s.t0 < 0.35);
  // passo e para que lado olha
  sim.men.forEach((m, i) => {
    if (m.dead) return;
    const moved = Math.hypot(m.x - before[i][0], m.y - before[i][1]);
    if (moved > 0.01) {
      m.walk += moved * (m.kind == "horse" ? 0.32 : 0.42);
      const c = Math.cos(m.dir);
      if (!m.engaged && m.kind != "dragon" && Math.abs(c) > 0.35) m.flip = c < 0;
    }
    if (isStatic(m) && t - m.shotAt < 0.5) m.atk = 1 - (t - m.shotAt) / 0.5;
  });
}

/** Dragão: voa até o lado de um inimigo e cospe fogo da boca até ele. */
function stepDragon(sim: Sim, m: Man, dt: number): void {
  const t = sim.t;
  if (!m.foe || m.foe.dead || m.foe.lane != m.lane) {
    // prefere onde tem mais inimigos juntos
    let best: Man | null = null;
    let bs = -1;
    for (const o of sim.men) {
      if (o.side == m.side || o.dead || o.lane != m.lane || isStatic(o) || o.kind == "dragon") continue;
      const near = sim.men.filter((x) => x.side == o.side && !x.dead && Math.hypot(x.x - o.x, x.y - o.y) < 40).length;
      if (near > bs) {
        bs = near;
        best = o;
      }
    }
    m.foe = best;
  }
  const tg = m.foe;
  if (!tg) return;
  // fica do lado do alvo, um pouco acima, virado para ele
  const side = m.x <= tg.x ? -1 : 1;
  const hx = Math.max(30, Math.min(W - 30, tg.x + side * 78));
  const hy = tg.y - 62 + Math.sin(t * 2 + m.phase) * 4;
  moveTo(m, hx, hy, m.speed, dt);
  m.flip = tg.x < m.x;
  const there = Math.hypot(hx - m.x, hy - m.y) < 16;
  if (there && t > m.nextShot && t > T_FIGHT - 0.8 && t < T_ROUT) {
    sim.breaths.push({ from: m, to: tg, t0: t, dur: 0.8 });
    m.shotAt = t;
    m.nextShot = t + 1.4 + sim.rand() * 0.4;
  }
  if (t - m.shotAt < 0.8) m.atk = 1 - (t - m.shotAt) / 0.8;
}

/** Ponto da boca do dragão (o sprite olha para a direita; FIG × 0,95 é a escala dele). */
export function dragonMouth(x: number, y: number, flip: boolean, s: number): [number, number] {
  const k = s * 0.95;
  return [x + 48 * (flip ? -1 : 1) * k, y - 3 * k];
}

// ---------------------------------------------------------------- desenho
function pose(m: Man, h: House, t: number): Pose {
  return { role: m.role, kind: m.kind, house: h, back: false, flip: m.flip, walk: m.walk, atk: m.atk, fight: m.fight, seed: m.seed, time: t + m.phase };
}

function drawBreath(ctx: CanvasRenderingContext2D, b: Breath, t: number): void {
  const p = (t - b.t0) / b.dur;
  const [x0, y0] = dragonMouth(b.from.x, b.from.y, b.from.flip, FIG);
  const x1 = b.to.x;
  const y1 = b.to.y - 12 * FIG;
  const reach = Math.min(1, p / 0.3); // o jato cresce até o alvo
  const fade = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
  const n = 18;
  for (let i = n; i >= 0; i--) {
    const q = (i / n) * reach;
    const x = x0 + (x1 - x0) * q + Math.sin(t * 40 + i) * 2 * q;
    const y = y0 + (y1 - y0) * q + Math.cos(t * 37 + i * 1.7) * 2 * q;
    const rad = (2.5 + q * 10) * (0.85 + 0.3 * Math.sin(t * 50 + i));
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(255,248,200,${0.95 * fade})`);
    g.addColorStop(0.45, `rgba(255,160,40,${0.8 * fade})`);
    g.addColorStop(1, "rgba(200,50,10,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  if (reach >= 1) {
    // o fogo pega no alvo
    const rad = 18 + Math.sin(t * 30) * 3;
    const g = ctx.createRadialGradient(x1, y1, 0, x1, y1, rad);
    g.addColorStop(0, `rgba(255,240,180,${0.9 * fade})`);
    g.addColorStop(0.5, `rgba(255,120,20,${0.65 * fade})`);
    g.addColorStop(1, "rgba(160,30,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x1, y1, rad, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawSim(ctx: CanvasRenderingContext2D, sim: Sim): void {
  const t = sim.t;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(terrainImage(sim.field), 0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  const lanesT = FIELD_LANES[sim.field];
  lanesT.forEach((tt, i) => {
    if (tt == "muralha" || tt == "portao") drawWall(ctx, i, tt == "portao", sim.breach[i] && t > T_FIGHT + 0.2);
  });
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
  const appear = ease(t / 0.6);
  // mortos embaixo; vivos por cima, ordenados pela altura; dragão por último
  const order = [...sim.men].sort((a, b) => Number(b.dead) - Number(a.dead) || (a.kind == "dragon" ? 1 : 0) - (b.kind == "dragon" ? 1 : 0) || a.y - b.y);
  ctx.save();
  ctx.globalAlpha = appear;
  for (const m of order) {
    if (m.dead) drawFallen(ctx, m.x, m.y, FIG, pose(m, sim.houses[m.side], t), t - m.deadAt);
    else drawUnit(ctx, m.x, m.y, FIG, pose(m, sim.houses[m.side], t), m.dir);
  }
  ctx.restore();
  // flechas e pedras: saem de quem atirou e chegam em quem levou
  for (const s of sim.shots) {
    const p = (t - s.t0) / s.dur;
    if (p < 0 || p > 1) continue;
    const tx = s.to ? s.to.x : s.tx;
    const ty = s.to ? s.to.y - 12 * FIG : s.ty;
    const lift = s.kind == "stone" ? 70 : 26;
    const x = s.x0 + (tx - s.x0) * p;
    const y = s.y0 + (ty - s.y0) * p - Math.sin(p * Math.PI) * lift;
    if (s.kind == "arrow") {
      const vx = tx - s.x0;
      const vy = ty - s.y0 - Math.cos(p * Math.PI) * lift * Math.PI;
      const ang = Math.atan2(vy, vx);
      ctx.lineCap = "round";
      ctx.strokeStyle = "#3a2a18";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.cos(ang) * 10, y - Math.sin(ang) * 10);
      ctx.stroke();
      ctx.strokeStyle = "#f3ead2";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = "#3b3833";
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const b of sim.breaths) drawBreath(ctx, b, t);
  for (const s of sim.sparks) {
    const p = (t - s.t0) / 0.35;
    ctx.strokeStyle = `rgba(255,245,215,${Math.max(0, 1 - p)})`;
    ctx.lineWidth = 1.6;
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
  drawUnit(ctx, x, y, scale, { role, kind: k, house: h, back: false, flip: side == "defender", walk: 0, atk: swing, fight: false, seed: Math.round(x), time: 0 }, dir);
}
