import {observer} from "mobx-react";
import {Component, ReactNode} from "react";
import GameStateComponentProps from "../GameStateComponentProps";
import renderChildGameState from "../../utils/renderChildGameState";
import React from "react";
import Col from "react-bootstrap/Col";
import SimpleChoiceGameState from "../../../common/ingame-game-state/simple-choice-game-state/SimpleChoiceGameState";
import SimpleChoiceComponent from "../SimpleChoiceComponent";
import RobertArrynAbilityGameState from "../../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/post-combat-game-state/after-combat-house-card-abilities-game-state/robert-arryn-ability-game-state/RobertArrynAbilityGameState";
import SelectHouseCardGameState from "../../../common/ingame-game-state/select-house-card-game-state/SelectHouseCardGameState";
import SelectHouseCardComponent from "../SelectHouseCardComponent";
import joinReactNodes from "../../../client/utils/joinReactNodes";
import House from "../../../common/ingame-game-state/game-data-structure/House";
import { t, tr } from "../../i18n/i18n";

@observer
export default class RobertArrynAbilityComponent extends Component<GameStateComponentProps<RobertArrynAbilityGameState>> {
    get gameState(): RobertArrynAbilityGameState {
        return this.props.gameState;
    }

    get house(): House {
        return this.gameState.childGameState.house;
    }

    get simpleChoice(): SimpleChoiceGameState | null {
        return this.gameState.childGameState instanceof SimpleChoiceGameState ? this.gameState.childGameState : null;
    }

    get selectHouseCard(): SelectHouseCardGameState<RobertArrynAbilityGameState> | null {
        return this.gameState.childGameState instanceof SelectHouseCardGameState ? this.gameState.childGameState : null;
    }

    render(): ReactNode {
        const possibleHouseCardToRemove = this.props.gameState.possibleEnemyHouseCards;
        return (
            <>
                {this.simpleChoice && (
                    <Col xs={12} className="text-center">
                        {tr("auto.game-state-panel.house-card-abilities.RobertArrynAbilityComponent.0", { p0: (<b>{this.house.name}</b>), p1: (joinReactNodes(possibleHouseCardToRemove.map(hc => <b key={`robert-arryn_${hc.id}`}>{hc.name}</b>), t("auto2.game-state-panel.house-card-abilities.RobertArrynAbilityComponent.0"))) })}</Col>
                )}
                {this.selectHouseCard && (
                    <Col xs={12} className="text-center">
                        {tr("auto.game-state-panel.house-card-abilities.RobertArrynAbilityComponent.1", { p0: (<b>{this.house.name}</b>) })}</Col>
                )}
                {renderChildGameState(this.props, [
                    [SimpleChoiceGameState, SimpleChoiceComponent],
                    [SelectHouseCardGameState, SelectHouseCardComponent]
                ])}
            </>
        );
    }
}
