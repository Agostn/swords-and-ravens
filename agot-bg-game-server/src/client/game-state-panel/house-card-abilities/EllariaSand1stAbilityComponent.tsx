import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import GameStateComponentProps from "../GameStateComponentProps";
import renderChildGameState from "../../utils/renderChildGameState";
import SelectUnitsGameState from "../../../common/ingame-game-state/select-units-game-state/SelectUnitsGameState";
import SelectUnitsComponent from "../SelectUnitsComponent";
import EllariaSand1stAbilityGameState from "../../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/immediately-house-card-abilities-resolution-game-state/ellaria-sand-1st-ability-game-state/EllariaSand1stAbilityGameState";
import React from "react";
import Col from "react-bootstrap/Col";
import { tr } from "../../i18n/i18n";

@observer
export default class EllariaSand1stAbilityComponent extends Component<
  GameStateComponentProps<EllariaSand1stAbilityGameState>
> {
  render(): ReactNode {
    return (
      <>
        <Col xs={12} className="text-center">
          {tr("auto.game-state-panel.house-card-abilities.EllariaSand1stAbilityComponent.0", { p0: (<b>{this.props.gameState.childGameState.house.name}</b>) })}</Col>
        {renderChildGameState(this.props, [
          [SelectUnitsGameState, SelectUnitsComponent]
        ])}
      </>
    );
  }
}
