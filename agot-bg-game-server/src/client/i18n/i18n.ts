import { observable } from "mobx";
import * as React from "react";
import en from "./locales/en";
import ptBR from "./locales/pt-BR";

/**
 * Sistema de tradução sem dependências externas.
 *
 * - `t(chave, params)` devolve texto simples (para `title`, `placeholder`,
 *   `confirm()`, `<option>` etc.).
 * - `tr(chave, params)` devolve um ReactNode e entende um pequeno conjunto de
 *   tags de formatação dentro da tradução: <b>, <i>, <small>, <br/>, <p>,
 *   <ul>, <li>. Nada de HTML arbitrário: o texto nunca é injetado como HTML.
 * - Parâmetros usam a forma `{nome}` e são inseridos só depois da formatação,
 *   então um parâmetro (ex.: nome de usuário) nunca vira tag.
 *
 * O idioma atual é um observable do mobx: componentes `@observer` que chamam
 * `t()`/`tr()` são renderizados de novo quando o idioma muda.
 */

export type Language = "pt-BR" | "en";
export type TranslationKey = keyof typeof en;
export type TranslationParams = { [name: string]: string | number };
/** Parâmetros de tr(): além de texto e números, aceitam elementos React
 * (ex.: o nome de uma Casa em negrito e colorido). */
export type RichTranslationParams = {
  [name: string]: string | number | React.ReactNode;
};

const dictionaries: {
  [lang in Language]: { [key in TranslationKey]: string };
} = {
  "pt-BR": ptBR,
  en: en
};

export const languageNames: { [lang in Language]: string } = {
  "pt-BR": "Português (Brasil)",
  en: "English"
};

export const supportedLanguages: Language[] = ["pt-BR", "en"];

const DEFAULT_LANGUAGE: Language = "pt-BR";
const STORAGE_KEY = "snr-language";

export function isLanguage(value: unknown): value is Language {
  return (
    typeof value == "string" && supportedLanguages.includes(value as Language)
  );
}

function loadLanguage(): Language {
  try {
    const stored =
      typeof localStorage != "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    if (isLanguage(stored)) {
      return stored;
    }
  } catch {
    // localStorage pode não existir ou estar bloqueado; usa o padrão.
  }
  return DEFAULT_LANGUAGE;
}

const currentLanguage = observable.box<Language>(loadLanguage());

if (typeof document != "undefined") {
  document.documentElement.lang = currentLanguage.get();
}

export function getLanguage(): Language {
  return currentLanguage.get();
}

export function setLanguage(language: Language): void {
  currentLanguage.set(language);
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Ignora: o idioma vale só para esta sessão.
  }
  if (typeof document != "undefined") {
    document.documentElement.lang = language;
  }
}

function getTemplate(key: TranslationKey): string {
  const translated = dictionaries[currentLanguage.get()][key];
  if (translated != undefined) {
    return translated;
  }
  const fallback = en[key];
  return fallback != undefined ? fallback : key;
}

function interpolate(text: string, params?: TranslationParams): string {
  if (!params) {
    return text;
  }
  return applyPlurals(text, params).replace(
    /\{(\w+)\}/g,
    (match, name: string) =>
      Object.prototype.hasOwnProperty.call(params, name)
        ? String(params[name])
        : match
  );
}

/**
 * Plural simples: "{n|ficha|fichas}" vira "ficha" quando n == 1 e "fichas"
 * nos outros casos. Pode ser usado junto com "{n}": "{n} {n|ficha|fichas}".
 */
function applyPlurals(
  text: string,
  params: { [name: string]: unknown }
): string {
  return text.replace(
    /\{(\w+)\|([^|{}]*)\|([^|{}]*)\}/g,
    (match, name: string, singular: string, plural: string) =>
      Object.prototype.hasOwnProperty.call(params, name)
        ? Number(params[name]) == 1
          ? singular
          : plural
        : match
  );
}

/** Texto traduzido, sem formatação. Tags de formatação são removidas. */
export function t(key: TranslationKey, params?: TranslationParams): string {
  const template = getTemplate(key)
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<\/?(b|i|small|p|ul|li)>/g, "");
  return interpolate(template, params);
}

const ALLOWED_TAGS = ["b", "i", "small", "p", "ul", "li"];
const TAG_PATTERN = /<(\/?)(b|i|small|p|ul|li|br)\s*(\/?)>/g;

interface RichNode {
  tag: string | null;
  children: (RichNode | string)[];
}

function parseRichText(template: string): RichNode {
  const root: RichNode = { tag: null, children: [] };
  const stack: RichNode[] = [root];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  TAG_PATTERN.lastIndex = 0;
  while ((match = TAG_PATTERN.exec(template)) != null) {
    const top = stack[stack.length - 1];
    if (match.index > lastIndex) {
      top.children.push(template.substring(lastIndex, match.index));
    }
    lastIndex = TAG_PATTERN.lastIndex;

    const [, closing, tag] = match;
    if (tag == "br") {
      top.children.push({ tag: "br", children: [] });
    } else if (closing) {
      // Fecha a tag mais recente com esse nome (tolera tags mal fechadas).
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag == tag) {
          stack.length = i;
          break;
        }
      }
    } else if (ALLOWED_TAGS.includes(tag)) {
      const node: RichNode = { tag, children: [] };
      top.children.push(node);
      stack.push(node);
    }
  }
  if (lastIndex < template.length) {
    stack[stack.length - 1].children.push(template.substring(lastIndex));
  }
  return root;
}

function renderRichText(
  text: string,
  params: RichTranslationParams | undefined
): React.ReactNode {
  if (!params) {
    return text;
  }
  const withPlurals = applyPlurals(text, params);
  const parts: React.ReactNode[] = [];
  const pattern = /\{(\w+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(withPlurals)) != null) {
    const name = match[1];
    if (!Object.prototype.hasOwnProperty.call(params, name)) {
      continue;
    }
    if (match.index > lastIndex) {
      parts.push(withPlurals.substring(lastIndex, match.index));
    }
    const value = params[name];
    parts.push(
      typeof value == "string" || typeof value == "number"
        ? String(value)
        : React.createElement(React.Fragment, { key: parts.length }, value)
    );
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < withPlurals.length) {
    parts.push(withPlurals.substring(lastIndex));
  }
  return parts.length == 1 && typeof parts[0] == "string"
    ? parts[0]
    : React.createElement(React.Fragment, null, ...parts);
}

function renderRichNode(
  node: RichNode | string,
  params: RichTranslationParams | undefined,
  key: number
): React.ReactNode {
  if (typeof node == "string") {
    return renderRichText(node, params);
  }
  const children = node.children.map((child, i) =>
    renderRichNode(child, params, i)
  );
  if (node.tag == null) {
    return React.createElement(React.Fragment, { key }, ...children);
  }
  if (node.tag == "br") {
    return React.createElement("br", { key });
  }
  return React.createElement(node.tag, { key }, ...children);
}

/** Texto traduzido com formatação (<b>, <i>, <br/>…) como ReactNode. */
export function tr(
  key: TranslationKey,
  params?: RichTranslationParams
): React.ReactNode {
  return renderRichNode(parseRichText(getTemplate(key)), params, 0);
}
