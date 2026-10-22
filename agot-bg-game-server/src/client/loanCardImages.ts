import BetterMap from "../utils/BetterMap";
import customsOfficer from "../../public/images/loan-cards/CustomsOfficer.png";
import expertArtificer from "../../public/images/loan-cards/ExpertArtificer.png";
import fullHost from "../../public/images/loan-cards/FullHost.png";
import loyalMaester from "../../public/images/loan-cards/LoyalMaester.png";
import masterAtArms from "../../public/images/loan-cards/MasterAtArms.png";
import pyromancer from "../../public/images/loan-cards/Pyromancer.png";
import savvySteward from "../../public/images/loan-cards/SavvySteward.png";
import seaRaiders from "../../public/images/loan-cards/SeaRaiders.png";
import siegeEngineers from "../../public/images/loan-cards/SiegeEngineers.png";
import spymaster from "../../public/images/loan-cards/Spymaster.png";
import theFacelessMen from "../../public/images/loan-cards/TheFacelessMen.png";
import vanguardCavalry from "../../public/images/loan-cards/VanguardCavalry.png";
import loanCardBack from "../../public/images/loan-cards/LoanCardBack.png";


const loanCardImages = new BetterMap([
    ["customs-officer", customsOfficer],
    ["expert-artificer", expertArtificer],
    ["full-host", fullHost],
    ["loyal-maester", loyalMaester],
    ["master-at-arms", masterAtArms],
    ["pyromancer", pyromancer],
    ["savvy-steward", savvySteward],
    ["sea-raiders", seaRaiders],
    ["siege-engineers", siegeEngineers],
    ["spymaster", spymaster],
    ["the-faceless-men", theFacelessMen],
    ["vanguard-cavalry", vanguardCavalry],
    ["back", loanCardBack]
]);

// --- imagens em PT-BR (gerado por tools/cards/wire.py) ---
import { localizeImages } from "./i18n/localizedImages";
import customsOfficer_ptBR from "../../public/images/pt-BR/loan-cards/CustomsOfficer.png";
import expertArtificer_ptBR from "../../public/images/pt-BR/loan-cards/ExpertArtificer.png";
import fullHost_ptBR from "../../public/images/pt-BR/loan-cards/FullHost.png";
import loyalMaester_ptBR from "../../public/images/pt-BR/loan-cards/LoyalMaester.png";
import masterAtArms_ptBR from "../../public/images/pt-BR/loan-cards/MasterAtArms.png";
import pyromancer_ptBR from "../../public/images/pt-BR/loan-cards/Pyromancer.png";
import savvySteward_ptBR from "../../public/images/pt-BR/loan-cards/SavvySteward.png";
import seaRaiders_ptBR from "../../public/images/pt-BR/loan-cards/SeaRaiders.png";
import siegeEngineers_ptBR from "../../public/images/pt-BR/loan-cards/SiegeEngineers.png";
import spymaster_ptBR from "../../public/images/pt-BR/loan-cards/Spymaster.png";
import theFacelessMen_ptBR from "../../public/images/pt-BR/loan-cards/TheFacelessMen.png";
import vanguardCavalry_ptBR from "../../public/images/pt-BR/loan-cards/VanguardCavalry.png";

const loanCardImagesLocalized = localizeImages(loanCardImages, new Map<string, string>([
  [customsOfficer, customsOfficer_ptBR],
  [expertArtificer, expertArtificer_ptBR],
  [fullHost, fullHost_ptBR],
  [loyalMaester, loyalMaester_ptBR],
  [masterAtArms, masterAtArms_ptBR],
  [pyromancer, pyromancer_ptBR],
  [savvySteward, savvySteward_ptBR],
  [seaRaiders, seaRaiders_ptBR],
  [siegeEngineers, siegeEngineers_ptBR],
  [spymaster, spymaster_ptBR],
  [theFacelessMen, theFacelessMen_ptBR],
  [vanguardCavalry, vanguardCavalry_ptBR]
]));

export default loanCardImagesLocalized;
