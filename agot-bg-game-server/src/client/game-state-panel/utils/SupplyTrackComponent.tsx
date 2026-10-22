import { Component, default as React, ReactNode } from "react";
import { observer } from "mobx-react";
import Badge from "react-bootstrap/Badge";
import Col from "react-bootstrap/Col";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Row from "react-bootstrap/Row";
import Tooltip from "react-bootstrap/Tooltip";
import houseInfluenceImages from "../../houseInfluenceImages";
import House from "../../../common/ingame-game-state/game-data-structure/House";
import BetterMap from "../../../utils/BetterMap";
import barrelImage from "../../../../public/images/icons/barrel.svg";
import Region from "../../../common/ingame-game-state/game-data-structure/Region";
import PartialRecursive from "../../../utils/PartialRecursive";
import MapControls, {
  RegionOnMapProperties
} from "../../../client/MapControls";
import IngameGameState from "../../../common/ingame-game-state/IngameGameState";
import { observable } from "mobx";
import _ from "lodash";
import GameClient from "../../GameClient";
import { t, tr } from "../../i18n/i18n";

interface SupplyTrackComponentProps {
  gameClient: GameClient;
  supplyRestrictions: number[][];
  houses: House[];
  ingame: IngameGameState;
  mapControls: MapControls;
}

@observer
export default class SupplyTrackComponent extends Component<SupplyTrackComponentProps> {
  modifyRegionsOnMapCallback: any;
  @observable highlightedRegions = new BetterMap<
    Region,
    PartialRecursive<RegionOnMapProperties>
  >();

  get fogOfWar(): boolean {
    return this.props.ingame.fogOfWar;
  }

  render(): ReactNode {
    return (
      <Row>
        <Col xs="auto">
          <OverlayTrigger
            overlay={
              <Tooltip id="supply-track">
                {tr("auto.game-state-panel.utils.SupplyTrackComponent.0")}</Tooltip>
            }
            placement="right"
          >
            <img width="32px" src={barrelImage} alt={t("auto2.game-state-panel.utils.SupplyTrackComponent.0")} />
          </OverlayTrigger>
        </Col>
        <Col>
          <Row className="justify-content-center">
            {this.props.supplyRestrictions.map((allowedArmies, i) => (
              <Col
                xs="auto"
                key={`supply-track_${i}`}
                className="d-flex flex-column align-items-center"
              >
                <div>
                  <OverlayTrigger
                    overlay={
                      <Tooltip id={`supply-track-col-${i}`}>
                        {i == 0 ? (
                          <>
                            {t("auto.game-state-panel.utils.SupplyTrackComponent.1")}</>
                        ) : i == 1 ? (
                          <>
                            {t("auto.game-state-panel.utils.SupplyTrackComponent.2")}</>
                        ) : i == 2 ? (
                          <>
                            {t("auto.game-state-panel.utils.SupplyTrackComponent.3")}</>
                        ) : i == 3 ? (
                          <>
                            {t("auto.game-state-panel.utils.SupplyTrackComponent.4")}</>
                        ) : i == 4 ? (
                          <>
                            {t("auto.game-state-panel.utils.SupplyTrackComponent.5")}</>
                        ) : i == 5 ? (
                          <>
                            {t("auto.game-state-panel.utils.SupplyTrackComponent.6")}</>
                        ) : (
                          <>
                            {t("auto.game-state-panel.utils.SupplyTrackComponent.7")}</>
                        )}
                      </Tooltip>
                    }
                    placement="auto"
                  >
                    <Badge variant="secondary" style={{ fontSize: "1rem" }}>
                      {i}
                    </Badge>
                  </OverlayTrigger>
                </div>
                <div className="d-flex">
                  <div
                    style={{
                      width: "18px",
                      marginRight: "6px",
                      marginTop: "10px"
                    }}
                  >
                    {this.getHousesAtSupplyLevel(i)
                      .filter((h) =>
                        !this.fogOfWar
                          ? h
                          : this.props.gameClient.doesControlHouse(h)
                      )
                      .map((h) => (
                        <OverlayTrigger
                          key={`supply-for-house-tooltip_${h.id}`}
                          overlay={
                            <Tooltip id={`supply-house-${h.id}`}>
                              {h.name}
                            </Tooltip>
                          }
                          placement="auto"
                        >
                          <div
                            key={`supply-for-house_${h.id}`}
                            className="supply-icon hover-weak-outline"
                            style={{
                              backgroundImage: `url(${houseInfluenceImages.get(h.id)})`,
                              marginTop: "-5px"
                            }}
                            onMouseEnter={() => this.setHighlightedRegions(h)}
                            onMouseLeave={() => this.highlightedRegions.clear()}
                          ></div>
                        </OverlayTrigger>
                      ))}
                  </div>
                  <div>
                    {allowedArmies.map((size, i) => (
                      <div
                        style={{ marginBottom: "-6px" }}
                        key={`allowed-army-size_${i}`}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    );
  }

  setHighlightedRegions(house: House): void {
    const regions = this.props.ingame.world.regions.values.filter(
      (r) => r.supplyIcons > 0 && r.getController() == house
    );
    this.highlightedRegions.clear();

    regions.forEach((r) => {
      this.highlightedRegions.set(r, {
        highlight: {
          active: true,
          color: house.getHighlightColor(),
          light: r.type.id == "sea",
          strong: r.type.id == "land",
          text: r.supplyIcons > 1 ? r.supplyIcons.toString() : undefined
        }
      });
    });

    this.props.ingame.world.regions.values.forEach((r) => {
      if (!this.highlightedRegions.has(r)) {
        this.highlightedRegions.set(r, { highlight: { active: false } });
      }
    });
  }

  getHousesAtSupplyLevel(supplyLevel: number): House[] {
    return this.props.houses.filter((h) => h.supplyLevel == supplyLevel);
  }

  modifyRegionsOnMap(): [Region, PartialRecursive<RegionOnMapProperties>][] {
    return this.highlightedRegions.entries;
  }

  componentDidMount(): void {
    this.props.mapControls.modifyRegionsOnMap.push(
      (this.modifyRegionsOnMapCallback = () => this.modifyRegionsOnMap())
    );
  }

  componentWillUnmount(): void {
    _.pull(
      this.props.mapControls.modifyRegionsOnMap,
      this.modifyRegionsOnMapCallback
    );
  }
}
