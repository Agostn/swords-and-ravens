import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import renderChildGameState from "../utils/renderChildGameState";
import GameStateComponentProps from "./GameStateComponentProps";
import ChooseInitialObjectivesGameState from "../../common/ingame-game-state/choose-initial-objectives-game-state/ChooseInitialObjectivesGameState";
import SelectObjectiveCardsGameState from "../../common/ingame-game-state/select-objective-cards-game-state/SelectObjectiveCardsGameState";
import React from "react";
import { Col } from "react-bootstrap";
import SelectObjectiveCardsComponent from "./SelectObjectiveCardsComponent";
import { t, tr } from "../i18n/i18n";

@observer
export default class ChooseInitialObjectivesComponent extends Component<GameStateComponentProps<ChooseInitialObjectivesGameState>> {
    render(): ReactNode {
        return <>
            <Col xs={12} className="text-center">
                {t("auto.game-state-panel.ChooseInitialObjectivesComponent.0")}{this.props.gameState.entireGame.gameSettings.addPortToTheEyrie && <>
                    {tr("auto.game-state-panel.ChooseInitialObjectivesComponent.1")}</>}
            </Col>
            {renderChildGameState(this.props, [
                [SelectObjectiveCardsGameState, SelectObjectiveCardsComponent]
            ])}
        </>;
    }
}
