import _ from "lodash";
import React from "react";
import { Tooltip } from "react-bootstrap";
import { OverlayChildren } from "react-bootstrap/esm/Overlay";
import Region from "../common/ingame-game-state/game-data-structure/Region";
import joinReactNodes from "./utils/joinReactNodes";
import barrelImage from "../../public/images/region-modifications/Barrel.png";
import crownImage from "../../public/images/region-modifications/Crown.png";
import housePowerTokensImages from "./housePowerTokensImages";
import loyaltyTokenImage from "../../public/images/power-tokens/Loyalty.png";
import { t, tr } from "./i18n/i18n";
import DefenseOrderType from "../common/ingame-game-state/game-data-structure/order-types/DefenseOrderType";
import SupportOrderType from "../common/ingame-game-state/game-data-structure/order-types/SupportOrderType";
import RegionKind from "../common/ingame-game-state/game-data-structure/RegionKind";

/**
 * Força da área para uma batalha, sem contar as Cartas de Casa:
 * unidades + guarnição + ordem de Defesa (se estiver visível), quanto as
 * unidades fazem atacando um castelo (máquinas de cerco) e o apoio que as
 * áreas vizinhas com ordem de Apoio podem dar.
 */
function renderStrength(region: Region): React.ReactNode {
  const units = region.units.values;
  if (units.length == 0 && region.garrison == 0) return null;
  const ingame = region.game.ingame;
  const order = ingame.ordersOnBoard.tryGet(region, null);
  const defenseBonus =
    order && order.type instanceof DefenseOrderType
      ? order.type.defenseModifier
      : 0;
  const unitsStrength = _.sum(units.map((u) => u.getCombatStrength(false)));
  const attackingCastle = _.sum(units.map((u) => u.getCombatStrength(true)));
  const defense = unitsStrength + region.garrison + defenseBonus;

  // ordens de Apoio vizinhas (no mar, só navios no mar ajudam)
  const supports = ingame.world
    .getNeighbouringRegions(region)
    .filter((n) => region.type.kind != RegionKind.SEA || n.type.kind == RegionKind.SEA)
    .map((n) => ({ region: n, order: ingame.ordersOnBoard.tryGet(n, null) }))
    .filter(({ order }) => order != null && order.type instanceof SupportOrderType)
    .map(({ region: n, order }) => {
      const bonus = (order?.type as SupportOrderType).supportModifier;
      const strength =
        _.sum(n.units.values.map((u) => u.getCombatStrength(false))) + bonus;
      return { house: n.getController(), region: n, strength };
    })
    .filter((s) => s.house != null && s.strength > 0);

  const parts: string[] = [];
  if (units.length > 0) parts.push(t("map.strength.units", { n: unitsStrength }));
  if (region.garrison > 0)
    parts.push(t("map.strength.garrison", { n: region.garrison }));
  if (defenseBonus > 0)
    parts.push(t("map.strength.defenseOrder", { n: defenseBonus }));

  return (
    <div className="region-tooltip-strength">
      <div className="region-tooltip-strength-total">
        {t("map.strength.defense", { n: defense })}
      </div>
      <small>{parts.join(" · ")}</small>
      {attackingCastle != unitsStrength && (
        <small className="d-block">
          {t("map.strength.attackCastle", { n: attackingCastle })}
        </small>
      )}
      {supports.length > 0 && (
        <small className="d-block">
          {t("map.strength.support", {
            list: supports
              .map((s) => `${s.house?.name} +${s.strength} (${s.region.name})`)
              .join(", ")
          })}
        </small>
      )}
      <small className="d-block region-tooltip-strength-note">
        {t("map.strength.note")}
      </small>
    </div>
  );
}

export function renderRegionTooltip(
  region: Region,
  forceNormalToolTip = false
): OverlayChildren {
  if (region.game.ingame.fogOfWar && !forceNormalToolTip) {
    // This tooltip only shows static data about the region,
    // and not the dynamic data (like units, garrison, etc.) that is hidden by fog of war.
    return (
      <Tooltip id={`region-${region.id}-details`} className="tooltip-w-100">
        <div className="text-center">
          <b>{region.name}</b>
          {region.staticRegion.castleLevel > 0 && (
            <>
              <br />
              {region.staticRegion.castleLevel == 1 ? t("auto2.regionTooltip.0") : t("auto2.regionTooltip.1")}
            </>
          )}
          <div className="d-flex flex-row justify-content-center mt-2">
            {_.range(0, region.staticRegion.supplyIcons).map((_, i) => {
              return (
                <div
                  key={`barrel-icon-${region.id}-${i}`}
                  className="unit-icon medium mr-1"
                  style={{ backgroundImage: `url(${barrelImage})` }}
                />
              );
            })}
            {_.range(0, region.staticRegion.crownIcons).map((_, i) => {
              return (
                <div
                  key={`crown-icon-${region.id}-${i}`}
                  className="unit-icon medium mr-1"
                  style={{ backgroundImage: `url(${crownImage})` }}
                />
              );
            })}
          </div>
        </div>
      </Tooltip>
    );
  }
  const controller = region.getController();
  const loyaltyTokenCount =
    region.loyaltyTokens > 0
      ? region.loyaltyTokens
      : region.superLoyaltyToken
        ? 1
        : 0;

  return (
    <Tooltip id={`region-${region.id}-details`} className="tooltip-w-100">
      <div className="text-center">
        <b>{region.name}</b>
        {controller && (
          <small>
            {" "}{tr("auto.regionTooltip.0", { p0: (<b>{controller.name}</b>) })}
          </small>
        )}
        {region.castleLevel > 0 && (
          <>
            <br />
            {region.castleLevel == 1 ? t("auto2.regionTooltip.2") : t("auto2.regionTooltip.3")}
          </>
        )}
        {region.superControlPowerToken &&
        region.superControlPowerToken == controller ? (
          <>
            {tr("auto.regionTooltip.1")}{region.garrison > 0 && (
              <>
                {" "}{tr("auto.regionTooltip.2", { p0: (<b>{region.garrison}</b>) })}
              </>
            )}
          </>
        ) : (
          region.garrison > 0 && (
            <>
              {tr("auto.regionTooltip.3", { p0: (!controller ? t("auto2.regionTooltip.4") : t("auto2.regionTooltip.5")), p1: (<b>{region.garrison}</b>) })}
            </>
          )
        )}
        <div className="d-flex flex-row justify-content-center mt-2">
          {_.range(0, region.supplyIcons).map((_, i) => {
            return (
              <div
                key={`barrel-icon-${region.id}-${i}`}
                className="unit-icon medium mr-1"
                style={{ backgroundImage: `url(${barrelImage})` }}
              />
            );
          })}
          {_.range(0, region.crownIcons).map((_, i) => {
            return (
              <div
                key={`crown-icon-${region.id}-${i}`}
                className="unit-icon medium mr-1"
                style={{ backgroundImage: `url(${crownImage})` }}
              />
            );
          })}
          {region.controlPowerToken && (
            <div
              className="tooltip-power-token mr-1"
              style={{
                backgroundImage: `url(${housePowerTokensImages.get(region.controlPowerToken.id)})`
              }}
            />
          )}
          {loyaltyTokenCount > 0 && (
            <div
              className="loyalty-icon"
              style={{
                backgroundImage: `url(${loyaltyTokenImage})`,
                textAlign: "center",
                fontWeight: "bold",
                fontFamily: "serif",
                fontSize: "1.5rem",
                color: "white"
              }}
            >
              {region.loyaltyTokens > 1 ? region.loyaltyTokens : ""}
            </div>
          )}
        </div>
        {renderStrength(region)}
        {region.units.size > 0 && (
          <small className="mt-2">
            {joinReactNodes(
              region.units.values.map((u, i) =>
                u.wounded ? (
                  <span key={`region-tooltip_wounded_${u.id}_${i}`}>
                    <s>{u.type.name}</s>
                  </span>
                ) : (
                  <span key={`region-tooltip_unit_${u.id}_${i}`}>
                    {u.type.name}
                  </span>
                )
              ),
              ", "
            )}
          </small>
        )}
      </div>
    </Tooltip>
  );
}
