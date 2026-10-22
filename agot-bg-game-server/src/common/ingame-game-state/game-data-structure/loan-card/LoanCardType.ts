import ResolveSingleConsolidatePowerGameState from "../../action-game-state/resolve-consolidate-power-game-state/resolve-single-consolidate-power-game-state/ResolveSingleConsolidatePowerGameState";
import House from "../House";
import { dataText } from "../../../dataText";

export default abstract class LoanCardType {
  id: string;
  // Original (English) texts. Use name/description, translated on the client.
  nameEn: string;
  descriptionEn: string;

  constructor(id: string, name: string, description: string) {
    this.id = id;
    this.nameEn = name;
    this.descriptionEn = description;
  }

  get name(): string {
    return dataText("loan.name", this.id, this.nameEn);
  }

  get description(): string {
    return dataText("loan.description", this.id, this.descriptionEn);
  }

  abstract execute(
    resolveSingleConsolidate: ResolveSingleConsolidatePowerGameState,
    house: House
  ): void;
}
