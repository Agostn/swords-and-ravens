/**
 * Mesa de Batalha: UMA tela que fica aberta do começo ao fim da batalha (31/out: antes ela fechava depois de
 * posicionar e abria de novo para o Corvo e para a luta). Ela só passa de etapa:
 *   posicionar → esperar o outro → (Corvo) → esperar as baixas → assistir à luta → voltar ao mapa.
 * Dá para minimizar (vira um botão no canto); a próxima etapa abre sozinha.
 * Quem não está na batalha só vê a luta no fim.
 */
import { observer } from "mobx-react";
import React, { Component, ReactNode } from "react";
import IngameGameState from "../../common/ingame-game-state/IngameGameState";
import CombatGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/CombatGameState";
import TacticalBattleGameState, {
  TacticalOutcome
} from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/tactical-battle-game-state/TacticalBattleGameState";
import { AnyGameState } from "../../common/GameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import GameClient from "../GameClient";
import MesaFrame from "./MesaFrame";
import { mesaUi } from "./mesaUi";

interface Props {
  ingame: IngameGameState;
  gameClient: GameClient;
}

export function mesaHouse(h: House): { id: string; name: string; color: string } {
  return { id: h.id, name: h.name, color: h.color };
}

interface Step {
  key: string;
  start: Record<string, unknown>;
  /** a etapa começa minimizada (ex.: esperando as baixas, que são escolhidas no mapa) */
  startsMinimized?: boolean;
  /** texto do botão quando minimizada */
  pill: string;
}

@observer
export default class TacticalReplayOverlay extends Component<Props> {
  /** a luta é montada uma vez só (a batalha some do jogo durante a animação e os números não podem mudar) */
  cachedReplay: { r: TacticalOutcome; start: Record<string, unknown> } | null = null;
  /** batalha em que eu estava na Mesa (para a etapa "esperando as baixas") */
  myCombat: CombatGameState | null = null;
  myCombatInfo: { base: Record<string, unknown>; steps: string[] } | null = null;

  get leaf(): AnyGameState {
    return this.props.ingame.entireGame.leafState;
  }

  combatOf(gs: AnyGameState): CombatGameState | null {
    let g: AnyGameState | null = gs;
    while (g) {
      if (g instanceof CombatGameState) return g;
      g = (g as { parentGameState?: AnyGameState }).parentGameState ?? null;
    }
    return null;
  }

  stepNames(tb: TacticalBattleGameState): string[] {
    return tb.ravenHouse ? ["Posicionar", "Corvo", "Luta"] : ["Posicionar", "Luta"];
  }

  baseFor(tb: TacticalBattleGameState, side: "attacker" | "defender"): Record<string, unknown> {
    const [attacker, defender] = tb.houses;
    const combat = tb.combat;
    return {
      side,
      field: tb.field,
      houses: { attacker: mesaHouse(attacker), defender: mesaHouse(defender) },
      pieces: { attacker: tb.pieces.tryGet(attacker, []), defender: tb.pieces.tryGet(defender, []) },
      totals: {
        attacker: Math.max(0, combat.getTotalCombatStrength(attacker)),
        defender: Math.max(0, combat.getTotalCombatStrength(defender))
      },
      bladeSide: tb.sideOf(tb.bladeHouse)
    };
  }

  /** etapa da Mesa para quem está na batalha (ou null) */
  battleStep(tb: TacticalBattleGameState): Step | null {
    const client = this.props.gameClient;
    const mine = tb.houses.filter((h) => client.doesControlHouse(h));
    if (!mine.length) return null;
    const steps = this.stepNames(tb);
    const id = `${tb.combat.attacker.id}-${tb.combat.defender.id}-${tb.field}`;
    const other = (h: House): House => (h == tb.houses[0] ? tb.houses[1] : tb.houses[0]);
    if (tb.phase == "place") {
      const todo = mine.find((h) => !tb.submitted.includes(h));
      if (todo) {
        const base = this.baseFor(tb, tb.sideOf(todo));
        this.rememberCombat(tb, base, steps);
        return { key: `${id}:place:${todo.id}`, start: { ...base, mode: "place", steps, step: 0 }, pill: "⚔ Posicione suas tropas" };
      }
      const me = mine[0];
      const base = this.baseFor(tb, tb.sideOf(me));
      this.rememberCombat(tb, base, steps);
      return {
        key: `${id}:place-wait`,
        start: { ...base, mode: "wait", steps, step: 0, text: `Sua Mesa foi enviada. Aguardando ${other(me).name} posicionar…` },
        pill: `⚔ Aguardando ${other(me).name}`
      };
    }
    const raven = tb.ravenHouse;
    const me = raven && mine.includes(raven) ? raven : mine[0];
    const base = this.baseFor(tb, tb.sideOf(me));
    this.rememberCombat(tb, base, steps);
    if (raven && client.doesControlHouse(raven)) {
      return {
        key: `${id}:react`,
        start: { ...base, mode: "react", steps, step: 1, squads: { attacker: tb.squads.tryGet(tb.houses[0], []), defender: tb.squads.tryGet(tb.houses[1], []) } },
        pill: "✉ Corvo: veja o exército do outro"
      };
    }
    return {
      key: `${id}:react-wait`,
      start: {
        ...base,
        mode: "wait",
        steps,
        step: 1,
        text: `${raven ? raven.name : "O outro lado"} tem o Corvo Mensageiro: está vendo onde está o seu exército e pode mudar 1 esquadrão.`,
        sub: "Aguarde: a luta começa logo depois."
      },
      pill: "✉ Corvo do outro lado"
    };
  }

  rememberCombat(tb: TacticalBattleGameState, base: Record<string, unknown>, steps: string[]): void {
    this.myCombat = tb.combat;
    this.myCombatInfo = { base, steps };
  }

  replayStart(r: TacticalOutcome): Record<string, unknown> {
    const game = this.props.ingame.game;
    const attacker = game.houses.get(r.attackerId);
    const defender = game.houses.get(r.defenderId);
    const winner = r.winnerId == attacker.id ? "attacker" : "defender";
    const combat = this.combatOf(this.leaf);
    const sameCombat = combat && combat.attacker == attacker && combat.defender == defender ? combat : null;
    const stat = (id: string): Record<string, number> | null => {
      const s = sameCombat?.stats.find((x) => x.house == id);
      if (!s) return null;
      return {
        tropas: s.army + s.garrison,
        carta: s.houseCardStrength,
        ordem: s.orderBonus,
        apoio: s.support,
        mini: s.valyrianSteelBlade + (s.total - (s.army + s.garrison + s.houseCardStrength + s.orderBonus + s.support + s.valyrianSteelBlade)),
        total: s.total
      };
    };
    const a = stat(attacker.id);
    const d = stat(defender.id);
    const winnerHouse = winner == "attacker" ? attacker : defender;
    const loserHouse = winner == "attacker" ? defender : attacker;
    const client = this.props.gameClient;
    const mySide = client.doesControlHouse(attacker) ? "attacker" : client.doesControlHouse(defender) ? "defender" : undefined;
    const steps = this.myCombatInfo?.steps;
    return {
      mode: "replay",
      side: mySide,
      field: r.field,
      houses: { attacker: mesaHouse(attacker), defender: mesaHouse(defender) },
      pieces: { attacker: [], defender: [] },
      totals: r.totals,
      bladeSide: winner,
      squads: r.squads,
      result: r.result,
      killed: r.killed,
      winner,
      board: a && d ? { attacker: a, defender: d } : undefined,
      swords: sameCombat ? sameCombat.getHouseCardSwordIcons(winnerHouse) : 0,
      towers: sameCombat ? sameCombat.getHouseCardTowerIcons(loserHouse) : 0,
      steps: mySide ? steps : undefined,
      step: steps ? steps.length - 1 : undefined
    };
  }

  currentStep(): Step | null {
    const r = this.props.ingame.tacticalReplay;
    if (r) {
      if (!this.cachedReplay || this.cachedReplay.r !== r) this.cachedReplay = { r, start: this.replayStart(r) };
      return { key: `replay:${r.attackerId}-${r.defenderId}-${r.killed.join(",")}`, start: this.cachedReplay.start, pill: "⚔ Ver a luta" };
    }
    const leaf = this.leaf;
    if (leaf instanceof TacticalBattleGameState) {
      const step = this.battleStep(leaf);
      if (step) return step;
    }
    // a Mesa já decidiu: o perdedor escolhe as baixas no mapa (por isso começa minimizada); a luta vem depois
    if (this.myCombat && this.myCombatInfo && this.combatOf(leaf) === this.myCombat && !(leaf instanceof TacticalBattleGameState)) {
      const steps = this.myCombatInfo.steps;
      return {
        key: "decided",
        startsMinimized: true,
        start: {
          ...this.myCombatInfo.base,
          mode: "wait",
          steps,
          step: steps.length - 1,
          text: "A Mesa decidiu a batalha! Agora as baixas são escolhidas no mapa.",
          sub: "A luta aparece aqui assim que tudo for decidido."
        },
        pill: "⚔ Mesa decidida: a luta já vem"
      };
    }
    this.myCombat = null;
    this.myCombatInfo = null;
    return null;
  }

  render(): ReactNode {
    const step = this.currentStep();
    if (!step) return null;
    const minimized = step.startsMinimized
      ? mesaUi.openKey != step.key
      : mesaUi.minKey == step.key;
    const minimize = (): void => {
      mesaUi.minKey = step.key;
      mesaUi.openKey = "";
    };
    const open = (): void => {
      mesaUi.minKey = "";
      mesaUi.openKey = step.key;
    };
    return (
      <MesaFrame
        start={step.start}
        minimized={minimized}
        pill={step.pill}
        onOpen={open}
        onHide={minimize}
        onMessage={(m) => {
          if (m.type == "tb-hide") minimize();
          else if (m.type == "tb-close") {
            this.props.ingame.tacticalReplay = null;
            this.myCombat = null;
            this.myCombatInfo = null;
          } else if (m.type == "tb-submit" || m.type == "tb-react") this.sendToServer(m);
        }}
      />
    );
  }

  sendToServer(m: { type: string; [k: string]: unknown }): void {
    const leaf = this.leaf;
    if (!(leaf instanceof TacticalBattleGameState)) return;
    const client = this.props.gameClient;
    if (m.type == "tb-submit" && leaf.phase == "place") {
      const house = leaf.houses.find((h) => leaf.sideOf(h) == m.side && client.doesControlHouse(h));
      if (house) leaf.submit(house, (m.squads as never) ?? [], (m.tactic as never) ?? null);
    } else if (m.type == "tb-react" && leaf.phase == "react" && leaf.ravenHouse && client.doesControlHouse(leaf.ravenHouse)) {
      const raven = leaf.ravenHouse;
      const sent = (m.squads as { id: string; role: never; lane: never; row: never }[]) ?? [];
      leaf.react(
        raven,
        leaf.squads.tryGet(raven, []).map((s) => {
          const x = sent.find((q) => q.id == s.id);
          return x ? { ...s, role: x.role, lane: x.lane, row: x.row } : s;
        })
      );
    }
  }
}
