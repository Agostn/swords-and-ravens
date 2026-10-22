// Ferramenta temporária: exporta os textos das cartas para JSON (stdout).
import "./common/EntireGame";
import { westerosCardTypes } from "./common/ingame-game-state/game-data-structure/westeros-card/westerosCardTypes";
import wildlingCardTypes from "./common/ingame-game-state/game-data-structure/wildling-card/wildlingCardTypes";
import loanCardTypes from "./common/ingame-game-state/game-data-structure/loan-card/loanCardTypes";
import houseCardAbilities from "./common/ingame-game-state/game-data-structure/house-card/houseCardAbilities";
import { objectiveCards } from "./common/ingame-game-state/game-data-structure/static-data-structure/objectiveCards";
import baseGameData from "../data/baseGameData.json";

const out: any = { westeros: {}, wildling: {}, loan: {}, ability: {}, objective: {}, houseCard: {} };
westerosCardTypes.values.forEach((c) => (out.westeros[c.id] = { name: c.name, description: c.description, shortDescription: c.shortDescription }));
wildlingCardTypes.values.forEach((c) => (out.wildling[c.id] = { name: c.name, lowest: c.wildlingVictoryLowestBidderDescription, everyone: c.wildlingVictoryEverybodyElseDescription, nightsWatch: c.nightsWatchDescription }));
loanCardTypes.values.forEach((c) => (out.loan[c.id] = { name: c.name, description: c.description }));
houseCardAbilities.values.forEach((a) => (out.ability[a.id] = { description: a.description }));
objectiveCards.values.forEach((c) => (out.objective[c.id] = { name: c.name, description: c.description }));
const data: any = baseGameData;
const collect = (container: any) => {
  Object.values(container).forEach((h: any) => {
    Object.entries(h.houseCards || {}).forEach(([id, hc]: [string, any]) => (out.houseCard[id] = hc.name));
  });
};
collect(data.houses);
["adwdHouseCards", "ffcHouseCards", "modAHouseCards", "modBHouseCards", "asosHouseCards", "firstEditionHouseCards"].forEach((k) => collect(data[k]));
console.log(JSON.stringify(out, null, 1));
