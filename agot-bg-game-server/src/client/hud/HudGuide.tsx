/**
 * Guia do iniciante (01/nov, pedido do Agostinho: "era melhor uma descrição das peças para o iniciante entender";
 * "está confusa a parte da marcha e de como ganhar, dos selvagens, das cartas, do corvo mensageiro").
 * Uma janela com assuntos curtos, em palavras simples. Abre pelo "?" do topo e pelo "Entenda" ao lado do
 * "AGORA" (já no assunto da fase em que a partida está).
 */
import { observer } from "mobx-react";
import { observable } from "mobx";
import React, { Component, ReactNode } from "react";
import Modal from "react-bootstrap/Modal";
import classNames from "classnames";
import unitImages from "../unitImages";
import orderImages from "../orderImages";
import { march, defensePlusOne, support, raid, consolidatePower } from "../../common/ingame-game-state/game-data-structure/order-types/orderTypes";

export type GuideSection =
  | "objetivo"
  | "rodada"
  | "pecas"
  | "ordens"
  | "batalha"
  | "mesa"
  | "cartas"
  | "selvagens"
  | "corvo"
  | "trilhas"
  | "suprimento";

class GuideUi {
  @observable open = false;
  @observable section: GuideSection = "objetivo";

  show(section?: GuideSection): void {
    if (section) this.section = section;
    this.open = true;
  }
}

export const guideUi = new GuideUi();

const SECTIONS: [GuideSection, string, string][] = [
  ["objetivo", "🏆", "Como ganhar"],
  ["rodada", "🔄", "A rodada"],
  ["pecas", "♟", "As peças"],
  ["ordens", "📜", "As ordens (marcha…)"],
  ["batalha", "⚔", "Batalha"],
  ["mesa", "🗺", "Mesa de Batalha"],
  ["cartas", "🃏", "Cartas de Casa"],
  ["selvagens", "🐺", "Selvagens"],
  ["corvo", "🐦", "Corvo Mensageiro"],
  ["trilhas", "📊", "Trilhas de influência"],
  ["suprimento", "🛢", "Suprimento e recrutamento"]
];

function unitImg(kind: string): ReactNode {
  // a imagem de qualquer Casa serve só para mostrar o formato da peça
  const byHouse = unitImages.get("stark");
  const src = byHouse && byHouse.has(kind) ? byHouse.get(kind) : null;
  return src ? <img className="guide-unit" src={src} alt="" /> : null;
}

function orderImg(id: string): ReactNode {
  const src = orderImages.has(id) ? orderImages.get(id) : null;
  return src ? <img className="guide-order" src={src} alt="" /> : null;
}

@observer
export default class HudGuide extends Component {
  render(): ReactNode {
    return (
      <Modal
        show={guideUi.open}
        onHide={() => (guideUi.open = false)}
        size="lg"
        centered
        scrollable
        dialogClassName="hud-guide-dialog"
        contentClassName="hud-guide"
      >
        <Modal.Header closeButton>
          <Modal.Title>📖 Guia rápido do jogo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="guide-wrap">
            <nav className="guide-nav" aria-label="Assuntos">
              {SECTIONS.map(([id, icon, label]) => (
                <button
                  key={id}
                  type="button"
                  className={classNames("guide-tab", { active: guideUi.section == id })}
                  onClick={() => (guideUi.section = id)}
                >
                  <span aria-hidden="true">{icon}</span> {label}
                </button>
              ))}
            </nav>
            <article className="guide-body">{this.renderSection(guideUi.section)}</article>
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  renderSection(s: GuideSection): ReactNode {
    switch (s) {
      case "objetivo":
        return (
          <>
            <h4>🏆 Como ganhar</h4>
            <p>
              Ganha quem tiver <b>7 castelos e fortalezas</b> (os quadradinhos e as torres no mapa). Se ninguém chegar a 7,
              no fim da <b>rodada 10</b> ganha quem tiver mais.
            </p>
            <ul>
              <li>Você conquista uma área <b>marchando</b> com tropas para ela (ver “As ordens”).</li>
              <li>A trilha de vitória fica embaixo, em “Pontos de vitória”.</li>
              <li>Empate no fim: quem tiver mais áreas de suprimento, depois mais fichas de Poder.</li>
            </ul>
          </>
        );
      case "rodada":
        return (
          <>
            <h4>🔄 A rodada (sempre na mesma ordem)</h4>
            <ol>
              <li>
                <b>Westeros</b> (não acontece na 1ª rodada): aparecem 3 cartas que valem para todo mundo (recrutar, ajustar
                suprimento, leilão das trilhas, selvagens se aproximando…).
              </li>
              <li>
                <b>Planejamento</b>: todos colocam, escondido, <b>uma ordem em cada área onde têm tropas</b>. Depois quem tem
                o <b>Corvo Mensageiro</b> pode trocar uma ordem.
              </li>
              <li>
                <b>Ações</b>: as ordens são reveladas e resolvidas nesta ordem: <b>Incursões</b> → <b>Marchas</b> (é aqui que
                acontecem as batalhas) → <b>Consolidar Poder</b>. Cada um resolve uma ordem por vez, na ordem do Trono de Ferro.
              </li>
            </ol>
            <p className="guide-tip">A faixa “Rodada” no painel de baixo mostra em que fase estamos e de quem é a vez.</p>
          </>
        );
      case "pecas":
        return (
          <>
            <h4>♟ As peças</h4>
            <div className="guide-units">
              <div>
                {unitImg("footman")}
                <b>Soldado</b>
                <span>Força <b>1</b> na batalha. Recrutar custa 1 ponto.</span>
              </div>
              <div>
                {unitImg("knight")}
                <b>Cavaleiro</b>
                <span>Força <b>2</b>. Recrutar custa 2 pontos (ou 1 para promover um soldado).</span>
              </div>
              <div>
                {unitImg("ship")}
                <b>Navio</b>
                <span>
                  Força <b>1</b>. Só anda no mar e nos portos. Com ordem de <b>Apoio</b>, ajuda batalhas em terra ao lado do mar.
                </span>
              </div>
              <div>
                {unitImg("siege-engine")}
                <b>Máquina de cerco</b>
                <span>
                  Força <b>4</b> só quando <b>ataca castelo ou fortaleza</b>; nos outros casos vale 0. Se perder a batalha, é
                  destruída (não consegue fugir). Recrutar custa 2.
                </span>
              </div>
            </div>
            <ul>
              <li>
                <b>Exército</b> = 2 ou mais peças juntas na mesma área. O suprimento limita quantos exércitos você tem e o
                tamanho deles.
              </li>
              <li>
                <b>Guarnição</b>: algumas fortalezas começam com uma ficha de defesa que soma força quando atacadas.
              </li>
              <li>
                <b>Fichas de Poder</b> (coroas): servem para os leilões (trilhas e selvagens) e para deixar uma área sua mesmo
                sem tropas.
              </li>
            </ul>
          </>
        );
      case "ordens":
        return (
          <>
            <h4>📜 As ordens</h4>
            <p>Na fase de Planejamento, cada área com tropas suas recebe uma ordem. As com ★ são mais fortes, e o número de ★ que você pode usar depende da trilha do Corvo.</p>
            <dl className="guide-orders">
              <dt>{orderImg(march.id)} Marcha (−1, 0, +1)</dt>
              <dd>
                Move as tropas daquela área para áreas <b>vizinhas</b> (pode dividir). Se entrar numa área com tropas de outra
                Casa, <b>começa uma batalha</b>. O número (−1/+1) soma na força do ataque. Entrar numa área vazia conquista
                a área.
              </dd>
              <dt>{orderImg(defensePlusOne.id)} Defesa (+1, +2)</dt>
              <dd>Se alguém atacar essa área, você ganha +1 (ou +2) de força. Não faz nada se ninguém atacar.</dd>
              <dt>{orderImg(support.id)} Apoio (0, +1)</dt>
              <dd>
                Numa batalha numa área <b>vizinha</b>, a força das tropas daqui soma para o lado que você escolher (você ou
                outro jogador). As tropas não saem do lugar.
              </dd>
              <dt>{orderImg(raid.id)} Incursão</dt>
              <dd>
                Tira uma ordem de Apoio, Incursão ou Consolidar Poder de um inimigo <b>vizinho</b> (com ★, também Defesa).
                Tirar Consolidar Poder rouba 1 ficha de Poder.
              </dd>
              <dt>{orderImg(consolidatePower.id)} Consolidar Poder</dt>
              <dd>Ganha fichas de Poder: 1 + as coroas daquela área. Com ★ num castelo, pode recrutar ali em vez disso.</dd>
            </dl>
          </>
        );
      case "batalha":
        return (
          <>
            <h4>⚔ Batalha</h4>
            <p>Acontece quando uma Marcha entra numa área com tropas (ou guarnição) de outra Casa.</p>
            <ol>
              <li>
                <b>Apoio</b>: as áreas vizinhas com ordem de Apoio escolhem a quem ajudar.
              </li>
              <li>
                <b>Carta de Casa</b>: atacante e defensor escolhem, escondido, uma carta de Casa (ver “Cartas de Casa”).
              </li>
              <li>
                <b>Força</b> de cada lado = tropas + apoio + ordem (Marcha/Defesa) + força da carta (+1 se usar a Lâmina de Aço
                Valiriano).
              </li>
              <li>
                <b>Mesa de Batalha</b> (nesta versão): os dois posicionam as tropas e a luta decide quem vence (ver “Mesa de
                Batalha”). Quem tem mais força luta mais forte.
              </li>
              <li>
                <b>Quem perde</b>: perde peças = espadas ⚔ da carta de quem venceu − torres ▲ da carta de quem perdeu, e{" "}
                <b>recua</b>: o atacante volta para de onde veio; o defensor escolhe uma área vizinha livre ou sua. As peças
                que recuam ficam deitadas (feridas) até o fim da rodada.
              </li>
            </ol>
          </>
        );
      case "mesa":
        return (
          <>
            <h4>🗺 Mesa de Batalha</h4>
            <ol>
              <li>
                O campo tem <b>3 faixas</b>: esquerda, centro e direita. <b>Vence a batalha quem ganhar mais faixas.</b>
              </li>
              <li>
                <b>Posicionar</b>: toque numa peça (embaixo) e depois numa casinha do campo (frente ou trás). As casinhas
                mostram onde a peça rende mais: <b>★ melhor</b>, bom, normal ou <b>▼ fraco</b>. Ou use <b>Automático</b>.
              </li>
              <li>
                O inimigo fica escondido na névoa até os dois apertarem <b>Pronto</b>.
              </li>
              <li>
                Só há luta numa faixa onde <b>os dois lados</b> têm tropas. Se ninguém se encontrar, todos lutam no centro.
              </li>
              <li>
                A <b>força do tabuleiro</b> (a barra no topo) reforça as tropas: quem tem mais força bate mais forte em todas as
                faixas, mas a posição ainda pode virar a luta.
              </li>
              <li>
                Depois todos <b>assistem à luta</b>. Quem perdeu escolhe no mapa qual peça morre (se a carta mandar). A luta
                fica no Histórico em “▶ Ver a luta”.
              </li>
            </ol>
          </>
        );
      case "cartas":
        return (
          <>
            <h4>🃏 Cartas de Casa</h4>
            <ul>
              <li>Cada Casa tem 7 cartas de personagem. Em cada batalha você escolhe uma, escondido.</li>
              <li>
                Cada carta tem <b>força</b> (número grande), <b>espadas ⚔</b> (matam peças de quem perde) e <b>torres ▲</b>{" "}
                (protegem suas peças se você perder), e às vezes um <b>texto especial</b>.
              </li>
              <li>
                A carta usada fica descartada. Quando você usar todas, as 7 voltam para a mão (menos a última usada).
              </li>
              <li>Para ver suas cartas e as dos outros: botão “Cartas” no painel, ou clique numa Casa à direita.</li>
            </ul>
          </>
        );
      case "selvagens":
        return (
          <>
            <h4>🐺 Selvagens</h4>
            <ul>
              <li>
                A <b>ameaça dos Selvagens</b> (a trilha com o número) sobe com algumas cartas de Westeros. Quando sai a carta
                “Ataque dos Selvagens” ou a ameaça chega a 12, eles <b>atacam</b>.
              </li>
              <li>
                Todos fazem um <b>lance escondido</b> com fichas de Poder. As fichas do lance são perdidas, ganhe ou perca.
              </li>
              <li>
                <b>Soma dos lances ≥ força dos Selvagens</b>: a Patrulha da Noite vence. Quem deu o <b>maior lance</b> ganha
                uma recompensa e a ameaça volta a 0.
              </li>
              <li>
                <b>Soma menor</b>: os Selvagens vencem. Quem deu o <b>menor lance</b> sofre o pior castigo e os outros um
                castigo menor (está escrito na carta). A ameaça cai 2.
              </li>
              <li>O resultado aparece em “Últimos acontecimentos”, com quem ganhou e o que cada um sofreu.</li>
            </ul>
          </>
        );
      case "corvo":
        return (
          <>
            <h4>🐦 Corvo Mensageiro</h4>
            <ul>
              <li>Fica com quem está em 1º na trilha do Corvo (a “Corte do Rei”).</li>
              <li>
                Depois que todos colocam as ordens, ele pode fazer <b>uma</b> destas coisas:
                <ul>
                  <li>
                    <b>Trocar uma ordem sua</b> por outra que ainda não foi usada; ou
                  </li>
                  <li>
                    <b>Olhar a próxima carta dos Selvagens</b> e escolher deixá-la em cima ou mandá-la para baixo do monte.
                  </li>
                </ul>
              </li>
              <li>Pode também não fazer nada.</li>
              <li>
                Na Mesa de Batalha, quem tem o Corvo vê onde o inimigo se posicionou e pode mudar 1 esquadrão antes da luta.
              </li>
            </ul>
          </>
        );
      case "trilhas":
        return (
          <>
            <h4>📊 Trilhas de influência</h4>
            <p>São três. A ordem nelas é decidida nos leilões de fichas de Poder (carta de Westeros “Choque de Reis”).</p>
            <ul>
              <li>
                <b>Trono de Ferro</b>: define a ordem de jogada. O 1º desempata tudo, menos batalhas.
              </li>
              <li>
                <b>Feudos</b>: o 1º tem a <b>Lâmina de Aço Valiriano</b> (+1 de força numa batalha por rodada) e vence os
                empates de batalha.
              </li>
              <li>
                <b>Corte do Rei</b>: dá ordens com ★. O 1º tem o <b>Corvo Mensageiro</b>.
              </li>
            </ul>
          </>
        );
      case "suprimento":
        return (
          <>
            <h4>🛢 Suprimento e recrutamento</h4>
            <ul>
              <li>
                <b>Suprimento</b>: os barris nas áreas que você controla. Quanto mais barris, mais exércitos (e maiores) você
                pode ter. Ele é ajustado quando sai a carta de Westeros “Suprimento”.
              </li>
              <li>
                Se tiver tropas demais para o seu suprimento, você precisa tirar peças até caber.
              </li>
              <li>
                <b>Recrutamento</b> (carta “Recrutar”): cada <b>castelo dá 1 ponto</b> e cada <b>fortaleza dá 2</b>. Soldado
                custa 1, cavaleiro 2, máquina de cerco 2, navio 1 (num porto ou mar vizinho). Passe o mouse num castelo para
                ver quanto ele vale.
              </li>
            </ul>
          </>
        );
    }
  }
}
