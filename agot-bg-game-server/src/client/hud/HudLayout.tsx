import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { observable, reaction, IReactionDisposer } from "mobx";
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
import HouseCard, { HouseCardState } from "../../common/ingame-game-state/game-data-structure/house-card/HouseCard";
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
import HudBattleResult from "./HudBattleResult";
import HouseChip from "./HouseChip";
import HudSupplyTrack from "./HudSupplyTrack";
import HudSituation from "./HudSituation";
import HudRoundTracker from "./HudRoundTracker";
import displayedVictoryPoints from "./displayedVictoryPoints";
import hudSettings from "./hudSettings";
import { readableTextOn } from "./houseColor";
import HudFullscreenButton from "./HudFullscreenButton";
import { installTouchTooltips } from "./touchTooltips";
import { getPiecesStyle, setPiecesStyle } from "../unitImages";
import { t, TranslationKey } from "../i18n/i18n";

import settingsKnobsImage from "../../../public/images/icons/settings-knobs.svg";
import hourglassImage from "../../../public/images/icons/hourglass.svg";
import mammothImage from "../../../public/images/icons/mammoth.svg";
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
// tablet: o cabeçalho da partida (relógio, avisos) desce para uma 2ª faixa
const TABLET_TOP_BAR_HEIGHT = 110;
// celular: status, trilhas e cabeçalho ficam em 3 faixas finas no topo
const PHONE_TOP_BAR_HEIGHT = 136;
const LEFT_DOCK_WIDTH = 320;
// tela de duas colunas: altura reservada para o cabeçalho da partida (relógio)
const HEADER_SPACE = 44;
// coluna recolhida: só uma faixa fina com ícones
const STRIP_WIDTH = 56;

type ScreenSize = "phone" | "tablet" | "desktop";

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
  // Celular: tela limpa (só o mapa e o botão para voltar)
  @observable phoneClean = false;
  @observable chatOpen = false;
  @observable chatTab: string | undefined = undefined;
  @observable windowWidth = window.innerWidth;
  @observable windowHeight = window.innerHeight;
  // celular: Casas abertas por cima do mapa
  @observable phoneHousesOpen = false;
  // Altura dos painéis de baixo (jogada e canto esquerdo), para o mapa poder
  // ser arrastado para cima deles e nenhuma área ficar escondida embaixo.
  @observable bottomPanelsHeight = 0;
  // Faixa "Sua vez" que aparece por alguns segundos quando chega a vez
  @observable turnBanner = false;
  private turnBannerTimer: number | null = null;
  private turnDisposer: IReactionDisposer | null = null;
  private baseTitle = document.title;
  private actionDockRef = React.createRef<HTMLElement>();
  private leftDockRef = React.createRef<HTMLDivElement>();
  private panelsObserver: ResizeObserver | null = null;

  private get gameClient(): GameClient {
    return this.props.gameClient;
  }

  private get ingame(): IngameGameState {
    return this.props.ingame;
  }

  // Coluna das Casas (direita)
  private get rightPanelWidth(): number {
    if (this.windowWidth >= 1800) return 340;
    if (this.windowWidth >= 1400) return 316;
    return this.windowWidth >= 1200 ? 296 : 270;
  }

  // Coluna de Westeros (esquerda)
  private get leftColumnWidth(): number {
    if (this.windowWidth >= 1800) return 320;
    if (this.windowWidth >= 1400) return 296;
    return this.windowWidth >= 1200 ? 280 : 256;
  }

  private onResize = (): void => {
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
  };

  // Celular (inclusive deitado, que é baixo), tablet ou computador
  private get screenSize(): ScreenSize {
    if (this.windowWidth < 760 || this.windowHeight < 500) return "phone";
    if (this.windowWidth < 1200) return "tablet";
    return "desktop";
  }

  private get isPhone(): boolean {
    return this.screenSize == "phone";
  }

  private get topBarHeight(): number {
    return this.screenSize == "phone"
      ? PHONE_TOP_BAR_HEIGHT
      : this.screenSize == "tablet"
        ? TABLET_TOP_BAR_HEIGHT
        : TOP_BAR_HEIGHT;
  }

  // Avisos e o cabeçalho da partida ficam fora daqui: eles se ajustam pela
  // classe no <body>.
  private applyBodyClasses(): void {
    const size = this.screenSize;
    document.body.classList.toggle("hud-phone", size == "phone");
    document.body.classList.toggle("hud-tablet", size == "tablet");
    // computador e tablet: tela de duas colunas (Westeros à esquerda, Casas à direita)
    document.body.classList.toggle("hud-two-columns", size != "phone");
    document.body.classList.toggle(
      "hud-left-closed",
      size != "phone" && !hudSettings.leftPanelOpen
    );
    // celular: com Casas ou chat abertos em tela cheia, o cabeçalho some
    document.body.classList.toggle(
      "hud-sheet-open",
      size == "phone" && (this.phoneHousesOpen || this.chatOpen)
    );
  }

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
    // celular/tablet: balões de explicação só ao segurar o dedo
    installTouchTooltips();
    this.applyBodyClasses();
    // Quando chega a vez: faixa grande por alguns segundos e aviso no título da aba
    this.turnDisposer = reaction(
      () => this.isOwnTurn,
      (own) => {
        this.updateTitle(own);
        if (own) this.showTurnBanner();
        else this.turnBanner = false;
      },
      { fireImmediately: true }
    );
  }

  private showTurnBanner(): void {
    this.turnBanner = true;
    if (this.turnBannerTimer != null) window.clearTimeout(this.turnBannerTimer);
    this.turnBannerTimer = window.setTimeout(() => {
      this.turnBanner = false;
      this.turnBannerTimer = null;
    }, 4500);
  }

  private updateTitle(own: boolean): void {
    const prefix = `★ ${t("hud.houses.yourTurn")} · `;
    const base = document.title.startsWith(prefix)
      ? document.title.slice(prefix.length)
      : document.title;
    this.baseTitle = base;
    document.title = own ? prefix + base : base;
  }

  componentDidUpdate(): void {
    this.applyBodyClasses();
    // no celular os painéis de baixo mudam de lugar conforme o que está aberto
    if (this.actionDockRef.current)
      this.panelsObserver?.observe(this.actionDockRef.current);
    if (this.leftDockRef.current)
      this.panelsObserver?.observe(this.leftDockRef.current);
    this.measureBottomPanels();
  }

  componentWillUnmount(): void {
    this.turnDisposer?.();
    if (this.turnBannerTimer != null) window.clearTimeout(this.turnBannerTimer);
    document.title = this.baseTitle;
    window.removeEventListener("resize", this.onResize);
    this.panelsObserver?.disconnect();
    document.body.classList.remove(
      "hud-active",
      "hud-phone",
      "hud-tablet",
      "hud-sheet-open",
      "hud-two-columns"
    );
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
    const phone = this.isPhone;
    const leftOpen = hudSettings.leftPanelOpen;
    const rightOpen = hudSettings.rightPanelOpen;
    const leftSpace = phone
      ? 0
      : (leftOpen ? this.leftColumnWidth : STRIP_WIDTH) + 2 * 12;
    const rightSpace = phone
      ? 0
      : (rightOpen ? this.rightPanelWidth : STRIP_WIDTH) + 2 * 12;
    const insets = phone
      ? { top: this.phoneClean ? 0 : this.topBarHeight, right: 0, bottom: 0, left: 0 }
      : { top: 12, right: rightSpace, bottom: 0, left: leftSpace };

    return (
      <div
        className={classNames("hud-root", `hud-${this.screenSize}`, {
          "own-turn": this.isOwnTurn,
          "hud-clean": phone && this.phoneClean,
          "hud-two-columns": !phone
        })}
        style={
          {
            "--hud-right-panel-width": `${this.rightPanelWidth}px`,
            "--hud-left-col-width": `${this.leftColumnWidth}px`,
            "--hud-left-dock-width": `${LEFT_DOCK_WIDTH}px`,
            "--hud-right-space": `${rightSpace}px`,
            "--hud-left-space": `${leftSpace}px`,
            "--hud-header-space": `${HEADER_SPACE}px`,
            "--hud-top-offset": `${phone ? this.topBarHeight : 12}px`
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
          panBottom={phone && this.phoneClean ? 0 : this.bottomPanelsHeight}
          controlsRight={phone ? 8 : rightSpace}
          controlsTop={phone ? undefined : 12}
          compactControls={phone}
        >
          <MapComponent
            gameClient={this.gameClient}
            ingameGameState={this.ingame}
            mapControls={this.props.mapControls}
          />
        </MapViewport>
        <div className="hud-vignette" aria-hidden="true" />

        {phone && (
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
        )}

        <HudBidResults ingame={this.ingame} myHouse={this.myHouse} />
        <HudBattleResult ingame={this.ingame} myHouse={this.myHouse} />
        {this.renderTurnBanner()}
        {phone ? (
          <>
            {this.renderTopRight()}
            {this.renderPhoneBottom()}
            {this.phoneHousesOpen && this.renderPhoneHouses()}
            {this.chatOpen && this.renderPhoneChat()}
          </>
        ) : (
          <>
            {leftOpen ? this.renderLeftColumn() : this.renderLeftStrip()}
            {rightOpen ? this.renderRightColumn() : this.renderHouseStrip()}
            {this.renderActionDock(leftSpace, rightSpace)}
          </>
        )}
      </div>
    );
  }

  // Faixa "Sua vez" no alto do mapa, por alguns segundos
  private renderTurnBanner(): ReactNode {
    if (!this.turnBanner || !this.isOwnTurn) return null;
    const title = this.actionTitle();
    return (
      <div
        className={classNames("hud-turn-banner", { "house-colored": this.myHouse != null })}
        role="status"
        onClick={() => (this.turnBanner = false)}
        style={
          this.myHouse
            ? ({ "--turn-color": this.myHouse.color, color: readableTextOn(this.myHouse.color) } as React.CSSProperties)
            : undefined
        }
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 18h18l-2-10-5 4-2-7-2 7-5-4z" />
        </svg>
        <span>
          {title
            ? t("hud.turn.banner", { action: title })
            : t("hud.turn.bannerShort")}
        </span>
      </div>
    );
  }

  // Botão de recolher/abrir uma parte de uma coluna
  private renderSection(
    key: string,
    title: ReactNode,
    body: ReactNode
  ): ReactNode {
    const collapsed = hudSettings.isCollapsed(key);
    return (
      <div className={classNames("hud-col-section", { collapsed })}>
        <button
          type="button"
          className="hud-col-section-head"
          aria-expanded={!collapsed}
          title={collapsed ? t("hud.section.expand") : t("hud.section.collapse")}
          onClick={() => hudSettings.toggleSection(key)}
        >
          <span className="hud-col-section-title">{title}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d={collapsed ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"} />
          </svg>
        </button>
        {!collapsed && <div className="hud-col-section-body">{body}</div>}
      </div>
    );
  }

  private chevron(direction: "left" | "right"): ReactNode {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d={direction == "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    );
  }

  // ---------- coluna da esquerda: Westeros ----------

  private renderLeftColumn(): ReactNode {
    return (
      <aside
        className="hud-panel hud-col hud-col-left"
        aria-label={t("hud.west.title")}
      >
        <div className="hud-col-head">
          <b className="hud-col-title">{t("hud.west.title")}</b>
          <button
            type="button"
            className="hud-icon-button small"
            aria-label={t("hud.west.hide")}
            title={t("hud.west.hide")}
            onClick={() => hudSettings.toggleLeftPanel()}
          >
            {this.chevron("left")}
          </button>
        </div>
        <div className="hud-col-body">
          <GameStateColumn
            ingame={this.ingame}
            gameClient={this.gameClient}
            mapControls={this.props.mapControls}
            onColumnSwapClick={this.props.onColumnSwapClick}
            hudPart="westeros"
          />
          {this.renderSection(
            "tracks",
            t("hud.west.tracks"),
            <HudTracks
              ingame={this.ingame}
              tracks={this.props.tracks}
              myHouse={this.myHouse}
              vertical
            />
          )}
          {this.renderSection(
            "supply",
            t("hud.west.supply"),
            <HudSupplyTrack gameClient={this.gameClient} ingame={this.ingame} />
          )}
        </div>
      </aside>
    );
  }

  // Coluna da esquerda escondida: faixa fina com rodada e Selvagens
  private renderLeftStrip(): ReactNode {
    const game = this.ingame.game;
    return (
      <aside className="hud-side-strip left" aria-label={t("hud.west.title")}>
        <button
          type="button"
          className="hud-icon-button"
          aria-label={t("hud.west.show")}
          title={t("hud.west.show")}
          onClick={() => hudSettings.toggleLeftPanel()}
        >
          {this.chevron("right")}
        </button>
        <button
          type="button"
          className="hud-strip-stat"
          title={t("ingame.roundOf", { turn: game.turn, max: game.maxTurns })}
          onClick={() => hudSettings.toggleLeftPanel()}
        >
          <img src={hourglassImage} width={18} height={18} alt="" />
          <b>{game.turn}</b>
        </button>
        <button
          type="button"
          className="hud-strip-stat"
          title={t("hud.west.wildlings")}
          onClick={() => hudSettings.toggleLeftPanel()}
        >
          <img src={mammothImage} width={20} height={20} alt="" />
          <b>{game.wildlingStrength}</b>
        </button>
      </aside>
    );
  }

  // ---------- coluna da direita: Casas, acontecimentos e chat ----------

  private renderRightColumn(): ReactNode {
    return (
      <aside
        className={classNames("hud-col hud-col-right", {
          "chat-open": this.chatOpen
        })}
        aria-label={t("hud.houses.title")}
      >
        {this.renderTopRight()}
        <div className="hud-panel hud-col-houses">
          <div className="hud-col-head">
            <b className="hud-col-title">{t("hud.houses.colTitle")}</b>
            <span className="hud-col-hint">{t("hud.houses.hint")}</span>
            <button
              type="button"
              className="hud-icon-button small"
              aria-label={t("hud.houses.collapse")}
              title={t("hud.houses.collapse")}
              onClick={() => hudSettings.toggleRightPanel()}
            >
              {this.chevron("right")}
            </button>
          </div>
          <div className="hud-col-body">
            <HudHouseList
              gameClient={this.gameClient}
              ingame={this.ingame}
              mapControls={this.props.mapControls}
              variant="cards"
              showSupplyTrack={false}
            />
          </div>
        </div>
        {this.chatOpen ? this.renderChatPanel() : (
          <>
            {this.renderRecent()}
            {this.renderChatButtons()}
          </>
        )}
      </aside>
    );
  }

  // ---------- celular ----------

  // Embaixo: o painel da jogada e uma barra com Casas, Chat, Corvos e Histórico.
  private renderPhoneBottom(): ReactNode {
    const unread = this.unreadPublicMessages;
    const privateUnread = this.hasUnreadPrivateMessages;
    const houses: House[] = this.gameClient.getPotentialWinners();
    const me = this.myHouse;
    return (
      <div className="hud-phone-bottom" ref={this.leftDockRef}>
        {this.renderActionDock(0, 0)}
        <nav className="hud-phone-nav" aria-label={t("hud.phone.nav")}>
          <button
            type="button"
            className="hud-phone-nav-button"
            onClick={() => (this.phoneHousesOpen = true)}
          >
            <span className="hud-phone-nav-chips" aria-hidden="true">
              {houses.slice(0, 3).map((h) => (
                <HouseChip
                  key={`hud-nav-${h.id}`}
                  house={h}
                  size={18}
                  mine={h == me}
                />
              ))}
            </span>
            <span>{t("hud.houses.title")}</span>
          </button>
          <button
            type="button"
            className="hud-phone-nav-button"
            onClick={() => this.openDrawer("chat")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E2B65A"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            </svg>
            <span>{t("hud.chat.label")}</span>
            {unread > 0 && <span className="hud-count small">{unread}</span>}
          </button>
          <button
            type="button"
            className="hud-phone-nav-button"
            onClick={() => this.openDrawer("chat")}
            title={t("hud.chat.ravensHint")}
          >
            <span aria-hidden="true">✉</span>
            <span>{t("hud.chat.ravens")}</span>
            {privateUnread && <span className="hud-dot" />}
          </button>
          <button
            type="button"
            className="hud-phone-nav-button"
            onClick={() => this.openDrawer("game-logs")}
          >
            <span aria-hidden="true">☰</span>
            <span>{t("hud.recent.history")}</span>
          </button>
        </nav>
      </div>
    );
  }

  private renderPhoneSheet(
    title: string,
    onClose: () => void,
    body: ReactNode
  ): ReactNode {
    return (
      <div className="hud-phone-sheet" role="dialog" aria-label={title}>
        <div className="hud-panel-header">
          <b>{title}</b>
          <button
            type="button"
            className="hud-icon-button"
            aria-label={t("hud.chat.close")}
            title={t("hud.chat.close")}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="hud-phone-sheet-body">{body}</div>
      </div>
    );
  }

  private renderPhoneHouses(): ReactNode {
    return this.renderPhoneSheet(
      t("hud.houses.title"),
      () => (this.phoneHousesOpen = false),
      <HudHouseList
        gameClient={this.gameClient}
        ingame={this.ingame}
        mapControls={this.props.mapControls}
      />
    );
  }

  private renderPhoneChat(): ReactNode {
    return this.renderPhoneSheet(
      t("hud.chat.title"),
      () => (this.chatOpen = false),
      <div className="hud-chat-body">
        <GameTabsComponent
          key={`hud-tabs-${this.chatTab ?? "default"}`}
          gameClient={this.gameClient}
          ingame={this.ingame}
          mapControls={this.props.mapControls}
          initialTab={this.chatTab}
        />
      </div>
    );
  }

  private renderTopRight(vertical = false): ReactNode {
    return (
      <div className={classNames("hud-top-right", { vertical })}>
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
        <HudFullscreenButton />
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
        {this.isPhone && (
          <button
            type="button"
            className={classNames("hud-icon-button hud-clean-toggle", { active: this.phoneClean })}
            aria-pressed={this.phoneClean}
            aria-label={this.phoneClean ? t("hud.clean.show") : t("hud.clean.hide")}
            title={this.phoneClean ? t("hud.clean.show") : t("hud.clean.hide")}
            onClick={() => (this.phoneClean = !this.phoneClean)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {this.phoneClean ? (
                <>
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                  <path d="M9 12h6" />
                </>
              )}
            </svg>
          </button>
        )}
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
          <div className="d-flex flex-wrap" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={() => hudSettings.setClassicLayout(true)}
            >
              {t("hud.menu.classicLayout")}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={() => {
                setPiecesStyle(getPiecesStyle() == "wood" ? "classic" : "wood");
                window.location.reload();
              }}
            >
              {getPiecesStyle() == "wood"
                ? t("hud.menu.classicPieces")
                : t("hud.menu.woodPieces")}
            </button>
          </div>
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
      <aside
        className="hud-house-strip hud-side-strip right"
        aria-label={t("hud.houses.title")}
      >
        {this.renderTopRight(true)}
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
        <span className="hud-strip-spacer" />
        <button
          type="button"
          className="hud-icon-button"
          aria-label={t("hud.chat.open")}
          title={t("hud.chat.open")}
          onClick={() => {
            hudSettings.toggleRightPanel();
            this.openDrawer("chat");
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E2B65A" strokeWidth="2" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          </svg>
          {this.unreadPublicMessages > 0 && (
            <span className="hud-count small">{this.unreadPublicMessages}</span>
          )}
        </button>
      </aside>
    );
  }

  private renderActionDock(leftSpace: number, rightSpace: number): ReactNode {
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
        style={
          this.isPhone ? undefined : { left: leftSpace, right: rightSpace }
        }
        aria-label={t("hud.action.title")}
      >
        <div className="hud-action-header">
          <span
            className={classNames("hud-badge", badge.cls, { "house-colored": ownTurn && me != null })}
            style={
              ownTurn && me
                ? ({ "--turn-color": me.color, color: readableTextOn(me.color) } as React.CSSProperties)
                : undefined
            }
          >
            {ownTurn && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M3 18h18l-2-10-5 4-2-7-2 7-5-4z" />
              </svg>
            )}
            {badge.text}
          </span>
          {title && <b className="hud-action-title">{title}</b>}
          <span className="hud-action-summary">{summary}</span>
          {me && this.renderCardsButton(me)}
          {!this.isPhone && (
            <button
              type="button"
              className={classNames("hud-icon-button small", {
                active: !hudSettings.situationHidden
              })}
              aria-pressed={!hudSettings.situationHidden}
              aria-label={
                hudSettings.situationHidden
                  ? t("hud.situation.show")
                  : t("hud.situation.hide")
              }
              title={
                hudSettings.situationHidden
                  ? t("hud.situation.show")
                  : t("hud.situation.hide")
              }
              onClick={() => hudSettings.toggleSituation()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 19h16M7 15v-4M12 15V7M17 15v-6" />
              </svg>
            </button>
          )}
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
            <HudRoundTracker ingame={this.ingame} house={me} />
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
        {!this.isPhone && !minimized && this.renderSituationRow()}
      </section>
    );
  }

  // Botão "Cartas (n)": mostra as cartas de Casa do jogador num balão.
  // Na mão primeiro (da mais forte para a mais fraca), depois as já usadas.
  private renderCardsButton(house: House): ReactNode {
    const cards = _.sortBy(house.houseCards.values, (c) => -c.combatStrength);
    const available = cards.filter((c) => c.state == HouseCardState.AVAILABLE);
    const used = cards.filter((c) => c.state != HouseCardState.AVAILABLE);
    if (cards.length == 0) return null;
    const renderCard = (c: HouseCard, isUsed: boolean): ReactNode => (
      <div key={`hud-card-${c.id}`} className={classNames("hcards-card", { used: isUsed })}>
        <HouseCardComponent houseCard={c} size="small" unavailable={isUsed} />
        <div className="hcards-info">
          <span className="hcards-strength" title={t("hud.cards.strength", { n: c.combatStrength })}>
            {c.combatStrength}
          </span>
          <span className="hcards-icons">
            {c.swordIcons > 0 && (
              <span className="hcards-icon sword" title={t("houseCard.swords", { n: c.swordIcons })}>
                {"⚔".repeat(c.swordIcons)}
              </span>
            )}
            {c.towerIcons > 0 && (
              <span className="hcards-icon tower" title={t("houseCard.towers", { n: c.towerIcons })}>
                {"▲".repeat(c.towerIcons)}
              </span>
            )}
          </span>
        </div>
        <span className="hcards-name">{c.name}</span>
      </div>
    );
    return (
      <OverlayTrigger
        trigger="click"
        placement="top"
        rootClose
        overlay={
          <Popover id="hud-my-cards" className="hud-cards-popover">
            <Popover.Content>
              <div className="hcards-head">
                <b>{t("hud.cards.titleShort")}</b>
                <span className="hcards-count">{t("hud.cards.inHand", { n: available.length })}</span>
                {used.length > 0 && (
                  <span className="hcards-count muted">{t("hud.cards.usedCount", { n: used.length })}</span>
                )}
                <button
                  type="button"
                  className="hcards-close"
                  aria-label={t("orders.close")}
                  onClick={() => document.body.click()}
                >
                  ×
                </button>
              </div>
              <div className="hcards-grid">{available.map((c) => renderCard(c, false))}</div>
              {used.length > 0 && (
                <>
                  <div className="hcards-sub">{t("hud.cards.usedTitle")}</div>
                  <div className="hcards-grid used">{used.map((c) => renderCard(c, true))}</div>
                </>
              )}
              <div className="hcards-hint">{t("hud.cards.hint")}</div>
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

  private renderSituationRow(): ReactNode {
    if (hudSettings.situationHidden) return null;
    return <HudSituation ingame={this.ingame} house={this.myHouse} />;
  }

  private renderChatPanel(): ReactNode {
    return (
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
    );
  }

  private renderRecent(): ReactNode {
    const minimized = hudSettings.recentMinimized;
    return (
      <div className={classNames("hud-panel hud-recent", { minimized })}>
        <div className="hud-recent-head">
          <b>{t("hud.recent.title")}</b>
          <button
            type="button"
            className="hud-link-button"
            onClick={() => this.openDrawer("game-logs")}
          >
            {t("hud.recent.history")}
          </button>
          <button
            type="button"
            className="hud-icon-button small"
            aria-expanded={!minimized}
            aria-label={
              minimized ? t("hud.recent.expand") : t("hud.recent.minimize")
            }
            title={minimized ? t("hud.recent.expand") : t("hud.recent.minimize")}
            onClick={() => hudSettings.toggleRecent()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d={minimized ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
            </svg>
          </button>
        </div>
        {!minimized && (
          <div className="hud-recent-body">
            <GameLogListComponent
              ingameGameState={this.ingame}
              gameClient={this.gameClient}
              currentlyViewed={false}
              onlyLast={6}
            />
          </div>
        )}
      </div>
    );
  }

  private renderChatButtons(): ReactNode {
    const unread = this.unreadPublicMessages;
    const privateUnread = this.hasUnreadPrivateMessages;
    const lastMessage = _.last(this.publicChatRoom?.messages ?? []);
    return (
      <div className="hud-left-buttons">
        <button
          type="button"
          className="hud-panel hud-chat-button"
          onClick={() => this.openDrawer("chat")}
          aria-label={t("hud.chat.open")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E2B65A" strokeWidth="2" aria-hidden="true">
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
          ✉ {t("hud.chat.ravens")}
          {privateUnread && (
            <span className="hud-dot" title={t("hud.chat.privateUnread")} />
          )}
        </button>
      </div>
    );
  }
}
