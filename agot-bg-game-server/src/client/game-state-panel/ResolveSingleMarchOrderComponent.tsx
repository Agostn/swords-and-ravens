import classNames from "classnames";
import { Component, ReactNode } from "react";
import ResolveSingleMarchOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/resolve-single-march-order-game-state/ResolveSingleMarchOrderGameState";
import React from "react";
import { observable } from "mobx";
import Region from "../../common/ingame-game-state/game-data-structure/Region";
import Unit from "../../common/ingame-game-state/game-data-structure/Unit";
import * as _ from "lodash";
import { observer } from "mobx-react";
import { Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import BetterMap from "../../utils/BetterMap";
import GameStateComponentProps from "./GameStateComponentProps";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {
  OrderOnMapProperties,
  RegionOnMapProperties,
  UnitOnMapProperties
} from "../MapControls";
import PartialRecursive from "../../utils/PartialRecursive";
import House from "../../common/ingame-game-state/game-data-structure/House";
import UnitIconComponent from "../UnitIconComponent";
import { preventOverflow } from "@popperjs/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfo } from "@fortawesome/free-solid-svg-icons";
import { OverlayChildren } from "react-bootstrap/esm/Overlay";
import { t, tr } from "../i18n/i18n";
import hudSettings from "../hud/hudSettings";
import housePowerTokensImages from "../housePowerTokensImages";

@observer
export default class ResolveSingleMarchOrderComponent extends Component<
  GameStateComponentProps<ResolveSingleMarchOrderGameState>
> {
  @observable private _selectedMarchOrderRegion: Region | null;
  @observable selectedUnits: Unit[] = [];
  @observable plannedMoves = new BetterMap<Region, Unit[]>();
  @observable leavePowerToken: boolean | undefined = undefined;
  canLeavePowerToken = false;
  canLeavePowerTokenReason = "";

  modifyRegionsOnMapCallback: any;
  modifyUnitsOnMapCallback: any;
  modifyOrdersOnMapCallback: any;

  resetTimeoutId = -1;

  get selectedMarchOrderRegion(): Region | null {
    return this._selectedMarchOrderRegion;
  }

  set selectedMarchOrderRegion(val: Region | null) {
    if (val && this._selectedMarchOrderRegion == null) {
      this.props.gameClient.sfxManager.playSoundWhenClickingMarchOrder(val);
    }

    if (val == null) {
      this.props.gameClient.sfxManager.fadeOutCurrentSfx();
    }

    this._selectedMarchOrderRegion = val;
  }

  get house(): House {
    return this.props.gameState.house;
  }

  get isVassalHouse(): boolean {
    return this.props.gameState.ingame.isVassalHouse(this.house);
  }

  get attackingUnits(): Unit[] {
    return _.flatMap(
      this.plannedMoves.entries
        .filter(([r, _u]) => this.props.gameState.doesMoveTriggerAttack(r))
        .map(([_r, u]) => u)
    );
  }

  get usedButStillValidTargetRegions(): Region[] {
    return this.selectedMarchOrderRegion != null &&
      this.selectedUnits.length > 0
      ? this.props.gameState.getUsedButStillValidTargetRegions(
          this.selectedMarchOrderRegion,
          this.plannedMoves,
          this.selectedUnits
        )
      : [];
  }

  get validTargetRegions(): Region[] {
    return this.selectedMarchOrderRegion != null &&
      this.selectedUnits.length > 0
      ? this.props.gameState.getValidTargetRegions(
          this.selectedMarchOrderRegion,
          this.plannedMoves.entries,
          this.selectedUnits
        )
      : [];
  }

  constructor(
    props: GameStateComponentProps<ResolveSingleMarchOrderGameState>
  ) {
    super(props);
    this.UNSAFE_componentWillUpdate();
  }

  getMarchableUnits(region: Region): Unit[] {
    return _.intersection(
      region.allUnits,
      this.props.gameState.getValidMarchUnits(region)
    );
  }

  render(): ReactNode {
    const movingUnits = _.flatMap(this.plannedMoves.values);
    const allUnitsWillLeaveStartingRegion = this.selectedMarchOrderRegion
      ? this.selectedMarchOrderRegion.units.size == movingUnits.length
      : false;
    const allUnitsSelected =
      this.selectedMarchOrderRegion?.allUnits.length ==
      this.selectedUnits.length;
    return (
      <>
        <Col xs={12} className="text-center">
          {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.0", { p0: (<b>{this.house.name}</b>) })}</Col>
        {this.props.gameClient.doesControlHouse(this.house) ? (
          <>
            <Col xs={12}>
              <Row className="d-flex justify-content-center align-items-center">
                <Col xs={10} className="text-center">
                  {this.selectedMarchOrderRegion == null ? (
                    <>
                      {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.1")}</>
                  ) : this.selectedUnits.length == 0 &&
                    !allUnitsWillLeaveStartingRegion ? (
                    <>
                      {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.2", { p0: (<b>{this.selectedMarchOrderRegion.name}</b>) })}</>
                  ) : this.selectedUnits.length != 0 &&
                    this.validTargetRegions.length == 0 &&
                    this.usedButStillValidTargetRegions.length == 0 ? (
                    <>
                      {t("auto.game-state-panel.ResolveSingleMarchOrderComponent.3")}</>
                  ) : !allUnitsWillLeaveStartingRegion ? (
                    <>
                      {t("auto.game-state-panel.ResolveSingleMarchOrderComponent.4")}{!allUnitsSelected && (
                        <>
                          {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.5", { p0: (<b>{this.selectedMarchOrderRegion.name}</b>) })}
                        </>
                      )}
                      .
                      {!allUnitsSelected && (
                        <>
                          {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.6")}</>
                      )}
                    </>
                  ) : (
                    <></>
                  )}
                </Col>
                {!allUnitsWillLeaveStartingRegion && (
                  <Col xs="auto">
                    <OverlayTrigger
                      overlay={this.renderColorLegendTooltip()}
                      popperConfig={{ modifiers: [preventOverflow] }}
                      placement="auto"
                    >
                      <div
                        style={{ width: 24, height: 24 }}
                        className="circle-border d-flex justify-content-center align-items-center"
                      >
                        <FontAwesomeIcon icon={faInfo} />
                      </div>
                    </OverlayTrigger>
                  </Col>
                )}
              </Row>
            </Col>
            {this.selectedMarchOrderRegion && this.plannedMoves.size > 0 && hudSettings.hudActive && (
              <Col xs={12} className="mt-2">
                <div className="march-moves">
                  <div className="march-moves-title">
                    {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.7", { p0: (<b>{this.selectedMarchOrderRegion.name}</b>) })}
                  </div>
                  {this.plannedMoves.entries.map(([region, units]) => (
                    <div key={`hud-planned-moves_${region.id}`} className="march-move">
                      <div className="march-move-units">
                        {units.map((unit, i) => (
                          <button
                            type="button"
                            key={`hud-planned_${unit.id}_${i}`}
                            className="march-move-unit"
                            title={t("march.undoUnit", { unit: unit.type.name })}
                            aria-label={t("march.undoUnit", { unit: unit.type.name })}
                            onClick={() => this.cancelMove(unit)}
                          >
                            <UnitIconComponent house={this.house} unitType={unit.type} size="smedium" makeGreyjoyUnitsBlack={true} />
                            <span className="march-move-x" aria-hidden="true">×</span>
                          </button>
                        ))}
                      </div>
                      <span className="march-move-arrow" aria-hidden="true">→</span>
                      <span className="march-move-target">{region.name}</span>
                    </div>
                  ))}
                  <div className="march-moves-hint">{t("march.cancelHintHud")}</div>
                </div>
              </Col>
            )}
            {this.selectedMarchOrderRegion && this.plannedMoves.size > 0 && !hudSettings.hudActive && (
              <Col xs={12} className="mt-2">
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.7", { p0: (<b>{this.selectedMarchOrderRegion.name}</b>) })}</div>
                  {this.plannedMoves.entries.map(([region, units]) => (
                    <div
                      key={`planned-moves_${region.id}`}
                      style={{ marginLeft: "20px" }}
                    >
                      {units.map((unit, i) => (
                        <div
                          key={`planned_units_${this.house.id}_${unit.id}_${i}`}
                          style={{ display: "inline" }}
                        >
                          <UnitIconComponent
                            house={this.house}
                            unitType={unit.type}
                            size="smedium"
                            makeGreyjoyUnitsBlack={true}
                            /* Moving units never can be wounded so we don't need to set it here */
                          />
                        </div>
                      ))}
                      <div style={{ display: "inline", verticalAlign: "top" }}>
                        &nbsp;=&gt;&nbsp;{region.name}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center small text-muted mb-2">
                  {t("march.cancelHint")}
                </div>
              </Col>
            )}
            {this.selectedMarchOrderRegion != null && (
              <>
                {this.renderLeavePowerToken(
                  this.selectedMarchOrderRegion,
                  allUnitsWillLeaveStartingRegion
                )}
                <Col xs={12}>
                  <Row className="justify-content-center">
                    <Col xs="auto">
                      <Button
                        type="button"
                        variant="success"
                        onClick={() => this.confirm()}
                        disabled={this.leavePowerToken == undefined}
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
            )}
            {this.props.gameState.supportersAgainstNeutralForce == null &&
              (this.props.gameState.getPossibleSupportingHousesAgainstNeutralForces()
                ?.size ?? -1) > 0 && (
                <Col xs={12}>
                  {hudSettings.hudActive ? (
                    <div className="march-neutral">
                      <div className="march-neutral-text">
                        <b>{t("march.neutralTitle")}</b>
                        <small>{t("march.neutralHint")}</small>
                      </div>
                      <button type="button" className="march-neutral-button" onClick={() => this.callForSupportAgainstNeutralForces()}>
                        {t("auto.game-state-panel.ResolveSingleMarchOrderComponent.8")}
                      </button>
                    </div>
                  ) : (
                  <Row className="justify-content-center">
                    <Col xs="auto">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() =>
                          this.callForSupportAgainstNeutralForces()
                        }
                      >
                        {t("auto.game-state-panel.ResolveSingleMarchOrderComponent.8")}</Button>
                    </Col>
                  </Row>
                  )}
                </Col>
              )}
          </>
        ) : (
          <Col xs={12} className="text-center">
            {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.9", { p0: (this.props.gameState.ingame.getControllerOfHouse(this.house).house
                .name) })}</Col>
        )}
      </>
    );
  }

  renderColorLegendTooltip(): OverlayChildren {
    return (
      <Tooltip id={`color-legend-tooltip`} className="tooltip-w-100">
        <Col>
          <h6>{t("auto.game-state-panel.ResolveSingleMarchOrderComponent.10")}</h6>
          <div>
            {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.11")}</div>
          <div>
            <b style={{ color: "yellow" }}>{t("auto.game-state-panel.ResolveSingleMarchOrderComponent.12")}</b>{t("auto.game-state-panel.ResolveSingleMarchOrderComponent.13")}</div>
          <div>
            <b style={{ color: "red" }}>{t("auto.game-state-panel.ResolveSingleMarchOrderComponent.14")}</b>{t("auto.game-state-panel.ResolveSingleMarchOrderComponent.15")}</div>
        </Col>
      </Tooltip>
    );
  }

  callForSupportAgainstNeutralForces(): void {
    this.props.gameState.callForSupportAgainstNeutralForces();
  }

  UNSAFE_componentWillUpdate(): any {
    const { success, reason } = this.selectedMarchOrderRegion
      ? this.props.gameState.canLeavePowerToken(
          this.selectedMarchOrderRegion,
          this.plannedMoves
        )
      : { success: false, reason: "no-all-units-go" };

    if (this.canLeavePowerToken != success) {
      // Set undefined here to actively force a user decision when a move was done which changed canLeavePowerToken
      this.leavePowerToken = undefined;
    }

    this.canLeavePowerToken = success;
    this.canLeavePowerTokenReason = reason;

    if (!this.canLeavePowerToken) {
      this.leavePowerToken = false;
    }

    if (this.isVassalHouse && this.canLeavePowerToken) {
      this.leavePowerToken = true;
    }
  }

  renderLeavePowerToken(
    startingRegion: Region,
    allUnitsWillLeaveStartingRegion: boolean
  ): ReactNode | null {
    const portRegion =
      startingRegion.game.world.getAdjacentPortOfCastle(startingRegion);
    const hasShipsInPort =
      portRegion == null ? false : portRegion.units.size > 0;
    const unitOwner = startingRegion.units.values[0].allegiance;
    const moveWillLoseControlOverRegion =
      startingRegion.controlPowerToken == null &&
      allUnitsWillLeaveStartingRegion;
    const superTokenOwner = startingRegion.superControlPowerToken;
    const superTokenOwnerName =
      superTokenOwner != null ? superTokenOwner.name : "";
    const warningToShow =
      moveWillLoseControlOverRegion &&
      superTokenOwner == null &&
      portRegion != null &&
      hasShipsInPort ? (
        <small>
          {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.16", { p0: (<b>{portRegion.name}</b>) })}</small>
      ) : moveWillLoseControlOverRegion &&
        superTokenOwner != null &&
        superTokenOwner != unitOwner &&
        portRegion != null &&
        hasShipsInPort ? (
        <small>
          {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.17", { p0: (<b>{superTokenOwnerName}</b>), p1: (<b>{startingRegion.name}</b>), p2: (<b>{portRegion.name}</b>) })}</small>
      ) : moveWillLoseControlOverRegion &&
        superTokenOwner != null &&
        superTokenOwner != unitOwner &&
        portRegion != null &&
        !hasShipsInPort ? (
        <small>
          {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.18", { p0: (<b>{superTokenOwnerName}</b>), p1: (<b>{startingRegion.name}</b>) })}</small>
      ) : null;

    const showLeavePowerTokenPrompt = this.canLeavePowerTokenReason == "ok";

    return (
      this.plannedMoves.size > 0 && (
        <Col xs={12} className="text-center">
          <Form>
            <fieldset>
              <Form.Group>
                {showLeavePowerTokenPrompt && hudSettings.hudActive ? (
                  <div className="leave-pt">
                    <div className="leave-pt-question">
                      {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.19", { p0: (<b>{startingRegion.name}</b>) })}
                    </div>
                    <div className="leave-pt-options" role="radiogroup">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={this.leavePowerToken == true}
                        className={classNames("leave-pt-option", { selected: this.leavePowerToken == true })}
                        onClick={() => this.onLeavePowerTokenChange(true)}
                      >
                        <span className="leave-pt-token" style={{ backgroundImage: `url(${housePowerTokensImages.get(this.house.id)})` }} />
                        <span className="leave-pt-text">
                          <b>{t("march.leaveYes")}</b>
                          <small>{t("march.leaveYesHint", { n: this.house.powerTokens })}</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={this.leavePowerToken == false}
                        className={classNames("leave-pt-option", "no", { selected: this.leavePowerToken == false })}
                        onClick={() => this.onLeavePowerTokenChange(false)}
                      >
                        <span className="leave-pt-token none" aria-hidden="true">∅</span>
                        <span className="leave-pt-text">
                          <b>{t("march.leaveNo")}</b>
                          <small>{t("march.leaveNoHint")}</small>
                        </span>
                      </button>
                    </div>
                  </div>
                ) : showLeavePowerTokenPrompt ? (
                  <>
                    <Col xs={12} className="mb-0 pb-0">
                      <Form.Label>
                        {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.19", { p0: (<b>{startingRegion.name}</b>) })}</Form.Label>
                    </Col>
                    <Col xs={12} className="mt-0 pt-0">
                      <Form.Check
                        id="chk-leave-pt"
                        name="leave-pt-radios"
                        inline
                        type="radio"
                        label={t("auto2.game-state-panel.ResolveSingleMarchOrderComponent.0")}
                        checked={this.leavePowerToken}
                        onChange={() => this.onLeavePowerTokenChange(true)}
                      />
                      <Form.Check
                        id="chk-dont-leave-pt"
                        name="leave-pt-radios"
                        inline
                        type="radio"
                        label={t("auto2.game-state-panel.ResolveSingleMarchOrderComponent.1")}
                        checked={this.leavePowerToken == false}
                        onChange={() => this.onLeavePowerTokenChange(false)}
                      />
                    </Col>
                  </>
                ) : this.canLeavePowerTokenReason ==
                  "vassals-always-leave-power-token" ? (
                  <Col xs={12} className="text-center mb-0 pb-0">
                    {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.20", { p0: (<b>{startingRegion.name}</b>) })}
                  </Col>
                ) : this.canLeavePowerTokenReason ==
                  "no-power-token-available" ? (
                  <Col xs={12} className="text-center mb-0 pb-0">
                    {tr("auto.game-state-panel.ResolveSingleMarchOrderComponent.21", { p0: (startingRegion.name) })}</Col>
                ) : (
                  <></>
                )}
                {this.leavePowerToken == false && warningToShow != null && (
                  <Col xs={12} className="mt-1 pt-0 mb-0 pb-0">
                    <Form.Label>{warningToShow}</Form.Label>
                  </Col>
                )}
              </Form.Group>
            </fieldset>
          </Form>
        </Col>
      )
    );
  }

  onLeavePowerTokenChange(leaveToken: boolean): void {
    if (this.isVassalHouse) {
      return;
    }

    if (!this.leavePowerToken && !this.canLeavePowerToken) {
      return;
    }

    this.leavePowerToken = leaveToken;
  }

  onUnitClick(_region: Region, unit: Unit): void {
    if (this.selectedUnits.includes(unit)) {
      _.pull(this.selectedUnits, unit);
    } else {
      this.selectedUnits.push(unit);
    }
  }

  /**
   * Desfaz a viagem de uma unidade já mandada para outra área: basta clicar
   * nela de novo (no destino, ou na origem quando é um ataque). Ela volta para
   * a área de onde saiu e pode ser mandada de novo.
   */
  cancelMove(unit: Unit): void {
    const entry = this.plannedMoves.entries.find(([, units]) =>
      units.includes(unit)
    );
    if (!entry) return;
    const [region, units] = entry;
    const remaining = units.filter((u) => u != unit);
    if (remaining.length > 0) {
      this.plannedMoves.set(region, remaining);
    } else {
      this.plannedMoves.delete(region);
    }
    if (region.newUnits.includes(unit)) {
      region.newUnits = region.newUnits.filter((u) => u != unit);
    }
    if (this.selectedMarchOrderRegion) {
      this.selectedMarchOrderRegion.removedUnits =
        this.selectedMarchOrderRegion.removedUnits.filter((u) => u != unit);
    }
    // se não sobrou viagem nenhuma, a escolha de deixar a ficha de Poder recomeça
    if (this.plannedMoves.size == 0) {
      this.leavePowerToken = undefined;
    }
  }

  onRegionClick(region: Region): void {
    const alreadyGoingUnits: Unit[] = this.plannedMoves.has(region)
      ? this.plannedMoves.get(region)
      : [];

    const newGoingArmy = alreadyGoingUnits.concat(this.selectedUnits);

    this.plannedMoves.set(region, newGoingArmy);

    // Make non combat moves directly visible by help of new/removedUnits to easily restore the original gameState by resetting new/removedUnits
    if (
      this.selectedMarchOrderRegion &&
      !this.props.gameState.doesMoveTriggerAttack(region)
    ) {
      region.newUnits = newGoingArmy;
      this.selectedMarchOrderRegion.removedUnits = _.concat(
        this.selectedMarchOrderRegion.removedUnits,
        newGoingArmy
      );
    }

    this.selectedUnits = [];
  }

  onOrderClick(event: React.MouseEvent<HTMLDivElement>, region: Region): void {
    if (this.selectedMarchOrderRegion == region) {
      if (event.detail == 1) {
        this.resetTimeoutId = window.setTimeout(() => {
          this.reset();
          this.resetTimeoutId = -1;
        }, 500);
      } else if (event.detail > 1) {
        if (this.resetTimeoutId > -1) {
          window.clearTimeout(this.resetTimeoutId);
          this.resetTimeoutId = -1;
        }
        this.selectAllUnits(this.selectedMarchOrderRegion);
      }
    } else {
      // this.selectedMarchOrderRegion == null
      if (event.detail > 1) {
        this.selectAllUnits(region);
      }

      this.selectedMarchOrderRegion = region;
    }
  }

  selectAllUnits(region: Region): void {
    this.selectedUnits = _.difference(
      this.getMarchableUnits(region),
      this.attackingUnits
    );
  }

  private reset(): void {
    if (this.selectedMarchOrderRegion) {
      this.selectedMarchOrderRegion.removedUnits = [];
    }
    this.plannedMoves.keys.forEach((r) => (r.newUnits = []));

    this.selectedMarchOrderRegion = null;
    this.selectedUnits = [];
    this.plannedMoves = new BetterMap<Region, Unit[]>();
    this.leavePowerToken = undefined;
  }

  confirm(): void {
    if (this.leavePowerToken == undefined) {
      return;
    }

    if (!this.selectedMarchOrderRegion) {
      return;
    }

    if (this.plannedMoves.size == 0) {
      if (!confirm(t("auto2.game-state-panel.ResolveSingleMarchOrderComponent.2"))) {
        return;
      }
    }

    this.props.gameState.sendMoves(
      this.selectedMarchOrderRegion,
      this.plannedMoves,
      this.leavePowerToken
    );

    this.reset();
  }

  modifyOrdersOnMap(): [Region, PartialRecursive<OrderOnMapProperties>][] {
    if (this.props.gameClient.doesControlHouse(this.house)) {
      const regions = this.selectedMarchOrderRegion
        ? [this.selectedMarchOrderRegion]
        : this.props.gameState.getRegionsWithMarchOrder();

      return regions.map((r) => [
        r,
        {
          highlight: {
            active: true,
            color: this.selectedMarchOrderRegion != null ? "yellow" : "white"
          },
          onClick: (e: React.MouseEvent<HTMLDivElement>) =>
            this.onOrderClick(e, r)
        }
      ]);
    }

    return [];
  }

  modifyUnitsOnMap(): [Unit, PartialRecursive<UnitOnMapProperties>][] {
    if (this.props.gameClient.doesControlHouse(this.house)) {
      if (!this.selectedMarchOrderRegion) {
        return [];
      }

      const attackingUnits = this.attackingUnits;

      const marchableUnits = this.getMarchableUnits(
        this.selectedMarchOrderRegion
      ).map(
        (u) =>
          [
            u,
            {
              highlight: {
                active: true,
                color: attackingUnits.includes(u)
                  ? "red"
                  : this.selectedUnits.includes(u)
                    ? "yellow"
                    : "white"
              },
              onClick: !attackingUnits.includes(u)
                ? () =>
                    this.onUnitClick(this.selectedMarchOrderRegion as Region, u)
                : // ataque já marcado: clicar de novo cancela
                  () => this.cancelMove(u)
            }
          ] as [Unit, PartialRecursive<UnitOnMapProperties>]
      );

      const movedUnits = _.flatMap(
        this.props.gameState.world.regions.values.map((r) => r.newUnits)
      ).map(
        (u) =>
          [
            u,
            {
              highlight: {
                active: true,
                color: "yellow"
              },
              // clicar na unidade que já foi mandada desfaz a viagem
              onClick: () => this.cancelMove(u)
            }
          ] as [Unit, PartialRecursive<UnitOnMapProperties>]
      );

      return _.concat(marchableUnits, movedUnits);
    }

    return [];
  }

  modifyRegionsOnMap(): [Region, PartialRecursive<RegionOnMapProperties>][] {
    if (this.props.gameClient.doesControlHouse(this.house)) {
      const targetRegions = this.validTargetRegions;
      const usedButStillValidTargetRegions =
        this.usedButStillValidTargetRegions;
      const combatRegions = this.plannedMoves.keys.filter((r) =>
        this.props.gameState.doesMoveTriggerAttack(r)
      );

      return _.concat(
        targetRegions,
        usedButStillValidTargetRegions,
        combatRegions
      ).map((r) => [
        r,
        {
          highlight: {
            active: true,
            color: combatRegions.includes(r) ? "yellow" : "white"
          },
          onClick:
            targetRegions.includes(r) ||
            usedButStillValidTargetRegions.includes(r)
              ? () => this.onRegionClick(r)
              : undefined
        }
      ]);
    }

    return [];
  }

  componentDidMount(): void {
    this.props.mapControls.modifyOrdersOnMap.push(
      (this.modifyOrdersOnMapCallback = () => this.modifyOrdersOnMap())
    );
    this.props.mapControls.modifyUnitsOnMap.push(
      (this.modifyUnitsOnMapCallback = () => this.modifyUnitsOnMap())
    );
    this.props.mapControls.modifyRegionsOnMap.push(
      (this.modifyRegionsOnMapCallback = () => this.modifyRegionsOnMap())
    );
  }

  componentWillUnmount(): void {
    // Discard any pending, unsent moves so they don't corrupt the shared game model
    this.reset();

    _.pull(
      this.props.mapControls.modifyOrdersOnMap,
      this.modifyOrdersOnMapCallback
    );
    _.pull(
      this.props.mapControls.modifyUnitsOnMap,
      this.modifyUnitsOnMapCallback
    );
    _.pull(
      this.props.mapControls.modifyRegionsOnMap,
      this.modifyRegionsOnMapCallback
    );
  }
}
