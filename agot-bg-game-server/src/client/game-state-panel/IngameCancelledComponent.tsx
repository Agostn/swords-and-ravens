import { Component, ReactNode } from "react";
import CancelledGameState from "../../common/cancelled-game-state/CancelledGameState";
import * as React from "react";
import { observer } from "mobx-react";
import GameStateComponentProps from "./GameStateComponentProps";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { tr } from "../i18n/i18n";

@observer
export default class IngameCancelledComponent extends Component<GameStateComponentProps<CancelledGameState>> {
    render(): ReactNode {
        return (
            <>
                <Row>
                    {this.props.gameState.ingame?.childGameStateBeforeCancellation ? (
                        <Col className="text-center">
                            {tr("auto.game-state-panel.IngameCancelledComponent.0", { p0: (<FontAwesomeIcon icon={faTimes} size="3x" />) })}</Col>
                    ) : (
                        <Col className="text-center">
                            {tr("auto.game-state-panel.IngameCancelledComponent.1", { p0: (<FontAwesomeIcon icon={faTimes} size="3x" />) })}</Col>
                    )}
                </Row>
            </>
        );
    }
}
