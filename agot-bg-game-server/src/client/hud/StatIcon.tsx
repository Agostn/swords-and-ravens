import * as React from "react";

import castleImage from "../../../public/images/icons/castle.svg";
import crownImage from "../../../public/images/icons/crown.svg";
import barrelImage from "../../../public/images/icons/barrel.svg";

export type StatKind = "vp" | "power" | "supply" | "cards";

const STAT_ICONS: Record<Exclude<StatKind, "cards">, string> = {
  vp: castleImage,
  power: crownImage,
  supply: barrelImage
};

// Ícone de carta (desenhado aqui; não há um pronto nas imagens do jogo)
function CardIcon(): JSX.Element {
  return (
    <svg
      className="hud-stat-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="2.5"
        width="14"
        height="19"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 7l2.2 5L12 17l-2.2-5z" fill="currentColor" />
    </svg>
  );
}

export default function StatIcon({ kind }: { kind: StatKind }): JSX.Element {
  if (kind == "cards") return <CardIcon />;
  return (
    <img
      className="hud-stat-icon"
      src={STAT_ICONS[kind]}
      width={14}
      height={14}
      alt=""
    />
  );
}

