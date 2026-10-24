import React, {Component} from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import orderImages from "../../orderImages";
import classNames from "classnames";
import Order from "../../../common/ingame-game-state/game-data-structure/Order";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { t, tr } from "../../i18n/i18n";
import hudSettings from "../../hud/hudSettings";
import MarchOrderType from "../../../common/ingame-game-state/game-data-structure/order-types/MarchOrderType";
import DefenseOrderType from "../../../common/ingame-game-state/game-data-structure/order-types/DefenseOrderType";
import SupportOrderType from "../../../common/ingame-game-state/game-data-structure/order-types/SupportOrderType";
import RaidOrderType from "../../../common/ingame-game-state/game-data-structure/order-types/RaidOrderType";
import ConsolidatePowerOrderType from "../../../common/ingame-game-state/game-data-structure/order-types/ConsolidatePowerOrderType";

interface OrderGridProps {
    orders: Order[];
    selectedOrder: Order | null;
    availableOrders: Order[];
    restrictedOrders: Order[];
    onOrderClick: (order: Order) => void;
    // Ordens já colocadas em outras áreas (para dizer "em uso" em vez de só apagar)
    usedOrders?: Order[];
    // Ordem que já está nesta área (aparece marcada como "nesta área")
    currentOrder?: Order | null;
}

type OrderState = "available" | "here" | "used" | "restricted" | "star" | "unavailable";

export default class OrderGridComponent extends Component<OrderGridProps> {
    private familyName(o: Order): string {
        const type = o.type;
        if (type instanceof MarchOrderType) return t("orders.family.march");
        if (type instanceof DefenseOrderType) return t("orders.family.defense");
        if (type instanceof SupportOrderType) return t("orders.family.support");
        if (type instanceof RaidOrderType) return t("orders.family.raid");
        if (type instanceof ConsolidatePowerOrderType) return t("orders.family.consolidate");
        return type.name;
    }

    private stateOf(o: Order): OrderState {
        if (this.props.currentOrder == o) return "here";
        if (this.props.restrictedOrders.includes(o)) return "restricted";
        if (this.isOrderAvailable(o)) return "available";
        if (this.props.usedOrders?.includes(o)) return "used";
        if (this.props.restrictedOrders.includes(o)) return "restricted";
        if (o.type.starred) return "star";
        return "unavailable";
    }

    // Tela nova: uma linha por tipo de ordem; o que não dá para usar fica
    // apagado com o motivo escrito (em uso, proibida, sem ★ livre).
    private renderHud(): JSX.Element {
        const families: { key: string; name: string; orders: Order[] }[] = [];
        this.props.orders.forEach(o => {
            const f = families.find(x => x.orders[0].type.constructor == o.type.constructor);
            if (f) f.orders.push(o);
            else families.push({ key: o.type.id, name: this.familyName(o), orders: [o] });
        });
        return (
            <div className="ordpick">
                {families.map(f => (
                    <div className="ordpick-row" key={`ordpick-${f.key}`}>
                        <span className="ordpick-label">{f.name}</span>
                        <div className="ordpick-tokens">
                            {f.orders.map(o => {
                                const state = this.stateOf(o);
                                const reason = state == "available" ? "" : t(`orders.state.${state}`);
                                const blocked = state != "available" && state != "here";
                                return (
                                    <button
                                        type="button"
                                        key={`ordpick-o-${o.id}`}
                                        className={classNames("ordpick-token", state, { selected: this.props.selectedOrder == o || state == "here" })}
                                        disabled={blocked}
                                        title={reason ? `${o.type.name} · ${reason}` : o.type.name}
                                        aria-label={reason ? `${o.type.name}: ${reason}` : o.type.name}
                                        onClick={() => this.onOrderClick(o)}
                                    >
                                        <span className="order-icon ordpick-img" style={{ backgroundImage: `url(${orderImages.get(o.type.id)})` }} />
                                        {state != "available" && <span className="ordpick-badge">{reason}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    render(): JSX.Element {
        if (hudSettings.hudActive) return this.renderHud();
        return (
            <Row className="justify-content-center">
                <Col xs="auto">
                    <Row style={{width: "180px"}} className="justify-content-center m-3">
                        {this.props.orders.map(o => (
                            <OverlayTrigger
                                key={"order-overlay_" + o.id}
                                placement="right"
                                overlay={
                                    <Tooltip id={"order-tooltip-" + o.id}><b>{o.type.name}</b>{this.props.restrictedOrders.includes(o) &&
                                    <>{tr("auto.game-state-panel.utils.OrderGridComponent.0")}</>}</Tooltip>
                                }
                                delay={{ show: 250, hide: 100 }}
                            >
                                <Col xs="auto" className="p-1" key={`order-icon-container_${o.id}`}>
                                    <div className={classNames(
                                            "order-icon",
                                            {"clickable": this.isOrderAvailable(o)},
                                            {"hover-weak-outline": this.isOrderAvailable(o) && this.props.selectedOrder != o},
                                            {"medium-outline": this.props.selectedOrder == o},
                                            {"hover-strong-outline": this.props.selectedOrder == o},
                                            {"restricted-order": this.props.restrictedOrders.includes(o)},
                                            {"unavailable-order": !this.isOrderAvailable(o)}
                                            )
                                        }
                                        style={{
                                            backgroundImage: `url(${orderImages.get(o.type.id)})`
                                        }}
                                        onClick={() => this.onOrderClick(o)}
                                        key={`order-icon_${o.id}`}/>
                                </Col>
                            </OverlayTrigger>
                        ))}
                    </Row>
                </Col>
            </Row>
        );
    }

    isOrderAvailable(o: Order): boolean {
        return this.props.availableOrders.includes(o);
    }

    onOrderClick(o: Order): void {
        if (!this.isOrderAvailable(o)) {
            return;
        }

        this.props.onOrderClick(o);
    }
}
