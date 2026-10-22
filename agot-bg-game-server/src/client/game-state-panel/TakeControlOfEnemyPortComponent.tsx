import {observer} from "mobx-react";
import {Component, ReactNode} from "react";
import React from "react";
import Col from "react-bootstrap/Col";
import SimpleChoiceGameState from "../../common/ingame-game-state/simple-choice-game-state/SimpleChoiceGameState";
import GameStateComponentProps from "./GameStateComponentProps";
import SimpleChoiceComponent from "./SimpleChoiceComponent";
import renderChildGameState from "../utils/renderChildGameState";
import TakeControlOfEnemyPortGameState from "../../common/ingame-game-state/take-control-of-enemy-port-game-state/TakeControlOfEnemyPortGameState";
import { tr } from "../i18n/i18n";

@observer
export default class TakeControlOfEnemyPortComponent extends Component<GameStateComponentProps<TakeControlOfEnemyPortGameState>> {
    render(): ReactNode {
        return (
            <>
                <Col xs={12} className="text-center">
                    <p>{tr("auto.game-state-panel.TakeControlOfEnemyPortComponent.0", { p0: (<b>{this.props.gameState.newController.name}</b>), p1: (<b>{this.props.gameState.port.name}</b>) })}</p>
                </Col>
                {renderChildGameState(this.props, [
                    [SimpleChoiceGameState, SimpleChoiceComponent]
                ])}
            </>
        );
    }
}
