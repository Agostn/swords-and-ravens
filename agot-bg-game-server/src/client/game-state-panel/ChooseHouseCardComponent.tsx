import { observer } from "mobx-react";
import * as React from "react";
import { Component } from "react";
import ChooseHouseCardGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/choose-house-card-game-state/ChooseHouseCardGameState";
import HouseCard from "../../common/ingame-game-state/game-data-structure/house-card/HouseCard";
import GameStateComponentProps from "./GameStateComponentProps";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import HouseCardComponent from "./utils/HouseCardComponent";
import { observable } from "mobx";
import CombatGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/CombatGameState";
import Player from "../../common/ingame-game-state/Player";
import { FormCheck, OverlayTrigger, Tooltip } from "react-bootstrap";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { t, tr } from "../i18n/i18n";
import * as _ from "lodash";
import classNames from "classnames";
import houseCardImages from "../houseCardImages";

@observer
export default class ChooseHouseCardComponent extends Component<
  GameStateComponentProps<ChooseHouseCardGameState>
> {
  @observable dontSkipVsbQuestion: boolean;

  get chosenHouseCard(): HouseCard | null {
    const commandedHouse = this.tryGetCommandedHouseInCombat();
    if (!commandedHouse) {
      return null;
    }

    return this.props.gameState.houseCards.tryGet(commandedHouse, null);
  }

  get combat(): CombatGameState {
    return this.props.gameState.combatGameState;
  }

  get authenticatedPlayer(): Player | null {
    return this.props.gameClient.authenticatedPlayer;
  }

  get isValyrianSteelBladeHolder(): boolean {
    return this.authenticatedPlayer
      ? this.authenticatedPlayer.house ==
          this.props.gameState.combatGameState.game.valyrianSteelBladeHolder
      : false;
  }

  get selectedHouseCard(): HouseCard | null {
    return this.props.gameState.selectedHouseCard;
  }

  set selectedHouseCard(value: HouseCard | null) {
    this.props.gameState.selectedHouseCard = value;
  }

  get dirty(): boolean {
    const commandedHouse = this.tryGetCommandedHouseInCombat();
    if (!commandedHouse) {
      return false;
    }

    return (
      this.selectedHouseCard != this.chosenHouseCard ||
      this.combat.dontSkipVsbQuestion != this.dontSkipVsbQuestion
    );
  }

  constructor(props: GameStateComponentProps<ChooseHouseCardGameState>) {
    super(props);
    this.selectedHouseCard = this.chosenHouseCard;
    const commandedHouse = this.tryGetCommandedHouseInCombat();
    this.dontSkipVsbQuestion =
      commandedHouse != null &&
      this.props.gameState.combatGameState.dontSkipVsbQuestion;
  }

  tryGetCommandedHouseInCombat(): House | null {
    return this.combat.tryGetCommandedHouseInCombat(
      this.props.gameClient.authenticatedPlayer,
    );
  }

  render(): JSX.Element {
    const waitingFor = this.props.gameState.getWaitingForHouses();
    const commandedHouse = this.tryGetCommandedHouseInCombat();
    const supportingHouses =
      this.props.gameState.getSupportingHouses(commandedHouse);
    return this.combat.stats.length > 0 ? (
      <></>
    ) : (
      <>
        <Col xs={12} className="text-center">
          {t("auto.game-state-panel.ChooseHouseCardComponent.0")}</Col>
        {this.shouldChooseHouseCard() && (
          <>
            <Col xs={12}>
              <Row className="justify-content-center choose-house-cards">
                {this.getChoosableHouseCards().map((hc) => (
                  <Col
                    xs="auto"
                    key={`choose-hc_${hc.id}`}
                    style={{
                      paddingRight: 6,
                      paddingLeft: 6,
                      paddingBottom: 4,
                      paddingTop: 4,
                    }}
                  >
                    <HouseCardComponent
                      houseCard={hc}
                      size="small"
                      selected={this.selectedHouseCard == hc}
                      onClick={() => {
                        if (hc != this.selectedHouseCard) {
                          this.selectedHouseCard = hc;
                        }
                      }}
                    />
                  </Col>
                ))}
              </Row>
              {/* Celular: lista com a força, os símbolos e o efeito escritos (as cartas pequenas
                  eram difíceis de ler e de tocar). No computador fica escondida. */}
              <div className="hcpick-list" role="radiogroup" aria-label={t("auto.game-state-panel.ChooseHouseCardComponent.0")}>
                {_.sortBy(this.getChoosableHouseCards(), (hc) => -hc.combatStrength).map((hc) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={this.selectedHouseCard == hc}
                    key={`hcpick_${hc.id}`}
                    className={classNames("hcpick", { selected: this.selectedHouseCard == hc })}
                    onClick={() => (this.selectedHouseCard = hc)}
                  >
                    <img className="hcpick-img" src={houseCardImages.get(hc.id)} alt="" aria-hidden="true" />
                    <span className="hcpick-strength">{hc.combatStrength}</span>
                    <span className="hcpick-body">
                      <span className="hcpick-name">
                        <b>{hc.name}</b>
                        {hc.swordIcons > 0 && <span className="hcpick-icon sword" title={t("houseCard.swords", { n: hc.swordIcons })}>{"⚔".repeat(hc.swordIcons)}</span>}
                        {hc.towerIcons > 0 && <span className="hcpick-icon tower" title={t("houseCard.towers", { n: hc.towerIcons })}>{"▲".repeat(hc.towerIcons)}</span>}
                      </span>
                      <small className="hcpick-ability">{hc.ability ? hc.ability.description : t("houseCard.noAbility")}</small>
                    </span>
                  </button>
                ))}
              </div>
              {this.selectedHouseCard && (
                <img className="hcpick-preview" src={houseCardImages.get(this.selectedHouseCard.id)} alt={this.selectedHouseCard.name} />
              )}
              <div className="choose-house-card-summary text-center">
                {this.selectedHouseCard ? (
                  <>
                    <b>{this.selectedHouseCard.name}</b>
                    {" · "}
                    {t("houseCard.summary", {
                      strength: this.selectedHouseCard.combatStrength,
                      swords: this.selectedHouseCard.swordIcons,
                      towers: this.selectedHouseCard.towerIcons
                    })}
                  </>
                ) : (
                  t("houseCard.pickHint")
                )}
              </div>
            </Col>
            <Col xs={12}>
              {this.isValyrianSteelBladeHolder &&
                !this.props.gameState.combatGameState.game
                  .valyrianSteelBladeUsed && (
                  <Row className="justify-content-center">
                    <Col xs="auto">
                      <FormCheck
                        id="dont-skip-vsb-question"
                        type="switch"
                        label={
                          <OverlayTrigger
                            overlay={
                              <Tooltip id="donst-skip-vsb-tooltip">
                                {tr("auto.game-state-panel.ChooseHouseCardComponent.4")}
                              </Tooltip>
                            }
                          >
                            <label htmlFor="dont-skip-vsb-question">
                              {t("auto.game-state-panel.ChooseHouseCardComponent.3")}</label>
                          </OverlayTrigger>
                        }
                        checked={this.dontSkipVsbQuestion}
                        onChange={() => {
                          this.dontSkipVsbQuestion = !this.dontSkipVsbQuestion;
                        }}
                        style={{ zIndex: "auto" }}
                      />
                    </Col>
                  </Row>
                )}
              <Row className="justify-content-center">
                <Col xs="auto">
                  <Button
                    type="button"
                    variant="success"
                    onClick={() => this.chooseHouseCard()}
                    disabled={!this.dirty || this.selectedHouseCard == null}
                  >
                    {t("common.confirm")}
                  </Button>
                </Col>
              </Row>
              {this.props.gameClient.authenticatedPlayer &&
                this.props.gameState.canRefuseSupport(commandedHouse) && (
                  <Row className="justify-content-center mt-2">
                    {supportingHouses.length > 1 && (
                      <Col xs="auto" key={`refuse-support-from-all`}>
                        <Button
                          type="button"
                          variant="warning"
                          onClick={() => {
                            if (
                              window.confirm(
                                t("support.confirmRefuseAll"),
                              )
                            ) {
                              this.props.gameState.refuseSupport();
                            }
                          }}
                        >
                          {t("auto.game-state-panel.ChooseHouseCardComponent.1")}</Button>
                      </Col>
                    )}
                    {supportingHouses.map((supportingHouse) => (
                      <Col
                        xs="auto"
                        key={`refuse-support-from-${supportingHouse.id}`}
                      >
                        <Button
                          type="button"
                          variant="warning"
                          onClick={() => {
                            if (
                              window.confirm(
                                commandedHouse == supportingHouse
                                  ? t("support.confirmRefuseOwn")
                                  : t("support.confirmRefuseFrom", {
                                      house: supportingHouse.name
                                    }),
                              )
                            ) {
                              this.props.gameState.refuseSupport(
                                supportingHouse,
                              );
                            }
                          }}
                        >
                          {commandedHouse == supportingHouse
                            ? t("auto2.game-state-panel.ChooseHouseCardComponent.0")
                            : t("support.refuseFrom", { house: supportingHouse.name })}
                        </Button>
                      </Col>
                    ))}
                  </Row>
                )}
            </Col>
          </>
        )}
        <Col xs={12} className="text-center">
          <div>
            {tr("auto.game-state-panel.ChooseHouseCardComponent.2", { p0: (waitingFor
              .map(
                (h) =>
                  this.combat.ingameGameState.getControllerOfHouse(h).house
                    .name,
              )
              .join(t("auto2.game-state-panel.ChooseHouseCardComponent.1"))), p1: (waitingFor.length != 1 ? "s" : "") })}</div>
        </Col>
      </>
    );
  }

  shouldChooseHouseCard(): boolean {
    return this.props.gameState.combatGameState.houseCombatDatas.keys.some(
      (h) => this.props.gameClient.doesControlHouse(h),
    );
  }

  chooseHouseCard(): void {
    if (!this.selectedHouseCard) {
      return;
    }

    this.props.gameState.chooseHouseCard(
      this.selectedHouseCard,
      this.dontSkipVsbQuestion,
    );
  }

  getChoosableHouseCards(): HouseCard[] {
    const commandedHouse = this.tryGetCommandedHouseInCombat();
    if (!commandedHouse) {
      return [];
    }
    return this.props.gameState.getChoosableCards(commandedHouse);
  }
}
