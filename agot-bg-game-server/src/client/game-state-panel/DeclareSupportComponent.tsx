import {observer} from "mobx-react";
import DeclareSupportGameState
    from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/declare-support-game-state/DeclareSupportGameState";
import {Component, ReactNode} from "react";
import React from "react";
import GameStateComponentProps from "./GameStateComponentProps";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import House from "../../common/ingame-game-state/game-data-structure/House";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import ConditionalWrap from "../utils/ConditionalWrap";
import { t, tr } from "../i18n/i18n";

@observer
export default class DeclareSupportComponent extends Component<GameStateComponentProps<DeclareSupportGameState>> {
    render(): ReactNode {
        return (
            <>
                <Col xs={12} className="text-center">
                    {tr("auto.game-state-panel.DeclareSupportComponent.0", { p0: (this.props.gameState.house.name) })}</Col>
                <Col xs={12}>
                    {this.props.gameClient.doesControlHouse(this.props.gameState.house) ? (
                        <Row className="justify-content-center">
                            {this.props.gameState.combatGameState.houseCombatDatas.keys.map(h => (
                                <Col xs="auto" key={`declare-support_${h.id}`}>
                                    <ConditionalWrap
                                        condition={!this.canChoose(h)}
                                        wrap={c =>
                                            <OverlayTrigger
                                                overlay={
                                                    <Tooltip id="support-choice-restricted">
                                                        {t("auto.game-state-panel.DeclareSupportComponent.1")}</Tooltip>
                                                }
                                            >
                                                {c}
                                            </OverlayTrigger>
                                        }
                                    >
                                        <Button type="button"
                                            onClick={() => this.choose(h)}
                                            disabled={!this.canChoose(h)}
                                        >
                                            {h.name} ({h == this.props.gameState.combatGameState.attacker ? t("auto2.game-state-panel.DeclareSupportComponent.0") : t("auto2.game-state-panel.DeclareSupportComponent.1")})
                                        </Button>
                                    </ConditionalWrap>
                                </Col>
                            ))}
                            <Col xs="auto">
                                <Button type="button" variant="danger" onClick={() => this.choose(null)}>
                                    {t("auto.game-state-panel.DeclareSupportComponent.2")}</Button>
                            </Col>
                        </Row>
                    ) : (
                        <div className="text-center">
                            {tr("auto.game-state-panel.DeclareSupportComponent.3", { p0: (this.props.gameState.ingameGameState.getControllerOfHouse(this.props.gameState.house).house.name) })}</div>
                    )}
                </Col>
            </>
        );
    }

    canChoose(supportedHouse: House): boolean {
        return this.props.gameState.combatGameState.isRestrictedToHimself(this.props.gameState.house) ? supportedHouse == this.props.gameState.house : true;
    }

    choose(house: House | null): void {
        this.props.gameState.choose(house);
    }
}
