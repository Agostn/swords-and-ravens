/**
 * Mesa de Batalha dentro da partida: abre a página da Mesa (a mesma do protótipo, modo #embed) num iframe por
 * cima de tudo e conversa com ela por postMessage (ver "dentro do jogo completo" em tools/tactical/prototipo/app.ts).
 */
import React, { Component, ReactNode } from "react";
import * as ReactDOM from "react-dom";
import mesaUrl from "./mesa-de-batalha.mesa.html";

export interface MesaMessage {
  source?: string;
  type: "tb-ready" | "tb-submit" | "tb-react" | "tb-close" | "tb-hide";
  [key: string]: unknown;
}

interface MesaFrameProps {
  /** o que a Mesa deve mostrar (vai no "tb-start"); muda → manda de novo */
  start: Record<string, unknown>;
  onMessage: (msg: MesaMessage) => void;
  /** botão "minimizar" (fora da Mesa), além do da própria Mesa */
  onHide: () => void;
  /** minimizada: a Mesa continua carregada (não perde nada), só some da frente; fica um botão no canto */
  minimized?: boolean;
  /** texto do botão do canto quando minimizada */
  pill?: string;
  onOpen?: () => void;
}

export default class MesaFrame extends Component<MesaFrameProps> {
  frame = React.createRef<HTMLIFrameElement>();
  ready = false;
  lastSent = "";

  componentDidMount(): void {
    window.addEventListener("message", this.onWindowMessage);
    this.lockScroll();
  }

  componentWillUnmount(): void {
    window.removeEventListener("message", this.onWindowMessage);
    document.body.style.overflow = "";
  }

  componentDidUpdate(): void {
    this.lockScroll();
    this.sendStart();
  }

  lockScroll(): void {
    document.body.style.overflow = this.props.minimized ? "" : "hidden";
  }

  sendStart(): void {
    const win = this.frame.current?.contentWindow;
    if (!this.ready || !win) return;
    const payload = JSON.stringify(this.props.start);
    if (payload == this.lastSent) return;
    this.lastSent = payload;
    // cópia simples (JSON): listas do mobx não passam pelo postMessage
    win.postMessage({ ...JSON.parse(payload), type: "tb-start" }, "*");
  }

  onWindowMessage = (e: MessageEvent): void => {
    if (!this.frame.current || e.source !== this.frame.current.contentWindow) return;
    const msg = e.data as MesaMessage;
    if (!msg || msg.source != "mesa-de-batalha") return;
    if (msg.type == "tb-ready") {
      this.ready = true;
      this.lastSent = "";
      this.sendStart();
      return;
    }
    this.props.onMessage(msg);
  };

  render(): ReactNode {
    const min = !!this.props.minimized;
    return ReactDOM.createPortal(
      <>
      {min && (
        <button
          type="button"
          className="mesa-pill"
          onClick={() => this.props.onOpen && this.props.onOpen()}
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 3001,
            padding: "12px 18px",
            border: "1px solid #e2b65a",
            borderRadius: 999,
            background: "linear-gradient(180deg, #3a2c1c, #241b12)",
            color: "#f1e6cb",
            fontWeight: 700,
            fontSize: 15,
            boxShadow: "0 8px 24px rgba(0,0,0,.5), 0 0 0 3px rgba(226,182,90,.18)",
            cursor: "pointer"
          }}
          aria-label="Abrir a Mesa de Batalha"
        >
          {this.props.pill ?? "⚔ Mesa de Batalha"} <span style={{ color: "#e2b65a", marginLeft: 6 }}>Abrir ▲</span>
        </button>
      )}
      <div
        className="mesa-de-batalha-overlay"
        aria-hidden={min}
        style={{
          visibility: min ? "hidden" : "visible",
          pointerEvents: min ? "none" : "auto",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 3000,
          background: "rgba(10,8,6,.92)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          style={{ position: "absolute", top: 8, right: 8, zIndex: 1, opacity: 0.9 }}
          onClick={() => this.props.onHide()}
          aria-label="Minimizar e voltar ao mapa"
          title="Minimizar e voltar ao mapa (a batalha continua)"
        >
          ▁ Minimizar
        </button>
        <iframe
          ref={this.frame}
          src={`${mesaUrl}#embed`}
          title="Mesa de Batalha"
          allow="fullscreen"
          style={{ border: 0, width: "100%", height: "100%", flex: 1, background: "#15110d" }}
        />
      </div>
      </>,
      document.body
    );
  }
}
