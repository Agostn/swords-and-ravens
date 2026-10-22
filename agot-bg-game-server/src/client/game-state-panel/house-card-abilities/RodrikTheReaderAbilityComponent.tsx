import {observer} from "mobx-react";
import {Component, ReactNode} from "react";
import GameStateComponentProps from "../GameStateComponentProps";
import renderChildGameState from "../../utils/renderChildGameState";
import React from "react";
import Col from "react-bootstrap/Col";
import RodrikTheReaderAbilityGameState
    from "../../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/post-combat-game-state/after-winner-determination-game-state/rodrik-the-reader-ability-game-state/RodrikTheReaderAbilityGameState";
import SelectWesterosCardGameState
    from "../../../common/ingame-game-state/select-westeros-card-game-state/SelectWesterosCardGameState";
import SelectWesterosCardComponent from "../SelectWesterosCardComponent";
import SimpleChoiceGameState from "../../../common/ingame-game-state/simple-choice-game-state/SimpleChoiceGameState";
import SimpleChoiceComponent from "../SimpleChoiceComponent";
import { tr } from "../../i18n/i18n";

@observer
export default class RodrikTheReaderAbilityComponent extends Component<GameStateComponentProps<RodrikTheReaderAbilityGameState>> {
    render(): ReactNode {
        return (
            <>
                <Col xs={12} className="text-center">
                    {tr("auto.game-state-panel.house-card-abilities.RodrikTheReaderAbilityComponent.0", { p0: (<b>{this.props.gameState.childGameState.house.name}</b>) })}</Col>
                {renderChildGameState(this.props, [
                    [SimpleChoiceGameState, SimpleChoiceComponent],
                    [SelectWesterosCardGameState, SelectWesterosCardComponent]
                ])}
            </>
        );
    }
}
