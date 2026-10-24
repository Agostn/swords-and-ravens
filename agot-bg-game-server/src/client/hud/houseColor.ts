/**
 * Texto que dá para ler em cima da cor de uma Casa: escuro em cores claras
 * (Baratheon amarelo, Stark branco) e claro em cores escuras (Lannister, Greyjoy).
 */
export function readableTextOn(color: string): string {
  const hex = color.trim().replace("#", "");
  const full =
    hex.length == 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number): number =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.4 ? "#1a140c" : "#ffffff";
}
