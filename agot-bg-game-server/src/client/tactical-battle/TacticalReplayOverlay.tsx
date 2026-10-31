/**
 * Mesa de Batalha: todos assistem à luta quando tudo já foi decidido (vencedor e quem morreu).
 */
import { observer } from "mobx-react";
import React, { Component, ReactNode } from "react";
import IngameGameState from "../../common/ingame-game-state/IngameGameState";
import CombatGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/CombatGameState";
import { TacticalOutcome } from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/tactical-battle-game-state/TacticalBattleGameState";
import { AnyGameState } from "../../common/GameState";
import MesaFrame from "./MesaFrame";
import { mesaHouse } from "../game-state-panel/TacticalBattleComponent";

interface Props {
  ingame: IngameGameState;
}

@observer
export default class TacticalReplayOverlay extends Component<Props> {
  /** a batalha ainda aberta (para os números da carta e das espadas), se houver */
  get combat(): CombatGameState | null {
    let gs: AnyGameState | null = this.props.ingame.entireGame.leafState;
    while (gs) {
      if (gs instanceof CombatGameState) return gs;
      gs = (gs as { parentGameState?: AnyGameState }).parentGameState ?? null;
    }
    return null;
  }

  startFor(r: TacticalOutcome): Record<string, unknown> {
    const game = this.props.ingame.game;
    const attacker = game.houses.get(r.attackerId);
    const defender = game.houses.get(r.defenderId);
    const winner = r.winnerId == attacker.id ? "attacker" : "defender";
    const combat = this.combat;
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
    return {
      mode: "replay",
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
      towers: sameCombat ? sameCombat.getHouseCardTowerIcons(loserHouse) : 0
    };
  }

  /** a luta é montada uma vez só (a batalha some do jogo durante a animação e os números não podem mudar) */
  cached: { r: TacticalOutcome; start: Record<string, unknown> } | null = null;

  render(): ReactNode {
    const r = this.props.ingame.tacticalReplay;
    if (!r) return null;
    if (!this.cached || this.cached.r !== r) this.cached = { r, start: this.startFor(r) };
    const start = this.cached.start;
    const close = (): void => {
      this.props.ingame.tacticalReplay = null;
    };
    return (
      <MesaFrame
        key={`replay-${r.attackerId}-${r.defenderId}-${r.winnerId}-${r.killed.join(",")}`}
        start={start}
        onMessage={(m) => {
          if (m.type == "tb-close" || m.type == "tb-hide") close();
        }}
        onHide={close}
      />
    );
  }
}
