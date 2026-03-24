import type { PaletteColor, RGBColor } from "@/types/editor";

export function normalizeHex(hex: string) {
  return hex.trim().replace("#", "").toLowerCase();
}

export function hexToRgb(hex: string): RGBColor {
  const normalized = normalizeHex(hex);
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((chunk) => chunk + chunk)
          .join("")
      : normalized;

  const parsed = Number.parseInt(value, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

export function rgbaOverBackground(
  r: number,
  g: number,
  b: number,
  a: number,
  backgroundHex: string,
) {
  if (a >= 255) {
    return { r, g, b };
  }

  const background = hexToRgb(backgroundHex);
  const alpha = a / 255;

  return {
    r: background.r + (r - background.r) * alpha,
    g: background.g + (g - background.g) * alpha,
    b: background.b + (b - background.b) * alpha,
  };
}

export function colorDistance(a: RGBColor, b: RGBColor) {
  const red = a.r - b.r;
  const green = a.g - b.g;
  const blue = a.b - b.b;

  return red * red + green * green + blue * blue;
}

export function getPerceivedLuminance(color: RGBColor) {
  return (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
}

export function getReadableTextColor(backgroundHex: string) {
  const luminance = getPerceivedLuminance(hexToRgb(backgroundHex));
  return luminance > 0.62 ? "#101722" : "#f8fafc";
}

export function findNearestPaletteColor(
  color: RGBColor,
  palette: PaletteColor[],
): PaletteColor {
  let winner = palette[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of palette) {
    const distance = colorDistance(color, candidate.rgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      winner = candidate;
    }
  }

  return winner;
}
