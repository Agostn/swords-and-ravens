import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import GameStateComponentProps from "../GameStateComponentProps";
import renderChildGameState from "../../utils/renderChildGameState";
import React from "react";
import Col from "react-bootstrap/Col";
import SimpleChoiceGameState from "../../../common/ingame-game-state/simple-choice-game-state/SimpleChoiceGameState";
import SimpleChoiceComponent from "../SimpleChoiceComponent";
import StannisBaratheonASoSAbilityGameState from "../../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/before-combat-house-card-abilities-game-state/stannis-baratheon-asos-ability-game-state/StannisBaratheonASoSAbilityGameState";
import { tr } from "../../i18n/i18n";

@observer
export default class StannisBaratheonASoSAbilityComponent extends Component<
  GameStateComponentProps<StannisBaratheonASoSAbilityGameState>
> {
  render(): ReactNode {
    return (
      <>
        <Col xs={12} className="text-center">
          {tr("auto.game-state-panel.house-card-abilities.StannisBaratheonASoSAbilityComponent.0", { p0: (<b>{this.props.gameState.childGameState.house.name}</b>) })}</Col>
        {renderChildGameState(this.props, [
          [SimpleChoiceGameState, SimpleChoiceComponent]
        ])}
      </>
    );
  }
}
