import { Component, ReactNode } from "react";
import * as React from "react";
import FormCheck from "react-bootstrap/FormCheck";
import Col from "react-bootstrap/Col";
import { OverlayTrigger, Tooltip, Row } from "react-bootstrap";
import User from "../server/User";
import EntireGame from "../common/EntireGame";
import IngameGameState from "../common/ingame-game-state/IngameGameState";
import { observable } from "mobx";
import { observer } from "mobx-react";
import { t, tr } from "./i18n/i18n";
import LanguageSelectComponent from "./i18n/LanguageSelectComponent";

interface UserSettingsComponentProps {
  entireGame: EntireGame;
  user: User | null;
}

@observer
export default class UserSettingsComponent extends Component<UserSettingsComponentProps> {
  @observable mapScrollbar = false;
  @observable chatHouseNames = false;
  @observable gameStateColumnRight = false;

  render(): ReactNode {
    return (
      <>
        {this.props.user &&
          this.props.entireGame.childGameState instanceof IngameGameState && (
            <div className="mt-3">
              <Row>
                <Col xs="auto">
                  <FormCheck
                    id="chat-house-names-setting"
                    type="switch"
                    label={
                      <OverlayTrigger
                        overlay={
                          <Tooltip id="chat-house-names-tooltip">
                            {tr("userSettings.chatHouseNames.tooltip")}
                          </Tooltip>
                        }
                      >
                        <label htmlFor="chat-house-names-setting">
                          {t("userSettings.chatHouseNames.label")}
                        </label>
                      </OverlayTrigger>
                    }
                    checked={this.chatHouseNames}
                    onChange={() => {
                      this.chatHouseNames = !this.chatHouseNames;
                      this.changeUserSettings();
                    }}
                  />
                </Col>
              </Row>
              <Row>
                <Col xs="auto">
                  <FormCheck
                    id="map-scrollbar-setting"
                    type="switch"
                    label={
                      <OverlayTrigger
                        overlay={
                          <Tooltip id="map-scrollbar-tooltip">
                            {tr("userSettings.mapScrollbar.tooltip")}
                          </Tooltip>
                        }
                      >
                        <label htmlFor="map-scrollbar-setting">
                          {t("userSettings.mapScrollbar.label")}
                        </label>
                      </OverlayTrigger>
                    }
                    checked={this.mapScrollbar}
                    onChange={() => {
                      this.mapScrollbar = !this.mapScrollbar;
                      this.changeUserSettings();
                    }}
                  />
                </Col>
              </Row>
              <Row>
                <Col xs="auto">
                  <FormCheck
                    id="game-state-column-right-setting"
                    type="switch"
                    label={
                      <OverlayTrigger
                        overlay={
                          <Tooltip id="game-state-column-right-setting-tooltip">
                            {tr("userSettings.gameStateColumnRight.tooltip")}
                          </Tooltip>
                        }
                      >
                        <label htmlFor="game-state-column-right-setting">
                          {t("userSettings.gameStateColumnRight.label")}
                        </label>
                      </OverlayTrigger>
                    }
                    checked={this.gameStateColumnRight}
                    onChange={() => {
                      this.gameStateColumnRight = !this.gameStateColumnRight;
                      this.changeUserSettings();
                    }}
                  />
                </Col>
              </Row>
              <Row className="justify-content-center mt-1 mb-1">
                <LanguageSelectComponent />
              </Row>
            </div>
          )}
      </>
    );
  }

  componentDidMount(): void {
    if (this.props.user) {
      this.mapScrollbar = this.props.user.settings.mapScrollbar;
      this.chatHouseNames = this.props.user.settings.chatHouseNames;
      this.gameStateColumnRight = this.props.user.settings.gameStateColumnRight;
    }
  }

  changeUserSettings(): void {
    if (this.props.user) {
      this.props.user.settings.mapScrollbar = this.mapScrollbar;
      this.props.user.settings.chatHouseNames = this.chatHouseNames;
      this.props.user.settings.gameStateColumnRight = this.gameStateColumnRight;
      this.props.user.syncSettings();
    }
  }
}
