import { observer } from "mobx-react";
import { Component, default as React, ReactNode } from "react";
import WildlingsAttackGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/WildlingsAttackGameState";
import BiddingGameState from "../../../common/ingame-game-state/westeros-game-state/bidding-game-state/BiddingGameState";
import BiddingComponent from "../BiddingComponent";
import hudSettings from "../../hud/hudSettings";
import SimpleChoiceGameState from "../../../common/ingame-game-state/simple-choice-game-state/SimpleChoiceGameState";
import SimpleChoiceComponent from "../SimpleChoiceComponent";
import PreemptiveRaidWildlingVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/preemptive-raid-wildling-victory-game-state/PreemptiveRaidWildlingVictoryGameState";
import PreemptiveRaidWildlingVictoryComponent from "./PreemptiveRaidWildlingVictoryComponent";
import renderChildGameState from "../../utils/renderChildGameState";
import GameStateComponentProps from "../GameStateComponentProps";
import CrowKillersWildlingVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/crow-killers-wildling-victory-game-state/CrowKillersWildlingVictoryGameState";
import CrowKillersWildlingVictoryComponent from "./CrowKillersWildlingVictoryComponent";
import CrowKillersNightsWatchVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/crow-killers-nights-watch-victory-game-state/CrowKillersNightsWatchVictoryGameState";
import CrowKillersNigthsWatchVictoryComponent from "./CrowKillersNigthsWatchVictoryComponent";
import { Col, Row } from "react-bootstrap";
import RattleshirtsRaidersWildlingVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/rattleshirts-raiders-wildling-victory-game-state/RattleshirtsRaidersWildlingVictoryGameState";
import RattleshirtsRaidersWildlingVictoryComponent from "./RattleshirtsRaidersWildlingVictoryComponent";
import MassingOnTheMilkwaterWildlingVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/massing-on-the-milkwater-wildling-victory-game-state/MassingOnTheMilkwaterWildlingVictoryGameState";
import MassingOnTheMilkwaterWildlingVictoryComponent from "./MassingOnTheMilkwaterWildlingVictoryComponent";
import AKingBeyondTheWallWildlingVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/a-king-beyond-the-wall-wildling-victory-game-state/AKingBeyondTheWallWildlingVictoryGameState";
import AKingBeyondTheWallWildlingVictoryComponent from "./AKingBeyondTheWallWildlingVictoryComponent";
import AKingBeyondTheWallNightsWatchVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/a-king-beyond-the-wall-nights-watch-victory-game-state/AKingBeyondTheWallNightsWatchVictoryGameState";
import AKingBeyondTheWallNightsWatchVictoryComponent from "./AKingBeyondTheWallNightsWatchVictoryComponent";
import MammothRidersWildlingVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/mammoth-riders-wildling-victory-game-state/MammothRidersWildlingVictoryGameState";
import MammothRidersWildlingVictoryComponent from "./MammothRidersWildlingVictoryComponent";
import MammothRidersNightsWatchVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/mammoth-riders-nights-watch-victory-game-state/MammothRidersNightsWatchVictoryGameState";
import MammothRidersNightsWatchVictoryComponent from "./MammothRidersNightsWatchVictoryComponent";
import TheHordeDescendsWildlingVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/the-horde-descends-wildling-victory-game-state/TheHordeDescendsWildlingVictoryGameState";
import TheHordeDescendsWildlingVictoryComponent from "./TheHordeDescendsWildlingVictoryComponent";
import TheHordeDescendsNightsWatchVictoryGameState
    from "../../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/the-horde-descends-nights-watch-victory-game-state/TheHordeDescendsNightsWatchVictoryGameState";
import TheHordeDescendsNightsWatchVictoryComponent from "./TheHordeDescendsNightsWatchVictoryComponent";
import WildlingCardComponent from "../utils/WildlingCardComponent";
import joinReactNodes from "../../../client/utils/joinReactNodes";
import House from "../../../common/ingame-game-state/game-data-structure/House";
import _ from "lodash";
import HouseNumberResultsComponent from "../../../client/HouseNumberResultsComponent";
import mammothImage from "../../../../public/images/icons/mammoth.svg";
import TakeControlOfEnemyPortGameState from "../../../common/ingame-game-state/take-control-of-enemy-port-game-state/TakeControlOfEnemyPortGameState";
import TakeControlOfEnemyPortComponent from "../TakeControlOfEnemyPortComponent";
import { t, tr } from "../../i18n/i18n";

@observer
export default class WildlingsAttackComponent extends Component<GameStateComponentProps<WildlingsAttackGameState>> {
    render(): ReactNode {
        const wildlingCardType = this.props.gameState.wildlingCard ? this.props.gameState.wildlingCard.type : null;
        const results = this.props.gameState.biddingResults
            ? _.flatMap(this.props.gameState.biddingResults.map(([bid, houses]) => houses.map(h => [h, bid] as [House, number])))
            : null;
        if (hudSettings.hudActive && this.props.gameState.childGameState instanceof BiddingGameState) {
            const gs = this.props.gameState;
            return (
                <>
                    <Col xs={12}>
                        <div className="wl-head">
                            <div className="wl-strength">
                                <img src={mammothImage} width={34} alt="" />
                                <b>{gs.wildlingStrength}</b>
                                <small>{t("wl.strength")}</small>
                            </div>
                            <div className="wl-explain">
                                <b className="wl-title">{t("auto.game-state-panel.wildlings-attack-component.WildlingsAttackComponent.0")}</b>
                                <div className="wl-outcomes">
                                    <div className="wl-outcome nw">
                                        <span className="wl-outcome-head">{t("wl.nwWins", { n: gs.wildlingStrength })}</span>
                                        <span>{t("wl.nwWinsText")}</span>
                                    </div>
                                    <div className="wl-outcome wl">
                                        <span className="wl-outcome-head">{t("wl.wlWins", { n: gs.wildlingStrength })}</span>
                                        <span>{t("wl.wlWinsText")}</span>
                                    </div>
                                </div>
                                {gs.excludedHouses.length > 0 && (
                                    <small className="wl-excluded">
                                        {t("wl.excluded", { houses: gs.excludedHouses.map(h => h.name).join(", ") })}
                                    </small>
                                )}
                            </div>
                        </div>
                    </Col>
                    <Row>
                        {renderChildGameState(this.props, [[BiddingGameState, BiddingComponent]])}
                    </Row>
                </>
            );
        }
        return (
            <>
                {!this.props.gameState.biddingResults && <Row className="justify-content-center mt-2 mb-1">
                    <img src={mammothImage} width="40px" className="mr-2" /><h4 className="mt-2">{t("auto.game-state-panel.wildlings-attack-component.WildlingsAttackComponent.0")}</h4><img src={mammothImage} width="40px" className="ml-2" />
                </Row>}
                {this.props.gameState.biddingResults && <h5 className="text-center mt-1">
                    {this.props.gameState.nightsWatchWon ? t("auto2.game-state-panel.wildlings-attack-component.WildlingsAttackComponent.0") : t("auto2.game-state-panel.wildlings-attack-component.WildlingsAttackComponent.1")}
                </h5>}
                {wildlingCardType && (
                    <Row className="justify-content-center">
                        <Col xs="auto">
                            <WildlingCardComponent cardType={wildlingCardType} size="fairly" tooltip />
                        </Col>
                    </Row>
                )}
                <Row>
                    {this.props.gameState.childGameState instanceof BiddingGameState ? (
                        <Col xs={12} className="text-center mb-3">
                            {tr("auto.game-state-panel.wildlings-attack-component.WildlingsAttackComponent.1")}{this.props.gameState.excludedHouses.length > 0 &&
                                (<> {" "}{tr("auto.game-state-panel.wildlings-attack-component.WildlingsAttackComponent.2", { p0: (joinReactNodes(this.props.gameState.excludedHouses.map(h =>
                                    <b key={`wildling_excluded-house_${h.id}`}>{h.name}</b>), ", ")) })}</>)} {" "}{tr("auto.game-state-panel.wildlings-attack-component.WildlingsAttackComponent.3", { p0: (<b style={{ fontSize: "2rem" }}>{this.props.gameState.wildlingStrength}</b>) })}</Col>
                    ) : results ?
                        <Col xs={12} className="no-space-around">
                            <div className="text-center mb-1">{t("auto.game-state-panel.wildlings-attack-component.WildlingsAttackComponent.4")}</div>
                            <div className="d-flex justify-content-center">
                                <HouseNumberResultsComponent results={results} keyPrefix="wildlings" />
                            </div>
                        </Col>
                        : <></>}
                    {this.props.gameState._highestBidder && <Col xs={12} className="justify-content-center">
                        <div className="text-center mt-1">
                            {tr("auto.game-state-panel.wildlings-attack-component.WildlingsAttackComponent.5", { p0: (<b style={{ "color": this.props.gameState._highestBidder.color }}>{this.props.gameState._highestBidder.name}</b>) })}
                        </div>
                    </Col>}
                    {this.props.gameState._lowestBidder && <Col xs={12} className="justify-content-center">
                        <div className="text-center mt-1">
                            {tr("auto.game-state-panel.wildlings-attack-component.WildlingsAttackComponent.6", { p0: (<b style={{ "color": this.props.gameState._lowestBidder.color }}>{this.props.gameState._lowestBidder.name}</b>) })}
                        </div>
                    </Col>}
                    {this.props.gameState.childGameState && renderChildGameState<WildlingsAttackGameState>(this.props, [
                        [SimpleChoiceGameState, SimpleChoiceComponent],
                        [BiddingGameState, BiddingComponent],
                        [PreemptiveRaidWildlingVictoryGameState, PreemptiveRaidWildlingVictoryComponent],
                        [CrowKillersWildlingVictoryGameState, CrowKillersWildlingVictoryComponent],
                        [CrowKillersNightsWatchVictoryGameState, CrowKillersNigthsWatchVictoryComponent],
                        [RattleshirtsRaidersWildlingVictoryGameState, RattleshirtsRaidersWildlingVictoryComponent],
                        [MassingOnTheMilkwaterWildlingVictoryGameState, MassingOnTheMilkwaterWildlingVictoryComponent],
                        [AKingBeyondTheWallWildlingVictoryGameState, AKingBeyondTheWallWildlingVictoryComponent],
                        [AKingBeyondTheWallNightsWatchVictoryGameState, AKingBeyondTheWallNightsWatchVictoryComponent],
                        [MammothRidersWildlingVictoryGameState, MammothRidersWildlingVictoryComponent],
                        [MammothRidersNightsWatchVictoryGameState, MammothRidersNightsWatchVictoryComponent],
                        [TheHordeDescendsWildlingVictoryGameState, TheHordeDescendsWildlingVictoryComponent],
                        [TheHordeDescendsNightsWatchVictoryGameState, TheHordeDescendsNightsWatchVictoryComponent],
                        [TakeControlOfEnemyPortGameState, TakeControlOfEnemyPortComponent]
                    ])}
                </Row>
            </>
        );
    }
}
