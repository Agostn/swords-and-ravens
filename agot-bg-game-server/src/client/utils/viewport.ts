/**
 * Controla a <meta name="viewport"> da página do jogo (celular e tablet).
 *
 * - "page": página normal que se ajusta à largura da tela (sala de espera).
 * - "app": tela da partida. O navegador não dá zoom na página, para a pinça
 *   (dois dedos) dar zoom só no mapa.
 * - "desktop": tela antiga da partida no celular, que foi feita para tela de
 *   computador: a página fica larga e a pessoa dá zoom com os dedos.
 */
export type ViewportMode = "page" | "app" | "desktop";

const CONTENT: Record<ViewportMode, string> = {
  page: "width=device-width, initial-scale=1, viewport-fit=cover",
  app: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  desktop: "width=1280"
};

export function setViewportMode(mode: ViewportMode): void {
  try {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    if (meta.content != CONTENT[mode]) meta.content = CONTENT[mode];
  } catch {
    // sem DOM (testes): nada a fazer
  }
}
