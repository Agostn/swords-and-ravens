import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import classNames from "classnames";
import * as _ from "lodash";

import GameClient from "../GameClient";
import IngameGameState from "../../common/ingame-game-state/IngameGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import HouseChip from "./HouseChip";
import StatIcon from "./StatIcon";
import { t } from "../i18n/i18n";

interface HudSupplyTrackProps {
  gameClient: GameClient;
  ingame: IngameGameState;
}

/**
 * Trilha de Suprimento em linhas grandes: cada nível mostra o tamanho dos
 * exércitos permitidos e as Casas que estão nele. Passar o mouse numa Casa
 * mostra quantos barris ela controla agora (a trilha só muda quando sai a
 * carta Suprimento).
 */
@observer
export default class HudSupplyTrack extends Component<HudSupplyTrackProps> {
  render(): ReactNode {
    const game = this.props.ingame.game;
    const me = this.props.gameClient.authenticatedPlayer?.house ?? null;
    const houses: House[] = this.props.gameClient.getPotentialWinners();
    const levels = _.range(game.supplyRestrictions.length - 1, -1, -1);
    const maxLevel = game.supplyRestrictions.length - 1;
    return (
      <div className="hud-supply-track">
        <div className="hud-supply-row hud-supply-head">
          <span>{t("hud.supply.level")}</span>
          <span>{t("hud.supply.armies")}</span>
          <span>{t("hud.supply.houses")}</span>
        </div>
        {levels.map((level) => {
          const here = houses.filter((h) => h.supplyLevel == level);
          return (
            <div
              key={`hud-supply-${level}`}
              className={classNames("hud-supply-row", {
                occupied: here.length > 0,
                mine: me != null && me.supplyLevel == level
              })}
            >
              <span className="hud-supply-level">
                <StatIcon kind="supply" />
                {level}
              </span>
              <span className="hud-supply-armies">
                {game.supplyRestrictions[level].map((size, i) => (
                  <span
                    key={`hud-army-${level}-${i}`}
                    className="hud-army-size"
                  >
                    {size}
                  </span>
                ))}
              </span>
              <span className="hud-supply-houses">
                {here.map((h) => {
                  const barrels = Math.min(
                    game.getControlledSupplyIcons(h),
                    maxLevel
                  );
                  return (
                    <OverlayTrigger
                      key={`hud-supply-house-${h.id}`}
                      placement="right"
                      overlay={
                        <Tooltip id={`hud-supply-tip-${h.id}`}>
                          <b>{h.name}</b>
                          <br />
                          {t("hud.stats.supply", {
                            level: h.supplyLevel,
                            barrels,
                            armies: game.getAllowedArmySizes(h).join(", ")
                          })}
                        </Tooltip>
                      }
                    >
                      <span
                        className={classNames("hud-supply-house", {
                          changes: barrels != h.supplyLevel
                        })}
                      >
                        <HouseChip house={h} size={22} mine={h == me} />
                        {barrels != h.supplyLevel && (
                          <small className="hud-supply-next">
                            {barrels > h.supplyLevel ? "▲" : "▼"}
                            {barrels}
                          </small>
                        )}
                      </span>
                    </OverlayTrigger>
                  );
                })}
              </span>
            </div>
          );
        })}
        <div className="hud-supply-note">{t("hud.supply.note")}</div>
      </div>
    );
  }
}
