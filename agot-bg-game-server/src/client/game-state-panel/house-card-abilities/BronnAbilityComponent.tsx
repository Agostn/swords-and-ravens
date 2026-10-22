import {observer} from "mobx-react";
import {Component, ReactNode} from "react";
import GameStateComponentProps from "../GameStateComponentProps";
import renderChildGameState from "../../utils/renderChildGameState";
import React from "react";
import Col from "react-bootstrap/Col";
import SimpleChoiceGameState from "../../../common/ingame-game-state/simple-choice-game-state/SimpleChoiceGameState";
import SimpleChoiceComponent from "../SimpleChoiceComponent";
import BronnAbilityGameState from "../../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/before-combat-house-card-abilities-game-state/bronn-ability-game-state/BronnAbilityGameState";
import { tr } from "../../i18n/i18n";

@observer
export default class BronnAbilityComponent extends Component<GameStateComponentProps<BronnAbilityGameState>> {
    render(): ReactNode {
        return (
            <>
                <Col xs={12} className="text-center">
                    {tr("auto.game-state-panel.house-card-abilities.BronnAbilityComponent.0", { p0: (<b>{this.props.gameState.enemy.name}</b>), p1: (<b>2</b>) })}</Col>
                {renderChildGameState(this.props, [
                    [SimpleChoiceGameState, SimpleChoiceComponent]
                ])}
            </>
        );
    }
}
