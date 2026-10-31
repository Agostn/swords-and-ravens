/**
 * Mesa de Batalha (combate tático) no painel da partida: mostra quem já posicionou e abre a Mesa
 * (por cima do mapa) para quem precisa jogar agora.
 */
import { observer } from "mobx-react";
import { observable } from "mobx";
import React, { Component, ReactNode } from "react";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import GameStateComponentProps from "./GameStateComponentProps";
import TacticalBattleGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/tactical-battle-game-state/TacticalBattleGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import MesaFrame, { MesaMessage } from "../tactical-battle/MesaFrame";
import { PlacedSquad } from "../../common/tactical-battle/tacticalSetup";
import { Squad } from "../../common/tactical-battle/tacticalBattle";
import { Tactic } from "../../common/tactical-battle/tacticalBattleData";
import { t, tr } from "../i18n/i18n";

export function mesaHouse(h: House): { id: string; name: string; color: string } {
  return { id: h.id, name: h.name, color: h.color };
}

@observer
export default class TacticalBattleComponent extends Component<GameStateComponentProps<TacticalBattleGameState>> {
  @observable open = true;
  /** já mandei (esperando o servidor confirmar) */
  @observable sent: string[] = [];

  get gs(): TacticalBattleGameState {
    return this.props.gameState;
  }

  /** casa que eu comando e que precisa jogar agora (ou null) */
  get actingHouse(): House | null {
    const gs = this.gs;
    const client = this.props.gameClient;
    if (gs.phase == "place")
      return gs.houses.find((h) => client.doesControlHouse(h) && !gs.submitted.includes(h) && !this.sent.includes(h.id)) ?? null;
    const raven = gs.ravenHouse;
    if (raven && client.doesControlHouse(raven) && !this.sent.includes(`react:${raven.id}`)) return raven;
    return null;
  }

  startFor(house: House): Record<string, unknown> {
    const gs = this.gs;
    const [attacker, defender] = gs.houses;
    const combat = gs.combat;
    const base = {
      side: gs.sideOf(house),
      field: gs.field,
      houses: { attacker: mesaHouse(attacker), defender: mesaHouse(defender) },
      pieces: { attacker: gs.pieces.tryGet(attacker, []), defender: gs.pieces.tryGet(defender, []) },
      totals: {
        attacker: Math.max(0, combat.getTotalCombatStrength(attacker)),
        defender: Math.max(0, combat.getTotalCombatStrength(defender))
      },
      bladeSide: gs.sideOf(gs.bladeHouse)
    };
    if (gs.phase == "place") return { ...base, mode: "place" };
    return {
      ...base,
      mode: "react",
      squads: { attacker: gs.squads.tryGet(attacker, []), defender: gs.squads.tryGet(defender, []) }
    };
  }

  onMesaMessage(house: House, msg: MesaMessage): void {
    if (msg.type == "tb-submit" && this.gs.phase == "place") {
      this.sent.push(house.id);
      this.gs.submit(house, (msg.squads as PlacedSquad[]) ?? [], (msg.tactic as Tactic | null) ?? null);
    } else if (msg.type == "tb-react" && this.gs.phase == "react") {
      this.sent.push(`react:${house.id}`);
      const mine = this.gs.squads.tryGet(house, []);
      const sent = (msg.squads as { id: string; role: Squad["role"]; lane: Squad["lane"]; row: Squad["row"] }[]) ?? [];
      this.gs.react(
        house,
        mine.map((s) => {
          const x = sent.find((q) => q.id == s.id);
          return x ? { ...s, role: x.role, lane: x.lane, row: x.row } : s;
        })
      );
    } else if (msg.type == "tb-hide" || msg.type == "tb-close") {
      this.open = false;
    }
  }

  render(): ReactNode {
    const gs = this.gs;
    const acting = this.actingHouse;
    const status = (h: House): string =>
      gs.phase == "react" ? t("tactical.status.done") : gs.submitted.includes(h) ? t("tactical.status.done") : t("tactical.status.placing");
    return (
      <>
        <Col xs={12} className="text-center">
          <h5 style={{ marginBottom: 4 }}>{t("tactical.title")}</h5>
          <div>
            {gs.houses.map((h) => (
              <div key={`tb-${h.id}`}>
                <b style={{ color: h.color }}>{h.name}</b>: {status(h)}
              </div>
            ))}
          </div>
          {gs.phase == "react" && gs.ravenHouse ? (
            <div className="mt-1">{tr("tactical.raven", { p0: <b>{gs.ravenHouse.name}</b> })}</div>
          ) : null}
        </Col>
        {acting ? (
          <Col xs={12} className="text-center mt-2">
            <Button type="button" variant="success" onClick={() => (this.open = true)}>
              {gs.phase == "react" ? t("tactical.openRaven") : t("tactical.open")}
            </Button>
          </Col>
        ) : null}
        {acting && this.open ? (
          <MesaFrame
            key={`mesa-${acting.id}-${gs.phase}`}
            start={this.startFor(acting)}
            onMessage={(m) => this.onMesaMessage(acting, m)}
            onHide={() => (this.open = false)}
          />
        ) : null}
      </>
    );
  }
}
