import westerosImage from "../../public/images/westeros.jpg";
import westeros7pImage from "../../public/images/westeros-7p.jpg";
import westerosWithEssosImage from "../../public/images/westeros-with-essos.jpg";
import ffcEyrieWithPortImage from "../../public/images/ffc-eyrie-with-port.jpg";
import westerosImage_ptBR from "../../public/images/pt-BR/westeros.jpg";
import westeros7pImage_ptBR from "../../public/images/pt-BR/westeros-7p.jpg";
import westerosWithEssosImage_ptBR from "../../public/images/pt-BR/westeros-with-essos.jpg";
import ffcEyrieWithPortImage_ptBR from "../../public/images/pt-BR/ffc-eyrie-with-port.jpg";
import { getLanguage } from "./i18n/i18n";

// Mapas com os nomes dos lugares em português (gerados por tools/cards/mapdata.py).
const ptBR = new Map<string, string>([
  [westerosImage, westerosImage_ptBR],
  [westeros7pImage, westeros7pImage_ptBR],
  [westerosWithEssosImage, westerosWithEssosImage_ptBR],
  [ffcEyrieWithPortImage, ffcEyrieWithPortImage_ptBR]
]);

export function localizeMapImage(original: string): string {
  return getLanguage() == "pt-BR" ? (ptBR.get(original) ?? original) : original;
}

export { westerosImage, westeros7pImage, westerosWithEssosImage, ffcEyrieWithPortImage };
