import {observer} from "mobx-react";
import BiddingGameState, {BiddingGameStateParent} from "../../common/ingame-game-state/westeros-game-state/bidding-game-state/BiddingGameState";
import {Component, ReactNode} from "react";
import * as React from "react";
import GameStateComponentProps from "./GameStateComponentProps";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Player from "../../common/ingame-game-state/Player";
import { t } from "../i18n/i18n";
import HouseChip from "../hud/HouseChip";
import classNames from "classnames";
import * as _ from "lodash";
import hudSettings from "../hud/hudSettings";

@observer
export default class BiddingComponent<ParentGameState extends BiddingGameStateParent> extends Component<GameStateComponentProps<BiddingGameState<ParentGameState>>> {
    get gameState(): BiddingGameState<ParentGameState> {
        return this.props.gameState;
    }

    get authenticatedPlayer(): Player | null {
        return this.props.gameClient.authenticatedPlayer;
    }

    get powerTokensToBid(): number {
        return this.gameState.powerTokensToBid;
    }

    get biddenPowerTokens(): number {
        return this.authenticatedPlayer
            ? this.gameState.bids.tryGet(this.authenticatedPlayer.house, -1)
            : -1;
    }

    get dirty(): boolean {
        return this.powerTokensToBid != this.biddenPowerTokens;
    }

    constructor(props: GameStateComponentProps<BiddingGameState<ParentGameState>>) {
        super(props);

        this.gameState.powerTokensToBid = Math.max(this.biddenPowerTokens, 0);
    }

    // Fichas de Poder de todas as Casas que estão dando lance (os lances
    // continuam secretos; só mostramos quem já confirmou).
    renderPowerOfHouses(): ReactNode {
        const houses = _.sortBy(this.gameState.participatingHouses, h => -h.powerTokens);
        const me = this.authenticatedPlayer?.house ?? null;
        return (
            <Col xs={12}>
                <div className="bid-power-list" aria-label={t("bid.powerOfHouses")}>
                    <span className="bid-power-title">{t("bid.powerOfHouses")}</span>
                    {houses.map(h => {
                        const done = this.gameState.bids.has(h);
                        return (
                            <span key={`bid-power-${h.id}`} className={classNames("bid-power-house", { mine: h == me, done })}
                                title={done ? t("bid.alreadyBid", { house: h.name }) : t("bid.notYet", { house: h.name })}>
                                <HouseChip house={h} size={22} />
                                <span className="bid-power-name">{h.name}</span>
                                <b>{h.powerTokens}</b>
                                {done && <span className="bid-power-done" aria-label={t("bid.alreadyBid", { house: h.name })}>✓</span>}
                            </span>
                        );
                    })}
                </div>
            </Col>
        );
    }

    // Tela nova: número grande no meio com − e +, atalhos (nada / metade / tudo),
    // botão que diz o lance e as Casas com as fichas e quem já deu o lance.
    renderHud(): ReactNode {
        const me = this.authenticatedPlayer?.house ?? null;
        const max = me?.powerTokens ?? 0;
        const participates = me != null && this.gameState.participatingHouses.includes(me);
        const already = this.biddenPowerTokens >= 0;
        const n = this.powerTokensToBid;
        const setBid = (v: number): void => {
            this.gameState.powerTokensToBid = Math.max(0, Math.min(max, v));
        };
        const houses = _.sortBy(this.gameState.participatingHouses, h => -h.powerTokens);
        const left = this.gameState.getHousesLeftToBid();
        return (
            <Col xs={12}>
                <div className="bidx">
                    {participates && (
                        <div className="bidx-card">
                            <div className="bidx-label">{t("bid.yourBid")}</div>
                            <div className="bidx-control">
                                <button type="button" className="bidx-step" aria-label={t("bid.less")}
                                    disabled={n <= 0} onClick={() => setBid(n - 1)}>−</button>
                                <div className="bidx-value" aria-live="polite">
                                    <b>{n}</b>
                                    <small>{t("bid.ofYourTokens", { max })}</small>
                                </div>
                                <button type="button" className="bidx-step" aria-label={t("bid.more")}
                                    disabled={n >= max} onClick={() => setBid(n + 1)}>+</button>
                            </div>
                            <input
                                type="range"
                                className="bidx-range"
                                min={0}
                                max={max}
                                value={n}
                                aria-label={t("bid.yourBid")}
                                onChange={e => setBid(parseInt(e.target.value))}
                                disabled={max == 0}
                                style={{ "--fill": `${max > 0 ? (n / max) * 100 : 0}%` } as React.CSSProperties}
                            />
                            <div className="bidx-quick">
                                {[
                                    [0, t("bid.quick.none")],
                                    [Math.floor(max / 2), t("bid.quick.half")],
                                    [max, t("bid.quick.all")]
                                ].map(([v, label]) => (
                                    <button key={`bidx-q-${label}`} type="button"
                                        className={classNames("bidx-chip", { active: n == v })}
                                        onClick={() => setBid(v as number)} disabled={max == 0 && v != 0}>
                                        {label} <small>({v})</small>
                                    </button>
                                ))}
                            </div>
                            <button type="button" className="bidx-confirm"
                                disabled={!this.dirty} onClick={() => this.bid(n)}>
                                {already && !this.dirty
                                    ? t("bid.sent", { n })
                                    : already
                                        ? t("bid.change", { n })
                                        : t("bid.give", { n })}
                            </button>
                            <div className="bidx-secret">{t("bid.secret")}</div>
                        </div>
                    )}
                    <div className="bidx-houses">
                        <div className="bidx-label">{t("bid.powerOfHouses")}</div>
                        <div className="bidx-house-list">
                            {houses.map(h => {
                                const done = this.gameState.bids.has(h);
                                return (
                                    <div key={`bidx-h-${h.id}`} className={classNames("bidx-house", { mine: h == me, done })}>
                                        <HouseChip house={h} size={26} />
                                        <span className="bidx-house-name">{h.name}</span>
                                        <span className="bidx-house-power" title={t("hud.stats.power", { n: h.powerTokens })}>
                                            <b>{h.powerTokens}</b>
                                            <small>{t("bid.tokensWord", { n: h.powerTokens })}</small>
                                        </span>
                                        <span className={classNames("bidx-house-state", { done })}>
                                            {done ? t("bid.state.done") : t("bid.state.thinking")}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {left.length > 0 && (
                            <div className="bidx-waiting">
                                {t("common.waitingFor", { who: left.map(h => this.props.gameState.ingame.getControllerOfHouse(h).house.name).join(", ") })}
                            </div>
                        )}
                    </div>
                </div>
            </Col>
        );
    }

    render(): ReactNode {
        if (hudSettings.hudActive) return this.renderHud();
        const max = this.authenticatedPlayer?.house.powerTokens ?? 0;
        const setBid = (n: number): void => {
            this.gameState.powerTokensToBid = Math.max(0, Math.min(max, n));
        };
        return (
            <>
                {this.renderPowerOfHouses()}
                {this.authenticatedPlayer && this.gameState.participatingHouses.includes(this.authenticatedPlayer.house) && (
                    <>
                        <Col xs={12}>
                            <Row className="justify-content-center align-items-center mb-1 flex-nowrap">
                                <Col xs="auto" className="px-1">
                                    <button type="button" className="btn btn-sm btn-outline-light bid-step"
                                        aria-label={t("bid.less")} disabled={this.powerTokensToBid <= 0}
                                        onClick={() => setBid(this.powerTokensToBid - 1)}>−</button>
                                </Col>
                                <Col xs="auto" className="px-1">
                                    <input
                                        type="range"
                                        className="custom-range"
                                        min={0}
                                        max={this.authenticatedPlayer.house.powerTokens}
                                        value={this.powerTokensToBid}
                                        onChange={e => {
                                            this.gameState.powerTokensToBid = parseInt(e.target.value);
                                        }}
                                        disabled={this.authenticatedPlayer.house.powerTokens==0}
                                    />
                                </Col>
                                <Col xs="auto" className="px-1">
                                    <button type="button" className="btn btn-sm btn-outline-light bid-step"
                                        aria-label={t("bid.more")} disabled={this.powerTokensToBid >= max}
                                        onClick={() => setBid(this.powerTokensToBid + 1)}>+</button>
                                </Col>
                                <Col xs="auto" className="px-1">
                                    <div className="bid-value">
                                        {t("bid.ofMax", { n: this.powerTokensToBid, max })}
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                        <Col xs={12} className="text-center">
                            <Button type="button"
                                onClick={() => this.bid(this.powerTokensToBid)}
                                disabled={!this.dirty}
                                variant="success"
                                className="mt-4"
                            >
                                {t("common.confirm")}
                            </Button>
                        </Col>
                    </>
                )}
                <Col xs={12} className="text-center">
                    {t("common.waitingFor", { who: this.gameState.getHousesLeftToBid().map(h => this.props.gameState.ingame.getControllerOfHouse(h).house.name).join(", ") })}
                </Col>
            </>
        );
    }

    bid(powerTokens: number): void {
        this.gameState.bid(powerTokens);
    }
}
