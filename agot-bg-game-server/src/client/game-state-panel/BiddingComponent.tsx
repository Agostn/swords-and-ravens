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

    render(): ReactNode {
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
