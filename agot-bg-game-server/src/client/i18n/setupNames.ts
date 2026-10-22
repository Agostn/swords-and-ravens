import * as React from "react";
import { t, tr, TranslationKey } from "./i18n";

// Cenários conhecidos. Se um cenário novo for adicionado no futuro e ainda
// não tiver tradução, o nome original (em inglês) dos dados é usado.
const knownSetups = [
  "base-game",
  "mother-of-dragons",
  "a-dance-with-dragons",
  "a-feast-for-crows",
  "a-dance-with-mother-of-dragons",
  "struggle-in-the-north",
  "rumble-in-the-south",
  "race-to-kings-landing",
  "no-kraken-for-dinner",
  "learn-the-game"
];

function isKnownSetup(setupId: string): boolean {
  return knownSetups.includes(setupId);
}

/** Nome do cenário com o número de jogadores, ex.: "O Festim dos Corvos (4 jogadores)". */
export function getSetupName(setupId: string, fallbackName: string): string {
  return isKnownSetup(setupId)
    ? t(`setup.${setupId}` as TranslationKey)
    : fallbackName;
}

/** Nome do cenário sem o número de jogadores, ex.: "O Festim dos Corvos". */
export function getSetupShortName(
  setupId: string,
  fallbackName: string
): string {
  const name = getSetupName(setupId, fallbackName);
  const index = name.indexOf(" (");
  return index >= 0 ? name.substring(0, index) : name;
}

/** Título e descrição do cenário para a dica (tooltip) da lista de cenários. */
export function renderSetupTooltip(setupId: string): React.ReactNode {
  if (!isKnownSetup(setupId)) {
    return null;
  }
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "h5",
      null,
      tr(`setupTooltip.${setupId}.title` as TranslationKey)
    ),
    tr(`setupTooltip.${setupId}.text` as TranslationKey)
  );
}
