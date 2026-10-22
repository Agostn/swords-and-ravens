import {observer} from "mobx-react";
import {Component, ReactNode} from "react";
import React from "react";
import ResolveRetreatGameState
    from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/post-combat-game-state/resolve-retreat-game-state/ResolveRetreatGameState";
import SelectRegionComponent from "./SelectRegionComponent";
import GameStateComponentProps from "./GameStateComponentProps";
import renderChildGameState from "../utils/renderChildGameState";
import SelectRegionGameState from "../../common/ingame-game-state/select-region-game-state/SelectRegionGameState";
import SelectUnitsGameState from "../../common/ingame-game-state/select-units-game-state/SelectUnitsGameState";
import SelectUnitsComponent from "./SelectUnitsComponent";
import Col from "react-bootstrap/Col";
import {observable} from "mobx";
import Region from "../../common/ingame-game-state/game-data-structure/Region";
import { t, tr } from "../i18n/i18n";

@observer
export default class ResolveRetreatComponent extends Component<GameStateComponentProps<ResolveRetreatGameState>> {

    @observable selectRegionComponent: SelectRegionComponent;

    render(): ReactNode {
        const unitCountToBeDestroyed = (this.selectRegionComponent && this.selectRegionComponent.selectedRegion)
            ? this.getUnitCountToBeDestroyedByRetreatTo(this.selectRegionComponent.selectedRegion)
            : 0;
        return (
            <>
                {this.props.gameState.childGameState instanceof SelectRegionGameState ? (
                    <>
                        <Col xs={12} className="text-center">
                            {tr("auto.game-state-panel.ResolveRetreatComponent.0", { p0: (<b>{this.props.gameState.childGameState.house.name}</b>) })}</Col>
                        {unitCountToBeDestroyed > 0 && this.selectRegionComponent && this.selectRegionComponent.selectedRegion && (
                            <Col xs={12} className="text-center">
                                {tr("auto.game-state-panel.ResolveRetreatComponent.1", { p0: (<b>{unitCountToBeDestroyed}</b>), p1: (unitCountToBeDestroyed > 1 ? "s" : ""), p2: (<b>{this.selectRegionComponent.selectedRegion.name}</b>) })}</Col>
                        )}
                    </>
                ) : this.props.gameState.childGameState instanceof SelectUnitsGameState ? (
                    <Col xs={12} className="text-center">
                        {tr("auto.game-state-panel.ResolveRetreatComponent.2", { p0: (<b>{this.props.gameState.childGameState.house.name}</b>), p1: (<b>{this.props.gameState.childGameState.count}</b>), p2: (this.props.gameState.childGameState.count > 1 ? "s" : ""), p3: (<b>{this.props.gameState.retreatRegion?.name ?? t("auto2.game-state-panel.ResolveRetreatComponent.0")}</b>) })}</Col>
                ) : null}
                {renderChildGameState(this.props, [
                    [SelectRegionGameState, SelectRegionComponent],
                    [SelectUnitsGameState, SelectUnitsComponent]
                ], c => c instanceof SelectRegionComponent ? this.selectRegionComponent = c : null)}
            </>
        );
    }

    getUnitCountToBeDestroyedByRetreatTo(region: Region): number {
        return this.props.gameState.getCasualtiesOfRetreatRegion(region);
    }
}
