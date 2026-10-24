import * as React from "react";
import { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { t } from "../i18n/i18n";

// Navegadores antigos (Safari) usam os nomes com "webkit"
type FsDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function fullscreenSupported(): boolean {
  const d = document as FsDocument;
  return !!(d.fullscreenEnabled || d.webkitFullscreenEnabled);
}

function isFullscreen(): boolean {
  const d = document as FsDocument;
  return !!(d.fullscreenElement || d.webkitFullscreenElement);
}

/** Aberto pelo ícone na tela inicial (como um app), sem a barra do navegador. */
export function isInstalledApp(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone == true
    );
  } catch {
    return false;
  }
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPod/.test(ua) || (/iPad|Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * Botão de tela cheia. No computador e no Android usa a tela cheia do navegador.
 * No iPhone o Safari não deixa uma página ficar em tela cheia: o botão explica
 * como pôr o jogo na Tela de Início, que abre sem a barra do navegador.
 */
@observer
export default class HudFullscreenButton extends Component {
  @observable fullscreen = false;

  componentDidMount(): void {
    document.addEventListener("fullscreenchange", this.sync);
    document.addEventListener("webkitfullscreenchange", this.sync);
    this.sync();
  }

  componentWillUnmount(): void {
    document.removeEventListener("fullscreenchange", this.sync);
    document.removeEventListener("webkitfullscreenchange", this.sync);
  }

  private sync = (): void => {
    this.fullscreen = isFullscreen();
  };

  private toggle = (): void => {
    const d = document as FsDocument;
    try {
      if (isFullscreen()) {
        if (d.exitFullscreen) void d.exitFullscreen();
        else d.webkitExitFullscreen?.();
      } else {
        const el = document.documentElement as FsElement;
        if (el.requestFullscreen) void el.requestFullscreen({ navigationUI: "hide" }).catch(() => undefined);
        else el.webkitRequestFullscreen?.();
      }
    } catch {
      // o navegador recusou; nada a fazer
    }
  };

  private icon(exit: boolean): ReactNode {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        {exit ? (
          <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
        ) : (
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        )}
      </svg>
    );
  }

  render(): ReactNode {
    // já aberto como app pela Tela de Início: não precisa do botão
    if (isInstalledApp() && !fullscreenSupported()) return null;

    if (fullscreenSupported()) {
      const label = this.fullscreen ? t("hud.fullscreen.exit") : t("hud.fullscreen.enter");
      return (
        <button type="button" className="hud-icon-button" aria-label={label} title={label} onClick={this.toggle}>
          {this.icon(this.fullscreen)}
        </button>
      );
    }

    // iPhone (e outros sem tela cheia): explica como instalar
    return (
      <OverlayTrigger
        trigger="click"
        rootClose
        placement="bottom-end"
        overlay={
          <Popover id="hud-fullscreen-help" className="choice-popover">
            <div className="choice-box">
              <div className="choice-head">
                <span className="choice-order">{t("hud.fullscreen.enter")}</span>
                <b className="choice-region">{t("hud.install.title")}</b>
              </div>
              <ol className="install-steps">
                {isIos() ? (
                  <>
                    <li>{t("hud.install.ios1")}</li>
                    <li>{t("hud.install.ios2")}</li>
                    <li>{t("hud.install.ios3")}</li>
                  </>
                ) : (
                  <>
                    <li>{t("hud.install.other1")}</li>
                    <li>{t("hud.install.other2")}</li>
                  </>
                )}
              </ol>
              <small className="install-note">{t("hud.install.note")}</small>
            </div>
          </Popover>
        }
      >
        <button type="button" className="hud-icon-button" aria-label={t("hud.fullscreen.enter")} title={t("hud.fullscreen.enter")}>
          {this.icon(false)}
        </button>
      </OverlayTrigger>
    );
  }
}
