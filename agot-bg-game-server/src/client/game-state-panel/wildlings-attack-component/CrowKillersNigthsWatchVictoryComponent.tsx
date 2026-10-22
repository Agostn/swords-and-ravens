import {observer} from "mobx-react";
import React, {Component, ReactNode} from "react";
import GameStateComponentProps from "../GameStateComponentProps";
import renderChildGameState from "../../utils/renderChildGameState";
import SelectUnitsGameState from "../../../common/ingame-game-state/select-units-game-state/SelectUnitsGameState";
import SelectUnitsComponent from "../SelectUnitsComponent";
import CrowKillersNightsWatchVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/crow-killers-nights-watch-victory-game-state/CrowKillersNightsWatchVictoryGameState";
import Col from "react-bootstrap/Col";
import { tr } from "../../i18n/i18n";

@observer
export default class CrowKillersNigthsWatchVictoryComponent extends Component<GameStateComponentProps<CrowKillersNightsWatchVictoryGameState>> {
    render(): ReactNode {
        return (
            <>
                <Col xs={12}>
                    {tr("auto.game-state-panel.wildlings-attack-component.CrowKillersNigthsWatchVictoryComponent.0", { p0: (<b>{this.props.gameState.childGameState.house.name}</b>), p1: (this.props.gameState.childGameState.count) })}</Col>
                {renderChildGameState(this.props, [
                    [SelectUnitsGameState, SelectUnitsComponent]
                ])}
            </>
        );
    }
}
