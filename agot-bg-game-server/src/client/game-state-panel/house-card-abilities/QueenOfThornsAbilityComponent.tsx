import {observer} from "mobx-react";
import {Component, ReactNode} from "react";
import GameStateComponentProps from "../GameStateComponentProps";
import QueenOfThornsAbilityGameState
    from "../../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/immediately-house-card-abilities-resolution-game-state/queen-of-thorns-ability-game-state/QueenOfThornsAbilityGameState";
import renderChildGameState from "../../utils/renderChildGameState";
import SelectOrdersGameState from "../../../common/ingame-game-state/select-orders-game-state/SelectOrdersGameState";
import SelectOrdersComponent from "../SelectOrdersComponent";
import React from "react";
import Col from "react-bootstrap/Col";
import { t, tr } from "../../i18n/i18n";

@observer
export default class QueenOfThornsAbilityComponent extends Component<GameStateComponentProps<QueenOfThornsAbilityGameState>> {
    get removingOrderInEmbattledAreaAllowed(): boolean {
        return this.props.gameState.childGameState.possibleRegions.includes(this.props.gameState.parentGameState.parentGameState.combatGameState.defendingRegion);
    }

    render(): ReactNode {
        return (
            <>
                <Col xs={12} className="text-center">
                    {tr("auto.game-state-panel.house-card-abilities.QueenOfThornsAbilityComponent.0", { p0: (<b>{this.props.gameState.childGameState.house.name}</b>), p1: (this.removingOrderInEmbattledAreaAllowed ?
                    t("auto2.game-state-panel.house-card-abilities.QueenOfThornsAbilityComponent.0") : "") })}</Col>
                {renderChildGameState(this.props, [
                    [SelectOrdersGameState, SelectOrdersComponent]
                ])}
            </>
        );
    }
}
