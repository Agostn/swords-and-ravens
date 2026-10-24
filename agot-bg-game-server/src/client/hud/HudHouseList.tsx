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
import HudSupplyTrack from "./HudSupplyTrack";
import displayedVictoryPoints from "./displayedVictoryPoints";
import { t } from "../i18n/i18n";

import StatIcon, { StatKind } from "./StatIcon";

interface HudHouseListProps {
  gameClient: GameClient;
  ingame: IngameGameState;
  mapControls: MapControls;
  // "cards": cada Casa num cartão (coluna da direita da tela de duas colunas)
  variant?: "rows" | "cards";
  // A trilha de Suprimento vai para a coluna da esquerda na tela de duas colunas
  showSupplyTrack?: boolean;
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
  // Casa com os detalhes abertos agora (não mostra a dica de "clique para ver")
  @observable openDetails: string | null = null;

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

    const cardsView = this.props.variant == "cards";
    return (
      <div className={classNames("hud-house-list", { cards: cardsView })}>
        {!cardsView && (
        <div className="hud-house-list-head">
          <span>{t("hud.houses.house")}</span>
          {this.renderHeadLabel("vp", t("hud.houses.vpShort"), t("hud.stats.vpHelp", { n: game.victoryPointsCountNeededToWin }))}
          {this.renderHeadLabel("power", t("hud.houses.powerShort"), t("hud.stats.powerHelp"))}
          {this.renderHeadLabel("supply", t("hud.houses.supplyShort"), t("hud.stats.supplyHelp"))}
          {this.renderHeadLabel("cards", t("hud.houses.cardsShort"), t("hud.stats.cardsHelp"))}
        </div>
        )}
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
              placement={cardsView ? "left-start" : "left"}
              rootClose
              onToggle={(open: boolean) => {
                this.openDetails = open ? h.id : this.openDetails == h.id ? null : this.openDetails;
              }}
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
                      hudDetails
                    />
                  </ListGroup>
                </Popover>
              }
            >
              <button
                type="button"
                className={classNames(
                  cardsView ? "hud-house-card" : "hud-house-line",
                  {
                    mine: l.mine,
                    leader: position == 0 && !this.ingame.isEndedOrCancelled,
                    waited: l.statusClass != "ready"
                  }
                )}
                style={{ "--house-color": h.color } as React.CSSProperties}
                aria-label={`${h.name}: ${t("hud.houses.details")}`}
              >
                <span className="hud-house-who">
                  {/* a dica só no brasão, e só enquanto os detalhes estão fechados */}
                  <span
                    className="hud-house-logo"
                    title={this.openDetails == h.id ? undefined : t("hud.houses.details")}
                  >
                    <HouseChip house={h} size={cardsView ? 36 : 30} mine={l.mine} />
                  </span>
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
                <span className="hud-house-stats">
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
                </span>
              </button>
            </OverlayTrigger>
          );
        })}

        {this.props.showSupplyTrack != false && (
          <>
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
        {this.supplyOpen && (
          <HudSupplyTrack
            gameClient={this.props.gameClient}
            ingame={this.ingame}
          />
        )}
          </>
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
