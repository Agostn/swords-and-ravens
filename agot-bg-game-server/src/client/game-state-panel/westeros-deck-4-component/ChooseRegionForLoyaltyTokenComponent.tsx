import {observer} from "mobx-react";
import {Component, ReactNode} from "react";
import GameStateComponentProps from "../GameStateComponentProps";
import renderChildGameState from "../../utils/renderChildGameState";
import React from "react";
import ChooseRegionForLoyaltyTokenGameState from "../../../common/ingame-game-state/westeros-game-state/westeros-deck-4-game-state/choose-region-for-loyalty-token-game-state/ChooseRegionForLoyaltyTokenGameState";
import SimpleChoiceGameState from "../../../common/ingame-game-state/simple-choice-game-state/SimpleChoiceGameState";
import SimpleChoiceComponent from "../SimpleChoiceComponent";
import SelectRegionGameState from "../../../common/ingame-game-state/select-region-game-state/SelectRegionGameState";
import SelectRegionComponent from "../SelectRegionComponent";
import { Col } from "react-bootstrap";
import { tr } from "../../i18n/i18n";

@observer
export default class ChooseRegionForLoyaltyTokenComponent extends Component<GameStateComponentProps<ChooseRegionForLoyaltyTokenGameState>> {
    render(): ReactNode {
        return (
            <>
                {this.props.gameState.childGameState instanceof SelectRegionGameState && <Col className="text-center">
                    {tr("auto.game-state-panel.westeros-deck-4-component.ChooseRegionForLoyaltyTokenComponent.0", { p0: (<b>{this.props.gameState.childGameState.house.name}</b>) })}</Col>}
                {renderChildGameState(this.props, [
                    [SimpleChoiceGameState, SimpleChoiceComponent],
                    [SelectRegionGameState, SelectRegionComponent]
                ])}
            </>
        );
    }
}
