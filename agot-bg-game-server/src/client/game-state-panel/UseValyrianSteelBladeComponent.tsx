import { observer } from "mobx-react";
import UseValyrianSteelBladeGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/use-valyrian-steel-blade-game-state/UseValyrianSteelBladeGameState";
import { Component, ReactNode } from "react";
import React from "react";
import GameStateComponentProps from "./GameStateComponentProps";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { Alert } from "react-bootstrap";
import { t, tr } from "../i18n/i18n";

@observer
export default class UseValyrianSteelBladeComponent extends Component<
  GameStateComponentProps<UseValyrianSteelBladeGameState>
> {
  get gameState(): UseValyrianSteelBladeGameState {
    return this.props.gameState;
  }
  get house(): House {
    return this.gameState.house;
  }
  render(): ReactNode {
    // Because of the house card flip animation, there
    // may be no house cards set client side yet.
    // So we determine when house cards are finally revealed.
    // This is the case when one house card is not null.
    // The other may be null here, e.g. due to Tyrion Lannister's ability.
    const houseCardsAreRevealed =
      this.gameState.combatGameState.houseCombatDatas.entries.some(
        ([_, hcd]) => hcd.houseCard != null
      );
    return this.gameState.combatGameState.stats.length > 0 ? (
      <></>
    ) : (
      <>
        <Col xs={12} className="text-center">
          {tr("auto.game-state-panel.UseValyrianSteelBladeComponent.0", { p0: (this.house.name), p1: (this.gameState.forNewTidesOfBattleCard
            ? t("auto2.game-state-panel.UseValyrianSteelBladeComponent.0")
            : t("auto2.game-state-panel.UseValyrianSteelBladeComponent.1")) })}</Col>
        <Col xs={12}>
          {this.props.gameClient.doesControlHouse(this.house) ? (
            <>
              {
                // In case this state is not shown for a new ToB card,
                // but it actually could be skipped as the +1 bonus won't
                // change the outcome of the battle, we show a warning.
                houseCardsAreRevealed &&
                !this.gameState.forNewTidesOfBattleCard &&
                // Mesa de Batalha: o +1 sempre muda a chance, então não avisa que "não muda nada"
                !this.gameState.entireGame.gameSettings.tacticalCombat &&
                this.gameState.canBeSkipped(this.house).canBeSkipped ? (
                  <Row className="justify-content-center">
                    <Col xs="auto">
                      <Alert
                        variant="warning"
                        className="text-center pl-2 pt-1 pr-2 pb-2"
                      >
                        {tr("auto.game-state-panel.UseValyrianSteelBladeComponent.1")}
                      </Alert>
                    </Col>
                  </Row>
                ) : houseCardsAreRevealed &&
                  !this.gameState.forNewTidesOfBattleCard &&
                  this.gameState.canBeSkipped(this.house).forcedByHouseCard ? (
                  <Row className="justify-content-center">
                    <Col xs="auto">
                      <Alert
                        variant="warning"
                        className="text-center pl-2 pt-1 pr-2 pb-2"
                      >
                        {tr("auto.game-state-panel.UseValyrianSteelBladeComponent.2")}
                      </Alert>
                    </Col>
                  </Row>
                ) : null
              }
              <Row className="justify-content-center">
                <Col xs="auto">
                  <Button
                    type="button"
                    variant="success"
                    onClick={() => this.choose(true)}
                    disabled={!houseCardsAreRevealed}
                  >
                    {t("auto.game-state-panel.UseValyrianSteelBladeComponent.3")}</Button>
                </Col>
                <Col xs="auto">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => this.choose(false)}
                    disabled={!houseCardsAreRevealed}
                  >
                    {t("auto.game-state-panel.UseValyrianSteelBladeComponent.4")}</Button>
                </Col>
              </Row>
            </>
          ) : (
            <div className="text-center">
              {tr("auto.game-state-panel.UseValyrianSteelBladeComponent.5", { p0: (this.gameState.ingame.getControllerOfHouse(this.house).house
                  .name) })}</div>
          )}
        </Col>
      </>
    );
  }

  choose(use: boolean): void {
    this.props.gameState.choose(use);
  }
}
