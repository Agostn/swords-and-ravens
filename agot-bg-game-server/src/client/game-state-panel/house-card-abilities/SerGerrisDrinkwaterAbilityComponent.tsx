import {observer} from "mobx-react";
import {Component, ReactNode} from "react";
import GameStateComponentProps from "../GameStateComponentProps";
import renderChildGameState from "../../utils/renderChildGameState";
import React from "react";
import Col from "react-bootstrap/Col";
import SerGerrisDrinkwaterAbilityGameState
    from "../../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/post-combat-game-state/after-winner-determination-game-state/ser-gerris-drinkwater-ability-game-state/SerGerrisDrinkwaterAbilityGameState";
import SelectUnitsGameState from "../../../common/ingame-game-state/select-units-game-state/SelectUnitsGameState";
import SelectUnitsComponent from "../SelectUnitsComponent";
import SimpleChoiceGameState from "../../../common/ingame-game-state/simple-choice-game-state/SimpleChoiceGameState";
import SimpleChoiceComponent from "../SimpleChoiceComponent";
import { tr } from "../../i18n/i18n";

@observer
export default class SerGerrisDrinkwaterAbilityComponent extends Component<GameStateComponentProps<SerGerrisDrinkwaterAbilityGameState>> {
    render(): ReactNode {
        return (
            <>
                <Col xs={12} className="text-center">
                    {tr("auto.game-state-panel.house-card-abilities.SerGerrisDrinkwaterAbilityComponent.0", { p0: (<b>{this.props.gameState.childGameState.house.name}</b>) })}</Col>
                {renderChildGameState(this.props, [
                    [SimpleChoiceGameState, SimpleChoiceComponent],
                    [SelectUnitsGameState, SelectUnitsComponent]
                ])}
            </>
        );
    }
}
