import WesterosGameState from "../../westeros-game-state/WesterosGameState";
import { dataText } from "../../../dataText";

export default abstract class WesterosCardType {
    id: string;
    // Original (English) texts. Use name/description/shortDescription, translated on the client.
    nameEn: string;
    descriptionEn: string;
    wildlingStrength: number;
    shortDescriptionEn: string;
    loyaltyTokenRegions: string[];
    choosableLoyaltyTokenRegions: string[];

    constructor(id: string, name: string, description: string, shortDescription: string, wildlingStrength = 0,
        loyaltyTokenRegions: string[] = [], choosableLoyaltyTokenRegions: string[] = []) {
        this.id = id;
        this.nameEn = name;
        this.descriptionEn = description;
        this.shortDescriptionEn = shortDescription;
        this.wildlingStrength = wildlingStrength;
        this.loyaltyTokenRegions = loyaltyTokenRegions;
        this.choosableLoyaltyTokenRegions = choosableLoyaltyTokenRegions;
    }

    get name(): string {
        return dataText("westeros.name", this.id, this.nameEn);
    }

    get description(): string {
        return dataText("westeros.description", this.id, this.descriptionEn);
    }

    get shortDescription(): string {
        return dataText("westeros.shortDescription", this.id, this.shortDescriptionEn);
    }

    abstract execute(westerosGameState: WesterosGameState): void;

    placeLoyaltyTokens(westerosGameState: WesterosGameState): void {
        if (this.loyaltyTokenRegions.length == 0) {
            return;
        }

        const regions = this.loyaltyTokenRegions.map(rid => westerosGameState.world.regions.get(rid));
        regions.forEach(r => westerosGameState.placeLoyaltyToken(r));
    }

    executeImmediately(_westerosGameState: WesterosGameState, _currentDeckI: number): void {
        return;
    }
}
