import { observer } from "mobx-react";
import React, { Component, ReactElement, ReactNode } from "react";
import Region from "../../common/ingame-game-state/game-data-structure/Region";
import { observable } from "mobx";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import GameStateComponentProps from "./GameStateComponentProps";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { OrderOnMapProperties } from "../MapControls";
import PartialRecursive from "../../utils/PartialRecursive";
import ResolveSingleConsolidatePowerGameState from "../../common/ingame-game-state/action-game-state/resolve-consolidate-power-game-state/resolve-single-consolidate-power-game-state/ResolveSingleConsolidatePowerGameState";
import ConsolidatePowerOrderType from "../../common/ingame-game-state/game-data-structure/order-types/ConsolidatePowerOrderType";
import IronBankOrderType from "../../common/ingame-game-state/game-data-structure/order-types/IronBankOrderType";
import DefenseMusterOrderType from "../../common/ingame-game-state/game-data-structure/order-types/DefenseMusterOrderType";
import IronBank from "../../common/ingame-game-state/game-data-structure/IronBank";
import _ from "lodash";
import { t, tr } from "../i18n/i18n";
import hudSettings from "../hud/hudSettings";
import unitImages from "../unitImages";
import housePowerTokensImages from "../housePowerTokensImages";

@observer
export default class ResolveSingleConsolidatePowerComponent extends Component<
  GameStateComponentProps<ResolveSingleConsolidatePowerGameState>
> {
  @observable selectedOrderRegion: Region | null = null;
  @observable selectedOrderType:
    | ConsolidatePowerOrderType
    | IronBankOrderType
    | DefenseMusterOrderType
    | null = null;

  modifyOrdersOnMapCallback: any;

  get house(): House {
    return this.props.gameState.house;
  }

  get doesControlCurrentHouse(): boolean {
    return this.props.gameClient.doesControlHouse(this.house);
  }

  get gameState(): ResolveSingleConsolidatePowerGameState {
    return this.props.gameState;
  }

  get defenseMusterOrderRegion(): Region | null {
    const regions =
      this.gameState.actionGameState.getRegionsWithDefenseMusterOrderOfHouse(
        this.house
      );
    if (regions.length == 1) {
      return regions[0][0];
    }

    return null;
  }

  get ironBank(): IronBank | null {
    return this.gameState.ingame.game.ironBank;
  }

  render(): ReactNode {
    const availableOrders =
      this.props.gameState.parentGameState.getAvailableOrdersOfHouse(
        this.house
      );
    return (
      <>
        <Col xs={12} className="text-center">
          {this.gameState.ingame.isVassalHouse(this.house) ? (
            <>
              {tr("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.0", { p0: (<b>{this.house.name}</b>) })}{this.defenseMusterOrderRegion && (
                <>
                  {" "}{tr("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.1", { p0: (<b>{this.defenseMusterOrderRegion.name}</b>) })}
                </>
              )}
              .
            </>
          ) : (
            <>
              {tr("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.2", { p0: (<b>{this.house.name}</b>), p1: (availableOrders.values.some(
                (ot) => ot instanceof IronBankOrderType
              )
                ? t("auto2.game-state-panel.ResolveSingleConsolidatePowerComponent.0")
                : "") })}</>
          )}
        </Col>
        {this.doesControlCurrentHouse ? (
          <>
            {this.selectedOrderRegion && this.selectedOrderType ? (
              this.renderGameStateControls(
                this.selectedOrderRegion,
                this.selectedOrderType
              )
            ) : (
              <Col xs={12} className="text-center">
                <p>{t("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.3")}</p>
              </Col>
            )}
            <Col xs={12} className="d-flex justify-content-center">
              <Button
                type="button"
                variant="danger"
                onClick={() => this.reset()}
              >
                {t("common.reset")}
              </Button>
            </Col>
          </>
        ) : (
          <Col xs={12} className="text-center">
            {tr("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.4", { p0: (this.gameState.ingame.getControllerOfHouse(this.house).house.name) })}</Col>
        )}
      </>
    );
  }

  // Tela nova: cada escolha é um cartão com símbolo, título e explicação
  private renderChoice(
    key: string,
    kind: "muster" | "power" | "loan" | "remove",
    title: ReactNode,
    hint: ReactNode,
    onClick: () => void
  ): ReactNode {
    const icon =
      kind == "muster" ? (
        <span
          className="choice-icon unit"
          style={{ backgroundImage: `url(${unitImages.get(this.house.id).get("footman")})` }}
        />
      ) : kind == "power" ? (
        <span
          className="choice-icon token"
          style={{ backgroundImage: `url(${housePowerTokensImages.get(this.house.id)})` }}
        />
      ) : kind == "loan" ? (
        <span className="choice-icon glyph" aria-hidden="true">⚖</span>
      ) : (
        <span className="choice-icon glyph" aria-hidden="true">✕</span>
      );
    return (
      <button key={key} type="button" className={`choice-card ${kind}`} onClick={onClick}>
        {icon}
        <span className="choice-text">
          <b>{title}</b>
          <small>{hint}</small>
        </span>
      </button>
    );
  }

  private renderHudControls(
    orderRegion: Region,
    orderType: ConsolidatePowerOrderType | IronBankOrderType | DefenseMusterOrderType
  ): ReactNode {
    const done = (fn: () => void) => () => {
      fn();
      this.reset();
    };
    const choices: ReactNode[] = [];
    if (orderType instanceof DefenseMusterOrderType) {
      choices.push(
        this.renderChoice("muster", "muster",
          tr("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.6", { p0: orderRegion.name }),
          t("consolidate.musterHint", { n: Math.max(1, orderRegion.castleLevel) }),
          done(() => this.gameState.chooseMustering(orderRegion))),
        this.renderChoice("remove", "remove",
          t("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.7"),
          t("consolidate.removeHint"),
          done(() => this.gameState.chooseRemoveOrder(orderRegion)))
      );
    }
    if (orderType instanceof ConsolidatePowerOrderType) {
      const gain = this.gameState.getPotentialGainedPowerTokens(orderRegion, this.house);
      if (orderType.starred && orderRegion.castleLevel > 0) {
        choices.push(
          this.renderChoice("muster", "muster",
            tr("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.8", { p0: orderRegion.name }),
            t("consolidate.musterHint", { n: orderRegion.castleLevel }),
            done(() => this.gameState.chooseMustering(orderRegion)))
        );
      }
      choices.push(
        this.renderChoice("power", "power",
          this.getPowerTokenButtonText(gain),
          t("consolidate.powerHint"),
          done(() => this.gameState.chooseGainPowerTokens(orderRegion)))
      );
    }
    if (orderType instanceof IronBankOrderType && this.ironBank) {
      this.ironBank.getPurchasableLoans(this.house).forEach((purchasable) =>
        choices.push(
          this.renderChoice(`loan-${purchasable.loan.id}`, "loan",
            purchasable.loan.name,
            t("consolidate.loanHint", { n: purchasable.costs }),
            done(() => this.gameState.choosePurchaseLoan(purchasable.slotIndex, orderRegion)))
        )
      );
      choices.push(
        this.renderChoice("remove", "remove",
          t("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.10"),
          t("consolidate.removeHint"),
          done(() => this.gameState.chooseRemoveOrder(orderRegion)))
      );
    }
    return (
      <div className="choice-box">
        <div className="choice-head">
          <span className="choice-order">{orderType.name}</span>
          <b className="choice-region">{orderRegion.name}</b>
          <small>{t("consolidate.chooseOne")}</small>
        </div>
        <div className="choice-list">{choices}</div>
      </div>
    );
  }

  private renderGameStateControls(
    orderRegion: Region,
    orderType:
      | ConsolidatePowerOrderType
      | IronBankOrderType
      | DefenseMusterOrderType
  ): ReactNode {
    if (hudSettings.hudActive) {
      return <Col xs={12}>{this.renderHudControls(orderRegion, orderType)}</Col>;
    }
    return (
      <>
        <Col xs={12} className="text-center">
          <p>
            {tr("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.5", { p0: (<b>{orderType.name}</b>), p1: (<b>{orderRegion.name}</b>) })}
          </p>
        </Col>
        <Col xs={12}>
          <Row className="justify-content-center">
            {orderType instanceof DefenseMusterOrderType && (
              <>
                <Col xs={12} className="d-flex justify-content-center">
                  <Button
                    type="button"
                    variant="success"
                    onClick={() => {
                      this.gameState.chooseMustering(orderRegion as Region);
                      this.reset();
                    }}
                  >
                    {tr("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.6", { p0: (orderRegion.name) })}
                  </Button>
                </Col>
                <Col xs={12} className="d-flex justify-content-center">
                  <Button
                    type="button"
                    variant="warning"
                    onClick={() => {
                      this.gameState.chooseRemoveOrder(orderRegion as Region);
                      this.reset();
                    }}
                  >
                    {t("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.7")}</Button>
                </Col>
              </>
            )}
            {orderType instanceof ConsolidatePowerOrderType && (
              <>
                {orderType.starred && orderRegion.castleLevel > 0 && (
                  <Col xs="auto">
                    <Button
                      type="button"
                      variant="success"
                      onClick={() => {
                        this.gameState.chooseMustering(orderRegion as Region);
                        this.reset();
                      }}
                    >
                      {tr("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.8", { p0: (orderRegion.name) })}
                    </Button>
                  </Col>
                )}
                <Col xs="auto">
                  <Button
                    type="button"
                    onClick={() => {
                      this.gameState.chooseGainPowerTokens(
                        orderRegion as Region
                      );
                      this.reset();
                    }}
                  >
                    {this.getPowerTokenButtonText(
                      this.gameState.getPotentialGainedPowerTokens(
                        orderRegion,
                        this.house
                      )
                    )}
                  </Button>
                </Col>
              </>
            )}
            {orderType instanceof IronBankOrderType && this.ironBank && (
              <>
                {this.ironBank
                  .getPurchasableLoans(this.house)
                  .map((purchasable) => (
                    <Col
                      xs={12}
                      className="d-flex justify-content-center"
                      key={`loan-button-${purchasable.loan.id}`}
                    >
                      <Button
                        type="button"
                        variant="success"
                        onClick={() => {
                          this.gameState.choosePurchaseLoan(
                            purchasable.slotIndex,
                            orderRegion as Region
                          );
                          this.reset();
                        }}
                      >
                        {tr("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.9", { p0: (purchasable.costs), p1: (purchasable.costs != 1 ? "s" : ""), p2: (purchasable.loan.name) })}
                      </Button>
                    </Col>
                  ))}
                <Col xs={12} className="d-flex justify-content-center">
                  <Button
                    type="button"
                    variant="warning"
                    onClick={() => {
                      this.gameState.chooseRemoveOrder(orderRegion as Region);
                      this.reset();
                    }}
                  >
                    {t("auto.game-state-panel.ResolveSingleConsolidatePowerComponent.10")}</Button>
                </Col>
              </>
            )}
          </Row>
        </Col>
      </>
    );
  }

  private getPowerTokenButtonText(powerTokenCount: number): string {
    return t("consolidate.gainPowerTokens", { n: powerTokenCount });
  }

  private modifyOrdersOnMap(): [
    Region,
    PartialRecursive<OrderOnMapProperties>
  ][] {
    if (this.doesControlCurrentHouse) {
      const availableOrders =
        this.gameState.parentGameState.getAvailableOrdersOfHouse(
          this.gameState.house
        );
      return availableOrders.entries.map(([r, ot]) => [
        r,
        {
          highlight: { active: true },
          onClick: () => this.onOrderClick(r, ot),
          wrap: (child: ReactElement) => (
            <OverlayTrigger
              placement="auto-start"
              trigger="click"
              rootClose
              overlay={
                <Popover
                  id={"resolve-cp-order-popover_region_" + r.id}
                  className={hudSettings.hudActive ? "choice-popover" : "p-1"}
                >
                  {hudSettings.hudActive ? this.renderHudControls(r, ot) : this.renderGameStateControls(r, ot)}
                </Popover>
              }
            >
              {child}
            </OverlayTrigger>
          )
        }
      ]);
    }

    return [];
  }

  private onOrderClick(
    region: Region,
    orderType:
      | ConsolidatePowerOrderType
      | IronBankOrderType
      | DefenseMusterOrderType
  ): void {
    if (this.selectedOrderRegion == region) {
      this.reset();
    } else {
      this.selectedOrderRegion = region;
      this.selectedOrderType = orderType;
    }
  }

  private reset(): void {
    this.selectedOrderRegion = null;
    this.selectedOrderType = null;
    document.body.click();
  }

  componentDidMount(): void {
    this.props.mapControls.modifyOrdersOnMap.push(
      (this.modifyOrdersOnMapCallback = () => this.modifyOrdersOnMap())
    );
  }

  componentWillUnmount(): void {
    _.pull(
      this.props.mapControls.modifyOrdersOnMap,
      this.modifyOrdersOnMapCallback
    );
  }
}
