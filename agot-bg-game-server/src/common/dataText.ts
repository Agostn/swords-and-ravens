/**
 * Gancho de tradução para textos que vêm dos dados do jogo (nomes de lugares,
 * unidades, ordens, cartas...). Esses textos ficam no código compartilhado
 * (common), que também roda no servidor.
 *
 * - No servidor nada é traduzido: o tradutor padrão devolve o texto original.
 * - O cliente registra o seu tradutor ao iniciar (ver client/i18n/dataTranslations.ts).
 *
 * `kind` diz que tipo de texto é, `id` identifica o item e `text` é o texto
 * original em inglês (usado como reserva quando não há tradução).
 */
export type DataTextKind =
  | "region"
  | "unit.name"
  | "unit.description"
  | "order.name";

export type DataTextTranslator = (
  kind: DataTextKind,
  id: string,
  text: string
) => string;

let translator: DataTextTranslator = (_kind, _id, text) => text;

export function setDataTextTranslator(newTranslator: DataTextTranslator): void {
  translator = newTranslator;
}

export function dataText(kind: DataTextKind, id: string, text: string): string {
  return translator(kind, id, text);
}
