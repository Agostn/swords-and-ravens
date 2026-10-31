/**
 * Protótipo jogável do combate tático ("Mesa de Batalha").
 * Usa a MESMA conta do jogo (src/common/tactical-battle) e o mesmo "computador" do teste de equilíbrio.
 * Gerar a página: node tools/tactical/prototipo/build.js
 */
import { boardStrength, hasFormation, tacticBonus, resolveTacticalBattle, Squad, Lane, Side, TacticalBattleResult, LaneFactor } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import { ATTACK_TACTICS, DEFENSE_TACTICS, TACTIC_BEATS, TACTIC_NAMES, TACTIC_WIN_BONUS, Tactic, BASE_VALUE, FAR_FLANK_SHARE, FIELD_LANES, FieldType, ROW_FACTOR, Role, Row, SUPPORT_FACTOR, SquadKind, TERRAIN, UNOPPOSED_FLANK_SHARE, rolesFor } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { bestReply, computerStrategy, Piece, Scenario, rng } from "../solver";
import {
  EMPTY_SIDE,
  FIELD_EXAMPLE,
  FIELD_NAMES,
  HOUSES,
  House,
  KIND_NAMES,
  PRESETS,
  Preset,
  ROLE_NAMES,
  ROLE_PLURAL,
  SideConfig,
  TERRAIN_HINT,
  TERRAIN_NAMES
} from "./data";
import { H, PlacedToken, W, drawPlacement, slots } from "./render";
import { REACH_LABEL, Sim, T_END, createSim, drawSim, laneReasons, setGore, stepSim } from "./battle";
import { SLIDES, drawSlide } from "./tutorial";
import { drawSquad, drawUnit, kindOf } from "./figures";
import { loadAssets } from "./assets";

// ---------------------------------------------------------------- estado
interface Config {
  presetId: string | null;
  field: FieldType;
  mode: "cpu" | "local";
  humanSide: Side;
  attacker: SideConfig;
  defender: SideConfig;
}

interface Unit {
  id: string;
  kind: SquadKind;
  strength?: number;
  support?: boolean;
  role: Role;
  lane: Lane | null;
  row: Row;
  locked?: boolean;
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

function fromPreset(p: Preset, mode: Config["mode"], humanSide: Side): Config {
  return {
    presetId: p.id,
    field: p.field,
    mode,
    humanSide,
    attacker: { ...clone(EMPTY_SIDE), ...clone(p.attacker) } as SideConfig,
    defender: { ...clone(EMPTY_SIDE), ...clone(p.defender) } as SideConfig
  };
}

let config: Config = fromPreset(PRESETS[0], "cpu", "attacker");
let units: Record<Side, Unit[]> = { attacker: [], defender: [] };
let placingSide: Side = "attacker";
let selected: string | null = null;
let hoverSlot: { lane: Lane; row: Row } | null = null;
let dragging: { id: string; ghost: HTMLElement; startX: number; startY: number; moved: boolean; fromCanvas: boolean } | null = null;
let placedHit: PlacedToken[] = [];
let timer: number | null = null;
let timeLeft = 75;
let phase: "place" | "react" | "battle" | "result" = "place";
/** Reação: quem está reagindo agora, como cada lado estava antes, e o que cada um mudou. */
let reactSide: Side = "defender";
let reactBase: Record<Side, Unit[]> | null = null;
let reactNote: Record<Side, string> = { attacker: "", defender: "" };
let reactChanged: Record<Side, string | null> = { attacker: null, defender: null };
let reactWarn = "";
let sim: Sim | null = null;
let simSeed = 1;
let lastResult: TacticalBattleResult | null = null;
let lastBoard: BoardBattle | null = null;
/** ordem de batalha de cada lado (escolhida quando aperta Pronto) */
let tactics: Record<Side, Tactic | null> = { attacker: null, defender: null };
let tacticChosen: Record<Side, boolean> = { attacker: false, defender: false };
let speed = 1;
let goreOn = true;
let raf: number | null = null;
let lastFrame = 0;
const t0 = performance.now();

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const isSea = (): boolean => config.field == "mar";
const other = (s: Side): Side => (s == "attacker" ? "defender" : "attacker");
const houseOf = (s: Side): House => HOUSES[config[s].house];
const LANE_NAMES = ["Esquerda", "Centro", "Direita"];

function store(key: string, v?: string): string | null {
  try {
    if (v != null) localStorage.setItem(key, v);
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- peças
function buildUnits(side: Side): Unit[] {
  const c = config[side];
  const out: Unit[] = [];
  let n = 0;
  const add = (kind: SquadKind, extra: Partial<Unit> = {}): void => {
    out.push({ id: `${side[0]}${n++}`, kind, role: rolesFor(kind, isSea())[0], lane: null, row: "frente", ...extra });
  };
  if (isSea()) {
    for (let i = 0; i < c.ships; i++) add("ship");
  } else {
    for (let i = 0; i < c.footmen; i++) add("footman");
    for (let i = 0; i < c.knights; i++) add("knight");
    const siegeCounts = side == "attacker" && (config.field == "castelo" || config.field == "fortaleza");
    if (siegeCounts) for (let i = 0; i < c.siege; i++) add("siege-engine", { row: "tras" });
    if (c.dragon > 0) add("dragon", { strength: c.dragon });
    for (let i = 0; i < c.supportFootmen; i++) add("footman", { support: true });
    for (let i = 0; i < c.supportShips; i++) add("ship", { support: true, row: "tras" });
    if (side == "defender" && c.garrison > 0) add("garrison", { strength: c.garrison, lane: 1, row: "tras", locked: true });
  }
  return out;
}

function piecesOf(side: Side): Piece[] {
  return buildUnits(side).map((u) =>
    u.kind == "garrison"
      ? { kind: u.kind, strength: u.strength, fixed: { lane: 1 as Lane, row: "tras" as Row, role: "torre" as Role } }
      : { kind: u.kind, strength: u.strength, support: u.support }
  );
}

function scenario(): Scenario {
  return {
    name: "protótipo",
    field: config.field,
    attacker: piecesOf("attacker"),
    defender: piecesOf("defender"),
    attackerCard: config.attacker.card,
    defenderCard: config.defender.card,
    attackerOrder: config.attacker.order,
    defenderOrder: config.defender.order
  };
}

function toSquads(list: Unit[]): Squad[] {
  return list
    .filter((u) => u.lane != null)
    .map((u) => ({ id: u.id, kind: u.kind, role: u.role, lane: u.lane as Lane, row: u.row, strength: u.strength, support: u.support }));
}

// ----- o computador pensa em segundo plano (Web Worker); sem worker, pensa aqui mesmo
let worker: Worker | null = null;
let reqId = 0;
const waiting = new Map<number, (s: Squad[]) => void>();
function getWorker(): Worker | null {
  if (worker) return worker;
  try {
    const src = (window as unknown as { __WORKER_SRC__?: string }).__WORKER_SRC__;
    if (!src) return null;
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
    worker.onmessage = (e: MessageEvent): void => {
      const { id, strategy } = e.data as { id: number; strategy: Squad[] };
      waiting.get(id)?.(strategy);
      waiting.delete(id);
    };
    return worker;
  } catch {
    return null;
  }
}

function thinkAsync(side: Side): Promise<Squad[]> {
  const sc = scenario();
  const seed = Math.floor(Math.random() * 1e9);
  const w = getWorker();
  if (!w) return Promise.resolve(computerStrategy(sc, side, seed));
  return new Promise((resolve) => {
    const id = ++reqId;
    waiting.set(id, resolve);
    w.postMessage({ sc, side, seed, id });
  });
}

let enemyPlan: Promise<Squad[]> | null = null;

function applyStrategy(side: Side, strat: Squad[]): void {
  const pool = [...strat];
  units[side].forEach((u) => {
    const i = pool.findIndex((s) => s.kind == u.kind && !!s.support == !!u.support && (s.strength ?? 0) == (u.strength ?? 0));
    const pick = i >= 0 ? pool.splice(i, 1)[0] : pool.splice(0, 1)[0];
    if (pick) {
      u.lane = pick.lane;
      u.row = pick.row;
      u.role = pick.role;
    }
  });
}

// ---------------------------------------------------------------- ícones SVG (iguais às fichas do campo)
const GLYPH: Record<Role, string> = {
  lanceiro: `<path d="M6.5 17.5 L16.5 7.5" class="g"/><path d="M18.5 5.5 L13 6.8 L17.2 11 Z" class="gf"/>`,
  escudeiro: `<path d="M12 4.5 L18.5 6.8 V12 C18.5 15.8 15.3 18.4 12 20 C8.7 18.4 5.5 15.8 5.5 12 V6.8 Z M12 7 V17" class="g"/>`,
  arqueiro: `<path d="M8 4.5 C16 7.5 16 16.5 8 19.5 M8 4.5 V19.5 M5 12 H18 M15.5 9.5 L18 12 L15.5 14.5" class="g"/>`,
  flechas: `<path d="M8 4.5 C16 7.5 16 16.5 8 19.5 M8 4.5 V19.5 M5 12 H18 M15.5 9.5 L18 12 L15.5 14.5" class="g"/>`,
  cavalaria: `<path d="M5.5 17 L12 6 L18.5 17 M8.8 12.8 H15.2" class="g"/>`,
  batedores: `<path d="M5 9 H13 M10 6 L13 9 L10 12 M9 15 H18 M15 12 L18 15 L15 18" class="g"/>`,
  catapulta: `<path d="M5.5 17.5 H18.5 M8.5 17.5 L12 11 L15.5 17.5 M12 11 L17.5 5.5" class="g"/><circle cx="17.5" cy="5.5" r="1.8" class="gf"/>`,
  dragao: `<path d="M3.5 14 L12 6.5 L20.5 14 L15 12 L12 18 L9 12 Z" class="gf"/>`,
  torre: `<path d="M7 18.5 V8 H9 V5.5 H11 V8 H13 V5.5 H15 V8 H17 V18.5 Z" class="g"/>`,
  ariete: `<path d="M4.5 14 H15 L19.5 12 L15 10 H4.5" class="g"/>`,
  abordagem: `<path d="M6.5 17.5 L17.5 6.5 M6.5 6.5 L17.5 17.5" class="g"/>`
};

function tokenSvg(h: House, role: Role, size = 30): string {
  return `<svg class="tok" width="${size}" height="${size}" viewBox="0 0 28 28" aria-hidden="true" style="--ink:${h.ink}">
    <circle cx="14" cy="15.4" r="12" fill="${h.dark}"/>
    <circle cx="14" cy="14" r="12" fill="${h.color}" stroke="rgba(0,0,0,.5)" stroke-width="1"/>
    <circle cx="14" cy="14" r="9.6" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1"/>
    <g transform="translate(4.6 4.6) scale(.78)">${GLYPH[role]}</g>
  </svg>`;
}

// desenhos dos bonequinhos para os botões (feitos uma vez no canvas e guardados)
const imgCache = new Map<string, string>();
function canvasImg(key: string, w: number, hgt: number, draw: (ctx: CanvasRenderingContext2D) => void): string {
  const hit = imgCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w * 2;
  c.height = hgt * 2;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.scale(2, 2);
  draw(ctx);
  const url = c.toDataURL("image/png");
  imgCache.set(key, url);
  return url;
}

/** A peça como ela aparece no campo: 4 bonequinhos (ou a máquina, o dragão, a torre, o navio). */
function squadSvg(h: House, u: { kind: SquadKind; role: Role }): string {
  const k = kindOf(u.kind);
  const url = canvasImg(`sq|${h.name}|${u.kind}|${u.role}`, 72, 58, (ctx) => {
    if (k == "dragon" || k == "ship") drawUnit(ctx, 36, 27, k == "dragon" ? 0.95 : 1, { role: u.role, kind: k, house: h, back: false, flip: false, walk: 0, atk: 0 });
    else drawSquad(ctx, 36, 47, u.kind, u.role, h, { scale: 0.92, back: false });
  });
  return `<img class="squad-figs" src="${url}" width="72" height="58" alt="">`;
}

/** Um bonequinho de frente (cartões de função). Navio usa o símbolo, porque o navio é igual para todas. */
function roleIcon(h: House, kind: SquadKind, r: Role): string {
  const k = kindOf(kind);
  if (k != "foot" && k != "horse") return tokenSvg(h, r, 34);
  const url = canvasImg(`ro|${h.name}|${kind}|${r}`, 54, 50, (ctx) => drawUnit(ctx, 27, 46, k == "horse" ? 1.15 : 1.3, { role: r, kind: k, house: h, back: false, flip: false, walk: 0, atk: 0, seed: 1 }));
  return `<img class="role-fig" src="${url}" width="54" height="50" alt="">`;
}

// ---------------------------------------------------------------- telas
function show(id: "home" | "custom" | "play"): void {
  ["home", "custom", "play"].forEach((x) => ($(x).hidden = x != id));
  document.body.dataset.screen = id;
  window.scrollTo({ top: 0 });
}

function setPhase(p: "place" | "react" | "battle" | "result"): void {
  $("play").dataset.phase = p;
  document.body.dataset.phase = p;
}

function goHome(): void {
  stopTimer();
  if (raf != null) cancelAnimationFrame(raf);
  raf = null;
  renderHome();
  show("home");
}

/**
 * Quanto a peça rende numa casinha, só pelo lugar (terreno + frente/trás), sem contar o inimigo.
 * É o que aparece nas casinhas quando a peça está escolhida.
 */
function slotBonus(u: Unit, lane: Lane, row: Row, side: Side): { pct: number; why: string[] } {
  const terrain = FIELD_LANES[config.field][lane];
  const rules = TERRAIN[terrain];
  const why: string[] = [];
  let f = 1;
  const rf = ROW_FACTOR[u.role][row];
  if (rf != 1) why.push(`${row == "frente" ? "na frente" : "atrás"} ${rf > 1 ? "+" : "−"}${Math.round(Math.abs(rf - 1) * 100)}%`);
  f *= rf;
  const tf = rules.role?.[u.role] ?? 1;
  if (tf != 1) why.push(`${TERRAIN_NAMES[terrain].toLowerCase()} ${tf > 1 ? "+" : "−"}${Math.round(Math.abs(tf - 1) * 100)}%`);
  f *= tf;
  const sf = side == "attacker" ? rules.attacker ?? 1 : rules.defender ?? 1;
  if (sf != 1) why.push(`${side == "attacker" ? "quem ataca" : "quem defende"} ${sf > 1 ? "+" : "−"}${Math.round(Math.abs(sf - 1) * 100)}%`);
  f *= sf;
  if (u.role == "catapulta" && !rules.wall) {
    why.push("sem muralha −50%");
    f *= 0.5;
  }
  return { pct: Math.round((f - 1) * 100), why };
}

/** Força de uma peça sem lugar (soldado 3, cavaleiro 6, apoio 80%, cerco só contra castelo). */
function baseValue(u: Unit, side: Side): number {
  const sq: Squad = { id: u.id, kind: u.kind, role: u.role, lane: 1, row: u.row, strength: u.strength, support: u.support };
  return BASE_VALUE[u.kind] * boardStrength(sq, side, config.field) * (u.support ? SUPPORT_FACTOR : 1);
}

/** Força da peça numa casinha: força dela × terreno × frente/trás × atacar/defender. */
function forceAt(u: Unit, lane: Lane, row: Row, side: Side): number {
  return baseValue(u, side) * (1 + slotBonus(u, lane, row, side).pct / 100);
}


function previewFor(u: Unit | null): { lane: Lane; row: Row; pct: number; best: boolean; force: number; base: number }[] | null {
  if (!u || u.locked) return null;
  const base = baseValue(u, placingSide);
  const list = slots(config.field).map((s) => ({ lane: s.lane, row: s.row, pct: slotBonus(u, s.lane, s.row, placingSide).pct, best: false, force: forceAt(u, s.lane, s.row, placingSide), base }));
  const max = Math.max(...list.map((x) => x.pct));
  list.forEach((x) => (x.best = x.pct == max && max > -100));
  return list;
}

/**
 * "Se a luta for aqui": a sua força em cada faixa, se o inimigo vier todo para ela.
 * Conta quem está na faixa (100%) e a ajuda de quem está longe: vizinha 30%, outra ponta 15%.
 */
function laneForces(side: Side): { total: number; here: number; help: number }[] {
  const share = [1, UNOPPOSED_FLANK_SHARE, FAR_FLANK_SHARE];
  return ([0, 1, 2] as Lane[]).map((L) => {
    let here = 0;
    let help = 0;
    for (const u of units[side]) {
      if (u.lane == null) continue;
      const f = forceAt(u, u.lane, u.row, side) * share[Math.abs(u.lane - L)];
      if (u.lane == L) here += f;
      else help += f;
    }
    return { total: here + help, here, help };
  });
}

const totalForce = (side: Side): number => units[side].reduce((a, u) => a + baseValue(u, side), 0);


const listPt = (xs: Role[]): string => xs.map((x) => ROLE_NAMES[x].toLowerCase()).join(xs.length > 1 ? " e " : "");

function renderHome(): void {
  const card = (p: Preset): string => {
    const a = HOUSES[p.attacker.house];
    const d = HOUSES[p.defender.house];
    const lanes = FIELD_LANES[p.field].map((t) => `<span class="mini-lane t-${t}" title="${TERRAIN_NAMES[t]}"></span>`).join("");
    return `<button type="button" class="battle-card" data-preset="${p.id}">
      <span class="bc-field">${lanes}</span>
      ${p.tag ? `<span class="bc-tag">${p.tag}</span>` : ""}
      <span class="bc-name">${p.name}</span>
      <span class="bc-place">${FIELD_NAMES[p.field]} · ${p.place}</span>
      <span class="bc-story">${p.story}</span>
      <span class="bc-vs"><span class="dot" style="background:${a.color}"></span>${a.name} ataca <span class="vs">×</span> <span class="dot" style="background:${d.color}"></span>${d.name} defende</span>
    </button>`;
  };
  $("battle-grid").innerHTML =
    PRESETS.map(card).join("") +
    `<button type="button" class="battle-card custom-card" data-preset="custom">
      <span class="bc-plus" aria-hidden="true">+</span>
      <span class="bc-name">Monte sua batalha</span>
      <span class="bc-story">Escolha o campo, as Casas, as peças, as cartas e as ordens.</span>
    </button>`;
  document.querySelectorAll<HTMLButtonElement>("#mode-seg [data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode == config.mode));
  document.querySelectorAll<HTMLButtonElement>("#side-seg [data-human]").forEach((b) => b.classList.toggle("on", b.dataset.human == config.humanSide));
  $("side-seg").hidden = config.mode != "cpu";
  $("battle-grid")
    .querySelectorAll<HTMLButtonElement>("[data-preset]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        if (b.dataset.preset == "custom") {
          renderCustom();
          show("custom");
          return;
        }
        const p = PRESETS.find((x) => x.id == b.dataset.preset) as Preset;
        config = fromPreset(p, config.mode, config.humanSide);
        startPlacement();
      })
    );
}

// ----- monte sua batalha
const LIMITS: Record<string, [number, number]> = {
  footmen: [0, 6],
  knights: [0, 4],
  siege: [0, 2],
  ships: [0, 5],
  dragon: [0, 5],
  supportFootmen: [0, 3],
  supportShips: [0, 2],
  garrison: [0, 4],
  "card.strength": [0, 4],
  "card.swords": [0, 3],
  "card.towers": [0, 3],
  raven: [0, 1],
  blade: [0, 1]
};

function getV(side: Side, key: string): number {
  if (key.startsWith("card.")) return (config[side].card as unknown as Record<string, number>)[key.slice(5)] ?? 0;
  return (config[side] as unknown as Record<string, number>)[key] ?? 0;
}

function setV(side: Side, key: string, v: number): void {
  if (key.startsWith("card.")) (config[side].card as unknown as Record<string, number>)[key.slice(5)] = v;
  else (config[side] as unknown as Record<string, number>)[key] = v;
  // só um jogador tem o Corvo Mensageiro
  if (key == "raven" && v == 1) config[other(side)].raven = 0;
  // e só um tem a Lâmina de Aço Valiriano (sem ninguém marcado, fica com quem defende)
  if (key == "blade" && v == 1) config[other(side)].blade = 0;
}

function renderCustom(): void {
  const fields = (Object.keys(FIELD_NAMES) as FieldType[])
    .map(
      (f) => `<button type="button" class="field-chip${config.field == f ? " on" : ""}" data-field="${f}">
        <span class="bc-field">${FIELD_LANES[f].map((t) => `<span class="mini-lane t-${t}"></span>`).join("")}</span>
        <b>${FIELD_NAMES[f]}</b><small>${FIELD_EXAMPLE[f]}</small></button>`
    )
    .join("");
  const step = (side: Side, key: string, label: string, icon: string, hint = ""): string => {
    const [lo, hi] = key == "order" ? (side == "attacker" ? [-1, 1] : [0, 2]) : LIMITS[key];
    const v = getV(side, key);
    return `<div class="stepper">
      <span class="st-icon" aria-hidden="true">${icon}</span>
      <span class="st-label">${label}${hint ? `<small>${hint}</small>` : ""}</span>
      <span class="st-ctl">
        <button type="button" class="st-btn" data-side="${side}" data-key="${key}" data-d="-1" ${v <= lo ? "disabled" : ""} aria-label="menos">−</button>
        <output>${key == "order" && v > 0 ? "+" + v : v}</output>
        <button type="button" class="st-btn" data-side="${side}" data-key="${key}" data-d="1" ${v >= hi ? "disabled" : ""} aria-label="mais">+</button>
      </span>
    </div>`;
  };
  const army = (side: Side): string => {
    const c = config[side];
    const h = HOUSES[c.house];
    const houses = Object.entries(HOUSES)
      .map(([id, x]) => `<button type="button" class="house-pick${id == c.house ? " on" : ""}" data-side="${side}" data-house="${id}" title="${x.name}" aria-label="${x.name}" style="background:${x.color}"></button>`)
      .join("");
    const sea = isSea();
    return `<section class="army">
      <h3><span class="dot" style="background:${h.color}"></span>${h.name} <small>${side == "attacker" ? "ataca" : "defende"}</small></h3>
      <div class="houses">${houses}</div>
      <div class="steps-list">
        ${sea ? step(side, "ships", "Navios", tokenSvg(h, "abordagem", 26)) : step(side, "footmen", "Soldados", tokenSvg(h, "lanceiro", 26))}
        ${sea ? "" : step(side, "knights", "Cavaleiros", tokenSvg(h, "cavalaria", 26))}
        ${!sea && side == "attacker" ? step(side, "siege", "Máquinas de cerco", tokenSvg(h, "catapulta", 26), "só lutam contra castelo e fortaleza") : ""}
        ${!sea ? step(side, "dragon", "Dragão: força", tokenSvg(h, "dragao", 26), "0 = sem dragão") : ""}
        ${!sea && side == "defender" ? step(side, "garrison", "Guarnição", tokenSvg(h, "torre", 26)) : ""}
      </div>
      <details class="more">
        <summary>Apoio, carta e ordem</summary>
        <div class="steps-list">
          ${!sea ? step(side, "supportFootmen", "Soldados de apoio", tokenSvg(h, "escudeiro", 26), "vêm de áreas vizinhas") : ""}
          ${!sea ? step(side, "supportShips", "Navios de apoio", tokenSvg(h, "flechas", 26), "atiram do litoral") : ""}
          ${step(side, "card.strength", "Carta de Casa: força", "<b class='ico'>4</b>")}
          ${step(side, "card.swords", "Carta: espadas", "<b class='ico'>⚔</b>")}
          ${step(side, "card.towers", "Carta: torres", "<b class='ico'>▲</b>")}
          ${step(side, "order", side == "attacker" ? "Ordem de Marcha" : "Ordem de Defesa", "<b class='ico'>★</b>")}
          ${step(side, "raven", "Corvo Mensageiro", "<b class='ico'>✉</b>", "1 = tem: depois de ver o outro exército, muda 1 esquadrão")}
          ${step(side, "blade", "Lâmina de Aço Valiriano", "<b class='ico'>🗡</b>", "1 = tem (mais alto nos Feudos): vence o duelo de campeões no empate. Sem ninguém marcado, fica com quem defende")}
        </div>
      </details>
    </section>`;
  };
  $("custom-body").innerHTML = `
    <h2>Campo da batalha</h2>
    <div class="field-grid">${fields}</div>
    <h2>Exércitos</h2>
    <div class="armies">${army("attacker")}${army("defender")}</div>`;
  $("custom-body")
    .querySelectorAll<HTMLButtonElement>("[data-field]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        config.field = b.dataset.field as FieldType;
        if (config.field == "mar") {
          config.attacker.ships ||= 2;
          config.defender.ships ||= 2;
        }
        renderCustom();
      })
    );
  $("custom-body")
    .querySelectorAll<HTMLButtonElement>("[data-house]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        config[b.dataset.side as Side].house = b.dataset.house as string;
        renderCustom();
      })
    );
  $("custom-body")
    .querySelectorAll<HTMLButtonElement>(".st-btn")
    .forEach((b) =>
      b.addEventListener("click", () => {
        const side = b.dataset.side as Side;
        const key = b.dataset.key as string;
        setV(side, key, getV(side, key) + Number(b.dataset.d));
        const openMore = [...document.querySelectorAll<HTMLDetailsElement>(".more")].map((d) => d.open);
        renderCustom();
        document.querySelectorAll<HTMLDetailsElement>(".more").forEach((d, i) => (d.open = openMore[i]));
      })
    );
}

// ---------------------------------------------------------------- posicionamento
function startPlacement(): void {
  stopTimer();
  units = { attacker: buildUnits("attacker"), defender: buildUnits("defender") };
  config.presetId = config.presetId ?? null;
  show("play");
  if (units.attacker.length == 0 || units.defender.length == 0) {
    $("panel").innerHTML = `<p class="warn">Os dois lados precisam de pelo menos uma peça. <button type="button" class="btn" id="back-custom">Voltar</button></p>`;
    $("back-custom").addEventListener("click", () => {
      renderCustom();
      show("custom");
    });
    return;
  }
  placingSide = config.mode == "cpu" ? config.humanSide : "attacker";
  phase = "place";
  tactics = { attacker: null, defender: null };
  tacticChosen = { attacker: false, defender: false };
  beginTurn();
  if (!store("tactical-tutorial-seen")) openTutorial(0);
}

function beginTurn(): void {
  if (config.mode == "cpu") enemyPlan = thinkAsync(other(placingSide));
  selected = units[placingSide].find((u) => u.lane == null && !u.locked)?.id ?? null;
  hoverSlot = null;
  renderPanel();
  renderLaneInfo();
  startTimer();
  startLoop();
}

let timeMax = 75;
function startTimer(secs = 75): void {
  stopTimer();
  timeMax = secs;
  timeLeft = secs;
  timer = window.setInterval(() => {
    timeLeft--;
    const el = document.getElementById("timer");
    if (el) {
      el.textContent = `${timeLeft}s`;
      el.style.setProperty("--p", `${(timeLeft / timeMax) * 100}%`);
      el.classList.toggle("low", timeLeft <= 10);
    }
    if (timeLeft <= 0) {
      if (phase == "react") finishReaction();
      else finishTurn();
    }
  }, 1000);
}

function stopTimer(): void {
  if (timer != null) window.clearInterval(timer);
  timer = null;
}

function placeUnit(id: string, lane: Lane, row: Row): void {
  const u = units[placingSide].find((x) => x.id == id);
  if (!u || u.locked) return;
  u.lane = lane;
  u.row = row;
  if (phase == "react") {
    enforceOne(id);
    renderPanel();
    return;
  }
  // próximo da reserva fica selecionado, para ir tocando direto no campo
  const next = units[placingSide].find((x) => x.lane == null && !x.locked);
  selected = next ? next.id : null;
  renderPanel();
}

function stepNow(): number {
  const mine = units[placingSide];
  if (mine.every((u) => u.lane != null)) return 3;
  return selected ? 2 : 1;
}

/** Em palavras: quanto a peça rende no lugar (sem números para não confundir com a força do tabuleiro). */
function qualityWord(pct: number): string {
  return pct >= 15 ? "rende muito bem" : pct > 0 ? "rende bem" : pct == 0 ? "normal" : pct <= -30 ? "rende muito mal" : "rende mal";
}

/** Dica da formação: corpo a corpo na frente + atirador atrás, na mesma faixa = +15%. */
function formationTip(u: Unit): string {
  const shooter = u.role == "arqueiro" || u.role == "flechas" || u.role == "catapulta";
  const melee = !shooter && u.kind != "dragon" && u.kind != "garrison";
  if (!shooter && !melee) return "";
  const lane = u.lane;
  const on = lane != null && hasFormation(toSquads(units[placingSide]).filter((q) => q.lane == lane));
  if (on) return ` · <b class="ok">formação +15%</b>`;
  return shooter ? " · atrás de um corpo a corpo: +15%" : " · na frente de arqueiros: +15%";
}

/** Mini-ícones "vence" / "teme" de uma função. */
const BEATS: Partial<Record<Role, { vence: Role[]; teme: Role[] }>> = {
  lanceiro: { vence: ["cavalaria", "escudeiro"], teme: ["arqueiro", "batedores"] },
  escudeiro: { vence: ["arqueiro", "batedores"], teme: ["lanceiro", "cavalaria"] },
  arqueiro: { vence: ["lanceiro"], teme: ["escudeiro", "cavalaria"] },
  cavalaria: { vence: ["arqueiro", "escudeiro"], teme: ["lanceiro"] },
  batedores: { vence: ["lanceiro"], teme: ["escudeiro"] },
  abordagem: { vence: ["ariete"], teme: ["flechas"] },
  ariete: { vence: ["flechas"], teme: ["abordagem"] },
  flechas: { vence: ["abordagem"], teme: ["ariete"] }
};

function renderPanel(): void {
  if (phase != "place" && phase != "react") return;
  const reacting = phase == "react";
  setPhase(phase);
  const h = houseOf(placingSide);
  const mine = units[placingSide];
  const placed = mine.filter((u) => u.lane != null).length;
  const st = stepNow();
  const sel = mine.find((u) => u.id == selected) ?? null;
  const chip = (u: Unit, i: number): string => {
    const where = u.lane == null ? "reserva" : `${LANE_NAMES[u.lane].toLowerCase()} · ${u.row == "frente" ? "frente" : "trás"}`;
    return `<button type="button" class="piece${selected == u.id ? " sel" : ""}${u.lane == null ? " in-reserve" : " on-field"}" data-grab="${u.id}" aria-pressed="${selected == u.id}" aria-label="${KIND_NAMES[u.kind]} ${ROLE_NAMES[u.role]}, ${where}">
      <span class="piece-num">${i + 1}</span>
      ${squadSvg(h, u)}
      <span class="piece-name">${ROLE_NAMES[u.role]}</span>
      <span class="piece-where">${u.lane == null ? "na reserva" : where}</span>
      ${reacting && changedId() == u.id ? `<span class="piece-chg">mudou</span>` : !reacting && u.lane != null ? `<span class="piece-ok" aria-hidden="true">✓</span>` : ""}
    </button>`;
  };
  const roles = sel ? rolesFor(sel.kind, isSea()) : [];
  const bt = sel ? BEATS[sel.role] : undefined;
  const here = sel && sel.lane != null ? slotBonus(sel, sel.lane, sel.row, placingSide) : null;
  const say = sel
    ? `<p class="role-say">${bt ? `<span class="ok">✓ vence ${listPt(bt.vence)}</span> <span class="no">✗ perde p/ ${listPt(bt.teme)}</span>` : `<b>${ROLE_NAMES[sel.role]}</b>`}<br><span class="rng">${REACH_LABEL[sel.role]}</span>${formationTip(sel)} · ${
        here ? `<span class="here">aqui: ${qualityWord(here.pct)}${here.why.length ? ` (${here.why.join(", ")})` : ""}</span>` : `<span class="here">verde = onde rende mais</span>`
      }</p>`
    : "";
  const editor = sel
    ? `<div class="editor">
        <div class="editor-head">
          ${squadSvg(h, sel)}
          <div class="editor-title"><b>${KIND_NAMES[sel.kind]}${sel.support ? " de apoio" : ""}${sel.strength && (sel.kind == "dragon" || sel.kind == "garrison") ? ` · força ${sel.strength}` : ""}</b>
          <small>${sel.locked ? "fica sempre atrás, no centro" : sel.lane == null ? "Toque numa casinha do campo para colocar." : reacting ? "Mude a função aqui ou toque noutra casinha." : "Toque noutra casinha para mudar de lugar."}</small></div>
        </div>
        <div class="role-row">
          ${
            roles.length > 1
              ? roles
                  .map(
                    (r) => `<button type="button" class="role-card${sel.role == r ? " on" : ""}" data-role="${r}" aria-pressed="${sel.role == r}">
                    ${roleIcon(h, sel.kind, r)}
                    <b>${ROLE_NAMES[r]}</b>
                  </button>`
                  )
                  .join("")
              : ""
          }
          ${sel.lane != null && !sel.locked && !reacting ? `<button type="button" class="role-card back-card" data-back="${sel.id}"><span class="back-ico" aria-hidden="true">↩</span><b>Tirar</b></button>` : ""}
        </div>
        ${say}
      </div>`
    : `<div class="editor empty"><p>${reacting ? "Toque no esquadrão que você quer mudar (só 1)." : "Toque numa peça para escolher a função e ver onde ela rende mais."}</p></div>`;
  // guarda a rolagem da faixa de peças (senão ela volta para o começo a cada toque)
  const oldTray = document.querySelector<HTMLElement>("#panel .tray-wrap");
  const keepScroll = oldTray ? oldTray.scrollLeft : 0;
  $("panel").innerHTML = `
    <div class="turn-head">
      <button type="button" class="quit-btn" id="quit" aria-label="Sair para o início">‹</button>
      <h2><span class="dot" style="background:${h.color}"></span>${h.name} <small>${reacting ? "Corvo" : placingSide == "attacker" ? "ataca" : "defende"}</small></h2>
      <div class="turn-tools">
        <span id="timer" class="timer" style="--p:${(timeLeft / timeMax) * 100}%">${timeLeft}s</span>
        <button type="button" class="help-btn" id="help-play" aria-label="Como funciona o combate">?</button>
      </div>
    </div>
    ${
      reacting
        ? reactInfoHtml()
        : `<ol class="steps">
      <li class="${st == 1 ? "now" : st > 1 ? "done" : ""}"><b>1</b>Toque numa peça</li>
      <li class="${st == 2 ? "now" : st > 2 ? "done" : ""}"><b>2</b>Toque numa casinha</li>
      <li class="${st == 3 ? "now" : ""}"><b>3</b>Pronto</li>
    </ol>`
    }
    ${editor}
    <div class="tray-wrap">
      <div class="tray-head"><b>Suas peças</b><span>${reacting ? (changedId() ? "1 mudança (o máximo)" : "nenhuma mudança") : `${placed} de ${mine.length} no campo`}</span></div>
      <div class="tray">${mine.map((u, i) => chip(u, i)).join("")}</div>
    </div>
    ${
      reacting
        ? `<div class="actions">
      <button type="button" class="btn" id="undo" ${changedId() ? "" : "disabled"}>Desfazer</button>
      <button type="button" class="btn primary" id="ready">${changedId() ? "Confirmar a troca" : "Manter como está"}</button>
    </div>`
        : `<div class="actions">
      <button type="button" class="btn" id="auto">Automático</button>
      <button type="button" class="btn primary" id="ready" ${placed == 0 ? "disabled" : ""}>${placed < mine.length ? `Pronto <small class="sub">${mine.length - placed} ${mine.length - placed == 1 ? "vai" : "vão"} p/ o centro</small>` : "Pronto"}</button>
    </div>`
    }`;

  const list = $("panel");
  const newTray = list.querySelector<HTMLElement>(".tray-wrap");
  if (newTray) newTray.scrollLeft = keepScroll;
  list.querySelectorAll<HTMLElement>("[data-grab]").forEach((el) => {
    el.addEventListener("pointerdown", (e) => startDrag(e, el.dataset.grab as string, false));
    el.addEventListener("click", (e) => {
      // teclado (Enter/Espaço) gera click sem pointerdown
      if ((e as MouseEvent).detail == 0) {
        selected = el.dataset.grab as string;
        renderPanel();
      }
    });
  });
  list.querySelectorAll<HTMLButtonElement>("[data-role]").forEach((b) =>
    b.addEventListener("click", () => {
      if (sel) {
        sel.role = b.dataset.role as Role;
        if (reacting) enforceOne(sel.id);
      }
      renderPanel();
    })
  );
  list.querySelectorAll<HTMLButtonElement>("[data-back]").forEach((b) =>
    b.addEventListener("click", () => {
      const u = mine.find((x) => x.id == b.dataset.back);
      if (u) u.lane = null;
      renderPanel();
    })
  );
  if (reacting) {
    $("undo").addEventListener("click", () => {
      if (!reactBase) return;
      units[placingSide] = clone(reactBase[placingSide]);
      reactWarn = "";
      renderPanel();
    });
    $("ready").addEventListener("click", finishReaction);
    $("help-play").addEventListener("click", () => openTutorial(SLIDES.length - 2));
    $("quit").addEventListener("click", goHome);
    return;
  }
  $("auto").addEventListener("click", () => {
    const btn = $<HTMLButtonElement>("auto");
    btn.disabled = true;
    btn.textContent = "Pensando…";
    const side = placingSide;
    void thinkAsync(side).then((strat) => {
      if (phase != "place" || placingSide != side) return;
      applyStrategy(side, strat);
      selected = null;
      renderPanel();
    });
  });
  $("ready").addEventListener("click", finishTurn);
  $("help-play").addEventListener("click", () => openTutorial(0));
  $("quit").addEventListener("click", goHome);
}

function renderLaneInfo(): void {
  $("lane-info").innerHTML = FIELD_LANES[config.field]
    .map((t, i) => `<li class="t-${t}"><b>${LANE_NAMES[i]} · ${TERRAIN_NAMES[t]}</b><span>${TERRAIN_HINT[t]}</span></li>`)
    .join("");
}

// ----- arrastar e soltar
function canvasPoint(clientX: number, clientY: number): [number, number] | null {
  const c = $<HTMLCanvasElement>("board");
  const r = c.getBoundingClientRect();
  if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
  return [((clientX - r.left) / r.width) * W, ((clientY - r.top) / r.height) * H];
}

function slotAt(p: [number, number] | null): { lane: Lane; row: Row } | null {
  if (!p) return null;
  const s = slots(config.field).find((x) => p[0] >= x.x && p[0] <= x.x + x.w && p[1] >= x.y - 10 && p[1] <= x.y + x.h + 10);
  if (s) return { lane: s.lane, row: s.row };
  // perto o bastante da área do jogador: casinha mais próxima
  if (p[1] > H * 0.5) {
    const lane = Math.min(2, Math.max(0, Math.floor(p[0] / (W / 3)))) as Lane;
    const row: Row = p[1] < H * 0.72 ? "frente" : "tras";
    if (slots(config.field).some((x) => x.lane == lane && x.row == row)) return { lane, row };
  }
  return null;
}

function startDrag(e: PointerEvent, id: string, fromCanvas: boolean): void {
  if (phase != "place" && phase != "react") return;
  const u = units[placingSide].find((x) => x.id == id);
  if (!u || u.locked) {
    selected = id;
    renderPanel();
    return;
  }
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.innerHTML = squadSvg(houseOf(placingSide), u);
  ghost.hidden = true;
  document.body.appendChild(ghost);
  dragging = { id, ghost, startX: e.clientX, startY: e.clientY, moved: false, fromCanvas };
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
}

function moveDrag(e: PointerEvent): void {
  if (!dragging) {
    if (phase == "place" || phase == "react") {
      const s = slotAt(canvasPoint(e.clientX, e.clientY));
      hoverSlot = selected ? s : null;
    }
    return;
  }
  if (!dragging.moved && Math.hypot(e.clientX - dragging.startX, e.clientY - dragging.startY) > 8) {
    dragging.moved = true;
    dragging.ghost.hidden = false;
    selected = dragging.id;
  }
  if (dragging.moved) {
    e.preventDefault();
    dragging.ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    hoverSlot = slotAt(canvasPoint(e.clientX, e.clientY));
  }
}

function endDrag(e: PointerEvent): void {
  if (!dragging) return;
  const d = dragging;
  dragging = null;
  d.ghost.remove();
  if (!d.moved) {
    // foi só um toque: seleciona
    selected = d.id;
    renderPanel();
    return;
  }
  const s = slotAt(canvasPoint(e.clientX, e.clientY));
  hoverSlot = null;
  if (s) placeUnit(d.id, s.lane, s.row);
  else if (d.fromCanvas && phase == "place") {
    const u = units[placingSide].find((x) => x.id == d.id);
    if (u && !u.locked) u.lane = null;
    selected = d.id;
    renderPanel();
  } else renderPanel();
}

function canvasDown(e: PointerEvent): void {
  if (phase != "place" && phase != "react") return;
  const p = canvasPoint(e.clientX, e.clientY);
  if (!p) return;
  const hit = placedHit.find((t) => p[0] >= t.x && p[0] <= t.x + t.w && p[1] >= t.y && p[1] <= t.y + t.h);
  if (hit) {
    startDrag(e, hit.id, true);
    return;
  }
  const s = slotAt(p);
  if (s && selected) placeUnit(selected, s.lane, s.row);
}

// ----- fim do turno
function finishTurn(): void {
  if (phase != "place") return;
  // antes de ficar pronto: escolher a ordem de batalha (se o tempo acabou, vai sem)
  if (!tacticChosen[placingSide] && timeLeft > 0) {
    openTacticPicker(placingSide);
    return;
  }
  stopTimer();
  units[placingSide]
    .filter((u) => u.lane == null)
    .forEach((u) => {
      u.lane = 1;
    });
  if (config.mode == "cpu") {
    const btn = document.getElementById("ready") as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Revelando a jogada do computador…";
    }
    const side = other(placingSide);
    void (enemyPlan ?? thinkAsync(side)).then((strat) => {
      applyStrategy(side, strat);
      tactics[side] = cpuTactic(side);
      startReaction();
    });
    return;
  }
  if (placingSide == "attacker") {
    placingSide = "defender";
    $("handoff").hidden = false;
    $("handoff-text").innerHTML = `Agora é a vez de <b>${houseOf("defender").name}</b> (defende). Passe o aparelho sem olhar o campo.`;
    return;
  }
  startReaction();
}

// ---------------------------------------------------------------- ordem de batalha
const tacticsOf = (side: Side): Tactic[] => (side == "attacker" ? ATTACK_TACTICS : DEFENSE_TACTICS);
const TACTIC_ICON: Record<Tactic, string> = { carga: "🐎", cercar: "⇆", flechas: "🏹", parede: "🛡", lancas: "🔱", reserva: "⛨" };
const TACTIC_NEED: Record<Tactic, string> = {
  carga: "precisa de cavalaria (+8% por esquadrão)",
  cercar: "precisa de lanceiros ou batedores e tropas em 2 faixas (+6% por esquadrão)",
  flechas: "precisa de arqueiros (+6% por esquadrão)",
  parede: "precisa de escudeiros (+6% por esquadrão)",
  lancas: "precisa de lanceiros (+6% por esquadrão)",
  reserva: "precisa de esquadrões na linha de trás (+5% por esquadrão)"
};
const ALL_TACTICS: Tactic[] = [...ATTACK_TACTICS, ...DEFENSE_TACTICS];
const beatenBy = (t: Tactic): Tactic => ALL_TACTICS.find((x) => TACTIC_BEATS[x] == t) as Tactic;

/** O computador escolhe como no Crusader Kings: sorteia entre as que pode usar, mais peso para a que rende mais. */
function cpuTactic(side: Side): Tactic | null {
  const sq = toSquads(units[side]);
  const opts = tacticsOf(side).map((t) => ({ t, w: tacticBonus(t, sq) })).filter((o) => o.w > 0);
  if (!opts.length) return null;
  const total = opts.reduce((a, o) => a + o.w, 0) + 0.04;
  let r = Math.random() * total;
  for (const o of opts) if ((r -= o.w) <= 0) return o.t;
  return null;
}

function openTacticPicker(side: Side): void {
  units[side].filter((u) => u.lane == null).forEach((u) => (u.lane = 1));
  const sq = toSquads(units[side]);
  const card = (t: Tactic | null): string => {
    if (!t) return `<button type="button" class="tac-card" data-tac="none"><b>✋ Nenhuma</b><span>sem bônus e sem risco</span></button>`;
    const b = tacticBonus(t, sq);
    return `<button type="button" class="tac-card${b > 0 ? "" : " off"}" data-tac="${t}" ${b > 0 ? "" : "disabled"}>
      <b>${TACTIC_ICON[t]} ${TACTIC_NAMES[t]} ${b > 0 ? `<em>+${Math.round(b * 100)}%</em>` : ""}</b>
      <span>${b > 0 ? `<i class="ok">bom contra ${TACTIC_NAMES[TACTIC_BEATS[t]]} (+${Math.round(TACTIC_WIN_BONUS * 100)}%)</i> · <i class="no">fraco contra ${TACTIC_NAMES[beatenBy(t)]}</i>` : TACTIC_NEED[t]}</span>
    </button>`;
  };
  $("tactic-box").innerHTML = `
    <h2>Ordem de ${side == "attacker" ? "ataque" : "defesa"}</h2>
    <p class="muted">O bônus vem das suas tropas. Se acertar a ordem que vence a dele, ganha +${Math.round(TACTIC_WIN_BONUS * 100)}% a mais.</p>
    <div class="tac-list">${tacticsOf(side).map(card).join("")}${card(null)}</div>`;
  $("tactic").hidden = false;
  $("tactic-box")
    .querySelectorAll<HTMLButtonElement>("[data-tac]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        tactics[side] = b.dataset.tac == "none" ? null : (b.dataset.tac as Tactic);
        tacticChosen[side] = true;
        $("tactic").hidden = true;
        finishTurn();
      })
    );
}

/** Texto: as duas ordens de batalha e quem venceu quem. */
function tacticsLine(res: TacticalBattleResult): string {
  const ti = res.tactics;
  if (!ti || (!ti.attacker.tactic && !ti.defender.tactic)) return "";
  const one = (side: Side): string => {
    const x = ti[side];
    const name = houseOf(side).name;
    if (!x.tactic) return `${name}: nenhuma`;
    if (x.bonus == 0) return `${name}: ${TACTIC_NAMES[x.tactic]} (sem as tropas certas, 0%)`;
    const total = x.bonus + (x.beats ? TACTIC_WIN_BONUS : 0);
    return `${name}: ${TACTIC_NAMES[x.tactic]} <b>+${Math.round(total * 100)}%</b>${x.beats ? " (venceu a do outro)" : ""}`;
  };
  return `<p class="tac-line">⚔ Ordem de batalha — ${one("attacker")} · ${one("defender")}</p>`;
}

// ---------------------------------------------------------------- reação
/**
 * Corvo Mensageiro: quem está no topo da trilha da Corte do Rei (tem o Corvo) vê o exército do outro
 * depois de os dois posicionarem e pode mudar UM esquadrão (lugar e/ou função). Só ele: é uma vantagem
 * de quem tem o Corvo, como no jogo original (lá ele troca uma ordem ou espia os selvagens).
 */
/** Lâmina de Aço Valiriano (o mais alto nos Feudos): desempata. Sem ninguém marcado, fica com quem defende. */
const bladeHolder = (): Side => (config.attacker.blade ? "attacker" : "defender");
const ravenHolder = (): Side | null => (config.attacker.raven ? "attacker" : config.defender.raven ? "defender" : null);
const isCpuSide = (side: Side): boolean => config.mode == "cpu" && side != config.humanSide;
const where = (u: Unit): string => `${LANE_NAMES[u.lane ?? 1].toLowerCase()}, ${u.row == "frente" ? "frente" : "trás"}`;

function changedId(side: Side = placingSide): string | null {
  if (!reactBase) return null;
  const base = reactBase[side];
  const u = units[side].find((x) => {
    const b = base.find((y) => y.id == x.id);
    return b && (b.lane != x.lane || b.row != x.row || b.role != x.role);
  });
  return u ? u.id : null;
}

/** Só 1 esquadrão pode mudar: se outro já tinha mudado, ele volta para onde estava. */
function enforceOne(keepId: string): void {
  if (!reactBase) return;
  reactWarn = "";
  units[placingSide].forEach((u) => {
    if (u.id == keepId) return;
    const b = reactBase?.[placingSide].find((y) => y.id == u.id);
    if (b && (b.lane != u.lane || b.row != u.row || b.role != u.role)) {
      u.lane = b.lane;
      u.row = b.row;
      u.role = b.role;
      reactWarn = `Só dá para mudar 1 esquadrão: o esquadrão ${units[placingSide].indexOf(u) + 1} voltou a ser como era.`;
    }
  });
}

function startReaction(): void {
  reactNote = { attacker: "", defender: "" };
  reactChanged = { attacker: null, defender: null };
  const holder = ravenHolder();
  if (!holder) {
    runBattle();
    return;
  }
  phase = "react";
  reactBase = { attacker: clone(units.attacker), defender: clone(units.defender) };
  reactSide = holder;
  nextReaction();
}

function recordReaction(side: Side): void {
  const id = changedId(side);
  reactChanged[side] = id;
  const name = houseOf(side).name;
  if (!id || !reactBase) {
    reactNote[side] = `Corvo Mensageiro: ${name} viu tudo e não mudou nada.`;
    return;
  }
  const b = reactBase[side].find((x) => x.id == id) as Unit;
  const u = units[side].find((x) => x.id == id) as Unit;
  const n = units[side].indexOf(u) + 1;
  const roleTxt = b.role != u.role ? `${ROLE_NAMES[b.role]} → ${ROLE_NAMES[u.role]}` : ROLE_NAMES[u.role];
  const placeTxt = b.lane != u.lane || b.row != u.row ? ` (${where(b)} → ${where(u)})` : ` (${where(u)})`;
  reactNote[side] = `Corvo Mensageiro: ${name} mudou o esquadrão ${n}: ${roleTxt}${placeTxt}.`;
}

function nextReaction(): void {
  reactWarn = "";
  if (isCpuSide(reactSide)) {
    const side = reactSide;
    const res = bestReply(scenario(), side, toSquads(units.attacker), toSquads(units.defender));
    units[side].forEach((u) => {
      const q = res.find((x) => x.id == u.id);
      if (q) {
        u.lane = q.lane;
        u.row = q.row;
        u.role = q.role;
      }
    });
    recordReaction(side);
    afterReaction();
    return;
  }
  placingSide = reactSide;
  selected = null;
  hoverSlot = null;
  startTimer(45);
  renderPanel();
  startLoop();
}

function afterReaction(): void {
  runBattle();
}

function finishReaction(): void {
  if (phase != "react") return;
  stopTimer();
  recordReaction(reactSide);
  afterReaction();
}

/** "Se a luta fosse agora": quem ganha cada faixa com tudo como está. */
function resultNow(): TacticalBattleResult {
  return resolveTacticalBattle({
    field: config.field,
    attacker: { squads: toSquads(units.attacker), card: config.attacker.card, orderBonus: config.attacker.order, tactic: tactics.attacker },
    defender: { squads: toSquads(units.defender), card: config.defender.card, orderBonus: config.defender.order, tactic: tactics.defender },
    bladeHolder: bladeHolder()
  });
}

function outcomeLine(res: TacticalBattleResult, me: Side): string {
  if (!res.winner) return `<b class="tie">empate</b> (ninguém ganha bônus)`;
  return res.winner == me ? `<b class="ok">você ganha</b> (+${res.bonus})` : `<b class="no">${houseOf(res.winner).name} ganha</b> (+${res.bonus} para ele)`;
}

/** O que o computador faria no seu lugar (a melhor troca vendo tudo) e o que isso daria. */
function bestChangeHtml(me: Side): string {
  if (!reactBase) return "";
  const base = { attacker: toSquads(reactBase.attacker), defender: toSquads(reactBase.defender) };
  base[other(me)] = toSquads(units[other(me)]);
  const best = bestReply(scenario(), me, base.attacker, base.defender);
  const before = base[me];
  const ch = best.find((q) => {
    const b = before.find((x) => x.id == q.id);
    return b && (b.lane != q.lane || b.row != q.row || b.role != q.role);
  });
  if (!ch) return `<p class="react-tip">💡 Dica: do jeito que está já é o melhor. Pode manter.</p>`;
  const b = before.find((x) => x.id == ch.id) as Squad;
  const n = units[me].findIndex((u) => u.id == ch.id) + 1;
  const res = resolveTacticalBattle({
    field: config.field,
    attacker: { squads: me == "attacker" ? best : base.attacker, card: config.attacker.card, orderBonus: config.attacker.order, tactic: tactics.attacker },
    defender: { squads: me == "defender" ? best : base.defender, card: config.defender.card, orderBonus: config.defender.order, tactic: tactics.defender },
    bladeHolder: bladeHolder()
  });
  const now = resolveTacticalBattle({
    field: config.field,
    attacker: { squads: base.attacker, card: config.attacker.card, orderBonus: config.attacker.order, tactic: tactics.attacker },
    defender: { squads: base.defender, card: config.defender.card, orderBonus: config.defender.order, tactic: tactics.defender },
    bladeHolder: bladeHolder()
  });
  if (now.winner == res.winner && now.bonus == res.bonus) return `<p class="react-tip">💡 Dica: nenhuma troca muda o resultado. Pode manter.</p>`;
  const what = `${b.role != ch.role ? `${ROLE_NAMES[b.role]} → ${ROLE_NAMES[ch.role]}` : ROLE_NAMES[ch.role]}${b.lane != ch.lane || b.row != ch.row ? ` (${LANE_NAMES[ch.lane].toLowerCase()}, ${ch.row == "frente" ? "frente" : "trás"})` : ""}`;
  return `<p class="react-tip">💡 Dica: mudar o esquadrão <b>${n}</b>: ${what} → ${outcomeLine(res, me)}</p>`;
}

function reactInfoHtml(): string {
  const me = placingSide;
  const now = resultNow();
  return `<div class="react-info">
    <p><b>✉ Corvo Mensageiro:</b> você viu o exército de ${houseOf(other(me)).name}. Pode mudar <b>1 esquadrão</b> (lugar e/ou função) ou manter.</p>
    <p class="react-now">Se a luta for assim: ${outcomeLine(now, me)}</p>
    ${bestChangeHtml(me)}
    ${reactWarn ? `<p class="warn">${reactWarn}</p>` : ""}
  </div>`;
}

// ---------------------------------------------------------------- batalha do tabuleiro
/**
 * A batalha do jogo original, com o bônus do mini-mapa: força das peças (com apoio) + carta de Casa
 * + ordem + bônus. Quem perde sofre baixas = espadas do vencedor − torres do perdedor
 * (no jogo, o perdedor escolhe quais peças morrem; aqui é sorteado). Apoio não sofre baixa.
 * Empate: no jogo decide a trilha dos Feudos (Lâmina de Aço Valiriano); aqui fica com quem defende.
 */
interface BoardBattle {
  totals: Record<Side, { tropas: number; carta: number; ordem: number; mini: number; total: number }>;
  winner: Side;
  tie: boolean;
  swords: number;
  towers: number;
  casualties: number;
  destroyed: string[];
}

function boardBattle(res: TacticalBattleResult, seed: number): BoardBattle {
  const tot = (side: Side): BoardBattle["totals"][Side] => {
    const tropas = toSquads(units[side]).reduce((a, q) => a + boardStrength(q, side, config.field), 0);
    const carta = config[side].card?.strength ?? 0;
    const ordem = config[side].order ?? 0;
    const mini = res.winner == side ? res.bonus : 0;
    return { tropas, carta, ordem, mini, total: tropas + carta + ordem + mini };
  };
  const totals = { attacker: tot("attacker"), defender: tot("defender") };
  const tie = totals.attacker.total == totals.defender.total;
  const winner: Side = tie ? bladeHolder() : totals.attacker.total > totals.defender.total ? "attacker" : "defender";
  const loser = other(winner);
  const swords = config[winner].card?.swords ?? 0;
  const towers = config[loser].card?.towers ?? 0;
  const casualties = Math.max(0, swords - towers);
  const pool = units[loser].filter((u) => u.lane != null && !u.support && u.kind != "garrison" && boardStrength(toSquads([u])[0], loser, config.field) > 0);
  const rand = rng(seed);
  const destroyed: string[] = [];
  // máquina de cerco do lado que perdeu não recua: é destruída (regra do jogo original)
  pool.filter((u) => u.kind == "siege-engine").forEach((u) => {
    destroyed.push(u.id);
    pool.splice(pool.indexOf(u), 1);
  });
  for (let i = 0; i < casualties && pool.length; i++) destroyed.push(pool.splice(Math.floor(rand() * pool.length), 1)[0].id);
  return { totals, winner, tie, swords, towers, casualties, destroyed };
}

function boardHtml(b: BoardBattle): string {
  const row = (side: Side): string => {
    const t = b.totals[side];
    const parts = [`tropas ${t.tropas}`, `carta ${t.carta}`];
    if (t.ordem) parts.push(`ordem ${t.ordem > 0 ? "+" : ""}${t.ordem}`);
    if (t.mini) parts.push(`bônus da batalha +${t.mini}`);
    return `<li><b style="color:${houseOf(side).color}">${houseOf(side).name}</b>: ${parts.join(" + ")} = <b>${t.total}</b></li>`;
  };
  const loser = other(b.winner);
  const names = b.destroyed
    .map((id) => units[loser].find((x) => x.id == id) as Unit)
    .filter((u) => u.kind != "siege-engine")
    .map((u) => `${KIND_NAMES[u.kind].toLowerCase()} (${ROLE_NAMES[u.role].toLowerCase()})`);
  const siege = b.destroyed.some((id) => units[loser].find((x) => x.id == id)?.kind == "siege-engine") ? " A máquina de cerco de quem perde não recua: é destruída." : "";
  // em palavras simples: quem mata são as espadas ⚔ da carta do vencedor; as torres ▲ da carta do perdedor protegem
  const W = houseOf(b.winner).name;
  const Lz = houseOf(loser).name;
  const deaths =
    b.casualties == 0
      ? b.swords == 0
        ? `Ninguém morre: a carta de ${W} não tem espadas ⚔ (são as espadas que matam). ${Lz} recua.`
        : `Ninguém morre: a carta de ${W} tem ${b.swords} ${b.swords == 1 ? "espada ⚔" : "espadas ⚔"}, mas a de ${Lz} tem ${b.towers} ${b.towers == 1 ? "torre ▲ que protege" : "torres ▲ que protegem"}. ${Lz} recua.`
      : `<b>${b.casualties == 1 ? "Morre 1 peça" : `Morrem ${b.casualties} peças`}</b> de ${Lz}: ${names.join(" e ")} (espadas ⚔ da carta de ${W}${b.towers ? ` menos as torres ▲ da carta de ${Lz}` : ""}). O resto recua.`;
  return `<div class="board-res">
    <h3>2. Batalha no tabuleiro (regra do jogo original)</h3>
    <ul>${row("attacker")}${row("defender")}</ul>
    <p><b style="color:${houseOf(b.winner).color}">${houseOf(b.winner).name} vence</b>${b.tie ? " (empate: quem tem a Lâmina de Aço Valiriano, o mais alto nos Feudos, vence — regra do jogo original)" : ""}. ${deaths}${siege}</p>
  </div>`;
}

// ---------------------------------------------------------------- luta
function runBattle(): void {
  phase = "battle";
  lastResult = resolveTacticalBattle({
    field: config.field,
    attacker: { squads: toSquads(units.attacker), card: config.attacker.card, orderBonus: config.attacker.order, tactic: tactics.attacker },
    defender: { squads: toSquads(units.defender), card: config.defender.card, orderBonus: config.defender.order, tactic: tactics.defender },
    bladeHolder: bladeHolder()
  });
  simSeed = Math.floor(Math.random() * 1e9);
  lastBoard = boardBattle(lastResult, simSeed);
  newSim();
  renderBattlePanel();
  startLoop();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function newSim(): void {
  sim = createSim(
    config.field,
    lastResult as TacticalBattleResult,
    { attacker: toSquads(units.attacker), defender: toSquads(units.defender) },
    { attacker: houseOf("attacker"), defender: houseOf("defender") },
    simSeed,
    lastBoard ? { loser: other(lastBoard.winner), destroyed: lastBoard.destroyed } : undefined
  );
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    while (sim.t < T_END) stepSim(sim, 0.05);
  }
}

/** Por que cada faixa vai para quem (texto embaixo do campo durante a luta). */
function whyHtml(): string {
  const res = lastResult;
  if (!res) return "";
  const lanesT = FIELD_LANES[config.field];
  const items = res.lanes
    .map((L, i) => {
      if (L.blocked) return "";
      const head = `<b>${LANE_NAMES[i]}</b> <span class="t">${TERRAIN_NAMES[lanesT[i]]}</span>`;
      if (L.winner == null) return `<li>${head} — sem luta: quem estava aqui foi ajudar onde tinha luta</li>`;
      const A = L.attackerScore;
      const D = L.defenderScore;
      const diff = Math.abs(A - D) / Math.max(A, D);
      const lead: Side | null = diff < 0.06 ? null : A > D ? "attacker" : "defender";
      const who = lead ? `vantagem <b style="color:${houseOf(lead).color}">${houseOf(lead).name}</b>` : "equilibrado";
      const rs = laneReasons(res, i)
        .map((r) => `<span class="r" style="--c:${houseOf(r.side).color}">${r.text}</span>`)
        .join("");
      return `<li>${head} — ${who}${rs ? ": " + rs : ""}</li>`;
    })
    .join("");
  const notes = [reactNote.defender, reactNote.attacker].filter(Boolean);
  const tl = tacticsLine(res);
  return `${tl}${notes.length ? `<p class="react-notes">${notes.join(" ")}</p>` : ""}<ul class="why" aria-label="Por que cada faixa">${items}</ul>`;
}

function renderBattlePanel(): void {
  setPhase("battle");
  $("panel").innerHTML = `
    <div class="turn-head"><button type="button" class="quit-btn" id="quit" aria-label="Sair para o início">‹</button><h2>A luta</h2><button type="button" class="help-btn" id="help-battle" aria-label="Como funciona o combate">?</button></div>
    <p class="muted">A conta já decidiu quem ganha cada faixa; a luta mostra como foi.</p>
    <div class="speed" role="group" aria-label="Velocidade">
      <button type="button" class="btn${speed == 1 ? " on" : ""}" data-speed="1">1×</button>
      <button type="button" class="btn${speed == 2 ? " on" : ""}" data-speed="2">2×</button>
      <button type="button" class="btn" id="skip">Pular</button>
      <button type="button" class="btn${goreOn ? " on" : ""}" id="gore" aria-pressed="${goreOn}">Sangue: ${goreOn ? "sim" : "não"}</button>
    </div>
    ${whyHtml()}`;
  $("panel")
    .querySelectorAll<HTMLButtonElement>("[data-speed]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        speed = Number(b.dataset.speed);
        renderBattlePanel();
      })
    );
  $("gore").addEventListener("click", () => {
    goreOn = !goreOn;
    setGore(goreOn);
    store("tactical-gore", goreOn ? "1" : "0");
    renderBattlePanel();
  });
  $("skip").addEventListener("click", () => {
    if (sim) while (sim.t < T_END) stepSim(sim, 0.05);
  });
  $("help-battle").addEventListener("click", () => openTutorial(0));
  $("quit").addEventListener("click", goHome);
}

function startLoop(): void {
  if (raf != null) cancelAnimationFrame(raf);
  lastFrame = performance.now();
  const c = $<HTMLCanvasElement>("board");
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const frame = (now: number): void => {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    if (phase == "place" || phase == "react") {
      const reacting = phase == "react";
      const nowRes = reacting ? resultNow() : null;
      const view = {
        field: config.field,
        house: houseOf(placingSide),
        enemy: houseOf(other(placingSide)),
        enemyCount: units[other(placingSide)].length,
        squads: units[placingSide],
        selected,
        hoverSlot,
        dragging: dragging?.moved ? dragging.id : null,
        showHint: !!selected,
        preview: previewFor(units[placingSide].find((u) => u.id == selected) ?? null),
        wallFlag: houseOf("defender").color,
        laneForce: reacting ? undefined : laneForces(placingSide),
        enemySquads: reacting ? units[other(placingSide)] : undefined,
        enemyChanged: reacting ? reactChanged[other(placingSide)] : null,
        changed: reacting ? changedId() : null,
        formation: ([0, 1, 2] as Lane[]).map((L) => hasFormation(toSquads(units[placingSide]).filter((q) => q.lane == L))),
        laneOutcome: nowRes ? nowRes.lanes.map((l) => (l.blocked || l.winner == null ? null : l.winner == "tie" ? "tie" : l.winner == placingSide ? "win" : "lose")) : undefined,
        enemyForce: totalForce(other(placingSide)),
        previewLabel: (() => {
          const i = units[placingSide].findIndex((u) => u.id == selected);
          return i >= 0 ? `Peça ${i + 1} · ${ROLE_NAMES[units[placingSide][i].role]}` : undefined;
        })()
      };
      placedHit = drawPlacement(ctx, view, (now - t0) / 1000);
    } else if (sim) {
      // passos pequenos para a simulação ficar estável
      let left = dt * speed;
      while (left > 0) {
        const d = Math.min(0.02, left);
        stepSim(sim, d);
        left -= d;
      }
      drawSim(ctx, sim);
      if (sim.t >= T_END && phase == "battle") {
        phase = "result";
        showResult();
      }
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- resultado
function factorText(f: LaneFactor): string | null {
  const who = houseOf(f.side).name;
  switch (f.kind) {
    case "counter":
      return f.role && f.vs ? `${who}: ${ROLE_PLURAL[f.role]} ${f.role == "dragao" ? "rendeu" : "renderam"} bem contra ${ROLE_PLURAL[f.vs]}` : null;
    case "weak":
      return f.role && f.vs ? `${who}: ${ROLE_PLURAL[f.role]} ${f.role == "dragao" ? "sofreu" : "sofreram"} contra ${ROLE_PLURAL[f.vs]}` : null;
    case "wall":
      return `${who}: a muralha protegeu quem defende`;
    case "wall-breach":
      return `${who}: a catapulta derrubou a muralha`;
    case "flank":
      return `${who}: recebeu ajuda pelo lado (flanco)`;
    case "screen":
      return `${who}: a linha da frente segurou a cavalaria inimiga`;
    case "empty":
      return `${who}: ficou sozinho nesta faixa e foi ajudar onde tinha luta`;
    case "far-flank":
      return `${who}: veio ajudar da outra ponta, mas de longe rende só 15% (a vizinha renderia 30%)`;
    case "formation":
      return `${who}: formação (corpo a corpo na frente + atiradores atrás) +15%`;
    default:
      return null;
  }
}

function showResult(): void {
  setPhase("result");
  const res = lastResult as TacticalBattleResult;
  const lanesT = FIELD_LANES[config.field];
  const human = config.mode == "cpu" ? config.humanSide : null;
  // o título é o resultado de VERDADE (a batalha do tabuleiro); a Mesa só dá o bônus
  const bw = lastBoard?.winner ?? res.winner;
  const verdict = bw ? (human ? (bw == human ? "Você venceu a batalha!" : "Você perdeu a batalha") : `${houseOf(bw).name} venceu a batalha`) : "Empate";
  const bonus = res.winner
    ? `<b>1. A luta nas faixas:</b> ${houseOf(res.winner).name} ${res.duel ? "venceu o duelo de campeões" : res.bonus >= 2 ? "venceu todas as faixas" : "venceu mais faixas"} → ganha <span class="bonus" style="background:${houseOf(res.winner).color};color:${houseOf(res.winner).ink}">+${res.bonus}</span> de bônus da batalha.`
    : "<b>1. A luta nas faixas:</b> empate, ninguém ganha bônus da batalha.";
  const lanesHtml = res.lanes
    .map((L, i) => {
      const facts = [...new Set(L.factors.map(factorText).filter((x): x is string => !!x))].slice(0, 3);
      const tot = L.attackerScore + L.defenderScore || 1;
      const outcome = L.blocked ? "fechada" : L.winner == null ? "sem luta" : L.winner == "tie" ? "empate" : `${houseOf(L.winner).name} venceu`;
      return `<li class="lane-res">
        <div class="lr-head"><b>${LANE_NAMES[i]} · ${TERRAIN_NAMES[lanesT[i]]}</b><span class="${L.winner && L.winner != "tie" ? "won" : ""}">${outcome}</span></div>
        ${
          L.winner != null
            ? `<div class="bar" role="img" aria-label="${houseOf("attacker").name} ${L.attackerScore.toFixed(1)}, ${houseOf("defender").name} ${L.defenderScore.toFixed(1)}">
            <span style="width:${(L.attackerScore / tot) * 100}%;background:${houseOf("attacker").color}"></span>
            <span style="width:${(L.defenderScore / tot) * 100}%;background:${houseOf("defender").color}"></span>
          </div>
          <div class="bar-nums"><span>${houseOf("attacker").name}</span><span>${houseOf("defender").name}</span></div>`
            : ""
        }
        ${facts.length ? `<ul class="facts">${facts.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
      </li>`;
    })
    .join("");
  $("panel").innerHTML = `
    <div class="result">
      <h2 class="verdict">${verdict}</h2>
      <p class="bonus-line">${bonus}</p>
      ${tacticsLine(res)}
      ${res.metInCenter ? `<p class="note">Ninguém se encontrou nas faixas escolhidas, então os exércitos marcharam e lutaram no centro.</p>` : ""}
      ${res.duel && res.winner ? `<p class="note">🗡 <b>Empate nas faixas → duelo de campeões.</b> Os dois campeões lutaram no meio do campo e venceu o de ${houseOf(res.winner).name}, que tem a Lâmina de Aço Valiriano (o mais alto nos Feudos desempata, como no jogo original).</p>` : ""}
      ${lastBoard ? boardHtml(lastBoard) : ""}
      <h3 class="lanes-title">3. Por que cada faixa foi para quem</h3>
      <ol class="lanes-res">${lanesHtml}</ol>
      <div class="actions">
        <button type="button" class="btn" id="home-btn">Início</button>
        <button type="button" class="btn" id="replay">Ver de novo</button>
        <button type="button" class="btn" id="swap">${config.mode == "cpu" ? "Trocar de lado" : "Revanche"}</button>
        <button type="button" class="btn primary" id="again">Jogar de novo</button>
      </div>
    </div>`;
  $("replay").addEventListener("click", () => {
    phase = "battle";
    newSim();
    renderBattlePanel();
  });
  $("again").addEventListener("click", startPlacement);
  $("home-btn").addEventListener("click", goHome);
  $("swap").addEventListener("click", () => {
    if (config.mode == "cpu") config.humanSide = other(config.humanSide);
    startPlacement();
  });
}

// ---------------------------------------------------------------- tutorial
let slide = 0;
function openTutorial(i = 0): void {
  slide = i;
  $("tutorial").hidden = false;
  renderSlide();
  $("tut-next").focus();
}

function renderSlide(): void {
  const sl = SLIDES[slide];
  $("tut-title").textContent = sl.title;
  $("tut-text").textContent = sl.text;
  drawSlide($<HTMLCanvasElement>("tut-canvas"), slide);
  $("tut-dots").innerHTML = SLIDES.map((_, i) => `<button type="button" class="tdot${i == slide ? " on" : ""}" data-slide="${i}" aria-label="Passo ${i + 1}"></button>`).join("");
  $("tut-dots")
    .querySelectorAll<HTMLButtonElement>("[data-slide]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        slide = Number(b.dataset.slide);
        renderSlide();
      })
    );
  ($("tut-prev") as HTMLButtonElement).disabled = slide == 0;
  $("tut-next").textContent = slide == SLIDES.length - 1 ? "Entendi, vamos lá" : "Próximo";
}

function closeTutorial(): void {
  $("tutorial").hidden = true;
  store("tactical-tutorial-seen", "1");
}

// ---------------------------------------------------------------- início
function init(): void {
  goreOn = store("tactical-gore") != "0";
  setGore(goreOn);
  // textura do chão: quando chegar, o campo é repintado (o tutorial aberto também)
  void loadAssets().then(() => {
    if (!$("tutorial").hidden) renderSlide();
  });
  renderHome();
  document.querySelectorAll<HTMLButtonElement>("#mode-seg [data-mode]").forEach((b) =>
    b.addEventListener("click", () => {
      config.mode = b.dataset.mode as Config["mode"];
      renderHome();
    })
  );
  document.querySelectorAll<HTMLButtonElement>("#side-seg [data-human]").forEach((b) =>
    b.addEventListener("click", () => {
      config.humanSide = b.dataset.human as Side;
      renderHome();
    })
  );
  $("custom-start").addEventListener("click", () => {
    config.presetId = null;
    startPlacement();
  });
  $("custom-back").addEventListener("click", () => show("home"));
  $("go-home").addEventListener("click", goHome);
  $("how").addEventListener("click", () => openTutorial(0));
  $("tut-prev").addEventListener("click", () => {
    slide = Math.max(0, slide - 1);
    renderSlide();
  });
  $("tut-next").addEventListener("click", () => {
    if (slide == SLIDES.length - 1) closeTutorial();
    else {
      slide++;
      renderSlide();
    }
  });
  $("tut-close").addEventListener("click", closeTutorial);
  document.addEventListener("keydown", (e) => {
    if ($("tutorial").hidden) return;
    if (e.key == "Escape") closeTutorial();
    if (e.key == "ArrowRight" && slide < SLIDES.length - 1) {
      slide++;
      renderSlide();
    }
    if (e.key == "ArrowLeft" && slide > 0) {
      slide--;
      renderSlide();
    }
  });
  $("handoff-go").addEventListener("click", () => {
    $("handoff").hidden = true;
    beginTurn();
  });
  const c = $<HTMLCanvasElement>("board");
  c.width = W * 2;
  c.height = H * 2;
  c.addEventListener("pointerdown", canvasDown);
  window.addEventListener("pointermove", moveDrag, { passive: false });
  window.addEventListener("pointerup", endDrag);
  // o navegador cancelou (por exemplo: o dedo rolou a faixa de peças): só desfaz o arraste
  window.addEventListener("pointercancel", () => {
    if (dragging) dragging.ghost.remove();
    dragging = null;
  });
  c.addEventListener("pointerleave", () => {
    if (!dragging) hoverSlot = null;
  });
  show("home");
}

document.addEventListener("DOMContentLoaded", init);
