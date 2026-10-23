import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { observable, reaction, IReactionDisposer } from "mobx";
import classNames from "classnames";
import * as _ from "lodash";

import IngameGameState from "../../common/ingame-game-state/IngameGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import Game from "../../common/ingame-game-state/game-data-structure/Game";
import { GameLogData } from "../../common/ingame-game-state/game-data-structure/GameLog";
import HouseChip from "./HouseChip";
import WildlingCardType from "../../common/ingame-game-state/game-data-structure/wildling-card/WildlingCardType";
import WildlingCardComponent from "../game-state-panel/utils/WildlingCardComponent";
import { t } from "../i18n/i18n";

import stoneThroneImage from "../../../public/images/icons/stone-throne.svg";
import diamondHiltImage from "../../../public/images/icons/diamond-hilt.svg";
import ravenImage from "../../../public/images/icons/raven.svg";
import mammothImage from "../../../public/images/icons/mammoth.svg";

interface HudBidResultsProps {
  ingame: IngameGameState;
  myHouse: House | null;
}

interface TrackResult {
  trackerI: number;
  // casas na ordem final da trilha, com o lance de cada uma
  rows: { house: House; bid: number }[];
  distributor: House | null;
}

interface WildlingResult {
  card: WildlingCardType | null;
  // quando o empate foi decidido por alguém, vem depois num log próprio
  highestChosen: House | null;
  lowestChosen: House | null;
  strength: number;
  total: number;
  nightsWatchVictory: boolean;
  rows: { house: House; bid: number }[];
}

const TRACK_ICONS = [stoneThroneImage, diamondHiltImage, ravenImage];

/**
 * Resultado dos lances em destaque no meio da tela: "A Fúria dos Reis"
 * (trilha por trilha, conforme cada uma termina) e o ataque dos Selvagens.
 * Aparece só para lances novos (não para os que já estavam no histórico
 * quando a página abriu) e some ao clicar em "Continuar".
 */
@observer
export default class HudBidResults extends Component<HudBidResultsProps> {
  @observable tracks: TrackResult[] = [];
  @observable wildlings: WildlingResult | null = null;
  @observable visible = false;

  private seenLogs = 0;
  // quem decidiu os empates da próxima trilha (log "ties-decided")
  private tieDecider: House | null = null;
  private pendingBids = new Map<
    number,
    Extract<GameLogData, { type: "clash-of-kings-bidding-done" }>
  >();
  private disposer: IReactionDisposer | null = null;
  private phaseDisposer: IReactionDisposer | null = null;

  private get game(): Game {
    return this.props.ingame.game;
  }

  componentDidMount(): void {
    const logs = this.props.ingame.gameLogManager.logs;
    this.seenLogs = logs.length;
    this.disposer = reaction(
      () => this.props.ingame.gameLogManager.logs.length,
      () => this.onNewLogs()
    );
    // Some sozinho quando a partida muda de fase (ex.: Westeros -> Planejamento)
    this.phaseDisposer = reaction(
      () => this.props.ingame.childGameState,
      () => (this.visible = false)
    );
  }

  componentWillUnmount(): void {
    this.disposer?.();
    this.phaseDisposer?.();
  }

  private bidsOf(results: [number, string[]][]): Map<string, number> {
    const m = new Map<string, number>();
    results.forEach(([bid, hids]) => hids.forEach((h) => m.set(h, bid)));
    return m;
  }

  private houseOrNull(id: string): House | null {
    return this.game.houses.tryGet(id, null);
  }

  private onNewLogs(): void {
    const logs = this.props.ingame.gameLogManager.logs;
    // replays e recarregamentos podem trocar a lista inteira
    if (logs.length < this.seenLogs) {
      this.seenLogs = logs.length;
      return;
    }
    const fresh = logs.slice(this.seenLogs);
    this.seenLogs = logs.length;

    fresh.forEach(({ data }) => {
      switch (data.type) {
        case "clash-of-kings-bidding-done":
          if (data.trackerI == 0) {
            // começou uma nova Fúria dos Reis
            this.tracks = [];
            this.wildlings = null;
          }
          this.pendingBids.set(data.trackerI, data);
          this.tieDecider = null;
          break;
        case "clash-of-kings-final-ordering": {
          const bidsLog = this.pendingBids.get(data.trackerI);
          const bids = bidsLog ? this.bidsOf(bidsLog.results) : new Map();
          const rows = data.finalOrder
            .map((hid) => this.houseOrNull(hid))
            .filter((h): h is House => h != null)
            .map((house) => ({ house, bid: bids.get(house.id) ?? 0 }));
          const distributor = bidsLog?.distributor
            ? this.houseOrNull(bidsLog.distributor)
            : this.tieDecider;
          this.tieDecider = null;
          this.tracks = _.sortBy(
            [
              ...this.tracks.filter((tr) => tr.trackerI != data.trackerI),
              { trackerI: data.trackerI, rows, distributor }
            ],
            (tr) => tr.trackerI
          );
          this.wildlings = null;
          this.visible = true;
          break;
        }
        case "wildling-bidding": {
          const rows = _.sortBy(
            _.flatMap(data.results, ([bid, hids]) =>
              hids
                .map((hid) => this.houseOrNull(hid))
                .filter((h): h is House => h != null)
                .map((house) => ({ house, bid }))
            ),
            (r) => -r.bid
          );
          this.tracks = [];
          this.wildlings = {
            card: null,
            highestChosen: null,
            lowestChosen: null,
            strength: data.wildlingStrength,
            total: _.sumBy(rows, (r) => r.bid),
            nightsWatchVictory: data.nightsWatchVictory,
            rows
          };
          this.visible = true;
          break;
        }
        case "ties-decided":
          this.tieDecider = this.houseOrNull(data.house);
          break;
        case "wildling-card-revealed":
          if (this.wildlings) {
            const card = this.game.wildlingDeck.find(
              (c) => c.id == data.wildlingCard
            );
            this.wildlings = { ...this.wildlings, card: card?.type ?? null };
          }
          break;
        case "highest-bidder-chosen":
          if (this.wildlings) {
            this.wildlings = {
              ...this.wildlings,
              highestChosen: this.houseOrNull(data.highestBidder)
            };
          }
          break;
        case "lowest-bidder-chosen":
          if (this.wildlings) {
            this.wildlings = {
              ...this.wildlings,
              lowestChosen: this.houseOrNull(data.lowestBidder)
            };
          }
          break;
      }
    });
  }

  render(): ReactNode {
    if (!this.visible || (this.tracks.length == 0 && !this.wildlings)) {
      return null;
    }
    return (
      <div
        className="hud-panel hud-bid-results"
        role="dialog"
        aria-label={t("hud.bids.title")}
      >
        {this.wildlings ? this.renderWildlings(this.wildlings) : this.renderTracks()}
        <div className="hud-bid-results-footer">
          <button
            type="button"
            className="btn btn-sm btn-warning"
            onClick={() => (this.visible = false)}
          >
            {t("hud.bids.close")}
          </button>
        </div>
      </div>
    );
  }

  private renderTracks(): ReactNode {
    return (
      <>
        <div className="hud-bid-results-title">{t("hud.bids.clashTitle")}</div>
        <div className="hud-bid-tracks">
          {[0, 1, 2].map((i) => {
            const track = this.tracks.find((tr) => tr.trackerI == i);
            return (
              <div
                key={`hud-bid-track-${i}`}
                className={classNames("hud-bid-track", { pending: !track })}
              >
                <div className="hud-bid-track-name">
                  <img src={TRACK_ICONS[i]} width={18} height={18} alt="" />
                  {this.game.getNameInfluenceTrack(i)}
                </div>
                {track ? (
                  <ol className="hud-bid-rows">
                    {track.rows.map((r, pos) => (
                      <li
                        key={`hud-bid-${i}-${r.house.id}`}
                        className={classNames({
                          first: pos == 0,
                          mine: r.house == this.props.myHouse
                        })}
                      >
                        <span className="hud-bid-pos">{pos + 1}º</span>
                        <HouseChip house={r.house} size={22} />
                        <span className="hud-bid-house">{r.house.name}</span>
                        <span className="hud-bid-value">
                          {t("hud.bids.bid", { n: r.bid })}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="hud-bid-waiting">{t("hud.bids.waiting")}</div>
                )}
                {track?.distributor && (
                  <div className="hud-bid-note">
                    {t("hud.bids.tieBroken", { house: track.distributor.name })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  private tagFor(w: WildlingResult, r: { house: House; bid: number }): string {
    if (w.rows.length < 2) return "";
    const highest = w.rows[0].bid;
    const lowest = (_.last(w.rows) as { bid: number }).bid;
    if (highest == lowest && !w.highestChosen && !w.lowestChosen) return "";
    // Patrulha venceu: o maior lance ganha a recompensa; Selvagens venceram:
    // o menor lance sofre a pior penalidade. Em empate, quem tem o Trono decide.
    if (w.nightsWatchVictory) {
      const top = w.highestChosen ?? (w.rows.filter((x) => x.bid == highest).length == 1 ? w.rows[0].house : null);
      return top == r.house ? t("hud.bids.highest") : "";
    }
    const bottom = w.lowestChosen ?? (w.rows.filter((x) => x.bid == lowest).length == 1 ? (_.last(w.rows) as { house: House }).house : null);
    return bottom == r.house ? t("hud.bids.lowest") : "";
  }

  private renderWildlings(w: WildlingResult): ReactNode {
    return (
      <div className="hud-bid-wildlings">
        {w.card && (
          <div className="hud-bid-wildling-card">
            <WildlingCardComponent cardType={w.card} size="small" tooltip />
            <small>{w.card.name}</small>
          </div>
        )}
        <div className="hud-bid-wildling-info">
        <div className="hud-bid-results-title">
          <img src={mammothImage} width={20} height={20} alt="" />{" "}
          {t("hud.bids.wildlingsTitle")}
        </div>
        <div
          className={classNames("hud-bid-verdict", {
            win: w.nightsWatchVictory,
            lose: !w.nightsWatchVictory
          })}
        >
          <b>
            {w.nightsWatchVictory
              ? t("hud.bids.nightsWatchWins")
              : t("hud.bids.wildlingsWin")}
          </b>
          <span>
            {t("hud.bids.totalVsStrength", {
              total: w.total,
              strength: w.strength
            })}
          </span>
        </div>
        <ol className="hud-bid-rows wide">
          {w.rows.map((r) => (
            <li
              key={`hud-wbid-${r.house.id}`}
              className={classNames({ mine: r.house == this.props.myHouse })}
            >
              <HouseChip house={r.house} size={22} />
              <span className="hud-bid-house">{r.house.name}</span>
              <span className="hud-bid-tag">{this.tagFor(w, r)}</span>
              <span className="hud-bid-value">
                {t("hud.bids.bid", { n: r.bid })}
              </span>
            </li>
          ))}
        </ol>
        </div>
      </div>
    );
  }
}
