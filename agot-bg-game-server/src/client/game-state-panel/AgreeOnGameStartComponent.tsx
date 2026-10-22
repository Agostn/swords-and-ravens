import { Component, ReactNode } from "react";
import * as React from "react";
import { observer } from "mobx-react";
import GameStateComponentProps from "./GameStateComponentProps";
import Row from "react-bootstrap/Row";
import Player from "../../common/ingame-game-state/Player";
import { Button, Col } from "react-bootstrap";
import AgreeOnGameStartGameState from "../../common/ingame-game-state/draft-game-state/agree-on-game-start-game-state/AgreeOnGameStartGameState";
import { t } from "../i18n/i18n";

@observer
export default class AgreeOnGameStartComponent extends Component<GameStateComponentProps<AgreeOnGameStartGameState>> {
    get player(): Player | null {
        return this.props.gameClient.authenticatedPlayer;
    }

    get isParticipatingInDraft(): boolean {
        return this.player != null && this.props.gameState.parentGameState.participatingHouses.includes(this.player.house);
    }

    render(): ReactNode {
        return (
            <>
                <Row className="justify-content-center">
                    <Col xs={12} className="text-center">
                        {t("auto.game-state-panel.AgreeOnGameStartComponent.0")}</Col>
                </Row>
                {this.isParticipatingInDraft && this.player != null &&
                <Row className="justify-content-center">
                    <Col xs="auto">
                        <Button type="button"
                            disabled={this.props.gameState.readyHouses.includes(this.player.house)}
                            onClick={() => this.props.gameState.agree()}
                            variant="success"
                        >
                            {t("auto.game-state-panel.AgreeOnGameStartComponent.1")}</Button>
                    </Col>
                    <Col xs="auto">
                        <Button type="button"
                            onClick={() => this.props.gameState.disagree()}
                            variant="danger"
                        >
                            {t("auto.game-state-panel.AgreeOnGameStartComponent.2")}</Button>
                    </Col>
                </Row>}
                <Row className="mt-3 justify-content-center">
                    <Col xs={12} className="text-center">
                        {t("common.waitingFor", { who: this.props.gameState.getNotReadyPlayers().map(p => p.house.name).join(", ") })}
                    </Col>
                </Row>
            </>
        );
    }
}
