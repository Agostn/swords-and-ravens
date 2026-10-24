import * as React from "react";
import { Component, ErrorInfo, ReactNode } from "react";

interface State {
  error: Error | null;
}

/**
 * Se algum pedaço da tela der erro ao desenhar, mostra um aviso com "Tentar de
 * novo" em vez de deixar a página toda preta. A partida continua no servidor.
 */
export default class ScreenErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[tela] erro ao desenhar:", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="screen-error" role="alert">
        <h1>Algo deu errado ao desenhar a tela</h1>
        <p>A partida continua salva. Tente de novo; se não voltar, recarregue a página.</p>
        <p className="screen-error-detail">{String(this.state.error.message || this.state.error)}</p>
        <div className="screen-error-buttons">
          <button type="button" onClick={() => this.setState({ error: null })}>Tentar de novo</button>
          <button type="button" onClick={() => location.reload()}>Recarregar a página</button>
        </div>
      </div>
    );
  }
}
