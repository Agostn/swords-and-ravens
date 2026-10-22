import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import classNames from "classnames";
import * as _ from "lodash";

import PlaceOrdersGameState from "../../common/ingame-game-state/planning-game-state/place-orders-game-state/PlaceOrdersGameState";
import House from "../../common/ingame-game-state/game-data-structure/House";
import orderImages from "../orderImages";
import OrderType from "../../common/ingame-game-state/game-data-structure/order-types/OrderType";
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
  private renderToken(g: {
    restricted: boolean;
    type: OrderType;
    total: number;
    left: number;
  }): ReactNode {
    return (
      <OverlayTrigger
        key={`hud-order-${g.type.id}`}
        placement="top"
        overlay={
          <Tooltip id={`hud-order-tip-${g.type.id}`}>
            <b>{g.type.name}</b>
            {g.type.starred && <> ({t("hud.orders.special")})</>}
            <br />
            {t("hud.orders.left", { n: g.left, total: g.total })}
            {g.restricted && (
              <>
                <br />
                {t("hud.orders.restricted")}
              </>
            )}
          </Tooltip>
        }
      >
        <span
          className={classNames("hud-order-token", {
            used: g.left == 0,
            restricted: g.restricted
          })}
        >
          <span
            className="order-icon hud-order-img"
            style={{ backgroundImage: `url(${orderImages.get(g.type.id)})` }}
          />
          <span className="hud-order-count">×{g.left}</span>
        </span>
      </OverlayTrigger>
    );
  }

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

    // Cartas de Westeros desta rodada que proíbem tipos de ordem
    // (ex.: "Chuvas de Outono" proíbe Marcha +1)
    const restrictions = placeOrders.parentGameState.planningRestrictions;

    const groups = _.uniqBy(all, (o) => o.type.id).map((o) => ({
      restricted: restrictions.some((r) => r.restriction(o.type)),
      type: o.type,
      total: all.filter((x) => x.type.id == o.type.id).length,
      left: available.filter((x) => x.type.id == o.type.id).length
    }));

    // Cada Casa tem 3 fichas de cada tipo de ordem (2 comuns + 1 especial ★).
    // As fichas ficam juntas por tipo (Marcha, Defesa, Apoio, Consolidar
    // Poder, Incursão) para isso ficar claro.
    // (compara a classe da ordem, não o nome: no build de produção os
    // nomes das classes são encurtados e podem se repetir)
    const familyList: {
      key: string;
      members: typeof groups;
      total: number;
      left: number;
    }[] = [];
    groups.forEach((g) => {
      const family = familyList.find(
        (f) => f.members[0].type.constructor == g.type.constructor
      );
      if (family) {
        family.members.push(g);
        family.total += g.total;
        family.left += g.left;
      } else {
        familyList.push({
          key: g.type.id,
          members: [g],
          total: g.total,
          left: g.left
        });
      }
    });

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
          {familyList.map((f) => (
            <div className="hud-order-family" key={`hud-family-${f.key}`}>
              <div className="hud-order-family-tokens">
                {f.members.map((g) => this.renderToken(g))}
              </div>
              <span className="hud-order-family-count">
                {t("hud.orders.familyLeft", { n: f.left, total: f.total })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
