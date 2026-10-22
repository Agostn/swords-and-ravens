import PlayerReconcileArmiesGameState from "../../common/ingame-game-state/westeros-game-state/reconcile-armies-game-state/player-reconcile-armies-game-state/PlayerReconcileArmiesGameState";
import { Component, ReactNode } from "react";
import React from "react";
import BetterMap from "../../utils/BetterMap";
import Unit from "../../common/ingame-game-state/game-data-structure/Unit";
import Region from "../../common/ingame-game-state/game-data-structure/Region";
import * as _ from "lodash";
import { observer } from "mobx-react";
import GameStateComponentProps from "./GameStateComponentProps";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { observable } from "mobx";
import Row from "react-bootstrap/Row";
import { UnitOnMapProperties } from "../MapControls";
import PartialRecursive from "../../utils/PartialRecursive";
import { union } from "lodash";
import joinReactNodes from "../utils/joinReactNodes";
import { t, tr } from "../i18n/i18n";

@observer
export default class PlayerReconcileArmiesComponent extends Component<
  GameStateComponentProps<PlayerReconcileArmiesGameState>
> {
  @observable unitsToRemove: BetterMap<Region, Unit[]> = new BetterMap();

  modifyUnitsOnMapCallback: any;

  get house(): House {
    return this.props.gameState.house;
  }

  get selectedUnits(): Unit[] {
    return _.flatMap(this.unitsToRemove.values);
  }

  get selectableUnits(): Unit[] {
    let result = this.selectedUnits;

    if (!this.enoughReconciled) {
      result = union(
        result,
        this.props.gameState.getAllArmyUnitsOfHouse(this.house)
      );

      // Remove the last unit from an area from selectable units
      for (const region of this.unitsToRemove.keys) {
        const remainingUnits = _.difference(
          region.units.values,
          this.unitsToRemove.get(region)
        );
        if (remainingUnits.length == 1) {
          result = result.filter((u) => u != remainingUnits[0]);
        }
      }
    }

    return result;
  }

  get enoughReconciled(): boolean {
    return this.props.gameState.isEnoughToReconcile(this.unitsToRemove);
  }

  get tooMuchReconciled(): boolean {
    return this.props.gameState.isTooMuchReconciled(this.unitsToRemove);
  }

  render(): ReactNode {
    const tooMuch = this.tooMuchReconciled;
    const notEnough = !this.enoughReconciled;
    return (
      <Row className="p-2">
        <Col xs={12} className="text-center">
          {tr("auto.game-state-panel.PlayerReconcileArmiesComponent.0", { p0: (<b>{this.props.gameState.house.name}</b>) })}</Col>
        {this.props.gameClient.doesControlHouse(this.house) ? (
          <>
            <Col xs={12}>
              <Row
                className="justify-content-center"
                style={{ paddingBottom: 10 }}
              >
                <ul>
                  {this.unitsToRemove.entries.map(([region, units]) => (
                    <li key={`player-reconcile-armies_${region.id}`}>
                      {tr("auto.game-state-panel.PlayerReconcileArmiesComponent.1", { p0: (joinReactNodes(
                        units.map((u, i) => (
                          <b
                            key={`reconcile-component_${region.id}_${u.id}_${i}`}
                          >
                            {u.type.name}
                          </b>
                        )),
                        ", "
                      )), p1: (<b>{region.name}</b>) })}
                    </li>
                  ))}
                </ul>
              </Row>
              <Row className="justify-content-center">
                <Col xs="auto">
                  <Button
                    type="button"
                    variant="success"
                    disabled={notEnough || tooMuch}
                    onClick={() => this.confirm()}
                  >
                    {t("common.confirm")}
                  </Button>
                </Col>
                <Col xs="auto">
                  <Button
                    type="button"
                    variant="danger"
                    disabled={this.unitsToRemove.size == 0}
                    onClick={() => this.reset()}
                  >
                    {t("common.reset")}
                  </Button>
                </Col>
              </Row>
              {tooMuch && (
                <Row className="mt-1 justify-content-center">
                  {t("auto.game-state-panel.PlayerReconcileArmiesComponent.2")}</Row>
              )}
            </Col>
          </>
        ) : (
          <Col xs={12} className="text-center">
            {tr("auto.game-state-panel.PlayerReconcileArmiesComponent.3", { p0: (this.props.gameState.parentGameState.ingame.getControllerOfHouse(
                this.house
              ).house.name) })}</Col>
        )}
      </Row>
    );
  }

  onUnitClick(unit: Unit): void {
    // If there's no array for this region, add one
    if (!this.unitsToRemove.has(unit.region)) {
      this.unitsToRemove.set(unit.region, []);
    }

    if (!this.unitsToRemove.get(unit.region).includes(unit)) {
      // Add the clicked unit
      this.unitsToRemove.get(unit.region).push(unit);
    } else {
      // Remove the clicked unit
      _.pull(this.unitsToRemove.get(unit.region), unit);
    }

    // If the array for this region is now empty, remove it
    if (this.unitsToRemove.get(unit.region).length == 0) {
      this.unitsToRemove.delete(unit.region);
    }
  }

  confirm(): void {
    this.props.gameState.reconcileArmies(this.unitsToRemove);
    this.reset();
  }

  private reset(): void {
    this.unitsToRemove = new BetterMap();
  }

  modifyUnitsOnMap(): [Unit, PartialRecursive<UnitOnMapProperties>][] {
    if (this.props.gameClient.doesControlHouse(this.house)) {
      const selected = this.selectedUnits;
      return this.selectableUnits.map((u) => [
        u,
        {
          highlight: {
            active: true,
            color: selected.includes(u) ? "red" : "white"
          },
          onClick: () => {
            this.onUnitClick(u);
          }
        }
      ]);
    }

    return [];
  }

  componentDidMount(): void {
    this.props.mapControls.modifyUnitsOnMap.push(
      (this.modifyUnitsOnMapCallback = () => this.modifyUnitsOnMap())
    );
  }

  componentWillUnmount(): void {
    _.pull(
      this.props.mapControls.modifyUnitsOnMap,
      this.modifyUnitsOnMapCallback
    );
  }
}
