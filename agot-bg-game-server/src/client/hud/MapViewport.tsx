import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { observable } from "mobx";
import hudSettings from "./hudSettings";
import { t } from "../i18n/i18n";

/**
 * Área do mapa em tela cheia: zoom (roda do mouse, botões, pinça no celular),
 * arrastar para mover e mini-mapa.
 *
 * O conteúdo (o MapComponent) continua com o tamanho original em pixels;
 * só aplicamos `transform: translate() scale()` por cima. As animações de
 * unidades do MapComponent já calculam a escala pelo getBoundingClientRect,
 * então continuam funcionando com zoom.
 */

interface MapViewportProps {
  contentWidth: number;
  contentHeight: number;
  minimapImage: string;
  children: ReactNode;
  // Espaço ocupado pelos painéis em cada borda, para centralizar o mapa
  // na parte da tela que fica livre.
  insets?: { top: number; right: number; bottom: number; left: number };
  // Altura dos painéis que ficam por cima da parte de baixo do mapa. O mapa
  // pode ser arrastado para cima até essa altura, para nada ficar escondido.
  panBottom?: number;
  // Distância dos botões de zoom e do mini-mapa até a borda direita
  // (para não ficarem embaixo do painel das Casas).
  controlsRight?: number;
  // Distância dos botões até o topo (padrão: abaixo da barra do topo)
  controlsTop?: number;
  // Celular: sem +/− e sem mini-mapa (a pinça faz o zoom); só "ver tudo".
  compactControls?: boolean;
}

const MIN_ZOOM_FACTOR = 0.9; // em relação a "caber inteiro"
const MAX_ZOOM = 2.5;
const DRAG_THRESHOLD = 6;
const STORAGE_KEY = "hud-map-view-v2";

interface SavedView {
  scale: number;
  x: number;
  y: number;
}

function readSavedView(): SavedView | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (
      typeof v?.scale == "number" &&
      typeof v?.x == "number" &&
      typeof v?.y == "number" &&
      isFinite(v.scale) &&
      v.scale > 0
    ) {
      return v;
    }
  } catch {
    // armazenamento bloqueado ou dado inválido: segue com a visão padrão
  }
  return null;
}

function writeSavedView(v: SavedView): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    // sem armazenamento: só não lembra o zoom
  }
}

@observer
export default class MapViewport extends Component<MapViewportProps> {
  @observable scale = 1;
  @observable x = 0;
  @observable y = 0;
  @observable viewportWidth = 0;
  @observable viewportHeight = 0;
  @observable isDragging = false;

  viewportRef = React.createRef<HTMLDivElement>();
  private resizeObserver: ResizeObserver | null = null;
  private initialized = false;

  // arrastar
  private pointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private startPanX = 0;
  private startPanY = 0;
  private suppressNextClick = false;

  // pinça (dois dedos)
  private activePointers = new Map<number, { x: number; y: number }>();
  private pinchStartDistance = 0;
  private pinchStartScale = 1;

  private saveTimer: number | null = null;

  get fitScale(): number {
    const { contentWidth, contentHeight } = this.props;
    const free = this.freeArea;
    if (free.width <= 0 || free.height <= 0) return 1;
    return Math.min(free.width / contentWidth, free.height / contentHeight);
  }

  get minScale(): number {
    return Math.min(this.fitScale * MIN_ZOOM_FACTOR, 1);
  }

  get freeArea(): { left: number; top: number; width: number; height: number } {
    const insets = this.props.insets ?? {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
    return {
      left: insets.left,
      top: insets.top,
      width: Math.max(0, this.viewportWidth - insets.left - insets.right),
      height: Math.max(0, this.viewportHeight - insets.top - insets.bottom)
    };
  }

  render(): ReactNode {
    const { contentWidth, contentHeight } = this.props;
    return (
      <div
        ref={this.viewportRef}
        className={"hud-map-viewport" + (this.isDragging ? " dragging" : "")}
        onWheel={this.onWheel}
        onPointerDown={this.onPointerDown}
        onPointerMove={this.onPointerMove}
        onPointerUp={this.onPointerUp}
        onPointerCancel={this.onPointerUp}
        onClickCapture={this.onClickCapture}
      >
        <div
          className="hud-map-content"
          style={{
            width: contentWidth,
            height: contentHeight,
            transform: `translate(${this.x}px, ${this.y}px) scale(${this.scale})`
          }}
        >
          {this.props.children}
        </div>
        {this.renderControls()}
      </div>
    );
  }

  private renderControls(): ReactNode {
    const { contentWidth, contentHeight } = this.props;
    const miniWidth = contentWidth > contentHeight ? 150 : 86;
    const miniScale = miniWidth / contentWidth;
    const miniHeight = contentHeight * miniScale;

    // retângulo do que está visível, em coordenadas do mini-mapa
    const visLeft = Math.max(0, -this.x / this.scale) * miniScale;
    const visTop = Math.max(0, -this.y / this.scale) * miniScale;
    const visRight =
      Math.min(contentWidth, (this.viewportWidth - this.x) / this.scale) *
      miniScale;
    const visBottom =
      Math.min(contentHeight, (this.viewportHeight - this.y) / this.scale) *
      miniScale;

    return (
      <div
        className={
          "hud-map-controls" + (this.props.compactControls ? " compact" : "")
        }
        style={{
          right: this.props.controlsRight ?? 12,
          ...(this.props.controlsTop != null ? { top: this.props.controlsTop } : {})
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="hud-zoom-buttons">
          <button
            type="button"
            className="hud-icon-button"
            aria-label={t("hud.map.zoomIn")}
            title={t("hud.map.zoomIn")}
            onClick={() => this.zoomBy(1.25)}
          >
            +
          </button>
          <button
            type="button"
            className="hud-icon-button"
            aria-label={t("hud.map.zoomOut")}
            title={t("hud.map.zoomOut")}
            onClick={() => this.zoomBy(1 / 1.25)}
          >
            −
          </button>
          <button
            type="button"
            className="hud-icon-button"
            aria-label={t("hud.map.fit")}
            title={t("hud.map.fit")}
            onClick={() => this.fitToScreen()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          </button>
          <button
            type="button"
            className={
              "hud-icon-button" + (hudSettings.minimapHidden ? "" : " active")
            }
            aria-pressed={!hudSettings.minimapHidden}
            aria-label={
              hudSettings.minimapHidden
                ? t("hud.map.showMinimap")
                : t("hud.map.hideMinimap")
            }
            title={
              hudSettings.minimapHidden
                ? t("hud.map.showMinimap")
                : t("hud.map.hideMinimap")
            }
            onClick={() => hudSettings.toggleMinimap()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
              <path d="M9 3v15M15 6v15" />
              {hudSettings.minimapHidden && <path d="M3 3l18 18" />}
            </svg>
          </button>
          {!this.props.compactControls && (
            <button
              type="button"
              className={
                "hud-icon-button" + (hudSettings.mapOnly ? " active" : "")
              }
              aria-pressed={hudSettings.mapOnly}
              aria-label={
                hudSettings.mapOnly ? t("hud.map.showPanels") : t("hud.map.mapOnly")
              }
              title={
                hudSettings.mapOnly ? t("hud.map.showPanels") : t("hud.map.mapOnly")
              }
              onClick={() => hudSettings.toggleMapOnly()}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                {hudSettings.mapOnly ? (
                  <>
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M8 4v16M16 4v16M8 15h8" />
                  </>
                ) : (
                  <>
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M9 9l6 6M15 9l-6 6" />
                  </>
                )}
              </svg>
            </button>
          )}
        </div>
        {!hudSettings.minimapHidden && (
        <div
          className="hud-minimap"
          style={{
            width: miniWidth,
            height: miniHeight,
            backgroundImage: `url(${this.props.minimapImage})`
          }}
          title={t("hud.map.minimap")}
          onPointerDown={(e) => this.onMinimapPointer(e, miniScale)}
          onPointerMove={(e) => {
            if (e.buttons == 1) this.onMinimapPointer(e, miniScale);
          }}
        >
          <div
            className="hud-minimap-view"
            style={{
              left: visLeft,
              top: visTop,
              width: Math.max(4, visRight - visLeft),
              height: Math.max(4, visBottom - visTop)
            }}
          />
        </div>
        )}
      </div>
    );
  }

  componentDidMount(): void {
    const el = this.viewportRef.current;
    if (!el) return;

    // React registra onWheel como "passive"; para impedir a rolagem da
    // página precisamos de um listener não-passivo.
    el.addEventListener("wheel", this.preventPageScroll, { passive: false });

    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(el);
    this.measure();
  }

  componentDidUpdate(prev: MapViewportProps): void {
    const a = prev.insets;
    const b = this.props.insets;
    if (
      prev.contentWidth != this.props.contentWidth ||
      prev.contentHeight != this.props.contentHeight ||
      a?.top != b?.top ||
      a?.right != b?.right ||
      a?.bottom != b?.bottom ||
      a?.left != b?.left ||
      (prev.panBottom ?? 0) != (this.props.panBottom ?? 0)
    ) {
      this.clamp();
    }
  }

  componentWillUnmount(): void {
    this.viewportRef.current?.removeEventListener(
      "wheel",
      this.preventPageScroll
    );
    this.resizeObserver?.disconnect();
    if (this.saveTimer != null) window.clearTimeout(this.saveTimer);
  }

  private preventPageScroll = (e: WheelEvent): void => {
    e.preventDefault();
  };

  private measure(): void {
    const el = this.viewportRef.current;
    if (!el) return;
    this.viewportWidth = el.clientWidth;
    this.viewportHeight = el.clientHeight;
    if (this.viewportWidth == 0 || this.viewportHeight == 0) return;

    if (!this.initialized) {
      this.initialized = true;
      const saved = readSavedView();
      if (saved) {
        this.scale = saved.scale;
        this.x = saved.x;
        this.y = saved.y;
      } else {
        this.showDefaultView();
      }
    }
    this.clamp();
  }

  // Visão inicial: o mapa ocupa toda a largura livre (até 1,9x),
  // mostrando o Norte primeiro.
  private showDefaultView(): void {
    const free = this.freeArea;
    const byWidth = free.width / this.props.contentWidth;
    this.scale = Math.max(this.fitScale, Math.min(1.9, byWidth));
    this.x =
      free.left + (free.width - this.props.contentWidth * this.scale) / 2;
    this.y = free.top;
  }

  fitToScreen(): void {
    const free = this.freeArea;
    this.scale = this.fitScale;
    this.x =
      free.left + (free.width - this.props.contentWidth * this.scale) / 2;
    this.y =
      free.top + (free.height - this.props.contentHeight * this.scale) / 2;
    this.clamp();
    this.scheduleSave();
  }

  zoomBy(factor: number, cx?: number, cy?: number): void {
    const centerX = cx ?? this.viewportWidth / 2;
    const centerY = cy ?? this.viewportHeight / 2;
    const newScale = Math.min(
      MAX_ZOOM,
      Math.max(this.minScale, this.scale * factor)
    );
    const ratio = newScale / this.scale;
    // mantém o ponto sob o cursor no mesmo lugar
    this.x = centerX - (centerX - this.x) * ratio;
    this.y = centerY - (centerY - this.y) * ratio;
    this.scale = newScale;
    this.clamp();
    this.scheduleSave();
  }

  /** Centraliza a visão num ponto do mapa (coordenadas originais). */
  centerOn(mapX: number, mapY: number): void {
    const free = this.freeArea;
    this.x = free.left + free.width / 2 - mapX * this.scale;
    this.y = free.top + free.height / 2 - mapY * this.scale;
    this.clamp();
    this.scheduleSave();
  }

  // Não deixa o mapa sair da tela: se ele for menor que a área livre,
  // fica centralizado; se for maior, a borda não passa da área livre.
  private clamp(): void {
    if (this.viewportWidth == 0) return;
    if (this.scale < this.minScale) this.scale = this.minScale;
    if (this.scale > MAX_ZOOM) this.scale = MAX_ZOOM;

    const free = this.freeArea;
    const w = this.props.contentWidth * this.scale;
    const h = this.props.contentHeight * this.scale;

    if (w <= free.width) {
      this.x = free.left + (free.width - w) / 2;
    } else {
      this.x = Math.min(
        free.left,
        Math.max(free.left + free.width - w, this.x)
      );
    }
    // Embaixo, o mapa pode subir além da borda até ficar acima dos painéis
    // de baixo (jogada, chat), para dar para clicar nas áreas do Sul.
    const pad = Math.min(this.props.panBottom ?? 0, free.height * 0.7);
    if (h + pad <= free.height) {
      this.y = free.top + (free.height - pad - h) / 2;
    } else {
      const minY = free.top + free.height - pad - h; // sempre < free.top aqui
      this.y = Math.min(free.top, Math.max(minY, this.y));
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer != null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      writeSavedView({ scale: this.scale, x: this.x, y: this.y });
    }, 400);
  }

  private onWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    const rect = this.viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    // trackpad com dois dedos sem Ctrl = mover; roda do mouse ou pinça = zoom
    const isPinch = e.ctrlKey;
    const isMouseWheel = e.deltaMode == 1 || Math.abs(e.deltaY) >= 50;
    if (!isPinch && !isMouseWheel) {
      this.x -= e.deltaX;
      this.y -= e.deltaY;
      this.clamp();
      this.scheduleSave();
      return;
    }
    const factor = Math.exp(-e.deltaY * (isPinch ? 0.01 : 0.0015));
    this.zoomBy(factor, e.clientX - rect.left, e.clientY - rect.top);
  };

  private onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.pointerType == "mouse" && e.button != 0) return;
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.activePointers.size == 2) {
      const [a, b] = Array.from(this.activePointers.values());
      this.pinchStartDistance = Math.hypot(a.x - b.x, a.y - b.y);
      this.pinchStartScale = this.scale;
      this.pointerId = null;
      return;
    }

    this.pointerId = e.pointerId;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startPanX = this.x;
    this.startPanY = this.y;
    this.suppressNextClick = false;
  };

  private onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (this.activePointers.size == 2 && this.pinchStartDistance > 0) {
      const [a, b] = Array.from(this.activePointers.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = this.viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      const target = this.pinchStartScale * (dist / this.pinchStartDistance);
      this.zoomBy(
        target / this.scale,
        (a.x + b.x) / 2 - rect.left,
        (a.y + b.y) / 2 - rect.top
      );
      this.suppressNextClick = true;
      return;
    }

    if (this.pointerId != e.pointerId) return;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    if (!this.isDragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      this.isDragging = true;
      this.suppressNextClick = true;
      try {
        this.viewportRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // alguns navegadores recusam a captura; o arrasto continua mesmo assim
      }
    }

    this.x = this.startPanX + dx;
    this.y = this.startPanY + dy;
    this.clamp();
  };

  private onPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    this.activePointers.delete(e.pointerId);
    if (this.activePointers.size < 2) this.pinchStartDistance = 0;
    if (this.pointerId == e.pointerId) {
      this.pointerId = null;
      if (this.isDragging) {
        this.isDragging = false;
        this.scheduleSave();
      }
    }
  };

  // Depois de arrastar, o "click" que o navegador dispara ao soltar o botão
  // não deve selecionar a área onde o mouse parou.
  private onClickCapture = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  private onMinimapPointer(
    e: React.PointerEvent<HTMLDivElement>,
    miniScale: number
  ): void {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const mapX = (e.clientX - rect.left) / miniScale;
    const mapY = (e.clientY - rect.top) / miniScale;
    this.centerOn(mapX, mapY);
  }
}
