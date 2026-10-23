import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { ListGroup, OverlayTrigger, Popover, Tooltip } from "react-bootstrap";
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
import HouseChip from "./HouseChip";
import displayedVictoryPoints from "./displayedVictoryPoints";
import { t } from "../i18n/i18n";

import castleImage from "../../../public/images/icons/castle.svg";
import crownImage from "../../../public/images/icons/crown.svg";
import barrelImage from "../../../public/images/icons/barrel.svg";

type StatKind = "vp" | "power" | "supply" | "cards";

const STAT_ICONS: Record<Exclude<StatKind, "cards">, string> = {
  vp: castleImage,
  power: crownImage,
  supply: barrelImage
};

// Ícone de carta (desenhado aqui; não há um pronto nas imagens do jogo)
function CardIcon(): JSX.Element {
  return (
    <svg
      className="hud-stat-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="2.5"
        width="14"
        height="19"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 7l2.2 5L12 17l-2.2-5z" fill="currentColor" />
    </svg>
  );
}

export function StatIcon({ kind }: { kind: StatKind }): JSX.Element {
  if (kind == "cards") return <CardIcon />;
  return (
    <img
      className="hud-stat-icon"
      src={STAT_ICONS[kind]}
      width={14}
      height={14}
      alt=""
    />
  );
}

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
  @observable supplyOpen = true;

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

  private renderStat(
    house: House,
    kind: StatKind,
    value: ReactNode,
    tooltip: ReactNode
  ): ReactNode {
    return (
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip id={`hud-stat-${kind}-${house.id}`}>{tooltip}</Tooltip>
        }
      >
        <span className={`hud-stat hud-stat-${kind}`}>
          <StatIcon kind={kind} />
          <b>{value}</b>
        </span>
      </OverlayTrigger>
    );
  }

  private renderHeadLabel(kind: StatKind, label: string, help: string): ReactNode {
    return (
      <OverlayTrigger
        placement="bottom"
        overlay={<Tooltip id={`hud-head-${kind}`}>{help}</Tooltip>}
      >
        <span className="hud-head-label">
          <StatIcon kind={kind} />
          {label}
        </span>
      </OverlayTrigger>
    );
  }

  render(): ReactNode {
    const game = this.ingame.game;
    const waited = this.waitedUsers();
    const houses: House[] = this.props.gameClient.getPotentialWinners();

    return (
      <div className="hud-house-list">
        <div className="hud-house-list-head">
          <span>{t("hud.houses.house")}</span>
          {this.renderHeadLabel("vp", t("hud.houses.vpShort"), t("hud.stats.vpHelp", { n: game.victoryPointsCountNeededToWin }))}
          {this.renderHeadLabel("power", t("hud.houses.powerShort"), t("hud.stats.powerHelp"))}
          {this.renderHeadLabel("supply", t("hud.houses.supplyShort"), t("hud.stats.supplyHelp"))}
          {this.renderHeadLabel("cards", t("hud.houses.cardsShort"), t("hud.stats.cardsHelp"))}
        </div>
        {houses.map((h, position) => {
          const l = this.line(h, waited);
          const cards = h.houseCards.values.filter(
            (c) => c.state == HouseCardState.AVAILABLE
          ).length;
          const totalCards = h.houseCards.size;
          const vp = displayedVictoryPoints(game, h);
          const barrels = Math.min(game.getControlledSupplyIcons(h), game.supplyRestrictions.length - 1);
          const armies = game.getAllowedArmySizes(h);
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
                className={classNames("hud-house-line", {
                  mine: l.mine,
                  leader: position == 0 && !this.ingame.isEndedOrCancelled
                })}
                style={{ "--house-color": h.color } as React.CSSProperties}
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
                {this.renderStat(h, "vp", vp, t("hud.stats.vp", { n: vp, max: game.victoryPointsCountNeededToWin }))}
                {this.renderStat(h, "power", h.powerTokens, t("hud.stats.power", { n: h.powerTokens }))}
                {this.renderStat(
                  h,
                  "supply",
                  <>
                    {h.supplyLevel}
                    <small>/{barrels}</small>
                  </>,
                  t("hud.stats.supply", {
                    level: h.supplyLevel,
                    barrels,
                    armies: armies.join(", ")
                  })
                )}
                {this.renderStat(h, "cards", cards, t("hud.stats.cards", { n: cards, total: totalCards }))}
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
          <span className="hud-section-title">
            <StatIcon kind="supply" />
            {t("hud.houses.supplyTrack")}
          </span>
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
        {this.supplyOpen && this.renderSupplyTrack(houses)}
        {this.renderSpectators()}
      </div>
    );
  }

  // Trilha de Suprimento em linhas grandes: cada nível mostra o tamanho
  // dos exércitos permitidos e as Casas que estão nele.
  private renderSupplyTrack(houses: House[]): ReactNode {
    const game = this.ingame.game;
    const me = this.props.gameClient.authenticatedPlayer?.house ?? null;
    const levels = _.range(game.supplyRestrictions.length - 1, -1, -1);
    return (
      <div className="hud-supply-track">
        <div className="hud-supply-row hud-supply-head">
          <span>{t("hud.supply.level")}</span>
          <span>{t("hud.supply.armies")}</span>
          <span>{t("hud.supply.houses")}</span>
        </div>
        {levels.map((level) => {
          const here = houses.filter((h) => h.supplyLevel == level);
          return (
            <div
              key={`hud-supply-${level}`}
              className={classNames("hud-supply-row", {
                occupied: here.length > 0,
                mine: me != null && me.supplyLevel == level
              })}
            >
              <span className="hud-supply-level">
                <StatIcon kind="supply" />
                {level}
              </span>
              <span className="hud-supply-armies">
                {game.supplyRestrictions[level].map((size, i) => (
                  <span key={`hud-army-${level}-${i}`} className="hud-army-size">
                    {size}
                  </span>
                ))}
              </span>
              <span className="hud-supply-houses">
                {here.map((h) => (
                  <HouseChip
                    key={`hud-supply-house-${h.id}`}
                    house={h}
                    size={22}
                    mine={h == me}
                  />
                ))}
              </span>
            </div>
          );
        })}
        <div className="hud-supply-note">{t("hud.supply.note")}</div>
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
