/**
 * Protótipo jogável do combate tático (mini-mapa de batalha).
 * Usa a MESMA conta do jogo (src/common/tactical-battle) e o mesmo "computador" do teste de equilíbrio.
 * Gerar a página: node tools/tactical/prototipo/build.js
 */
import {
  resolveTacticalBattle,
  Squad,
  Lane,
  Side,
  TacticalBattleResult,
  LaneFactor,
  CardInfo
} from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattle";
import {
  FIELD_LANES,
  FieldType,
  Role,
  Row,
  SquadKind,
  Terrain,
  rolesFor,
  FIGURES
} from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { computerStrategy, Piece, Scenario, rng } from "../solver";

// ---------------------------------------------------------------- dados de tela
const HOUSES: Record<string, { name: string; color: string; ink: string }> = {
  stark: { name: "Stark", color: "#d9d6cc", ink: "#1d1b18" },
  lannister: { name: "Lannister", color: "#b3262f", ink: "#fff4e8" },
  baratheon: { name: "Baratheon", color: "#d8ab2b", ink: "#1d1b18" },
  greyjoy: { name: "Greyjoy", color: "#5b646b", ink: "#f2f2f2" },
  tyrell: { name: "Tyrell", color: "#45903c", ink: "#f4f9ee" },
  martell: { name: "Martell", color: "#de7a22", ink: "#1d1b18" },
  arryn: { name: "Arryn", color: "#3d86c2", ink: "#f2f7fc" },
  targaryen: { name: "Targaryen", color: "#6d2bb8", ink: "#f6f0ff" }
};

const FIELD_NAMES: Record<FieldType, string> = {
  planicie: "Planície",
  colinas: "Colinas",
  floresta: "Floresta",
  montanha: "Montanha",
  rio: "Rio",
  pantano: "Pântano",
  deserto: "Deserto",
  castelo: "Castelo",
  fortaleza: "Fortaleza",
  mar: "Mar"
};

const FIELD_EXAMPLE: Record<FieldType, string> = {
  planicie: "Campina, Porto Real",
  colinas: "Septo de Pedra, Os Dedos",
  floresta: "Mata do Rei, Mata dos Lobos",
  montanha: "Ninho da Águia, Passo do Príncipe",
  rio: "Correrrio, As Gêmeas",
  pantano: "o Gargalo",
  deserto: "Lançassolar, Costa do Sal",
  castelo: "Harrenhal, Ponta Tempestade",
  fortaleza: "Winterfell, Pedra do Dragão",
  mar: "Mar Estreito"
};

const TERRAIN_NAMES: Record<Terrain, string> = {
  aberto: "Campo aberto",
  mata: "Mata",
  colina: "Colina",
  rio: "Rio",
  vau: "Vau",
  pantano: "Pântano",
  calcada: "Calçada",
  areia: "Areia",
  muralha: "Muralha",
  portao: "Portão",
  bloqueado: "Fechado",
  mar: "Mar aberto"
};

const TERRAIN_HINT: Record<Terrain, string> = {
  aberto: "cavalaria +25%",
  mata: "flechas e cavalos rendem menos",
  colina: "defensor +25%, arqueiro +20%",
  rio: "atacante −20%; cavalos −20%",
  vau: "atacante −5%",
  pantano: "cavalos atolam; atacante −10%, defensor +10%",
  calcada: "atacante −10%",
  areia: "armadura pesada sofre; batedores +20%",
  muralha: "defensor +30%; a catapulta derruba",
  portao: "defensor +10%; a catapulta derruba",
  bloqueado: "ninguém passa",
  mar: "navios"
};

const ROLE_NAMES: Record<Role, string> = {
  lanceiro: "Lanceiro",
  escudeiro: "Escudeiro",
  arqueiro: "Arqueiro",
  cavalaria: "Cavalaria",
  batedores: "Batedores",
  catapulta: "Catapulta",
  dragao: "Dragão",
  torre: "Torre",
  ariete: "Aríete",
  abordagem: "Abordagem",
  flechas: "Flechas"
};

const ROLE_PLURAL: Record<Role, string> = {
  lanceiro: "os lanceiros",
  escudeiro: "os escudeiros",
  arqueiro: "os arqueiros",
  cavalaria: "a cavalaria",
  batedores: "os batedores",
  catapulta: "a catapulta",
  dragao: "o dragão",
  torre: "a torre",
  ariete: "o aríete",
  abordagem: "a abordagem",
  flechas: "as flechas"
};

const ROLE_HINT: Record<Role, string> = {
  lanceiro: "para a cavalaria de carga e vence escudeiros; sofre com flechas e batedores",
  escudeiro: "segura flechas e batedores; perde para lanças e para a carga",
  arqueiro: "melhor atrás; vence lanceiros; sofre com escudos e com a carga",
  cavalaria: "carga: atropela arqueiros e escudeiros; morre nas lanças",
  batedores: "cavalaria leve: contorna lanças; não passa pelos escudos",
  catapulta: "derruba a muralha; fraca de perto",
  dragao: "forte contra todos; teme arqueiros juntos",
  torre: "guarnição: fica atrás, no centro",
  ariete: "vence as flechas; perde na abordagem",
  abordagem: "vence o aríete; perde para as flechas",
  flechas: "vence a abordagem; perde para o aríete"
};

const KIND_NAMES: Record<SquadKind, string> = {
  footman: "Soldado",
  knight: "Cavaleiro",
  "siege-engine": "Máquina de cerco",
  ship: "Navio",
  dragon: "Dragão",
  garrison: "Guarnição"
};

// ---------------------------------------------------------------- estado
interface SideConfig {
  house: string;
  footmen: number;
  knights: number;
  siege: number;
  ships: number;
  dragon: number; // força 0..5 (0 = sem dragão)
  supportFootmen: number;
  supportShips: number;
  garrison: number; // só defensor
  card: CardInfo;
  order: number; // Marcha −1..+1 (atacante) ou Defesa 0..2 (defensor)
}

interface Config {
  field: FieldType;
  mode: "cpu" | "local";
  humanSide: Side; // contra o computador: o seu lado
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
}

const DEFAULT: Config = {
  field: "rio",
  mode: "cpu",
  humanSide: "attacker",
  attacker: {
    house: "stark",
    footmen: 2,
    knights: 1,
    siege: 0,
    ships: 0,
    dragon: 0,
    supportFootmen: 0,
    supportShips: 0,
    garrison: 0,
    card: { strength: 2, swords: 1, towers: 0 },
    order: 1
  },
  defender: {
    house: "lannister",
    footmen: 2,
    knights: 1,
    siege: 0,
    ships: 0,
    dragon: 0,
    supportFootmen: 1,
    supportShips: 0,
    garrison: 0,
    card: { strength: 1, swords: 0, towers: 1 },
    order: 1
  }
};

let config: Config = JSON.parse(JSON.stringify(DEFAULT));
let units: Record<Side, Unit[]> = { attacker: [], defender: [] };
let placingSide: Side = "attacker";
let selected: string | null = null;
let timer: number | null = null;
let timeLeft = 60;
let lastResult: TacticalBattleResult | null = null;
let battleSeed = 1;

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const isSea = (): boolean => config.field == "mar";
const other = (s: Side): Side => (s == "attacker" ? "defender" : "attacker");
const sideName = (s: Side): string => (s == "attacker" ? "Atacante" : "Defensor");
const houseOf = (s: Side): { name: string; color: string; ink: string } => HOUSES[config[s].house];

// ---------------------------------------------------------------- peças a partir da configuração
function buildUnits(side: Side): Unit[] {
  const c = config[side];
  const out: Unit[] = [];
  let n = 0;
  const add = (kind: SquadKind, extra: Partial<Unit> = {}): void => {
    const roles = rolesFor(kind, isSea());
    out.push({ id: `${side[0]}${n++}`, kind, role: roles[0], lane: null, row: "frente", ...extra });
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
    if (side == "defender" && c.garrison > 0) add("garrison", { strength: c.garrison, lane: 1, row: "tras" });
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

/** Põe as peças do lado na jogada escolhida pelo computador (também serve para "posicionar automático"). */
function autoPlace(side: Side): void {
  const strat = computerStrategy(scenario(), side, Math.floor(Math.random() * 1e9));
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

// ---------------------------------------------------------------- ícones (SVG)
function glyphSvg(role: Role, ink: string): string {
  const s = `stroke="${ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  switch (role) {
    case "lanceiro":
      return `<path d="M7 17 L17 7" ${s}/><path d="M17 7 l-4.5 1 l3.5 3.5 z" fill="${ink}" stroke="${ink}" stroke-width="1"/>`;
    case "escudeiro":
      return `<path d="M12 5 L18 7 V12 C18 15.5 15 18 12 19.5 C9 18 6 15.5 6 12 V7 Z" ${s}/>`;
    case "arqueiro":
      return `<path d="M8 5 C15 8 15 16 8 19" ${s}/><path d="M8 5 V19" stroke="${ink}" stroke-width="1.2"/><path d="M6 12 H17" ${s}/>`;
    case "cavalaria":
      return `<path d="M6 16 L12 7 L18 16" ${s}/><path d="M9 13 H15" ${s}/>`;
    case "batedores":
      return `<path d="M6 12 H17" ${s}/><path d="M13 8 L17 12 L13 16" ${s}/>`;
    case "catapulta":
      return `<path d="M6 17 H18" ${s}/><path d="M9 17 L12 11 L15 17" ${s}/><path d="M12 11 L17 6" ${s}/><circle cx="17.5" cy="5.5" r="1.6" fill="${ink}"/>`;
    case "dragao":
      return `<path d="M4 14 L12 7 L20 14 L15 12 L12 17 L9 12 Z" fill="${ink}"/>`;
    case "torre":
      return `<path d="M7 18 V8 H9 V6 H11 V8 H13 V6 H15 V8 H17 V18 Z" ${s}/>`;
    case "ariete":
      return `<path d="M5 14 H15 L19 12 L15 10 H5" ${s}/>`;
    case "abordagem":
      return `<path d="M7 17 L17 7" ${s}/><path d="M7 7 L17 17" ${s}/>`;
    case "flechas":
      return `<path d="M5 12 H18" ${s}/><path d="M14 8 L18 12 L14 16" ${s}/><path d="M5 9 L8 12 L5 15" ${s}/>`;
  }
}

function chipHtml(u: Unit, side: Side): string {
  const h = houseOf(side);
  const dots = FIGURES[u.kind];
  const big = u.kind == "knight" || u.kind == "dragon" || u.kind == "siege-engine";
  const fig = (): string =>
    `<svg class="fig${big ? " big" : ""}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${h.color}" stroke="rgba(0,0,0,.55)" stroke-width="1.5"/>${glyphSvg(u.role, h.ink)}</svg>`;
  const extra = u.support ? '<span class="tag">apoio</span>' : u.strength && u.kind != "footman" && u.kind != "knight" ? `<span class="tag">força ${u.strength}</span>` : "";
  return `<span class="figs">${Array.from({ length: dots }, () => fig()).join("")}</span><span class="chip-label">${ROLE_NAMES[u.role]}</span>${extra}`;
}

// ---------------------------------------------------------------- tela de configuração
function stepper(id: string, label: string, value: number, min: number, max: number, hint = ""): string {
  return `<div class="stepper" data-id="${id}">
    <span class="st-label">${label}${hint ? `<small>${hint}</small>` : ""}</span>
    <span class="st-ctl">
      <button type="button" class="st-btn" data-d="-1" aria-label="menos ${label}">−</button>
      <output id="st-${id}">${value}</output>
      <button type="button" class="st-btn" data-d="1" aria-label="mais ${label}">+</button>
    </span>
  </div>`;
}

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
  order: [-1, 2]
};

function getPath(side: Side, key: string): number {
  const c = config[side] as unknown as Record<string, unknown>;
  if (key.startsWith("card.")) return (config[side].card as unknown as Record<string, number>)[key.slice(5)];
  return c[key] as number;
}

function setPath(side: Side, key: string, v: number): void {
  if (key.startsWith("card.")) (config[side].card as unknown as Record<string, number>)[key.slice(5)] = v;
  else (config[side] as unknown as Record<string, number>)[key] = v;
}

function renderSetup(): void {
  const houseOpts = (sel: string): string =>
    Object.entries(HOUSES)
      .map(([id, h]) => `<option value="${id}"${id == sel ? " selected" : ""}>${h.name}</option>`)
      .join("");
  const sideBlock = (side: Side): string => {
    const c = config[side];
    const sea = isSea();
    const orderLabel = side == "attacker" ? "Ordem de Marcha" : "Ordem de Defesa";
    const orderMin = side == "attacker" ? -1 : 0;
    const orderMax = side == "attacker" ? 1 : 2;
    return `<fieldset class="side-box" data-side="${side}">
      <legend><span class="swatch" style="background:${HOUSES[c.house].color}"></span>${sideName(side)}</legend>
      <label class="row-field">Casa <select id="house-${side}">${houseOpts(c.house)}</select></label>
      <div class="steppers">
        ${sea ? stepper(`${side}.ships`, "Navios", c.ships, 0, 5) : stepper(`${side}.footmen`, "Soldados", c.footmen, 0, 6)}
        ${sea ? "" : stepper(`${side}.knights`, "Cavaleiros", c.knights, 0, 4)}
        ${!sea && side == "attacker" ? stepper(`${side}.siege`, "Máquinas de cerco", c.siege, 0, 2, "só contam atacando castelo") : ""}
        ${!sea ? stepper(`${side}.dragon`, "Dragão (força)", c.dragon, 0, 5, "0 = sem dragão") : ""}
        ${!sea ? stepper(`${side}.supportFootmen`, "Soldados de apoio", c.supportFootmen, 0, 3, "vizinhos") : ""}
        ${!sea ? stepper(`${side}.supportShips`, "Navios de apoio", c.supportShips, 0, 2, "atiram do litoral") : ""}
        ${!sea && side == "defender" ? stepper(`${side}.garrison`, "Guarnição", c.garrison, 0, 4) : ""}
      </div>
      <div class="steppers compact">
        ${stepper(`${side}.card.strength`, "Carta: força", c.card.strength, 0, 4)}
        ${stepper(`${side}.card.swords`, "Carta: espadas ⚔", c.card.swords, 0, 3)}
        ${stepper(`${side}.card.towers`, "Carta: torres ▲", c.card.towers, 0, 3)}
        ${stepper(`${side}.order`, orderLabel, c.order, orderMin, orderMax)}
      </div>
    </fieldset>`;
  };
  const fieldOpts = (Object.keys(FIELD_NAMES) as FieldType[])
    .map((f) => `<option value="${f}"${f == config.field ? " selected" : ""}>${FIELD_NAMES[f]} — ${FIELD_EXAMPLE[f]}</option>`)
    .join("");
  $("setup-body").innerHTML = `
    <div class="setup-top">
      <label class="row-field">Campo da batalha <select id="field">${fieldOpts}</select></label>
      <div class="seg" role="radiogroup" aria-label="Modo">
        <button type="button" class="seg-btn${config.mode == "cpu" ? " on" : ""}" data-mode="cpu">Contra o computador</button>
        <button type="button" class="seg-btn${config.mode == "local" ? " on" : ""}" data-mode="local">Dois jogadores</button>
      </div>
      ${
        config.mode == "cpu"
          ? `<div class="seg" role="radiogroup" aria-label="Seu lado">
        <button type="button" class="seg-btn${config.humanSide == "attacker" ? " on" : ""}" data-human="attacker">Eu ataco</button>
        <button type="button" class="seg-btn${config.humanSide == "defender" ? " on" : ""}" data-human="defender">Eu defendo</button>
      </div>`
          : ""
      }
    </div>
    <div class="sides">${sideBlock("attacker")}${sideBlock("defender")}</div>
    <div class="setup-actions"><button type="button" class="btn primary" id="apply">Começar o posicionamento</button></div>`;

  $("field").addEventListener("change", (e) => {
    config.field = (e.target as HTMLSelectElement).value as FieldType;
    renderSetup();
  });
  (["attacker", "defender"] as Side[]).forEach((s) =>
    $(`house-${s}`).addEventListener("change", (e) => {
      config[s].house = (e.target as HTMLSelectElement).value;
      renderSetup();
    })
  );
  document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((b) =>
    b.addEventListener("click", () => {
      config.mode = b.dataset.mode as Config["mode"];
      renderSetup();
    })
  );
  document.querySelectorAll<HTMLButtonElement>("[data-human]").forEach((b) =>
    b.addEventListener("click", () => {
      config.humanSide = b.dataset.human as Side;
      renderSetup();
    })
  );
  document.querySelectorAll<HTMLElement>(".stepper").forEach((st) => {
    const [side, ...rest] = (st.dataset.id as string).split(".");
    const key = rest.join(".");
    st.querySelectorAll<HTMLButtonElement>(".st-btn").forEach((b) =>
      b.addEventListener("click", () => {
        const [min, max] = LIMITS[key] ?? [0, 9];
        const lo = key == "order" ? (side == "attacker" ? -1 : 0) : min;
        const hi = key == "order" ? (side == "attacker" ? 1 : 2) : max;
        const v = Math.max(lo, Math.min(hi, getPath(side as Side, key) + Number(b.dataset.d)));
        setPath(side as Side, key, v);
        ($(`st-${side}.${key}`) as HTMLOutputElement).textContent = String(v);
      })
    );
  });
  $("apply").addEventListener("click", () => {
    $<HTMLDetailsElement>("setup").open = false;
    startPlacement();
  });
}

// ---------------------------------------------------------------- posicionamento
function startPlacement(): void {
  stopTimer();
  units = { attacker: buildUnits("attacker"), defender: buildUnits("defender") };
  lastResult = null;
  $("battle").hidden = true;
  $("result").hidden = true;
  $("placement").hidden = false;
  placingSide = config.mode == "cpu" ? config.humanSide : "attacker";
  if (units[placingSide].length == 0 || units[other(placingSide)].length == 0) {
    $("place-title").textContent = "Os dois lados precisam de peças";
    $("place-sub").textContent = "Abra “Mudar a batalha” e coloque ao menos uma peça de cada lado.";
    $("board").innerHTML = "";
    $("tray").innerHTML = "";
    return;
  }
  beginTurn();
}

function beginTurn(): void {
  selected = null;
  const h = houseOf(placingSide);
  $("place-title").innerHTML = `<span class="swatch" style="background:${h.color}"></span>${h.name} posiciona (${sideName(placingSide).toLowerCase()})`;
  $("place-sub").textContent =
    config.mode == "cpu"
      ? "O computador já escolheu a jogada dele, escondido. Toque numa peça e depois numa casinha. Toque de novo na peça para trocar a função."
      : "O outro jogador não pode olhar. Toque numa peça e depois numa casinha. Toque de novo na peça para trocar a função.";
  renderBoard();
  startTimer();
}

function startTimer(): void {
  stopTimer();
  timeLeft = 60;
  updateTimer();
  timer = window.setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      units[placingSide].filter((u) => u.lane == null).forEach((u) => (u.lane = 1));
      finishTurn();
    }
  }, 1000);
}

function stopTimer(): void {
  if (timer != null) window.clearInterval(timer);
  timer = null;
}

function updateTimer(): void {
  const el = $("timer");
  el.textContent = `${timeLeft}s`;
  el.style.setProperty("--p", `${(timeLeft / 60) * 100}%`);
  el.classList.toggle("low", timeLeft <= 10);
}

function renderBoard(): void {
  const lanes = FIELD_LANES[config.field];
  const mine = units[placingSide];
  const enemy = other(placingSide);
  const cell = (lane: Lane, row: Row): string => {
    if (lanes[lane] == "bloqueado") return `<div class="cell blocked" aria-label="faixa fechada"></div>`;
    const here = mine.filter((u) => u.lane == lane && u.row == row);
    return `<button type="button" class="cell" data-lane="${lane}" data-row="${row}" aria-label="${row == "frente" ? "Frente" : "Trás"}, faixa ${lane + 1}">
      <span class="cell-row">${row == "frente" ? "frente" : "trás"}</span>
      ${here.map((u) => `<span class="chip${selected == u.id ? " sel" : ""}" data-unit="${u.id}" role="button" tabindex="0">${chipHtml(u, placingSide)}</span>`).join("")}
    </button>`;
  };
  const head = lanes
    .map(
      (t) =>
        `<div class="lane-head t-${t}"><b>${TERRAIN_NAMES[t]}</b><small>${TERRAIN_HINT[t]}</small></div>`
    )
    .join("");
  const rowsOrder: Row[] = ["frente", "tras"];
  $("board").innerHTML = `
    <div class="lane-heads">${head}</div>
    <div class="enemy-zone"><span>${houseOf(enemy).name}: ${units[enemy].length} esquadrão(ões) escondidos</span></div>
    <div class="grid">${rowsOrder.map((r) => ([0, 1, 2] as Lane[]).map((l) => cell(l, r)).join("")).join("")}</div>`;
  const tray = mine.filter((u) => u.lane == null);
  $("tray").innerHTML = tray.length
    ? tray.map((u) => `<button type="button" class="chip tray-chip${selected == u.id ? " sel" : ""}" data-unit="${u.id}">${chipHtml(u, placingSide)}<span class="kind">${KIND_NAMES[u.kind]}</span></button>`).join("")
    : `<p class="tray-empty">Todas as peças estão no campo.</p>`;
  const sel = mine.find((u) => u.id == selected);
  const roles = sel ? rolesFor(sel.kind, isSea()) : [];
  $("roles").innerHTML =
    sel && roles.length > 1
      ? `<span class="roles-label">${KIND_NAMES[sel.kind]}: escolha a função</span>${roles
          .map(
            (r) =>
              `<button type="button" class="role-btn${sel.role == r ? " on" : ""}" data-role="${r}"><b>${ROLE_NAMES[r]}</b><small>${ROLE_HINT[r]}</small></button>`
          )
          .join("")}`
      : sel
        ? `<span class="roles-label">${ROLE_NAMES[sel.role]}: ${ROLE_HINT[sel.role]}</span>`
        : `<span class="roles-label">Dica: arqueiro rende mais atrás; quem luta corpo a corpo, na frente.</span>`;
  const placed = mine.filter((u) => u.lane != null).length;
  ($("ready") as HTMLButtonElement).disabled = placed == 0;
  $("ready").textContent = tray.length ? `Pronto (${tray.length} fora do campo vão para o centro)` : "Pronto";

  $("board").querySelectorAll<HTMLElement>(".chip[data-unit]").forEach((c) =>
    c.addEventListener("click", (e) => {
      e.stopPropagation();
      clickUnit(c.dataset.unit as string);
    })
  );
  $("tray").querySelectorAll<HTMLElement>("[data-unit]").forEach((c) => c.addEventListener("click", () => clickUnit(c.dataset.unit as string)));
  $("board").querySelectorAll<HTMLButtonElement>(".cell[data-lane]").forEach((c) =>
    c.addEventListener("click", () => {
      const u = mine.find((x) => x.id == selected);
      if (!u || u.kind == "garrison") return;
      u.lane = Number(c.dataset.lane) as Lane;
      u.row = c.dataset.row as Row;
      selected = null;
      renderBoard();
    })
  );
  $("roles").querySelectorAll<HTMLButtonElement>("[data-role]").forEach((b) =>
    b.addEventListener("click", () => {
      const u = mine.find((x) => x.id == selected);
      if (u) u.role = b.dataset.role as Role;
      renderBoard();
    })
  );
}

function clickUnit(id: string): void {
  const u = units[placingSide].find((x) => x.id == id);
  if (!u) return;
  if (selected == id && u.lane != null) {
    // segundo toque numa peça já no campo: troca para a próxima função
    const roles = rolesFor(u.kind, isSea());
    u.role = roles[(roles.indexOf(u.role) + 1) % roles.length];
  }
  selected = id;
  renderBoard();
}

function finishTurn(): void {
  stopTimer();
  units[placingSide].filter((u) => u.lane == null).forEach((u) => {
    u.lane = FIELD_LANES[config.field][1] == "bloqueado" ? 0 : 1;
  });
  if (config.mode == "cpu") {
    const btn = $<HTMLButtonElement>("ready");
    btn.disabled = true;
    btn.textContent = "O computador está revelando a jogada…";
    // deixa a tela atualizar antes da conta do computador
    window.setTimeout(() => {
      autoPlace(other(placingSide));
      runBattle();
    }, 30);
    return;
  }
  if (placingSide == "attacker") {
    placingSide = "defender";
    $("handoff").hidden = false;
    $("handoff-text").innerHTML = `Passe o aparelho para quem joga com <b>${houseOf("defender").name}</b> (defensor).`;
    return;
  }
  runBattle();
}

// ---------------------------------------------------------------- batalha (conta + animação)
function runBattle(): void {
  $("placement").hidden = true;
  $("battle").hidden = false;
  $("result").hidden = true;
  lastResult = resolveTacticalBattle({
    field: config.field,
    attacker: { squads: toSquads(units.attacker), card: config.attacker.card, orderBonus: config.attacker.order },
    defender: { squads: toSquads(units.defender), card: config.defender.card, orderBonus: config.defender.order }
  });
  battleSeed = Math.floor(Math.random() * 1e9);
  playAnimation();
}

// figuras animadas
interface Fig {
  side: Side;
  lane: Lane;
  role: Role;
  kind: SquadKind;
  x0: number;
  y0: number;
  x: number;
  y: number;
  tx: number; // alvo no choque
  ty: number;
  r: number;
  dieAt: number; // segundos (Infinity = sobrevive)
  flank: boolean;
  jit: number;
}

interface Shot {
  from: [number, number];
  to: [number, number];
  t0: number;
  dur: number;
  kind: "arrow" | "stone" | "fire";
}

let anim: { figs: Fig[]; shots: Shot[]; t: number; speed: number; raf: number | null; last: number; done: boolean } | null = null;
const T_END = 8.2;

function playAnimation(): void {
  const res = lastResult as TacticalBattleResult;
  const canvas = $<HTMLCanvasElement>("battlefield");
  const W = 600;
  const H = 760;
  canvas.width = W * 2;
  canvas.height = H * 2;
  const rand = rng(battleSeed);
  const lanesT = FIELD_LANES[config.field];
  const laneX = (l: number): number => (l + 0.5) * (W / 3);
  const rowY: Record<Side, Record<Row, number>> = {
    attacker: { frente: H * 0.64, tras: H * 0.82 },
    defender: { frente: H * 0.36, tras: H * 0.18 }
  };
  const figs: Fig[] = [];
  const shots: Shot[] = [];

  (["attacker", "defender"] as Side[]).forEach((side) => {
    toSquads(units[side]).forEach((sq) => {
      const sameCell = toSquads(units[side]).filter((o) => o.lane == sq.lane && o.row == sq.row);
      const idx = sameCell.findIndex((o) => o.id == sq.id);
      const n = FIGURES[sq.kind];
      const big = sq.kind == "knight" || sq.kind == "dragon" || sq.kind == "siege-engine" || sq.kind == "garrison";
      const r = big ? 13 : 9.5;
      const spread = Math.min(56, (W / 3 - 30) / Math.max(1, sameCell.length));
      const cx = laneX(sq.lane) + (idx - (sameCell.length - 1) / 2) * spread;
      for (let i = 0; i < n; i++) {
        const x = cx + (i - (n - 1) / 2) * (r * 2.1);
        const y = rowY[side][sq.row] + (i % 2) * 7 * (side == "attacker" ? 1 : -1);
        figs.push({ side, lane: sq.lane, role: sq.role, kind: sq.kind, x0: x, y0: y, x, y, tx: x, ty: y, r, dieAt: Infinity, flank: false, jit: rand() * 6.28 });
      }
    });
  });

  // ninguém se encontrou: todos marcham para o centro e lutam lá
  if (res.metInCenter) figs.forEach((f) => (f.lane = 1));

  // destino de cada figura e baixas, conforme o resultado da conta
  ([0, 1, 2] as Lane[]).forEach((lane) => {
    const L = res.lanes[lane];
    const here = figs.filter((f) => f.lane == lane);
    const contested = L.winner != null;
    const ranged = (f: Fig): boolean => f.role == "arqueiro" || f.role == "flechas" || f.role == "catapulta" || f.role == "torre";
    if (contested) {
      here.forEach((f) => {
        if (ranged(f)) {
          f.tx = f.x0;
          f.ty = f.y0 + (f.side == "attacker" ? -18 : 18);
        } else {
          f.tx = f.x0 + (rand() - 0.5) * 30;
          f.ty = H * 0.5 + (f.side == "attacker" ? 1 : -1) * (14 + rand() * 22);
        }
      });
      const a = L.attackerScore;
      const d = L.defenderScore;
      const lossFor = (side: Side): number => {
        if (L.winner == "tie") return 0.4;
        if (L.winner == side) return Math.min(0.5, 0.15 + 0.5 * (Math.min(a, d) / Math.max(a, d)));
        return 0.85;
      };
      (["attacker", "defender"] as Side[]).forEach((side) => {
        const mine = here.filter((f) => f.side == side);
        const k = Math.round(mine.length * lossFor(side));
        const order = [...mine].sort(() => rand() - 0.5).sort((p, q) => Number(ranged(p)) - Number(ranged(q)));
        order.slice(0, k).forEach((f, i) => (f.dieAt = 3.3 + (i / Math.max(1, k)) * 2.6 + rand() * 0.3));
      });
      // flechas e pedras
      here.filter(ranged).forEach((f) => {
        const targets = here.filter((t) => t.side != f.side);
        for (let t = 1.2; t < 5.6; t += 0.55 + rand() * 0.4) {
          const tg = targets[Math.floor(rand() * targets.length)];
          if (!tg) break;
          shots.push({
            from: [f.x0, f.y0],
            to: [tg.tx, tg.ty],
            t0: t,
            dur: 0.6,
            kind: f.role == "catapulta" ? "stone" : f.role == "dragao" ? "fire" : "arrow"
          });
        }
      });
      here.filter((f) => f.role == "dragao").forEach((f) => {
        for (let t = 2.2; t < 5.5; t += 1.1) shots.push({ from: [f.x0, f.y0], to: [laneX(lane), H * 0.5], t0: t, dur: 0.5, kind: "fire" });
      });
    } else {
      // sozinho na faixa: ataca pelo lado (vai para a faixa vizinha com luta)
      const targets = ([0, 1, 2] as Lane[]).filter((n) => Math.abs(n - lane) == 1 && res.lanes[n].winner != null);
      here.forEach((f, i) => {
        if (targets.length) {
          const n = targets[i % targets.length];
          f.flank = true;
          f.tx = laneX(n) + (n > lane ? -1 : 1) * (W / 3) * 0.32;
          f.ty = H * 0.5 + (f.side == "attacker" ? 1 : -1) * 40;
        } else {
          f.tx = f.x0;
          f.ty = f.y0 + (f.side == "attacker" ? -40 : 40);
        }
      });
    }
  });

  if (anim?.raf) cancelAnimationFrame(anim.raf);
  anim = { figs, shots, t: 0, speed: 1, raf: null, last: performance.now(), done: false };
  setSpeedButtons();
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce) anim.t = T_END;
  const step = (now: number): void => {
    if (!anim) return;
    const dt = Math.min(0.1, (now - anim.last) / 1000);
    anim.last = now;
    anim.t += dt * anim.speed;
    drawField(canvas, W, H, lanesT, res);
    if (anim.t >= T_END) {
      anim.done = true;
      showResult();
      return;
    }
    anim.raf = requestAnimationFrame(step);
  };
  anim.raf = requestAnimationFrame(step);
}

const ease = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

function figPos(f: Fig, t: number): [number, number] {
  // 0–1: entra; 1–3: avança; 3–6: luta; 6+: recua quem perdeu
  const adv = ease((t - 1) / 2);
  let x = f.x0 + (f.tx - f.x0) * adv;
  let y = f.y0 + (f.ty - f.y0) * adv;
  if (t > 3 && t < 6.2 && !f.flank) {
    x += Math.sin(t * 9 + f.jit) * 2.2;
    y += Math.cos(t * 7 + f.jit) * 1.6;
  }
  return [x, y];
}

function drawTerrain(ctx: CanvasRenderingContext2D, x: number, w: number, H: number, t: Terrain, defenderColor: string): void {
  const r = rng(Math.floor(x) + 7);
  const bg: Record<Terrain, string> = {
    aberto: "#6f7a43",
    mata: "#3f5a33",
    colina: "#7a6a45",
    rio: "#68794a",
    vau: "#68794a",
    pantano: "#4e5a3c",
    calcada: "#4e5a3c",
    areia: "#c9a764",
    muralha: "#6c7444",
    portao: "#6c7444",
    bloqueado: "#5d5a55",
    mar: "#2e5671"
  };
  ctx.fillStyle = bg[t];
  ctx.fillRect(x, 0, w, H);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, w, H);
  ctx.clip();
  if (t == "aberto" || t == "muralha" || t == "portao") {
    ctx.strokeStyle = "rgba(255,255,220,.08)";
    for (let i = 0; i < 40; i++) {
      const gx = x + r() * w;
      const gy = r() * H;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 3, gy - 6);
      ctx.stroke();
    }
  }
  if (t == "mata") {
    for (let i = 0; i < 26; i++) {
      const tx = x + r() * w;
      const ty = r() * H;
      if (Math.abs(ty - H / 2) < 60) continue;
      ctx.fillStyle = "rgba(20,40,18,.55)";
      ctx.beginPath();
      ctx.arc(tx, ty, 10 + r() * 10, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(90,130,70,.35)";
      ctx.beginPath();
      ctx.arc(tx - 3, ty - 3, 6 + r() * 6, 0, 7);
      ctx.fill();
    }
  }
  if (t == "colina") {
    ctx.strokeStyle = "rgba(60,40,20,.45)";
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, H * 0.2, w * (0.15 + k * 0.08), H * (0.05 + k * 0.035), 0, 0, 7);
      ctx.stroke();
    }
  }
  if (t == "rio" || t == "vau") {
    ctx.fillStyle = "#3d6f8e";
    ctx.beginPath();
    ctx.moveTo(x, H * 0.46);
    for (let i = 0; i <= 10; i++) ctx.lineTo(x + (w * i) / 10, H * 0.46 + Math.sin(i + x) * 6);
    for (let i = 10; i >= 0; i--) ctx.lineTo(x + (w * i) / 10, H * 0.54 + Math.sin(i + x + 1) * 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(220,240,255,.35)";
    for (let i = 0; i < 8; i++) {
      const wx = x + r() * w;
      ctx.beginPath();
      ctx.moveTo(wx, H * 0.5);
      ctx.lineTo(wx + 12, H * 0.5);
      ctx.stroke();
    }
    if (t == "vau") {
      ctx.fillStyle = "rgba(200,190,160,.85)";
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(x + w * 0.35 + r() * w * 0.3, H * 0.47 + i * 7, 7, 4, 0, 0, 7);
        ctx.fill();
      }
    }
  }
  if (t == "pantano" || t == "calcada") {
    ctx.fillStyle = "rgba(60,80,60,.6)";
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.ellipse(x + r() * w, r() * H, 18 + r() * 20, 7 + r() * 6, 0, 0, 7);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(150,170,100,.6)";
    for (let i = 0; i < 40; i++) {
      const rx = x + r() * w;
      const ry = r() * H;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + (r() - 0.5) * 4, ry - 9);
      ctx.stroke();
    }
    if (t == "calcada") {
      ctx.fillStyle = "#8a7350";
      ctx.fillRect(x + w * 0.42, 0, w * 0.16, H);
      ctx.strokeStyle = "rgba(40,25,10,.5)";
      for (let y = 0; y < H; y += 14) {
        ctx.beginPath();
        ctx.moveTo(x + w * 0.42, y);
        ctx.lineTo(x + w * 0.58, y);
        ctx.stroke();
      }
    }
  }
  if (t == "areia") {
    ctx.strokeStyle = "rgba(140,100,40,.35)";
    ctx.lineWidth = 2;
    for (let k = 0; k < 9; k++) {
      const yy = r() * H;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.quadraticCurveTo(x + w / 2, yy - 18, x + w, yy + 4);
      ctx.stroke();
    }
  }
  if (t == "bloqueado") {
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = i % 2 ? "#4b4842" : "#6f6a61";
      ctx.beginPath();
      const bx = x + r() * w;
      const by = r() * H;
      ctx.moveTo(bx, by - 22);
      ctx.lineTo(bx + 20, by + 12);
      ctx.lineTo(bx - 20, by + 12);
      ctx.fill();
    }
  }
  if (t == "mar") {
    ctx.strokeStyle = "rgba(200,230,255,.25)";
    for (let i = 0; i < 30; i++) {
      const wx = x + r() * w;
      const wy = r() * H;
      ctx.beginPath();
      ctx.arc(wx, wy, 8, 3.6, 5.8);
      ctx.stroke();
    }
  }
  ctx.restore();
  void defenderColor;
}

function drawWall(ctx: CanvasRenderingContext2D, x: number, w: number, H: number, gate: boolean, breachedAt: number, t: number): void {
  const y = H * 0.42;
  const broken = breachedAt < Infinity && t > breachedAt;
  ctx.fillStyle = "#9c968a";
  ctx.strokeStyle = "#4a463f";
  ctx.lineWidth = 2;
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    const sx = x + (w / segs) * i;
    const sw = w / segs - 2;
    const isGap = (gate && (i == 3 || i == 4)) || (broken && (i == 2 || i == 3 || i == 4 || i == 5));
    if (isGap && !(gate && !broken && (i == 3 || i == 4))) continue;
    if (gate && !broken && (i == 3 || i == 4)) {
      ctx.fillStyle = "#5a3b22";
      ctx.fillRect(sx, y - 6, sw, 12);
      ctx.fillStyle = "#9c968a";
      continue;
    }
    ctx.fillRect(sx, y - 9, sw, 18);
    ctx.strokeRect(sx, y - 9, sw, 18);
    ctx.fillRect(sx + 2, y - 15, sw / 3, 6);
    ctx.fillRect(sx + sw - sw / 3 - 2, y - 15, sw / 3, 6);
  }
  if (broken) {
    ctx.fillStyle = "rgba(120,110,100,.8)";
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(x + w * 0.3 + i * (w * 0.05), y + Math.sin(i) * 6, 4, 0, 7);
      ctx.fill();
    }
  }
}

function drawFigGlyph(ctx: CanvasRenderingContext2D, f: Fig, x: number, y: number, ink: string): void {
  ctx.save();
  ctx.translate(x - f.r, y - f.r);
  ctx.scale((f.r * 2) / 24, (f.r * 2) / 24);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const p = new Path2D();
  switch (f.role) {
    case "lanceiro":
      p.moveTo(7, 17);
      p.lineTo(17, 7);
      ctx.stroke(p);
      ctx.beginPath();
      ctx.moveTo(17, 7);
      ctx.lineTo(12.5, 8);
      ctx.lineTo(16, 11.5);
      ctx.fill();
      break;
    case "escudeiro":
      p.moveTo(12, 5);
      p.lineTo(18, 7);
      p.lineTo(18, 12);
      p.bezierCurveTo(18, 15.5, 15, 18, 12, 19.5);
      p.bezierCurveTo(9, 18, 6, 15.5, 6, 12);
      p.lineTo(6, 7);
      p.closePath();
      ctx.stroke(p);
      break;
    case "arqueiro":
    case "flechas":
      p.moveTo(8, 5);
      p.bezierCurveTo(15, 8, 15, 16, 8, 19);
      p.moveTo(6, 12);
      p.lineTo(17, 12);
      ctx.stroke(p);
      break;
    case "cavalaria":
      p.moveTo(6, 16);
      p.lineTo(12, 7);
      p.lineTo(18, 16);
      p.moveTo(9, 13);
      p.lineTo(15, 13);
      ctx.stroke(p);
      break;
    case "batedores":
      p.moveTo(6, 12);
      p.lineTo(17, 12);
      p.moveTo(13, 8);
      p.lineTo(17, 12);
      p.lineTo(13, 16);
      ctx.stroke(p);
      break;
    case "catapulta":
      p.moveTo(6, 17);
      p.lineTo(18, 17);
      p.moveTo(9, 17);
      p.lineTo(12, 11);
      p.lineTo(15, 17);
      p.moveTo(12, 11);
      p.lineTo(17, 6);
      ctx.stroke(p);
      break;
    case "dragao":
      ctx.beginPath();
      ctx.moveTo(4, 14);
      ctx.lineTo(12, 7);
      ctx.lineTo(20, 14);
      ctx.lineTo(15, 12);
      ctx.lineTo(12, 17);
      ctx.lineTo(9, 12);
      ctx.fill();
      break;
    case "torre":
      p.rect(7, 8, 10, 10);
      p.moveTo(7, 8);
      p.lineTo(7, 6);
      p.moveTo(12, 8);
      p.lineTo(12, 6);
      p.moveTo(17, 8);
      p.lineTo(17, 6);
      ctx.stroke(p);
      break;
    case "ariete":
      p.moveTo(5, 14);
      p.lineTo(15, 14);
      p.lineTo(19, 12);
      p.lineTo(15, 10);
      p.lineTo(5, 10);
      ctx.stroke(p);
      break;
    case "abordagem":
      p.moveTo(7, 17);
      p.lineTo(17, 7);
      p.moveTo(7, 7);
      p.lineTo(17, 17);
      ctx.stroke(p);
      break;
  }
  ctx.restore();
}

function drawField(canvas: HTMLCanvasElement, W: number, H: number, lanesT: [Terrain, Terrain, Terrain], res: TacticalBattleResult): void {
  if (!anim) return;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const t = anim.t;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  const lw = W / 3;
  lanesT.forEach((tt, i) => drawTerrain(ctx, i * lw, lw, H, tt, houseOf("defender").color));
  // divisórias
  ctx.strokeStyle = "rgba(20,16,10,.55)";
  ctx.lineWidth = 2;
  [1, 2].forEach((i) => {
    ctx.beginPath();
    ctx.moveTo(i * lw, 0);
    ctx.lineTo(i * lw, H);
    ctx.stroke();
  });
  // nome do terreno de cada faixa e das Casas
  const tag = (text: string, cx: number, y: number, bg: string, ink: string): void => {
    ctx.font = "700 17px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tw = ctx.measureText(text).width + 16;
    ctx.fillStyle = bg;
    ctx.fillRect(cx - tw / 2, y - 12, tw, 24);
    ctx.strokeStyle = "rgba(0,0,0,.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - tw / 2, y - 12, tw, 24);
    ctx.fillStyle = ink;
    ctx.fillText(text, cx, y + 1);
  };
  lanesT.forEach((tt, i) => tag(TERRAIN_NAMES[tt], i * lw + lw / 2, 18, "rgba(15,12,8,.7)", "#efe3c6"));
  tag(`${houseOf("defender").name} defende`, W / 2, 50, houseOf("defender").color, houseOf("defender").ink);
  tag(`${houseOf("attacker").name} ataca`, W / 2, H - 18, houseOf("attacker").color, houseOf("attacker").ink);
  // muralhas
  lanesT.forEach((tt, i) => {
    if (tt == "muralha" || tt == "portao") {
      const hasCat = anim?.figs.some((f) => f.lane == i && f.role == "catapulta" && f.side == "attacker");
      drawWall(ctx, i * lw, lw, H, tt == "portao", hasCat ? 3.2 : Infinity, t);
    }
  });
  // figuras
  const dying = (f: Fig): number => (t < f.dieAt ? 0 : Math.min(1, (t - f.dieAt) / 0.5));
  const appear = ease(t / 0.8);
  [...anim.figs]
    .sort((a, b) => a.y - b.y)
    .forEach((f) => {
      const [x, y] = figPos(f, t);
      f.x = x;
      f.y = y;
      const d = dying(f);
      const h = houseOf(f.side);
      // derrotados recuam
      let ry = 0;
      const L = res.lanes[f.lane];
      if (t > 6.2 && L.winner && L.winner != "tie" && L.winner != f.side && d == 0) ry = (f.side == "attacker" ? 1 : -1) * ease((t - 6.2) / 1.4) * 70;
      ctx.globalAlpha = appear * (1 - d * 0.75);
      const rr = f.r * (1 - d * 0.35);
      // sombra
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.beginPath();
      ctx.ellipse(x + 2, y + ry + rr * 0.8, rr * 0.9, rr * 0.4, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = d > 0 ? "#57534d" : h.color;
      ctx.strokeStyle = "rgba(0,0,0,.6)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y + ry, rr, 0, 7);
      ctx.fill();
      ctx.stroke();
      if (f.kind == "dragon") {
        ctx.strokeStyle = h.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - rr * 2.2, y + ry - rr * 0.2 + Math.sin(t * 8) * 4);
        ctx.lineTo(x, y + ry);
        ctx.lineTo(x + rr * 2.2, y + ry - rr * 0.2 + Math.sin(t * 8) * 4);
        ctx.stroke();
      }
      drawFigGlyph(ctx, f, x, y + ry, d > 0 ? "#2b2926" : h.ink);
      ctx.globalAlpha = 1;
    });
  // disparos
  anim.shots.forEach((s) => {
    const p = (t - s.t0) / s.dur;
    if (p < 0 || p > 1) return;
    const x = s.from[0] + (s.to[0] - s.from[0]) * p;
    const arc = s.kind == "stone" ? 60 : 30;
    const y = s.from[1] + (s.to[1] - s.from[1]) * p - Math.sin(p * Math.PI) * arc;
    if (s.kind == "arrow") {
      ctx.strokeStyle = "#f3ead2";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - (s.to[0] - s.from[0]) * 0.05, y - (s.to[1] - s.from[1]) * 0.05);
      ctx.stroke();
    } else if (s.kind == "stone") {
      ctx.fillStyle = "#3b3833";
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, 7);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(255,${120 + Math.floor(p * 80)},40,${0.85 - p * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, 6 + p * 16, 0, 7);
      ctx.fill();
    }
  });
  // faíscas no choque
  if (t > 3 && t < 6) {
    res.lanes.forEach((L, i) => {
      if (L.winner == null) return;
      const rr = rng(Math.floor(t * 12) + i * 97);
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = "rgba(255,240,200,.85)";
        ctx.beginPath();
        ctx.arc(i * lw + lw * (0.25 + rr() * 0.5), H * 0.5 + (rr() - 0.5) * 30, 1.5 + rr() * 2, 0, 7);
        ctx.fill();
      }
    });
  }
  // faixa: quem venceu
  if (t > 6.4) {
    res.lanes.forEach((L, i) => {
      if (L.winner == null) return;
      const a = ease((t - 6.4) / 0.6);
      ctx.globalAlpha = a;
      const label = L.winner == "tie" ? "EMPATE" : `${houseOf(L.winner).name.toUpperCase()}`;
      const col = L.winner == "tie" ? "#2a2722" : houseOf(L.winner).color;
      const ink = L.winner == "tie" ? "#f1e7d0" : houseOf(L.winner).ink;
      ctx.font = "700 19px 'Alegreya Sans', 'Trebuchet MS', sans-serif";
      const tw = ctx.measureText(label).width + 22;
      const bx = i * lw + lw / 2 - tw / 2;
      ctx.fillStyle = col;
      ctx.fillRect(bx, H / 2 - 16, tw, 32);
      ctx.strokeStyle = "rgba(0,0,0,.5)";
      ctx.strokeRect(bx, H / 2 - 16, tw, 32);
      ctx.fillStyle = ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, i * lw + lw / 2, H / 2 + 1);
      ctx.globalAlpha = 1;
    });
  }
}

function setSpeedButtons(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-speed]").forEach((b) => b.classList.toggle("on", Number(b.dataset.speed) == (anim?.speed ?? 1)));
}

// ---------------------------------------------------------------- resultado e resumo
function factorText(f: LaneFactor): string | null {
  const who = houseOf(f.side).name;
  switch (f.kind) {
    case "counter":
      return f.role && f.vs ? `${who}: ${ROLE_PLURAL[f.role]} renderam bem contra ${ROLE_PLURAL[f.vs]}` : null;
    case "weak":
      return f.role && f.vs ? `${who}: ${ROLE_PLURAL[f.role]} sofreram contra ${ROLE_PLURAL[f.vs]}` : null;
    case "wall":
      return `${who}: a muralha protegeu quem defende`;
    case "wall-breach":
      return `${who}: a catapulta derrubou a muralha`;
    case "flank":
      return `${who}: ganhou ajuda pelo lado (flanco)`;
    case "screen":
      return `${who}: a linha da frente protegeu a retaguarda da cavalaria inimiga`;
    case "empty":
      return `${who}: ficou sozinho nesta faixa e foi ajudar ao lado`;
    default:
      return null;
  }
}

function showResult(): void {
  const res = lastResult as TacticalBattleResult;
  const lanesT = FIELD_LANES[config.field];
  const head = res.winner
    ? `<span class="swatch" style="background:${houseOf(res.winner).color}"></span>${houseOf(res.winner).name} vence o mini-mapa: <b>+${res.bonus}</b> na batalha`
    : "Empate no mini-mapa: ninguém ganha bônus";
  const sub = res.winner
    ? `Venceu ${res.lanesWon[res.winner]} de ${res.lanes.filter((l) => l.winner != null).length} faixa(s) com luta${res.bonus == 2 ? " (todas)" : ""}.`
    : "As faixas ficaram iguais.";
  const centerNote = res.metInCenter
    ? `<p class="res-note">Ninguém se encontrou nas faixas escolhidas, então os exércitos marcharam e lutaram no centro (cada um com a linha e a função que escolheu).</p>`
    : "";
  const lanesHtml = res.lanes
    .map((L, i) => {
      const facts = [...new Set(L.factors.map(factorText).filter((x): x is string => !!x))].slice(0, 4);
      const tot = L.attackerScore + L.defenderScore || 1;
      const outcome =
        L.blocked
          ? "Faixa fechada"
          : L.winner == null
            ? "Sem luta nesta faixa"
            : L.winner == "tie"
              ? "Empate"
              : `${houseOf(L.winner).name} venceu`;
      return `<li class="lane-res">
        <div class="lr-head"><b>${["Esquerda", "Centro", "Direita"][i]} · ${TERRAIN_NAMES[lanesT[i]]}</b><span>${outcome}</span></div>
        ${
          L.winner != null
            ? `<div class="bar" role="img" aria-label="força ${L.attackerScore.toFixed(1)} contra ${L.defenderScore.toFixed(1)}">
            <span style="width:${(L.attackerScore / tot) * 100}%;background:${houseOf("attacker").color}"></span>
            <span style="width:${(L.defenderScore / tot) * 100}%;background:${houseOf("defender").color}"></span>
          </div>
          <div class="bar-nums"><span>${houseOf("attacker").name} ${L.attackerScore.toFixed(1)}</span><span>${L.defenderScore.toFixed(1)} ${houseOf("defender").name}</span></div>`
            : ""
        }
        ${facts.length ? `<ul class="facts">${facts.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
      </li>`;
    })
    .join("");
  $("result").innerHTML = `
    <h2 class="res-title">${head}</h2>
    <p class="res-sub">${sub}</p>
    ${centerNote}
    <ol class="lanes-res">${lanesHtml}</ol>
    <div class="res-actions">
      <button type="button" class="btn" id="replay">Ver a luta de novo</button>
      <button type="button" class="btn primary" id="again">Jogar de novo (mesmos exércitos)</button>
      <button type="button" class="btn" id="change">Mudar a batalha</button>
    </div>`;
  $("result").hidden = false;
  $("replay").addEventListener("click", () => {
    $("result").hidden = true;
    playAnimation();
  });
  $("again").addEventListener("click", startPlacement);
  $("change").addEventListener("click", () => {
    $<HTMLDetailsElement>("setup").open = true;
    $("setup").scrollIntoView({ behavior: "smooth" });
  });
}

// ---------------------------------------------------------------- início
function init(): void {
  renderSetup();
  $("ready").addEventListener("click", finishTurn);
  $("auto").addEventListener("click", () => {
    autoPlace(placingSide);
    selected = null;
    renderBoard();
  });
  $("clear").addEventListener("click", () => {
    units[placingSide].forEach((u) => {
      if (u.kind != "garrison") u.lane = null;
    });
    selected = null;
    renderBoard();
  });
  $("handoff-go").addEventListener("click", () => {
    $("handoff").hidden = true;
    beginTurn();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-speed]").forEach((b) =>
    b.addEventListener("click", () => {
      if (anim) anim.speed = Number(b.dataset.speed);
      setSpeedButtons();
    })
  );
  $("skip").addEventListener("click", () => {
    if (anim && !anim.done) anim.t = T_END - 0.01;
  });
  startPlacement();
}

document.addEventListener("DOMContentLoaded", init);
