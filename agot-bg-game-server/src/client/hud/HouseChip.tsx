import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import classNames from "classnames";

import House from "../../common/ingame-game-state/game-data-structure/House";
import houseIconImages from "../houseIconImages";

interface HouseChipProps {
  house: House;
  size?: number;
  mine?: boolean;
  tooltip?: ReactNode;
}

// Cor do brasão: escuro sobre cor clara (Stark), branco sobre cor escura.
export function isLightColor(color: string): boolean {
  const hex = color.replace("#", "");
  if (hex.length != 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

/** Círculo com a cor e o brasão da Casa. */
@observer
export default class HouseChip extends Component<HouseChipProps> {
  render(): ReactNode {
    const { house, mine } = this.props;
    const size = this.props.size ?? 28;
    const chip = (
      <span
        className={classNames("hud-house-chip-circle", { mine })}
        style={{
          width: size,
          height: size,
          backgroundColor: house.color
        }}
      >
        {houseIconImages.has(house.id) && (
          <img
            src={houseIconImages.get(house.id)}
            alt={house.name}
            style={{
              width: Math.round(size * 0.66),
              height: Math.round(size * 0.66),
              filter: isLightColor(house.color)
                ? "brightness(0)"
                : "brightness(0) invert(1)"
            }}
          />
        )}
      </span>
    );

    if (!this.props.tooltip) return chip;

    return (
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip id={`house-chip-${house.id}-${size}`}>
            {this.props.tooltip}
          </Tooltip>
        }
      >
        {chip}
      </OverlayTrigger>
    );
  }
}
