import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { observable, reaction, IReactionDisposer } from "mobx";
import classNames from "classnames";

import IngameGameState from "../../common/ingame-game-state/IngameGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { CombatStats } from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/CombatGameState";
import { tidesOfBattleCards } from "../../common/ingame-game-state/game-data-structure/static-data-structure/tidesOfBattleCards";
import allKnownHouseCards from "../utils/houseCardHelper";
import HouseCardComponent from "../game-state-panel/utils/HouseCardComponent";
import HouseChip from "./HouseChip";
import { t } from "../i18n/i18n";

interface HudBattleResultProps {
  ingame: IngameGameState;
  myHouse: House | null;
}

interface Side {
  house: House;
  stats: CombatStats;
  attacker: boolean;
}

interface Battle {
  regionName: string;
  sides: Side[];
  winner: House | null;
}

// Quanto tempo o quadro fica na tela antes de sumir sozinho
const AUTO_CLOSE_MS = 9000;

/**
 * Resultado de cada batalha em destaque no meio da tela: os dois lados,
 * as cartas de Casa, a soma de cada parte da força e o vencedor.
 * Usa o registro "combat-result" do histórico, então só aparece para
 * batalhas novas (não para as que já estavam no histórico ao abrir a página).
 * A conta é a mesma do painel da batalha (CombatInfoComponent).
 */
@observer
export default class HudBattleResult extends Component<HudBattleResultProps> {
  @observable battle: Battle | null = null;

  private seenLogs = 0;
  private disposer: IReactionDisposer | null = null;
  private closeTimer: number | null = null;

  componentDidMount(): void {
    this.seenLogs = this.props.ingame.gameLogManager.logs.length;
    this.disposer = reaction(
      () => this.props.ingame.gameLogManager.logs.length,
      () => this.onNewLogs()
    );
  }

  componentDidUpdate(): void {
    // enquanto o quadro está aberto, a faixa do relógio (fora da tela da
    // partida) some para não ficar por cima dele no celular
    document.body.classList.toggle("hud-overlay-open", this.battle != null);
  }

  componentWillUnmount(): void {
    document.body.classList.remove("hud-overlay-open");
    this.disposer?.();
    if (this.closeTimer != null) window.clearTimeout(this.closeTimer);
  }

  private close = (): void => {
    this.battle = null;
    if (this.closeTimer != null) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  };

  private onNewLogs(): void {
    const logs = this.props.ingame.gameLogManager.logs;
    if (logs.length < this.seenLogs) {
      this.seenLogs = logs.length;
      return;
    }
    const fresh = logs.slice(this.seenLogs);
    this.seenLogs = logs.length;

    const results = fresh.filter((l) => l.data.type == "combat-result");
    const last = results[results.length - 1];
    if (!last || last.data.type != "combat-result") return;

    const game = this.props.ingame.game;
    const sides: Side[] = last.data.stats
      .filter((s) => game.houses.has(s.house))
      .map((s, i) => ({
        house: game.houses.get(s.house),
        stats: s,
        // o primeiro registro da batalha é sempre o atacante
        attacker: i == 0
      }));
    if (sides.length != 2) return;

    const defenderRegion = game.world.regions.tryGet(
      sides[1].stats.region,
      null
    );
    this.battle = {
      regionName: defenderRegion?.name ?? "",
      sides,
      winner: game.houses.tryGet(last.data.winner, null)
    };

    if (this.closeTimer != null) window.clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(this.close, AUTO_CLOSE_MS);
  }

  render(): ReactNode {
    const b = this.battle;
    if (!b) return null;
    const [att, def] = b.sides;
    const mine = this.props.myHouse;
    const iWon = mine != null && b.winner == mine;
    const iLost =
      mine != null && b.winner != mine && b.sides.some((s) => s.house == mine);

    return (
      <div
        className={classNames("hud-panel hud-battle-result", {
          won: iWon,
          lost: iLost
        })}
        role="dialog"
        aria-label={t("hud.battle.title", { region: b.regionName })}
        onClick={this.close}
      >
        <div className="hud-battle-title">
          {t("hud.battle.title", { region: b.regionName })}
        </div>
        <div className="hud-battle-sides">
          {this.renderSide(att, b.winner)}
          <div className="hud-battle-vs" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="54" height="54">
              <g
                stroke="#1b120a"
                strokeWidth="3"
                strokeLinecap="round"
                fill="#e9e2d3"
              >
                <path d="M10 8 L40 38 L36 42 L6 12 Z" />
                <path d="M54 8 L24 38 L28 42 L58 12 Z" />
              </g>
              <g stroke="#1b120a" strokeWidth="2.5" fill="#c9a227">
                <path d="M33 37 L43 47 L40 50 L30 40 Z" />
                <path d="M31 37 L21 47 L24 50 L34 40 Z" />
                <circle cx="47" cy="53" r="4" />
                <circle cx="17" cy="53" r="4" />
              </g>
            </svg>
            <span className="hud-battle-score">
              {att.stats.total} × {def.stats.total}
            </span>
          </div>
          {this.renderSide(def, b.winner)}
        </div>
        {b.winner && (
          <div className="hud-battle-verdict" style={{ color: b.winner.color }}>
            {iWon
              ? t("hud.battle.youWon")
              : iLost
                ? t("hud.battle.youLost", { house: b.winner.name })
                : t("hud.battle.winner", { house: b.winner.name })}
          </div>
        )}
        {att.stats.total == def.stats.total && (
          // empate: vence quem está mais alto na trilha dos Feudos
          <div className="hud-battle-tie">{t("hud.battle.tie")}</div>
        )}
        <div className="hud-battle-hint">{t("hud.battle.clickToClose")}</div>
      </div>
    );
  }

  private renderSide(side: Side, winner: House | null): ReactNode {
    const s = side.stats;
    const card = s.houseCard
      ? allKnownHouseCards.tryGet(s.houseCard, null)
      : null;
    const tides =
      s.tidesOfBattleCard != null
        ? tidesOfBattleCards.tryGet(s.tidesOfBattleCard, null)
        : null;
    const region = this.props.ingame.world.regions.tryGet(s.region, null);
    const won = winner == side.house;

    const rows: [string, number][] = [
      [t("hud.battle.army"), s.army],
      [t("hud.battle.order"), s.orderBonus],
      [t("hud.battle.garrison"), s.garrison],
      [t("hud.battle.support"), s.support],
      [t("hud.battle.card"), s.houseCardStrength],
      [t("hud.battle.blade"), s.valyrianSteelBlade]
    ];
    if (tides) rows.push([t("hud.battle.tides"), tides.combatStrength]);
    // Exército e Carta de Casa aparecem sempre; o resto só quando muda a soma
    const cardLabel = t("hud.battle.card");

    return (
      <div
        className={classNames("hud-battle-side", {
          winner: won,
          loser: winner != null && !won,
          attacker: side.attacker
        })}
      >
        <div className="hud-battle-role">
          {side.attacker ? t("hud.battle.attacker") : t("hud.battle.defender")}
        </div>
        <div className="hud-battle-house">
          <HouseChip house={side.house} size={30} />
          <div>
            <b style={{ color: side.house.color }}>{side.house.name}</b>
            {region && <small>{region.name}</small>}
          </div>
        </div>
        <div className="hud-battle-body">
          <div className="hud-battle-card">
            {card ? (
              <HouseCardComponent houseCard={card} size="small" />
            ) : (
              <div className="vertical-game-card game-card-slot small" />
            )}
          </div>
          <ul className="hud-battle-rows">
            {rows
              .filter(([label, v], i) => i == 0 || label == cardLabel || v != 0)
              .map(([label, v]) => (
                <li key={label}>
                  <span>{label}</span>
                  <b>{v > 0 && label != rows[0][0] ? `+${v}` : v}</b>
                </li>
              ))}
          </ul>
        </div>
        <div className="hud-battle-total">
          <span>{t("hud.battle.total")}</span>
          <b>{s.total}</b>
        </div>
        {won && (
          <div className="hud-battle-ribbon">{t("hud.battle.victory")}</div>
        )}
      </div>
    );
  }
}
