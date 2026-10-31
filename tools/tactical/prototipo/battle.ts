/**
 * A luta animada. O RESULTADO já foi decidido pela conta; aqui só se encena.
 *
 * Como é encenada:
 *  1. Cada esquadrão marcha da sua casinha até a linha de choque da faixa.
 *  2. Quem luta corpo a corpo forma DUPLAS frente a frente; quem sobra entra 2 contra 1.
 *  3. Cada um tem o seu ALCANCE: a lança fica longe, a espada precisa chegar perto (dá o passo
 *     no golpe), o arqueiro mantém distância e recua se chegarem perto.
 *  4. Golpe que acerta: o atingido pisca branco, é empurrado, espirra sangue; golpe forte congela
 *     a imagem por um instante e a tela treme (carga de cavalaria, pedra, fogo do dragão).
 *  5. Só morre quem a conta mandou morrer, e morre no golpe que leva (é jogado longe).
 *  6. O sangue cai no chão e fica (estilo Hotline Miami). Dá para desligar.
 *  7. No fim, quem perdeu a faixa foge.
 */
import { Lane, Side, Squad, TacticalBattleResult } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { FIELD_LANES, FieldType, Role, Row, SquadKind } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { rng } from "../solver";
import { House, ROLE_NAMES, TERRAIN_NAMES } from "./data";
import { DRAGON_SCALE, Kind, Pose, drawFallen, drawUnit, kindOf } from "./figures";
import { H, LW, W, ease, roundRect, terrainImage } from "./render";
import { drawWalls } from "./walls";

export const T_END = 10;
const T_FIGHT = 3.2; // começam as baixas
const T_ROUT = 7.4; // quem perdeu foge

/** Tamanho dos bonequinhos na luta. */
export const FIG = 1.35;

/** Alcance de cada função (em pixels do campo). Corpo a corpo: distância do golpe. */
export const REACH: Record<Role, number> = {
  lanceiro: 31,
  escudeiro: 22,
  arqueiro: 230,
  cavalaria: 33,
  batedores: 23,
  catapulta: 340,
  dragao: 100,
  torre: 270,
  ariete: 30,
  abordagem: 26,
  flechas: 240
};

/** Texto do alcance (para a tela de escolher a função). */
export const REACH_LABEL: Record<Role, string> = {
  lanceiro: "alcance longo (lança)",
  escudeiro: "alcance curto (espada)",
  arqueiro: "atira de longe",
  cavalaria: "alcance longo (lança de cavalaria)",
  batedores: "alcance médio",
  catapulta: "atira muito longe",
  dragao: "fogo de perto, voando",
  torre: "atira de longe",
  ariete: "abalroa de perto",
  abordagem: "abordagem de perto",
  flechas: "atira de longe"
};

let gore = true;
export function setGore(on: boolean): void {
  gore = on;
}

interface Man {
  side: Side;
  lane: Lane;
  role: Role;
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** lugar na dupla antes de chegar */
  gx: number;
  gy: number;
  /** deslocamento vertical na dupla (quem entra 2 contra 1) */
  yoff: number;
  /** tem um lugar marcado na linha de duplas (gx, gy); senão vai direto no inimigo */
  spot: boolean;
  reach: number;
  dir: number;
  speed: number;
  foe: Man | null;
  dieAt: number;
  dead: boolean;
  deadAt: number;
  /** golpe: começou em, próximo em */
  atkStart: number;
  nextHit: number;
  nextShot: number;
  shotAt: number;
  hitT: number;
  phase: number;
  flip: boolean;
  walk: number;
  atk: number;
  fight: boolean;
  seed: number;
  engaged: boolean;
  /** dragão caído já bateu no chão */
  crashed?: boolean;
}

interface Shot {
  x0: number;
  y0: number;
  to: Man | null;
  tx: number;
  ty: number;
  t0: number;
  dur: number;
  kind: "arrow" | "stone";
  from: Man;
}

interface Breath {
  from: Man;
  to: Man;
  t0: number;
  dur: number;
  hit: boolean;
}

interface Spark {
  x: number;
  y: number;
  t0: number;
}

/** Poeira (passos de cavalo, choque, pedra). */
interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t0: number;
  life: number;
  r: number;
}

/** Marca do corte (meia-lua branca) no golpe. */
interface Slash {
  x: number;
  y: number;
  t0: number;
  d: number;
  big: boolean;
}

/** Gota de sangue voando; quando cai, vira mancha no chão. */
interface Drop {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  dark: boolean;
}

export interface Sim {
  field: FieldType;
  res: TacticalBattleResult;
  houses: Record<Side, House>;
  men: Man[];
  shots: Shot[];
  breaths: Breath[];
  sparks: Spark[];
  drops: Drop[];
  dust: Dust[];
  slashes: Slash[];
  /** manchas no chão (pintadas uma vez) */
  floor: HTMLCanvasElement | null;
  t: number;
  /** congela a imagem por um instante (golpe forte) */
  stop: number;
  shake: number;
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

/** Distância entre os dois de uma dupla, parados (a média dos alcances). */
function duelDist(a: Man, b: Man): number {
  return Math.max(20, (a.reach + b.reach) / 2 + 4);
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
          vx: 0,
          vy: 0,
          gx: x + jx,
          gy: y + jy,
          yoff: 0,
          spot: false,
          reach: REACH[sq.role] ?? 20,
          dir: side == "attacker" ? -Math.PI / 2 : Math.PI / 2,
          speed: kind == "horse" ? 92 : kind == "dragon" ? 130 : kind == "ship" ? 40 : kind == "foot" ? 50 + rand() * 8 : 0,
          foe: null,
          dieAt: Infinity,
          dead: false,
          deadAt: 0,
          atkStart: -9,
          nextHit: 0,
          nextShot: 1.6 + rand() * 0.8,
          shotAt: -9,
          hitT: -9,
          phase: rand() * 6.28,
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
    // vizinha com luta; se não houver, a outra ponta (atravessa o campo)
    let targets = ([0, 1, 2] as Lane[]).filter((n) => Math.abs(n - lane) == 1 && res.lanes[n].winner != null);
    if (!targets.length) targets = ([0, 1, 2] as Lane[]).filter((n) => Math.abs(n - lane) == 2 && res.lanes[n].winner != null);
    if (!targets.length) return;
    men.filter((m) => m.lane == lane && !isStatic(m)).forEach((m, i) => (m.lane = targets[i % targets.length]));
  });

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
    const count = (side: Side): number => men.filter((m) => m.lane == lane && m.side == side && !isStatic(m)).length;
    const kills: Record<Side, number> = {
      attacker: Math.round(count("attacker") * loss("attacker")),
      defender: Math.round(count("defender") * loss("defender"))
    };
    // quem perde a faixa termina SEMPRE com menos gente de pé do que quem ganha (senão não dá para entender a fuga)
    if (L.winner == "attacker" || L.winner == "defender") {
      const w = L.winner;
      const l: Side = w == "attacker" ? "defender" : "attacker";
      const leftW = count(w) - kills[w];
      if (count(l) - kills[l] >= leftW) kills[l] = Math.min(count(l), count(l) - leftW + 1);
    }
    (["attacker", "defender"] as Side[]).forEach((side) => {
      const mine = men.filter((m) => m.lane == lane && m.side == side && !isStatic(m));
      const k = kills[side];
      const order = [...mine].sort(() => rand() - 0.5).sort((p, q) => Number(ranged(p.role)) - Number(ranged(q.role)));
      order.slice(0, k).forEach((m, i) => (m.dieAt = T_FIGHT + 0.5 + (i / Math.max(1, k)) * 3.2 + rand() * 0.3));
    });
  });

  const sim: Sim = { field, res, houses, men, shots: [], breaths: [], sparks: [], drops: [], dust: [], slashes: [], floor: null, t: 0, stop: 0, shake: 0, breach, rand, frontY };
  ([0, 1, 2] as Lane[]).forEach((lane) => {
    if (res.lanes[lane].winner != null) pairUp(sim, lane);
  });
  return sim;
}

/** Monta as duplas de uma faixa. */
function pairUp(sim: Sim, lane: Lane): void {
  const A = sim.men.filter((m) => m.lane == lane && m.side == "attacker" && melee(m)).sort((p, q) => p.x - q.x);
  const D = sim.men.filter((m) => m.lane == lane && m.side == "defender" && melee(m)).sort((p, q) => p.x - q.x);
  const fy = sim.frontY[lane];
  const pairs = Math.min(A.length, D.length);
  if (pairs > 0) {
    const x0 = sim.res.metInCenter ? 16 : lane * LW + 10;
    const width = sim.res.metInCenter ? W - 32 : LW - 20;
    const cols = Math.max(1, Math.min(pairs, Math.floor(width / 70)));
    const rows = Math.ceil(pairs / cols);
    const colW = width / cols;
    for (let k = 0; k < pairs; k++) {
      const c = k % cols;
      const r = Math.floor(k / cols);
      const inRow = Math.min(cols, pairs - r * cols);
      const sx = x0 + width / 2 + (c - (inRow - 1) / 2) * colW + (r % 2 ? colW * 0.2 : 0);
      const sy = fy + (r - (rows - 1) / 2) * 42;
      const a = A[k];
      const d = D[k];
      const dd = duelDist(a, d);
      a.foe = d;
      d.foe = a;
      a.gx = sx - dd / 2;
      a.gy = sy;
      d.gx = sx + dd / 2;
      d.gy = sy;
      a.spot = true;
      d.spot = true;
    }
    const extra = A.length > D.length ? A.slice(pairs) : D.slice(pairs);
    extra.forEach((m, i) => joinFight(sim, m, i));
    return;
  }
  [...A, ...D].forEach((m, i) => joinFight(sim, m, i));
}

/** Soldado sem dupla: entra ao lado de um companheiro (2 contra 1) ou vai em cima de quem estiver vivo. */
function joinFight(sim: Sim, m: Man, i = 0): void {
  const enemies = sim.men.filter((o) => o.side != m.side && o.lane == m.lane && !o.dead && !isStatic(o) && o.kind != "dragon");
  if (!enemies.length) {
    m.foe = null;
    return;
  }
  let best = enemies[0];
  let bd = Infinity;
  for (const o of enemies) {
    const busy = sim.men.filter((x) => x.foe === o && !x.dead && x.side == m.side).length;
    const d = Math.hypot(o.x - m.x, o.y - m.y) + busy * 45 + (o.dieAt < sim.t + 0.3 ? 200 : 0);
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  m.foe = best;
  m.spot = false; // sem lugar marcado: vai direto no inimigo
  const crowd = sim.men.filter((x) => x.foe === best && x !== m && !x.dead && x.side == m.side).length;
  m.yoff = crowd == 0 ? 0 : (crowd % 2 ? 14 : -14) * Math.ceil(crowd / 2) + (i % 2 ? 1 : -1);
  if (!best.foe || best.foe.dead) best.foe = m;
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

/** Quer ir até (x, y): acelera e freia aos poucos (não teleporta, não para seco). */
function steer(m: Man, x: number, y: number, maxSp: number, dt: number): void {
  const dx = x - m.x;
  const dy = y - m.y;
  const d = Math.hypot(dx, dy);
  const want = d < 0.8 ? 0 : Math.min(maxSp, d * 5); // freia ao chegar
  const tvx = d > 0 ? (dx / d) * want : 0;
  const tvy = d > 0 ? (dy / d) * want : 0;
  const acc = m.kind == "horse" ? 3.2 : m.kind == "dragon" ? 2.5 : 8;
  const k = 1 - Math.exp(-dt * acc);
  m.vx += (tvx - m.vx) * k;
  m.vy += (tvy - m.vy) * k;
}

// ---------------------------------------------------------------- golpes, sangue, impacto
function bleed(sim: Sim, x: number, y: number, dirx: number, diry: number, amount: number): void {
  if (!gore) return;
  const r = sim.rand;
  const n = Math.round(amount);
  for (let i = 0; i < n; i++) {
    // a maioria voa para o lado do golpe; algumas espirram longe (jato)
    const jet = r() < 0.2;
    const sp = jet ? 90 + r() * 80 : 25 + r() * 65;
    const a = Math.atan2(diry, dirx) + (r() - 0.5) * (jet ? 0.6 : 1.9);
    sim.drops.push({ x, y, z: 14 * FIG + (r() - 0.3) * 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 10 + r() * 45, size: r() < 0.15 ? 3 : r() < 0.45 ? 2 : 1, dark: r() < 0.35 });
  }
  if (sim.drops.length > 1600) sim.drops.splice(0, sim.drops.length - 1600);
}

/** Mancha no chão (fica até o fim). Pintada em 1×, com "pixel" do mesmo tamanho dos bonecos. */
function stain(sim: Sim, x: number, y: number, size: number, dark: boolean): void {
  if (!sim.floor) {
    sim.floor = document.createElement("canvas");
    sim.floor.width = W;
    sim.floor.height = H;
  }
  const ctx = sim.floor.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = dark ? "#4a0807" : "#8e1410";
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
}

function scorch(sim: Sim, x: number, y: number): void {
  if (!sim.floor) {
    sim.floor = document.createElement("canvas");
    sim.floor.width = W;
    sim.floor.height = H;
  }
  const ctx = sim.floor.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = sim.rand() < 0.5 ? "rgba(30,20,12,.8)" : "rgba(60,38,20,.7)";
  ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
}

function puff(sim: Sim, x: number, y: number, n: number, sp: number, r0: number): void {
  const r = sim.rand;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const v = sp * (0.4 + r() * 0.6);
    sim.dust.push({ x: x + (r() - 0.5) * 6, y: y + (r() - 0.5) * 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5 - 6, t0: sim.t, life: 0.45 + r() * 0.4, r: r0 * (0.6 + r() * 0.8) });
  }
  if (sim.dust.length > 500) sim.dust.splice(0, sim.dust.length - 500);
}

function pool(sim: Sim, x: number, y: number, big: number): void {
  if (!gore) return;
  const r = sim.rand;
  for (let i = 0; i < big; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * (4 + big * 0.35);
    stain(sim, x + Math.cos(a) * d * 1.4, y + Math.sin(a) * d * 0.6, r() < 0.4 ? 2 : 1, r() < 0.5);
  }
}

/** Alguém levou um golpe. power: 1 = golpe comum, 2 = forte (cavalaria, pedra, fogo). */
function hit(sim: Sim, from: { x: number; y: number }, m: Man, power: number, blocked = false): void {
  const t = sim.t;
  const dx = m.x - from.x;
  const dy = m.y - from.y;
  const d = Math.hypot(dx, dy) || 1;
  const nx = dx / d;
  const ny = dy / d;
  const heavy = m.kind == "horse" || m.kind == "ship";
  const push = (blocked ? 35 : 75 * power) / (heavy ? 2 : 1);
  m.vx += nx * push;
  m.vy += ny * push * 0.6;
  if (blocked) {
    sim.sparks.push({ x: m.x - nx * 6, y: m.y - 14 * FIG, t0: t });
    return;
  }
  m.hitT = t;
  sim.slashes.push({ x: m.x - nx * 4, y: m.y - 14 * FIG, t0: t, d: nx >= 0 ? 1 : -1, big: power >= 1.5 });
  puff(sim, m.x, m.y, power >= 2 ? 5 : 1, 30, 2.5);
  bleed(sim, m.x, m.y, nx, ny, 12 + power * 10);
  pool(sim, m.x - nx * 2, m.y, 3);
  if (power >= 2) {
    sim.shake = Math.max(sim.shake, 3.5);
    sim.stop = Math.max(sim.stop, 0.06);
  }
  // quem a conta mandou morrer morre no golpe
  if (t >= m.dieAt) kill(sim, m, nx, ny, power);
}

function kill(sim: Sim, m: Man, nx: number, ny: number, power: number): void {
  if (m.dead) return;
  const t = sim.t;
  m.dead = true;
  m.deadAt = t;
  // jogado longe
  const heavy = m.kind == "horse" || m.kind == "ship";
  m.vx += nx * (heavy ? 60 : 150) * Math.min(2, power);
  m.vy += ny * (heavy ? 30 : 80) * Math.min(2, power);
  m.flip = nx > 0; // cai para trás
  bleed(sim, m.x, m.y, nx, ny, heavy ? 70 : 55);
  puff(sim, m.x, m.y, heavy ? 10 : 5, 40, 4);
  bleed(sim, m.x, m.y, -nx, -ny, 10);
  pool(sim, m.x, m.y, heavy ? 70 : 46);
  sim.stop = Math.max(sim.stop, power >= 2 ? 0.09 : 0.05);
  sim.shake = Math.max(sim.shake, power >= 2 ? 4 : 2);
  sim.men.forEach((o) => {
    if (o.foe === m && !o.dead) {
      o.engaged = false;
      if (o.kind != "dragon") joinFight(sim, o);
    }
  });
}

export function stepSim(sim: Sim, dt: number): void {
  // golpe forte: a imagem congela um instante (o tempo da luta não anda)
  if (sim.stop > 0) {
    sim.stop = Math.max(0, sim.stop - dt);
    sim.shake *= Math.exp(-dt * 10);
    return;
  }
  sim.t = Math.min(T_END, sim.t + dt);
  sim.shake *= Math.exp(-dt * 10);
  const t = sim.t;
  const r = sim.rand;
  const contested = (lane: Lane): boolean => sim.res.lanes[lane].winner != null;
  const before = sim.men.map((m) => [m.x, m.y]);
  for (const m of sim.men) {
    m.atk = 0;
    m.fight = false;
    if (m.dead) continue;
    // a conta mandou morrer e ninguém acertou ainda: espera um pouco pelo golpe, depois cai
    if (t >= m.dieAt + (melee(m) ? (m.engaged ? 0.9 : 2.5) : 1.2) || (t >= m.dieAt && t > T_ROUT - 0.3)) {
      const f = m.foe ?? m;
      const d = Math.hypot(m.x - f.x, m.y - f.y) || 1;
      kill(sim, m, f === m ? (m.side == "attacker" ? 0 : 0) : (m.x - f.x) / d, f === m ? (m.side == "attacker" ? 1 : -1) : (m.y - f.y) / d, 1);
      continue;
    }
    if (t < 0.6) continue;
    const L = sim.res.lanes[m.lane];
    const lost = t > T_ROUT && L.winner && L.winner != "tie" && L.winner != m.side;
    if (lost && !isStatic(m)) {
      steer(m, m.x, m.side == "attacker" ? H + 80 : -80, m.speed * 1.3, dt);
      m.engaged = false;
      continue;
    }
    if (isStatic(m)) {
      if (t > m.nextShot && t < T_ROUT && contested(m.lane)) {
        if (m.kind == "siege" && sim.breach[m.lane] && t < T_FIGHT + 0.8) {
          sim.shots.push({ x0: m.x + 14, y0: m.y - 34 * FIG, to: null, tx: m.lane * LW + LW / 2 + (r() - 0.5) * 40, ty: H * 0.415, t0: t, dur: 0.9, kind: "stone", from: m });
        } else {
          const tg = nearestEnemy(sim, m, (o) => o.engaged);
          if (tg) sim.shots.push({ x0: m.x, y0: m.y - (m.kind == "siege" ? 34 : 42) * FIG, to: tg, tx: 0, ty: 0, t0: t, dur: m.kind == "siege" ? 0.9 : 0.55, kind: m.kind == "siege" ? "stone" : "arrow", from: m });
        }
        m.shotAt = t;
        m.nextShot = t + (m.kind == "siege" ? 1.4 : 0.8) + r() * 0.4;
      }
      continue;
    }
    if (!contested(m.lane)) {
      steer(m, m.gx, m.gy + (m.side == "attacker" ? -40 : 40), m.speed * 0.5, dt);
      continue;
    }
    if (m.kind == "dragon") {
      stepDragon(sim, m, dt);
      continue;
    }
    if (ranged(m.role)) {
      // arqueiro: fica no alcance, atira; se chegarem muito perto, recua
      const tg = nearestEnemy(sim, m, (o) => o.engaged);
      if (!tg) {
        steer(m, m.x, m.y, 0, dt);
        continue;
      }
      const dist = Math.hypot(tg.x - m.x, tg.y - m.y);
      if (dist > m.reach) steer(m, tg.x, tg.y, m.speed * 0.8, dt);
      else if (dist < 55) steer(m, m.x - (tg.x - m.x), m.y - (tg.y - m.y), m.speed * 0.7, dt);
      else steer(m, m.x, m.y, 0, dt);
      if (dist <= m.reach && t < T_ROUT) {
        m.flip = tg.x < m.x;
        m.atk = Math.max(0, Math.min(1, 1 - (m.nextShot - t) / 0.55));
        if (t > m.nextShot) {
          const d = m.flip ? -1 : 1;
          sim.shots.push({ x0: m.x + 9 * d * FIG, y0: m.y - 15 * FIG, to: tg, tx: 0, ty: 0, t0: t, dur: Math.max(0.3, dist / 380), kind: "arrow", from: m });
          m.nextShot = t + 0.9 + r() * 0.6;
          m.shotAt = t;
        }
      }
      continue;
    }
    // ----- corpo a corpo
    if (!m.foe || m.foe.dead) {
      joinFight(sim, m);
      if (!m.foe) {
        steer(m, m.x, m.y, 0, dt);
        continue;
      }
    }
    const foe = m.foe;
    const s = m.side == "attacker" ? -1 : 1; // atacante fica à esquerda do inimigo
    const dd = duelDist(m, foe);
    const near = Math.hypot(foe.x - m.x, foe.y - m.y) < dd + 26;
    // golpe: prepara (0,15 s), acerta, volta (0,25 s)
    const p = (t - m.atkStart) / 0.4;
    m.atk = p >= 0 && p <= 1 ? (p < 0.4 ? p / 0.4 : 1 - (p - 0.4) / 0.6) : 0;
    // no golpe, quem tem alcance curto dá o passo para dentro
    const lunge = p >= 0 && p < 0.6 ? Math.max(0, dd - m.reach + 2) : 0;
    const sway = Math.sin(t * 3 + m.phase) * 2; // fica se mexendo, não parado como estátua
    let tx: number;
    let ty: number;
    // o lugar marcado só vale enquanto a dupla também vem para ele; se não vier, vai direto no inimigo
    if (m.spot && (foe.foe !== m || !foe.spot || (t > T_FIGHT && Math.hypot(m.gx - m.x, m.gy - m.y) < 4))) m.spot = false;
    if (!m.engaged && !near) {
      // ainda indo: primeiro para o lugar da dupla; quem entra depois vai direto no inimigo
      tx = m.spot ? m.gx : foe.x + s * dd;
      ty = m.spot ? m.gy : foe.y + m.yoff;
    } else {
      tx = foe.x + s * (dd - lunge) + sway * 0.5;
      ty = foe.y + m.yoff;
    }
    steer(m, tx, ty, m.speed * (t < 1.2 ? 0.7 : 1), dt);
    m.fight = m.kind == "horse" && Math.hypot(foe.x - m.x, foe.y - m.y) < 130;
    if (near) {
      m.flip = foe.x < m.x;
      if (!m.engaged) {
        m.engaged = true;
        m.nextHit = t + 0.1 + r() * 0.5;
        // carga de cavalaria: chega com tudo
        if (m.kind == "horse" && Math.hypot(m.vx, m.vy) > 45 && t > T_FIGHT - 1) {
          hit(sim, m, foe, 2);
          m.atkStart = t - 0.16;
          m.nextHit = t + 0.9;
        }
      }
      if (t >= m.nextHit && t > T_FIGHT - 0.8 && t < T_ROUT) {
        m.atkStart = t;
        m.nextHit = t + (m.kind == "horse" ? 1.1 : 0.75) + r() * 0.45;
      }
      // o golpe acerta no meio do movimento
      const prev = (t - dt - m.atkStart) / 0.4;
      if (prev < 0.4 && p >= 0.4 && t < T_ROUT) {
        const blocked = foe.role == "escudeiro" && r() < 0.4;
        hit(sim, m, foe, m.kind == "horse" ? 1.5 : 1, blocked);
        if (!blocked && r() < 0.35) sim.sparks.push({ x: (m.x + foe.x) / 2, y: (m.y + foe.y) / 2 - 14 * FIG, t0: t });
      }
    }
  }
  // flechas e pedras chegam
  sim.shots = sim.shots.filter((s) => {
    if (t - s.t0 < s.dur) return true;
    if (s.kind == "arrow" && s.to && !s.to.dead) hit(sim, s.from, s.to, 0.6);
    if (s.kind == "stone") {
      const tx = s.to ? s.to.x : s.tx;
      const ty = s.to ? s.to.y : s.ty;
      sim.shake = Math.max(sim.shake, 3);
      sim.sparks.push({ x: tx, y: ty - 4, t0: t });
      puff(sim, tx, ty, 14, 70, 5);
      sim.men.forEach((o) => {
        if (!o.dead && o.side != s.from.side && Math.hypot(o.x - tx, o.y - ty) < 26) hit(sim, { x: tx, y: ty }, o, 2);
      });
    }
    return false;
  });
  // fogo do dragão: queima quem está no alvo e em volta
  for (const b of sim.breaths) {
    const p = (t - b.t0) / b.dur;
    if (!b.hit && p > 0.3) {
      b.hit = true;
      sim.shake = Math.max(sim.shake, 3);
      sim.men.forEach((o) => {
        if (!o.dead && o.side != b.from.side && Math.hypot(o.x - b.to.x, o.y - b.to.y) < 36) hit(sim, b.from, o, 2);
      });
      // chão queimado
      for (let i = 0; i < 40; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * 20;
        scorch(sim, b.to.x + Math.cos(a) * d * 1.3, b.to.y + Math.sin(a) * d * 0.55);
      }
      puff(sim, b.to.x, b.to.y, 8, 50, 5);
    }
  }
  sim.breaths = sim.breaths.filter((b) => t - b.t0 < b.dur);
  sim.sparks = sim.sparks.filter((s) => t - s.t0 < 0.35);
  sim.slashes = sim.slashes.filter((s) => t - s.t0 < 0.16);
  sim.dust = sim.dust.filter((d) => {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vx *= Math.exp(-dt * 3);
    d.vy *= Math.exp(-dt * 3);
    return t - d.t0 < d.life;
  });
  // física: anda, empurra os companheiros para não amontoar, mortos escorregam e param
  const alive = sim.men.filter((m) => !m.dead && m.kind != "dragon" && !isStatic(m));
  for (let i = 0; i < alive.length; i++)
    for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i];
      const b = alive[j];
      const R = a.kind == "horse" || b.kind == "horse" ? 24 : 14;
      const ex = a.x - b.x;
      const ey = (a.y - b.y) * 1.6;
      const d = Math.hypot(ex, ey);
      if (d < R && d > 0.01) {
        const f = ((R - d) / R) * 140 * dt;
        a.vx += (ex / d) * f;
        a.vy += (ey / d) * f * 0.6;
        b.vx -= (ex / d) * f;
        b.vy -= (ey / d) * f * 0.6;
      }
    }
  for (const m of sim.men) {
    if (isStatic(m)) continue;
    if (m.dead && m.kind == "dragon") {
      m.vx = 0;
      m.vy = 0;
      if (!m.crashed && t - m.deadAt >= 0.9) {
        m.crashed = true;
        const gy = m.y + 46 * FIG;
        sim.shake = Math.max(sim.shake, 7);
        sim.stop = Math.max(sim.stop, 0.08);
        puff(sim, m.x, gy, 22, 110, 6);
        pool(sim, m.x, gy, 70);
        bleed(sim, m.x, gy, 1, 0, 25);
        bleed(sim, m.x, gy, -1, 0, 25);
      }
      continue;
    }
    if (m.dead) {
      // corpo escorrega e para, deixando rastro
      const k = Math.exp(-dt * 7);
      m.vx *= k;
      m.vy *= k;
      if (gore && Math.hypot(m.vx, m.vy) > 25 && r() < 0.6) stain(sim, m.x + (r() - 0.5) * 4, m.y - 1, 1, r() < 0.5);
      // a poça cresce devagar nos primeiros segundos
      const age = t - m.deadAt;
      if (gore && age < 2.5 && r() < 0.5) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(age / 2.5) * (m.kind == "horse" ? 16 : 11) * Math.sqrt(r());
        stain(sim, m.x + Math.cos(a) * d * 1.4, m.y + Math.sin(a) * d * 0.55, r() < 0.4 ? 2 : 1, r() < 0.55);
      }
    } else if (Math.hypot(m.vx, m.vy) > (m.kind == "horse" ? 40 : 70) && r() < (m.kind == "horse" ? 0.35 : 0.08)) {
      // poeira dos passos (cavalo correndo levanta muita)
      puff(sim, m.x - m.vx * 0.05, m.y, 1, 10, m.kind == "horse" ? 4 : 2.5);
    }
    m.x += m.vx * dt;
    m.y += m.vy * dt;
  }
  // gotas de sangue voando
  sim.drops = sim.drops.filter((d) => {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vz -= 260 * dt;
    d.z += d.vz * dt;
    if (d.z <= 0) {
      stain(sim, d.x, d.y, d.size, d.dark);
      return false;
    }
    return true;
  });
  // passo e para que lado olha
  sim.men.forEach((m, i) => {
    if (m.dead) return;
    const moved = Math.hypot(m.x - before[i][0], m.y - before[i][1]);
    if (moved > 0.01) {
      m.walk += moved * (m.kind == "horse" ? 0.32 : 0.42);
      if (Math.hypot(m.vx, m.vy) > 4) m.dir = Math.atan2(m.vy, m.vx);
      const c = Math.cos(m.dir);
      if (!m.engaged && m.kind != "dragon" && Math.abs(c) > 0.35 && Math.hypot(m.vx, m.vy) > 12) m.flip = c < 0;
    }
    if (isStatic(m) && t - m.shotAt < 0.5) m.atk = 1 - (t - m.shotAt) / 0.5;
  });
}

/** Dragão: voa até o lado de um inimigo e cospe fogo da boca até ele. */
function stepDragon(sim: Sim, m: Man, dt: number): void {
  const t = sim.t;
  if (!m.foe || m.foe.dead || m.foe.lane != m.lane) {
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
  if (!tg) {
    steer(m, m.x, m.y, 0, dt);
    return;
  }
  const side = m.x <= tg.x ? -1 : 1;
  const hx = Math.max(30, Math.min(W - 30, tg.x + side * 78));
  const hy = tg.y - 62 + Math.sin(t * 2 + m.phase) * 4;
  steer(m, hx, hy, m.speed, dt);
  m.flip = tg.x < m.x;
  const there = Math.hypot(hx - m.x, hy - m.y) < 18;
  if (there && t > m.nextShot && t > T_FIGHT - 0.8 && t < T_ROUT) {
    sim.breaths.push({ from: m, to: tg, t0: t, dur: 1.0, hit: false });
    m.shotAt = t;
    m.nextShot = t + 1.4 + sim.rand() * 0.4;
  }
  if (t - m.shotAt < 1.0) m.atk = 1 - (t - m.shotAt) / 1.0;
}

/** Ponto da boca do dragão (o sprite olha para a direita; FIG × 0,95 é a escala dele). */
export function dragonMouth(x: number, y: number, flip: boolean, s: number): [number, number] {
  const k = s * DRAGON_SCALE;
  return [x + 48 * (flip ? -1 : 1) * k, y - 3 * k];
}

// ---------------------------------------------------------------- desenho
function pose(m: Man, h: House, t: number): Pose {
  const flash = t - m.hitT < 0.14 ? 1 - (t - m.hitT) / 0.14 : 0;
  const q = (t - m.atkStart) / 0.4;
  const moving = Math.hypot(m.vx, m.vy) > 10;
  return {
    role: m.role,
    kind: m.kind,
    house: h,
    back: false,
    flip: m.flip,
    walk: m.walk,
    atk: m.atk,
    fight: m.fight,
    seed: m.seed,
    time: t + m.phase,
    flash,
    atkPhase: q >= 0 && q < 1 ? q : undefined,
    release: ranged(m.role) && t - m.shotAt < 0.14,
    moving,
    guard: m.engaged
  };
}

function drawBreath(ctx: CanvasRenderingContext2D, b: Breath, t: number): void {
  const p = (t - b.t0) / b.dur;
  const [x0, y0] = dragonMouth(b.from.x, b.from.y, b.from.flip, FIG);
  const x1 = b.to.x;
  const y1 = b.to.y - 12 * FIG;
  const reach = Math.min(1, p / 0.3);
  const fade = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
  const n = 26;
  for (let i = n; i >= 0; i--) {
    const q = (i / n) * reach;
    const x = x0 + (x1 - x0) * q + Math.sin(t * 40 + i) * 2 * q;
    const y = y0 + (y1 - y0) * q + Math.cos(t * 37 + i * 1.7) * 2 * q;
    const rad = (3 + q * 15) * (0.85 + 0.3 * Math.sin(t * 50 + i));
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
    const rad = 30 + Math.sin(t * 30) * 4;
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

/** Por que cada lado está melhor nesta faixa (para mostrar na tela). */
export function laneReasons(res: TacticalBattleResult, lane: number): { text: string; side: Side }[] {
  const L = res.lanes[lane];
  const out: { text: string; side: Side }[] = [];
  const seen = new Set<string>();
  const add = (text: string, side: Side): void => {
    if (seen.has(text)) return;
    seen.add(text);
    out.push({ text, side });
  };
  for (const f of L.factors) {
    if (f.kind == "counter" && f.role && f.vs) add(`${ROLE_NAMES[f.role]} vence ${ROLE_NAMES[f.vs].toLowerCase()}`, f.side);
    else if (f.kind == "wall") add("muralha: defesa +30%", f.side);
    else if (f.kind == "wall-breach") add("catapulta derruba a muralha", f.side);
    else if (f.kind == "flank") add("ajuda pelo lado", f.side);
    else if (f.kind == "far-flank") add("ajuda de longe (15%)", f.side);
    else if (f.kind == "screen") add("a frente segura a cavalaria", f.side);
  }
  return out.slice(0, 3);
}

/** Placar de cada faixa: no começo diz quem tem vantagem e por quê; durante a luta, a barra vai enchendo. */
function drawLaneHud(ctx: CanvasRenderingContext2D, sim: Sim): void {
  const t = sim.t;
  sim.res.lanes.forEach((L, i) => {
    const cx = i * LW + LW / 2;
    if (L.winner == null) return;
    const A = L.attackerScore;
    const D = L.defenderScore;
    const share = A / (A + D || 1);
    const hA = sim.houses.attacker;
    const hD = sim.houses.defender;
    // barra (de cima): a parte de cada Casa cresce até o resultado da conta
    const prog = ease((t - T_FIGHT + 0.3) / (T_ROUT - T_FIGHT));
    const shown = 0.5 + (share - 0.5) * prog;
    const bw = LW - 26;
    const bx = cx - bw / 2;
    const by = 72;
    ctx.fillStyle = "rgba(10,8,6,.75)";
    roundRect(ctx, bx - 3, by - 3, bw + 6, 16, 8);
    ctx.fill();
    ctx.save();
    roundRect(ctx, bx, by, bw, 10, 5);
    ctx.clip();
    ctx.fillStyle = hD.color;
    ctx.fillRect(bx, by, bw, 10);
    ctx.fillStyle = hA.color;
    ctx.fillRect(bx, by, bw * shown, 10);
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.fillRect(bx + bw / 2 - 1, by, 2, 10);
    ctx.restore();
    // cartão do começo: quem tem vantagem e por quê
    const a = t < 2.4 ? ease(t / 0.4) : 1 - ease((t - 2.4) / 0.5);
    if (a <= 0.01) return;
    const reasons = laneReasons(sim.res, i);
    const diff = Math.abs(A - D) / Math.max(A, D);
    const lead: Side | null = diff < 0.06 ? null : A > D ? "attacker" : "defender";
    const title = lead ? `VANTAGEM ${sim.houses[lead].name.toUpperCase()}` : "PAREJO";
    ctx.save();
    ctx.globalAlpha = a;
    const w = LW - 12;
    const h = 40 + reasons.length * 21;
    const x = cx - w / 2;
    const y = H * 0.5 - h / 2;
    ctx.fillStyle = "rgba(14,11,8,.86)";
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = lead ? sim.houses[lead].color : "#bba98a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = lead ? sim.houses[lead].color : "#f1e6cb";
    ctx.font = "800 15px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    ctx.fillText(title, cx, y + 17, w - 12);
    ctx.font = "700 13.5px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    reasons.forEach((r, k) => {
      ctx.fillStyle = sim.houses[r.side].color;
      ctx.beginPath();
      ctx.arc(x + 12, y + 40 + k * 21, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f1e6cb";
      ctx.textAlign = "left";
      ctx.fillText(r.text, x + 21, y + 40.5 + k * 21, w - 28);
      ctx.textAlign = "center";
    });
    if (!reasons.length) {
      ctx.fillStyle = "#bba98a";
      ctx.fillText(lead ? "mais força nesta faixa" : "forças iguais", cx, y + 38, w - 12);
    }
    ctx.restore();
  });
}

export function drawSim(ctx: CanvasRenderingContext2D, sim: Sim): void {
  const t = sim.t;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.fillStyle = "#15110d";
  ctx.fillRect(0, 0, W, H);
  // tremida da tela
  if (sim.shake > 0.2) ctx.translate(Math.round((Math.random() - 0.5) * sim.shake * 2), Math.round((Math.random() - 0.5) * sim.shake * 2));
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(terrainImage(sim.field), 0, 0, W, H);
  // sangue no chão
  if (sim.floor && gore) ctx.drawImage(sim.floor, 0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  const lanesT = FIELD_LANES[sim.field];
  drawWalls(ctx, sim.field, sim.breach.map((b) => b && t > T_FIGHT + 0.2), sim.houses.defender.color);
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
  const order = [...sim.men].sort((a, b) => Number(b.dead) - Number(a.dead) || (a.kind == "dragon" ? 1 : 0) - (b.kind == "dragon" ? 1 : 0) || a.y - b.y);
  ctx.save();
  ctx.globalAlpha = appear;
  for (const m of order) {
    if (m.dead) drawFallen(ctx, m.x, m.y, FIG, pose(m, sim.houses[m.side], t), t - m.deadAt);
    else drawUnit(ctx, m.x, m.y, FIG, pose(m, sim.houses[m.side], t), m.dir);
  }
  ctx.restore();
  // poeira (quadradinhos, no estilo pixel)
  for (const d of sim.dust) {
    const p = (t - d.t0) / d.life;
    const rr = Math.round(d.r * (1 + p * 1.5));
    ctx.fillStyle = `rgba(196,176,136,${0.38 * (1 - p)})`;
    ctx.fillRect(Math.round(d.x - rr), Math.round(d.y - rr * 0.7 - 2), rr * 2, Math.max(2, Math.round(rr * 1.4)));
  }
  // marca do corte
  for (const sl of sim.slashes) {
    const p = (t - sl.t0) / 0.16;
    const R = sl.big ? 16 : 11;
    ctx.save();
    ctx.translate(sl.x, sl.y);
    ctx.scale(sl.d, 1);
    ctx.strokeStyle = `rgba(255,255,255,${0.95 * (1 - p)})`;
    ctx.lineWidth = sl.big ? 3.5 : 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(-4, 0, R, -1.2 + p * 0.6, 0.9 + p * 0.6);
    ctx.stroke();
    ctx.restore();
  }
  // gotas voando
  if (gore) {
    for (const d of sim.drops) {
      ctx.fillStyle = d.dark ? "#5e0a08" : "#c01a10";
      const sz = d.size + 1;
      ctx.fillRect(Math.round(d.x), Math.round(d.y - d.z), sz, sz);
    }
  }
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
  drawLaneHud(ctx, sim);
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
