import { getLanguage } from "./i18n";

/**
 * Troca a imagem da carta pela versão em português quando o jogo está em PT-BR.
 * `images` liga id da carta -> imagem original; `ptBR` liga imagem original -> imagem em PT.
 * Se não houver versão em PT, usa a original (nunca quebra).
 */
export interface ImageLookup<K> {
  get(key: K): string;
  has(key: K): boolean;
}

export function localizeImages<K>(
  images: { get(key: K): string; has(key: K): boolean },
  ptBR: Map<string, string>
): ImageLookup<K> {
  return {
    get(key: K): string {
      const original = images.get(key);
      if (getLanguage() == "pt-BR") {
        return ptBR.get(original) ?? original;
      }
      return original;
    },
    has(key: K): boolean {
      return images.has(key);
    }
  };
}

/** Igual a localizeImages, para mapas em dois níveis (ex.: baralho de Westeros -> id -> imagem). */
export function localizeNestedImages<K1, K2>(
  images: { get(key: K1): { get(key: K2): string; has(key: K2): boolean }; has(key: K1): boolean },
  ptBR: Map<string, string>
): { get(key: K1): ImageLookup<K2>; has(key: K1): boolean } {
  return {
    get: (key: K1) => localizeImages(images.get(key), ptBR),
    has: (key: K1) => images.has(key)
  };
}
