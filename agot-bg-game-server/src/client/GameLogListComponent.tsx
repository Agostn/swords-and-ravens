import { Component, ReactNode } from "react";
import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import IngameGameState, {
  ReplacementReason
} from "../common/ingame-game-state/IngameGameState";
import {
  GameLogData,
  PlayerActionType
} from "../common/ingame-game-state/game-data-structure/GameLog";
import Game from "../common/ingame-game-state/game-data-structure/Game";
import House from "../common/ingame-game-state/game-data-structure/House";
import unitTypes from "../common/ingame-game-state/game-data-structure/unitTypes";
import World from "../common/ingame-game-state/game-data-structure/World";
import UnitType from "../common/ingame-game-state/game-data-structure/UnitType";
import Region from "../common/ingame-game-state/game-data-structure/Region";
import { westerosCardTypes } from "../common/ingame-game-state/game-data-structure/westeros-card/westerosCardTypes";
import { observer } from "mobx-react";
import WildlingCardComponent from "./game-state-panel/utils/WildlingCardComponent";
import WildlingCard from "../common/ingame-game-state/game-data-structure/wildling-card/WildlingCard";
import WesterosCardComponent from "./game-state-panel/utils/WesterosCardComponent";
import _ from "lodash";
import joinReactNodes from "./utils/joinReactNodes";
import orders from "../common/ingame-game-state/game-data-structure/orders";
import CombatInfoComponent from "./CombatInfoComponent";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import User from "../server/User";
import BetterMap from "../utils/BetterMap";
import { tidesOfBattleCards } from "../common/ingame-game-state/game-data-structure/static-data-structure/tidesOfBattleCards";
import HouseNumberResultsComponent from "./HouseNumberResultsComponent";
import { preventOverflow } from "@popperjs/core";
import loanCardTypes from "../common/ingame-game-state/game-data-structure/loan-card/loanCardTypes";
import orderTypes from "../common/ingame-game-state/game-data-structure/order-types/orderTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFastForward } from "@fortawesome/free-solid-svg-icons";
import LoanCardComponent from "./game-state-panel/utils/LoanCardComponent";
import { objectiveCards } from "../common/ingame-game-state/game-data-structure/static-data-structure/objectiveCards";
import ObjectiveCardComponent from "./game-state-panel/utils/ObjectiveCardComponent";
import { ObjectiveCard } from "../common/ingame-game-state/game-data-structure/static-data-structure/ObjectiveCard";
import crossedSwordsImage from "../../public/images/icons/crossed-swords.svg";
import mammothImage from "../../public/images/icons/mammoth.svg";
import getUserLinkOrLabel from "./utils/getIngameUserLinkOrLabel";
import GameClient from "./GameClient";
import GameLogManager, {
  ticksToTime,
  timeToTicks
} from "../common/ingame-game-state/game-data-structure/GameLogManager";
import { secondsToString } from "./utils/secondsToString";
import SimpleInfluenceIconComponent from "./game-state-panel/utils/SimpleInfluenceIconComponent";
import orderImages from "./orderImages";
import presentImage from "../../public/images/icons/present.svg";
import HouseCardComponent from "./game-state-panel/utils/HouseCardComponent";
import allKnownHouseCards from "./utils/houseCardHelper";
import classNames from "classnames";
import GameReplayManager from "./game-replay/GameReplayManager";
import { t, tr } from "./i18n/i18n";

const fogOfWarRegion = "a region";
const fogOfWarUnit = "unit";

// Acontecimentos que viram blocos grandes (cabeçalhos, tabelas, cartas)
// e não cabem no resumo da tela nova.
const HUD_SKIPPED_LOG_TYPES: string[] = [
  "turn-begin",
  "orders-revealed",
  "combat-result",
  "westeros-cards-drawn",
  "wildling-card-revealed",
  "wildling-bidding",
  "clash-of-kings-bidding-done",
  "clash-of-kings-final-ordering",
  "westeros-card-executed",
  "westeros-phase-began",
  "planning-phase-began",
  "action-phase-began",
  "draft-house-cards-began",
  "action-phase-resolve-raid-began",
  "action-phase-resolve-march-began",
  "action-phase-resolve-consolidate-power-began",
  "user-house-assignments"
];

interface GameLogListComponentProps {
  ingameGameState: IngameGameState;
  gameClient: GameClient;
  currentlyViewed: boolean;
  scrollToLog?: number;
  // Tela nova: mostra só os últimos N acontecimentos, sem cabeçalhos
  onlyLast?: number;
}

@observer
export default class GameLogListComponent extends Component<GameLogListComponentProps> {
  private allHouseCards = allKnownHouseCards;
  allHouseCardsByAbilityId = new BetterMap(
    this.allHouseCards.values
      .filter((hc) => hc.ability != null)
      .map((hc) => [hc.ability?.id ?? "ability-never-null-here", hc])
  );

  currentRound = 0;

  get ingame(): IngameGameState {
    return this.props.ingameGameState;
  }

  get game(): Game {
    return this.ingame.game;
  }

  get world(): World {
    return this.game.world;
  }

  get logManager(): GameLogManager {
    return this.ingame.gameLogManager;
  }

  get replayManager(): GameReplayManager {
    return this.ingame.replayManager;
  }

  get fogOfWar(): boolean {
    return this.ingame.fogOfWar;
  }

  render(): ReactNode {
    const lastSeenLogTicks = this.props.gameClient.authenticatedUser
      ? this.logManager.lastSeenLogTimes.tryGet(
          this.props.gameClient.authenticatedUser,
          null
        )
      : null;

    const lastSeenLogTime = lastSeenLogTicks
      ? ticksToTime(lastSeenLogTicks)
      : null;

    this.currentRound = 0;

    if (this.props.onlyLast) {
      const recent = this.logManager.logs
        .filter((l) => !HUD_SKIPPED_LOG_TYPES.includes(l.data.type))
        .slice(-this.props.onlyLast);
      return recent.map((l, i) => (
        <div key={`hud-log_${i}`} className="hud-log-line">
          {this.renderGameLogData(l.data, this.game.turn)}
        </div>
      ));
    }

    const highlightLog = (i: number): boolean => {
      return this.replayManager.isReplayMode
        ? i == this.replayManager.selectedLogIndex
        : this.replayManager.isModifyingGameLogUI(this.logManager.logs[i].data);
    };

    return this.logManager.logs.map((l, i) => (
      <div key={`log_${i}`}>
        {lastSeenLogTime == null && i == 0 && (
          <Row className="justify-content-center align-items-center">
            <Col xs={true}>
              <hr className="red" />
            </Col>
            <Col xs="auto" style={{ color: "red" }}>
              <h6>{t("auto.GameLogListComponent.0")}</h6>
            </Col>
            <Col xs={true}>
              <hr className="red" />
            </Col>
          </Row>
        )}
        <Row>
          <Col xs="auto" className="text-muted px-0 ml-2">
            <OverlayTrigger
              placement="auto"
              overlay={
                <Tooltip id={"log-date-" + l.time.getUTCMilliseconds()}>
                  {l.time.toLocaleString()}
                </Tooltip>
              }
              popperConfig={{ modifiers: [preventOverflow] }}
            >
              <small>
                {l.time.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false
                })}
              </small>
            </OverlayTrigger>
          </Col>
          {l.resolvedAutomatically && (
            <Col xs="auto">
              <OverlayTrigger
                overlay={
                  <Tooltip id="logs-tooltip">
                    {t("auto.GameLogListComponent.1")}</Tooltip>
                }
                placement="auto"
                popperConfig={{ modifiers: [preventOverflow] }}
              >
                <span>
                  <FontAwesomeIcon
                    style={{ color: "white" }}
                    icon={faFastForward}
                  />
                </span>
              </OverlayTrigger>
            </Col>
          )}
          <Col className="mr-2">
            <div
              id={`game-log-content-${i}`}
              className={classNames("game-log-content", {
                "highlight-log": highlightLog(i),
                "clickable-no-underline": this.replayManager.isReplayMode
              })}
              onClick={() => {
                if (this.replayManager.isReplayMode) {
                  this.onLogClick(i);
                } else if (highlightLog(i)) {
                  this.onLogClick(i);
                }
              }}
            >
              {this.renderGameLogData(l.data, this.currentRound)}
            </div>
          </Col>
        </Row>
        {lastSeenLogTime &&
          i + 1 < this.logManager.logs.length &&
          this.logManager.logs[i].time <= lastSeenLogTime &&
          this.logManager.logs[i + 1].time > lastSeenLogTime && (
            <Row className="justify-content-center align-items-center">
              <Col xs={true}>
                <hr className="red" />
              </Col>
              <Col xs="auto" style={{ color: "red" }}>
                <h6>{t("auto.GameLogListComponent.2")}</h6>
              </Col>
              <Col xs={true}>
                <hr className="red" />
              </Col>
            </Row>
          )}
      </div>
    ));
  }

  onLogClick(i: number): void {
    this.replayManager.selectLog(i);
  }

  renderGameLogData(data: GameLogData, currentRound: number): ReactNode {
    switch (data.type) {
      case "player-action": {
        const house = this.game.houses.get(data.house);
        const forHouses = data.forHouses
          ? data.forHouses.map((hid) => this.game.houses.get(hid))
          : null;
        let text: string;

        switch (data.action) {
          case PlayerActionType.ORDERS_PLACED:
            text = t("log.action.ordersPlaced");
            break;
          case PlayerActionType.BID_MADE:
            text = t("log.action.bidMade");
            break;
          case PlayerActionType.HOUSE_CARD_CHOSEN:
            text = t("log.action.houseCardChosen");
            break;
          default:
            text = "Invalid PlayerActionType received";
            break;
        }
        return (
          <p>
            {tr("auto.GameLogListComponent.3", { p0: (<b>{house.name}</b>), p1: (text) })}
            {forHouses ? (
              <>
                {" "}{t("auto.GameLogListComponent.4")}{" "}
                {forHouses.length == 1 ? (
                  <>
                    {tr("auto.GameLogListComponent.5", { p0: (<b key={`for_vassal_house_${forHouses[0].id}`}>
                      {forHouses[0].name}
                    </b>) })}
                  </>
                ) : (
                  joinReactNodes(
                    forHouses.map((h) => (
                      <b key={`for_vassal_house_${h.id}`}>{h.name}</b>
                    )),
                    ", "
                  )
                )}
              </>
            ) : (
              <></>
            )}
            .
          </p>
        );
      }
      case "user-house-assignments":
        const assignments = data.assignments.map(([houseId, userId]) => [
          this.game.houses.get(houseId),
          this.ingame.entireGame.users.get(userId)
        ]) as [House, User][];
        return (
          <>
            <div id="gamelog-round-0" className="text-center mb-4">
              <h4>{tr("auto.GameLogListComponent.6", { p0: (assignments.length) })}</h4>
            </div>
            {assignments.map(([house, user]) => (
              <p key={`${house.id}_${user.id}`}>
                {tr("auto.GameLogListComponent.7", { p0: (this.renderHouseName(house)), p1: (<b>{getUserLinkOrLabel(user)}</b>) })}</p>
            ))}
          </>
        );
      case "turn-begin":
        this.currentRound = data.turn;
        return (
          <Row className="justify-content-center">
            <Col xs={true}>
              <hr />
            </Col>
            <Col xs="auto">
              <h3 id={`gamelog-round-${data.turn}`}>
                {tr("auto.GameLogListComponent.8", { p0: (<b>{data.turn}</b>) })}
              </h3>
            </Col>
            <Col xs={true}>
              <hr />
            </Col>
          </Row>
        );

      case "support-declared":
        const supporter = this.game.houses.get(data.supporter);
        const supported = data.supported
          ? this.game.houses.get(data.supported)
          : null;
        if (supported) {
          return (
            <p>
              {tr("auto.GameLogListComponent.9", { p0: (<b>{supporter.name}</b>), p1: (<b>{supported.name}</b>) })}</p>
          );
        } else {
          return (
            <p>
              {tr("auto.GameLogListComponent.10", { p0: (<b>{supporter.name}</b>) })}</p>
          );
        }

      case "support-refused": {
        const house = this.game.houses.get(data.house);
        const from = data.from ? this.game.houses.get(data.from) : null;
        return (
          <p>
            {tr("auto.GameLogListComponent.11", { p0: (<b>{house.name}</b>), p1: (from == null ? t("auto2.GameLogListComponent.0") : "") })}{from ? (
              <>
                {" "}{tr("auto.GameLogListComponent.12", { p0: (<b>{from.name}</b>) })}
              </>
            ) : null}
            .
          </p>
        );
      }

      case "attack":
        const attacker = this.game.houses.get(data.attacker);
        // A "null" for "attacked" means it was an attack against a neutral force
        const attacked = data.attacked
          ? this.game.houses.get(data.attacked)
          : null;
        const attackingRegion = this.game.world.regions.get(
          data.attackingRegion
        );
        const attackedRegion = this.game.world.regions.get(data.attackedRegion);
        const army = data.units.map((utid) => unitTypes.get(utid));
        const orderImgUrl = data.orderType
          ? orderImages.get(data.orderType)
          : null;

        return (
          <Row className="align-items-center">
            {orderImgUrl && (
              <Col xs="auto">
                <img src={orderImgUrl} width="42px" />
              </Col>
            )}
            <Col xs="auto">
              <img src={crossedSwordsImage} width="32px" />
            </Col>
            <Col>
              {tr("auto.GameLogListComponent.13", { p0: (<b>{attacker.name}</b>) })}{" "}
              {attacked ? (
                <>
                  {tr("auto.GameLogListComponent.14", { p0: (<b>{attacked.name}</b>) })}
                </>
              ) : (
                <>
                  {tr("auto.GameLogListComponent.15")}
                </>
              )}{" "}{tr("auto.GameLogListComponent.16", { p0: (<b>{attackingRegion.name}</b>), p1: (<b>{attackedRegion.name}</b>), p2: (<>
                {joinReactNodes(
                  army.map((ut, i) => (
                    <b key={`attack_${ut.id}_${i}`}>
                      {this.fogOfWar ? fogOfWarUnit : ut.name}
                    </b>
                  )),
                  ", "
                )}
              </>) })}</Col>
          </Row>
        );

      case "march-resolved": {
        const house = this.game.houses.get(data.house);

        if (this.fogOfWar) {
          return (
            <Row className="align-items-center">
              <Col>
                <p>
                  {tr("auto.GameLogListComponent.17", { p0: (<b>{house.name}</b>) })}</p>
              </Col>
            </Row>
          );
        }

        const startingRegion = this.world.regions.get(data.startingRegion);
        const moves: [Region, UnitType[]][] = data.moves.map(([rid, utids]) => [
          this.world.regions.get(rid),
          utids.map((utid) => unitTypes.get(utid))
        ]);
        const orderImgUrl = data.orderType
          ? orderImages.get(data.orderType)
          : null;

        return (
          <Row className="align-items-center">
            {orderImgUrl && (
              <Col xs="auto">
                <img src={orderImgUrl} width="42px" />
              </Col>
            )}
            <Col>
              {moves.length > 0 ? (
                <>
                  <p>
                    {tr("auto.GameLogListComponent.18", { p0: (<b>{house.name}</b>), p1: (<b>{startingRegion.name}</b>) })}</p>
                  <ul>
                    {moves.map(([region, unitTypes]) => (
                      <li key={`march-resolved_${region.id}`}>
                        {tr("auto.GameLogListComponent.19", { p0: (joinReactNodes(
                          unitTypes.map((ut, i) => (
                            <b key={`march_${region.id}_${ut.id}_${i}`}>
                              {this.fogOfWar ? fogOfWarUnit : ut.name}
                            </b>
                          )),
                          ", "
                        )), p1: (<b>{region.name}</b>) })}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p>
                    {tr("auto.GameLogListComponent.20", { p0: (<b>{house.name}</b>), p1: (<b>{startingRegion.name}</b>) })}</p>
                </>
              )}
            </Col>
          </Row>
        );
      }
      case "leave-power-token-choice": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);

        return (
          <p>
            {tr("auto.GameLogListComponent.21", { p0: (<b>{house.name}</b>) })}{" "}
            {data.leftPowerToken ? <>{t("auto.GameLogListComponent.22")}</> : <b>{t("auto.GameLogListComponent.23")}</b>} {" "}{tr("auto.GameLogListComponent.24", { p0: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "westeros-card-executed":
        const westerosCardType = westerosCardTypes.get(data.westerosCardType);

        return (
          <>
            <Row className="justify-content-center">
              <Col xs="auto">
                <WesterosCardComponent
                  cardType={westerosCardType}
                  size="medium"
                  tooltip={true}
                  westerosDeckI={data.westerosDeckI}
                  showTitle={true}
                />
              </Col>
            </Row>
          </>
        );

      case "westeros-cards-drawn":
        const drawnWesterosCardTypes = data.westerosCardTypes.map((wctid) =>
          westerosCardTypes.get(wctid)
        );

        return (
          <>
            <p>{t("auto.GameLogListComponent.25")}</p>
            <Row className="justify-content-around">
              {drawnWesterosCardTypes.map((wct, i) => (
                <Col xs="auto" key={`${wct.id}_${i}`}>
                  <WesterosCardComponent
                    cardType={wct}
                    size="small"
                    tooltip={true}
                    westerosDeckI={
                      !data.revealAndResolveTop3WesterosDeck4Cards ? i : 3
                    }
                    showTitle={true}
                  />
                </Col>
              ))}
            </Row>
            {data.addedWildlingStrength > 0 && (
              <p style={{ marginTop: "1.0em" }}>
                {tr("auto.GameLogListComponent.26", { p0: (data.addedWildlingStrength) })}
              </p>
            )}
          </>
        );

      case "combat-result":
        const winner = this.game.houses.get(data.winner);
        const houseCombatDatas = data.stats.map((stat) => {
          const house = this.game.houses.get(stat.house);
          const houseCard =
            stat.houseCard != null
              ? this.allHouseCards.get(stat.houseCard)
              : null;
          const tidesOfBattleCard =
            stat.tidesOfBattleCard === undefined
              ? undefined
              : stat.tidesOfBattleCard != null
                ? tidesOfBattleCards.get(stat.tidesOfBattleCard)
                : null;

          return {
            ...stat,
            house,
            region: this.world.regions.get(stat.region),
            houseCard: houseCard,
            armyUnits: stat.armyUnits.map((ut) => unitTypes.get(ut)),
            woundedUnits: stat.woundedUnits.map((ut) => unitTypes.get(ut)),
            tidesOfBattleCard: tidesOfBattleCard,
            isWinner: house == winner
          };
        });

        return (
          <>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <CombatInfoComponent housesCombatData={houseCombatDatas} />
            </div>
            <p className="text-center mt-4">
              {tr("auto.GameLogListComponent.27", { p0: (<b style={{ color: winner.color, fontSize: "1.25rem" }}>
                {winner.name}
              </b>) })}</p>
          </>
        );
      case "wildling-card-revealed":
        const wildlingCard = this.game.wildlingDeck.find(
          (wc) => wc.id == data.wildlingCard
        ) as WildlingCard;

        return (
          <>
            <p>
              {tr("auto.GameLogListComponent.28", { p0: (<b>{wildlingCard.type.name}</b>) })}
            </p>
            <Row className="justify-content-center">
              <Col xs="auto">
                <WildlingCardComponent
                  cardType={wildlingCard.type}
                  size="medium"
                  tooltip
                />
              </Col>
            </Row>
          </>
        );
      case "wildling-bidding": {
        const bids = _.flatMap(
          data.results.map(([bid, hids]) =>
            hids.map(
              (hid) => [this.game.houses.get(hid), bid] as [House, number]
            )
          )
        );

        return (
          <>
            <p>
              {tr("auto.GameLogListComponent.29", { p0: (<b>{data.wildlingStrength}</b>) })}</p>
            <div className="mt-1">
              <HouseNumberResultsComponent
                results={bids}
                keyPrefix="wildlings-log"
              ></HouseNumberResultsComponent>
            </div>
            {data.nightsWatchVictory ? (
              <p className="text-center">
                {tr("auto.GameLogListComponent.30")}</p>
            ) : (
              <p className="text-center">
                {tr("auto.GameLogListComponent.31")}</p>
            )}
          </>
        );
      }
      case "lowest-bidder-chosen": {
        const lowestBidder = this.game.houses.get(data.lowestBidder);

        return (
          <p>
            {tr("auto.GameLogListComponent.32", { p0: (<b>{lowestBidder.name}</b>) })}</p>
        );
      }
      case "highest-bidder-chosen":
        const highestBidder = this.game.houses.get(data.highestBidder);

        return (
          <p>
            {tr("auto.GameLogListComponent.33", { p0: (<b>{highestBidder.name}</b>) })}</p>
        );

      case "player-mustered": {
        const house = this.game.houses.get(data.house);
        const musterings = data.musterings.map(
          ([originatingRegion, recruitments]) =>
            [
              this.game.world.regions.get(originatingRegion),
              recruitments.map(({ region, from, to }) => ({
                region: this.game.world.regions.get(region),
                from: from ? unitTypes.get(from) : null,
                to: unitTypes.get(to)
              }))
            ] as [
              Region,
              { region: Region; from: UnitType | null; to: UnitType }[]
            ]
        );

        return (
          <>
            {musterings.length == 0 && (
              <p>
                {tr("auto.GameLogListComponent.34", { p0: (<b>{house.name}</b>) })}</p>
            )}
            {musterings.length > 0 && (
              <>
                {musterings.map(([originatingRegion, recruitments]) => (
                  <div key={`$mustering_${originatingRegion.id}`}>
                    <p>
                      {tr("auto.GameLogListComponent.35", { p0: (<b>{house.name}</b>), p1: (<b>
                        {this.fogOfWar
                          ? fogOfWarRegion
                          : originatingRegion.name}
                      </b>) })}</p>
                    {!this.fogOfWar && (
                      <ul>
                        {recruitments.map(({ region, from, to }, i) => (
                          <li key={"recruitment-" + region.id + "-" + i}>
                            {from ? (
                              <>
                                {tr("auto.GameLogListComponent.36", { p0: (<b>{to.name}</b>), p1: (<b>{from.name}</b>) })}
                                {originatingRegion != region && (
                                  <>
                                    {" "}{tr("auto.GameLogListComponent.37", { p0: (<b>
                                      {this.fogOfWar
                                        ? fogOfWarRegion
                                        : region.name}
                                    </b>) })}
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                A <b>{to.name}</b>
                                {originatingRegion != region && (
                                  <>
                                    {" "}{tr("auto.GameLogListComponent.38", { p0: (<b>
                                      {this.fogOfWar
                                        ? fogOfWarRegion
                                        : region.name}
                                    </b>) })}
                                  </>
                                )}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        );
      }
      case "winner-declared": {
        const winner = this.game.houses.get(data.winner);
        return (
          <h4 className="text-center">
            {tr("auto.GameLogListComponent.39", { p0: (this.renderHouseName(winner)) })}</h4>
        );
      }
      case "raven-holder-wildling-card-put-bottom": {
        const house = this.game.houses.get(data.ravenHolder);

        return (
          <p>
            {tr("auto.GameLogListComponent.40", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "raven-holder-wildling-card-put-top": {
        const house = this.game.houses.get(data.ravenHolder);

        return (
          <p>
            {tr("auto.GameLogListComponent.41", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "raven-holder-replace-order": {
        const house = this.game.houses.get(data.ravenHolder);
        const orderRegion = this.world.regions.get(data.region);
        const originalOrder = orders.get(data.originalOrder);
        const newOrder = orders.get(data.newOrder);

        return (
          <p>
            {tr("auto.GameLogListComponent.42", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? "" : originalOrder.type.name}</b>), p2: (<b>{this.fogOfWar ? "" : newOrder.type.name}</b>), p3: (<b>{this.fogOfWar ? fogOfWarRegion : orderRegion.name}</b>) })}</p>
        );
      }
      case "raven-not-used": {
        const house = this.game.houses.get(data.ravenHolder);

        return (
          <p>
            {tr("auto.GameLogListComponent.43", { p0: (<b>{house.name}</b>) })}</p>
        );
      }

      case "raid-done":
        const raider = this.game.houses.get(data.raider);
        const raiderRegion = this.world.regions.get(data.raiderRegion);
        const raidee = data.raidee ? this.game.houses.get(data.raidee) : null;
        const raidedRegion = data.raidedRegion
          ? this.world.regions.get(data.raidedRegion)
          : null;
        const orderRaided = data.orderRaided
          ? orders.get(data.orderRaided)
          : null;

        if (this.fogOfWar) {
          return (
            <p>
              {tr("auto.GameLogListComponent.44", { p0: (raider.name) })}</p>
          );
        }

        // Those 3 variables will always be all null or all non-null
        if (raidee && raidedRegion && orderRaided) {
          return (
            <>
              <p>
                {tr("auto.GameLogListComponent.45", { p0: (<b>{raider.name}</b>), p1: (<b>{raidee.name}</b>), p2: (orderRaided.type.name), p3: (<b>{raidedRegion.name}</b>), p4: (<b>{raiderRegion.name}</b>) })}</p>
              {data.raiderGainedPowerToken && (
                <p>
                  {tr("auto.GameLogListComponent.46", { p0: (<b>{raider.name}</b>), p1: (data.raiderGainedPowerToken ? t("auto2.GameLogListComponent.1") : t("auto2.GameLogListComponent.2")) })}</p>
              )}
              {data.raidedHouseLostPowerToken != null && (
                <p>
                  {tr("auto.GameLogListComponent.47", { p0: (<b>{raidee.name}</b>), p1: (data.raidedHouseLostPowerToken ? t("auto2.GameLogListComponent.3") : t("auto2.GameLogListComponent.4")) })}</p>
              )}
            </>
          );
        } else {
          return (
            <p>
              {tr("auto.GameLogListComponent.48", { p0: (raider.name), p1: (<b>{raiderRegion.name}</b>) })}</p>
          );
        }

      case "a-throne-of-blades-choice": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.49", { p0: (<b>{house.name}</b>) })}{data.choice == 0 ? (
              <> {" "}{t("auto.GameLogListComponent.50")}</>
            ) : data.choice == 1 ? (
              <> {" "}{t("auto.GameLogListComponent.51")}</>
            ) : (
              <> {" "}{t("auto.GameLogListComponent.52")}</>
            )}
          </p>
        );
      }
      case "the-burden-of-power-choice": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.53", { p0: (<b>{house.name}</b>) })}{data.choice == 0 ? (
              <> {" "}{t("auto.GameLogListComponent.54")}</>
            ) : (
              <> {" "}{t("auto.GameLogListComponent.55")}</>
            )}
          </p>
        );
      }
      case "dark-wings-dark-words-choice": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.56", { p0: (<b>{house.name}</b>) })}{data.choice == 0 ? (
              <> {" "}{t("auto.GameLogListComponent.57")}</>
            ) : data.choice == 1 ? (
              <> {" "}{t("auto.GameLogListComponent.58")}</>
            ) : (
              <> {" "}{t("auto.GameLogListComponent.59")}</>
            )}
          </p>
        );
      }
      case "put-to-the-sword-choice": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.60", { p0: (<b>{house.name}</b>) })}{data.choice == 0 ? (
              <>
                {" "}{tr("auto.GameLogListComponent.61")}</>
            ) : data.choice == 1 ? (
              <>
                {" "}{tr("auto.GameLogListComponent.62")}</>
            ) : (
              <> {" "}{t("auto.GameLogListComponent.63")}</>
            )}
          </p>
        );
      }
      case "winter-is-coming":
        const drawnCardType = westerosCardTypes.get(data.drawnCardType);

        return (
          <p>
            {tr("auto.GameLogListComponent.64", { p0: (data.deckIndex + 1), p1: (<b>{drawnCardType.name}</b>) })}</p>
        );

      case "westeros-phase-began":
        return (
          <Row className="justify-content-center">
            <Col xs="auto">
              <h4>
                {tr("auto.GameLogListComponent.65")}
              </h4>
            </Col>
          </Row>
        );

      case "claim-vassals-began":
        return (
          <Row className="justify-content-center">
            <Col xs="auto">
              <h5>
                {tr("auto.GameLogListComponent.66")}
              </h5>
            </Col>
          </Row>
        );

      case "planning-phase-began":
        const content = <b>{tr("auto.GameLogListComponent.67", { p0: (data.forVassals && t("auto2.GameLogListComponent.5")) })}</b>;
        return (
          <Row className="justify-content-center">
            <Col xs="auto">
              {data.forVassals ? <h5>{content}</h5> : <h4>{content}</h4>}
            </Col>
          </Row>
        );

      case "draft-house-cards-began":
        return (
          <Row className="justify-content-center">
            <Col xs="auto">
              <h5>
                {tr("auto.GameLogListComponent.68")}
              </h5>
            </Col>
          </Row>
        );

      case "house-card-picked": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCards.get(data.houseCard);
        return (
          <p>
            {tr("auto.GameLogListComponent.69", { p0: (<b>{house.name}</b>), p1: (<b>{houseCard.name}</b>) })}</p>
        );
      }

      case "house-cards-chosen": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.70", { p0: (<b>{house.name}</b>) })}</p>
        );
      }

      case "action-phase-began":
        return (
          <Row className="justify-content-center">
            <Col xs="auto">
              <h4>
                {tr("auto.GameLogListComponent.71")}
              </h4>
            </Col>
          </Row>
        );

      case "action-phase-resolve-raid-began":
        return (
          <Row className="justify-content-center">
            <Col xs="auto">
              <h5>
                {tr("auto.GameLogListComponent.72")}
              </h5>
            </Col>
          </Row>
        );

      case "action-phase-resolve-march-began":
        return (
          <Row className="justify-content-center">
            <Col xs="auto">
              <h5>
                {tr("auto.GameLogListComponent.73")}
              </h5>
            </Col>
          </Row>
        );

      case "action-phase-resolve-consolidate-power-began":
        return (
          <Row className="justify-content-center">
            <Col xs="auto">
              <h5>
                {tr("auto.GameLogListComponent.74")}
              </h5>
            </Col>
          </Row>
        );

      case "tactical-battle-result": {
        const winner = this.game.houses.get(data.winner);
        const attacker = this.game.houses.get(data.attacker);
        const defender = this.game.houses.get(data.defender);
        return (
          <p>
            {tr(data.duel ? "log.tacticalBattle.duel" : "log.tacticalBattle.result", {
              p0: <b>{winner.name}</b>,
              p1: <b>{attacker.name}</b>,
              p2: <b>{defender.name}</b>,
              p3: data.lanesWon[0],
              p4: data.lanesWon[1]
            })}
          </p>
        );
      }
      case "combat-valyrian-sword-used": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.75", { p0: (<b>{house.name}</b>), p1: (data.forNewTidesOfBattleCard
              ? t("auto2.GameLogListComponent.6")
              : t("auto2.GameLogListComponent.7")) })}</p>
        );
      }
      case "combat-house-card-chosen":
        const houseCards = data.houseCards.map(([hid, hcid]) => {
          const house = this.game.houses.get(hid);
          const houseCard = this.allHouseCards.get(hcid);
          return [house, houseCard];
        });

        return (
          <ul>
            {houseCards.map(([h, hc]) => (
              <li key={`housecard-chosen_${h.id}_${hc.id}`}>
                {tr("auto.GameLogListComponent.76", { p0: (<b>{h.name}</b>), p1: (<b>{hc.name}</b>) })}
              </li>
            ))}
          </ul>
        );

      case "clash-of-kings-final-ordering":
        const finalOrder = data.finalOrder.map((hid) =>
          this.game.houses.get(hid)
        );

        return (
          <>
            <p>
              {tr("auto.GameLogListComponent.77", { p0: (<b>{this.game.getNameInfluenceTrack(data.trackerI)}</b>) })}</p>
            <Row className="mb-2 mt-1 ml-2">
              {finalOrder.map((h) => (
                <Col xs="auto" key={`cok_final_${data.trackerI}_${h.id}`}>
                  <SimpleInfluenceIconComponent house={h} />
                </Col>
              ))}
            </Row>
          </>
        );

      case "clash-of-kings-bidding-done": {
        const bids = _.flatMap(
          data.results.map(([bid, hids]) =>
            hids.map(
              (hid) => [this.game.houses.get(hid), bid] as [House, number]
            )
          )
        );
        const distributor = data.distributor
          ? this.game.houses.get(data.distributor)
          : null;

        return (
          <>
            {distributor != null ? (
              <p>
                {tr("auto.GameLogListComponent.78", { p0: (<b>{distributor.name}</b>), p1: (<b>{this.game.getNameInfluenceTrack(data.trackerI)}</b>) })}</p>
            ) : (
              <p>
                {tr("auto.GameLogListComponent.79", { p0: (<b>{this.game.getNameInfluenceTrack(data.trackerI)}</b>) })}</p>
            )}

            <Row className="mb-1 mt-2 ml-2">
              <HouseNumberResultsComponent
                results={bids}
                keyPrefix={`cok_${data.trackerI}`}
              />
            </Row>
          </>
        );
      }
      case "wildling-strength-trigger-wildlings-attack": {
        return (
          <Row className="align-items-center">
            <Col xs="auto">
              <img src={mammothImage} width="24px" />
            </Col>
            <Col>
              {tr("auto.GameLogListComponent.80", { p0: (<b>{data.wildlingStrength}</b>) })}</Col>
          </Row>
        );
      }
      case "consolidate-power-order-resolved": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);
        const countPowerToken = data.powerTokenCount;

        if (this.fogOfWar) {
          return (
            <p>
              {tr("auto.GameLogListComponent.81", { p0: (<b>{house.name}</b>) })}</p>
          );
        }

        return (
          <p>
            {tr("auto.GameLogListComponent.82", { p0: (<b>{house.name}</b>), p1: (data.starred && t("auto2.GameLogListComponent.8")), p2: (<b>{region.name}</b>), p3: (<b>{countPowerToken}</b>), p4: (countPowerToken != 1 ? "s" : "") })}</p>
        );
      }
      case "armies-reconciled": {
        const house = this.game.houses.get(data.house);
        const armies = data.armies.map(
          ([rid, utids]) =>
            [
              this.world.regions.get(rid),
              utids.map((utid) => unitTypes.get(utid))
            ] as [Region, UnitType[]]
        );

        return (
          <>
            <p>
              {tr("auto.GameLogListComponent.83", { p0: (<b>{house.name}</b>) })}</p>
            <ul>
              {armies.map(([region, unitTypes]) => (
                <li key={`armies-reconciled_${region.id}`}>
                  {tr("auto.GameLogListComponent.84", { p0: (joinReactNodes(
                    unitTypes.map((ut, i) => (
                      <b key={`armies-reconciled_${region.id}_${ut.id}_${i}`}>
                        {this.fogOfWar ? fogOfWarUnit : ut.name}
                      </b>
                    )),
                    ", "
                  )), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}
                </li>
              ))}
            </ul>
          </>
        );
      }
      case "house-card-ability-not-used": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCardsByAbilityId.get(data.houseCard);

        return (
          <p>
            {tr("auto.GameLogListComponent.85", { p0: (<b>{house.name}</b>), p1: (<b>{houseCard.name}&apos;s</b>) })}</p>
        );
      }
      case "patchface-used": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const houseCard = this.allHouseCards.get(data.houseCard);
        return (
          <p>
            {tr("auto.GameLogListComponent.86", { p0: (<b>{house.name}</b>), p1: (<b>{houseCard.name}</b>), p2: (<b>{affectedHouse.name}</b>) })}</p>
        );
      }
      case "melisandre-dwd-used": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCards.get(data.houseCard);
        return (
          <p>
            {tr("auto.GameLogListComponent.87", { p0: (<b>{house.name}</b>), p1: (<b>{houseCard.combatStrength}</b>), p2: (houseCard.combatStrength != 1 ? "s" : ""), p3: (<b>{houseCard.name}</b>) })}</p>
        );
      }
      case "jon-snow-used": {
        const house = this.game.houses.get(data.house);
        let wilddlingStatus = "increase";
        if (data.wildlingsStrength < 0) {
          wilddlingStatus = "decrease";
        }
        return (
          <p>
            {tr("auto.GameLogListComponent.88", { p0: (<b>{house.name}</b>), p1: (<b>{wilddlingStatus}</b>) })}</p>
        );
      }
      case "doran-used": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const influenceTrack = this.game.getNameInfluenceTrack(
          data.influenceTrack
        );
        const skippedHouse = data.skippedHouse
          ? this.game.houses.get(data.skippedHouse)
          : null;

        const skippedAddition = skippedHouse ? (
          <>
            {tr("auto.GameLogListComponent.89", { p0: (<b>{skippedHouse.name}</b>) })}</>
        ) : null;

        return (
          <p>
            {tr("auto.GameLogListComponent.90", { p0: (<b>{house.name}</b>), p1: (<b>{affectedHouse.name}</b>), p2: (<b>{influenceTrack}</b>), p3: (skippedAddition) })}</p>
        );
      }
      case "ser-gerris-drinkwater-used": {
        const house = this.game.houses.get(data.house);
        const influenceTrack = this.game.getNameInfluenceTrack(
          data.influenceTrack
        );

        return (
          <p>
            {tr("auto.GameLogListComponent.91", { p0: (<b>{house.name}</b>), p1: (<b>{influenceTrack}</b>) })}</p>
        );
      }
      case "reek-used": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.92", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "reek-returned-ramsay": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCards.get(data.returnedCardId);

        return (
          <p>
            {tr("auto.GameLogListComponent.93", { p0: (<b>{houseCard.name}</b>), p1: (<b>{house.name}</b>) })}</p>
        );
      }
      case "lysa-arryn-mod-used": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.94", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "qyburn-used": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCards.get(data.houseCard);

        return (
          <p>
            {tr("auto.GameLogListComponent.95", { p0: (<b>{house.name}</b>), p1: (<b>{houseCard.combatStrength}</b>), p2: (<b>{houseCard.name}</b>), p3: (<div style={{ display: "flex", justifyContent: "center" }}>
              <HouseCardComponent houseCard={houseCard} size="small" />
            </div>) })}
          </p>
        );
      }
      case "aeron-damphair-used": {
        const house = this.game.houses.get(data.house);
        const tokens = data.tokens;

        return (
          <p>
            {tr("auto.GameLogListComponent.96", { p0: (<b>{house.name}</b>), p1: (<b>{tokens}</b>) })}</p>
        );
      }
      case "rodrik-the-reader-used": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.97", { p0: (<b>{house.name}</b>), p1: (<b>{data.westerosDeckI + 1}</b>) })}</p>
        );
      }
      case "tyrion-lannister-choice-made": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const chooseToReplace = data.chooseToReplace;

        return (
          <p>
            {tr("auto.GameLogListComponent.98", { p0: (<b>{house.name}</b>), p1: (!chooseToReplace && "didn't "), p2: (chooseToReplace && "d"), p3: (<b>{affectedHouse.name}</b>) })}</p>
        );
      }
      case "tyrion-lannister-house-card-replaced": {
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const newHouseCard = data.newHouseCard
          ? this.allHouseCards.get(data.newHouseCard)
          : null;

        return newHouseCard ? (
          <p>
            {tr("auto.GameLogListComponent.99", { p0: (<b>{affectedHouse.name}</b>), p1: (<b>{newHouseCard.name}.</b>) })}
          </p>
        ) : (
          <p>
            {tr("auto.GameLogListComponent.100", { p0: (<b>{affectedHouse.name}</b>) })}</p>
        );
      }
      case "arianne-martell-prevent-movement": {
        const enemyHouse = this.game.houses.get(data.enemyHouse);

        return (
          <p>
            {tr("auto.GameLogListComponent.101", { p0: (<b>{enemyHouse.name}</b>) })}</p>
        );
      }
      case "arianne-martell-force-retreat": {
        const house = this.game.houses.get(data.house);
        const enemyHouse = this.game.houses.get(data.enemyHouse);

        return (
          <p>
            {tr("auto.GameLogListComponent.102", { p0: (<b>{house.name}</b>), p1: (<b>{enemyHouse.name}</b>) })}</p>
        );
      }
      case "roose-bolton-house-cards-returned": {
        const house = this.game.houses.get(data.house);
        const returnedHouseCards = data.houseCards.map((hcid) =>
          this.allHouseCards.get(hcid)
        );

        return returnedHouseCards.length > 0 ? (
          <p>
            {tr("auto.GameLogListComponent.103", { p0: (<b>{house.name}</b>), p1: (joinReactNodes(
              returnedHouseCards.map((hc) => (
                <b key={`roose_${hc.id}`}>{hc.name}</b>
              )),
              ", "
            )) })}</p>
        ) : (
          <p>
            {tr("auto.GameLogListComponent.104", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "loras-tyrell-attack-order-moved":
        const order = orders.get(data.order);
        const embattledRegion = this.world.regions.get(data.region);

        return (
          <p>
            {tr("auto.GameLogListComponent.105", { p0: (<b>{order.type.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : embattledRegion.name}</b>) })}</p>
        );

      case "queen-of-thorns-no-order-available": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);

        return (
          <p>
            {tr("auto.GameLogListComponent.106", { p0: (<b>{affectedHouse.name}</b>), p1: (<b>{house.name}</b>) })}</p>
        );
      }
      case "queen-of-thorns-order-removed": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const region = this.world.regions.get(data.region);
        const removedOrder = orders.get(data.orderRemoved);

        return (
          <p>
            {tr("auto.GameLogListComponent.107", { p0: (<b>{house.name}</b>), p1: (<b>{removedOrder.type.name}</b>), p2: (<b>{affectedHouse.name}</b>), p3: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "tywin-lannister-power-tokens-gained": {
        const house = this.game.houses.get(data.house);
        const powerTokensGained = data.powerTokensGained;

        return (
          <p>
            {tr("auto.GameLogListComponent.108", { p0: (<b>{house.name}</b>), p1: (<b>{powerTokensGained}</b>), p2: (powerTokensGained != 1 ? "s" : "") })}</p>
        );
      }
      case "qarl-the-maid-tokens-gained": {
        const house = this.game.houses.get(data.house);
        const powerTokensGained = data.powerTokensGained;

        return (
          <p>
            {tr("auto.GameLogListComponent.109", { p0: (<b>{house.name}</b>), p1: (<b>{powerTokensGained}</b>), p2: (powerTokensGained != 1 ? "s" : "") })}</p>
        );
      }
      case "renly-baratheon-no-knight-available": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.110", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "renly-baratheon-no-footman-available": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.111", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "renly-baratheon-footman-upgraded-to-knight": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);

        return (
          <p>
            {tr("auto.GameLogListComponent.112", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "mace-tyrell-casualties-prevented": {
        return (
          <p>
            {tr("auto.GameLogListComponent.113")}</p>
        );
      }
      case "mace-tyrell-no-footman-available":
        const houseCardName = data.houseCard
          ? this.allHouseCards.get(data.houseCard).name
          : "Mace Tyrell";
        return (
          <p>
            {tr("auto.GameLogListComponent.114", { p0: (<b>{houseCardName}</b>) })}</p>
        );

      case "mace-tyrell-footman-killed": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);
        const houseCardName = data.houseCard
          ? this.allHouseCards.get(data.houseCard).name
          : "Mace Tyrell";

        return (
          <p>
            {tr("auto.GameLogListComponent.115", { p0: (<b>{houseCardName}</b>), p1: (<b>{house.name}</b>), p2: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "ser-ilyn-payne-footman-killed": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);

        return (
          <p>
            {tr("auto.GameLogListComponent.116", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "cersei-lannister-no-order-available":
        return (
          <p>
            {tr("auto.GameLogListComponent.117")}</p>
        );

      case "cersei-lannister-order-removed": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const region = this.world.regions.get(data.region);
        const removedOrder = orders.get(data.order);

        return (
          <p>
            {tr("auto.GameLogListComponent.118", { p0: (<b>{house.name}</b>), p1: (<b>{removedOrder.type.name}</b>), p2: (<b>{affectedHouse.name}</b>), p3: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "robb-stark-retreat-location-overriden": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const houseCard = this.allHouseCards.get(data.houseCard);

        return (
          <p>
            {tr("auto.GameLogListComponent.119", { p0: (<b>{houseCard.name}</b>), p1: (<b>{house.name}</b>), p2: (<b>{affectedHouse.name}</b>) })}</p>
        );
      }
      case "retreat-region-chosen": {
        const house = this.game.houses.get(data.house);
        const regionFrom = this.game.world.regions.get(data.regionFrom);
        const regionTo = this.game.world.regions.get(data.regionTo);
        return (
          <p>
            {tr("auto.GameLogListComponent.120", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : regionFrom.name}</b>), p2: (<b>{this.fogOfWar ? fogOfWarRegion : regionTo.name}</b>) })}</p>
        );
      }
      case "retreat-failed": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);

        return (
          <p>
            {tr("auto.GameLogListComponent.121", { p0: (<b>{house.name}</b>), p1: (data.isAttacker ? t("auto2.GameLogListComponent.9") : t("auto2.GameLogListComponent.10")), p2: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "retreat-casualties-suffered": {
        const house = this.game.houses.get(data.house);
        const units = data.units.map((ut) => unitTypes.get(ut).name);
        return (
          <p>
            {tr("auto.GameLogListComponent.122", { p0: (<b>{house.name}</b>), p1: (<>
              {joinReactNodes(
                units.map((unitType, i) => (
                  <b key={`retreat-casualties-suffered_${unitType}_${i}`}>
                    {this.fogOfWar ? fogOfWarUnit : unitType}
                  </b>
                )),
                ", "
              )}
            </>) })}</p>
        );
      }
      case "enemy-port-taken": {
        const newController = this.game.houses.get(data.newController);
        const oldController = this.game.houses.get(data.oldController);
        const port = this.world.regions.get(data.port);
        if (this.fogOfWar) {
          return null;
        }
        return data.shipCount > 0 ? (
          <p>
            {tr("auto.GameLogListComponent.123", { p0: (<b>{newController.name}</b>), p1: (data.shipCount), p2: (data.shipCount == 1 ? "" : "s"), p3: (<b>{oldController.name}</b>), p4: (<b>{port.name}</b>) })}</p>
        ) : (
          <p>
            {tr("auto.GameLogListComponent.124", { p0: (<b>{newController.name}</b>), p1: (<b>{oldController.name}</b>), p2: (<b>{port.name}</b>) })}</p>
        );
      }
      case "ships-destroyed-by-empty-castle": {
        const house = this.game.houses.get(data.house);
        const port = this.game.world.regions.get(data.port);
        const castle = this.game.world.regions.get(data.castle);
        return !this.fogOfWar ? (
          <p>
            {tr("auto.GameLogListComponent.125", { p0: (<b>{house.name}</b>), p1: (data.shipCount), p2: (data.shipCount > 1 ? "s" : ""), p3: (<b>{port.name}</b>), p4: (<b>{castle.name}</b>) })}</p>
        ) : null;
      }
      case "silence-at-the-wall-executed":
        return (
          <p>
            {tr("auto.GameLogListComponent.126")}</p>
        );

      case "preemptive-raid-choice-done": {
        const house = this.game.houses.get(data.house);

        if (data.choice == 0) {
          return (
            <p>
              {tr("auto.GameLogListComponent.127", { p0: (<b>{house.name}</b>) })}</p>
          );
        } else {
          return (
            <p>
              {tr("auto.GameLogListComponent.128", { p0: (<b>{house.name}</b>) })}</p>
          );
        }
      }
      case "preemptive-raid-track-reduced": {
        const chooser = data.chooser
          ? this.game.houses.get(data.chooser)
          : null;
        const house = this.game.houses.get(data.house);
        const trackName = this.game.getNameInfluenceTrack(data.trackI);

        if (chooser == null) {
          return (
            <p>
              {tr("auto.GameLogListComponent.129", { p0: (<b>{house.name}</b>), p1: (<b>{trackName}</b>) })}</p>
          );
        } else {
          return (
            <p>
              {tr("auto.GameLogListComponent.130", { p0: (chooser.name), p1: (<b>{house.name}</b>), p2: (<b>{trackName}</b>) })}</p>
          );
        }
      }
      case "preemptive-raid-units-killed": {
        const house = this.game.houses.get(data.house);
        const units = data.units.map(
          ([rid, utids]) =>
            [
              this.world.regions.get(rid),
              utids.map((utid) => unitTypes.get(utid))
            ] as [Region, UnitType[]]
        );

        return (
          <p>
            {tr("auto.GameLogListComponent.131", { p0: (<b>{house.name}</b>) })}
            {units.length > 0 ? (
              <>
                {" "}{t("auto.GameLogListComponent.132")}{" "}
                {joinReactNodes(
                  units.map(([region, unitTypes]) => (
                    <span key={`preemptive_${region.id}`}>
                      {tr("auto.GameLogListComponent.133", { p0: (joinReactNodes(
                        unitTypes.map((ut, i) => (
                          <b key={`preemptive_${ut.id}_${i}`}>
                            {this.fogOfWar ? fogOfWarUnit : ut.name}
                          </b>
                        )),
                        ", "
                      )), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}
                    </span>
                  )),
                  t("auto2.GameLogListComponent.11")
                )}
                .
              </>
            ) : (
              <> {" "}{t("auto.GameLogListComponent.134")}</>
            )}
          </p>
        );
      }
      case "preemptive-raid-wildlings-attack": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.135", { p0: (<b>{data.wildlingStrength}</b>), p1: (<b>{house.name}</b>) })}</p>
        );
      }
      case "massing-on-the-milkwater-house-cards-back": {
        const house = this.game.houses.get(data.house);
        const houseCardsReturned = data.houseCardsReturned.map((hcid) =>
          this.allHouseCards.get(hcid)
        );

        return (
          <p>
            {tr("auto.GameLogListComponent.136", { p0: (<b>{house.name}</b>) })}{" "}
            {houseCardsReturned.length > 0 ? (
              <>
                {tr("auto.GameLogListComponent.137", { p0: (joinReactNodes(
                  houseCardsReturned.map((hc) => (
                    <b key={`massing-on-the-milkwater-cards-back_${hc.id}`}>
                      {hc.name}
                    </b>
                  )),
                  ", "
                )) })}</>
            ) : (
              <>{t("auto.GameLogListComponent.138")}</>
            )}
          </p>
        );
      }
      case "massing-on-the-milkwater-wildling-victory": {
        const lowestBidder = this.game.houses.get(data.lowestBidder);

        return (
          <p>
            {tr("auto.GameLogListComponent.139", { p0: (<b>{lowestBidder.name}</b>) })}</p>
        );
      }
      case "massing-on-the-milkwater-house-cards-removed": {
        const house = this.game.houses.get(data.house);
        const houseCardsUsed = data.houseCardsUsed.map((hcid) =>
          this.allHouseCards.get(hcid)
        );

        return houseCardsUsed.length > 0 ? (
          <p>
            {tr("auto.GameLogListComponent.140", { p0: (<b>{house.name}</b>), p1: (joinReactNodes(
              houseCardsUsed.map((hc) => (
                <b key={`massing-on-the-milkwater-cards-removed_${hc.id}`}>
                  {hc.name}
                </b>
              )),
              ", "
            )) })}</p>
        ) : (
          <p>
            {tr("auto.GameLogListComponent.141", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "a-king-beyond-the-wall-highest-top-track": {
        const house = this.game.houses.get(data.house);
        const trackName = this.game.getNameInfluenceTrack(data.trackI);

        return (
          <p>
            {tr("auto.GameLogListComponent.142", { p0: (<b>{house.name}</b>), p1: (<b>{trackName}</b>) })}</p>
        );
      }
      case "a-king-beyond-the-wall-lowest-reduce-tracks":
        const lowestBidder = this.game.houses.get(data.lowestBidder);

        return (
          <p>
            {tr("auto.GameLogListComponent.143", { p0: (<b>{lowestBidder.name}</b>) })}</p>
        );

      case "a-king-beyond-the-wall-house-reduce-track": {
        const house = this.game.houses.get(data.house);
        const trackName = this.game.getNameInfluenceTrack(data.trackI);

        return (
          <p>
            {tr("auto.GameLogListComponent.144", { p0: (<b>{house.name}</b>), p1: (<b>{trackName}</b>) })}</p>
        );
      }
      case "mammoth-riders-destroy-units": {
        const house = this.game.houses.get(data.house);
        const units = data.units.map(([rid, utids]) => [
          this.world.regions.get(rid),
          utids.map((utid) => unitTypes.get(utid))
        ]) as [Region, UnitType[]][];

        return (
          <p>
            {tr("auto.GameLogListComponent.145", { p0: (<b>{house.name}</b>) })}
            {units.length > 0 ? (
              <>
                {" "}{t("auto.GameLogListComponent.146")}{" "}
                {joinReactNodes(
                  units.map(([region, unitTypes]) => (
                    <span key={`mammoth-riders_${region.id}`}>
                      {tr("auto.GameLogListComponent.147", { p0: (joinReactNodes(
                        unitTypes.map((ut, i) => (
                          <b key={`mammoth-riders_${ut.id}_${i}`}>
                            {this.fogOfWar ? fogOfWarUnit : ut.name}
                          </b>
                        )),
                        ", "
                      )), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}
                    </span>
                  )),
                  ", "
                )}
                .
              </>
            ) : (
              <> {" "}{t("auto.GameLogListComponent.148")}</>
            )}
          </p>
        );
      }
      case "mammoth-riders-return-card": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCards.get(data.houseCard);

        return (
          <p>
            {tr("auto.GameLogListComponent.149", { p0: (<b>{house.name}</b>), p1: (<b>{houseCard.name}</b>) })}</p>
        );
      }
      case "the-horde-descends-highest-muster": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.150", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "the-horde-descends-units-killed": {
        const house = this.game.houses.get(data.house);
        const units = data.units.map(([rid, utids]) => [
          this.world.regions.get(rid),
          utids.map((utid) => unitTypes.get(utid))
        ]) as [Region, UnitType[]][];

        return (
          <p>
            {tr("auto.GameLogListComponent.151", { p0: (<b>{house.name}</b>) })}
            {units.length > 0 ? (
              <>
                {" "}{t("auto.GameLogListComponent.152")}{" "}
                {joinReactNodes(
                  units.map(([region, unitTypes]) => (
                    <span key={`the-horde-descends_${region.id}`}>
                      {tr("auto.GameLogListComponent.153", { p0: (joinReactNodes(
                        unitTypes.map((ut, i) => (
                          <b key={`the-horde-descends_${ut.id}_${i}`}>
                            {this.fogOfWar ? fogOfWarUnit : ut.name}
                          </b>
                        )),
                        ", "
                      )), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}
                    </span>
                  )),
                  ", "
                )}
                .
              </>
            ) : (
              <> {" "}{t("auto.GameLogListComponent.154")}</>
            )}
          </p>
        );
      }
      case "crow-killers-knights-replaced": {
        const house = this.game.houses.get(data.house);
        const units = data.units.map(([rid, utids]) => [
          this.world.regions.get(rid),
          utids.map((utid) => unitTypes.get(utid))
        ]) as [Region, UnitType[]][];

        return (
          <p>
            {units.length > 0 ? (
              <>
                {tr("auto.GameLogListComponent.155", { p0: (<b>{house.name}</b>) })}{" "}
                {joinReactNodes(
                  units.map(([region, unitTypes], i) => (
                    <span key={`crow-killers-replace_${i}`}>
                      {tr("auto.GameLogListComponent.156", { p0: (<b>{unitTypes.length}</b>), p1: (unitTypes.length != 1 ? "s" : ""), p2: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}
                    </span>
                  )),
                  ", "
                )}{" "}{t("auto.GameLogListComponent.157")}</>
            ) : (
              <>
                {tr("auto.GameLogListComponent.158", { p0: (<b>{house.name}</b>) })}</>
            )}
          </p>
        );
      }
      case "crow-killers-knights-killed": {
        const house = this.game.houses.get(data.house);
        const units: [Region, UnitType[]][] = data.units.map(([rid, utids]) => [
          this.world.regions.get(rid),
          utids.map((utid) => unitTypes.get(utid))
        ]);

        return (
          <p>
            {tr("auto.GameLogListComponent.159", { p0: (<b>{house.name}</b>) })}{" "}
            {joinReactNodes(
              units.map(([region, unitTypes], i) => (
                <span key={`crow-killers-kill_${i}`}>
                  {tr("auto.GameLogListComponent.160", { p0: (<b>{unitTypes.length}</b>), p1: (unitTypes.length != 1 ? "s" : ""), p2: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}
                </span>
              )),
              ", "
            )}
            .
          </p>
        );
      }

      case "crow-killers-footman-upgraded": {
        const house = this.game.houses.get(data.house);
        const units = data.units.map(([rid, utids]) => [
          this.world.regions.get(rid),
          utids.map((utid) => unitTypes.get(utid))
        ]) as [Region, UnitType[]][];

        return units.length > 0 ? (
          <p>
            {tr("auto.GameLogListComponent.161", { p0: (<b>{house.name}</b>) })}{" "}
            {joinReactNodes(
              units.map(([region, unitTypes], i) => (
                <span key={`crow-killers-upgrade_${i}`}>
                  {tr("auto.GameLogListComponent.162", { p0: (<b>{unitTypes.length}</b>), p1: (unitTypes.length == 1 ? t("auto2.GameLogListComponent.12") : "e"), p2: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}
                </span>
              )),
              ", "
            )}{" "}{t("auto.GameLogListComponent.163")}</p>
        ) : (
          <p>
            {tr("auto.GameLogListComponent.164", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "skinchanger-scout-nights-watch-victory": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.165", { p0: (<b>{house.name}</b>), p1: (<b>{data.powerToken}</b>), p2: (data.powerToken != 1 ? "s" : "") })}</p>
        );
      }
      case "skinchanger-scout-wildling-victory": {
        const house = this.game.houses.get(data.house);
        const powerTokensLost = data.powerTokensLost.map(
          ([hid, amount]) =>
            [this.game.houses.get(hid), amount] as [House, number]
        );

        return (
          <>
            <p>
              {tr("auto.GameLogListComponent.166", { p0: (<b>{house.name}</b>) })}</p>
            <ul>
              {powerTokensLost.map(([house, amount]) => (
                <li key={`skinchanger-scout_${house.id}_${amount}`}>
                  {tr("auto.GameLogListComponent.167", { p0: (<b>{house.name}</b>), p1: (<b>{amount}</b>), p2: (amount != 1 ? "s" : "") })}</li>
              ))}
            </ul>
          </>
        );
      }
      case "rattleshirts-raiders-nights-watch-victory":
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.168", { p0: (<b>{house.name}</b>) })}{!this.fogOfWar && (
              <>
                {" "}{tr("auto.GameLogListComponent.169", { p0: (<b>{data.newSupply}</b>) })}
              </>
            )}
            .
          </p>
        );

      case "rattleshirts-raiders-wildling-victory": {
        const lowestBidder = this.game.houses.get(data.lowestBidder);
        const newSupply = data.newSupply.map(
          ([hid, supply]) =>
            [this.game.houses.get(hid), supply] as [House, number]
        );

        return (
          <>
            {tr("auto.GameLogListComponent.170", { p0: (<b>{lowestBidder.name}</b>) })}{!this.fogOfWar && (
              <ul>
                {newSupply.map(([house, supply]) => (
                  <li key={`rattleshirts-raiders_${house.id}_${supply}`}>
                    {tr("auto.GameLogListComponent.171", { p0: (<b>{house.name}</b>), p1: (<b>{supply}</b>) })}</li>
                ))}
              </ul>
            )}
          </>
        );
      }
      case "game-of-thrones-power-tokens-gained":
        const gains = data.gains.map(
          ([hid, gain]) => [this.game.houses.get(hid), gain] as [House, number]
        );

        return (
          <ul>
            {gains.map(([house, gain]) => (
              <li key={`got_${house.id}_${gain}`}>
                {tr("auto.GameLogListComponent.172", { p0: (<b>{house.name}</b>), p1: (<b>{gain}</b>), p2: (gain != 1 ? "s" : "") })}</li>
            ))}
          </ul>
        );
      case "immediatly-killed-after-combat": {
        const house = this.game.houses.get(data.house);
        const killedBecauseWounded = data.killedBecauseWounded.map(
          (utid) => unitTypes.get(utid).name
        );
        const killedBecauseCantRetreat = data.killedBecauseCantRetreat.map(
          (utid) => unitTypes.get(utid).name
        );
        return (
          <p>
            {killedBecauseWounded.length > 0 && (
              <>
                {tr("auto.GameLogListComponent.173", { p0: (<b>{house.name}</b>), p1: (<>
                  {joinReactNodes(
                    killedBecauseWounded.map((unitType, i) => (
                      <b key={`wounded_${unitType}_${i}`}>
                        {this.fogOfWar ? fogOfWarUnit : unitType}
                      </b>
                    )),
                    ", "
                  )}
                </>) })}</>
            )}
            {killedBecauseWounded.length > 0 &&
              killedBecauseCantRetreat.length > 0 && <br />}
            {killedBecauseCantRetreat.length > 0 && (
              <>
                {tr("auto.GameLogListComponent.174", { p0: (<b>{house.name}</b>), p1: (<>
                  {joinReactNodes(
                    killedBecauseCantRetreat.map((unitType, i) => (
                      <b key={`cant-retreat_${unitType}_${i}`}>
                        {this.fogOfWar ? fogOfWarUnit : unitType}
                      </b>
                    )),
                    ", "
                  )}
                </>) })}</>
            )}
          </p>
        );
      }
      case "killed-after-combat": {
        const house = this.game.houses.get(data.house);
        const killed = data.killed.map((utid) => unitTypes.get(utid).name);
        return killed.length > 0 ? (
          <>
            {tr("auto.GameLogListComponent.175", { p0: (<b>{house.name}</b>), p1: (<>
              {joinReactNodes(
                killed.map((unitType, i) => (
                  <b key={`casualties_${unitType}_${i}`}>
                    {this.fogOfWar ? fogOfWarUnit : unitType}
                  </b>
                )),
                ", "
              )}
            </>) })}</>
        ) : (
          <></>
        );
      }
      case "supply-adjusted":
        const supplies: [House, number][] = data.supplies.map(
          ([hid, supply]) => [this.game.houses.get(hid), supply]
        );

        return (
          <>
            <p>{t("auto.GameLogListComponent.176")}</p>
            <div className="mt-1">
              <HouseNumberResultsComponent
                results={supplies}
                keyPrefix="supply"
              />
            </div>
          </>
        );
      case "player-replaced": {
        const oldUser = this.ingame.entireGame.users.get(data.oldUser);
        const newUser = data.newUser
          ? this.ingame.entireGame.users.get(data.newUser)
          : null;
        const house = this.game.houses.get(data.house);
        const newCommanderHouse = data.newCommanderHouse
          ? this.game.houses.get(data.newCommanderHouse)
          : null;
        const newUserLabel = newUser ? getUserLinkOrLabel(newUser) : null;
        const reason =
          data.reason == ReplacementReason.CLOCK_TIMEOUT
            ? " due to clock timeout"
            : data.reason == ReplacementReason.VOTE
              ? " due to vote"
              : "";

        return (
          <>
            {tr("auto.GameLogListComponent.177", { p0: (<b>{getUserLinkOrLabel(oldUser)}</b>), p1: (this.renderHouseName(house)), p2: (newUserLabel ? <b>{newUserLabel}</b> : t("auto2.GameLogListComponent.13")), p3: (reason) })}
            {newCommanderHouse && (
              <>
                {tr("auto.GameLogListComponent.178", { p0: (this.renderHouseName(house)), p1: (this.renderHouseName(newCommanderHouse)) })}</>
            )}
          </>
        );
      }
      case "vassal-replaced": {
        const user = this.ingame.entireGame.users.get(data.user);
        const house = this.game.houses.get(data.house);

        return (
          <>
            {tr("auto.GameLogListComponent.179", { p0: (<b>{house.name}</b>), p1: (<b>{getUserLinkOrLabel(user)}</b>) })}</>
        );
      }
      case "vassals-claimed": {
        const vassals = data.vassals.map((hid) => this.game.houses.get(hid));
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {vassals.length > 0 ? (
              <>
                {tr("auto.GameLogListComponent.180", { p0: (<b>{house.name}</b>), p1: (joinReactNodes(
                  vassals.map((v) => (
                    <b key={`vassals-claimed_${v.id}`}>{v.name}</b>
                  )),
                  ", "
                )), p2: (vassals.length > 1 && "s") })}</>
            ) : (
              <>
                {tr("auto.GameLogListComponent.181", { p0: (<b>{house.name}</b>) })}</>
            )}
          </p>
        );
      }
      case "commander-power-token-gained": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.182", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "beric-dondarrion-used": {
        const house = this.game.houses.get(data.house);
        const casualty = unitTypes.get(data.casualty).name;
        return (
          <p>
            {tr("auto.GameLogListComponent.183", { p0: (<b>{house.name}</b>), p1: (<b>{casualty}</b>) })}</p>
        );
      }
      case "varys-used": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.184", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "jaqen-h-ghar-house-card-replaced": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const newHouseCard = this.allHouseCards.get(data.newHouseCard);
        const usedByHouseCard = this.allHouseCards.get(data.usedById);

        return (
          <p>
            {tr("auto.GameLogListComponent.185", { p0: (<b>{usedByHouseCard.name}</b>), p1: (<b>{house.name}</b>), p2: (<b>{newHouseCard.name}</b>), p3: (<b>{affectedHouse.name}&apos;s</b>) })}</p>
        );
      }
      case "jon-connington-used": {
        const house = this.game.houses.get(data.house);
        const region = this.game.world.regions.get(data.region);
        return (
          <p>
            {tr("auto.GameLogListComponent.186", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "bronn-used": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.187", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "littlefinger-power-tokens-gained": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.188", { p0: (<b>{house.name}</b>), p1: (<b>{data.powerTokens}</b>), p2: (data.powerTokens != 1 ? "s" : "") })}</p>
        );
      }
      case "alayne-stone-used": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        return (
          <p>
            {tr("auto.GameLogListComponent.189", { p0: (<b>{house.name}</b>), p1: (<b>{affectedHouse.name}</b>), p2: (<b>{data.lostPowerTokens}</b>), p3: (data.lostPowerTokens != 1 ? "s" : "") })}</p>
        );
      }
      case "lysa-arryn-ffc-power-tokens-gained": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.190", { p0: (<b>{house.name}</b>), p1: (<b>{data.powerTokens}</b>), p2: (data.powerTokens != 1 ? "s" : "") })}</p>
        );
      }
      case "anya-waynwood-power-tokens-gained": {
        const gains = data.gains.map(
          ([hid, gain]) => [this.game.houses.get(hid), gain] as [House, number]
        );

        return (
          <>
            <p>
              {tr("auto.GameLogListComponent.191")}</p>
            <ul>
              {gains.map(([house, gain]) => (
                <li key={`anya-waynwood_${house.id}_${gain}`}>
                  {tr("auto.GameLogListComponent.192", { p0: (<b>{house.name}</b>), p1: (<b>{gain}</b>), p2: (gain != 1 ? "s" : "") })}</li>
              ))}
            </ul>
          </>
        );
      }
      case "robert-arryn-used": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const removedHouseCard = data.removedHouseCard
          ? this.allHouseCards.get(data.removedHouseCard)
          : null;

        return (
          <p>
            {tr("auto.GameLogListComponent.193", { p0: (<b>{house.name}</b>) })}{" "}
            {removedHouseCard && (
              <>
                {tr("auto.GameLogListComponent.194", { p0: (<b>{removedHouseCard.name}</b>), p1: (<b>{affectedHouse.name}</b>) })}{" "}
              </>
            )}
            {t("auto.GameLogListComponent.195")}</p>
        );
      }
      case "house-card-removed-from-game": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCards.get(data.houseCard);

        return (
          <p>
            {tr("auto.GameLogListComponent.196", { p0: (<b>{houseCard.name}</b>), p1: (<b>{house.name}</b>) })}</p>
        );
      }
      case "viserys-targaryen-used": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCards.get(data.houseCard);

        return (
          <p>
            {tr("auto.GameLogListComponent.197", { p0: (<b>{house.name}</b>), p1: (<b>{houseCard.combatStrength}</b>), p2: (<b>{houseCard.name}</b>) })}</p>
        );
      }
      case "illyrio-mopatis-power-tokens-gained": {
        const house = this.game.houses.get(data.house);
        const powerTokensGained = data.powerTokensGained;

        return (
          <p>
            {tr("auto.GameLogListComponent.198", { p0: (<b>{house.name}</b>), p1: (<b>{powerTokensGained}</b>), p2: (powerTokensGained != 1 ? "s" : "") })}</p>
        );
      }
      case "daenerys-targaryen-b-power-tokens-discarded": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);

        return (
          <p>
            {tr("auto.GameLogListComponent.199", { p0: (<b>{house.name}</b>), p1: (<b>{affectedHouse.name}</b>), p2: (<b>{data.powerTokensDiscarded}</b>), p3: (data.powerTokensDiscarded != 1 ? "s" : "") })}</p>
        );
      }
      case "missandei-used": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCards.get(data.houseCard);
        return (
          <p>
            {tr("auto.GameLogListComponent.200", { p0: (<b>{house.name}</b>), p1: (<b>{houseCard.name}</b>) })}</p>
        );
      }
      case "power-tokens-gifted": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);

        return (
          <Row className="align-items-center">
            <Col xs="auto">
              <img src={presentImage} width="32px" />
            </Col>
            <Col>
              {tr("auto.GameLogListComponent.201", { p0: (<b>{house.name}</b>), p1: (<b>{data.powerTokens}</b>), p2: (data.powerTokens != 1 ? "s" : ""), p3: (<b>{affectedHouse.name}</b>) })}</Col>
          </Row>
        );
      }
      case "influence-track-position-chosen": {
        const house = this.game.houses.get(data.house);
        const track = this.game.getNameInfluenceTrack(data.trackerI);
        return (
          <p>
            {tr("auto.GameLogListComponent.202", { p0: (<b>{house.name}</b>), p1: (<b>{data.position}</b>), p2: (track) })}</p>
        );
      }
      case "ties-decided": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.203", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "place-loyalty-choice": {
        const house = this.game.houses.get(data.house);
        const verb =
          data.discardedPowerTokens == 0
            ? t("log.loyalty.placeNone")
            : data.discardedPowerTokens == 1
              ? data.loyaltyTokenCount > 1
                ? t("log.loyalty.placeMany")
                : t("log.loyalty.placeOne")
              : null;
        return (
          <p>
            {tr("auto.GameLogListComponent.204", { p0: (<b>{house.name}</b>), p1: (<b>{data.discardedPowerTokens}</b>), p2: (data.discardedPowerTokens != 1 && "s"), p3: (verb && t("log.loyalty.andVerb", { verb })) })}</p>
        );
      }
      case "loyalty-token-placed": {
        const region = this.world.regions.get(data.region);
        return (
          <p>
            {tr("auto.GameLogListComponent.205", { p0: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "loyalty-token-gained": {
        const region = this.world.regions.get(data.region);
        return (
          <p>
            {tr("auto.GameLogListComponent.206", { p0: (<b>{this.game.targaryen?.name ?? t("auto2.GameLogListComponent.14")}</b>), p1: (data.count), p2: (data.count != 1 ? "s" : ""), p3: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "fire-made-flesh-choice": {
        const house = this.game.houses.get(data.house);

        if (data.ignored) {
          return (
            <p>
              {tr("auto.GameLogListComponent.207", { p0: (<b>{house.name}</b>) })}</p>
          );
        } else if (data.dragonKilledInRegion) {
          const region = this.world.regions.get(data.dragonKilledInRegion);
          return (
            <p>
              {tr("auto.GameLogListComponent.208", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
          );
        } else if (data.removedDragonStrengthToken) {
          return (
            <p>
              {tr("auto.GameLogListComponent.209", { p0: (<b>{house.name}</b>), p1: (data.removedDragonStrengthToken) })}</p>
          );
        } else if (data.regainedDragonRegion) {
          const region = this.world.regions.get(data.regainedDragonRegion);
          return (
            <p>
              {tr("auto.GameLogListComponent.210", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
          );
        } else {
          return <></>;
        }
      }
      case "playing-with-fire-choice": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);
        const unitType = unitTypes.get(data.unitType);

        return (
          <p>
            {tr("auto.GameLogListComponent.211", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarUnit : unitType.name}</b>), p2: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "the-long-plan-choice": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);

        return (
          <p>
            {tr("auto.GameLogListComponent.212", { p0: (<b>{house.name}</b>), p1: (<b>{affectedHouse.name}</b>) })}</p>
        );
      }
      case "move-loyalty-token-choice": {
        const house = this.game.houses.get(data.house);

        if (data.powerTokensDiscardedToCancelMovement == 0) {
          return (
            <p>
              {tr("auto.GameLogListComponent.213", { p0: (<b>{house.name}</b>) })}</p>
          );
        } else if (
          data.powerTokensDiscardedToCancelMovement &&
          data.powerTokensDiscardedToCancelMovement > 0
        ) {
          return (
            <p>
              {tr("auto.GameLogListComponent.214", { p0: (<b>{house.name}</b>), p1: (<b>{data.powerTokensDiscardedToCancelMovement}</b>), p2: (data.powerTokensDiscardedToCancelMovement != 1 ? "s" : "") })}</p>
          );
        } else if (data.regionFrom && data.regionTo) {
          const regionFrom = this.world.regions.get(data.regionFrom);
          const regionTo = this.world.regions.get(data.regionTo);

          return (
            <p>
              {tr("auto.GameLogListComponent.215", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : regionFrom.name}</b>), p2: (<b>{this.fogOfWar ? fogOfWarRegion : regionTo.name}</b>) })}</p>
          );
        } else {
          return <></>;
        }
      }
      case "loan-purchased": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);
        const loan = loanCardTypes.get(data.loanType);

        return (
          <>
            <p>
              {tr("auto.GameLogListComponent.216", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>), p2: (<b>{data.paid}</b>), p3: (data.paid != 1 ? "s" : "") })}</p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <LoanCardComponent loanCard={loan} />
            </div>
          </>
        );
      }
      case "order-removed": {
        const house = data.house ? this.game.houses.get(data.house) : null;
        const region = this.world.regions.get(data.region);
        const orderType = orderTypes.get(data.order);

        return house ? (
          <p>
            {tr("auto.GameLogListComponent.217", { p0: (<b>{house.name}</b>), p1: (<b>{orderType.name}</b>), p2: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        ) : (
          <p>
            {tr("auto.GameLogListComponent.218", { p0: (<b>{orderType.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "interest-paid": {
        const house = this.game.houses.get(data.house);
        const debt = data.cost + data.paid;
        return (
          <p>
            {tr("auto.GameLogListComponent.219", { p0: (<b>{house.name}</b>), p1: (<b>{Math.abs(data.paid)}</b>), p2: (Math.abs(data.paid) != 1 ? "s" : "") })}{debt > 0 ? (
              <>
                {" "}{tr("auto.GameLogListComponent.220", { p0: (<b>{debt}</b>) })}</>
            ) : (
              ""
            )}
          </p>
        );
      }
      case "debt-paid": {
        const house = this.game.houses.get(data.house);
        const resolver = this.game.houses.get(data.resolver);
        const units = data.units.map(([rid, utids]) => [
          this.world.regions.get(rid),
          utids.map((utid) => unitTypes.get(utid))
        ]) as [Region, UnitType[]][];

        return (
          <p>
            {tr("auto.GameLogListComponent.221")}{" "}
            {units.length > 0 ? (
              <>
                {tr("auto.GameLogListComponent.222", { p0: (<b>{resolver.name}</b>) })}{" "}
                {joinReactNodes(
                  units.map(([region, unitTypes]) => (
                    <span key={`pay-debt_${region.id}_${house.id}`}>
                      {tr("auto.GameLogListComponent.223", { p0: (joinReactNodes(
                        unitTypes.map((ut, i) => (
                          <b key={`pay-debt_${ut.id}_${i}`}>
                            {this.fogOfWar ? fogOfWarUnit : ut.name}
                          </b>
                        )),
                        ", "
                      )), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}
                    </span>
                  )),
                  ", "
                )}{" "}{tr("auto.GameLogListComponent.224", { p0: (<b>{house.name}</b>) })}</>
            ) : (
              <>
                {tr("auto.GameLogListComponent.225", { p0: (<b>{house.name} </b>) })}</>
            )}
          </p>
        );
      }
      case "customs-officer-power-tokens-gained": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.226", { p0: (<b>{house.name}</b>), p1: (<b>{data.gained}</b>), p2: (data.gained != 1 ? "s" : "") })}</p>
        );
      }
      case "sellswords-placed": {
        const house = this.game.houses.get(data.house);
        const placedSellswords = data.units.map(
          ([regionId, units]) =>
            [
              this.world.regions.get(regionId),
              units.map((ut) => unitTypes.get(ut))
            ] as [Region, UnitType[]]
        );
        const loan = loanCardTypes.get(data.loanType);
        return (
          <p>
            {tr("auto.GameLogListComponent.227", { p0: (<b>{loan.name}</b>), p1: (<b>{house.name}</b>) })}
            {placedSellswords.length > 0 ? (
              <>
                {" "}{t("auto.GameLogListComponent.228")}{" "}
                {joinReactNodes(
                  placedSellswords.map(([region, unitTypes]) => (
                    <span key={`place-sellsword_${region.id}`}>
                      {tr("auto.GameLogListComponent.229", { p0: (joinReactNodes(
                        unitTypes.map((ut, i) => (
                          <b key={`place-sellsword_${region.id}_${ut.id}_${i}`}>
                            {this.fogOfWar ? fogOfWarUnit : ut.name}
                          </b>
                        )),
                        ", "
                      )), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}
                    </span>
                  )),
                  t("auto2.GameLogListComponent.15")
                )}
                .
              </>
            ) : (
              <> {" "}{t("auto.GameLogListComponent.230")}</>
            )}
          </p>
        );
      }
      case "the-faceless-men-units-destroyed": {
        const house = this.game.houses.get(data.house);
        const destroyedUnits = data.units.map((unitInfo) => ({
          region: this.world.regions.get(unitInfo.regionId),
          house: unitInfo.houseId
            ? this.game.houses.get(unitInfo.houseId)
            : null,
          unitType: unitTypes.get(unitInfo.unitTypeId)
        }));
        return (
          <p>
            {tr("auto.GameLogListComponent.231", { p0: (<b>{house.name}</b>) })}{" "}
            {destroyedUnits.length > 0 ? (
              <>
                {t("auto.GameLogListComponent.232")}{" "}
                {joinReactNodes(
                  destroyedUnits.map((unitInfo) => (
                    <span
                      key={`the-faceless-men_${unitInfo.region.id}_${unitInfo.unitType.id}`}
                    >
                      {tr("auto.GameLogListComponent.233", { p0: (<b>
                        {this.fogOfWar ? fogOfWarUnit : unitInfo.unitType.name}
                      </b>), p1: (<b>{unitInfo.house?.name ?? t("auto2.GameLogListComponent.16")}</b>), p2: (<b>{unitInfo.region.name}</b>) })}
                    </span>
                  )),
                  t("auto2.GameLogListComponent.17")
                )}
                .
              </>
            ) : (
              <>{t("auto.GameLogListComponent.234")}</>
            )}
          </p>
        );
      }
      case "pyromancer-executed": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);
        return (
          <p>
            {tr("auto.GameLogListComponent.235", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>), p2: (<b>{data.upgradeType}</b>) })}</p>
        );
      }
      case "expert-artificer-executed": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);
        return (
          <p>
            {tr("auto.GameLogListComponent.236", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>), p2: (<b>{data.gainedPowerTokens}</b>), p3: (data.gainedPowerTokens != 1 ? "s" : "") })}</p>
        );
      }
      case "loyal-maester-executed": {
        const house = this.game.houses.get(data.house);
        const regions = data.regions.map((rid) => this.world.regions.get(rid));
        return (
          <p>
            {tr("auto.GameLogListComponent.237", { p0: (<b>{house.name}</b>), p1: (joinReactNodes(
              regions.map((r) => (
                <b key={`loyal_maester_${r.id}`}>
                  {this.fogOfWar ? fogOfWarRegion : r.name}
                </b>
              )),
              t("auto2.GameLogListComponent.18")
            )) })}</p>
        );
      }
      case "master-at-arms-executed": {
        const house = this.game.houses.get(data.house);
        const regions = data.regions.map((rid) => this.world.regions.get(rid));
        return (
          <p>
            {tr("auto.GameLogListComponent.238", { p0: (<b>{house.name}</b>), p1: (joinReactNodes(
              regions.map((r) => (
                <b key={`master-at-arms_${r.id}`}>
                  {this.fogOfWar ? fogOfWarRegion : r.name}
                </b>
              )),
              t("auto2.GameLogListComponent.19")
            )) })}</p>
        );
      }
      case "savvy-steward-executed": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);
        return (
          <p>
            {tr("auto.GameLogListComponent.239", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>), p2: (<b>{data.newSupply}</b>) })}</p>
        );
      }
      case "spymaster-executed": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.240", { p0: (<b>{house.name}</b>), p1: (<b>{data.westerosDeckI + 1}</b>), p2: (<b>{data.westerosCardsCountForTopOfDeck}</b>), p3: (data.westerosCardsCountForTopOfDeck != 1 ? "s" : ""), p4: (<b>{data.westerosCardsCountForBottomOfDeck}</b>), p5: (data.westerosCardsCountForBottomOfDeck != 1 ? "s" : "") })}</p>
        );
      }
      case "objectives-chosen": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.241", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "new-objective-card-drawn": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.242", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "special-objective-scored": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.243", { p0: (<b>{house.name}</b>) })}{" "}
            {data.scored ? (
              <>
                {tr("auto.GameLogListComponent.244", { p0: (<b>{data.newTotal}</b>) })}</>
            ) : (
              <>{t("auto.GameLogListComponent.245")}</>
            )}
            .
          </p>
        );
      }
      case "objective-scored": {
        const house = this.game.houses.get(data.house);
        const objective =
          data.objectiveCard != null
            ? objectiveCards.get(data.objectiveCard)
            : null;

        return objective != null ? (
          <>
            <p>
              {tr("auto.GameLogListComponent.246", { p0: (<b>{house.name}</b>), p1: (<b>{objective.name}</b>), p2: (<b>{data.victoryPoints}</b>), p3: (data.victoryPoints != 1 ? "s" : ""), p4: (<b>{data.newTotal}</b>) })}</p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ObjectiveCardComponent objectiveCard={objective} size="small" />
            </div>
          </>
        ) : (
          <>
            {tr("auto.GameLogListComponent.247", { p0: (<b>{house.name}</b>) })}</>
        );
      }
      case "ironborn-raid": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.248", { p0: (<b>{house.name}</b>), p1: (<b>{data.newTotal}</b>) })}</p>
        );
      }
      case "shifting-ambitions-objective-chosen-from-hand": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.249", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "shifting-ambitions-objective-chosen-from-pool": {
        const house = this.game.houses.get(data.house);
        const objective = objectiveCards.get(data.objectiveCard);

        return (
          <>
            <p>
              {tr("auto.GameLogListComponent.250", { p0: (<b>{house.name}</b>), p1: (<b>{objective.name}</b>) })}</p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ObjectiveCardComponent objectiveCard={objective} size="small" />
            </div>
          </>
        );
      }
      case "new-information-objective-card-chosen": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.251", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "reveal-all-objectives": {
        const objectivesOfHouses = data.objectivesOfHouses.map(
          ([hid, ocids]) =>
            [
              this.game.houses.get(hid),
              ocids.map((ocid) => objectiveCards.get(ocid))
            ] as [House, ObjectiveCard[]]
        );

        return objectivesOfHouses.map(([house, objectives]) => (
          <Col xs={12} key={`objectives-of-house_${house.id}`}>
            <Col xs={12} className="text-center">
              {tr("auto.GameLogListComponent.252", { p0: (<b>{house.name}</b>) })}</Col>
            <Col xs="12">
              <Row className="justify-content-center">
                {objectives.map((oc) => (
                  <Col xs="auto" key={oc.id}>
                    <ObjectiveCardComponent objectiveCard={oc} size="small" />
                  </Col>
                ))}
              </Row>
            </Col>
          </Col>
        ));
      }
      case "garrison-removed": {
        const region = this.world.regions.get(data.region);

        return (
          <p>
            {tr("auto.GameLogListComponent.253", { p0: (<b>{data.strength}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "garrison-returned": {
        const region = this.world.regions.get(data.region);

        return (
          <p>
            {tr("auto.GameLogListComponent.254", { p0: (<b>{data.strength}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "objective-deck-empty": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.255", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "orders-revealed": {
        if (data.onlySnapshot) return null;
        return (
          <p id={`gamelog-orders-revealed-round-${currentRound}`}>
            {t("auto.GameLogListComponent.256")}</p>
        );
      }
      case "house-cards-returned": {
        const house = this.game.houses.get(data.house);
        const returnedHouseCards = data.houseCards.map((hcid) =>
          this.allHouseCards.get(hcid)
        );
        const houseCardDiscarded = data.houseCardDiscarded
          ? this.allHouseCards.get(data.houseCardDiscarded)
          : null;

        return (
          <p>
            {tr("auto.GameLogListComponent.257", { p0: (<b>{house.name}</b>), p1: (joinReactNodes(
              returnedHouseCards.map((hc) => (
                <b key={`house-cards-returned_${hc.id}`}>{hc.name}</b>
              )),
              ", "
            )) })}{houseCardDiscarded ? (
              <>
                {tr("auto.GameLogListComponent.258", { p0: (<b>{houseCardDiscarded.name}</b>) })}</>
            ) : (
              <></>
            )}
          </p>
        );
      }
      case "balon-greyjoy-asos-power-tokens-gained": {
        const house = this.game.houses.get(data.house);
        const powerTokensGained = data.powerTokensGained;

        return (
          <p>
            {tr("auto.GameLogListComponent.259", { p0: (<b>{house.name}</b>), p1: (<b>{powerTokensGained}</b>), p2: (powerTokensGained != 1 ? "s" : "") })}</p>
        );
      }
      case "mace-tyrell-asos-order-placed": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);
        const order = orders.get(data.order);

        return (
          <p>
            {tr("auto.GameLogListComponent.260", { p0: (<b>{house.name}</b>), p1: (<b>{order.type.name}</b>), p2: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "bran-stark-used": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCards.get(data.houseCard);
        return (
          <p>
            {tr("auto.GameLogListComponent.261", { p0: (<b>{house.name}</b>), p1: (<b>{houseCard.name}</b>) })}</p>
        );
      }
      case "cersei-lannister-asos-power-tokens-discarded": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);

        return (
          <p>
            {tr("auto.GameLogListComponent.262", { p0: (<b>{house.name}</b>), p1: (<b>{affectedHouse.name}</b>), p2: (<b>{data.powerTokensDiscarded}</b>), p3: (data.powerTokensDiscarded != 1 ? "s" : "") })}</p>
        );
      }
      case "doran-martell-asos-used": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);

        return (
          <p>
            {tr("auto.GameLogListComponent.263", { p0: (<b>{house.name}</b>), p1: (<b>{affectedHouse.name}</b>) })}</p>
        );
      }
      case "melisandre-of-asshai-power-tokens-gained": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.264", { p0: (<b>{house.name}</b>), p1: (<b>{data.powerTokens}</b>), p2: (data.powerTokens != 1 ? "s" : "") })}</p>
        );
      }
      case "salladhar-saan-asos-power-tokens-changed": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        return (
          <p>
            {tr("auto.GameLogListComponent.265", { p0: (<b>{house.name}</b>), p1: (<b>{data.powerTokensGained}</b>), p2: (data.powerTokensGained != 1 ? "s" : ""), p3: (<b>{affectedHouse.name}</b>), p4: (<b>{data.powerTokensLost}</b>), p5: (data.powerTokensLost != 1 ? "s" : "") })}</p>
        );
      }
      case "ser-davos-seaworth-asos-fortification-gained": {
        const house = this.game.houses.get(data.house);
        return (
          <p>
            {tr("auto.GameLogListComponent.266", { p0: (<b>{house.name}</b>), p1: (<b>2</b>) })}</p>
        );
      }
      case "casualties-prevented": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCards.get(data.houseCard);

        return (
          <p>
            {tr("auto.GameLogListComponent.267", { p0: (<b>{houseCard.name}</b>), p1: (<b>{house.name}</b>) })}</p>
        );
      }
      case "ser-ilyn-payne-asos-casualty-suffered": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const unitType = unitTypes.get(data.unit);

        return (
          <p>
            {tr("auto.GameLogListComponent.268", { p0: (<b>{house.name}</b>), p1: (<b>{affectedHouse.name}</b>), p2: (<b>{affectedHouse.name}</b>), p3: (<b>{this.fogOfWar ? fogOfWarUnit : unitType.name}</b>) })}</p>
        );
      }
      case "dominance-token-stolen": {
        const oldHolder = this.game.houses.get(data.oldHolder);
        const newHolder = this.game.houses.get(data.newHolder);
        const dominanceToken =
          data.dominanceToken == "iron-throne"
            ? "Iron Throne"
            : data.dominanceToken == "valyrian-steel-blade"
              ? "Valyrian Steel Blade"
              : data.dominanceToken == "raven"
                ? "Raven"
                : "Unknown";

        const houseCardName = this.allHouseCards.get(data.houseCardId).name;

        return (
          <p>
            {tr("auto.GameLogListComponent.269", { p0: (<b>{houseCardName}</b>), p1: (<b>{newHolder.name}</b>), p2: (dominanceToken), p3: (<b>{oldHolder.name}</b>) })}</p>
        );
      }
      case "aeron-damphair-house-card-changed": {
        const house = this.game.houses.get(data.house);
        const newHouseCard = this.allHouseCards.get(data.newHouseCard);

        return (
          <p>
            {tr("auto.GameLogListComponent.270", { p0: (<b>{house.name}</b>), p1: (<b>2</b>), p2: (<b>{newHouseCard.name}</b>) })}{data.reducedCombatStrength ? (
              <>
                {" "}{tr("auto.GameLogListComponent.271", { p0: (<b>-1</b>) })}</>
            ) : (
              ""
            )}
            .
          </p>
        );
      }
      case "control-power-token-removed": {
        const region = this.world.regions.get(data.regionId);
        const house = this.game.houses.get(data.houseId);

        return (
          <p>
            {tr("auto.GameLogListComponent.272", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "game-paused": {
        return <p>{t("auto.GameLogListComponent.273")}</p>;
      }
      case "game-resumed": {
        return (
          <p>
            {tr("auto.GameLogListComponent.274", { p0: (data.autoResumed ? t("log.autoResumed") : t("auto2.GameLogListComponent.20")), p1: (secondsToString(data.pauseTimeInSeconds, true)) })}
          </p>
        );
      }
      case "support-attack-against-neutral-force": {
        const region = this.world.regions.get(data.region);
        const house = this.game.houses.get(data.house);
        const supporter = this.game.houses.get(data.supporter);

        return (
          <p>
            {tr("auto.GameLogListComponent.275", { p0: (<b>{supporter.name}</b>) })}{" "}
            {data.refused ? (
              <>
                {tr("auto.GameLogListComponent.276", { p0: (<b>{house.name}</b>) })}
              </>
            ) : (
              <>
                {tr("auto.GameLogListComponent.277", { p0: (<b>{house.name}</b>) })}
              </>
            )}{" "}{tr("auto.GameLogListComponent.278", { p0: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "houses-swapped": {
        const initiator = this.ingame.entireGame.users.get(data.initiator);
        const swappingUser = this.ingame.entireGame.users.get(
          data.swappingUser
        );
        const initiatorHouse = this.game.houses.get(data.initiatorHouse);
        const swappingHouse = this.game.houses.get(data.swappingHouse);
        const newUserLabel = getUserLinkOrLabel(swappingUser);

        return (
          <>
            {tr("auto.GameLogListComponent.279", { p0: (<b>{getUserLinkOrLabel(initiator)}</b>), p1: (<b>{initiatorHouse.name}</b>), p2: (<b>{newUserLabel}</b>), p3: (<b>{swappingHouse.name}</b>) })}</>
        );
      }
      case "westeros-deck-4-skipped": {
        const westerosCardType = data.westerosCardType
          ? westerosCardTypes.get(data.westerosCardType)
          : null;
        return (
          <>
            {t("auto.GameLogListComponent.280")}{" "}
            {westerosCardType ? (
              <>
                {tr("auto.GameLogListComponent.281", { p0: (<b>{westerosCardType.name}</b>) })}{" "}
              </>
            ) : (
              <>{t("auto.GameLogListComponent.282")}{" "}</>
            )}
            {tr("auto.GameLogListComponent.283", { p0: (<b>{data.reason}</b>) })}</>
        );
      }
      case "no-loyalty-token-available": {
        const region = this.world.regions.get(data.region);

        return (
          <p>
            {tr("auto.GameLogListComponent.284", { p0: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "last-land-unit-transformed-to-dragon": {
        const house = this.game.houses.get(data.house);
        const unitType = unitTypes.get(data.transformedUnitType);
        const region = this.world.regions.get(data.region);

        return (
          <>
            {tr("auto.GameLogListComponent.285", { p0: (<b>{this.fogOfWar ? fogOfWarUnit : unitType.name}</b>), p1: (<b>{house.name}</b>), p2: (<b>{region.name}</b>) })}</>
        );
      }
      case "live-pbem-switch": {
        return (
          <p>
            <h5 className="text-center">{t("auto.GameLogListComponent.286")}</h5>
            <div className="text-center">
              {tr("auto.GameLogListComponent.287", { p0: (<b>{data.isNowPbem ? "PBEM" : t("auto2.GameLogListComponent.21")}</b>) })}</div>
          </p>
        );
        break;
      }
      case "jamie-lannister-power-tokens-gained": {
        const house = this.game.houses.get(data.house);
        const powerTokensGained = data.powerTokensGained;

        return (
          <p>
            {tr("auto.GameLogListComponent.288", { p0: (<b>{house.name}</b>), p1: (<b>{powerTokensGained}</b>), p2: (powerTokensGained != 1 ? "s" : "") })}</p>
        );
      }
      case "maester-luwin-used": {
        const house = this.game.houses.get(data.house);
        const houseCard = this.allHouseCards.get(data.houseCard);
        return (
          <p>
            {tr("auto.GameLogListComponent.289", { p0: (<b>{house.name}</b>), p1: (<b>{houseCard.name}</b>) })}</p>
        );
      }
      case "melisandre-of-asshai-1st-used": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const houseCard = this.allHouseCards.get(data.houseCard);
        return (
          <p>
            {tr("auto.GameLogListComponent.290", { p0: (<b>{house.name}</b>), p1: (<b>{houseCard.name}</b>), p2: (<b>{affectedHouse.name}</b>) })}</p>
        );
      }
      case "asha-greyjoy-1st-no-order-available":
        return (
          <p>
            {tr("auto.GameLogListComponent.291")}</p>
        );

      case "asha-greyjoy-1st-order-removed": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const region = this.world.regions.get(data.region);
        const removedOrder = orders.get(data.order);

        return (
          <p>
            {tr("auto.GameLogListComponent.292", { p0: (<b>{house.name}</b>), p1: (<b>{removedOrder.type.name}</b>), p2: (<b>{affectedHouse.name}</b>), p3: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "ellaria-sand-1st-no-knight-available": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.293", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "ellaria-sand-1st-no-footman-available": {
        const house = this.game.houses.get(data.house);

        return (
          <p>
            {tr("auto.GameLogListComponent.294", { p0: (<b>{house.name}</b>) })}</p>
        );
      }
      case "ellaria-sand-1st-footman-upgraded-to-knight": {
        const house = this.game.houses.get(data.house);
        const region = this.world.regions.get(data.region);

        return (
          <p>
            {tr("auto.GameLogListComponent.295", { p0: (<b>{house.name}</b>), p1: (<b>{this.fogOfWar ? fogOfWarRegion : region.name}</b>) })}</p>
        );
      }
      case "arianne-martell-1st-army-unit-killed": {
        const house = this.game.houses.get(data.house);
        const affectedHouse = this.game.houses.get(data.affectedHouse);
        const unitType = unitTypes.get(data.unit);

        return (
          <p>
            {tr("auto.GameLogListComponent.296", { p0: (<b>{house.name}</b>), p1: (<b>{affectedHouse.name}</b>) })}
            {!this.fogOfWar && (
              <>
                {tr("auto.GameLogListComponent.297", { p0: (<b>{affectedHouse.name}</b>), p1: (<b>{unitType.name}</b>) })}
              </>
            )}
          </p>
        );
      }
    }
  }

  renderHouseName(house: House): ReactNode {
    return (
      <>
        {tr("auto.GameLogListComponent.298", { p0: (<b style={{ color: house.color }}>{house.name}</b>) })}
      </>
    );
  }

  debounceSendGameLogSeen = _.debounce(
    (time) => {
      this.logManager.sendGameLogSeen(time);
    },
    2000,
    { trailing: true }
  );

  componentDidUpdate(
    prevProps: Readonly<GameLogListComponentProps>,
    _prevState: Readonly<Record<string, unknown>>
  ): void {
    if (this.replayManager.isReplayMode) {
      return;
    }

    const now = this.props.ingameGameState.entireGame.now;
    if (this.props.currentlyViewed) {
      this.debounceSendGameLogSeen(timeToTicks(now));
    }

    if (
      this.props.gameClient.authenticatedUser &&
      prevProps.currentlyViewed == true &&
      !this.props.currentlyViewed
    ) {
      this.logManager.lastSeenLogTimes.set(
        this.props.gameClient.authenticatedUser,
        timeToTicks(now)
      );
    }
  }

  componentDidMount(): void {
    const now = this.props.ingameGameState.entireGame.now;
    if (this.props.currentlyViewed) {
      this.logManager.sendGameLogSeen(timeToTicks(now));
    }
  }
}
