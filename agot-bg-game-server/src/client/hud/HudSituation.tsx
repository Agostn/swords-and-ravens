import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

import IngameGameState from "../../common/ingame-game-state/IngameGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { HouseCardState } from "../../common/ingame-game-state/game-data-structure/house-card/HouseCard";
import WesterosGameState from "../../common/ingame-game-state/westeros-game-state/WesterosGameState";
import PlanningGameState from "../../common/ingame-game-state/planning-game-state/PlanningGameState";
import ActionGameState from "../../common/ingame-game-state/action-game-state/ActionGameState";
import UseRavenGameState from "../../common/ingame-game-state/action-game-state/use-raven-game-state/UseRavenGameState";
import ResolveRaidOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-raid-order-game-state/ResolveRaidOrderGameState";
import ResolveMarchOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/ResolveMarchOrderGameState";
import ResolveConsolidatePowerGameState from "../../common/ingame-game-state/action-game-state/resolve-consolidate-power-game-state/ResolveConsolidatePowerGameState";
import StatIcon from "./StatIcon";
import displayedVictoryPoints from "./displayedVictoryPoints";
import { t } from "../i18n/i18n";

interface HudSituationProps {
  ingame: IngameGameState;
  house: House | null;
}

/**
 * Linha "sua situação" embaixo do painel da jogada: o que o jogador mais
 * precisa olhar a toda hora (ordens colocadas, reserva de Poder, exércitos
 * permitidos, cartas na mão, pontos) e o que vem depois na rodada.
 */
@observer
export default class HudSituation extends Component<HudSituationProps> {
  private get nextStep(): string | null {
    const ingame = this.props.ingame;
    const has = (cls: unknown): boolean => ingame.hasChildGameState(cls);
    if (ingame.isEndedOrCancelled) return null;
    if (has(WesterosGameState)) return t("hud.situation.nextPlanning");
    if (has(PlanningGameState)) return t("hud.situation.nextAction");
    if (has(ActionGameState)) {
      if (has(UseRavenGameState)) return t("hud.situation.nextAction");
      if (has(ResolveRaidOrderGameState)) return t("hud.situation.nextMarch");
      if (has(ResolveMarchOrderGameState))
        return t("hud.situation.nextConsolidate");
      if (has(ResolveConsolidatePowerGameState))
        return ingame.game.turn >= ingame.game.maxTurns
          ? t("hud.situation.nextEnd")
          : t("hud.situation.nextRound");
    }
    return null;
  }

  private item(
    key: string,
    label: string,
    value: ReactNode,
    help: string
  ): ReactNode {
    return (
      <OverlayTrigger
        key={key}
        placement="top"
        overlay={<Tooltip id={`hud-situation-${key}`}>{help}</Tooltip>}
      >
        <div className="hud-situation-item">
          <span className="hud-situation-label">{label}</span>
          <span className="hud-situation-value">{value}</span>
        </div>
      </OverlayTrigger>
    );
  }

  render(): ReactNode {
    const ingame = this.props.ingame;
    const game = ingame.game;
    const house = this.props.house;
    const items: ReactNode[] = [];

    if (house) {
      const vp = displayedVictoryPoints(game, house);
      const cards = house.houseCards.values.filter(
        (c) => c.state == HouseCardState.AVAILABLE
      ).length;
      const armies = game.getAllowedArmySizes(house);

      items.push(
        this.item(
          "vp",
          t("hud.situation.vp"),
          <>
            <StatIcon kind="vp" />
            {vp}
            <small>/{game.victoryPointsCountNeededToWin}</small>
          </>,
          t("hud.stats.vp", { n: vp, max: game.victoryPointsCountNeededToWin })
        ),
        this.item(
          "power",
          t("hud.situation.power"),
          <>
            <StatIcon kind="power" />
            {house.powerTokens}
          </>,
          t("hud.stats.power", { n: house.powerTokens })
        ),
        this.item(
          "armies",
          t("hud.situation.armies"),
          <>
            <StatIcon kind="supply" />
            {armies.length > 0 ? armies.join(" · ") : "—"}
          </>,
          t("hud.situation.armiesHelp", { level: house.supplyLevel })
        ),
        this.item(
          "cards",
          t("hud.situation.cards"),
          <>
            <StatIcon kind="cards" />
            {cards}
          </>,
          t("hud.stats.cards", { n: cards, total: house.houseCards.size })
        )
      );
    }

    const next = this.nextStep;
    if (items.length == 0 && !next) return null;

    return (
      <div className="hud-situation">
        {items}
        {next && (
          <div className="hud-situation-item next">
            <span className="hud-situation-label">
              {t("hud.situation.next")}
            </span>
            <span className="hud-situation-value">{next}</span>
          </div>
        )}
      </div>
    );
  }
}
