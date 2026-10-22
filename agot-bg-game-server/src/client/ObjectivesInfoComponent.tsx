import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import * as React from "react";
import { Col, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import IngameGameState from "../common/ingame-game-state/IngameGameState";
import Game from "../common/ingame-game-state/game-data-structure/Game";
import { specialObjectiveCards, objectiveCards } from "../common/ingame-game-state/game-data-structure/static-data-structure/objectiveCards";
import ObjectiveCardComponent from "./game-state-panel/utils/ObjectiveCardComponent";
import GameClient from "./GameClient";
import _ from "lodash";
import Player from "../common/ingame-game-state/Player";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookReader, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { OverlayChildren } from "react-bootstrap/esm/Overlay";
import { t, tr } from "./i18n/i18n";

interface ObjectivesInfoComponentProps {
    ingame: IngameGameState;
    gameClient: GameClient;
}

@observer
export default class ObjectivesInfoComponent extends Component<ObjectivesInfoComponentProps> {
    get ingame(): IngameGameState {
        return this.props.ingame;
    }

    get game(): Game {
        return this.props.ingame.game;
    }

    get authenticatedPlayer(): Player | null {
        return this.props.gameClient.authenticatedPlayer;
    }

    render(): ReactNode {
        const allCompletedObjectives = _.flatMap(this.game.houses.values, h => h.completedObjectives);
        const playersSecretObjectives = this.authenticatedPlayer ? this.authenticatedPlayer.house.secretObjectives : [];
        const allAvailableObjectives = _.sortBy(_.without(objectiveCards.values, ...allCompletedObjectives, ...playersSecretObjectives), oc => oc.name);
        return <Col xs={12} className="h-100">
            {playersSecretObjectives.length > 0 && <Row className="justify-content-center">
                <Col xs={12}><h5 className="mb-0 text-center">{t("auto.ObjectivesInfoComponent.0")}</h5></Col>
                {playersSecretObjectives.map(oc =>
                    <Col xs="auto" key={`secret-objective_${oc.id}`}>
                        <ObjectiveCardComponent
                            objectiveCard={oc}
                            size="medium"
                        />
                    </Col>)}
            </Row>}
            <Row className="justify-content-center mt-4">
                <Col xs={12}><h5 className="mb-0 text-center">{t("auto.ObjectivesInfoComponent.1")}</h5></Col>
                {specialObjectiveCards.values.map(oc =>
                    <Col xs="auto" key={`special-objective_${oc.id}`}>
                        <ObjectiveCardComponent
                            objectiveCard={oc}
                            size="smedium"
                        />
                    </Col>)}
            </Row>
            {this.game.houses.values.filter(h => h.completedObjectives.length > 0).map(h =>
            <Row className="justify-content-center mt-4" key={`completed-objectives_${h.id}`}>
                <Col xs={12}><h5 className="mb-0 text-center">{tr("auto.ObjectivesInfoComponent.2", { p0: (h.name) })}</h5></Col>
                {h.completedObjectives.map(oc =>
                    <Col xs="auto" key={`completed-objective_${h.id}_${oc.id}`}>
                        <ObjectiveCardComponent
                            objectiveCard={oc}
                            size="tiny"
                        />
                    </Col>)}
            </Row>)}
            <Row className="justify-content-center mt-4">
                <Col xs={12}><h5 className="mb-0 text-center">{this.authenticatedPlayer || allCompletedObjectives.length > 0 ? t("auto2.ObjectivesInfoComponent.0") : t("auto2.ObjectivesInfoComponent.1")}</h5></Col>
                {allAvailableObjectives.map(oc =>
                    <Col xs="auto" key={`all-objectives_${oc.id}`}>
                        <ObjectiveCardComponent
                            objectiveCard={oc}
                            size="tiny"
                        />
                    </Col>)}
            </Row>
            <Row className="justify-content-center mt-4 clickable">
                <Col xs={12}>
                    <OverlayTrigger overlay={this.renderRulesTooltip()}
                        trigger="click"
                        rootClose
                        placement="auto">
                            <h5 className="mb-0 text-center">
                                <FontAwesomeIcon
                                    style={{ fontSize: "1.25rem" }}
                                    icon={faBookReader} />
                                <span className="px-2">{t("auto.ObjectivesInfoComponent.3")}</span>
                                <FontAwesomeIcon
                                    style={{ fontSize: "1.25rem" }}
                                    icon={faQuestionCircle} />
                            </h5>
                    </OverlayTrigger>
                </Col>
            </Row>
        </Col>;
    }

    renderRulesTooltip(): OverlayChildren {
        return <Tooltip id="affc-rules-tooltip" className="tooltip-w-100">
            <h5 className="text-center">{t("auto.ObjectivesInfoComponent.4")}</h5>
            {tr("auto.ObjectivesInfoComponent.5")}
            <h5 className="text-center">{t("auto.ObjectivesInfoComponent.6")}</h5>
            {tr("auto.ObjectivesInfoComponent.7")}
            <ol className="mb-0 mt-1">
                <li>{tr("auto.ObjectivesInfoComponent.8")}</li>
                <li>{tr("auto.ObjectivesInfoComponent.9")}</li>
                <li>{tr("auto.ObjectivesInfoComponent.10")}</li>
                <li>{tr("auto.ObjectivesInfoComponent.11")}</li>
            </ol>
            <br/>
            <h5 className="text-center">{t("auto.ObjectivesInfoComponent.12")}</h5>
            {tr("auto.ObjectivesInfoComponent.13")}
            <h5 className="text-center">{t("auto.ObjectivesInfoComponent.14")}</h5>
            {tr("auto.ObjectivesInfoComponent.15")}</Tooltip>;
    }
}