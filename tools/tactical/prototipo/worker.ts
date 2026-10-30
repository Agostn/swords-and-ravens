/** Computador do protótipo rodando em segundo plano (Web Worker), para a tela não travar. */
import { computerStrategy, Scenario } from "../solver";

const ctx = self as unknown as { onmessage: ((e: MessageEvent) => void) | null; postMessage: (m: unknown) => void };
ctx.onmessage = (e: MessageEvent): void => {
  const { sc, side, seed, id } = e.data as { sc: Scenario; side: "attacker" | "defender"; seed: number; id: number };
  ctx.postMessage({ id, strategy: computerStrategy(sc, side, seed) });
};
