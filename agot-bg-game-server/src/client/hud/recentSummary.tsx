/**
 * "Últimos acontecimentos" em linguagem simples (01/nov, pedido do Agostinho: "não dá pra entender direito o
 * resultado"). Antes o painel escondia justamente os resultados (batalha, selvagens, cartas de Westeros) e
 * mostrava o miúdo ("Casa X fez seu lance"). Agora cada acontecimento importante vira UMA linha com ícone,
 * título e o resultado em palavras: quem venceu, quem perdeu o quê, para onde recuou, o que a carta fez.
 * O resto aparece como antes (uma linha do Histórico); o Histórico completo continua igual.
 */
import React, { ReactNode } from "react";
import _ from "lodash";
import Game from "../../common/ingame-game-state/game-data-structure/Game";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { GameLogData } from "../../common/ingame-game-state/game-data-structure/GameLog";
import unitTypes from "../../common/ingame-game-state/game-data-structure/unitTypes";
import { westerosCardTypes } from "../../common/ingame-game-state/game-data-structure/westeros-card/westerosCardTypes";
import WildlingCard from "../../common/ingame-game-state/game-data-structure/wildling-card/WildlingCard";
import allKnownHouseCards from "../utils/houseCardHelper";

/** miudezas que não ajudam a entender o que aconteceu (estão no Histórico completo) */
const NOISE = new Set<string>([
  "player-action",
  "orders-revealed",
  "westeros-cards-drawn",
  "westeros-phase-began",
  "planning-phase-began",
  "action-phase-began",
  "action-phase-resolve-raid-began",
  "action-phase-resolve-march-began",
  "action-phase-resolve-consolidate-power-began",
  "draft-house-cards-began",
  "user-house-assignments",
  "combat-house-card-chosen",
  "support-declared",
  "support-refused",
  "clash-of-kings-bidding-done",
  "clash-of-kings-final-ordering"
]);

/** o que acontece depois de uma batalha entra na mesma linha da batalha */
const BATTLE_FOLLOW = new Set<string>([
  "killed-after-combat",
  "immediatly-killed-after-combat",
  "retreat-region-chosen",
  "retreat-failed",
  "retreat-casualties-suffered",
  "garrison-removed",
  "casualties-prevented",
  "combat-valyrian-sword-used"
]);

/** o que cada carta de Selvagens fez entra na linha do ataque dos Selvagens */
const WILDLING_PREFIXES = [
  "rattleshirts-raiders",
  "skinchanger-scout",
  "crow-killers",
  "the-horde-descends",
  "mammoth-riders",
  "a-king-beyond-the-wall",
  "massing-on-the-milkwater",
  "preemptive-raid",
  "silence-at-the-wall",
  "lowest-bidder-chosen",
  "highest-bidder-chosen"
];

interface Item {
  key: string;
  kind: string;
  icon: string;
  title: ReactNode;
  lines: ReactNode[];
  round: number | null;
}

export function buildRecentSummary(
  logs: { data: GameLogData }[],
  game: Game,
  fogOfWar: boolean,
  fallback: (data: GameLogData) => ReactNode,
  max: number
): ReactNode {
  const items: Item[] = [];
  const hName = (id: string | null | undefined): ReactNode => {
    if (!id) return <b>?</b>;
    const h = game.houses.tryGet(id, null) as House | null;
    return <b className="hud-sum-house">{h ? h.name : id}</b>;
  };
  const rName = (id: string | null | undefined): string => {
    if (!id) return "?";
    const r = game.world.regions.tryGet(id, null);
    return r ? r.name : id;
  };
  const units = (ids: string[]): string =>
    fogOfWar ? `${ids.length} ${ids.length == 1 ? "unidade" : "unidades"}` : ids.map((u) => unitTypes.get(u).name.toLowerCase()).join(", ");
  const cardName = (id: string | null): string | null => {
    if (!id) return null;
    const c = allKnownHouseCards.tryGet(id, null);
    return c ? c.name : null;
  };

  let lastBattle: Item | null = null;
  let lastWildling: Item | null = null;
  let pendingLanes: [number, number] | null = null;
  let pendingWildlingCard: string | null = null;
  const start = Math.max(0, logs.length - 120);
  let round: number | null = null;
  for (let i = start - 1; i >= 0; i--) {
    const d = logs[i].data;
    if (d.type == "turn-begin") {
      round = d.turn;
      break;
    }
  }
  const push = (it: Omit<Item, "round">): Item => {
    const full = { ...it, round };
    items.push(full);
    return full;
  };

  for (let i = start; i < logs.length; i++) {
    const d = logs[i].data;
    const key = `sum-${i}`;
    if (NOISE.has(d.type)) continue;

    if (d.type == "turn-begin") {
      round = d.turn;
      lastBattle = null;
      lastWildling = null;
      continue;
    }
    if (d.type == "attack") continue; // a linha da batalha já diz quem atacou quem
    if (d.type == "tactical-battle-result") {
      pendingLanes = d.lanesWon;
      continue;
    }
    if (d.type == "combat-result") {
      const [att, def] = d.stats;
      const winner = d.stats.find((s) => s.isWinner) ?? (d.winner == att?.house ? att : def);
      const loser = winner == att ? def : att;
      const lines: ReactNode[] = [];
      if (att && def) {
        const card = (s: typeof att): string => {
          const n = cardName(s.houseCard);
          return n ? ` (carta ${n})` : "";
        };
        lines.push(
          <>
            Força: {hName(att.house)} <b>{att.total}</b>
            {card(att)} × {hName(def.house)} <b>{def.total}</b>
            {card(def)}
          </>
        );
      }
      if (pendingLanes) {
        lines.push(
          <>
            Mesa de Batalha: faixas {pendingLanes[0]} × {pendingLanes[1]}
          </>
        );
        pendingLanes = null;
      }
      lastBattle = push({
        key,
        kind: "battle",
        icon: "⚔",
        title: (
          <>
            {hName(winner?.house)} venceu {hName(loser?.house)} em {rName(def ? def.region : null)}
          </>
        ),
        lines
      });
      
      continue;
    }
    if (BATTLE_FOLLOW.has(d.type) && lastBattle) {
      const b = lastBattle;
      if (d.type == "killed-after-combat" && d.killed.length) b.lines.push(<>{hName(d.house)} perdeu: {units(d.killed)}</>);
      else if (d.type == "immediatly-killed-after-combat") {
        const all = [...d.killedBecauseWounded, ...d.killedBecauseCantRetreat];
        if (all.length) b.lines.push(<>{hName(d.house)} perdeu (não podiam recuar): {units(all)}</>);
      } else if (d.type == "retreat-region-chosen") b.lines.push(<>{hName(d.house)} recuou para {rName(d.regionTo)}</>);
      else if (d.type == "retreat-failed") b.lines.push(<>{hName(d.house)} não tinha para onde recuar e perdeu o exército</>);
      else if (d.type == "retreat-casualties-suffered" && d.units.length) b.lines.push(<>{hName(d.house)} perdeu ao recuar: {units(d.units)}</>);
      else if (d.type == "garrison-removed") b.lines.push(<>a guarnição de {rName(d.region)} caiu</>);
      else if (d.type == "casualties-prevented") b.lines.push(<>{hName(d.house)} não perdeu peças (a carta impediu)</>);
      else b.lines.push(fallback(d));
      continue;
    }

    if (d.type == "wildling-card-revealed") {
      const wc = game.wildlingDeck.find((c) => c.id == d.wildlingCard) as WildlingCard | undefined;
      pendingWildlingCard = wc ? wc.type.name : null;
      if (lastWildling && pendingWildlingCard) {
        lastWildling.lines.unshift(<>Carta: <b>{pendingWildlingCard}</b></>);
        pendingWildlingCard = null;
      }
      continue;
    }
    if (d.type == "wildling-bidding") {
      const total = _.sum(d.results.map(([bid, hs]) => bid * hs.length));
      const ranked = _.flatMap(d.results, ([bid, hs]) => hs.map((h) => [h, bid] as [string, number])).sort((a, b) => b[1] - a[1]);
      lastWildling = push({
        key,
        kind: d.nightsWatchVictory ? "wild-win" : "wild-lose",
        icon: "🐺",
        title: d.nightsWatchVictory ? (
          <>Selvagens atacaram: <b>a Patrulha da Noite venceu</b></>
        ) : (
          <>Selvagens atacaram: <b>os Selvagens venceram</b></>
        ),
        lines: [
          <>
            Força dos Selvagens <b>{d.wildlingStrength}</b> × soma dos lances <b>{total}</b>
          </>,
          <>
            Lances:{" "}
            {ranked.map(([h, bid], j) => (
              <span key={h}>
                {j > 0 && " · "}
                {hName(h)} {bid}
              </span>
            ))}
          </>
        ]
      });
      if (pendingWildlingCard) {
        lastWildling.lines.unshift(<>Carta: <b>{pendingWildlingCard}</b></>);
        pendingWildlingCard = null;
      }
      
      continue;
    }
    if (lastWildling && WILDLING_PREFIXES.some((p) => d.type.startsWith(p))) {
      if (d.type == "lowest-bidder-chosen") lastWildling.lines.push(<>Menor lance (desempate): {hName(d.lowestBidder)}</>);
      else if (d.type == "highest-bidder-chosen") lastWildling.lines.push(<>Maior lance (desempate): {hName(d.highestBidder)}</>);
      else lastWildling.lines.push(fallback(d));
      continue;
    }

    if (d.type == "westeros-card-executed") {
      const wc = westerosCardTypes.tryGet(d.westerosCardType, null);
      push({
        key,
        kind: "westeros",
        icon: "🃏",
        title: (
          <>
            Carta de Westeros: <b>{wc ? wc.name : d.westerosCardType}</b>
          </>
        ),
        lines: wc && wc.shortDescription ? [<>{wc.shortDescription}</>] : []
      });
      continue;
    }
    if (d.type == "supply-adjusted") {
      push({
        key,
        kind: "supply",
        icon: "🛢",
        title: "Suprimento ajustado (quantos exércitos cada um pode ter)",
        lines: [
          <>
            {d.supplies.map(([h, n], j) => (
              <span key={h}>
                {j > 0 && " · "}
                {hName(h)} {n}
              </span>
            ))}
          </>
        ]
      });
      continue;
    }

    const node = fallback(d);
    if (node == null || node === false) continue;
    push({ key, kind: "other", icon: "•", title: node, lines: [] });
  }

  // as mais novas em cima, com o número da rodada antes de cada grupo
  const shown = items.slice(-max).reverse();
  const out: ReactNode[] = [];
  let lastRound: number | null | undefined = undefined;
  for (const it of shown) {
    if (it.round != lastRound && it.round != null) {
      out.push(
        <div key={`r-${it.key}`} className="hud-sum-round">
          Rodada {it.round}
        </div>
      );
    }
    lastRound = it.round;
    out.push(
      <div key={it.key} className={`hud-sum-row kind-${it.kind}`}>
        <span className="hud-sum-icon" aria-hidden="true">
          {it.icon}
        </span>
        <div className="hud-sum-text">
          <div className="hud-sum-title">{it.title}</div>
          {it.lines.map((l, j) => (
            <div key={j} className="hud-sum-line">
              {l}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return out;
}
