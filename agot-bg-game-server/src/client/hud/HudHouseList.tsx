import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { ListGroup, OverlayTrigger, Popover } from "react-bootstrap";
import classNames from "classnames";
import * as _ from "lodash";

import GameClient from "../GameClient";
import IngameGameState from "../../common/ingame-game-state/IngameGameState";
import MapControls from "../MapControls";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { HouseCardState } from "../../common/ingame-game-state/game-data-structure/house-card/HouseCard";
import User from "../../server/User";
import HouseRowComponent from "../HouseRowComponent";
import BiddingGameState from "../../common/ingame-game-state/westeros-game-state/bidding-game-state/BiddingGameState";
import ChooseHouseCardGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/choose-house-card-game-state/ChooseHouseCardGameState";
import PlaceOrdersGameState from "../../common/ingame-game-state/planning-game-state/place-orders-game-state/PlaceOrdersGameState";
import SupplyTrackComponent from "../game-state-panel/utils/SupplyTrackComponent";
import HouseChip from "./HouseChip";
import displayedVictoryPoints from "./displayedVictoryPoints";
import { t } from "../i18n/i18n";

interface HudHouseListProps {
  gameClient: GameClient;
  ingame: IngameGameState;
  mapControls: MapControls;
}

interface HouseLine {
  house: House;
  playerName: string;
  status: string;
  statusClass: string;
  mine: boolean;
}

/**
 * Lista compacta das Casas (ordem = placar). Cada linha mostra o essencial;
 * clicar abre o painel completo da Casa (cartas, unidades, Poder...).
 */
@observer
export default class HudHouseList extends Component<HudHouseListProps> {
  @observable supplyOpen = false;

  private get ingame(): IngameGameState {
    return this.props.ingame;
  }

  private waitedUsers(): User[] {
    try {
      return this.ingame.leafState.getWaitedUsers();
    } catch {
      return [];
    }
  }

  private line(house: House, waited: User[]): HouseLine {
    const me = this.props.gameClient.authenticatedPlayer?.house ?? null;
    const isVassal = this.ingame.isVassalHouse(house);
    let playerName = "";
    let isWaited = false;
    try {
      const controller = this.ingame.getControllerOfHouse(house);
      playerName = isVassal
        ? t("hud.houses.vassalOf", { house: controller.house.name })
        : controller.user.name;
      isWaited = !isVassal && waited.includes(controller.user);
    } catch {
      playerName = isVassal ? t("hud.houses.vassal") : "";
    }
    const ended = this.ingame.isEndedOrCancelled;
    const mine = house == me;
    // "Pronto" só faz sentido quando todos jogam ao mesmo tempo (ordens,
    // lances, escolher carta...). Fora disso, quem não está jogando
    // simplesmente aguarda a vez, então não mostramos nada.
    const leaf = this.ingame.leafState;
    const everyonePlays =
      leaf instanceof PlaceOrdersGameState ||
      leaf instanceof BiddingGameState ||
      leaf instanceof ChooseHouseCardGameState;
    const status = ended
      ? ""
      : isWaited
        ? mine
          ? t("hud.houses.yourTurn")
          : t("hud.houses.playing")
        : isVassal || !everyonePlays
          ? ""
          : t("hud.houses.ready");
    return {
      house,
      playerName,
      status,
      statusClass: isWaited ? (mine ? "mine" : "playing") : "ready",
      mine
    };
  }

  render(): ReactNode {
    const game = this.ingame.game;
    const waited = this.waitedUsers();
    const houses: House[] = this.props.gameClient.getPotentialWinners();

    return (
      <div className="hud-house-list">
        <div className="hud-house-list-head" aria-hidden="true">
          <span>{t("hud.houses.house")}</span>
          <span>{t("hud.houses.vpShort")}</span>
          <span>{t("hud.houses.powerShort")}</span>
          <span>{t("hud.houses.supplyShort")}</span>
          <span>{t("hud.houses.cardsShort")}</span>
        </div>
        {houses.map((h) => {
          const l = this.line(h, waited);
          const cards = h.houseCards.values.filter(
            (c) => c.state == HouseCardState.AVAILABLE
          ).length;
          return (
            <OverlayTrigger
              key={`hud-house-${h.id}`}
              trigger="click"
              placement="left"
              rootClose
              overlay={
                <Popover
                  id={`hud-house-details-${h.id}`}
                  className="hud-house-popover"
                >
                  <ListGroup variant="flush">
                    <HouseRowComponent
                      gameClient={this.props.gameClient}
                      ingame={this.ingame}
                      house={h}
                      mapControls={this.props.mapControls}
                    />
                  </ListGroup>
                </Popover>
              }
            >
              <button
                type="button"
                className={classNames("hud-house-line", { mine: l.mine })}
                title={t("hud.houses.details")}
              >
                <span className="hud-house-who">
                  <HouseChip house={h} size={30} mine={l.mine} />
                  <span className="hud-house-names">
                    <b style={{ color: h.color }} className="hud-house-name">
                      {h.name}
                    </b>
                    <span className="hud-house-player">{l.playerName}</span>
                    {l.status && (
                      <span
                        className={classNames(
                          "hud-house-status",
                          l.statusClass
                        )}
                      >
                        {l.status}
                      </span>
                    )}
                  </span>
                </span>
                <b className="hud-house-num">
                  {displayedVictoryPoints(game, h)}
                </b>
                <span className="hud-house-num">{h.powerTokens}</span>
                <span className="hud-house-num">{h.supplyLevel}</span>
                <span className="hud-house-num">{cards}</span>
              </button>
            </OverlayTrigger>
          );
        })}

        <button
          type="button"
          className="hud-section-toggle"
          aria-expanded={this.supplyOpen}
          onClick={() => (this.supplyOpen = !this.supplyOpen)}
        >
          <span>{t("hud.houses.supplyTrack")}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d={this.supplyOpen ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
          </svg>
        </button>
        {this.supplyOpen && (
          <div className="hud-supply">
            <SupplyTrackComponent
              tooltipPlacement="left"
              supplyRestrictions={game.supplyRestrictions}
              houses={game.houses.values}
              ingame={this.ingame}
              gameClient={this.props.gameClient}
              mapControls={this.props.mapControls}
            />
          </div>
        )}
        {this.renderSpectators()}
      </div>
    );
  }

  private renderSpectators(): ReactNode {
    const spectators = _.difference(
      this.ingame.entireGame.users.values.filter((u) => u.connected),
      this.ingame.players.keys
    );
    if (spectators.length == 0) return null;
    return (
      <div className="hud-spectators">
        {t("hud.houses.spectators", {
          names: spectators.map((u) => u.name).join(", ")
        })}
      </div>
    );
  }
}
