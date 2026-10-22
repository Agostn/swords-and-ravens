import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import GameStateComponentProps from "./GameStateComponentProps";
import React from "react";
import { Button, Col, Row } from "react-bootstrap";
import ScoreSpecialObjectivesGameState from "../../common/ingame-game-state/action-game-state/score-objectives-game-state/score-special-objectives-game-state/ScoreSpecialObjectivesGameState";
import Player from "../../common/ingame-game-state/Player";
import { t } from "../i18n/i18n";

@observer
export default class ScoreSpecialObjectivesComponent extends Component<GameStateComponentProps<ScoreSpecialObjectivesGameState>> {
    get authenticatedPlayer(): Player | null {
        return this.props.gameClient.authenticatedPlayer;
    }

    get gameState(): ScoreSpecialObjectivesGameState {
        return this.props.gameState;
    }

    get mustChoose(): boolean {
        return this.authenticatedPlayer != null && !this.gameState.readyHouses.includes(this.authenticatedPlayer.house);
    }

    render(): ReactNode {
        return <>
            <Col xs={12} className="text-center">
                {t("auto.game-state-panel.ScoreSpecialObjectivesComponent.0")}</Col>
            {this.authenticatedPlayer && this.mustChoose && <Col xs={12}>
                <Row className="justify-content-center">
                    <Col xs="auto">
                        <Button type="button" onClick={() => this.choose(true)}>{t("auto.game-state-panel.ScoreSpecialObjectivesComponent.1")}</Button>
                    </Col>
                    <Col xs="auto">
                        <Button type="button" onClick={() => this.choose(false)}>{t("auto.game-state-panel.ScoreSpecialObjectivesComponent.2")}</Button>
                    </Col>
                </Row>
            </Col>}
            <Col xs={12} className="text-center">
                {t("common.waitingFor", { who: this.gameState.notReadyHouses.map(h => h.name).join(", ") })}
            </Col>
        </>;
    }

    choose(score: boolean): void {
        if (score == false && !window.confirm(t("auto2.game-state-panel.ScoreSpecialObjectivesComponent.0"))) {
            return;
        }

        this.gameState.sendDecision(score);
    }
}
