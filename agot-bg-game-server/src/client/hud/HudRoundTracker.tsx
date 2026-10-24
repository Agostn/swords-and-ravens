import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import classNames from "classnames";

import IngameGameState from "../../common/ingame-game-state/IngameGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import GameState from "../../common/GameState";
import WesterosGameState from "../../common/ingame-game-state/westeros-game-state/WesterosGameState";
import PlanningGameState from "../../common/ingame-game-state/planning-game-state/PlanningGameState";
import ActionGameState from "../../common/ingame-game-state/action-game-state/ActionGameState";
import UseRavenGameState from "../../common/ingame-game-state/action-game-state/use-raven-game-state/UseRavenGameState";
import ResolveRaidOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-raid-order-game-state/ResolveRaidOrderGameState";
import ResolveSingleRaidOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-raid-order-game-state/resolve-single-raid-order-game-state/ResolveSingleRaidOrderGameState";
import ResolveMarchOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/ResolveMarchOrderGameState";
import ResolveSingleMarchOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/resolve-single-march-order-game-state/ResolveSingleMarchOrderGameState";
import CombatGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/CombatGameState";
import ResolveConsolidatePowerGameState from "../../common/ingame-game-state/action-game-state/resolve-consolidate-power-game-state/ResolveConsolidatePowerGameState";
import ResolveSingleConsolidatePowerGameState from "../../common/ingame-game-state/action-game-state/resolve-consolidate-power-game-state/resolve-single-consolidate-power-game-state/ResolveSingleConsolidatePowerGameState";
import ScoreObjectivesGameState from "../../common/ingame-game-state/action-game-state/score-objectives-game-state/ScoreObjectivesGameState";
import { raid, march, consolidatePower } from "../../common/ingame-game-state/game-data-structure/order-types/orderTypes";
import orderImages from "../orderImages";
import ravenImage from "../../../public/images/icons/raven.svg";
import HouseChip from "./HouseChip";
import hudSettings from "./hudSettings";
import { t } from "../i18n/i18n";

type StepStatus = "done" | "now" | "next" | "skipped";
type ActionStepKey = "raven" | "raid" | "march" | "consolidate" | "objectives";

interface HudRoundTrackerProps {
  ingame: IngameGameState;
  house: House | null;
}

// Procura um estado (ex.: a batalha) descendo pela cadeia de estados atuais.
function findState<T>(root: GameState<any, any>, cls: new (...args: any[]) => T): T | null {
  let s: GameState<any, any> | null = root;
  while (s) {
    if (s instanceof cls) return s as unknown as T;
    const child: unknown = (s as { childGameState?: unknown }).childGameState;
    s = child instanceof GameState ? child : null;
  }
  return null;
}

/**
 * "Onde estamos na rodada": Westeros → Planejamento → Ações (Corvo,
 * Incursões, Marchas, Consolidar Poder), o que já passou, o que está
 * acontecendo agora, de quem é a vez e quantas ordens ainda faltam.
 */
@observer
export default class HudRoundTracker extends Component<HudRoundTrackerProps> {
  private get ingame(): IngameGameState {
    return this.props.ingame;
  }

  private get phase(): "westeros" | "planning" | "action" | null {
    const c = this.ingame.childGameState;
    if (c instanceof WesterosGameState) return "westeros";
    if (c instanceof PlanningGameState) return "planning";
    if (c instanceof ActionGameState) return "action";
    return null;
  }

  private get actionStep(): ActionStepKey | null {
    const a = this.ingame.childGameState;
    if (!(a instanceof ActionGameState)) return null;
    const c = a.childGameState;
    if (c instanceof UseRavenGameState) return "raven";
    if (c instanceof ResolveRaidOrderGameState) return "raid";
    if (c instanceof ResolveMarchOrderGameState) return "march";
    if (c instanceof ResolveConsolidatePowerGameState) return "consolidate";
    if (c instanceof ScoreObjectivesGameState) return "objectives";
    return null;
  }

  // Ordens daquele tipo que ainda estão no tabuleiro, por Casa (na ordem do Trono).
  private remaining(step: ActionStepKey, action: ActionGameState): [House, number][] {
    const houses = this.ingame.game.getTurnOrder();
    return houses
      .map((h): [House, number] => {
        switch (step) {
          case "raid":
            return [h, action.getRegionsWithRaidOrderOfHouse(h).length];
          case "march":
            return [h, action.getRegionsWithMarchOrderOfHouse(h).length];
          case "consolidate":
            return [
              h,
              action.getRegionsWithConsolidatePowerOrderOfHouse(h).length +
                action.getRegionsWithIronBankOrderOfHouse(h).length +
                action.getRegionsWithDefenseMusterOrderOfHouse(h).length
            ];
          default:
            return [h, 0];
        }
      })
      .filter(([, n]) => n > 0);
  }

  // Frase "agora": quem está jogando e o quê.
  private nowText(): { house: House | null; text: ReactNode } | null {
    const ingame = this.ingame;
    const phase = this.phase;
    if (phase == "westeros") {
      const w = ingame.childGameState as WesterosGameState;
      const card = w.revealedCards[w.currentCardI];
      return {
        house: null,
        text: card
          ? t("hud.round.now.westerosCard", { n: w.currentCardI + 1, total: w.revealedCards.length, card: card.type.name })
          : t("hud.round.now.westeros")
      };
    }
    if (phase == "planning") return { house: null, text: t("hud.round.now.planning") };
    if (phase != "action") return null;

    const combat = findState(ingame, CombatGameState);
    if (combat) {
      return {
        house: combat.attacker,
        text: t("hud.round.now.combat", {
          attacker: combat.attacker.name,
          defender: combat.defender.name,
          region: combat.defendingRegion.name
        })
      };
    }
    const raven = findState(ingame, UseRavenGameState);
    if (raven) return { house: raven.ravenHolder, text: t("hud.round.now.raven", { house: raven.ravenHolder.name }) };
    const raidS = findState(ingame, ResolveSingleRaidOrderGameState);
    if (raidS) return { house: raidS.house, text: t("hud.round.now.raid", { house: raidS.house.name }) };
    const marchS = findState(ingame, ResolveSingleMarchOrderGameState);
    if (marchS) return { house: marchS.house, text: t("hud.round.now.march", { house: marchS.house.name }) };
    const cpS = findState(ingame, ResolveSingleConsolidatePowerGameState);
    if (cpS) return { house: cpS.house, text: t("hud.round.now.consolidate", { house: cpS.house.name }) };
    if (findState(ingame, ScoreObjectivesGameState)) return { house: null, text: t("hud.round.now.objectives") };
    return { house: null, text: t("hud.round.now.action") };
  }

  private renderPhase(key: "westeros" | "planning" | "action", status: StepStatus): ReactNode {
    return (
      <li
        key={key}
        className={classNames("hrt-phase", status)}
        aria-current={status == "now" ? "step" : undefined}
        title={t(`hud.round.phaseHelp.${key}`)}
      >
        <span className="hrt-dot" aria-hidden="true" />
        <span className="hrt-phase-name">{t(`phase.${key}`)}</span>
        {status == "skipped" && <small className="hrt-skip">{t("hud.round.skipped")}</small>}
      </li>
    );
  }

  private stepIcon(step: ActionStepKey): ReactNode {
    const src =
      step == "raven"
        ? ravenImage
        : step == "raid"
          ? orderImages.get(raid.id)
          : step == "march"
            ? orderImages.get(march.id)
            : step == "consolidate"
              ? orderImages.get(consolidatePower.id)
              : null;
    if (!src) return <span className="hrt-step-icon star" aria-hidden="true">★</span>;
    return <img className={classNames("hrt-step-icon", { raven: step == "raven" })} src={src} alt="" aria-hidden="true" />;
  }

  render(): ReactNode {
    const ingame = this.ingame;
    const phase = this.phase;
    if (!phase || ingame.isEndedOrCancelled) return null;
    const game = ingame.game;
    const order = ["westeros", "planning", "action"] as const;
    const pi = order.indexOf(phase);
    const statusOf = (k: (typeof order)[number], i: number): StepStatus =>
      k == "westeros" && game.turn == 1 ? "skipped" : i < pi ? "done" : i == pi ? "now" : "next";

    const action = ingame.childGameState instanceof ActionGameState ? ingame.childGameState : null;
    const step = this.actionStep;
    const steps: ActionStepKey[] = ["raven", "raid", "march", "consolidate"];
    if (step == "objectives") steps.push("objectives");
    const si = step ? steps.indexOf(step) : -1;

    const now = this.nowText();
    const remaining = action && step && step != "raven" && step != "objectives" ? this.remaining(step, action) : [];
    const detailsCollapsed = hudSettings.isCollapsed("round-details");

    return (
      <div className={classNames("hud-round-tracker", `phase-${phase}`)} aria-label={t("hud.round.title")}>
        <div className="hrt-top">
          <span className="hrt-round">
            {t("hud.round.round", { n: game.turn, max: game.maxTurns })}
          </span>
          <ol className="hrt-phases">{order.map((k, i) => this.renderPhase(k, statusOf(k, i)))}</ol>
          {action && !detailsCollapsed && (
          <ol className="hrt-steps">
            {steps.map((s, i) => {
              const st: StepStatus = si < 0 ? "next" : i < si ? "done" : i == si ? "now" : "next";
              const left = s == "raven" || s == "objectives" ? 0 : this.remaining(s, action).reduce((a, [, n]) => a + n, 0);
              return (
                <li
                  key={s}
                  className={classNames("hrt-step", st)}
                  aria-current={st == "now" ? "step" : undefined}
                  title={t(`hud.round.stepHelp.${s}`)}
                >
                  {this.stepIcon(s)}
                  <span className="hrt-step-name">{t(`hud.round.step.${s}`)}</span>
                  {st == "done" ? (
                    <span className="hrt-step-badge done" aria-label={t("hud.round.done")}>✓</span>
                  ) : left > 0 ? (
                    <span className="hrt-step-badge" title={t("hud.round.ordersLeft", { n: left })}>{left}</span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
          {action && (
            <button
              type="button"
              className={classNames("hrt-toggle", { open: !detailsCollapsed })}
              aria-expanded={!detailsCollapsed}
              aria-label={detailsCollapsed ? t("hud.round.showDetails") : t("hud.round.hideDetails")}
              title={detailsCollapsed ? t("hud.round.showDetails") : t("hud.round.hideDetails")}
              onClick={() => hudSettings.toggleSection("round-details")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
        </div>


        <div className="hrt-bottom">
        {now && (
          <div className="hrt-now">
            <span className="hrt-now-label">{t("hud.round.nowLabel")}</span>
            {now.house && <HouseChip house={now.house} size={20} mine={now.house == this.props.house} />}
            <span className="hrt-now-text">{now.text}</span>
          </div>
        )}

        {remaining.length > 0 && !detailsCollapsed && (
          <div className="hrt-queue" aria-label={t("hud.round.queue")}>
            <span className="hrt-queue-label">{t("hud.round.queue")}</span>
            {remaining.map(([h, n]) => (
              <span
                key={h.id}
                className={classNames("hrt-queue-item", { current: now?.house == h, mine: h == this.props.house })}
                title={t("hud.round.queueItem", { house: h.name, n })}
              >
                <HouseChip house={h} size={18} />
                <b>{n}</b>
              </span>
            ))}
          </div>
        )}
        </div>
      </div>
    );
  }
}
