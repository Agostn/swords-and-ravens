import { observer } from "mobx-react";
import * as React from "react";
import { Component, ReactNode } from "react";
import {
  getLanguage,
  isLanguage,
  languageNames,
  setLanguage,
  supportedLanguages,
  t
} from "./i18n";

interface LanguageSelectComponentProps {
  className?: string;
}

@observer
export default class LanguageSelectComponent extends Component<LanguageSelectComponentProps> {
  render(): ReactNode {
    return (
      <label
        className={`d-inline-flex align-items-center mb-0 ${this.props.className ?? ""}`}
      >
        <span className="mr-2">{t("language.label")}:</span>
        <select
          className="custom-select custom-select-sm"
          style={{ width: "auto" }}
          value={getLanguage()}
          onChange={(e) => {
            if (isLanguage(e.target.value)) {
              setLanguage(e.target.value);
            }
          }}
        >
          {supportedLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {languageNames[lang]}
            </option>
          ))}
        </select>
      </label>
    );
  }
}
