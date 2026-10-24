import React, { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { observable } from "mobx";

import {
  Col,
  Row,
  Card,
  ListGroup,
  ListGroupItem,
  OverlayTrigger,
  Tooltip,
  Spinner,
  Popover
} from "react-bootstrap";
import { OverlayChildren } from "react-bootstrap/esm/Overlay";

import { MAX_WILDLING_STRENGTH } from "../common/ingame-game-state/game-data-structure/Game";

import classNames from "classnames";
import * as _ from "lodash";

import BetterMap from "../utils/BetterMap";
import PartialRecursive from "../utils/PartialRecursive";

import ConditionalWrap from "./utils/ConditionalWrap";
import renderChildGameState from "./utils/renderChildGameState";
import joinNaturalLanguage from "./utils/joinNaturalLanguage";

import IngameGameState from "../common/ingame-game-state/IngameGameState";
import GameClient from "./GameClient";
import MapControls, { RegionOnMapProperties } from "./MapControls";
import WildlingCardType from "../common/ingame-game-state/game-data-structure/wildling-card/WildlingCardType";
import Region from "../common/ingame-game-state/game-data-structure/Region";

import WesterosGameState from "../common/ingame-game-state/westeros-game-state/WesterosGameState";
import PlanningGameState from "../common/ingame-game-state/planning-game-state/PlanningGameState";
import ActionGameState from "../common/ingame-game-state/action-game-state/ActionGameState";
import DraftGameState from "../common/ingame-game-state/draft-game-state/DraftGameState";
import GameEndedGameState from "../common/ingame-game-state/game-ended-game-state/GameEndedGameState";
import CancelledGameState from "../common/cancelled-game-state/CancelledGameState";
import PayDebtsGameState from "../common/ingame-game-state/pay-debts-game-state/PayDebtsGameState";
import ChooseInitialObjectivesGameState from "../common/ingame-game-state/choose-initial-objectives-game-state/ChooseInitialObjectivesGameState";

import GameTabsComponent from "./GameTabsComponent";
import ColumnSwapButton from "./game-state-panel/utils/ColumnSwapButton";

import WesterosGameStateComponent from "./game-state-panel/WesterosGameStateComponent";
import PlanningComponent from "./game-state-panel/PlanningComponent";
import ActionComponent from "./game-state-panel/ActionComponent";
import DraftComponent from "./game-state-panel/DraftComponent";
import GameEndedComponent from "./game-state-panel/GameEndedComponent";
import IngameCancelledComponent from "./game-state-panel/IngameCancelledComponent";
import PayDebtsComponent from "./game-state-panel/PayDebtsComponent";
import ChooseInitialObjectivesComponent from "./game-state-panel/ChooseInitialObjectivesComponent";
import WesterosCardComponent from "./game-state-panel/utils/WesterosCardComponent";
import WildlingCardComponent from "./game-state-panel/utils/WildlingCardComponent";

import hourglassImage from "../../public/images/icons/hourglass.svg";
import mammothImage from "../../public/images/icons/mammoth.svg";
import spikedDragonHeadImage from "../../public/images/icons/spiked-dragon-head.svg";
import ClaimVassalsGameState from "../common/ingame-game-state/planning-game-state/claim-vassals-game-state/ClaimVassalsGameState";
import ClaimVassalsComponent from "./game-state-panel/ClaimVassalsComponent";
import hudSettings from "./hud/hudSettings";
import { t } from "./i18n/i18n";

interface GameStateColumnProps {
  ingame: IngameGameState;
  gameClient: GameClient;
  mapControls: MapControls;
  onColumnSwapClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  // Tela nova (mapa em tela cheia): "status" mostra só a barra de rodada,
  // fase e Selvagens; "action" mostra só o painel da jogada atual.
  // "westeros": a mesma informação de "status", em coluna (tela de duas colunas).
  hudPart?: "status" | "action" | "westeros";
}

@observer
export default class GameStateColumn extends Component<GameStateColumnProps> {
  @observable highlightedRegions = new BetterMap<
    Region,
    RegionOnMapProperties
  >();

  modifyRegionsOnMapCallback: any;

  private ingame = this.props.ingame;
  private game = this.ingame.game;
  private gameClient = this.props.gameClient;
  private mapControls = this.props.mapControls;
  private gameSettings = this.ingame.entireGame.gameSettings;
  private authenticatedPlayer = this.gameClient.authenticatedPlayer;

  render(): ReactNode {
    const phases = [
      {
        name: t("phase.westeros"),
        gameState: WesterosGameState,
        component: WesterosGameStateComponent
      },
      {
        name: t("phase.planning"),
        gameState: PlanningGameState,
        component: PlanningComponent
      },
      {
        name: t("phase.action"),
        gameState: ActionGameState,
        component: ActionComponent
      }
    ];

    const gameRunning = !this.ingame.isEndedOrCancelled;
    const roundWarning =
      gameRunning && this.ingame.game.maxTurns - this.ingame.game.turn == 1;
    const roundCritical =
      gameRunning && this.ingame.game.turn == this.ingame.game.maxTurns;

    const wildlingsWarning =
      gameRunning &&
      this.ingame.game.wildlingStrength == MAX_WILDLING_STRENGTH - 4;
    const wildlingsCritical =
      gameRunning &&
      (this.ingame.game.wildlingStrength == MAX_WILDLING_STRENGTH ||
        this.ingame.game.wildlingStrength == MAX_WILDLING_STRENGTH - 2);

    const knowsWildlingCard =
      this.authenticatedPlayer != null &&
      this.authenticatedPlayer.house.knowsNextWildlingCard;
    const nextWildlingCard = this.game.wildlingDeck.find(
      (c) => c.id == this.game.clientNextWildlingCardId
    );

    let isOwnTurn = false;
    try {
      isOwnTurn = this.gameClient.isOwnTurn();
    } catch (e) {
      // Ignore getControllerOfHouse errors that can occur
      // after vassal to player replacement
      if (
        e instanceof Error &&
        e.message.includes("failed as there is no suzerainHouse")
      ) {
        console.warn(e.message);
        isOwnTurn = false;
      } else {
        throw e;
      }
    }
    const border = isOwnTurn
      ? "warning"
      : this.ingame.childGameState instanceof CancelledGameState
        ? "danger"
        : undefined;

    const isPhaseActive = (phase: any): boolean =>
      this.ingame.childGameState instanceof phase.gameState;

    const phaseAndState = (
              <ListGroup variant="flush">
                {/* Na tela nova a fase já aparece na barra do topo */}
                {this.props.hudPart != "action" &&
                  phases.some((phase) => isPhaseActive(phase)) && (
                  <ListGroupItem>
                    <Row className="justify-content-between align-items-center">
                      <Col
                        xs="auto"
                        key={phases[0].name + "_phase"}
                        className="px-1"
                      >
                        <OverlayTrigger
                          overlay={this.renderRemainingWesterosCards()}
                          trigger="click"
                          placement="bottom-start"
                          rootClose
                        >
                          <div
                            className={classNames(
                              "clickable btn btn-sm btn-secondary dropdown-toggle",
                              {
                                "weak-box-outline": isPhaseActive(phases[0]),
                                "text-muted": !isPhaseActive(phases[0])
                              }
                            )}
                          >
                            <ConditionalWrap
                              condition={isPhaseActive(phases[0])}
                              wrap={(child) => <b>{child}</b>}
                            >
                              <>{t("phase.label", { phase: phases[0].name })}</>
                            </ConditionalWrap>
                          </div>
                        </OverlayTrigger>
                      </Col>
                      {_.drop(phases).map((phase) => (
                        <Col
                          xs="auto"
                          key={`${phase.name}_phase`}
                          className="px-1"
                        >
                          <div
                            className={classNames({
                              "p-1": true,
                              "weak-box-outline": isPhaseActive(phase),
                              "text-muted": !isPhaseActive(phase)
                            })}
                          >
                            <ConditionalWrap
                              condition={isPhaseActive(phase)}
                              wrap={(child) => <b>{child}</b>}
                            >
                              <>{t("phase.label", { phase: phase.name })}</>
                            </ConditionalWrap>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </ListGroupItem>
                )}
                <ListGroupItem className="text-large">
                  {renderChildGameState(
                    {
                      mapControls: this.mapControls,
                      gameClient: this.gameClient,
                      gameState: this.ingame
                    },
                    _.concat(
                      phases.map(
                        (phase) =>
                          [phase.gameState, phase.component] as [
                            any,
                            typeof Component
                          ]
                      ),
                      [[DraftGameState, DraftComponent]],
                      [[GameEndedGameState, GameEndedComponent]],
                      [[CancelledGameState, IngameCancelledComponent]],
                      [[PayDebtsGameState, PayDebtsComponent]],
                      [[ClaimVassalsGameState, ClaimVassalsComponent]],
                      [
                        [
                          ChooseInitialObjectivesGameState,
                          ChooseInitialObjectivesComponent
                        ]
                      ]
                    )
                  )}
                </ListGroupItem>
              </ListGroup>
    );

    if (this.props.hudPart == "action") {
      return (
        <div
          key={`leaf-state-${this.props.ingame.entireGame.leafStateId}`}
          id="game-state-panel"
          className="hud-game-state"
        >
          {phaseAndState}
        </div>
      );
    }

    if (this.props.hudPart == "westeros") {
      return this.renderHudWesteros(
        phases.map((p) => ({ name: p.name, active: isPhaseActive(p) })),
        roundWarning,
        roundCritical,
        wildlingsWarning,
        wildlingsCritical,
        knowsWildlingCard,
        nextWildlingCard?.type
      );
    }

    if (this.props.hudPart == "status") {
      return this.renderHudStatus(
        roundWarning,
        roundCritical,
        wildlingsWarning,
        wildlingsCritical,
        knowsWildlingCard,
        nextWildlingCard?.type,
        phases.find((p) => isPhaseActive(p))?.name ?? null
      );
    }

    return (
      <div className="flex-ratio-container">
        <Card
          key={`leaf-state-${this.props.ingame.entireGame.leafStateId}`}
          id="game-state-panel"
          className="flex-sized-to-content mb-2"
          border={border}
          style={{
            maxHeight: "65%",
            paddingRight: "2px",
            borderWidth: "3px",
            overflowY: "scroll"
          }}
        >
          <Row className="no-space-around">
            <Col>{phaseAndState}</Col>
            <Col xs="auto" className="mx-1 px-0">
              <Col
                style={{ width: "28px", fontSize: "1.375rem" }}
                className="px-0 text-center"
              >
                <Row
                  className="mb-3 mx-0"
                  onMouseEnter={() => this.highlightRegionsOfHouses()}
                  onMouseLeave={() => this.highlightedRegions.clear()}
                >
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="round-tooltip">
                        <h5>
                          {t("ingame.roundOf", {
                            turn: this.game.turn,
                            max: this.game.maxTurns
                          })}
                        </h5>
                      </Tooltip>
                    }
                    placement="auto"
                  >
                    <div>
                      <img
                        className={classNames(
                          { "dye-warning": roundWarning },
                          { "dye-critical": roundCritical }
                        )}
                        src={hourglassImage}
                        width={28}
                      />
                      <div
                        style={{
                          color: roundWarning
                            ? "#F39C12"
                            : roundCritical
                              ? "#FF0000"
                              : undefined
                        }}
                      >
                        {this.game.turn}
                      </div>
                    </div>
                  </OverlayTrigger>
                </Row>
                <Row className="mr-0">
                  <div>
                    <OverlayTrigger
                      overlay={this.renderWildlingDeckPopover(
                        knowsWildlingCard,
                        nextWildlingCard?.type
                      )}
                      trigger="click"
                      placement="auto"
                      rootClose
                    >
                      <div
                        className={classNames(
                          "clickable btn btn-sm btn-secondary p-1",
                          { "weak-box-outline": knowsWildlingCard }
                        )}
                      >
                        <img
                          src={mammothImage}
                          width={28}
                          className={classNames(
                            { "dye-warning": wildlingsWarning },
                            { "dye-critical": wildlingsCritical }
                          )}
                        />
                      </div>
                    </OverlayTrigger>
                    <div
                      className={classNames({
                        "txt-warning": wildlingsWarning,
                        "txt-critical": wildlingsCritical
                      })}
                    >
                      {this.game.wildlingStrength}
                    </div>
                  </div>
                </Row>
                {this.game.dragonStrengthTokens.length > 0 && (
                  <Row
                    className="mx-0 mt-3"
                    onMouseEnter={() => this.highlightRegionsWithDragons()}
                    onMouseLeave={() => this.highlightedRegions.clear()}
                  >
                    <OverlayTrigger
                      overlay={this.renderDragonStrengthTooltip()}
                      placement="auto"
                    >
                      <div>
                        <img src={spikedDragonHeadImage} width={28} />
                        <div>{this.game.currentDragonStrength}</div>
                      </div>
                    </OverlayTrigger>
                  </Row>
                )}
              </Col>
            </Col>
          </Row>
          <ColumnSwapButton
            onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
              this.props.onColumnSwapClick(e)
            }
          />
          {isOwnTurn && (
            <Spinner
              animation="grow"
              variant="warning"
              size="sm"
              style={{ position: "absolute", bottom: "4px", left: "4px" }}
            />
          )}
        </Card>
        <GameTabsComponent
          gameClient={this.gameClient}
          ingame={this.ingame}
          mapControls={this.mapControls}
        />
      </div>
    );
  }

  // Barra compacta do canto superior esquerdo na tela nova.
  private renderHudStatus(
    roundWarning: boolean,
    roundCritical: boolean,
    wildlingsWarning: boolean,
    wildlingsCritical: boolean,
    knowsWildlingCard: boolean,
    nextWildlingCard: WildlingCardType | undefined,
    activePhaseName: string | null
  ): ReactNode {
    const wildlingPercent = Math.round(
      (this.game.wildlingStrength / MAX_WILDLING_STRENGTH) * 100
    );
    return (
      <div className="hud-panel hud-status" role="status">
        <OverlayTrigger
          overlay={
            <Tooltip id="hud-round-tooltip">
              {t("ingame.roundOf", {
                turn: this.game.turn,
                max: this.game.maxTurns
              })}
            </Tooltip>
          }
          placement="bottom"
        >
          <span className="hud-round">
            <img
              src={hourglassImage}
              width={20}
              className={classNames(
                { "dye-warning": roundWarning },
                { "dye-critical": roundCritical }
              )}
              alt=""
            />
            <span
              className={classNames({
                "txt-warning": roundWarning,
                "txt-critical": roundCritical
              })}
            >
              {t("hud.status.round", {
                turn: this.game.turn,
                max: this.game.maxTurns
              })}
            </span>
          </span>
        </OverlayTrigger>
        <span className="hud-divider" />
        <OverlayTrigger
          overlay={
            <Tooltip id="hud-house-colors-tooltip">
              {hudSettings.showHouseColors
                ? t("hud.status.houseColorsOff")
                : t("hud.status.houseColorsOn")}
            </Tooltip>
          }
          placement="bottom"
        >
          <button
            type="button"
            className={classNames("hud-text-button hud-toggle", {
              active: hudSettings.showHouseColors
            })}
            aria-pressed={hudSettings.showHouseColors}
            aria-label={t("hud.status.houseColors")}
            onClick={() => hudSettings.toggleHouseColors()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
              <path d="M9 4v14M15 6v14" />
            </svg>
            <span>{t("hud.status.houseColors")}</span>
          </button>
        </OverlayTrigger>
        {activePhaseName && (
          <>
            <span className="hud-divider" />
            <OverlayTrigger
              overlay={this.renderRemainingWesterosCards()}
              trigger="click"
              placement="bottom-start"
              rootClose
            >
              <button type="button" className="hud-text-button">
                <b className="hud-phase-full">{t("phase.label", { phase: activePhaseName })}</b>
                {/* celular: só o nome da fase, para caber */}
                <b className="hud-phase-short">{activePhaseName}</b>
                <span className="hud-caret" aria-hidden="true">▾</span>
              </button>
            </OverlayTrigger>
          </>
        )}
        <span className="hud-divider" />
        <OverlayTrigger
          overlay={this.renderWildlingDeckPopover(
            knowsWildlingCard,
            nextWildlingCard
          )}
          trigger="click"
          placement="bottom-start"
          rootClose
        >
          <button
            type="button"
            className={classNames("hud-text-button", {
              "weak-box-outline": knowsWildlingCard
            })}
            title={t("hud.status.wildlingsHint")}
          >
            <img
              src={mammothImage}
              width={20}
              alt=""
              className={classNames(
                { "dye-warning": wildlingsWarning },
                { "dye-critical": wildlingsCritical }
              )}
            />
            <span className="hud-meter" aria-hidden="true">
              <span
                className={classNames("hud-meter-fill", {
                  warning: wildlingsWarning,
                  critical: wildlingsCritical
                })}
                style={{ width: `${wildlingPercent}%` }}
              />
            </span>
            <b
              className={classNames({
                "txt-warning": wildlingsWarning,
                "txt-critical": wildlingsCritical
              })}
            >
              {this.game.wildlingStrength}
            </b>
          </button>
        </OverlayTrigger>
        {this.game.dragonStrengthTokens.length > 0 && (
          <>
            <span className="hud-divider" />
            <OverlayTrigger
              overlay={this.renderDragonStrengthTooltip()}
              placement="bottom"
            >
              <span
                className="hud-round"
                onMouseEnter={() => this.highlightRegionsWithDragons()}
                onMouseLeave={() => this.highlightedRegions.clear()}
              >
                <img src={spikedDragonHeadImage} width={20} alt="" />
                <b>{this.game.currentDragonStrength}</b>
              </span>
            </OverlayTrigger>
          </>
        )}
      </div>
    );
  }

  // Coluna "Westeros" da tela de duas colunas: rodada, fase e Selvagens
  // em blocos grandes, um embaixo do outro.
  private renderHudWesteros(
    phases: { name: string; active: boolean }[],
    roundWarning: boolean,
    roundCritical: boolean,
    wildlingsWarning: boolean,
    wildlingsCritical: boolean,
    knowsWildlingCard: boolean,
    nextWildlingCard: WildlingCardType | undefined
  ): ReactNode {
    const turn = this.game.turn;
    const max = this.game.maxTurns;
    const wildlingPercent = Math.round(
      (this.game.wildlingStrength / MAX_WILDLING_STRENGTH) * 100
    );
    const anyPhase = phases.some((p) => p.active);
    return (
      <div className="hud-west" role="status">
        <div className="hud-west-sec">
          <div className="hud-west-label">
            <img src={hourglassImage} width={14} height={14} alt="" />
            <span>{t("hud.west.round")}</span>
            <OverlayTrigger
              overlay={
                <Tooltip id="hud-west-colors-tooltip">
                  {hudSettings.showHouseColors
                    ? t("hud.status.houseColorsOff")
                    : t("hud.status.houseColorsOn")}
                </Tooltip>
              }
              placement="bottom"
            >
              <button
                type="button"
                className={classNames("hud-west-mini-button", {
                  active: hudSettings.showHouseColors
                })}
                aria-pressed={hudSettings.showHouseColors}
                aria-label={t("hud.status.houseColors")}
                onClick={() => hudSettings.toggleHouseColors()}
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
                  <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
                  <path d="M9 4v14M15 6v14" />
                </svg>
                <span>{t("hud.status.houseColors")}</span>
              </button>
            </OverlayTrigger>
          </div>
          <OverlayTrigger
            overlay={
              <Tooltip id="hud-west-round-tooltip">
                {t("ingame.roundOf", { turn, max })}
              </Tooltip>
            }
            placement="right"
          >
            <div className="hud-west-round">
              <b
                className={classNames({
                  "txt-warning": roundWarning,
                  "txt-critical": roundCritical
                })}
              >
                {turn}
              </b>
              <span>{t("hud.west.ofMax", { max })}</span>
            </div>
          </OverlayTrigger>
          <div className="hud-west-segments" aria-hidden="true">
            {_.range(max).map((i) => (
              <span
                key={`hud-west-seg-${i}`}
                className={classNames({
                  done: i < turn - 1,
                  current: i == turn - 1
                })}
              />
            ))}
          </div>
        </div>

        {anyPhase && (
          <div className="hud-west-sec">
            <div className="hud-west-label">
              <span>{t("hud.west.phase")}</span>
            </div>
            <OverlayTrigger
              overlay={this.renderRemainingWesterosCards()}
              trigger="click"
              placement="right-start"
              rootClose
            >
              <button
                type="button"
                className="hud-west-phases"
                title={t("hud.west.phaseHint")}
              >
                {phases.map((p) => (
                  <span
                    key={`hud-west-phase-${p.name}`}
                    className={classNames({ active: p.active })}
                  >
                    {p.name}
                  </span>
                ))}
              </button>
            </OverlayTrigger>
          </div>
        )}

        <OverlayTrigger
          overlay={this.renderWildlingDeckPopover(
            knowsWildlingCard,
            nextWildlingCard
          )}
          trigger="click"
          placement="right-start"
          rootClose
        >
          <button
            type="button"
            className={classNames("hud-west-sec hud-west-wildlings", {
              "weak-box-outline": knowsWildlingCard
            })}
            title={t("hud.status.wildlingsHint")}
          >
            <span className="hud-west-label">
              <img
                src={mammothImage}
                width={16}
                height={16}
                alt=""
                className={classNames(
                  { "dye-warning": wildlingsWarning },
                  { "dye-critical": wildlingsCritical }
                )}
              />
              <span>{t("hud.west.wildlings")}</span>
              <b
                className={classNames("hud-west-count", {
                  "txt-warning": wildlingsWarning,
                  "txt-critical": wildlingsCritical
                })}
              >
                {this.game.wildlingStrength} / {MAX_WILDLING_STRENGTH}
              </b>
            </span>
            <span className="hud-meter wide" aria-hidden="true">
              <span
                className={classNames("hud-meter-fill", {
                  warning: wildlingsWarning,
                  critical: wildlingsCritical
                })}
                style={{ width: `${wildlingPercent}%` }}
              />
            </span>
            <small className="hud-west-note">
              {t("hud.west.wildlingsNote", { max: MAX_WILDLING_STRENGTH })}
            </small>
          </button>
        </OverlayTrigger>

        {this.game.dragonStrengthTokens.length > 0 && (
          <OverlayTrigger
            overlay={this.renderDragonStrengthTooltip()}
            placement="right"
          >
            <div
              className="hud-west-sec hud-west-dragons"
              onMouseEnter={() => this.highlightRegionsWithDragons()}
              onMouseLeave={() => this.highlightedRegions.clear()}
            >
              <span className="hud-west-label">
                <img src={spikedDragonHeadImage} width={16} height={16} alt="" />
                <span>{t("hud.west.dragons")}</span>
                <b className="hud-west-count">
                  {this.game.currentDragonStrength}
                </b>
              </span>
            </div>
          </OverlayTrigger>
        )}
      </div>
    );
  }

  private renderRemainingWesterosCards(): OverlayChildren {
    const remainingCards = this.game.remainingWesterosCardTypes.map((deck) =>
      _.sortBy(
        deck.entries,
        (rwct) => -rwct[1],
        (rwct) => rwct[0].name
      )
    );
    const nextCards = this.game.nextWesterosCardTypes;

    return (
      <Popover id={"remaining-westeros-cards"} style={{ maxWidth: "100%" }}>
        <Col xs={12}>
          {this.gameSettings.cokWesterosPhase && (
            <>
              <Row className="mt-0">
                <Col>
                  <h5 className="text-center">{t("westeros.nextCards")}</h5>
                </Col>
              </Row>
              <Row>
                {nextCards.map((_, i) => (
                  <Col
                    key={"westeros-deck-" + i + "-header"}
                    className="text-center"
                  >
                    <b>{t("westeros.deckN", { n: i + 1 })}</b>
                  </Col>
                ))}
              </Row>
              <Row>
                {nextCards.map((wd, i) => (
                  <Col key={"westeros-deck-" + i + "-data"}>
                    {wd.map((wc, j) =>
                      wc ? (
                        <div
                          key={"westeros-deck-" + i + "-" + j + "-data"}
                          className="mb-1"
                        >
                          <WesterosCardComponent
                            cardType={wc}
                            westerosDeckI={i}
                            size="small"
                            tooltip
                            showTitle
                          />
                        </div>
                      ) : (
                        <div />
                      )
                    )}
                  </Col>
                ))}
              </Row>
            </>
          )}
          <Row className={this.gameSettings.cokWesterosPhase ? "mt-4" : "mt-0"}>
            <Col>
              <h5 className="text-center">{t("westeros.remainingCards")}</h5>
            </Col>
          </Row>
          <Row>
            {remainingCards.map((_, i) => (
              <Col
                key={"westeros-deck-" + i + "-header"}
                className="text-center"
              >
                <b>{t("westeros.deckN", { n: i + 1 })}</b>
              </Col>
            ))}
          </Row>
          <Row className="mb-2">
            {remainingCards.map((rc, i) => (
              <Col key={"westeros-deck-" + i + "-data"}>
                {rc.map(([wc, count], j) => (
                  <Row
                    key={"westeros-deck-" + i + "-" + j + "-data"}
                    className="m1 align-items-center"
                  >
                    <Col xs="auto" style={{ marginRight: "-20px" }}>
                      {count > 1 ? count : <>&nbsp;</>}
                    </Col>
                    <Col
                      className="pl-0"
                      style={{ width: "150px", maxWidth: "150px" }}
                    >
                      <WesterosCardComponent
                        cardType={wc}
                        westerosDeckI={i}
                        size="small"
                        tooltip
                        showTitle
                      />
                    </Col>
                  </Row>
                ))}
              </Col>
            ))}
          </Row>
        </Col>
      </Popover>
    );
  }

  private renderWildlingDeckPopover(
    knowsWildlingCard: boolean,
    nextWildlingCard: WildlingCardType | undefined
  ): OverlayChildren {
    const wildlingDeck = _.sortBy(
      this.game.wildlingDeck
        .map((wc) => wc.type)
        .filter((wc) => wc != nextWildlingCard),
      (wc) => wc.name
    );
    return (
      <Popover id="wildling-threat-tooltip">
        <Col xs={12}>
          {knowsWildlingCard && nextWildlingCard && (
            <>
              <Col xs={12} className="mt-0">
                <h5 className="text-center">{t("wildlings.topCard")}</h5>
              </Col>
              <Col xs={12} className="mb-2">
                <Row className="justify-content-center">
                  <WildlingCardComponent
                    cardType={nextWildlingCard}
                    size="smedium"
                    tooltip
                  />
                </Row>
              </Col>
            </>
          )}
          <Col xs={12} className="mt-0">
            <h5 className="text-center">{t("wildlings.deck")}</h5>
          </Col>
          <Col xs={12}>
            <Row className="justify-content-center mr-0 ml-0">
              {wildlingDeck.map((wc) => (
                <Col
                  xs="auto"
                  key={`wild-deck-${wc.id}`}
                  className="justify-content-center"
                >
                  <WildlingCardComponent cardType={wc} size="small" tooltip />
                </Col>
              ))}
            </Row>
          </Col>
        </Col>
      </Popover>
    );
  }

  highlightRegionsOfHouses(): void {
    this.highlightedRegions.clear();
    this.houseColorHighlights().forEach(([r, props]) =>
      this.highlightedRegions.set(r, props)
    );
  }

  // Cada área pintada com a cor da Casa que a controla.
  private houseColorHighlights(): [Region, RegionOnMapProperties][] {
    const regionsWithControllers = new BetterMap(
      this.props.gameClient.allRegionsWithControllers
    );

    if (this.props.ingame.fogOfWar) {
      regionsWithControllers.keys.forEach((r) => {
        if (!this.props.gameClient.visibleRegionsSet?.has(r)) {
          regionsWithControllers.delete(r);
        }
      });
    }

    return regionsWithControllers.entries.map(
      ([r, controller]) =>
        [
          r,
          {
            highlight: {
              active: controller != null ? true : false,
              color: controller?.getHighlightColor() ?? "#ffffff",
              light: r.type.id == "sea",
              strong: r.type.id == "land"
            }
          }
        ] as [Region, RegionOnMapProperties]
    );
  }

  highlightRegionsWithDragons(): void {
    const regions = this.ingame.world.regions.values.filter(
      (r) =>
        r.units.size > 0 && r.units.values.some((u) => u.type.id == "dragon")
    );
    const map = new BetterMap(regions.map((r) => [r, r.getController()]));
    this.highlightedRegions.clear();

    map.entries.forEach(([r, controller]) => {
      this.highlightedRegions.set(r, {
        highlight: {
          active: controller != null ? true : false,
          color: controller?.getHighlightColor() ?? "#ffffff",
          light: r.type.id == "sea",
          strong: r.type.id == "land"
        }
      });
    });
  }

  renderDragonStrengthTooltip(): OverlayChildren {
    const roundsWhenIncreased = this.game.dragonStrengthTokens.filter(
      (onRound) => onRound > this.game.turn
    );
    return (
      <Tooltip id="dragon-strength-tooltip">
        <div className="m-1 text-center">
          <h5>{t("dragons.currentStrength")}</h5>
          {roundsWhenIncreased.length > 0 && (
            <p>
              {t("dragons.willIncreaseInRound")}
              <br />
              {joinNaturalLanguage(roundsWhenIncreased)}
            </p>
          )}
        </div>
      </Tooltip>
    );
  }

  modifyRegionsOnMap(): [Region, PartialRecursive<RegionOnMapProperties>][] {
    // Tela nova: botão "Cores das Casas" ligado pinta o mapa o tempo todo
    // (calculado na hora, então acompanha as marchas).
    if (
      (this.props.hudPart == "status" || this.props.hudPart == "westeros") &&
      hudSettings.showHouseColors &&
      this.highlightedRegions.size == 0
    ) {
      return this.houseColorHighlights();
    }
    return this.highlightedRegions.entries;
  }

  componentDidMount(): void {
    this.mapControls.modifyRegionsOnMap.push(
      (this.modifyRegionsOnMapCallback = () => this.modifyRegionsOnMap())
    );
  }

  componentWillUnmount(): void {
    _.pull(
      this.mapControls.modifyRegionsOnMap,
      this.modifyRegionsOnMapCallback
    );
  }
}
