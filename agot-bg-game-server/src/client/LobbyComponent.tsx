import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import LobbyGameState, {
  LobbyHouse
} from "../common/lobby-game-state/LobbyGameState";
import GameClient from "./GameClient";
import * as React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import classNames from "classnames";
import ChatComponent from "./chat-client/ChatComponent";
import GameSettingsComponent from "./GameSettingsComponent";
import User from "../server/User";
import { Badge, OverlayTrigger, Popover, Spinner } from "react-bootstrap";
import Tooltip from "react-bootstrap/Tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserLabel from "./UserLabel";
import EntireGame from "../common/EntireGame";
import HouseIconComponent from "./game-state-panel/utils/HouseIconComponent";
import { observable } from "mobx";
import DebouncedPasswordComponent from "./utils/DebouncedPasswordComponent";
import { faCheck, faLink, faLock } from "@fortawesome/free-solid-svg-icons";
import { setBoltonIconImage, setStarkIconImage } from "./houseIconImages";
import settingsKnobsImage from "../../public/images/icons/settings-knobs.svg";
import speakerImage from "../../public/images/icons/speaker.svg";
import speakerOffImage from "../../public/images/icons/speaker-off.svg";
import getUserLinkOrLabel from "./utils/getIngameUserLinkOrLabel";
import _ from "lodash";
import VolumeSliderComponent from "./utils/VolumeSliderComponent";
import { OverlayChildren } from "react-bootstrap/esm/Overlay";
import { t } from "./i18n/i18n";
import LanguageSelectComponent from "./i18n/LanguageSelectComponent";
import { GameSettings } from "../common/GameSettings";
import { allGameSetups } from "../common/ingame-game-state/game-data-structure/createGame";
import { getSetupShortName } from "./i18n/setupNames";
import westerosImage from "../../public/images/westeros.jpg";

interface LobbyComponentProps {
  gameClient: GameClient;
  gameState: LobbyGameState;
}

@observer
export default class LobbyComponent extends Component<LobbyComponentProps> {
  private lobbyHousesListRef = React.createRef<HTMLDivElement>();

  @observable password = this.props.gameClient.isRealOwner()
    ? this.lobby.password
    : "";

  get authenticatedUser(): User {
    return this.props.gameClient.authenticatedUser as User;
  }

  get entireGame(): EntireGame {
    return this.lobby.entireGame;
  }

  get randomHouses(): boolean {
    return this.entireGame.gameSettings.randomHouses;
  }

  get lobby(): LobbyGameState {
    return this.props.gameState;
  }

  get readyCheckOngoing(): boolean {
    return this.lobby.readyUsers != null;
  }

  @observable chatHeight = 430;

  render(): ReactNode {
    const { success: canStartGame, reason: canStartGameReason } =
      this.lobby.canStartGame(this.authenticatedUser);
    const { success: canCancelGame, reason: canCancelGameReason } =
      this.lobby.canCancel(this.authenticatedUser);

    const connectedSpectators = this.getConnectedSpectators();
    const houses = this.lobby.getAvailableHouses();
    const needed = this.entireGame.selectedGameSetup.playerCount;
    const seated = houses.filter((h) => this.lobby.players.has(h)).length;
    const mySeat = this.lobby.players.entries.find(
      ([, u]) => u == this.authenticatedUser
    );
    const isOwner = this.props.gameClient.isRealOwner();

    const startReason = this.readyCheckOngoing
      ? mySeat && !(this.lobby.readyUsers ?? []).includes(this.authenticatedUser)
        ? t("lobby.ui.clickReady")
        : t("lobby.ui.waitingReady")
      : canStartGameReason == "not-enough-players"
        ? t("lobby.ui.missingPlayers", {
            n: Math.max(
              0,
              (this.settings.vassals ? this.entireGame.minPlayerCount : needed) -
                seated
            )
          })
        : canStartGameReason == "targaryen-must-be-a-player-controlled-house"
          ? t("lobby.targaryenMustBePlayer")
          : canStartGameReason == "not-owner"
            ? t("lobby.onlyOwnerCanStart")
            : this.settings.pbem
              ? t("lobby.ui.readyPbem")
              : t("lobby.ui.readyLive");

    return (
      <div className="lobby-screen">
        <div
          className="lobby-backdrop"
          style={{ backgroundImage: `url(${westerosImage})` }}
          aria-hidden="true"
        />

        <header className="lobby-panel lobby-hero">
          <div className="lobby-hero-text">
            {location.pathname.startsWith("/play") && (
              <a className="lobby-back" href="/games">
                ← {t("lobby.ui.back")}
              </a>
            )}
            <span className="lobby-kicker">{t("lobby.ui.kicker")}</span>
            <h1 className="lobby-title">{this.entireGame.name}</h1>
            <div className="lobby-badges">
              <span className="lobby-badge">
                {this.settings.pbem
                  ? t("lobby.ui.modePbem")
                  : t("lobby.ui.modeLive")}
              </span>
              <span className="lobby-badge">{this.setupName}</span>
              {this.settings.private && (
                <span className="lobby-badge">{t("lobby.ui.private")}</span>
              )}
              {this.lobby.password != "" && (
                <span className="lobby-badge danger">
                  <FontAwesomeIcon icon={faLock} size="sm" />{" "}
                  {t("lobby.ui.locked")}
                </span>
              )}
            </div>
          </div>
          <div className="lobby-hero-side">
            <div className="lobby-count">
              <b>
                {seated}
                <small>/{needed}</small>
              </b>
              <span>{t("lobby.ui.seated")}</span>
            </div>
            <span className="lobby-meter" aria-hidden="true">
              <span
                className="lobby-meter-fill"
                style={{
                  width: `${needed ? Math.min(100, Math.round((seated / needed) * 100)) : 0}%`
                }}
              />
            </span>
            <button
              type="button"
              className="lobby-btn ghost"
              onClick={() => this.copyInvite()}
            >
              <FontAwesomeIcon icon={this.copied ? faCheck : faLink} />{" "}
              {this.copied ? t("lobby.ui.copied") : t("lobby.ui.invite")}
            </button>
          </div>
        </header>

        <ol className="lobby-steps" aria-label={t("lobby.ui.stepsTitle")}>
          <li className={classNames({ done: !!mySeat })}>
            <b>1</b> {t("lobby.ui.step1")}
          </li>
          <li className={classNames({ done: seated >= needed })}>
            <b>2</b> {t("lobby.ui.step2")}
          </li>
          <li>
            <b>3</b>{" "}
            {isOwner ? t("lobby.ui.step3Owner") : t("lobby.ui.step3")}
          </li>
        </ol>

        <div className="lobby-main">
          <section className="lobby-panel lobby-houses">
            <div className="lobby-section-head">
              <h2>{t("lobby.ui.housesTitle")}</h2>
              <span>
                {this.randomHouses
                  ? t("lobby.ui.housesRandomHint")
                  : t("lobby.ui.housesHint")}
              </span>
            </div>
            {!isOwner &&
              this.lobby.password != "" &&
              !this.readyCheckOngoing &&
              this.renderPasswordInput()}
            <div className="lobby-seats" ref={this.lobbyHousesListRef}>
              {houses.map((h, i) => {
                const user = this.lobby.players.tryGet(h, null);
                return (
                  <div
                    key={`lobby-house_${h.id}`}
                    className={classNames("lobby-seat", {
                      taken: !!user,
                      mine: user == this.authenticatedUser
                    })}
                    style={{ ["--house-color" as string]: h.color }}
                  >
                    {this.randomHouses ? (
                      <span className="lobby-seat-number">{i + 1}</span>
                    ) : (
                      <HouseIconComponent house={h} size={38} />
                    )}
                    <div className="lobby-seat-text">
                      <b>
                        {this.randomHouses
                          ? t("lobby.seat", { n: i + 1 })
                          : h.name}
                      </b>
                      {user ? (
                        <UserLabel
                          gameClient={this.props.gameClient}
                          gameState={this.lobby}
                          user={user}
                        />
                      ) : (
                        <span className="lobby-seat-free">
                          {t("lobby.ui.freeSeat")}
                        </span>
                      )}
                    </div>
                    <div className="lobby-seat-action">
                      {this.renderLobbyHouseButtons(h)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="lobby-panel lobby-chat">
            <div className="lobby-section-head">
              <h2>{t("lobby.ui.chatTitle")}</h2>
              {connectedSpectators.length > 0 && (
                <span>
                  {t("lobby.ui.watching", { n: connectedSpectators.length })}
                </span>
              )}
            </div>
            <div className="lobby-chat-body">
              <ChatComponent
                gameClient={this.props.gameClient}
                entireGame={this.lobby.entireGame}
                roomId={this.lobby.entireGame.publicChatRoomId}
                currentlyViewed={true}
                getUserDisplayName={(u) => (
                  <a
                    href={`/user/${u.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "white" }}
                  >
                    <b>{u.name}</b>
                  </a>
                )}
              />
            </div>
            {connectedSpectators.length > 0 && (
              <div className="lobby-spectators">
                <span>{t("lobby.spectators")}</span>{" "}
                {connectedSpectators.map((u, i) => (
                  <React.Fragment key={`specatator_${u.id}`}>
                    {i > 0 && ", "}
                    <b>{getUserLinkOrLabel(u)}</b>
                  </React.Fragment>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="lobby-panel lobby-settings">
          <div className="lobby-section-head">
            <h2>{t("lobby.ui.settingsTitle")}</h2>
            <span>
              {isOwner
                ? t("lobby.ui.settingsHintOwner")
                : t("lobby.ui.settingsHint")}
            </span>
          </div>
          <Row className="no-space-around">
            <GameSettingsComponent
              gameClient={this.props.gameClient}
              entireGame={this.lobby.entireGame}
            />
          </Row>
          {isOwner && !this.readyCheckOngoing && (
            <div className="lobby-password">
              <span>{t("lobby.ui.passwordLabel")}</span>
              {this.renderPasswordInput()}
            </div>
          )}
        </section>

        <footer className="lobby-panel lobby-actionbar">
          <div className="lobby-start">
            <button
              type="button"
              className="lobby-btn primary big"
              onClick={() => this.lobby.start()}
              disabled={!canStartGame || this.readyCheckOngoing}
            >
              {this.settings.pbem
                ? t("lobby.ui.startPbem")
                : t("lobby.ui.startLive")}
            </button>
            <span
              className={classNames("lobby-start-reason", {
                ok: canStartGame && !this.readyCheckOngoing,
                attention:
                  this.readyCheckOngoing &&
                  !!mySeat &&
                  !(this.lobby.readyUsers ?? []).includes(this.authenticatedUser)
              })}
            >
              {startReason}
            </span>
          </div>
          <div className="lobby-tools">
            <button
              type="button"
              className="lobby-btn danger"
              onClick={() => this.cancel()}
              disabled={!canCancelGame || this.readyCheckOngoing}
              title={
                this.readyCheckOngoing
                  ? t("lobby.readyCheckOngoing")
                  : canCancelGameReason == "not-owner"
                    ? t("lobby.onlyOwnerCanCancel")
                    : undefined
              }
            >
              {t("lobby.cancel")}
            </button>
            <OverlayTrigger
              overlay={
                <Tooltip id="lobby-mute-tooltip">
                  {this.props.gameClient.muted
                    ? t("lobby.unmute")
                    : t("lobby.mute")}
                </Tooltip>
              }
            >
              <button
                type="button"
                className="lobby-btn icon"
                aria-label={
                  this.props.gameClient.muted
                    ? t("lobby.unmute")
                    : t("lobby.mute")
                }
                onClick={() =>
                  (this.props.gameClient.muted = !this.props.gameClient.muted)
                }
              >
                <img
                  src={
                    this.props.gameClient.muted ? speakerOffImage : speakerImage
                  }
                  height={22}
                  alt=""
                />
              </button>
            </OverlayTrigger>
            <OverlayTrigger
              overlay={this.renderVolumeControlPopover()}
              placement="top"
              trigger="click"
              rootClose
            >
              <button
                type="button"
                className="lobby-btn icon"
                aria-label={t("lobby.ui.volume")}
              >
                <img src={settingsKnobsImage} height={22} alt="" />
              </button>
            </OverlayTrigger>
            <LanguageSelectComponent />
          </div>
        </footer>
      </div>
    );
  }

  get settings(): GameSettings {
    return this.entireGame.gameSettings;
  }

  get setupName(): string {
    const id = this.settings.setupId;
    const data = allGameSetups.get(id);
    return t("lobby.ui.setup", {
      setup: getSetupShortName(id, data ? data.name : id),
      n: this.settings.playerCount
    });
  }

  @observable copied = false;

  copyInvite(): void {
    const link = `${location.origin}/play/${this.entireGame.id}`;
    const done = (): void => {
      this.copied = true;
      window.setTimeout(() => (this.copied = false), 2500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(done, () => prompt(t("lobby.ui.inviteManual"), link));
    } else {
      prompt(t("lobby.ui.inviteManual"), link);
    }
  }

  renderVolumeControlPopover(): OverlayChildren {
    return (
      <Popover
        id="game-controls-popover"
        style={{ maxWidth: "100%", borderColor: "white" }}
      >
        <Col className="m-2 p-2">
          <VolumeSliderComponent
            volume={this.props.gameClient.notificationsVolume * 100}
            name={t("lobby.volume.notifications")}
            onVolumeChange={(val) =>
              this.props.gameClient.sfxManager.notificationVolumeChanged(
                val / 100
              )
            }
          />
          <VolumeSliderComponent
            volume={this.props.gameClient.musicVolume * 100}
            name={t("lobby.volume.music")}
            onVolumeChange={(val) =>
              this.props.gameClient.sfxManager.musicVolumeChanged(val / 100)
            }
          />
          <VolumeSliderComponent
            volume={this.props.gameClient.sfxVolume * 100}
            name={t("lobby.volume.sfx")}
            onVolumeChange={(val) =>
              this.props.gameClient.sfxManager.sfxVolumeChanged(val / 100)
            }
          />
        </Col>
      </Popover>
    );
  }

  renderPasswordInput(): ReactNode {
    const isOwner = this.props.gameClient.isRealOwner();
    return (
      <Row className="justify-content-center mt-0">
        <DebouncedPasswordComponent
          password={this.password}
          onChangeCallback={(newPassword) => {
            this.password = newPassword;
            this.lobby.sendPassword(newPassword);
          }}
          tooltip={
            <Tooltip id="game-password-tooltip">
              {isOwner ? (
                <>{t("lobby.password.ownerTooltip")}</>
              ) : this.lobby.password != "" ? (
                <>{t("lobby.password.joinTooltip")}</>
              ) : (
                <></>
              )}
            </Tooltip>
          }
          placeHolder={
            isOwner
              ? t("lobby.password.ownerPlaceholder")
              : t("lobby.password.joinPlaceholder")
          }
          width={300}
        />
      </Row>
    );
  }

  getConnectedSpectators(): User[] {
    return _.difference(
      this.entireGame.users.values.filter((u) => u.connected),
      this.lobby.players.values
    );
  }

  renderLobbyHouseButtons(h: LobbyHouse): React.ReactNode {
    const invisible = !this.isHouseAvailable(h);

    if (this.lobby.readyUsers != null) {
      // Ready-check ongoing
      if (!this.lobby.players.has(h) || invisible) {
        return (
          <Col xs="auto">
            <Button type="button" size="sm" className="invisible">
              {t("auto.LobbyComponent.0")}</Button>
          </Col>
        );
      }
      return this.lobby.readyUsers.includes(this.lobby.players.get(h)) ? (
        <Col xs="auto">
          <Badge variant="success">
            <FontAwesomeIcon icon={faCheck} size="sm" />
          </Badge>
        </Col>
      ) : this.lobby.players.get(h) == this.authenticatedUser ? (
        <Col xs="auto" className="d-flex align-items-center">
          <Button
            type="button"
            size="sm"
            variant="outline-success"
            onClick={() => this.ready()}
          >
            {t("lobby.ready")}
          </Button>
          <Spinner
            className="ml-3"
            size="sm"
            animation="border"
            variant="info"
          />
        </Col>
      ) : (
        <Col xs="auto">
          <Spinner size="sm" animation="border" variant="info" />
        </Col>
      );
    }

    if (
      !this.props.gameClient.isRealOwner() &&
      this.lobby.password != "" &&
      this.password != this.lobby.password &&
      // If user is already seated, allow them to "Leave"
      (!this.lobby.players.has(h) ||
        this.lobby.players.get(h) != this.authenticatedUser)
    ) {
      return (
        <Col xs="auto" className={invisible ? "invisible" : ""}>
          <FontAwesomeIcon icon={faLock} size="sm" />
        </Col>
      );
    }

    return !this.lobby.players.has(h) ? (
      <Col xs="auto" className={invisible ? "invisible" : ""}>
        <Button type="button" size="sm" onClick={() => this.choose(h)}>
          {t("lobby.choose")}
        </Button>
      </Col>
    ) : this.lobby.players.get(h) == this.authenticatedUser ? (
      <Col xs="auto" className={invisible ? "invisible" : ""}>
        <Button
          type="button"
          size="sm"
          variant="danger"
          onClick={() => this.leave()}
        >
          {t("lobby.leave")}
        </Button>
      </Col>
    ) : (
      this.props.gameClient.isRealOwner() && (
        <Col xs="auto" className={invisible ? "invisible" : ""}>
          <Button
            type="button"
            size="sm"
            variant="danger"
            onClick={() => this.kick(h)}
          >
            {t("lobby.kick")}
          </Button>
        </Col>
      )
    );
  }

  isHouseAvailable(house: LobbyHouse): boolean {
    return this.lobby.getAvailableHouses().includes(house);
  }

  choose(house: LobbyHouse): void {
    this.lobby.chooseHouse(house, this.password);
  }

  kick(house: LobbyHouse): void {
    this.lobby.kick(this.lobby.players.get(house));
  }

  cancel(): void {
    if (confirm(t("lobby.confirmCancel"))) {
      this.lobby.cancel();
    }
  }

  leave(): void {
    this.lobby.chooseHouse(null, this.password);
  }

  ready(): void {
    this.lobby.ready();
  }

  UNSAFE_componentWillUpdate(): void {
    if (this.entireGame.gameSettings.adwdHouseCards) {
      setBoltonIconImage();
      this.lobby.lobbyHouses.get("stark").name = "Bolton";
    } else {
      setStarkIconImage();
      this.lobby.lobbyHouses.get("stark").name = "Stark";
    }
  }

  componentDidMount(): void {
    this.setChatHeight();
  }

  setChatHeight(): void {
    this.chatHeight =
      this.lobbyHousesListRef.current?.getBoundingClientRect()?.height ?? 400;
  }
}
