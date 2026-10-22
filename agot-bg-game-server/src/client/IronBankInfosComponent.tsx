import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import * as React from "react";
import { Card, Col, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import IngameGameState from "../common/ingame-game-state/IngameGameState";
import IronBank from "../common/ingame-game-state/game-data-structure/IronBank";
import HouseNumberResultsComponent from "./HouseNumberResultsComponent";
import House from "../common/ingame-game-state/game-data-structure/House";
import preventOverflow from "@popperjs/core/lib/modifiers/preventOverflow";
import braavosInitialLoanCostReduceImage from "../../public/images/garrisons/braavos-initial-loan-cost-reduce.png"
import ironBankImage from "../../public/images/ironBank.jpg"
import { OverlayChildren } from "react-bootstrap/esm/Overlay";
import { t, tr } from "./i18n/i18n";

interface IronBankInfosComponentProps {
    ingame: IngameGameState;
    ironBank: IronBank;
}

@observer
export default class IronBankInfosComponent extends Component<IronBankInfosComponentProps> {
    get isEssosMapUsed(): boolean {
        return this.props.ingame.entireGame.gameSettings.playerCount >= 8;
    }

    render(): ReactNode {
        const braavosController = this.props.ironBank.controllerOfBraavos;
        const interestCosts = this.props.ironBank.interestCostPerHouse;
        const backgroundOpacity = braavosController || interestCosts.length > 0 ? 0.7 : 1;
        return (
            <>
                <Card style={{ height: "100%" }} className="hover-weak-outline">
                    <Card.Img variant="top" src={ironBankImage} style={{opacity: backgroundOpacity, height: "100%", width: "auto"}}/>
                    <Card.ImgOverlay style={{ padding: 16, paddingBottom: 8 }} className="clickable-no-underline">
                        <OverlayTrigger
                            overlay={this.renderIronBankTooltip()}
                            placement="auto"
                            popperConfig={{ modifiers: [preventOverflow] }}
                            trigger="click"
                            rootClose
                        >
                            {this.renderIronBankInfos(braavosController, interestCosts)}
                        </OverlayTrigger>
                    </Card.ImgOverlay>
                </Card>
            </>
        );
    }

    renderIronBankInfos(braavosController: House | null, interestCosts: [House, number][]): JSX.Element {
        return <Row style={{ height: "100%" }} className="align-items-center">
            <Col xs={12}>
                {braavosController &&
                    <Row className="justify-content-center" style={{ marginBottom: 16 }}>
                        <OverlayTrigger
                            placement="auto"
                            overlay={<Tooltip id="braavos-controller-tooltip">{tr("auto.IronBankInfosComponent.0", { p0: (<b>-1</b>) })}</Tooltip>}
                            popperConfig={{ modifiers: [preventOverflow] }}>
                            <Row className="align-items-center justify-content-cener">
                                <Col xs="auto" className="p-1">
                                    <img src={braavosInitialLoanCostReduceImage} width={120} />
                                </Col>
                                <Col className="p-1">
                                    <h5 style={{ display: "inline" }}><b style={{marginLeft: "5px"}}>{braavosController.name}</b></h5>
                                </Col>
                            </Row>
                        </OverlayTrigger>
                    </Row>}
                {interestCosts.length > 0 &&
                    <Row className="justify-content-center">
                        <OverlayTrigger overlay={<Tooltip id="interests-costs-tooltip" className="tooltip-w-100">
                            {tr("auto.IronBankInfosComponent.2")}</Tooltip>}
                            placement="auto"
                            popperConfig={{ modifiers: [preventOverflow] }}
                        >
                            <Col xs={12} className="py-1">
                                <h5 className="text-center">{t("auto.IronBankInfosComponent.1")}</h5>
                            </Col>
                        </OverlayTrigger>
                        <Col xs="auto" className="py-0">
                            <HouseNumberResultsComponent results={interestCosts} keyPrefix="iron-bank-interests-costs" bold makeGreyjoyBlack />
                        </Col>
                    </Row>}
            </Col>
        </Row>;
    }

    renderIronBankTooltip(): OverlayChildren {
        return <Tooltip id="iron-bank-tooltip" className="scrollable-tooltip">
            <Row>
                <Col className="p-2 m-2">
                    <h4 className="text-center">{t("auto.IronBankInfosComponent.3")}</h4>
                    {tr("auto.IronBankInfosComponent.4")}
                    <h5>{t("auto.IronBankInfosComponent.5")}</h5>
                    {tr("auto.IronBankInfosComponent.6")}
                    <ol className="mb-0 mt-1">
                        <li>{t("auto.IronBankInfosComponent.7")}</li>
                        <li>{tr("auto.IronBankInfosComponent.8", { p0: (this.isEssosMapUsed ? t("auto2.IronBankInfosComponent.0") : t("auto2.IronBankInfosComponent.1")) })}</li>
                        <li>{tr("auto.IronBankInfosComponent.9")}</li>
                    </ol>
                    <br/>
                    <h5>{t("auto.IronBankInfosComponent.10")}</h5>
                    {tr("auto.IronBankInfosComponent.11")}
                    {this.isEssosMapUsed &&
                    <>
                        <br/>
                        <h5>{t("auto.IronBankInfosComponent.12")}</h5>
                        {tr("auto.IronBankInfosComponent.13", { p0: (<b>–1</b>) })}</>}
                </Col>
            </Row>
        </Tooltip>;
    }
}