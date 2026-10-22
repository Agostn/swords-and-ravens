import Game from "../../common/ingame-game-state/game-data-structure/Game";
import House from "../../common/ingame-game-state/game-data-structure/House";

/**
 * Pontos de vitória como o painel clássico das Casas mostra
 * (HouseRowComponent): sem cortar no número que vence a partida.
 * - O Festim dos Corvos: pontos de vitória dos objetivos.
 * - Targaryen (Mãe dos Dragões): fichas de lealdade.
 * - Demais: Fortalezas e Castelos controlados.
 */
export default function displayedVictoryPoints(
  game: Game,
  house: House
): number {
  if (game.ingame.entireGame.isFeastForCrows) {
    return game.getVictoryPoints(house);
  }
  if (house == game.targaryen) {
    return game.getTotalLoyaltyTokenCount(house);
  }
  return game.getControlledStrongholdAndCastleCount(house);
}
