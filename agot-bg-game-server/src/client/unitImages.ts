import BetterMap from "../utils/BetterMap";
import {dragon, footman, knight, ship, siegeEngine} from "../common/ingame-game-state/game-data-structure/unitTypes";

// Peças antigas (silhuetas com textura de pedra)
import baraFoot from "../../public/images/units/BarathFoot.png";
import baraKnight from "../../public/images/units/BarathKnight.png";
import baraSiege from "../../public/images/units/BarathSeige.png";
import baraShip from "../../public/images/units/BarathShip.png";
import boltFoot from "../../public/images/units/BoltonFoot.png";
import boltKnight from "../../public/images/units/BoltonKnight.png";
import boltSiege from "../../public/images/units/BoltonSiege.png";
import boltShip from "../../public/images/units/BoltonShip.png";
import lannFoot from "../../public/images/units/LanFoot.png";
import lannKnight from "../../public/images/units/LanKnight.png";
import lannSiege from "../../public/images/units/LanSeige.png";
import lannShip from "../../public/images/units/LanShip.png";
import starFoot from "../../public/images/units/StarFoot.png";
import starKnight from "../../public/images/units/StarKnight.png";
import starSiege from "../../public/images/units/StarSeige.png";
import starShip from "../../public/images/units/StarShip.png";
import greyFoot from "../../public/images/units/GreyFoot.png";
import greyKnight from "../../public/images/units/GreyKnight.png";
import greySiege from "../../public/images/units/GreySeige.png";
import greyShip from "../../public/images/units/GreyShip.png";
import martFoot from "../../public/images/units/MartFoot.png";
import martKnight from "../../public/images/units/MartKnight.png";
import martSiege from "../../public/images/units/MartSeige.png";
import martShip from "../../public/images/units/MartShip.png";
import tyrFoot from "../../public/images/units/TyrFoot.png";
import tyrKnight from "../../public/images/units/TyrKnight.png";
import tyrSiege from "../../public/images/units/TyrSeige.png";
import tyrShip from "../../public/images/units/TyrShip.png";
import arrFoot from "../../public/images/units/ArrynFoot.png";
import arrKnight from "../../public/images/units/ArrynKnight.png";
import arrSiege from "../../public/images/units/ArrynSiege.png";
import arrShip from "../../public/images/units/ArrynShip.png";
import targShip from "../../public/images/units/TargShip.png";
import targFoot from "../../public/images/units/TargFoot.png";
import targKnight from "../../public/images/units/TargKnight.png";
import targDragon from "../../public/images/units/TargDragon.png";
import baraDragon from "../../public/images/units/BaraDragon.png";
import lannDragon from "../../public/images/units/LannDragon.png";
import starDragon from "../../public/images/units/StarDragon.png";
import boltDragon from "../../public/images/units/BoltDragon.png";
import greyDragon from "../../public/images/units/GreyDragon.png";
import martDragon from "../../public/images/units/MartDragon.png";
import tyrDragon from "../../public/images/units/TyrDragon.png";
import arrDragon from "../../public/images/units/ArrDragon.png";

// Peças novas: madeira cortada e pintada (geradas por tools/units/pecas.py)
import baraFootWood from "../../public/images/units-v2/BarathFoot.png";
import baraKnightWood from "../../public/images/units-v2/BarathKnight.png";
import baraSiegeWood from "../../public/images/units-v2/BarathSeige.png";
import baraShipWood from "../../public/images/units-v2/BarathShip.png";
import boltFootWood from "../../public/images/units-v2/BoltonFoot.png";
import boltKnightWood from "../../public/images/units-v2/BoltonKnight.png";
import boltSiegeWood from "../../public/images/units-v2/BoltonSiege.png";
import boltShipWood from "../../public/images/units-v2/BoltonShip.png";
import lannFootWood from "../../public/images/units-v2/LanFoot.png";
import lannKnightWood from "../../public/images/units-v2/LanKnight.png";
import lannSiegeWood from "../../public/images/units-v2/LanSeige.png";
import lannShipWood from "../../public/images/units-v2/LanShip.png";
import starFootWood from "../../public/images/units-v2/StarFoot.png";
import starKnightWood from "../../public/images/units-v2/StarKnight.png";
import starSiegeWood from "../../public/images/units-v2/StarSeige.png";
import starShipWood from "../../public/images/units-v2/StarShip.png";
import greyFootWood from "../../public/images/units-v2/GreyFoot.png";
import greyKnightWood from "../../public/images/units-v2/GreyKnight.png";
import greySiegeWood from "../../public/images/units-v2/GreySeige.png";
import greyShipWood from "../../public/images/units-v2/GreyShip.png";
import martFootWood from "../../public/images/units-v2/MartFoot.png";
import martKnightWood from "../../public/images/units-v2/MartKnight.png";
import martSiegeWood from "../../public/images/units-v2/MartSeige.png";
import martShipWood from "../../public/images/units-v2/MartShip.png";
import tyrFootWood from "../../public/images/units-v2/TyrFoot.png";
import tyrKnightWood from "../../public/images/units-v2/TyrKnight.png";
import tyrSiegeWood from "../../public/images/units-v2/TyrSeige.png";
import tyrShipWood from "../../public/images/units-v2/TyrShip.png";
import arrFootWood from "../../public/images/units-v2/ArrynFoot.png";
import arrKnightWood from "../../public/images/units-v2/ArrynKnight.png";
import arrSiegeWood from "../../public/images/units-v2/ArrynSiege.png";
import arrShipWood from "../../public/images/units-v2/ArrynShip.png";
import targShipWood from "../../public/images/units-v2/TargShip.png";
import targFootWood from "../../public/images/units-v2/TargFoot.png";
import targKnightWood from "../../public/images/units-v2/TargKnight.png";
import targDragonWood from "../../public/images/units-v2/TargDragon.png";
import baraDragonWood from "../../public/images/units-v2/BaraDragon.png";
import lannDragonWood from "../../public/images/units-v2/LannDragon.png";
import starDragonWood from "../../public/images/units-v2/StarDragon.png";
import boltDragonWood from "../../public/images/units-v2/BoltDragon.png";
import greyDragonWood from "../../public/images/units-v2/GreyDragon.png";
import martDragonWood from "../../public/images/units-v2/MartDragon.png";
import tyrDragonWood from "../../public/images/units-v2/TyrDragon.png";
import arrDragonWood from "../../public/images/units-v2/ArrDragon.png";

const classicUnitImages = new BetterMap([
    ["baratheon", new BetterMap([
        [footman.id, baraFoot],
        [knight.id, baraKnight],
        [siegeEngine.id, baraSiege],
        [ship.id, baraShip],
        [dragon.id, baraDragon]
    ])],
    ["lannister", new BetterMap([
        [footman.id, lannFoot],
        [knight.id, lannKnight],
        [siegeEngine.id, lannSiege],
        [ship.id, lannShip],
        [dragon.id, lannDragon]
    ])],
    ["stark", new BetterMap([
        [footman.id, starFoot],
        [knight.id, starKnight],
        [siegeEngine.id, starSiege],
        [ship.id, starShip],
        [dragon.id, starDragon]
    ])],
    ["greyjoy", new BetterMap([
        [footman.id, greyFoot],
        [knight.id, greyKnight],
        [siegeEngine.id, greySiege],
        [ship.id, greyShip],
        [dragon.id, greyDragon]
    ])],
    ["martell", new BetterMap([
        [footman.id, martFoot],
        [knight.id, martKnight],
        [siegeEngine.id, martSiege],
        [ship.id, martShip],
        [dragon.id, martDragon]
    ])],
    ["tyrell", new BetterMap([
        [footman.id, tyrFoot],
        [knight.id, tyrKnight],
        [siegeEngine.id, tyrSiege],
        [ship.id, tyrShip],
        [dragon.id, tyrDragon]
    ])],
    ["arryn", new BetterMap([
        [footman.id, arrFoot],
        [knight.id, arrKnight],
        [siegeEngine.id, arrSiege],
        [ship.id, arrShip],
        [dragon.id, arrDragon]
    ])],
    ["bolton", new BetterMap([
        [footman.id, boltFoot],
        [knight.id, boltKnight],
        [siegeEngine.id, boltSiege],
        [ship.id, boltShip],
        [dragon.id, boltDragon]
    ])],
    ["targaryen", new BetterMap([
        [footman.id, targFoot],
        [knight.id, targKnight],
        [dragon.id, targDragon],
        [ship.id, targShip]
    ])]
]);

const woodUnitImages = new BetterMap([
    ["baratheon", new BetterMap([
        [footman.id, baraFootWood],
        [knight.id, baraKnightWood],
        [siegeEngine.id, baraSiegeWood],
        [ship.id, baraShipWood],
        [dragon.id, baraDragonWood]
    ])],
    ["lannister", new BetterMap([
        [footman.id, lannFootWood],
        [knight.id, lannKnightWood],
        [siegeEngine.id, lannSiegeWood],
        [ship.id, lannShipWood],
        [dragon.id, lannDragonWood]
    ])],
    ["stark", new BetterMap([
        [footman.id, starFootWood],
        [knight.id, starKnightWood],
        [siegeEngine.id, starSiegeWood],
        [ship.id, starShipWood],
        [dragon.id, starDragonWood]
    ])],
    ["greyjoy", new BetterMap([
        [footman.id, greyFootWood],
        [knight.id, greyKnightWood],
        [siegeEngine.id, greySiegeWood],
        [ship.id, greyShipWood],
        [dragon.id, greyDragonWood]
    ])],
    ["martell", new BetterMap([
        [footman.id, martFootWood],
        [knight.id, martKnightWood],
        [siegeEngine.id, martSiegeWood],
        [ship.id, martShipWood],
        [dragon.id, martDragonWood]
    ])],
    ["tyrell", new BetterMap([
        [footman.id, tyrFootWood],
        [knight.id, tyrKnightWood],
        [siegeEngine.id, tyrSiegeWood],
        [ship.id, tyrShipWood],
        [dragon.id, tyrDragonWood]
    ])],
    ["arryn", new BetterMap([
        [footman.id, arrFootWood],
        [knight.id, arrKnightWood],
        [siegeEngine.id, arrSiegeWood],
        [ship.id, arrShipWood],
        [dragon.id, arrDragonWood]
    ])],
    ["bolton", new BetterMap([
        [footman.id, boltFootWood],
        [knight.id, boltKnightWood],
        [siegeEngine.id, boltSiegeWood],
        [ship.id, boltShipWood],
        [dragon.id, boltDragonWood]
    ])],
    ["targaryen", new BetterMap([
        [footman.id, targFootWood],
        [knight.id, targKnightWood],
        [dragon.id, targDragonWood],
        [ship.id, targShipWood]
    ])]
]);

export type PiecesStyle = "wood" | "classic";
const STYLE_KEY = "pieces-style";

/** Estilo das peças escolhido pelo jogador (fica no navegador). Padrão: madeira. */
export function getPiecesStyle(): PiecesStyle {
    try {
        return window.localStorage.getItem(STYLE_KEY) == "classic" ? "classic" : "wood";
    } catch {
        return "wood";
    }
}

/** Troca o estilo das peças. Vale ao recarregar a página. */
export function setPiecesStyle(style: PiecesStyle): void {
    try {
        window.localStorage.setItem(STYLE_KEY, style);
    } catch {
        // sem armazenamento: fica o padrão
    }
}

const unitImages = getPiecesStyle() == "classic" ? classicUnitImages : woodUnitImages;

export default unitImages;
