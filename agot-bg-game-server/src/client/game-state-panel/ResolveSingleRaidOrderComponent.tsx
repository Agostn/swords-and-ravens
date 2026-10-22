import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import ResolveSingleRaidOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-raid-order-game-state/resolve-single-raid-order-game-state/ResolveSingleRaidOrderGameState";
import GameStateComponentProps from "./GameStateComponentProps";
import React from "react";
import { observable } from "mobx";
import Region from "../../common/ingame-game-state/game-data-structure/Region";
import Button from "react-bootstrap/Button";
import * as _ from "lodash";
import RaidOrderType from "../../common/ingame-game-state/game-data-structure/order-types/RaidOrderType";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { OrderOnMapProperties } from "../MapControls";
import PartialRecursive from "../../utils/PartialRecursive";
import RaidSupportOrderType from "../../common/ingame-game-state/game-data-structure/order-types/RaidSupportOrderType";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { t, tr } from "../i18n/i18n";

@observer
export default class ResolveSingleRaidOrderComponent extends Component<
  GameStateComponentProps<ResolveSingleRaidOrderGameState>
> {
  @observable selectedOrderRegion: Region | null;
  @observable selectedTargetRegion: Region | null;

  modifyOrdersOnMapCallback: any;

  get house(): House {
    return this.props.gameState.house;
  }

  get orderInOrderRegion(): RaidOrderType | RaidSupportOrderType | null {
    if (!this.selectedOrderRegion) {
      return null;
    }

    return this.props.gameState.actionGameState.ordersOnBoard.get(
      this.selectedOrderRegion
    ).type as RaidOrderType | RaidSupportOrderType;
  }

  render(): ReactNode {
    return (
      <>
        <Col xs={12} className="text-center">
          {tr("auto.game-state-panel.ResolveSingleRaidOrderComponent.0", { p0: (<b>{this.house.name}</b>) })}</Col>
        {this.props.gameClient.doesControlHouse(this.house) ? (
          this.selectedOrderRegion == null ? (
            <Col xs={12} className="text-center">
              {t("auto.game-state-panel.ResolveSingleRaidOrderComponent.1")}</Col>
          ) : (
            <>
              <Col xs={12} className="text-center">
                <p>
                  {tr("auto.game-state-panel.ResolveSingleRaidOrderComponent.2", { p0: (<b>{this.selectedOrderRegion.name}</b>) })}
                </p>
                {this.selectedTargetRegion == null ? (
                  <>
                    <p>
                      {tr("auto.game-state-panel.ResolveSingleRaidOrderComponent.3", { p0: (<b>{t("common.confirm")}</b>), p1: (this.orderInOrderRegion instanceof RaidSupportOrderType
                        ? t("auto2.game-state-panel.ResolveSingleRaidOrderComponent.0")
                        : t("auto2.game-state-panel.ResolveSingleRaidOrderComponent.1")) })}</p>
                  </>
                ) : (
                  <>{tr("auto.game-state-panel.ResolveSingleRaidOrderComponent.4", { p0: (this.selectedTargetRegion.name) })}</>
                )}
              </Col>
              <Col xs={12}>
                <Row className="justify-content-center">
                  <Col xs="auto">
                    <Button
                      type="button"
                      variant="success"
                      onClick={() => this.confirm()}
                    >
                      {t("common.confirm")}
                    </Button>
                  </Col>
                  <Col xs="auto">
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => this.reset()}
                    >
                      {t("common.reset")}
                    </Button>
                  </Col>
                </Row>
              </Col>
            </>
          )
        ) : (
          <Col xs={12} className="text-center">
            {tr("auto.game-state-panel.ResolveSingleRaidOrderComponent.5", { p0: (this.props.gameState.ingameGameState.getControllerOfHouse(
                this.house
              ).house.name) })}</Col>
        )}
      </>
    );
  }

  confirm(): void {
    if (this.selectedOrderRegion) {
      if (!this.selectedTargetRegion) {
        if (!window.confirm(t("auto2.game-state-panel.ResolveSingleRaidOrderComponent.2"))) {
          return;
        }
      }

      this.props.gameState.resolveRaid(
        this.selectedOrderRegion,
        this.selectedTargetRegion
      );
      this.reset();
    }
  }

  private reset(): void {
    this.selectedOrderRegion = null;
    this.selectedTargetRegion = null;
  }

  onOrderClick(
    r: Region,
    _orderType: RaidOrderType | RaidSupportOrderType | null
  ): void {
    if (this.props.gameClient.doesControlHouse(this.house)) {
      if (this.selectedOrderRegion == null) {
        this.selectedOrderRegion = r;
      } else {
        this.selectedTargetRegion = r;
      }
    }
  }

  modifyOrdersOnMap(): [Region, PartialRecursive<OrderOnMapProperties>][] {
    if (this.props.gameClient.doesControlHouse(this.house)) {
      if (this.selectedOrderRegion == null || this.orderInOrderRegion == null) {
        // Highlight the Raid orders of the house
        return this.props.gameState.parentGameState
          .getRegionsWithRaidOrderOfHouse(this.house)
          .map(([r, ot]) => [
            r,
            {
              highlight: { active: true },
              onClick: () => this.onOrderClick(r, ot)
            }
          ]);
      } else {
        // Highlight the possible raidable orders from the selected Raid order
        return this.props.gameState
          .getRaidableRegions(this.selectedOrderRegion, this.orderInOrderRegion)
          .map((r) => [
            r,
            {
              highlight: { active: true },
              onClick: () => this.onOrderClick(r, null)
            }
          ]);
      }
    }

    return [];
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
