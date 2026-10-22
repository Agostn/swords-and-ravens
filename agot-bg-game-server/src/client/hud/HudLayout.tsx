import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
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
import HouseInfoColumn from "../HouseInfoColumn";
import GameTabsComponent from "../GameTabsComponent";
import { InfluenceTrackDetails } from "../IngameComponent";
import CancelledGameState from "../../common/cancelled-game-state/CancelledGameState";
import GameEndedGameState from "../../common/ingame-game-state/game-ended-game-state/GameEndedGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import User from "../../server/User";
import { Channel } from "../chat-client/ChatClient";
import houseIconImages from "../houseIconImages";
import {
  westerosImage,
  westeros7pImage,
  westerosWithEssosImage,
  ffcEyrieWithPortImage,
  localizeMapImage
} from "../mapImages";
import MapViewport from "./MapViewport";
import hudSettings from "./hudSettings";
import { t } from "../i18n/i18n";

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

/**
 * Tela da partida "mapa em tela cheia" (proposta B do redesign).
 * Reaproveita os componentes de sempre (painel da fase, Casas, chat e
 * histórico); só muda onde e como cada um aparece.
 */
@observer
export default class HudLayout extends Component<HudLayoutProps> {
  @observable chatOpen = false;
  @observable windowWidth = window.innerWidth;

  // Painel das Casas: mais largo em telas grandes para a trilha de
  // suprimento caber numa linha só.
  private get rightPanelWidth(): number {
    if (this.windowWidth >= 1800) return 560;
    if (this.windowWidth >= 1600) return 520;
    return this.windowWidth >= 1280 ? 460 : 400;
  }

  private onResize = (): void => {
    this.windowWidth = window.innerWidth;
  };

  componentDidMount(): void {
    window.addEventListener("resize", this.onResize);
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this.onResize);
  }

  private get gameClient(): GameClient {
    return this.props.gameClient;
  }

  private get ingame(): IngameGameState {
    return this.props.ingame;
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

  private get minimapImage(): string {
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

  render(): ReactNode {
    const rightOpen = hudSettings.rightPanelOpen;
    const insets = {
      top: TOP_BAR_HEIGHT,
      right: rightOpen ? this.rightPanelWidth + 24 : 84,
      bottom: 24,
      left: 12
    };

    return (
      <div
        className="hud-root"
        style={
          {
            "--hud-right-panel-width": `${this.rightPanelWidth}px`
          } as React.CSSProperties
        }
      >
        <MapViewport
          contentWidth={this.mapSize.width}
          contentHeight={this.mapSize.height}
          minimapImage={this.minimapImage}
          insets={insets}
          controlsRight={rightOpen ? this.rightPanelWidth + 24 : 84}
        >
          <MapComponent
            gameClient={this.gameClient}
            ingameGameState={this.ingame}
            mapControls={this.props.mapControls}
          />
        </MapViewport>

        <div className="hud-top-left">
          <GameStateColumn
            ingame={this.ingame}
            gameClient={this.gameClient}
            mapControls={this.props.mapControls}
            onColumnSwapClick={this.props.onColumnSwapClick}
            hudPart="status"
          />
        </div>

        {this.renderTopRight()}
        {rightOpen ? this.renderRightPanel() : this.renderHouseStrip()}
        {this.renderActionDock()}
        {this.renderChatDock()}
      </div>
    );
  }

  private renderTopRight(): ReactNode {
    return (
      <div className="hud-top-right">
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
        <button
          type="button"
          className="hud-icon-button hud-text-icon-button"
          title={t("hud.menu.classicLayoutHint")}
          onClick={() => hudSettings.setClassicLayout(true)}
        >
          {t("hud.menu.classicLayout")}
        </button>
      </div>
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
          {/* As linhas das Casas precisam de uns 580px. Em painéis mais
              estreitos, o conteúdo é reduzido por igual em vez de cortado. */}
          <div style={{ zoom: Math.min(1, (this.rightPanelWidth - 14) / 580) }}>
            <HouseInfoColumn
              ingame={this.ingame}
              gameClient={this.gameClient}
              mapControls={this.props.mapControls}
              gameControlsPopover={this.props.gameControlsPopover}
              tracks={this.props.tracks}
              showGameControls={false}
              onColumnSwapClick={this.props.onColumnSwapClick}
            />
          </div>
        </div>
      </aside>
    );
  }

  // Painel das Casas recolhido: só o brasão, os Pontos de Vitória e o Poder.
  private renderHouseStrip(): ReactNode {
    const houses: House[] = this.gameClient.getPotentialWinners();
    const me = this.gameClient.authenticatedPlayer?.house;
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
          <OverlayTrigger
            key={`hud-strip-${h.id}`}
            placement="left"
            overlay={
              <Tooltip id={`hud-strip-tooltip-${h.id}`}>
                <b>{h.name}</b>
                <br />
                {t("hud.houses.victoryPoints", {
                  n: this.ingame.game.getVictoryPoints(h)
                })}
                <br />
                {t("hud.houses.power", { n: h.powerTokens })}
              </Tooltip>
            }
          >
            <div
              className={classNames("hud-house-chip", { mine: h == me })}
              style={{ borderColor: h == me ? undefined : h.color }}
            >
              <span
                className="hud-house-icon"
                style={{ backgroundColor: h.color }}
              >
                {houseIconImages.has(h.id) && (
                  <img src={houseIconImages.get(h.id)} alt="" />
                )}
              </span>
              <span className="hud-house-vp">
                {this.ingame.game.getVictoryPoints(h)}
              </span>
            </div>
          </OverlayTrigger>
        ))}
      </aside>
    );
  }

  private renderActionDock(): ReactNode {
    const ownTurn = this.isOwnTurn;
    const ended = this.ingame.childGameState instanceof GameEndedGameState;
    const cancelled = this.ingame.childGameState instanceof CancelledGameState;
    const waited = ownTurn ? [] : this.waitedHouseNames();
    const minimized = hudSettings.actionDockMinimized;

    const badge = ended
      ? { cls: "ended", text: t("hud.action.ended") }
      : cancelled
        ? { cls: "cancelled", text: t("hud.action.cancelled") }
        : ownTurn
          ? { cls: "own-turn", text: t("hud.action.yourTurn") }
          : { cls: "waiting", text: t("hud.action.waiting") };

    return (
      <section
        className={classNames("hud-panel hud-action-dock", {
          "own-turn": ownTurn,
          minimized: minimized
        })}
        style={{
          right: hudSettings.rightPanelOpen ? this.rightPanelWidth + 24 : 12
        }}
        aria-label={t("hud.action.title")}
      >
        <div className="hud-action-header">
          <span className={classNames("hud-badge", badge.cls)}>
            {badge.text}
          </span>
          <span className="hud-action-summary">
            {!ownTurn && waited.length > 0
              ? t("hud.action.waitingFor", {
                  houses: waited.join(", ")
                })
              : ownTurn && minimized
                ? t("hud.action.minimizedHint")
                : null}
          </span>
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
        {!minimized && (
          <div className="hud-action-body">
            <GameStateColumn
              ingame={this.ingame}
              gameClient={this.gameClient}
              mapControls={this.props.mapControls}
              onColumnSwapClick={this.props.onColumnSwapClick}
              hudPart="action"
            />
          </div>
        )}
      </section>
    );
  }

  private renderChatDock(): ReactNode {
    const unread = this.unreadPublicMessages;
    const privateUnread = this.hasUnreadPrivateMessages;
    const lastMessage = _.last(this.publicChatRoom?.messages ?? []);

    return (
      <div className="hud-chat-dock">
        {this.chatOpen && (
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
                gameClient={this.gameClient}
                ingame={this.ingame}
                mapControls={this.props.mapControls}
              />
            </div>
          </div>
        )}
        {!this.chatOpen && (
          <button
            type="button"
            className="hud-panel hud-chat-button"
            onClick={() => (this.chatOpen = true)}
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
                t("hud.chat.open")
              )}
            </span>
            {unread > 0 && <span className="hud-count">{unread}</span>}
            {privateUnread && (
              <span className="hud-dot" title={t("hud.chat.privateUnread")} />
            )}
          </button>
        )}
      </div>
    );
  }
}
