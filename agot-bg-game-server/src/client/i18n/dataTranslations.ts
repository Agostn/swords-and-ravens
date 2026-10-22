import { DataTextKind, setDataTextTranslator } from "../../common/dataText";
import { getLanguage } from "./i18n";
import ptBRData from "./locales/data-pt-BR";

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
}

const dictionaries: { [lang: string]: DataDictionary } = {
  "pt-BR": ptBRData
};

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
    default:
      return text;
  }
}

export function installDataTranslations(): void {
  setDataTextTranslator(translateDataText);
}
