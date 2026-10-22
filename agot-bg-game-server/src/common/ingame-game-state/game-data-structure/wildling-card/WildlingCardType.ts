import WildlingsAttackGameState from "../../westeros-game-state/wildlings-attack-game-state/WildlingsAttackGameState";
import { dataText } from "../../../dataText";

export default abstract class WildlingCardType {
    id: string;
    // Original (English) texts. Use the getters below, translated on the client.
    nameEn: string;
    lowestBidderDescriptionEn: string;
    everybodyElseDescriptionEn: string;
    nightsWatchDescriptionEn: string;

    constructor(id: string, name: string, wildlingVictoryLowestBidderDescription: string, wildlingVictoryEverybodyElseDescription: string, nightsWatchDescription: string) {
        this.id = id;
        this.nameEn = name;
        this.lowestBidderDescriptionEn = wildlingVictoryLowestBidderDescription;
        this.everybodyElseDescriptionEn = wildlingVictoryEverybodyElseDescription;
        this.nightsWatchDescriptionEn = nightsWatchDescription;
    }

    get name(): string {
        return dataText("wildling.name", this.id, this.nameEn);
    }

    get wildlingVictoryLowestBidderDescription(): string {
        return dataText("wildling.lowest", this.id, this.lowestBidderDescriptionEn);
    }

    get wildlingVictoryEverybodyElseDescription(): string {
        return dataText("wildling.everyone", this.id, this.everybodyElseDescriptionEn);
    }

    get nightsWatchDescription(): string {
        return dataText("wildling.nightsWatch", this.id, this.nightsWatchDescriptionEn);
    }

    abstract executeWildlingWon(wildlingsAttack: WildlingsAttackGameState): void;
    abstract executeNightsWatchWon(wildlingsAttack: WildlingsAttackGameState): void;
}
