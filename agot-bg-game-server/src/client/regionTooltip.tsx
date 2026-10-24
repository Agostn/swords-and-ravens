import _ from "lodash";
import React from "react";
import { Tooltip } from "react-bootstrap";
import { OverlayChildren } from "react-bootstrap/esm/Overlay";
import Region from "../common/ingame-game-state/game-data-structure/Region";
import classNames from "classnames";
import unitImages from "./unitImages";
import barrelImage from "../../public/images/region-modifications/Barrel.png";
import crownImage from "../../public/images/region-modifications/Crown.png";
import housePowerTokensImages from "./housePowerTokensImages";
import loyaltyTokenImage from "../../public/images/power-tokens/Loyalty.png";
import { t, tr } from "./i18n/i18n";
import DefenseOrderType from "../common/ingame-game-state/game-data-structure/order-types/DefenseOrderType";
import SupportOrderType from "../common/ingame-game-state/game-data-structure/order-types/SupportOrderType";
import RegionKind from "../common/ingame-game-state/game-data-structure/RegionKind";
import Unit from "../common/ingame-game-state/game-data-structure/Unit";

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

  return (
    <div className="region-tip-strength">
      <div className="region-tip-total">
        <span>{t("map.strength.defenseLabel")}</span>
        <b>{defense}</b>
      </div>
      {(region.garrison > 0 || defenseBonus > 0) && (
        <div className="region-tip-pills">
          {region.garrison > 0 && (
            <span className="region-tip-pill">
              {t("map.strength.garrisonPill", { n: region.garrison })}
            </span>
          )}
          {defenseBonus > 0 && (
            <span className="region-tip-pill">
              {t("map.strength.defensePill", { n: defenseBonus })}
            </span>
          )}
        </div>
      )}
      {attackingCastle != unitsStrength && (
        <div className="region-tip-line">
          {t("map.strength.attackCastleShort", { n: attackingCastle })}
        </div>
      )}
      {supports.length > 0 && (
        <div className="region-tip-supports">
          <span className="region-tip-label">{t("map.strength.supportLabel")}</span>
          {supports.map((s) => (
            <span
              key={`region-tip-support-${s.region.id}`}
              className="region-tip-support"
            >
              <b style={{ color: s.house?.color }}>{s.house?.name}</b> +{s.strength}
              <small> · {s.region.name}</small>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Força de combate de uma peça (para o balão da peça no mapa). */
export function renderUnitStrength(u: Unit): React.ReactNode {
  if (u.wounded) {
    return <div className="unit-tip-strength wounded">{t("map.unit.woundedNoStrength")}</div>;
  }
  const normal = u.getCombatStrength(false);
  const castle = u.getCombatStrength(true);
  return (
    <div className="unit-tip-strength">
      <span>{t("map.unit.strength")}</span> <b>{normal}</b>
      {castle != normal && (
        <small className="d-block">{t("map.unit.strengthCastle", { n: castle })}</small>
      )}
    </div>
  );
}

// Unidades da área como ícones com a quantidade ao lado (feridas à parte)
function renderUnits(region: Region): React.ReactNode {
  const units = region.units.values;
  if (units.length == 0) return null;
  const groups = _.groupBy(
    units,
    (u) => `${u.allegiance.id}|${u.upgradedType ? u.upgradedType.id : u.type.id}|${u.wounded ? "w" : ""}`
  );
  return (
    <div className="region-tip-units">
      {Object.entries(groups).map(([key, list]) => {
        const u = list[0];
        const typeId = u.upgradedType ? u.upgradedType.id : u.type.id;
        const image = unitImages.get(u.allegiance.id)?.get(typeId);
        const name = u.upgradedType ? u.upgradedType.name : u.type.name;
        const label = u.wounded ? t("map.units.wounded", { unit: name }) : name;
        return (
          <span
            key={`region-tip-unit-${region.id}-${key}`}
            className={classNames("region-tip-unit", { wounded: u.wounded })}
            title={label}
            aria-label={`${list.length} × ${label}`}
          >
            <span
              className="region-tip-unit-icon"
              style={{ backgroundImage: image ? `url(${image})` : undefined }}
              aria-hidden="true"
            />
            <b>{list.length}</b>
            <small className="region-tip-unit-str">
              {t("map.unit.eachStrength", { n: u.getCombatStrength(false) })}
            </small>
          </span>
        );
      })}
    </div>
  );
}

// Pontos de recrutamento: Castelo = 1, Fortaleza = 2 (o que vale é o nível atual,
// que cartas e melhorias podem mudar). Custos: Soldado 1, Navio 1, Cavaleiro 2,
// Máquina de cerco 2; trocar um Soldado por Cavaleiro ou Máquina custa 1.
export function renderMusterInfo(region: Region, level: number): React.ReactNode {
  if (level <= 0) return null;
  const base = region.staticRegion.castleLevel;
  return (
    <div className={classNames("region-tip-muster", { stronghold: level >= 2 })}>
      <div className="region-tip-muster-head">
        <span className="region-tip-muster-pts">
          {_.range(0, level).map((i) => (
            <i key={`mp-${region.id}-${i}`} aria-hidden="true" />
          ))}
        </span>
        <b>{t("map.muster.points", { n: level })}</b>
      </div>
      {level != base && base > 0 && (
        <small className="region-tip-muster-mod">{t("map.muster.changed", { n: base })}</small>
      )}
      <small className="region-tip-muster-costs">
        {level >= 2 ? t("map.muster.costs2") : t("map.muster.costs1")}
      </small>
    </div>
  );
}

// Balão do castelo/fortaleza no mapa (passar o mouse ou segurar o dedo em cima dele).
export function renderCastleTooltip(region: Region, visible: boolean): OverlayChildren {
  const level = visible || !region.game.ingame.fogOfWar ? region.castleLevel : region.staticRegion.castleLevel;
  return (
    <Tooltip id={`castle-${region.id}-tip`} className="tooltip-w-100 region-tip">
      <div className="text-center">
        <div className="region-tip-head">
          <b className="region-tip-name">{level >= 2 ? t("auto2.regionTooltip.3") : t("auto2.regionTooltip.2")}</b>
          <div className="region-tip-sub">
            <span>{region.name}</span>
          </div>
        </div>
        {renderMusterInfo(region, level)}
      </div>
    </Tooltip>
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
          {renderMusterInfo(region, region.staticRegion.castleLevel)}
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
    <Tooltip id={`region-${region.id}-details`} className="tooltip-w-100 region-tip">
      <div className="text-center">
        <div className="region-tip-head">
          <b className="region-tip-name">{region.name}</b>
          {(controller || region.castleLevel > 0) && (
            <div className="region-tip-sub">
              {region.castleLevel > 0 && (
                <span className="region-tip-castle">
                  {region.castleLevel == 1 ? t("auto2.regionTooltip.2") : t("auto2.regionTooltip.3")}
                </span>
              )}
              {controller && (
                <span className="region-tip-owner">
                  <span className="region-tip-dot" style={{ background: controller.color }} />
                  {controller.name}
                </span>
              )}
            </div>
          )}
        </div>
        {renderMusterInfo(region, region.castleLevel)}
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
        {renderUnits(region)}
        {renderStrength(region)}
      </div>
    </Tooltip>
  );
}
