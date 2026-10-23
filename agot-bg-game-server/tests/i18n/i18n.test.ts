// Testes do sistema de tradução. Rodar: node_modules/.bin/jest tests/i18n
import { t, tr, setLanguage, getLanguage } from "../../src/client/i18n/i18n";
import en from "../../src/client/i18n/locales/en";
import ptBR from "../../src/client/i18n/locales/pt-BR";
import { translateServerText } from "../../src/client/i18n/serverText";
import { translateDataText } from "../../src/client/i18n/dataTranslations";

const PARAM = /\{(\w+)\}/g;
const TAG = /<\/?(b|i|small|p|ul|li)>|<br\s*\/?>/g;

describe("dicionários", () => {
  it("o português tem todas as chaves do inglês e nenhuma a mais", () => {
    expect(Object.keys(ptBR).sort()).toEqual(Object.keys(en).sort());
  });

  it("nenhuma tradução usa parâmetro que não existe no inglês", () => {
    const problems: string[] = [];
    (Object.keys(en) as (keyof typeof en)[]).forEach((k) => {
      const enParams = new Set([...en[k].matchAll(PARAM)].map((m) => m[1]));
      [...ptBR[k].matchAll(PARAM)].forEach((m) => {
        if (!enParams.has(m[1])) problems.push(`${k}: {${m[1]}}`);
      });
    });
    expect(problems).toEqual([]);
  });

  it("as tags de formatação estão equilibradas em todas as traduções", () => {
    const problems: string[] = [];
    (Object.keys(ptBR) as (keyof typeof ptBR)[]).forEach((k) => {
      const opened: string[] = [];
      for (const m of ptBR[k].matchAll(TAG)) {
        const tag = m[0];
        if (/^<br/.test(tag)) continue;
        if (tag.startsWith("</")) {
          if (opened.pop() != tag.slice(2, -1)) problems.push(k);
        } else opened.push(tag.slice(1, -1));
      }
      if (opened.length) problems.push(k);
    });
    expect([...new Set(problems)]).toEqual([]);
  });
});

describe("t() e tr()", () => {
  beforeEach(() => setLanguage("pt-BR"));

  it("usa português por padrão", () => {
    expect(getLanguage()).toBe("pt-BR");
    expect(t("lobby.choose")).toBe("Escolher");
  });

  it("troca de idioma", () => {
    setLanguage("en");
    expect(t("lobby.choose")).toBe("Choose");
  });

  it("insere parâmetros e plural", () => {
    expect(t("lobby.seat", { n: 3 })).toBe("Assento 3");
    expect(t("consolidate.gainPowerTokens", { n: 1 })).toBe("Ganhar 1 Ficha de Poder");
    expect(t("consolidate.gainPowerTokens", { n: 4 })).toBe("Ganhar 4 Fichas de Poder");
  });

  it("parâmetro nunca vira tag (proteção contra nomes de usuário maliciosos)", () => {
    const node = tr("lobby.seat", { n: "<b>x</b>" }) as any;
    expect(JSON.stringify(node)).not.toMatch(/"type":"b"/);
  });
});

describe("textos vindos dos dados e do servidor", () => {
  beforeEach(() => setLanguage("pt-BR"));

  it("traduz lugares como na série", () => {
    expect(translateDataText("region", "", "King's Landing")).toBe("Porto Real");
    expect(translateDataText("region", "", "Winterfell")).toBe("Winterfell");
    expect(translateDataText("region", "", "Port of White Harbor")).toBe("Porto Branco (porto)");
    expect(translateDataText("region", "", "Port of Pyke")).toBe("Porto de Pyke");
  });

  it("traduz cartas", () => {
    expect(translateDataText("westeros.name", "rains-of-autumn", "Rains of Autumn")).toBe("Chuvas de Outono");
    expect(translateDataText("houseCard.name", "x", "Ser Davos Seaworth")).toBe("Sor Davos Seaworth");
    expect(translateDataText("houseCard.name", "x", "Ser Davos Seaworth")).toBe("Sor Davos Seaworth");
    expect(translateDataText("westeros.shortDescription", "supply", "")).toBe("");
  });

  it("textos desconhecidos continuam em inglês (nunca quebra)", () => {
    expect(translateDataText("westeros.name", "carta-nova", "New Card")).toBe("New Card");
    expect(translateServerText("Some new server text")).toBe("Some new server text");
  });

  it("traduz perguntas e opções do servidor", () => {
    expect(translateServerText("Activate")).toBe("Ativar");
    expect(translateServerText("Ignore")).toBe("Ignorar");
    expect(translateServerText("House Stark may discard 1 Power token to place a loyalty token in Blackwater or The Boneway."))
      .toBe("A Casa Stark pode descartar 1 Ficha de Poder para colocar uma Ficha de Lealdade em Água Negra ou Caminho dos Ossos.");
    expect(translateServerText("House Targaryen may either: a) destroy one Dragon to move any dragon strength token from the round track to the dragon strength box or b) place a destroyed Dragon in their home area (if able) or c) do nothing."))
      .toMatch(/^A Casa Targaryen pode: a\) destruir um Dragão/);
    expect(translateServerText("Discard 1 Power token to cancel the previous movement")).toBe("Descartar 1 Ficha de Poder para cancelar o movimento anterior");
    expect(translateServerText("Place a dragon in Dragonstone")).toBe("Colocar um dragão em Pedra do Dragão");
    expect(translateServerText("declare House Stark the winner")).toBe("declarar a Casa Stark vencedora");
    expect(translateServerText("King's Landing")).toBe("Porto Real");
  });
});

describe("cartas com opções a) b) c)", () => {
  // textos exatamente como o servidor manda (ver os GameStates de Westeros)
  const CASES: [string, string[], string[]][] = [
    [
      "The holder of the Messenger Raven token can choose between Clash of Kings, Game of Thrones, or nothing at all.",
      ["Clash of Kings", "Game of Thrones", "Nothing"],
      ["a", "b", "c"]
    ],
    [
      "The holder of the Iron Throne token can choose between Mustering, Supply, or nothing at all.",
      ["Mustering", "Supply", "Nothing"],
      ["a", "b", "c"]
    ],
    [
      "The holder of the Valyrian Steel Blade can choose between No March +1 Orders, no Defense Orders, or no restrictions.",
      ["No March +1 Orders", "No Defense Orders", "No restrictions"],
      ["a", "b", "c"]
    ],
    [
      "The holder of the Iron Throne token chooses whether a) the Wilding track is reduced to the \"0\" position, or b) everyone musters units in Strongholds and Castles.",
      ["Reduce the Wildling track to 0", "Mustering"],
      ["a", "b"]
    ]
  ];

  it("reconhece as quatro cartas e mantém o índice certo de cada opção", () => {
    const { letteredChoices } = require("../../src/client/i18n/serverText");
    const before = getLanguage();
    setLanguage("pt-BR");
    try {
      CASES.forEach(([description, choices, letters]) => {
        const result = letteredChoices(description, choices);
        expect(result).not.toBeNull();
        expect(result.map((r: { letter: string }) => r.letter)).toEqual(letters);
        // cada opção aponta para um índice diferente e válido
        const indexes = result.map((r: { index: number }) => r.index);
        expect(new Set(indexes).size).toBe(choices.length);
      });
      // opções inesperadas: volta para os botões normais
      expect(letteredChoices(CASES[0][0], ["Clash of Kings", "Nothing"])).toBeNull();
    } finally {
      setLanguage(before);
    }
  });
});
