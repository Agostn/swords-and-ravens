import {observer} from "mobx-react";
import {Component, ReactNode} from "react";
import ChooseCasualtiesGameState
    from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/post-combat-game-state/choose-casualties-game-state/ChooseCasualtiesGameState";
import React from "react";
import GameStateComponentProps from "./GameStateComponentProps";
import Col from "react-bootstrap/Col";
import renderChildGameState from "../utils/renderChildGameState";
import SelectUnitsGameState from "../../common/ingame-game-state/select-units-game-state/SelectUnitsGameState";
import SelectUnitsComponent from "./SelectUnitsComponent";
import { tr } from "../i18n/i18n";

@observer
export default class ChooseCasualtiesComponent extends Component<GameStateComponentProps<ChooseCasualtiesGameState>> {
    render(): ReactNode {
        return (
            <>
                <Col xs={12} className="text-center">
                    {tr("auto.game-state-panel.ChooseCasualtiesComponent.0", { p0: (<b>{this.props.gameState.childGameState.house.name}</b>), p1: (<b>{this.props.gameState.childGameState.count}</b>) })}</Col>
                {renderChildGameState(this.props, [
                    [SelectUnitsGameState, SelectUnitsComponent]
                ])}
            </>
        );
    }
}
