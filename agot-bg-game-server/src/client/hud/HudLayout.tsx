import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { OverlayChildren } from "react-bootstrap/esm/Overlay";
import classNames from "classnames";
import * as _ from "lodash";

import GameClient from "../GameClient";
import IngameGameState from "../../common/ingame-game-state/IngameGameState";
import MapControls from "../MapControls";
import MapComponent, {
  MAP_HEIGHT,
  MAP_WIDTH,
  DELUXE_MAT_WIDTH
} from "../MapComponent";
import GameStateColumn from "../GameStateColumn";
import GameTabsComponent from "../GameTabsComponent";
import GameLogListComponent from "../GameLogListComponent";
import { InfluenceTrackDetails } from "../IngameComponent";
import CancelledGameState from "../../common/cancelled-game-state/CancelledGameState";
import GameEndedGameState from "../../common/ingame-game-state/game-ended-game-state/GameEndedGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { HouseCardState } from "../../common/ingame-game-state/game-data-structure/house-card/HouseCard";
import User from "../../server/User";
import { Channel } from "../chat-client/ChatClient";
import HouseCardComponent from "../game-state-panel/utils/HouseCardComponent";
import PlaceOrdersGameState from "../../common/ingame-game-state/planning-game-state/place-orders-game-state/PlaceOrdersGameState";
import ResolveSingleMarchOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/resolve-single-march-order-game-state/ResolveSingleMarchOrderGameState";
import BiddingGameState from "../../common/ingame-game-state/westeros-game-state/bidding-game-state/BiddingGameState";
import PlayerMusteringGameState from "../../common/ingame-game-state/westeros-game-state/mustering-game-state/player-mustering-game-state/PlayerMusteringGameState";
import ChooseHouseCardGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/choose-house-card-game-state/ChooseHouseCardGameState";
import DeclareSupportGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/declare-support-game-state/DeclareSupportGameState";
import ResolveSingleRaidOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-raid-order-game-state/resolve-single-raid-order-game-state/ResolveSingleRaidOrderGameState";
import ResolveSingleConsolidatePowerGameState from "../../common/ingame-game-state/action-game-state/resolve-consolidate-power-game-state/resolve-single-consolidate-power-game-state/ResolveSingleConsolidatePowerGameState";
import ResolveRetreatGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/post-combat-game-state/resolve-retreat-game-state/ResolveRetreatGameState";
import ChooseCasualtiesGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/post-combat-game-state/choose-casualties-game-state/ChooseCasualtiesGameState";
import ReplaceOrderGameState from "../../common/ingame-game-state/action-game-state/use-raven-game-state/replace-order-game-state/ReplaceOrderGameState";
import CombatGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/CombatGameState";
import WildlingsAttackGameState from "../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/WildlingsAttackGameState";
import ClashOfKingsGameState from "../../common/ingame-game-state/westeros-game-state/clash-of-kings-game-state/ClashOfKingsGameState";
import ResolveTiesGameState from "../../common/ingame-game-state/westeros-game-state/clash-of-kings-game-state/resolve-ties-game-state/ResolveTiesGameState";
import WesterosGameState from "../../common/ingame-game-state/westeros-game-state/WesterosGameState";
import DraftGameState from "../../common/ingame-game-state/draft-game-state/DraftGameState";
import PlanningGameState from "../../common/ingame-game-state/planning-game-state/PlanningGameState";
import UseValyrianSteelBladeGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/use-valyrian-steel-blade-game-state/UseValyrianSteelBladeGameState";
import {
  westerosImage,
  westeros7pImage,
  westerosWithEssosImage,
  ffcEyrieWithPortImage,
  localizeMapImage
} from "../mapImages";
import MapViewport from "./MapViewport";
import HudTracks from "./HudTracks";
import HudHouseList from "./HudHouseList";
import HudOrdersStrip from "./HudOrdersStrip";
import HudBidResults from "./HudBidResults";
import HouseChip from "./HouseChip";
import displayedVictoryPoints from "./displayedVictoryPoints";
import hudSettings from "./hudSettings";
import { t, TranslationKey } from "../i18n/i18n";

import settingsKnobsImage from "../../../public/images/icons/settings-knobs.svg";
import speakerImage from "../../../public/images/icons/speaker.svg";
import speakerOffImage from "../../../public/images/icons/speaker-off.svg";

interface HudLayoutProps {
  gameClient: GameClient;
  ingame: IngameGameState;
  mapControls: MapControls;
  tracks: InfluenceTrackDetails[];
  gameControlsPopover: OverlayChildren;
  onColumnSwapClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const TOP_BAR_HEIGHT = 64;
const LEFT_DOCK_WIDTH = 320;

// Título curto do painel da jogada, conforme o que está acontecendo.
// (instanceof em vez do nome da classe, que some no build de produção)
const ACTION_TITLES: [unknown, TranslationKey][] = [
  [PlaceOrdersGameState, "hud.title.placeOrders"],
  [ReplaceOrderGameState, "hud.title.raven"],
  [ResolveSingleMarchOrderGameState, "hud.title.march"],
  [DeclareSupportGameState, "hud.title.support"],
  [UseValyrianSteelBladeGameState, "hud.title.blade"],
  [ChooseHouseCardGameState, "hud.title.houseCard"],
  [ChooseCasualtiesGameState, "hud.title.casualties"],
  [ResolveRetreatGameState, "hud.title.retreat"],
  [ResolveSingleRaidOrderGameState, "hud.title.raid"],
  [ResolveSingleConsolidatePowerGameState, "hud.title.consolidate"],
  [BiddingGameState, "hud.title.bidding"],
  [PlayerMusteringGameState, "hud.title.mustering"]
];

/**
 * Tela da partida "mapa em tela cheia" (proposta B do redesign).
 * Reaproveita os componentes de sempre (painel da fase, Casas, chat e
 * histórico); muda onde e como cada um aparece.
 */
@observer
export default class HudLayout extends Component<HudLayoutProps> {
  @observable chatOpen = false;
  @observable chatTab: string | undefined = undefined;
  @observable windowWidth = window.innerWidth;
  // Altura dos painéis de baixo (jogada e canto esquerdo), para o mapa poder
  // ser arrastado para cima deles e nenhuma área ficar escondida embaixo.
  @observable bottomPanelsHeight = 0;
  private actionDockRef = React.createRef<HTMLElement>();
  private leftDockRef = React.createRef<HTMLDivElement>();
  private panelsObserver: ResizeObserver | null = null;

  private get gameClient(): GameClient {
    return this.props.gameClient;
  }

  private get ingame(): IngameGameState {
    return this.props.ingame;
  }

  // Painel das Casas: lista compacta, então pode ser estreito.
  private get rightPanelWidth(): number {
    if (this.windowWidth >= 1800) return 360;
    return this.windowWidth >= 1280 ? 330 : 300;
  }

  private onResize = (): void => {
    this.windowWidth = window.innerWidth;
  };

  private measureBottomPanels = (): void => {
    const vh = window.innerHeight;
    const heightFromBottom = (el: Element | null): number =>
      el ? Math.max(0, vh - el.getBoundingClientRect().top) : 0;
    this.bottomPanelsHeight = Math.max(
      heightFromBottom(this.actionDockRef.current),
      heightFromBottom(this.leftDockRef.current)
    );
  };

  componentDidMount(): void {
    window.addEventListener("resize", this.onResize);
    this.panelsObserver = new ResizeObserver(() => this.measureBottomPanels());
    if (this.actionDockRef.current)
      this.panelsObserver.observe(this.actionDockRef.current);
    if (this.leftDockRef.current)
      this.panelsObserver.observe(this.leftDockRef.current);
    this.measureBottomPanels();
    // avisos (toasts) e outros elementos fora daqui se ajustam à tela nova
    document.body.classList.add("hud-active");
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this.onResize);
    this.panelsObserver?.disconnect();
    document.body.classList.remove("hud-active");
  }

  private get publicChatRoom(): Channel | null {
    const id = this.ingame.entireGame.publicChatRoomId;
    return this.gameClient.chatClient.channels.has(id)
      ? this.gameClient.chatClient.channels.get(id)
      : null;
  }

  private get isOwnTurn(): boolean {
    try {
      return this.gameClient.isOwnTurn();
    } catch {
      // getControllerOfHouse pode falhar logo depois de trocar jogador por vassalo
      return false;
    }
  }

  private get unreadPublicMessages(): number {
    const room = this.publicChatRoom;
    if (!room || !room.areThereUnreadMessages) return 0;
    const idx = room.messages.findIndex(
      (m) => m.id == room.lastViewedMessageId
    );
    return idx < 0 ? room.messages.length : room.messages.length - 1 - idx;
  }

  private get hasUnreadPrivateMessages(): boolean {
    const publicId = this.ingame.entireGame.publicChatRoomId;
    return this.gameClient.chatClient.channels.entries.some(
      ([id, ch]) => id != publicId && ch.areThereUnreadMessages
    );
  }

  private get mapSize(): { width: number; height: number } {
    return {
      width:
        this.ingame.entireGame.gameSettings.playerCount >= 8
          ? DELUXE_MAT_WIDTH
          : MAP_WIDTH,
      height: MAP_HEIGHT
    };
  }

  private get mapImage(): string {
    const settings = this.ingame.entireGame.gameSettings;
    const base = settings.addPortToTheEyrie
      ? ffcEyrieWithPortImage
      : settings.playerCount == 7
        ? westeros7pImage
        : settings.playerCount >= 8
          ? westerosWithEssosImage
          : westerosImage;
    return localizeMapImage(base);
  }

  private get myHouse(): House | null {
    return this.gameClient.authenticatedPlayer?.house ?? null;
  }

  private waitedHouseNames(): string[] {
    let users: User[] = [];
    try {
      users = this.ingame.leafState.getWaitedUsers();
    } catch {
      return [];
    }
    return users.map((u) =>
      this.ingame.players.has(u)
        ? this.ingame.players.get(u).house.name
        : u.name
    );
  }

  private actionTitle(): string | null {
    const leaf = this.ingame.leafState;
    const has = (cls: unknown): boolean => this.ingame.hasChildGameState(cls);

    // Lances acontecem em dois momentos diferentes do jogo
    if (leaf instanceof BiddingGameState) {
      if (has(WildlingsAttackGameState)) return t("hud.title.wildlingBidding");
      if (has(ClashOfKingsGameState)) return t("hud.title.clashBidding");
    }
    if (leaf instanceof ResolveTiesGameState) return t("hud.title.ties");

    const found = ACTION_TITLES.find(
      ([cls]) => leaf instanceof (cls as new (...args: never[]) => unknown)
    );
    if (found) return t(found[1]);

    // Sem título específico: usa a etapa maior em que a partida está
    if (has(CombatGameState)) return t("hud.title.combat");
    if (has(WildlingsAttackGameState)) return t("hud.title.wildlingsAttack");
    if (has(ClashOfKingsGameState)) return t("hud.title.clashOfKings");
    if (has(WesterosGameState))
      return t("phase.label", { phase: t("phase.westeros") });
    if (has(PlanningGameState))
      return t("phase.label", { phase: t("phase.planning") });
    if (has(DraftGameState)) return t("hud.title.draft");
    return null;
  }

  render(): ReactNode {
    const rightOpen = hudSettings.rightPanelOpen;
    const rightSpace = rightOpen ? this.rightPanelWidth + 24 : 72;
    const insets = {
      top: TOP_BAR_HEIGHT,
      right: rightSpace,
      bottom: 0,
      left: 0
    };

    return (
      <div
        className="hud-root"
        style={
          {
            "--hud-right-panel-width": `${this.rightPanelWidth}px`,
            "--hud-left-dock-width": `${LEFT_DOCK_WIDTH}px`,
            "--hud-right-space": `${rightSpace}px`
          } as React.CSSProperties
        }
      >
        {/* fundo: o próprio mapa, desfocado, para não sobrar faixa preta */}
        <div
          className="hud-backdrop"
          style={{ backgroundImage: `url(${this.mapImage})` }}
          aria-hidden="true"
        />
        <MapViewport
          contentWidth={this.mapSize.width}
          contentHeight={this.mapSize.height}
          minimapImage={this.mapImage}
          insets={insets}
          panBottom={this.bottomPanelsHeight}
          controlsRight={rightSpace}
        >
          <MapComponent
            gameClient={this.gameClient}
            ingameGameState={this.ingame}
            mapControls={this.props.mapControls}
          />
        </MapViewport>
        <div className="hud-vignette" aria-hidden="true" />

        <div className="hud-top-left">
          <GameStateColumn
            ingame={this.ingame}
            gameClient={this.gameClient}
            mapControls={this.props.mapControls}
            onColumnSwapClick={this.props.onColumnSwapClick}
            hudPart="status"
          />
          <HudTracks
            ingame={this.ingame}
            tracks={this.props.tracks}
            myHouse={this.myHouse}
          />
        </div>

        <HudBidResults ingame={this.ingame} myHouse={this.myHouse} />
        {this.renderTopRight()}
        {rightOpen ? this.renderRightPanel() : this.renderHouseStrip()}
        {this.renderActionDock(rightSpace)}
        {this.renderLeftDock()}
      </div>
    );
  }

  private renderTopRight(): ReactNode {
    return (
      <div className="hud-top-right">
        <OverlayTrigger
          overlay={this.renderHelpPopover()}
          placement="bottom-end"
          trigger="click"
          rootClose
        >
          <button
            type="button"
            className="hud-icon-button"
            aria-label={t("hud.help.title")}
            title={t("hud.help.title")}
          >
            ?
          </button>
        </OverlayTrigger>
        <OverlayTrigger
          overlay={this.props.gameControlsPopover}
          placement="bottom-end"
          trigger="click"
          rootClose
        >
          <button
            type="button"
            className="hud-icon-button"
            aria-label={t("hud.menu.gameControls")}
            title={t("hud.menu.gameControls")}
          >
            <img src={settingsKnobsImage} width={22} alt="" />
          </button>
        </OverlayTrigger>
        <button
          type="button"
          className="hud-icon-button"
          aria-label={
            this.gameClient.muted ? t("lobby.unmute") : t("lobby.mute")
          }
          title={this.gameClient.muted ? t("lobby.unmute") : t("lobby.mute")}
          onClick={() => (this.gameClient.muted = !this.gameClient.muted)}
        >
          <img
            src={this.gameClient.muted ? speakerOffImage : speakerImage}
            width={22}
            alt=""
          />
        </button>
      </div>
    );
  }

  private renderHelpPopover(): OverlayChildren {
    return (
      <Popover id="hud-help-popover" className="hud-help-popover">
        <Popover.Title as="h3">{t("hud.help.title")}</Popover.Title>
        <Popover.Content>
          <ul>
            <li>{t("hud.help.zoom")}</li>
            <li>{t("hud.help.drag")}</li>
            <li>{t("hud.help.minimap")}</li>
            <li>{t("hud.help.houses")}</li>
            <li>{t("hud.help.tracks")}</li>
          </ul>
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={() => hudSettings.setClassicLayout(true)}
          >
            {t("hud.menu.classicLayout")}
          </button>
        </Popover.Content>
      </Popover>
    );
  }

  private renderRightPanel(): ReactNode {
    return (
      <aside
        className="hud-panel hud-right-panel"
        aria-label={t("hud.houses.title")}
      >
        <div className="hud-panel-header">
          <b>{t("hud.houses.title")}</b>
          <button
            type="button"
            className="hud-icon-button small"
            aria-label={t("hud.houses.collapse")}
            title={t("hud.houses.collapse")}
            onClick={() => hudSettings.toggleRightPanel()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <div className="hud-panel-body">
          <HudHouseList
            gameClient={this.gameClient}
            ingame={this.ingame}
            mapControls={this.props.mapControls}
          />
        </div>
      </aside>
    );
  }

  // Painel das Casas recolhido: só o brasão e os Pontos de Vitória.
  private renderHouseStrip(): ReactNode {
    const houses: House[] = this.gameClient.getPotentialWinners();
    return (
      <aside className="hud-house-strip" aria-label={t("hud.houses.title")}>
        <button
          type="button"
          className="hud-icon-button"
          aria-label={t("hud.houses.expand")}
          title={t("hud.houses.expand")}
          onClick={() => hudSettings.toggleRightPanel()}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        {houses.map((h) => (
          <div
            key={`hud-strip-${h.id}`}
            className={classNames("hud-house-chip", {
              mine: h == this.myHouse
            })}
          >
            <HouseChip
              house={h}
              size={30}
              tooltip={
                <>
                  <b>{h.name}</b>
                  <br />
                  {t("hud.houses.victoryPoints", {
                    n: displayedVictoryPoints(this.ingame.game, h)
                  })}
                  <br />
                  {t("hud.houses.power", { n: h.powerTokens })}
                </>
              }
            />
            <span className="hud-house-vp">
              {displayedVictoryPoints(this.ingame.game, h)}
            </span>
          </div>
        ))}
      </aside>
    );
  }

  private renderActionDock(rightSpace: number): ReactNode {
    const ownTurn = this.isOwnTurn;
    const ended = this.ingame.childGameState instanceof GameEndedGameState;
    const cancelled = this.ingame.childGameState instanceof CancelledGameState;
    const waited = ownTurn ? [] : this.waitedHouseNames();
    const minimized = hudSettings.actionDockMinimized;
    const title = ended || cancelled ? null : this.actionTitle();
    const leaf = this.ingame.leafState;
    const me = this.myHouse;

    const badge = ended
      ? { cls: "ended", text: t("hud.action.ended") }
      : cancelled
        ? { cls: "cancelled", text: t("hud.action.cancelled") }
        : ownTurn
          ? { cls: "own-turn", text: t("hud.action.yourTurn") }
          : { cls: "waiting", text: t("hud.action.waiting") };

    const summary =
      !ownTurn && waited.length > 0
        ? t("hud.action.waitingFor", { houses: waited.join(", ") })
        : ownTurn && minimized
          ? t("hud.action.minimizedHint")
          : null;

    return (
      <section
        ref={this.actionDockRef}
        className={classNames("hud-panel hud-action-dock", {
          "own-turn": ownTurn,
          minimized: minimized
        })}
        style={{ right: rightSpace }}
        aria-label={t("hud.action.title")}
      >
        <div className="hud-action-header">
          <span className={classNames("hud-badge", badge.cls)}>
            {badge.text}
          </span>
          {title && <b className="hud-action-title">{title}</b>}
          <span className="hud-action-summary">{summary}</span>
          {me && this.renderCardsButton(me)}
          <button
            type="button"
            className="hud-icon-button small"
            aria-expanded={!minimized}
            aria-label={
              minimized ? t("hud.action.expand") : t("hud.action.minimize")
            }
            title={
              minimized ? t("hud.action.expand") : t("hud.action.minimize")
            }
            onClick={() => hudSettings.setActionDockMinimized(!minimized)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d={minimized ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
            </svg>
          </button>
        </div>
        {/* Minimizado o conteúdo só fica escondido: ele continua montado,
            porque é ele que deixa as áreas do mapa clicáveis (ex.: colocar
            ordens). Se fosse removido, o mapa pararia de responder. */}
        <div
          className={classNames("hud-action-body", { "hud-hidden": minimized })}
        >
            {leaf instanceof PlaceOrdersGameState &&
              me &&
              !this.ingame.isVassalHouse(me) && (
                <HudOrdersStrip placeOrders={leaf} house={me} />
              )}
            <GameStateColumn
              ingame={this.ingame}
              gameClient={this.gameClient}
              mapControls={this.props.mapControls}
              onColumnSwapClick={this.props.onColumnSwapClick}
              hudPart="action"
            />
        </div>
      </section>
    );
  }

  // Botão "Cartas (n)": mostra as cartas de Casa do jogador num balão.
  private renderCardsButton(house: House): ReactNode {
    const cards = _.sortBy(house.houseCards.values, (c) => c.combatStrength);
    const available = cards.filter((c) => c.state == HouseCardState.AVAILABLE);
    if (cards.length == 0) return null;
    return (
      <OverlayTrigger
        trigger="click"
        placement="top"
        rootClose
        overlay={
          <Popover id="hud-my-cards" className="hud-cards-popover">
            <Popover.Title as="h3">
              {t("hud.cards.title", { n: available.length })}
            </Popover.Title>
            <Popover.Content>
              <div className="hud-cards-grid">
                {cards.map((c) => (
                  <HouseCardComponent
                    key={`hud-card-${c.id}`}
                    houseCard={c}
                    size="small"
                    unavailable={c.state != HouseCardState.AVAILABLE}
                  />
                ))}
              </div>
            </Popover.Content>
          </Popover>
        }
      >
        <button type="button" className="hud-cards-button">
          {t("hud.cards.button", { n: available.length })}
        </button>
      </OverlayTrigger>
    );
  }

  private openDrawer(tab?: string): void {
    this.chatTab = tab;
    this.chatOpen = true;
  }

  private renderLeftDock(): ReactNode {
    const unread = this.unreadPublicMessages;
    const privateUnread = this.hasUnreadPrivateMessages;
    const lastMessage = _.last(this.publicChatRoom?.messages ?? []);

    if (this.chatOpen) {
      return (
        <div className="hud-left-dock" ref={this.leftDockRef}>
          <div className="hud-panel hud-chat-panel">
            <div className="hud-panel-header">
              <b>{t("hud.chat.title")}</b>
              <button
                type="button"
                className="hud-icon-button small"
                aria-label={t("hud.chat.close")}
                title={t("hud.chat.close")}
                onClick={() => (this.chatOpen = false)}
              >
                ×
              </button>
            </div>
            <div className="hud-chat-body">
              <GameTabsComponent
                key={`hud-tabs-${this.chatTab ?? "default"}`}
                gameClient={this.gameClient}
                ingame={this.ingame}
                mapControls={this.props.mapControls}
                initialTab={this.chatTab}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="hud-left-dock" ref={this.leftDockRef}>
        <div className="hud-panel hud-recent">
          <div className="hud-recent-head">
            <b>{t("hud.recent.title")}</b>
            <button
              type="button"
              className="hud-link-button"
              onClick={() => this.openDrawer("game-logs")}
            >
              {t("hud.recent.history")}
            </button>
          </div>
          <div className="hud-recent-body">
            <GameLogListComponent
              ingameGameState={this.ingame}
              gameClient={this.gameClient}
              currentlyViewed={false}
              onlyLast={2}
            />
          </div>
        </div>
        <div className="hud-left-buttons">
          <button
            type="button"
            className="hud-panel hud-chat-button"
            onClick={() => this.openDrawer("chat")}
            aria-label={t("hud.chat.open")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E2B65A"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            </svg>
            <span className="hud-chat-preview">
              {lastMessage ? (
                <>
                  <b>{lastMessage.user.name}:</b>{" "}
                  <span className="hud-muted">{lastMessage.text}</span>
                </>
              ) : (
                t("hud.chat.label")
              )}
            </span>
            {unread > 0 && <span className="hud-count">{unread}</span>}
          </button>
          <button
            type="button"
            className="hud-panel hud-ravens-button"
            onClick={() => this.openDrawer("chat")}
            title={t("hud.chat.ravensHint")}
          >
            {t("hud.chat.ravens")}
            {privateUnread && (
              <span className="hud-dot" title={t("hud.chat.privateUnread")} />
            )}
          </button>
        </div>
      </div>
    );
  }
}
