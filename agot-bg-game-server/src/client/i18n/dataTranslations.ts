import { DataTextKind, setDataTextTranslator } from "../../common/dataText";
import { getLanguage } from "./i18n";
import ptBRData from "./locales/data-pt-BR";
import cardsPtBR, { CardTexts } from "./locales/data-cards-pt-BR";

/**
 * Tradução dos textos que vêm dos dados do jogo (lugares, unidades, ordens).
 * Chamado uma vez quando o cliente inicia (client.tsx).
 */

export interface DataDictionary {
  /** Lugares do mapa, pela grafia original em inglês. */
  regions: { [englishName: string]: string };
  /** Formato do nome dos portos, ex.: "Porto de {region}". */
  portFormat: string;
  /** Portos com nome especial, pela grafia original em inglês. */
  ports: { [englishName: string]: string };
  /** Unidades, pelo id. */
  unitNames: { [id: string]: string };
  unitDescriptions: { [id: string]: string };
  /** Ordens, pelo id. */
  orderNames: { [id: string]: string };
  /** Trilhas de Influência, pela posição (0, 1, 2). */
  trackNames: { [index: string]: string };
  /** Textos das cartas. */
  cards: CardTexts;
}

const dictionaries: { [lang: string]: DataDictionary } = {
  "pt-BR": { ...ptBRData, cards: cardsPtBR }
};

// Nomes de cartas trazem espaços inquebráveis (\xa0) em alguns lugares.
function normalize(text: string): string {
  return text.replace(/\u00a0/g, " ");
}

const PORT_PREFIX = "Port of ";

function translateRegion(dict: DataDictionary, name: string): string {
  if (dict.regions[name] != undefined) {
    return dict.regions[name];
  }
  if (name.startsWith(PORT_PREFIX)) {
    if (dict.ports[name] != undefined) {
      return dict.ports[name];
    }
    const land = name.substring(PORT_PREFIX.length);
    return dict.portFormat.replace("{region}", translateRegion(dict, land));
  }
  return name;
}

export function translateDataText(
  kind: DataTextKind,
  id: string,
  text: string
): string {
  // getLanguage() lê um observable do mobx: quem usa esses nomes é
  // atualizado automaticamente quando o idioma muda.
  const dict = dictionaries[getLanguage()];
  if (!dict) {
    return text;
  }
  switch (kind) {
    case "region":
      return translateRegion(dict, text);
    case "unit.name":
      return dict.unitNames[id] ?? text;
    case "unit.description":
      return dict.unitDescriptions[id] ?? text;
    case "order.name":
      return dict.orderNames[id] ?? text;
    case "houseCard.name":
      return dict.cards.houseCardNames[normalize(text)] ?? text;
    case "houseCardAbility.description":
      return dict.cards.houseCardAbilities[id] ?? text;
    case "westeros.name":
      return dict.cards.westeros[id]?.name ?? text;
    case "westeros.description":
      return dict.cards.westeros[id]?.description ?? text;
    case "westeros.shortDescription":
      // descrição curta vazia continua vazia
      return text == ""
        ? text
        : (dict.cards.westeros[id]?.shortDescription ?? text);
    case "wildling.name":
      return dict.cards.wildling[id]?.name ?? text;
    case "wildling.lowest":
      return dict.cards.wildling[id]?.lowest ?? text;
    case "wildling.everyone":
      return dict.cards.wildling[id]?.everyone ?? text;
    case "wildling.nightsWatch":
      return dict.cards.wildling[id]?.nightsWatch ?? text;
    case "loan.name":
      return dict.cards.loan[id]?.name ?? text;
    case "loan.description":
      return dict.cards.loan[id]?.description ?? text;
    case "objective.name":
      return dict.cards.objective[id]?.name ?? text;
    case "objective.description":
      return dict.cards.objective[id]?.description ?? text;
    case "track.name":
      return dict.trackNames[id] ?? text;
    default:
      return text;
  }
}

export function installDataTranslations(): void {
  setDataTextTranslator(translateDataText);
}
