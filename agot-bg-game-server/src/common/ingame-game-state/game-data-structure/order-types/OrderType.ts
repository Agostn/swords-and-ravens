import RegionKind from "../RegionKind";
import { dataText } from "../../../dataText";

export default abstract class OrderType {
    id: string;
    // Nome original (inglês). Use `name`, que já vem traduzido.
    nameEn: string;
    starred: boolean;
    restrictedTo: RegionKind | null;

    constructor(id: string, name: string, starred: boolean) {
        this.id = id;
        this.nameEn = name;
        this.starred = starred;
        this.restrictedTo = null;
    }

    get name(): string {
        return dataText("order.name", this.id, this.nameEn);
    }
}
