/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Component, ReactNode } from "react";
import User from "../server/User";
import React from "react";
import { observer } from "mobx-react";
import { faWifi } from "@fortawesome/free-solid-svg-icons/faWifi";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import GameClient from "./GameClient";
import LobbyGameState from "../common/lobby-game-state/LobbyGameState";
import IngameGameState from "../common/ingame-game-state/IngameGameState";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Nav, Navbar, NavDropdown } from "react-bootstrap";
import Player from "../common/ingame-game-state/Player";
import ConditionalWrap from "./utils/ConditionalWrap";
import { faUserGear } from "@fortawesome/free-solid-svg-icons";
import clonesImage from "../../public/images/icons/clones.svg";
import getElapsedSeconds from "../utils/getElapsedSeconds";
import { secondsToString } from "./utils/secondsToString";
import classNames from "classnames";
import { t, tr } from "./i18n/i18n";

interface UserLabelProps {
  gameClient: GameClient;
  gameState: IngameGameState | LobbyGameState;
  user: User;
}

@observer
export default class UserLabel extends Component<UserLabelProps> {
  get user(): User {
    return this.props.user;
  }

  get ingame(): IngameGameState | null {
    if (this.props.gameState instanceof IngameGameState) {
      return this.props.gameState;
    }
    return null;
  }

  get player(): Player | null {
    if (!this.ingame) {
      return null;
    }

    return this.ingame.players.get(this.user);
  }

  render(): ReactNode {
    const canActAsOwner =
      this.props.gameState.entireGame.canActAsOwner(this.user) &&
      !this.props.gameState.entireGame.gameSettings.faceless;
    const isRealOwner = this.props.gameState.entireGame.isRealOwner(this.user);

    return (
      <Navbar variant="dark" className="no-space-around">
        <Navbar.Brand className="no-space-around">
          <small>
            <OverlayTrigger
              overlay={
                <Tooltip id={`${this.user.id}-connection-tooltip`}>
                  {this.user.connected ? t("auto2.UserLabel.0") : t("auto2.UserLabel.1")}
                </Tooltip>
              }
            >
              <FontAwesomeIcon
                icon={faWifi}
                className={this.user.connected ? "text-success" : "text-danger"}
              />
            </OverlayTrigger>
            {!this.props.gameState.entireGame.gameSettings.private &&
              this.user.otherUsersFromSameNetwork.size > 0 &&
              this.renderOtherUsersFromSameNetworkTooltip()}
            {canActAsOwner && (
              <>
                <OverlayTrigger
                  overlay={
                    <Tooltip id={`${this.user.id}-owner-tooltip`}>
                      {tr("auto.UserLabel.0", { p0: (!isRealOwner ? t("auto2.UserLabel.2") : "") })}
                    </Tooltip>
                  }
                >
                  <FontAwesomeIcon
                    icon={faUserGear}
                    style={{ marginLeft: 5 }}
                  />
                </OverlayTrigger>
              </>
            )}
          </small>
        </Navbar.Brand>
        <Navbar.Collapse
          id={`navbar-${this.user.id}`}
          className="no-space-around"
        >
          <Nav className="no-space-around">
            <NavDropdown
              id={`nav-dropdown-${this.user.id}`}
              style={{ position: "static" }}
              className="no-gutters"
              title={
                <span
                  className={classNames("userlabel", {
                    "might-overflow ingame-userlabel": this.ingame != null,
                  })}
                >
                  {this.user.name}
                </span>
              }
            >
              {this.props.gameState.entireGame.gameSettings.faceless ? (
                <NavDropdown.Item className="text-center px-1 enabled" disabled>
                  {this.renderNameAndTimeElapsedDropDownItem()}
                </NavDropdown.Item>
              ) : (
                <NavDropdown.Item
                  className="text-center px-1"
                  href={`/user/${this.user.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tr("auto.UserLabel.1", { p0: (this.renderNameAndTimeElapsedDropDownItem()) })}
                </NavDropdown.Item>
              )}
              {this.renderIngameDropdownItems()}
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }

  private renderNameAndTimeElapsedDropDownItem(): ReactNode {
    return (
      <>
        <div className="text-larger">
          <b>{this.user.name}</b>
        </div>
        {this.player?.waitedForData != null &&
          !this.player.waitedForData.handled &&
          this.props.gameState.entireGame.now.getTime() > 0 && (
            <OverlayTrigger
              overlay={
                <Tooltip id={`waiting-for-user-${this.user.id}-action-tooltip`}>
                  {tr("auto.UserLabel.2")}
                </Tooltip>
              }
            >
              <small>
                {secondsToString(
                  getElapsedSeconds(this.player.waitedForData.date),
                )}
              </small>
            </OverlayTrigger>
          )}
      </>
    );
  }

  renderOtherUsersFromSameNetworkTooltip(): ReactNode {
    if (this.props.gameState.entireGame.gameSettings.faceless && this.ingame) {
      return null;
    }

    return (
      <OverlayTrigger
        placement="auto"
        overlay={
          <Tooltip id={`${this.user.id}-other-users-with-same-ip-tooltip`}>
            {tr("auto.UserLabel.3", { p0: (this.ingame ? t("auto2.UserLabel.3") : t("auto2.UserLabel.4")), p1: (this.user.name), p2: (Array.from(this.user.otherUsersFromSameNetwork).map((usr) => (
              <div key={`same-network-user_${usr}`}>{usr}</div>
            ))) })}
          </Tooltip>
        }
      >
        <img
          src={clonesImage}
          width="18"
          style={{ marginLeft: 5, marginTop: -3 }}
        />
      </OverlayTrigger>
    );
  }

  renderIngameDropdownItems(): ReactNode {
    if (!this.ingame) {
      return null;
    }

    const ingame = this.ingame;

    const {
      result: canLaunchReplacePlayerVote,
      reason: canLaunchReplacePlayerVoteReason,
    } = ingame.canLaunchReplacePlayerVote(
      this.props.gameClient.authenticatedUser,
    );
    const {
      result: canLaunchReplacePlayerByVassalVote,
      reason: canLaunchReplacePlayerByVassalVoteReason,
    } = ingame.canLaunchReplacePlayerVote(
      this.props.gameClient.authenticatedUser,
      true,
      this.player!.house,
    );
    const {
      result: canLaunchSwapHousesVote,
      reason: canLaunchSwapHousesVoteReason,
    } = ingame.canLaunchSwapHousesVote(
      this.props.gameClient.authenticatedUser,
      this.player!,
    );
    const {
      result: canLaunchDeclareWinnerVote,
      reason: canLaunchDeclareWinnerVoteReason,
    } = ingame.canLaunchDeclareWinnerVote(
      this.props.gameClient.authenticatedUser,
    );
    return (
      <>
        <NavDropdown.Divider />
        <ConditionalWrap
          condition={!canLaunchReplacePlayerVote}
          wrap={(children) => (
            <OverlayTrigger
              overlay={
                <Tooltip id="replace-player-tooltip">
                  {canLaunchReplacePlayerVoteReason == "already-playing"
                    ? t("auto2.UserLabel.5")
                    : canLaunchReplacePlayerVoteReason == "ongoing-vote"
                      ? t("auto2.UserLabel.6")
                      : canLaunchReplacePlayerVoteReason == "game-cancelled"
                        ? t("auto2.UserLabel.7")
                        : canLaunchReplacePlayerVoteReason == "game-ended"
                          ? t("auto2.UserLabel.8")
                          : canLaunchReplacePlayerVoteReason == "game-paused"
                            ? t("auto2.UserLabel.9")
                            : canLaunchReplacePlayerVoteReason ==
                                "forbidden-in-tournament-mode"
                              ? t("auto2.UserLabel.10")
                              : t("auto2.UserLabel.11")}
                </Tooltip>
              }
              placement="auto"
            >
              {children}
            </OverlayTrigger>
          )}
        >
          <div id="replace-player-tooltip-wrapper">
            <NavDropdown.Item
              className="px-2"
              onClick={() => this.onLaunchReplacePlayerVoteClick()}
              disabled={!canLaunchReplacePlayerVote}
            >
              {t("auto.UserLabel.4")}</NavDropdown.Item>
          </div>
        </ConditionalWrap>
        <NavDropdown.Divider />
        <ConditionalWrap
          condition={!canLaunchReplacePlayerByVassalVote}
          wrap={(children) => (
            <OverlayTrigger
              overlay={
                <Tooltip id="replace-player-by-vassal-tooltip">
                  {canLaunchReplacePlayerByVassalVoteReason == "ongoing-vote"
                    ? t("auto2.UserLabel.12")
                    : canLaunchReplacePlayerByVassalVoteReason ==
                        "game-cancelled"
                      ? t("auto2.UserLabel.13")
                      : canLaunchReplacePlayerByVassalVoteReason == "game-ended"
                        ? t("auto2.UserLabel.14")
                        : canLaunchReplacePlayerByVassalVoteReason ==
                            "only-players-can-vote"
                          ? t("auto2.UserLabel.15")
                          : canLaunchReplacePlayerByVassalVoteReason ==
                              "game-paused"
                            ? t("auto2.UserLabel.16")
                            : canLaunchReplacePlayerByVassalVoteReason ==
                                "min-player-count-reached"
                              ? t("auto2.UserLabel.17")
                              : canLaunchReplacePlayerByVassalVoteReason ==
                                  "vassalizing-yourself-is-forbidden"
                                ? t("auto2.UserLabel.18")
                                : canLaunchReplacePlayerByVassalVoteReason ==
                                    "only-possible-when-defeated"
                                  ? t("auto2.UserLabel.19")
                                  : canLaunchReplacePlayerByVassalVoteReason ==
                                      "ongoing-draft"
                                    ? t("auto2.UserLabel.20")
                                    : t("auto2.UserLabel.21")}
                </Tooltip>
              }
              placement="auto"
            >
              {children}
            </OverlayTrigger>
          )}
        >
          <div id="replace-by-vassal-tooltip-wrapper">
            <NavDropdown.Item
              className="px-2"
              onClick={() => this.onLaunchReplacePlayerByVassalVoteClick()}
              disabled={!canLaunchReplacePlayerByVassalVote}
            >
              {t("auto.UserLabel.5")}</NavDropdown.Item>
          </div>
        </ConditionalWrap>
        <NavDropdown.Divider />
        <ConditionalWrap
          condition={!canLaunchSwapHousesVote}
          wrap={(children) => (
            <OverlayTrigger
              overlay={
                <Tooltip id="swap-houses-tooltip">
                  {canLaunchSwapHousesVoteReason == "ongoing-vote"
                    ? t("auto2.UserLabel.22")
                    : canLaunchSwapHousesVoteReason == "game-cancelled"
                      ? t("auto2.UserLabel.23")
                      : canLaunchSwapHousesVoteReason == "game-ended"
                        ? t("auto2.UserLabel.24")
                        : canLaunchSwapHousesVoteReason ==
                            "only-players-can-vote"
                          ? t("auto2.UserLabel.25")
                          : canLaunchSwapHousesVoteReason ==
                              "cannot-swap-with-yourself"
                            ? t("auto2.UserLabel.26")
                            : canLaunchSwapHousesVoteReason ==
                                "secret-objectives-chosen"
                              ? t("vote.reason.secretObjectivesChosen", { user: this.player!.user.name })
                              : canLaunchSwapHousesVoteReason ==
                                  "forbidden-in-tournament-mode"
                                ? t("auto2.UserLabel.27")
                                : t("auto2.UserLabel.28")}
                </Tooltip>
              }
              placement="auto"
            >
              {children}
            </OverlayTrigger>
          )}
        >
          <div id="swap-houses-tooltip-wrapper">
            <NavDropdown.Item
              className="px-2"
              onClick={() => this.onLaunchSwapHousesVoteClick()}
              disabled={!canLaunchSwapHousesVote}
            >
              {t("auto.UserLabel.6")}</NavDropdown.Item>
          </div>
        </ConditionalWrap>
        <NavDropdown.Divider />
        <ConditionalWrap
          condition={!canLaunchDeclareWinnerVote}
          wrap={(children) => (
            <OverlayTrigger
              overlay={
                <Tooltip id="declare-winner-tooltip">
                  {canLaunchDeclareWinnerVoteReason == "ongoing-vote"
                    ? t("auto2.UserLabel.29")
                    : canLaunchDeclareWinnerVoteReason == "game-cancelled"
                      ? t("auto2.UserLabel.30")
                      : canLaunchDeclareWinnerVoteReason == "game-ended"
                        ? t("auto2.UserLabel.31")
                        : canLaunchDeclareWinnerVoteReason ==
                            "only-players-can-vote"
                          ? t("auto2.UserLabel.32")
                          : canLaunchDeclareWinnerVoteReason ==
                              "forbidden-in-tournament-mode"
                            ? t("auto2.UserLabel.33")
                            : t("auto2.UserLabel.34")}
                </Tooltip>
              }
              placement="auto"
            >
              {children}
            </OverlayTrigger>
          )}
        >
          <div id="declare-winner-tooltip-wrapper">
            <NavDropdown.Item
              className="px-2"
              onClick={() => this.onLaunchDeclareWinnerClick()}
              disabled={!canLaunchDeclareWinnerVote}
            >
              {tr("auto.UserLabel.7", { p0: (this.player!.house.name) })}</NavDropdown.Item>
          </div>
        </ConditionalWrap>
      </>
    );
  }

  onLaunchReplacePlayerVoteClick(): void {
    if (!this.ingame) {
      throw new Error(
        "`launchReplacePlayerVote` called when the game was not in IngameGameState",
      );
    }

    if (
      window.confirm(
        t("vote.confirm.replacePlayer", { user: this.player!.user.name, house: this.player!.house.name }),
      )
    ) {
      this.ingame.launchReplacePlayerVote(this.player!);
    }
  }

  onLaunchReplacePlayerByVassalVoteClick(): void {
    if (!this.ingame) {
      throw new Error(
        "`launchReplacePlayerVote` called when the game was not in IngameGameState",
      );
    }

    if (
      window.confirm(
        t("vote.confirm.replaceByVassal", { user: this.player!.user.name, house: this.player!.house.name }),
      )
    ) {
      this.ingame.launchReplacePlayerByVassalVote(this.player!);
    }
  }

  onLaunchSwapHousesVoteClick(): void {
    if (!this.ingame) {
      throw new Error(
        "`onLaunchSwapHousesVoteClick` called when the game was not in IngameGameState",
      );
    }

    if (
      window.confirm(
        t("vote.confirm.swapHouses", { user: this.player!.user.name, house: this.player!.house.name }),
      )
    ) {
      this.ingame.launchSwapHousesVote(this.player!);
    }
  }

  onLaunchDeclareWinnerClick(): void {
    if (!this.ingame) {
      throw new Error(
        "`onLaunchDeclareWinnerClick` called when the game was not in IngameGameState",
      );
    }

    if (
      window.confirm(
        t("vote.confirm.declareWinner", { house: this.player!.house.name }),
      )
    ) {
      this.ingame.launchDeclareWinnerVote(this.player!.house);
    }
  }
}
