import BetterMap from "../../../../utils/BetterMap";
import IngameGameState from "../../IngameGameState";
import House from "../House";
import { dataText } from "../../../dataText";

export class ObjectiveCard {
    id: string;
    // Original (English) texts. Use name/description, translated on the client.
    nameEn: string;
    descriptionEn: string;
    victoryPointsPerHouse: BetterMap<string, number> = new BetterMap();
    completedCondition: (house: House, ingame: IngameGameState) => boolean;

    constructor(id: string, name: string, description: string, victoryPointsPerHouse: [string, number][], completedCondition: (house: House, ingame: IngameGameState) => boolean) {
        this.id = id;
        this.nameEn = name;
        this.descriptionEn = description;
        victoryPointsPerHouse.forEach(([h, vp]) => this.victoryPointsPerHouse.set(h, vp));
        this.completedCondition = completedCondition;
    }

    get name(): string {
        return dataText("objective.name", this.id, this.nameEn);
    }

    get description(): string {
        return dataText("objective.description", this.id, this.descriptionEn);
    }

    getVictoryPointsForHouse(house: House): number {
        return this.victoryPointsPerHouse.has(house.id) ? this.victoryPointsPerHouse.get(house.id) : 0;
    }

    canScoreObjective(house: House, ingame: IngameGameState): boolean {
        return this.completedCondition(house, ingame);
    }
}

export class SpecialObjectiveCard {
    id: string;
    houseId: string;
    completedConditions: (house: House, ingame: IngameGameState) => boolean;

    constructor(id: string, houseId: string, completedConditions: (house: House, ingame: IngameGameState) => boolean) {
        this.id = id;
        this.houseId = houseId;
        this.completedConditions = completedConditions;
    }

    canScoreObjective(house: House, ingame: IngameGameState): boolean {
        return this.houseId == house.id && this.completedConditions(house, ingame);
    }
}