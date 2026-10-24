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

import hudSettings from "../hud/hudSettings";
import HouseChip from "../hud/HouseChip";
import classNames from "classnames";

@observer
export default class DeclareSupportComponent extends Component<GameStateComponentProps<DeclareSupportGameState>> {
    // Tela nova: um cartão por lado da batalha (com o brasão) e um para "não apoiar".
    private renderHud(): ReactNode {
        const gs = this.props.gameState;
        const combat = gs.combatGameState;
        const mine = this.props.gameClient.doesControlHouse(gs.house);
        return (
            <Col xs={12}>
                <div className="hud-choice-text">
                    {tr("auto.game-state-panel.DeclareSupportComponent.0", { p0: (gs.house.name) })}
                    <small className="support-where">{t("support.battle", { attacker: combat.attacker.name, defender: combat.defender.name, region: combat.defendingRegion.name })}</small>
                </div>
                {mine ? (
                    <div className="hud-choices">
                        {combat.houseCombatDatas.keys.map(h => {
                            const role = h == combat.attacker ? t("auto2.game-state-panel.DeclareSupportComponent.0") : t("auto2.game-state-panel.DeclareSupportComponent.1");
                            return (
                                <button
                                    type="button"
                                    key={`hud-support_${h.id}`}
                                    className={classNames("hud-choice support-choice", { mine: h == gs.house })}
                                    disabled={!this.canChoose(h)}
                                    title={!this.canChoose(h) ? t("auto.game-state-panel.DeclareSupportComponent.1") : undefined}
                                    onClick={() => this.choose(h)}
                                >
                                    <HouseChip house={h} size={34} />
                                    <span>{t("support.support", { house: h.name })}</span>
                                    <small>{role}</small>
                                </button>
                            );
                        })}
                        <button type="button" className="hud-choice bad" onClick={() => this.choose(null)}>
                            <span className="support-none" aria-hidden="true">∅</span>
                            <span>{t("auto.game-state-panel.DeclareSupportComponent.2")}</span>
                        </button>
                    </div>
                ) : (
                    <div className="text-center hud-muted-line">
                        {tr("auto.game-state-panel.DeclareSupportComponent.3", { p0: (gs.ingameGameState.getControllerOfHouse(gs.house).house.name) })}
                    </div>
                )}
            </Col>
        );
    }

    render(): ReactNode {
        if (hudSettings.hudActive) return this.renderHud();
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
