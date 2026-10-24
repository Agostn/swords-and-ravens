import { Component, ReactNode } from "react";
import PlanningGameState from "../../common/ingame-game-state/planning-game-state/PlanningGameState";
import { observer } from "mobx-react";
import React from "react";
import GameStateComponentProps from "./GameStateComponentProps";
import ClaimVassalsGameState from "../../common/ingame-game-state/planning-game-state/claim-vassals-game-state/ClaimVassalsGameState";
import PlaceOrdersGameState from "../../common/ingame-game-state/planning-game-state/place-orders-game-state/PlaceOrdersGameState";
import renderChildGameState from "../utils/renderChildGameState";
import ClaimVassalsComponent from "./ClaimVassalsComponent";
import PlaceOrdersComponent from "./PlaceOrdersComponent";
import MusteringGameState from "../../common/ingame-game-state/westeros-game-state/mustering-game-state/MusteringGameState";
import MusteringComponent from "./MusteringComponent";
import { Row, Col } from "react-bootstrap";
import WesterosCardComponent from "./utils/WesterosCardComponent";
import PlaceOrdersForVassalsGameState from "../../common/ingame-game-state/planning-game-state/place-orders-for-vassals-game-state/PlaceOrdersForVassalsGameState";
import PlaceOrdersForVassalsComponent from "./PlaceOrdersForVassalsComponent";
import classNames from "classnames";
import hudSettings from "../hud/hudSettings";
import { t } from "../i18n/i18n";
import { isTouchDevice } from "../hud/touchTooltips";

@observer
export default class PlanningComponent extends Component<GameStateComponentProps<PlanningGameState>> {
    // Cartas que proíbem um tipo de ordem nesta rodada
    private static readonly RESTRICTING_CARDS = ["rains-of-autumn", "storm-of-swords", "web-of-lies", "sea-of-storms", "feast-for-crows"];

    // Tela nova: as cartas de Westeros da rodada numa faixa com nome e efeito,
    // para ficar claro o que são e por que estão ali.
    private renderHudWesterosStrip(): ReactNode {
        const cards = this.props.gameState.revealedWesterosCards;
        if (cards.length == 0) return null;
        const collapsed = hudSettings.isCollapsed("westerosCards");
        const touch = isTouchDevice();
        return (
            <div className={classNames("hud-westeros-strip", { collapsed })}>
                <button
                    type="button"
                    className="hud-westeros-strip-title"
                    aria-expanded={!collapsed}
                    onClick={() => hudSettings.toggleSection("westerosCards")}
                >
                    <span>
                        {t("hud.westeros.title")}
                        {collapsed
                            ? <span className="hud-muted"> · {cards.map((wc) => wc.type.name).join(" · ")}</span>
                            : <span className="hud-muted"> · {touch ? t("hud.westeros.hintTouch") : t("hud.westeros.hint")}</span>}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d={collapsed ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"} />
                    </svg>
                </button>
                {!collapsed && <div className="hud-westeros-strip-cards">
                    {cards.map((wc, i) => {
                        const restricts = PlanningComponent.RESTRICTING_CARDS.includes(wc.type.id);
                        return (
                            <div key={`hud-wc_${wc.id}_${i}`} className={classNames("hud-westeros-card", { restricts })}>
                                <WesterosCardComponent
                                    cardType={wc.type}
                                    westerosDeckI={i}
                                    wasReshuffled={this.props.gameState.game.winterIsComingHappened[i]}
                                    size={"tiny"}
                                    tooltip={true}
                                />
                                <div className="hud-westeros-card-text">
                                    <small className="hud-muted">{t("hud.westeros.deck", { n: ["I", "II", "III", "IV"][i] ?? i + 1 })}</small>
                                    <b>{wc.type.name}</b>
                                    {wc.type.shortDescription && (
                                        <small className={restricts ? "hud-restricts" : "hud-muted"}>
                                            {restricts ? `⚠ ${wc.type.shortDescription}` : wc.type.shortDescription}
                                        </small>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>}
            </div>
        );
    }

    render(): ReactNode {
        return (
            <>
                {hudSettings.hudActive && this.renderHudWesterosStrip()}
                {!hudSettings.hudActive && this.props.gameState.revealedWesterosCards.length > 0 && (
                    <Row className="justify-content-around mb-2">
                        {this.props.gameState.revealedWesterosCards.map((wc, i) => (
                            <Col xs="auto" key={`planning_revealed-wcs_${wc.id}_${i}`}>
                                <WesterosCardComponent
                                    cardType={wc.type}
                                    westerosDeckI={i}
                                    wasReshuffled={this.props.gameState.game.winterIsComingHappened[i]}
                                    size={"small"}
                                    tooltip={true}
                                />
                            </Col>
                        ))}
                    </Row>)}
                <Row className="justify-content-center">
                    {renderChildGameState(this.props, [
                        [PlaceOrdersGameState, PlaceOrdersComponent],
                        [PlaceOrdersForVassalsGameState, PlaceOrdersForVassalsComponent],
                        [ClaimVassalsGameState, ClaimVassalsComponent],
                        [MusteringGameState, MusteringComponent]
                    ])}
                </Row>
            </>
        );
    }
}
