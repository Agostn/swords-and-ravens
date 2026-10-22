import BetterMap from "../utils/BetterMap";
import crowKillers from "../../public/images/wildling-cards/CrowKillersLarge.png";
import hordeDescends from "../../public/images/wildling-cards/HordeDescendsLarge.png";
import kingBeyond from "../../public/images/wildling-cards/KingBeyondLarge.png";
import mammoth from "../../public/images/wildling-cards/Mammothlarge.png";
import milkwater from "../../public/images/wildling-cards/MilkwaterLarge.png";
import preemptive from "../../public/images/wildling-cards/PreemptiveLarge.png";
import rattleshirt from "../../public/images/wildling-cards/RattleshirtLarge.png";
import silence from "../../public/images/wildling-cards/SilenceLarge.png";
import skinChangerLarge from "../../public/images/wildling-cards/SkinchangerLarge.png";


const wildlingCardImages = new BetterMap([
    ["massing-on-the-milkwater", milkwater],
    ["a-king-beyond-the-wall", kingBeyond],
    ["mammoth-riders", mammoth],
    ["crow-killers", crowKillers],
    ["the-horde-descends", hordeDescends],
    ["skinchanger-scout", skinChangerLarge],
    ["rattleshirts-raiders", rattleshirt],
    ["silence-at-the-wall", silence],
    ["preemptive-raid", preemptive]
]);

// --- imagens em PT-BR (gerado por tools/cards/wire.py) ---
import { localizeImages } from "./i18n/localizedImages";
import crowKillers_ptBR from "../../public/images/pt-BR/wildling-cards/CrowKillersLarge.png";
import hordeDescends_ptBR from "../../public/images/pt-BR/wildling-cards/HordeDescendsLarge.png";
import kingBeyond_ptBR from "../../public/images/pt-BR/wildling-cards/KingBeyondLarge.png";
import mammoth_ptBR from "../../public/images/pt-BR/wildling-cards/Mammothlarge.png";
import milkwater_ptBR from "../../public/images/pt-BR/wildling-cards/MilkwaterLarge.png";
import preemptive_ptBR from "../../public/images/pt-BR/wildling-cards/PreemptiveLarge.png";
import rattleshirt_ptBR from "../../public/images/pt-BR/wildling-cards/RattleshirtLarge.png";
import silence_ptBR from "../../public/images/pt-BR/wildling-cards/SilenceLarge.png";
import skinChangerLarge_ptBR from "../../public/images/pt-BR/wildling-cards/SkinchangerLarge.png";

const wildlingCardImagesLocalized = localizeImages(wildlingCardImages, new Map<string, string>([
  [crowKillers, crowKillers_ptBR],
  [hordeDescends, hordeDescends_ptBR],
  [kingBeyond, kingBeyond_ptBR],
  [mammoth, mammoth_ptBR],
  [milkwater, milkwater_ptBR],
  [preemptive, preemptive_ptBR],
  [rattleshirt, rattleshirt_ptBR],
  [silence, silence_ptBR],
  [skinChangerLarge, skinChangerLarge_ptBR]
]));

export default wildlingCardImagesLocalized;
