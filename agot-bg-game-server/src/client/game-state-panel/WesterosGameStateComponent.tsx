import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import WesterosGameState from "../../common/ingame-game-state/westeros-game-state/WesterosGameState";
import WildlingsAttackGameState from "../../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/WildlingsAttackGameState";
import * as React from "react";
import WildlingsAttackComponent from "./wildlings-attack-component/WildlingsAttackComponent";
import ReconcileArmiesGameState from "../../common/ingame-game-state/westeros-game-state/reconcile-armies-game-state/ReconcileArmiesGameState";
import ReconcileArmiesComponent from "./ReconcileArmiesComponent";
import ClashOfKingsGameState from "../../common/ingame-game-state/westeros-game-state/clash-of-kings-game-state/ClashOfKingsGameState";
import ClashOfKingsComponent from "./ClashOfKingsComponent";
import MusteringGameState from "../../common/ingame-game-state/westeros-game-state/mustering-game-state/MusteringGameState";
import MusteringComponent from "./MusteringComponent";
import PutToTheSwordGameState from "../../common/ingame-game-state/westeros-game-state/put-to-the-swords-game-state/PutToTheSwordGameState";
import SimpleChoiceComponent from "./SimpleChoiceComponent";
import DarkWingsDarkWordsGameState from "../../common/ingame-game-state/westeros-game-state/dark-wings-dark-words-game-state/DarkWingsDarkWordsGameState";
import AThroneOfBladesGameState from "../../common/ingame-game-state/westeros-game-state/thrones-of-blades-game-state/AThroneOfBladesGameState";
import GameStateComponentProps from "./GameStateComponentProps";
import renderChildGameState from "../utils/renderChildGameState";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import classNames from "classnames";
import WesterosCardComponent from "./utils/WesterosCardComponent";
import WesterosDeck4GameState from "../../common/ingame-game-state/westeros-game-state/westeros-deck-4-game-state/WesterosDeck4GameState";
import WesterosDeck4Component from "./westeros-deck-4-component/WesterosDeck4Component";
import TheBurdenOfPowerGameState from "../../common/ingame-game-state/westeros-game-state/the-burden-of-power-game-state/TheBurdenOfPowerGameState";
import ShiftingAmbitionsGameState from "../../common/ingame-game-state/westeros-game-state/shifting-ambitions-game-state/ShiftingAmbitionsGameState";
import ShiftingAmbitionsComponent from "./ShiftingAmbitionsComponent";
import NewInformationGameState from "../../common/ingame-game-state/westeros-game-state/new-information-game-state/NewInformationGameState";
import NewInformationComponent from "./NewInformationComponent";
import PossiblePowerTokenGainsComponent from "../PossiblePowerTokenGainsComponent";
import hudSettings from "../hud/hudSettings";
import { t } from "../i18n/i18n";

@observer
export default class WesterosGameStateComponent extends Component<
  GameStateComponentProps<WesterosGameState>
> {
  // Tela nova: as cartas da rodada como etapas (já resolvida / agora / depois),
  // cada uma com o baralho, o nome e o efeito.
  private renderHudSteps(): ReactNode {
    const gs = this.props.gameState;
    const deckNames = ["I", "II", "III", "IV"];
    return (
      <ol className="hud-westeros-steps">
        {gs.revealedCards.map((wc, i) => {
          const deckI = gs.revealAndResolveTop2WesterosDeck4Cards ? 3 : i;
          const status =
            i < gs.currentCardI ? "done" : i == gs.currentCardI ? "now" : "next";
          return (
            <li
              key={`hud-westeros-step_${wc.id}_${i}`}
              className={classNames("hud-westeros-step", status)}
              aria-current={status == "now" ? "step" : undefined}
            >
              <div className="hud-westeros-step-card">
                <WesterosCardComponent
                  cardType={wc.type}
                  westerosDeckI={deckI}
                  wasReshuffled={gs.game.winterIsComingHappened[i]}
                  size={"tiny"}
                  tooltip={true}
                />
              </div>
              <div className="hud-westeros-step-text">
                <span className="hud-westeros-step-top">
                  <small>{t("hud.westeros.deck", { n: deckNames[deckI] ?? deckI + 1 })}</small>
                  <span className="hud-westeros-step-status">
                    {t(`hud.westeros.step.${status}`)}
                  </span>
                </span>
                <b>{wc.type.name}</b>
                {wc.type.shortDescription && <small>{wc.type.shortDescription}</small>}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  render(): ReactNode {
    return (
      <>
        {hudSettings.hudActive && this.renderHudSteps()}
        {!hudSettings.hudActive && (
        <Row className="justify-content-around mb-3">
          {this.props.gameState.revealedCards.map((wc, i) => (
            <Col xs="auto" key={`westeros-state_${wc.id}_${i}`}>
              <WesterosCardComponent
                cardType={wc.type}
                westerosDeckI={
                  this.props.gameState.revealAndResolveTop2WesterosDeck4Cards
                    ? 3
                    : i
                }
                wasReshuffled={
                  this.props.gameState.game.winterIsComingHappened[i]
                }
                size={"small"}
                tooltip={true}
                classNames={classNames({
                  "medium-outline": this.props.gameState.currentCardI == i,
                })}
              />
            </Col>
          ))}
        </Row>
        )}
        {this.props.gameState.childGameState instanceof
          PutToTheSwordGameState ||
        this.props.gameState.childGameState instanceof
          DarkWingsDarkWordsGameState ||
        this.props.gameState.childGameState instanceof
          AThroneOfBladesGameState ||
        this.props.gameState.childGameState instanceof
          TheBurdenOfPowerGameState ? (
          <Row>
            <SimpleChoiceComponent
              gameClient={this.props.gameClient}
              gameState={this.props.gameState.childGameState.childGameState}
              mapControls={this.props.mapControls}
            />
          </Row>
        ) : (
          renderChildGameState(this.props, [
            [WildlingsAttackGameState, WildlingsAttackComponent],
            [ReconcileArmiesGameState, ReconcileArmiesComponent],
            [ClashOfKingsGameState, ClashOfKingsComponent],
            [MusteringGameState, MusteringComponent],
            [WesterosDeck4GameState, WesterosDeck4Component],
            [ShiftingAmbitionsGameState, ShiftingAmbitionsComponent],
            [NewInformationGameState, NewInformationComponent],
          ])
        )}
        {this.props.gameState.childGameState instanceof
          DarkWingsDarkWordsGameState &&
          !this.props.gameState.ingame.fogOfWar && (
            <Row className="mt-3 justify-content-center">
              <PossiblePowerTokenGainsComponent
                ingame={this.props.gameState.ingame}
              />
            </Row>
          )}
      </>
    );
  }
}
