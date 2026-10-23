import {Component} from "react";
import * as React from "react";
import {observer} from "mobx-react";
import SimpleChoiceGameState from "../../common/ingame-game-state/simple-choice-game-state/SimpleChoiceGameState";
import GameStateComponentProps from "./GameStateComponentProps";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { t } from "../i18n/i18n";
import { translateServerText, letteredChoices, LabeledChoice } from "../i18n/serverText";

@observer
export default class SimpleChoiceComponent extends Component<GameStateComponentProps<SimpleChoiceGameState>> {
    private get lettered(): LabeledChoice[] | null {
        return letteredChoices(this.props.gameState.description, this.props.gameState.choices);
    }

    render(): JSX.Element {
        return (
            <>
                <Col xs={12} className="text-center" style={{whiteSpace: "pre-line"}}>
                    {translateServerText(this.props.gameState.description)}
                </Col>
                <Col xs={12} className="text-center">
                    {this.props.gameClient.doesControlHouse(this.props.gameState.house) && this.lettered ? (
                        <Row className="justify-content-center">
                            {this.lettered.map(c => (
                                <Col xs="auto" key={`simple-choice-lettered_${c.index}`} className="mb-2">
                                    <Button type="button" variant="secondary" className="lettered-choice" onClick={() => this.choose(c.index)}>
                                        <span className="lettered-choice-title"><b>{c.letter})</b> {c.title}</span>
                                        <small>{c.detail}</small>
                                    </Button>
                                </Col>
                            ))}
                        </Row>
                    ) : this.props.gameClient.doesControlHouse(this.props.gameState.house) ? (
                        <Row className="justify-content-center">
                            {this.props.gameState.choices.map((s, i) => {
                                const variant = s == "Ignore"
                                    ? "danger"
                                    : s == "Activate"
                                        ? "success"
                                        : undefined;
                                return <Col xs="auto" key={`simple-choice_${i}`}>
                                    <Button type="button" variant={variant} onClick={() => this.choose(i)}>{translateServerText(s)}</Button>
                                </Col>;
                            })}
                        </Row>
                    ) : (
                        <>{t("common.waitingFor", { who: this.props.gameState.parentGameState.ingame.getControllerOfHouse(this.props.gameState.house).house.name })}</>
                    )}
                </Col>
            </>
        );
    }

    choose(choice: number): void {
        this.props.gameState.choose(choice);
    }
}
