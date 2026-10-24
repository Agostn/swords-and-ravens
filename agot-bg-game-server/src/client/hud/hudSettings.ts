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
  leftPanelOpen?: boolean;
  collapsedSections?: string[];
  situationHidden?: boolean;
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
  // Coluna da esquerda (Westeros: rodada, fase, Selvagens, trilhas, suprimento)
  @observable leftPanelOpen = true;
  // Partes recolhidas das colunas (ex.: "tracks", "supply")
  @observable collapsedSections: string[] = [];
  // Linha "sua situação" embaixo do painel da jogada
  @observable situationHidden = false;

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
    this.leftPanelOpen =
      s.leftPanelOpen ??
      (typeof window != "undefined" && window.innerWidth >= 1200);
    this.collapsedSections = Array.isArray(s.collapsedSections)
      ? s.collapsedSections.filter((x) => typeof x == "string")
      : [];
    this.situationHidden = s.situationHidden ?? false;
  }

  isCollapsed(section: string): boolean {
    return this.collapsedSections.includes(section);
  }

  toggleSection(section: string): void {
    this.collapsedSections = this.isCollapsed(section)
      ? this.collapsedSections.filter((x) => x != section)
      : [...this.collapsedSections, section];
    this.save();
  }

  toggleLeftPanel(): void {
    this.leftPanelOpen = !this.leftPanelOpen;
    this.save();
  }

  toggleSituation(): void {
    this.situationHidden = !this.situationHidden;
    this.save();
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
          recentMinimized: this.recentMinimized,
          leftPanelOpen: this.leftPanelOpen,
          collapsedSections: this.collapsedSections,
          situationHidden: this.situationHidden
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

  /** Todos os painéis escondidos (só o mapa e as faixas finas). */
  get mapOnly(): boolean {
    return (
      !this.leftPanelOpen &&
      !this.rightPanelOpen &&
      this.actionDockMinimized &&
      this.minimapHidden
    );
  }

  // como estava antes de esconder tudo, para voltar igual
  private beforeMapOnly: {
    left: boolean;
    right: boolean;
    dock: boolean;
    minimap: boolean;
  } | null = null;

  toggleMapOnly(): void {
    if (this.mapOnly) {
      const b = this.beforeMapOnly;
      this.leftPanelOpen = b ? b.left : true;
      this.rightPanelOpen = b ? b.right : true;
      this.actionDockMinimized = b ? b.dock : false;
      this.minimapHidden = b ? b.minimap : false;
      this.beforeMapOnly = null;
    } else {
      this.beforeMapOnly = {
        left: this.leftPanelOpen,
        right: this.rightPanelOpen,
        dock: this.actionDockMinimized,
        minimap: this.minimapHidden
      };
      this.leftPanelOpen = false;
      this.rightPanelOpen = false;
      this.actionDockMinimized = true;
      this.minimapHidden = true;
    }
    this.save();
  }

  setActionDockMinimized(value: boolean): void {
    this.actionDockMinimized = value;
    this.save();
  }
}

const hudSettings = new HudSettings();
export default hudSettings;
