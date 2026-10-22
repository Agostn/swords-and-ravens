import RegionKind from "./RegionKind";
import { dataText } from "../../dataText";

export default class UnitType {
    id: string;
    // Textos originais (inglês). Use `name`/`description`, que já vêm traduzidos.
    nameEn: string;
    descriptionEn: string;
    combatStrength: number;
    combatStrengthOnAttackStructure: number | null;
    walksOn: RegionKind;
    canTransport: RegionKind | null;
    canRetreat: boolean;
    visibilityRange: number;

    constructor(
        id: string,
        name: string,
        description: string,
        walksOn: RegionKind,
        combatStrength: number,
        combatStrengthOnAttackStructure: number | null = null,
        canTransport: RegionKind | null = null,
        canRetreat = true,
        visibilityRange = 1
    ) {
        this.id = id;
        this.nameEn = name;
        this.descriptionEn = description;
        this.walksOn = walksOn;
        this.canTransport = canTransport;
        this.combatStrength = combatStrength;
        this.combatStrengthOnAttackStructure = combatStrengthOnAttackStructure;
        this.canRetreat = canRetreat;
        this.visibilityRange = visibilityRange;
    }

    get name(): string {
        return dataText("unit.name", this.id, this.nameEn);
    }

    get description(): string {
        return dataText("unit.description", this.id, this.descriptionEn);
    }
}
