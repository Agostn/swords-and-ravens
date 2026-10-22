import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import classNames from "classnames";
import * as _ from "lodash";

import PlaceOrdersGameState from "../../common/ingame-game-state/planning-game-state/place-orders-game-state/PlaceOrdersGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import orderImages from "../orderImages";
import { t } from "../i18n/i18n";

interface HudOrdersStripProps {
  placeOrders: PlaceOrdersGameState;
  house: House;
}

/**
 * Fase de Planejamento: mostra as fichas de ordem que ainda dá para usar
 * e quantas áreas já têm ordem. As ordens continuam sendo colocadas
 * clicando nas áreas do mapa.
 */
@observer
export default class HudOrdersStrip extends Component<HudOrdersStripProps> {
  render(): ReactNode {
    const { placeOrders, house } = this.props;
    const all = placeOrders.getOrdersList(house);
    const available = placeOrders.getAvailableOrders(house);
    const regions = placeOrders.getPossibleRegionsForOrders(house);
    const filled = regions.filter(
      (r) => placeOrders.placedOrders.tryGet(r, null) != null
    ).length;

    const game = placeOrders.ingame.game;
    const starsAllowed = game.getAllowedCountOfStarredOrders(house);
    const starsUsed = regions.filter(
      (r) => placeOrders.placedOrders.tryGet(r, null)?.type.starred
    ).length;

    const groups = _.uniqBy(all, (o) => o.type.id).map((o) => ({
      type: o.type,
      total: all.filter((x) => x.type.id == o.type.id).length,
      left: available.filter((x) => x.type.id == o.type.id).length
    }));

    return (
      <div className="hud-orders-strip">
        <div className="hud-orders-progress">
          <span>{t("hud.orders.regions")}</span>
          <b>
            {t("hud.orders.progress", { done: filled, total: regions.length })}
          </b>
          <span className="hud-meter wide" aria-hidden="true">
            <span
              className="hud-meter-fill gold"
              style={{
                width: `${regions.length ? Math.round((filled / regions.length) * 100) : 100}%`
              }}
            />
          </span>
        </div>
        <div className="hud-orders-progress">
          <span>{t("hud.orders.starred")}</span>
          <b>
            {t("hud.orders.progress", {
              done: starsUsed,
              total: starsAllowed
            })}
          </b>
        </div>
        <div className="hud-orders-tokens">
          {groups.map((g) => (
            <OverlayTrigger
              key={`hud-order-${g.type.id}`}
              placement="top"
              overlay={
                <Tooltip id={`hud-order-tip-${g.type.id}`}>
                  <b>{g.type.name}</b>
                  <br />
                  {t("hud.orders.left", { n: g.left, total: g.total })}
                </Tooltip>
              }
            >
              <span
                className={classNames("hud-order-token", { used: g.left == 0 })}
              >
                <span
                  className="order-icon hud-order-img"
                  style={{
                    backgroundImage: `url(${orderImages.get(g.type.id)})`
                  }}
                />
                <span className="hud-order-count">×{g.left}</span>
              </span>
            </OverlayTrigger>
          ))}
        </div>
      </div>
    );
  }
}
