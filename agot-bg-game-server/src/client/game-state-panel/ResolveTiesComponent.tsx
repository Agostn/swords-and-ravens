import {Component, ReactNode} from "react";
import {observer} from "mobx-react";
import ResolveTiesGameState
    from "../../common/ingame-game-state/westeros-game-state/clash-of-kings-game-state/resolve-ties-game-state/ResolveTiesGameState";
import React from "react";
import {observable} from "mobx";
import House from "../../common/ingame-game-state/game-data-structure/House";
import * as _ from "lodash";
import GameStateComponentProps from "./GameStateComponentProps";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import {faAngleLeft} from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import {faAngleRight} from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import HouseIconComponent from "./utils/HouseIconComponent";
import HouseNumberResultsComponent from "../HouseNumberResultsComponent";
import { t } from "../i18n/i18n";
import hudSettings from "../hud/hudSettings";
import HouseChip from "../hud/HouseChip";
import housePowerTokensImages from "../housePowerTokensImages";
import classNames from "classnames";

@observer
export default class ResolveTiesComponent extends Component<GameStateComponentProps<ResolveTiesGameState>> {
    @observable currentOrdering: House[];

    constructor(props: GameStateComponentProps<ResolveTiesGameState>) {
        super(props);

        this.currentOrdering = _.flatten(props.gameState.bidResults.map(([_bid, houses]) => houses));
    }

    private get trackName(): string {
        const keys = ["tracks.ironThrone", "tracks.fiefdoms", "tracks.kingsCourt"] as const;
        return t(keys[this.props.gameState.parentGameState.currentTrackI] ?? keys[0]);
    }

    // Tela nova: lista vertical da trilha (1º, 2º...), com o lance e o símbolo de Poder de cada
    // Casa; as setas aparecem só para quem está empatado.
    private renderHud(): ReactNode {
        const gs = this.props.gameState;
        const canDecide = this.props.gameClient.doesControlHouse(gs.decider);
        const ordering = canDecide ? this.currentOrdering : _.flatten(gs.bidResults.map(([, houses]) => houses));
        const tied = new Set(_.flatten(gs.getTiesToResolve().filter(x => x.houses.length > 1).map(x => x.houses)));
        return (
            <Col xs={12}>
                <div className="ties">
                    <div className="ties-head">
                        <HouseChip house={gs.decider} size={26} />
                        <div className="ties-head-text">
                            <b>{t("ties.title", { track: this.trackName })}</b>
                            <small>{canDecide ? t("ties.youDecide") : t("ties.waiting", { house: gs.decider.name })}</small>
                        </div>
                    </div>
                    <ol className="ties-list">
                        {ordering.map((h, i) => {
                            const up = canDecide && this.displayArrow(i, -1);
                            const down = canDecide && this.displayArrow(i, 1);
                            const stars = gs.stars ? (gs.game.starredOrderRestrictions[i] ?? 0) : 0;
                            return (
                                <li key={`ties_${h.id}`} className={classNames("ties-row", { tied: tied.has(h) })}>
                                    <span className="ties-pos">{i + 1}º</span>
                                    <HouseChip house={h} size={26} />
                                    <span className="ties-name">
                                        {h.name}
                                        {stars > 0 && <small className="ties-stars" title={t("hud.tracks.stars", { n: stars })}>{"★".repeat(stars)}</small>}
                                    </span>
                                    {tied.has(h) && <span className="ties-tag">{t("ties.tied")}</span>}
                                    <span className="ties-bid" title={t("ties.bid", { n: gs.getBidOfHouse(h) })}>
                                        <span className="ties-token" style={{ backgroundImage: `url(${housePowerTokensImages.get(h.id)})` }} />
                                        <b>{gs.getBidOfHouse(h)}</b>
                                    </span>
                                    {canDecide && (
                                        <span className="ties-arrows">
                                            <button type="button" className="ties-arrow" disabled={!up} aria-label={t("ties.up", { house: h.name })} title={t("ties.up", { house: h.name })} onClick={() => this.changeOrder(i, -1)}>▲</button>
                                            <button type="button" className="ties-arrow" disabled={!down} aria-label={t("ties.down", { house: h.name })} title={t("ties.down", { house: h.name })} onClick={() => this.changeOrder(i, 1)}>▼</button>
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                    {canDecide && (
                        <button type="button" className="hud-primary-action ties-confirm" onClick={() => this.submit()}>
                            {t("ties.confirm")}
                        </button>
                    )}
                </div>
            </Col>
        );
    }

    render(): ReactNode {
        if (hudSettings.hudActive) return this.renderHud();
        const results = _.flatMap(this.props.gameState.bidResults.map(([bid, houses]) => houses.map(h => [h, bid] as [House, number])));
        return (
            <>
                <Col xs={12} className="text-center">
                    {t("auto.game-state-panel.ResolveTiesComponent.0")}</Col>
                {this.props.gameClient.doesControlHouse(this.props.gameState.decider) ? (
                        <Col xs={12}>
                            <Row className="justify-content-center align-items-center">
                                {this.currentOrdering.map((h, i) => (
                                    <Col xs="auto" key={`resolve-ties_${h.id}`} className="mb-4">
                                        {this.props.gameState.stars && (
                                            <div className="resolve-ties-tracker-star-container">
                                                {_.range(0, this.props.gameState.game.starredOrderRestrictions[i]).map(j => (
                                                    <div key={`resolve-ties_stars_${h?.id ?? i}_${j}`}>
                                                        <FontAwesomeIcon
                                                            style={{ color: "#ffc107", fontSize: "9px" }}
                                                            icon={faStar} />
                                                    </div>))}
                                            </div>
                                        )}
                                        <div className="mb-2">
                                            <HouseIconComponent house={h}/>
                                        </div>
                                        <div className="text-center" style={{fontSize: "1.125rem", marginBottom: "5px"}}>{this.props.gameState.getBidOfHouse(h)}</div>
                                        <div className="btn-group btn-group-xs">
                                            <button type="button"
                                                className="btn btn-primary"
                                                style={{visibility: this.displayArrow(i, -1) ? "initial": "hidden"}}
                                                onClick={() => this.changeOrder(i, -1)}
                                            >
                                                <FontAwesomeIcon icon={faAngleLeft}/>
                                            </button>
                                            <button type="button"
                                                className="btn btn-primary"
                                                style={{visibility: this.displayArrow(i, 1) ? "initial": "hidden"}}
                                                onClick={() => this.changeOrder(i, 1)}
                                            >
                                                <FontAwesomeIcon icon={faAngleRight}/>
                                            </button>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                            <Row className="justify-content-center mt-5">
                                <Col xs="auto">
                                    <Button type="button" variant="success" onClick={() => this.submit()}>{t("auto.game-state-panel.ResolveTiesComponent.1")}</Button>
                                </Col>
                            </Row>
                        </Col>
                ) : <>
                    <Col xs={12}>
                        <p className="text-center">{t("auto.game-state-panel.ResolveTiesComponent.2")}</p>
                        <div className="d-flex justify-content-center">
                            <HouseNumberResultsComponent results={results} keyPrefix="resolve-ties"/>
                        </div>
                    </Col>
                    <Col xs={12} className="text-center">{t("common.waitingFor", { who: this.props.gameState.decider.name })}</Col>
                </>}
            </>
        );
    }

    displayArrow(spot: number, direction: number): boolean {
        return this.props.gameState.getTiesToResolve().some(({trackerPlace, houses}) => {
            if (direction == 1) {
                return trackerPlace <= spot && spot + 1 < trackerPlace + houses.length ;
            } else if (direction == -1) {
                return trackerPlace <= spot - 1 && spot < trackerPlace + houses.length;
            }

            return false;
        });
    }

    changeOrder(spot: number, direction: number): void {
        // Swap the element of this.currentOrdering at index [spot] and [spot + direction]
        this.currentOrdering[spot] = this.currentOrdering.splice(spot + direction, 1, this.currentOrdering[spot])[0];
    }

    submit(): void {
        const resolvedTies = this.props.gameState.getTiesToResolve().map(({trackerPlace, houses}) =>
            this.currentOrdering.slice(trackerPlace, trackerPlace + houses.length)
        );

        this.props.gameState.resolveTies(resolvedTies);
    }
}
