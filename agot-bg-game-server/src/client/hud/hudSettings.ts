import { observable } from "mobx";

/**
 * Preferências da tela nova da partida (layout "mapa em tela cheia").
 * Ficam no navegador de cada jogador. Se o armazenamento estiver
 * bloqueado, usamos os valores padrão e nada quebra.
 */

const KEY = "hud-settings";

interface StoredHudSettings {
  classicLayout?: boolean;
  rightPanelOpen?: boolean;
  actionDockMinimized?: boolean;
  showHouseColors?: boolean;
  minimapHidden?: boolean;
  recentMinimized?: boolean;
}

function load(): StoredHudSettings {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredHudSettings) : {};
  } catch {
    return {};
  }
}

class HudSettings {
  @observable classicLayout = false;
  @observable rightPanelOpen = true;
  @observable actionDockMinimized = false;
  // Mapa pintado com a cor de quem controla cada área
  @observable showHouseColors = false;
  // Mini-mapa escondido (botão ao lado do zoom)
  @observable minimapHidden = false;
  // "Últimos acontecimentos" recolhido (só o título)
  @observable recentMinimized = false;

  constructor() {
    const s = load();
    this.classicLayout = s.classicLayout ?? false;
    this.rightPanelOpen =
      s.rightPanelOpen ??
      (typeof window != "undefined" && window.innerWidth >= 1280);
    this.actionDockMinimized = s.actionDockMinimized ?? false;
    this.showHouseColors = s.showHouseColors ?? false;
    this.minimapHidden = s.minimapHidden ?? false;
    this.recentMinimized = s.recentMinimized ?? false;
  }

  /** A tela nova vale para computador, tablet e celular (a antiga fica como opção). */
  get hudActive(): boolean {
    return !this.classicLayout;
  }

  save(): void {
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({
          classicLayout: this.classicLayout,
          rightPanelOpen: this.rightPanelOpen,
          actionDockMinimized: this.actionDockMinimized,
          showHouseColors: this.showHouseColors,
          minimapHidden: this.minimapHidden,
          recentMinimized: this.recentMinimized
        })
      );
    } catch {
      // sem armazenamento: as escolhas valem só até recarregar a página
    }
  }

  setClassicLayout(value: boolean): void {
    this.classicLayout = value;
    this.save();
  }

  toggleRightPanel(): void {
    this.rightPanelOpen = !this.rightPanelOpen;
    this.save();
  }

  toggleHouseColors(): void {
    this.showHouseColors = !this.showHouseColors;
    this.save();
  }

  toggleMinimap(): void {
    this.minimapHidden = !this.minimapHidden;
    this.save();
  }

  toggleRecent(): void {
    this.recentMinimized = !this.recentMinimized;
    this.save();
  }

  setActionDockMinimized(value: boolean): void {
    this.actionDockMinimized = value;
    this.save();
  }
}

const hudSettings = new HudSettings();
export default hudSettings;
