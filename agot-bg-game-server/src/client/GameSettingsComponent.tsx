import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import * as React from "react";
import FormCheck from "react-bootstrap/FormCheck";
import GameClient from "./GameClient";
import { GameSettings, HouseCardDecks } from "../common/GameSettings";
import EntireGame from "../common/EntireGame";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import LobbyGameState from "../common/lobby-game-state/LobbyGameState";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  allGameSetups,
  getGameSetupContainer
} from "../common/ingame-game-state/game-data-structure/createGame";
import IngameGameState from "../common/ingame-game-state/IngameGameState";
import { isMobile } from "react-device-detect";
import { t, tr } from "./i18n/i18n";
import {
  getSetupName,
  getSetupShortName,
  renderSetupTooltip
} from "./i18n/setupNames";

interface GameSettingsComponentProps {
  gameClient: GameClient;
  entireGame: EntireGame;
}

@observer
export default class GameSettingsComponent extends Component<GameSettingsComponentProps> {
  get entireGame(): EntireGame {
    return this.props.entireGame;
  }

  get gameSettings(): GameSettings {
    return this.entireGame.gameSettings;
  }

  get canChangeGameSettings(): boolean {
    if (this.entireGame.lobbyGameState) {
      return this.props.gameClient.isRealOwner();
    } else if (this.entireGame.ingameGameState) {
      return this.props.gameClient.canActAsOwner();
    }
    return false;
  }

  get selectedGameSetupName(): string {
    const setupId = this.props.entireGame.gameSettings.setupId;
    return getSetupShortName(setupId, allGameSetups.get(setupId).name);
  }

  render(): ReactNode {
    const isIngame =
      this.props.entireGame.childGameState instanceof IngameGameState;
    return (
      <Col id="game-settings-container" xs={12} className="mt-2">
        <Row id="live-pbem-row" className="justify-content-center mb-2">
          {isIngame && (
            <Col xs={12} className="text-center mb-2">
              {this.selectedGameSetupName}
            </Col>
          )}
          <Row className="justify-content-center">
            <Col xs={12} className="d-flex align-items-center">
              {isIngame && this.props.entireGame.gameSettings.onlyLive ? (
                <></>
              ) : (
                <OverlayTrigger
                  overlay={
                    <Tooltip id="pbem-tooltip">
                      {tr("settings.mode.tooltip")}
                    </Tooltip>
                  }
                >
                  <select
                    id="pbem-setting"
                    name="pbem"
                    value={this.gameSettings.pbem ? "PBEM" : "Live"}
                    onChange={(e) =>
                      this.changeGameSettings(
                        () =>
                          (this.gameSettings.pbem = e.target.value == "PBEM")
                      )
                    }
                  >
                    <option key="Live" value="Live">
                      {t("settings.live.label")}
                    </option>
                    <option key="PBEM" value="PBEM">
                      {t("settings.pbem.label")}
                    </option>
                  </select>
                </OverlayTrigger>
              )}
              {this.gameSettings.pbem && !isIngame && (
                <FormCheck
                  id="start-when-full-setting"
                  className="mx-3 mt-2"
                  type="switch"
                  label={
                    <OverlayTrigger
                      overlay={
                        <Tooltip id="start-when-full-setting-tooltip">
                          {tr("settings.startWhenFull.tooltip")}
                        </Tooltip>
                      }
                    >
                      <label htmlFor="start-when-full-setting">
                        {tr("settings.startWhenFull.label")}
                      </label>
                    </OverlayTrigger>
                  }
                  checked={this.gameSettings.startWhenFull}
                  onChange={() =>
                    this.changeGameSettings(
                      () =>
                        (this.gameSettings.startWhenFull =
                          !this.gameSettings.startWhenFull)
                    )
                  }
                />
              )}
              {!this.gameSettings.pbem && !isIngame && (
                <FormCheck
                  id="only-live-setting"
                  className="mx-3 mt-2"
                  type="switch"
                  label={
                    <OverlayTrigger
                      overlay={
                        <Tooltip
                          id="only-live-setting-tooltip"
                          className="tooltip-w-100"
                        >
                          {tr("settings.gameClock.tooltip")}
                        </Tooltip>
                      }
                    >
                      <label htmlFor="only-live-setting">
                        {tr("settings.gameClock.label")}
                      </label>
                    </OverlayTrigger>
                  }
                  checked={this.gameSettings.onlyLive}
                  onChange={() =>
                    this.changeGameSettings(
                      () =>
                        (this.gameSettings.onlyLive =
                          !this.gameSettings.onlyLive)
                    )
                  }
                />
              )}
              {this.gameSettings.onlyLive && !isIngame && (
                <div>
                  <select
                    id="initial-live-clock"
                    value={this.gameSettings.initialLiveClock}
                    onChange={(e) =>
                      this.onInitialLiveClockChange(e.target.value)
                    }
                  >
                    <option key="30" value={30}>
                      30
                    </option>
                    <option key="45" value={45}>
                      45
                    </option>
                    <option key="60" value={60}>
                      60
                    </option>
                    <option key="75" value={75}>
                      75
                    </option>
                    <option key="90" value={90}>
                      90
                    </option>
                    <option key="120" value={120}>
                      120
                    </option>
                  </select>
                  &nbsp;{t("settings.gameClock.minutes")}
                </div>
              )}
              {this.gameSettings.onlyLive && !isIngame && (
                <FormCheck
                  id="fixed-clock-setting"
                  className="mx-3 mt-2"
                  type="switch"
                  label={
                    <OverlayTrigger
                      overlay={
                        <Tooltip id="fixed-clock-setting-tooltip">
                          {tr("settings.fixedClock.tooltip")}
                        </Tooltip>
                      }
                    >
                      <label htmlFor="fixed-clock-setting">
                        {tr("settings.fixedClock.label")}
                      </label>
                    </OverlayTrigger>
                  }
                  checked={this.gameSettings.fixedClock}
                  onChange={() =>
                    this.changeGameSettings(
                      () =>
                        (this.gameSettings.fixedClock =
                          !this.gameSettings.fixedClock)
                    )
                  }
                />
              )}
              {!isIngame && (
                <FormCheck
                  id="private-game-setting"
                  className="mx-3 mt-2"
                  type="switch"
                  label={
                    <OverlayTrigger
                      overlay={
                        <Tooltip id="private-game-setting-tooltip">
                          {tr("settings.private.tooltip")}
                        </Tooltip>
                      }
                    >
                      <label htmlFor="private-game-setting">
                        {tr("settings.private.label")}
                      </label>
                    </OverlayTrigger>
                  }
                  checked={this.gameSettings.private}
                  onChange={() =>
                    this.changeGameSettings(
                      () =>
                        (this.gameSettings.private = !this.gameSettings.private)
                    )
                  }
                />
              )}
            </Col>
          </Row>
        </Row>
        {this.props.entireGame.childGameState instanceof LobbyGameState &&
          this.renderLobbySettings()}
      </Col>
    );
  }

  renderGameSetupsTooltipContent(): ReactNode {
    return renderSetupTooltip(this.gameSettings.setupId);
  }

  renderLobbySettings(): ReactNode {
    return (
      <Row className="mt-2 justify-content-center">
        <Col xs="auto" id="base-settings-col" className="no-gutters">
          <OverlayTrigger
            overlay={
              <Tooltip id="game-setups-tooltip" className="tooltip-w-100">
                {this.renderGameSetupsTooltipContent()}
              </Tooltip>
            }
            placement="top"
            delay={{ show: 250, hide: 750 }}
          >
            <Col xs="12">
              <select
                className="custom-select"
                id="game-setups"
                name="setups"
                value={this.gameSettings.setupId}
                onChange={(e) => this.onSetupChange(e.target.value)}
                style={{ marginBottom: "8px" }}
              >
                {this.createSetupItems()}
              </select>
            </Col>
          </OverlayTrigger>
          <Col xs="auto" className="d-flex justify-content-between">
            <div className="mr-2">
              <select
                id="player-count"
                name="playerCount"
                value={this.gameSettings.playerCount}
                onChange={(e) => this.onPlayerCountChange(e.target.value)}
                style={{ marginBottom: "8px" }}
              >
                {this.createPlayerCountItems()}
              </select>
              &nbsp;{t("settings.players")}
            </div>
            <OverlayTrigger
              overlay={
                <Tooltip id="vp-count-setting-tooltip">
                  {t("settings.vps.tooltip")}
                </Tooltip>
              }
            >
              <div>
                <select
                  id="vp-count-setting"
                  value={this.gameSettings.victoryPointsCountNeededToWin}
                  onChange={(e) => this.onVpCountChange(e.target.value)}
                  style={{ marginBottom: "8px" }}
                >
                  <option key="6" value={6}>
                    6
                  </option>
                  <option key="7" value={7}>
                    7
                  </option>
                  <option key="8" value={8}>
                    8
                  </option>
                  <option key="9" value={9}>
                    9
                  </option>
                  <option key="10" value={10}>
                    10
                  </option>
                  <option key="11" value={11}>
                    11
                  </option>
                  <option key="12" value={12}>
                    12
                  </option>
                  <option key="13" value={13}>
                    13
                  </option>
                  <option key="14" value={14}>
                    14
                  </option>
                  <option key="15" value={15}>
                    15
                  </option>
                </select>
                &nbsp;{t("settings.vps")}
              </div>
            </OverlayTrigger>
            {this.props.entireGame.gameSettings.playerCount >= 8 && (
              <OverlayTrigger
                overlay={
                  <Tooltip id="lt-count-setting-tooltip">
                    {t("settings.lts.tooltip")}
                  </Tooltip>
                }
              >
                <div>
                  <select
                    id="lt-count-setting"
                    value={this.gameSettings.loyaltyTokenCountNeededToWin}
                    onChange={(e) => this.onLtCountChange(e.target.value)}
                    style={{ marginBottom: "8px" }}
                  >
                    <option key="6" value={6}>
                      6
                    </option>
                    <option key="7" value={7}>
                      7
                    </option>
                    <option key="8" value={8}>
                      8
                    </option>
                    <option key="9" value={9}>
                      9
                    </option>
                    <option key="10" value={10}>
                      10
                    </option>
                    <option key="11" value={11}>
                      11
                    </option>
                    <option key="12" value={12}>
                      12
                    </option>
                    <option key="13" value={13}>
                      13
                    </option>
                    <option key="14" value={14}>
                      14
                    </option>
                    <option key="15" value={15}>
                      15
                    </option>
                  </select>
                  &nbsp;{t("settings.lts")}
                </div>
              </OverlayTrigger>
            )}
          </Col>
          {this.props.entireGame.isFeastForCrows && (
            <Col xs="12">
              <FormCheck
                id="add-port-to-the-eyrie-setting"
                type="switch"
                label={
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="add-port-to-the-eyrie-setting-tooltip">
                        {tr("settings.eyriePort.tooltip")}
                      </Tooltip>
                    }
                  >
                    <label htmlFor="add-port-to-the-eyrie-setting">
                      {tr("settings.eyriePort.label")}
                    </label>
                  </OverlayTrigger>
                }
                checked={this.gameSettings.addPortToTheEyrie}
                onChange={() =>
                  this.changeGameSettings(
                    () =>
                      (this.gameSettings.addPortToTheEyrie =
                        !this.gameSettings.addPortToTheEyrie)
                  )
                }
              />
            </Col>
          )}
          <Col xs="12">
            <FormCheck
              id="adwd-house-cards"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="adwd-house-cards-tooltip">
                      {tr("settings.adwdCards.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="adwd-house-cards">
                    {tr("settings.adwdCards.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.adwdHouseCards}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.adwdHouseCards =
                      !this.gameSettings.adwdHouseCards)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="asos-house-cards-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="asos-house-cards-setting-tooltip">
                      {tr("settings.asosCards.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="asos-house-cards-setting">
                    {tr("settings.asosCards.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.asosHouseCards}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.asosHouseCards =
                      !this.gameSettings.asosHouseCards)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="first-edition-house-cards-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="first-edition-house-cards-setting-tooltip">
                      {tr("settings.firstEditionCards.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="first-edition-house-cards-setting">
                    {tr("settings.firstEditionCards.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.firstEditionHouseCards}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.firstEditionHouseCards =
                      !this.gameSettings.firstEditionHouseCards)
                )
              }
            />
          </Col>
          <Col xs="auto" className="d-flex justify-content-between">
            <FormCheck
              id="decks-evolution-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="decks-evolution-setting-tooltip">
                      {tr("settings.cardsEvolution.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="decks-evolution-setting">
                    {tr("settings.cardsEvolution.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.houseCardsEvolution}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.houseCardsEvolution =
                      !this.gameSettings.houseCardsEvolution)
                )
              }
            />
            {this.gameSettings.houseCardsEvolution && (
              <div>
                <span className="ml-1">
                  {t("settings.cardsEvolution.round")}
                </span>
                <select
                  id="decks-evolution-setting-round"
                  className="ml-2"
                  value={this.gameSettings.houseCardsEvolutionRound}
                  onChange={(e) =>
                    this.onHouseCardsEvolutionRoundChange(e.target.value)
                  }
                  style={{ marginBottom: "8px" }}
                >
                  <option key="2" value={2}>
                    2
                  </option>
                  <option key="3" value={3}>
                    3
                  </option>
                  <option key="4" value={4}>
                    4
                  </option>
                  <option key="5" value={5}>
                    5
                  </option>
                  <option key="6" value={6}>
                    6
                  </option>
                  <option key="7" value={7}>
                    7
                  </option>
                  <option key="8" value={8}>
                    8
                  </option>
                  <option key="9" value={9}>
                    9
                  </option>
                  <option key="10" value={10}>
                    10
                  </option>
                </select>
              </div>
            )}
          </Col>
          {this.props.entireGame.isCustomBalancingOptionAvailable(
            this.gameSettings
          ) && (
            <Col xs="12">
              <FormCheck
                id="custom-balancing-setting"
                type="switch"
                label={
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="custom-balancing-tooltip">
                        {this.props.entireGame.isMotherOfDragons ? (
                          <>
                            {t("settings.customBalancing.modTooltip")}
                            <br />
                            <a
                              href="https://www.boardgamedungeon.net/threads/my-balance-proposition-for-a-game-of-thrones-mother-of-dragons-expansion-targaryen.11/"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t("settings.customBalancing.modLink")}
                            </a>
                            .
                          </>
                        ) : (
                          <>{t("settings.customBalancing.tooltip")}</>
                        )}
                      </Tooltip>
                    }
                    delay={{ show: 0, hide: 1500 }}
                    placement={isMobile ? "auto" : "bottom"}
                  >
                    <label htmlFor="custom-balancing-setting">
                      {tr("settings.customBalancing.label")}
                    </label>
                  </OverlayTrigger>
                }
                checked={this.gameSettings.customBalancing}
                onChange={() =>
                  this.changeGameSettings(
                    () =>
                      (this.gameSettings.customBalancing =
                        !this.gameSettings.customBalancing)
                  )
                }
              />
            </Col>
          )}
        </Col>
        <Col xs="6" lg="auto" id="mod-settings-col" className="no-gutters">
          <Col xs="12">
            <FormCheck
              id="vassals-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="vassals-tooltip">
                      {tr("settings.vassals.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="vassals-setting">
                    {tr("settings.vassals.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.vassals}
              onChange={() =>
                this.changeGameSettings(
                  () => (this.gameSettings.vassals = !this.gameSettings.vassals)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="iron-bank-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="iron-bank-setting-tooltip">
                      {tr("settings.ironBank.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="iron-bank-setting">
                    {tr("settings.ironBank.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.ironBank}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.ironBank = !this.gameSettings.ironBank)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="sea-orders-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="sea-orders-tooltip">
                      {tr("settings.seaOrders.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="sea-orders-setting">
                    {tr("settings.seaOrders.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.seaOrderTokens}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.seaOrderTokens =
                      !this.gameSettings.seaOrderTokens)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="gift-power-tokens-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="gift-power-tokens-tooltip">
                      {tr("settings.giftPowerTokens.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="gift-power-tokens-setting">
                    {tr("settings.giftPowerTokens.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.allowGiftingPowerTokens}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.allowGiftingPowerTokens =
                      !this.gameSettings.allowGiftingPowerTokens)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="random-vassal-assignment-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="random-vassal-assignment-tooltip">
                      {tr("settings.randomVassalAssignment.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="random-vassal-assignment-setting">
                    {tr("settings.randomVassalAssignment.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.randomVassalAssignment}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.randomVassalAssignment =
                      !this.gameSettings.randomVassalAssignment)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="dragon-war-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="dragon-war-tooltip">
                      {tr("settings.dragonWar.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="dragon-war-setting">
                    {tr("settings.dragonWar.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.dragonWar}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.dragonWar = !this.gameSettings.dragonWar)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="dragon-revenge-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="dragon-revenge-tooltip">
                      {tr("settings.dragonRevenge.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="dragon-revenge-setting">
                    {tr("settings.dragonRevenge.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.dragonRevenge}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.dragonRevenge =
                      !this.gameSettings.dragonRevenge)
                )
              }
            />
          </Col>
        </Col>
        <Col
          xs="6"
          lg="auto"
          id="extended-base-settings-col"
          className="no-gutters"
        >
          <Col xs="12">
            <FormCheck
              id="random-houses-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="random-houses-tooltip">
                      {tr("settings.randomHouses.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="random-houses-setting">
                    {tr("settings.randomHouses.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.randomHouses}
              onChange={() => this.onRandomHousesChange()}
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="random-chosen-houses-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="random-chosen-houses-tooltip">
                      {tr("settings.randomChosenHouses.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="random-chosen-houses-setting">
                    {tr("settings.randomChosenHouses.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.randomChosenHouses}
              onChange={() => this.onRandomChosenHousesChange()}
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="tides-of-battle-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="tides-of-battle-tooltip">
                      {tr("settings.tidesOfBattle.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="tides-of-battle-setting">
                    {tr("settings.tidesOfBattle.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.tidesOfBattle}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.tidesOfBattle =
                      !this.gameSettings.tidesOfBattle)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="remove-tob3-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="remove-tob3-setting-tooltip">
                      {tr("settings.removeTob3.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="remove-tob3-setting">
                    {tr("settings.removeTob3.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.removeTob3}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.removeTob3 =
                      !this.gameSettings.removeTob3)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="remove-tob-skulls-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="remove-tob-skulls-setting-tooltip">
                      {tr("settings.removeTobSkulls.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="remove-tob-skulls-setting">
                    {tr("settings.removeTobSkulls.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.removeTobSkulls}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.removeTobSkulls =
                      !this.gameSettings.removeTobSkulls)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="limit-tob2-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="limit-tob2-setting-tooltip">
                      {tr("settings.limitTob2.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="limit-tob2-setting">
                    {tr("settings.limitTob2.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.limitTob2}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.limitTob2 = !this.gameSettings.limitTob2)
                )
              }
            />
          </Col>
        </Col>
        <Col xs="6" lg="auto" id="custom-settings-col" className="no-gutters">
          <Col xs="12">
            <FormCheck
              id="mixed-wd1-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="mixed-wd1-setting-tooltip">
                      {tr("settings.mixedWd1.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="mixed-wd1-setting">
                    {tr("settings.mixedWd1.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.mixedWesterosDeck1}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.mixedWesterosDeck1 =
                      !this.gameSettings.mixedWesterosDeck1)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="westeros-phase-variant-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="westeros-phase-variant-tooltip">
                      {tr("settings.cokWesterosPhase.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="westeros-phase-variant-setting">
                    {tr("settings.cokWesterosPhase.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.cokWesterosPhase}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.cokWesterosPhase =
                      !this.gameSettings.cokWesterosPhase)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="endless-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="endless-setting-tooltip">
                      {tr("settings.endless.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="endless-setting">
                    {tr("settings.endless.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.endless}
              onChange={() =>
                this.changeGameSettings(
                  () => (this.gameSettings.endless = !this.gameSettings.endless)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="faceless-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="faceless-setting-tooltip">
                      {tr("settings.faceless.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="faceless-setting">
                    {tr("settings.faceless.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.faceless}
              onChange={() => {
                if (this.gameSettings.faceless) {
                  return;
                }

                if (!window.confirm(t("settings.faceless.confirm"))) {
                  return;
                }

                this.changeGameSettings(
                  () =>
                    (this.gameSettings.faceless = !this.gameSettings.faceless)
                );
              }}
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="fog-of-war-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="fog-of-war-setting-tooltip">
                      {tr("settings.fogOfWar.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="fog-of-war-setting">
                    {tr("settings.fogOfWar.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.fogOfWar}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.fogOfWar = !this.gameSettings.fogOfWar)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="no-private-chats-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="no-private-chats-setting-tooltip">
                      {tr("settings.noPrivateChats.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="no-private-chats-setting">
                    {tr("settings.noPrivateChats.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.noPrivateChats}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.noPrivateChats =
                      !this.gameSettings.noPrivateChats)
                )
              }
            />
          </Col>
        </Col>
        <Col xs="6" lg="auto" id="custom-settings-2-col" className="no-gutters">
          <Col xs="12">
            <FormCheck
              id="preceding-mustering-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="preceding-mustering-tooltip">
                      {tr("settings.precedingMustering.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="preceding-mustering-setting">
                    {tr("settings.precedingMustering.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.precedingMustering}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.precedingMustering =
                      !this.gameSettings.precedingMustering)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="random-start-positions-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="random-start-positions-setting-tooltip">
                      {tr("settings.randomStartPositions.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="random-start-positions-setting">
                    {tr("settings.randomStartPositions.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.randomStartPositions}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.randomStartPositions =
                      !this.gameSettings.randomStartPositions)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="use-vassal-positions-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="use-vassal-positions-tooltip">
                      {tr("settings.vassalPositions.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="use-vassal-positions-setting">
                    {tr("settings.vassalPositions.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.useVassalPositions}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.useVassalPositions =
                      !this.gameSettings.useVassalPositions)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="hold-vps-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="hold-vps-setting-tooltip">
                      {tr("settings.holdVps.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="hold-vps-setting">
                    {tr("settings.holdVps.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.holdVictoryPointsUntilEndOfRound}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.holdVictoryPointsUntilEndOfRound =
                      !this.gameSettings.holdVictoryPointsUntilEndOfRound)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="tournament-mode-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="tournament-mode-tooltip">
                      {tr("settings.tournamentMode.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="tournament-mode-setting">
                    {tr("settings.tournamentMode.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.tournamentMode}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.tournamentMode =
                      !this.gameSettings.tournamentMode)
                )
              }
            />
          </Col>
        </Col>
        <Col xs="6" lg="auto" id="draft-settings-col" className="no-gutters">
          <Col xs="12">
            <FormCheck
              id="draft-house-cards-settings"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="draft-house-cards-tooltip">
                      {tr("settings.draftHouseCards.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="draft-house-cards-settings">
                    {tr("settings.draftHouseCards.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.draftHouseCards}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.draftHouseCards =
                      !this.gameSettings.draftHouseCards)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="thematic-draft-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="thematic-draft-tooltip">
                      {tr("settings.thematicDraft.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="thematic-draft-setting">
                    {tr("settings.thematicDraft.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.thematicDraft}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.thematicDraft =
                      !this.gameSettings.thematicDraft)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="selected-random-draft-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="selected-random-draft-tooltip">
                      {tr("settings.selectedRandomDraft.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="selected-random-draft-setting">
                    {tr("settings.selectedRandomDraft.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.selectedRandomDraft}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.selectedRandomDraft =
                      !this.gameSettings.selectedRandomDraft)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="random-draft-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="random-draft-tooltip">
                      {tr("settings.randomDraft.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="random-draft-setting">
                    {tr("settings.randomDraft.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.randomDraft}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.randomDraft =
                      !this.gameSettings.randomDraft)
                )
              }
            />
          </Col>
          <Col xs="12">
            <FormCheck
              id="draft-map-setting"
              type="switch"
              label={
                <OverlayTrigger
                  overlay={
                    <Tooltip id="draft-map-tooltip">
                      {tr("settings.draftMap.tooltip")}
                    </Tooltip>
                  }
                >
                  <label htmlFor="draft-map-setting">
                    {tr("settings.draftMap.label")}
                  </label>
                </OverlayTrigger>
              }
              checked={this.gameSettings.draftMap}
              onChange={() =>
                this.changeGameSettings(
                  () =>
                    (this.gameSettings.draftMap = !this.gameSettings.draftMap)
                )
              }
            />
          </Col>
        </Col>
        {this.gameSettings.draftHouseCards && (
          <Col
            xs="6"
            lg="auto"
            id="draft-decks-settings-col"
            className="no-gutters"
          >
            <Col xs="12">
              <FormCheck
                id="draft-tracks-settings"
                type="switch"
                label={
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="draft-tracks-tooltip">
                        {tr("settings.draftTracks.tooltip")}
                      </Tooltip>
                    }
                  >
                    <label htmlFor="draft-tracks-settings">
                      {tr("settings.draftTracks.label")}
                    </label>
                  </OverlayTrigger>
                }
                checked={this.gameSettings.draftTracks}
                onChange={() =>
                  this.changeGameSettings(
                    () =>
                      (this.gameSettings.draftTracks =
                        !this.gameSettings.draftTracks)
                  )
                }
              />
            </Col>
            <Col xs="12">
              <FormCheck
                id="limited-draft-setting"
                type="switch"
                label={
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="limited-draft-tooltip">
                        {tr("settings.limitedDraft.tooltip")}
                      </Tooltip>
                    }
                  >
                    <label htmlFor="limited-draft-setting">
                      {tr("settings.limitedDraft.label")}
                    </label>
                  </OverlayTrigger>
                }
                checked={this.gameSettings.limitedDraft}
                onChange={() =>
                  this.changeGameSettings(
                    () =>
                      (this.gameSettings.limitedDraft =
                        !this.gameSettings.limitedDraft)
                  )
                }
              />
            </Col>
            {this.gameSettings.randomDraft && (
              <>
                <Col xs="12">
                  <FormCheck
                    id="blind-draft-setting"
                    type="switch"
                    label={
                      <OverlayTrigger
                        overlay={
                          <Tooltip id="blind-draft-tooltip">
                            {tr("settings.blindDraft.tooltip")}
                          </Tooltip>
                        }
                      >
                        <label htmlFor="blind-draft-setting">
                          {tr("settings.blindDraft.label")}
                        </label>
                      </OverlayTrigger>
                    }
                    checked={this.gameSettings.blindDraft}
                    onChange={() =>
                      this.changeGameSettings(
                        () =>
                          (this.gameSettings.blindDraft =
                            !this.gameSettings.blindDraft)
                      )
                    }
                  />
                </Col>
                <Col xs="12">
                  <FormCheck
                    id="perpetuum-draft-setting"
                    type="switch"
                    label={
                      <OverlayTrigger
                        overlay={
                          <Tooltip id="perpetuum-draft-tooltip">
                            {tr("settings.perpetuumRandom.tooltip")}
                          </Tooltip>
                        }
                      >
                        <label htmlFor="perpetuum-draft-setting">
                          {tr("settings.perpetuumRandom.label")}
                        </label>
                      </OverlayTrigger>
                    }
                    checked={this.gameSettings.perpetuumRandom}
                    onChange={() =>
                      this.changeGameSettings(
                        () =>
                          (this.gameSettings.perpetuumRandom =
                            !this.gameSettings.perpetuumRandom)
                      )
                    }
                  />
                </Col>
              </>
            )}
            <Col xs="12">
              <FormCheck
                id="base-deck-setting"
                type="checkbox"
                label={
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="base-deck-setting-tooltip">
                        {tr("settings.baseDeck.tooltip")}
                      </Tooltip>
                    }
                  >
                    <label htmlFor="base-deck-setting">
                      {tr("settings.baseDeck.label")}
                    </label>
                  </OverlayTrigger>
                }
                checked={
                  (this.gameSettings.selectedDraftDecks &
                    HouseCardDecks.BaseAndModA) ==
                  HouseCardDecks.BaseAndModA
                }
                onChange={(e) =>
                  this.selectHouseCardDeck(e, HouseCardDecks.BaseAndModA)
                }
              />
            </Col>
            <Col xs="12">
              <FormCheck
                id="alternative-deck-setting"
                type="checkbox"
                label={
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="alternative-deck-setting-tooltip">
                        {tr("settings.alternativeDeck.tooltip")}
                      </Tooltip>
                    }
                  >
                    <label htmlFor="alternative-deck-setting">
                      {tr("settings.alternativeDeck.label")}
                    </label>
                  </OverlayTrigger>
                }
                checked={
                  (this.gameSettings.selectedDraftDecks &
                    HouseCardDecks.DwdFfcModB) ==
                  HouseCardDecks.DwdFfcModB
                }
                onChange={(e) =>
                  this.selectHouseCardDeck(e, HouseCardDecks.DwdFfcModB)
                }
              />
            </Col>
            <Col xs="12">
              <FormCheck
                id="sos-deck-setting"
                type="checkbox"
                label={
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="sos-deck-setting-tooltip">
                        {tr("settings.sosDeck.tooltip")}
                      </Tooltip>
                    }
                  >
                    <label htmlFor="sos-deck-setting">
                      {tr("settings.sosDeck.label")}
                    </label>
                  </OverlayTrigger>
                }
                checked={
                  (this.gameSettings.selectedDraftDecks &
                    HouseCardDecks.StormOfSwords) ==
                  HouseCardDecks.StormOfSwords
                }
                onChange={(e) =>
                  this.selectHouseCardDeck(e, HouseCardDecks.StormOfSwords)
                }
              />
            </Col>
            <Col xs="12">
              <FormCheck
                id="first-edition-deck-setting"
                type="checkbox"
                label={
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="first-edition-deck-setting-tooltip">
                        {tr("settings.firstEditionDeck.tooltip")}
                      </Tooltip>
                    }
                  >
                    <label htmlFor="first-edition-deck-setting">
                      {tr("settings.firstEditionDeck.label")}
                    </label>
                  </OverlayTrigger>
                }
                checked={
                  (this.gameSettings.selectedDraftDecks &
                    HouseCardDecks.FirstEdition) ==
                  HouseCardDecks.FirstEdition
                }
                onChange={(e) =>
                  this.selectHouseCardDeck(e, HouseCardDecks.FirstEdition)
                }
              />
            </Col>
          </Col>
        )}
      </Row>
    );
  }

  createSetupItems(): ReactNode {
    const items: JSX.Element[] = [];

    allGameSetups.forEach((setupData, setupId) => {
      items.push(
        <option key={setupId} value={setupId}>
          {getSetupName(setupId, setupData.name)}
        </option>
      );
    });

    return items;
  }

  createPlayerCountItems(): ReactNode {
    const items: JSX.Element[] = [];

    const playerSetups = getGameSetupContainer(
      this.gameSettings.setupId
    ).playerSetups;

    playerSetups.forEach((gameSetup) => {
      items.push(
        <option key={gameSetup.playerCount} value={gameSetup.playerCount}>
          {gameSetup.playerCount}
        </option>
      );
    });

    return items;
  }

  onSetupChange(newVal: string): void {
    if (!this.canChangeGameSettings) {
      return;
    }

    this.gameSettings.setupId = newVal;

    // On setup change set player count to it's default value which should be the highest value (last element)
    const container = getGameSetupContainer(newVal);
    const playerCounts = container.playerSetups.map(
      (playerSetup) => playerSetup.playerCount
    );
    const defaultPlayerCount = playerCounts[playerCounts.length - 1];
    this.gameSettings.playerCount = defaultPlayerCount;

    this.changeGameSettings();
  }

  onPlayerCountChange(newVal: string): void {
    if (!this.canChangeGameSettings) {
      return;
    }

    this.gameSettings.playerCount = parseInt(newVal);

    this.changeGameSettings();
  }

  onInitialLiveClockChange(newVal: string): void {
    if (!this.canChangeGameSettings) {
      return;
    }

    this.gameSettings.initialLiveClock = parseInt(newVal);

    this.changeGameSettings();
  }

  onVpCountChange(newVal: string): void {
    if (!this.canChangeGameSettings) {
      return;
    }

    this.gameSettings.victoryPointsCountNeededToWin = parseInt(newVal);

    this.changeGameSettings();
  }

  onLtCountChange(newVal: string): void {
    if (!this.canChangeGameSettings) {
      return;
    }

    this.gameSettings.loyaltyTokenCountNeededToWin = parseInt(newVal);

    this.changeGameSettings();
  }

  onHouseCardsEvolutionRoundChange(newVal: string): void {
    if (!this.canChangeGameSettings) {
      return;
    }

    if (!this.gameSettings.houseCardsEvolution) {
      return;
    }

    this.gameSettings.houseCardsEvolutionRound = parseInt(newVal);

    this.changeGameSettings();
  }

  onRandomChosenHousesChange(): void {
    if (
      !this.entireGame.gameSettings.randomChosenHouses &&
      this.entireGame.gameSettings.randomHouses
    ) {
      return;
    }

    this.changeGameSettings(
      () =>
        (this.entireGame.gameSettings.randomChosenHouses =
          !this.entireGame.gameSettings.randomChosenHouses)
    );
  }

  onRandomHousesChange(): void {
    if (
      !this.entireGame.gameSettings.randomHouses &&
      this.entireGame.gameSettings.randomChosenHouses
    ) {
      return;
    }

    this.changeGameSettings(
      () =>
        (this.entireGame.gameSettings.randomHouses =
          !this.entireGame.gameSettings.randomHouses)
    );
  }

  /**
   * Helper function to modify gameSettings and update the game settings.
   * @param action Function that modifies gameSettings
   */
  changeGameSettings(action: () => void = () => {}): void {
    if (!this.canChangeGameSettings) {
      return;
    }

    action();

    this.props.entireGame.updateGameSettings(this.gameSettings);
  }

  selectHouseCardDeck(
    e: React.ChangeEvent<HTMLInputElement>,
    deck: HouseCardDecks
  ): void {
    if (e.target.checked) {
      this.gameSettings.selectedDraftDecks |= deck;
    } else {
      this.gameSettings.selectedDraftDecks &= ~deck;
    }
    this.changeGameSettings();
  }
}
