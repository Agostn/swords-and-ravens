import Region from "../../common/ingame-game-state/game-data-structure/Region";
import House from "../../common/ingame-game-state/game-data-structure/House";

/**
 * No navegador, "quem controla a área" não pode derrubar a tela inteira.
 *
 * O jogo (código comum ao servidor) lança um erro quando uma área tem peças
 * de Casas diferentes ao mesmo tempo. Isso não devia acontecer, mas aconteceu
 * numa partida de teste (Mar do Verão Leste, rodada 9) e a página ficou toda
 * preta para os três jogadores, porque a tela pergunta o dono de cada área a
 * todo momento. Aqui, só no navegador, o erro vira um aviso no console e a
 * área fica com a Casa que tem mais peças nela. O servidor continua igual.
 */
let warned = new Set<string>();

export function installTolerantRegionController(): void {
  const proto = Region.prototype as Region & { __tolerant?: boolean };
  if (proto.__tolerant) return;
  const original = proto.getController;
  proto.getController = function (this: Region): House | null {
    try {
      return original.call(this);
    } catch (e) {
      if (!warned.has(this.id)) {
        warned.add(this.id);
        console.warn(`[tela] ${String(e)} — usando a Casa com mais peças na área.`);
      }
      const counts = new Map<House, number>();
      this.units.values.forEach((u) => counts.set(u.allegiance, (counts.get(u.allegiance) ?? 0) + 1));
      let best: House | null = null;
      let bestN = -1;
      counts.forEach((n, h) => {
        if (n > bestN) {
          best = h;
          bestN = n;
        }
      });
      return best;
    }
  };
  proto.__tolerant = true;
}

/** Só para testes. */
export function resetTolerantRegionWarnings(): void {
  warned = new Set<string>();
}
