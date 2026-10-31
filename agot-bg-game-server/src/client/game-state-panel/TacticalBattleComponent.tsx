/**
 * Mesa de Batalha (combate evoluído) no painel da partida: quem já posicionou e um botão para abrir a Mesa.
 * A Mesa em si é uma tela só, aberta do começo ao fim da batalha (tactical-battle/TacticalReplayOverlay.tsx).
 */
import { observer } from "mobx-react";
import React, { Component, ReactNode } from "react";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import GameStateComponentProps from "./GameStateComponentProps";
import TacticalBattleGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/tactical-battle-game-state/TacticalBattleGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { openMesa } from "../tactical-battle/mesaUi";
import { t, tr } from "../i18n/i18n";

@observer
export default class TacticalBattleComponent extends Component<GameStateComponentProps<TacticalBattleGameState>> {
  get gs(): TacticalBattleGameState {
    return this.props.gameState;
  }

  render(): ReactNode {
    const gs = this.gs;
    const client = this.props.gameClient;
    const inBattle = gs.houses.some((h) => client.doesControlHouse(h));
    const status = (h: House): string =>
      gs.phase == "react" || gs.submitted.includes(h) ? t("tactical.status.done") : t("tactical.status.placing");
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
        {inBattle ? (
          <Col xs={12} className="text-center mt-2">
            <Button type="button" variant="success" onClick={() => openMesa()}>
              {t("tactical.open")}
            </Button>
          </Col>
        ) : null}
      </>
    );
  }
}
