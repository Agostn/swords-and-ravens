import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import classNames from "classnames";
import * as _ from "lodash";

import IngameGameState from "../../common/ingame-game-state/IngameGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import { InfluenceTrackDetails } from "../IngameComponent";
import HouseChip from "./HouseChip";
import { t, tr } from "../i18n/i18n";

import stoneThroneImage from "../../../public/images/icons/stone-throne.svg";
import diamondHiltImage from "../../../public/images/icons/diamond-hilt.svg";
import diamondHiltUsedImage from "../../../public/images/icons/diamond-hilt-used.svg";
import ravenImage from "../../../public/images/icons/raven.svg";

interface HudTracksProps {
  ingame: IngameGameState;
  tracks: InfluenceTrackDetails[];
  myHouse: House | null;
  // Coluna da esquerda: cada trilha numa linha, com a posição embaixo
  vertical?: boolean;
}

/**
 * As três trilhas de influência numa faixa compacta no topo da tela.
 * Durante "A Fúria dos Reis" as posições ainda em disputa nos lances
 * aparecem como "?" (no jogo original elas ficam vazias).
 */
@observer
export default class HudTracks extends Component<HudTracksProps> {
  render(): ReactNode {
    const game = this.props.ingame.game;
    const icons = [
      stoneThroneImage,
      game.valyrianSteelBladeUsed ? diamondHiltUsedImage : diamondHiltImage,
      ravenImage
    ];
    const tooltips = [
      tr("auto.HouseInfoColumn.4"),
      <>
        {tr("auto.HouseInfoColumn.5")}
        {game.valyrianSteelBladeUsed
          ? t("auto.HouseInfoColumn.6")
          : t("auto.HouseInfoColumn.7")}
      </>,
      tr("auto.HouseInfoColumn.8")
    ];

    // Quem tem a ficha de cada trilha. Normalmente é o 1º colocado, mas com
    // vassalos (ou cartas que trocam o dono) pode ser outro, então
    // perguntamos ao jogo em vez de supor.
    const holderOf = (get: () => House): House | null => {
      try {
        return get();
      } catch {
        // durante o draft ainda não há dono
        return null;
      }
    };
    const holders = [
      holderOf(() => game.ironThroneHolder),
      holderOf(() => game.valyrianSteelBladeHolder),
      holderOf(() => game.ravenHolder)
    ];

    return (
      <div
        className={classNames("hud-tracks", {
          "hud-panel": !this.props.vertical,
          vertical: this.props.vertical
        })}
        aria-label={t("hud.tracks.title")}
      >
        {this.props.tracks.map((track, i) => (
          <div className="hud-track" key={`hud-track-${i}`}>
            <OverlayTrigger
              placement={this.props.vertical ? "right" : "bottom"}
              overlay={
                <Tooltip
                  id={`hud-track-tooltip-${i}`}
                  className="tooltip-w-100"
                >
                  <b>{track.name}</b>
                  <br />
                  {tooltips[i]}
                </Tooltip>
              }
            >
              <span className="hud-track-label">
                <img src={icons[i]} width={20} height={20} alt="" />
                <span className="hud-track-name">{track.name}</span>
              </span>
            </OverlayTrigger>
            <span className="hud-track-houses">
              {track.trackToShow.map((h, j) => (
                <span className="hud-track-slot" key={`hud-track-${i}-${j}`}>
                  {h && h == holders[i] && (
                    <img
                      className="hud-track-holder"
                      src={icons[i]}
                      alt=""
                      aria-hidden="true"
                    />
                  )}
                  {h ? (
                    <HouseChip
                      house={h}
                      size={this.props.vertical ? 28 : 24}
                      mine={h == this.props.myHouse}
                      tooltip={
                        <>
                          <b>{h.name}</b>
                          <br />
                          {t("hud.tracks.position", { n: j + 1 })}
                          {h == holders[i] && (
                            <>
                              <br />
                              {t(
                                i == 0
                                  ? "hud.tracks.holderThrone"
                                  : i == 1
                                    ? "hud.tracks.holderBlade"
                                    : "hud.tracks.holderRaven"
                              )}
                            </>
                          )}
                        </>
                      }
                    />
                  ) : (
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id={`hud-track-open-${i}-${j}`}>
                          {t("hud.tracks.openSlot")}
                        </Tooltip>
                      }
                    >
                      <span className="hud-track-open">?</span>
                    </OverlayTrigger>
                  )}
                  {track.stars && (
                    <span
                      className={classNames("hud-track-stars", {
                        empty: !game.starredOrderRestrictions[j]
                      })}
                      aria-label={t("hud.tracks.stars", {
                        n: game.starredOrderRestrictions[j] ?? 0
                      })}
                    >
                      {_.repeat("★", game.starredOrderRestrictions[j] ?? 0)}
                    </span>
                  )}
                  {this.props.vertical && (
                    <span className="hud-track-pos" aria-hidden="true">
                      {j + 1}º
                    </span>
                  )}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    );
  }
}
