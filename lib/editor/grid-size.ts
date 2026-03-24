import type { GridSizeOption } from "@/types/editor";

export interface ResolvedGridSize {
  width: number;
  height: number;
  longEdge: number;
}

export function resolveAspectRatioGridSize(
  sourceWidth: number,
  sourceHeight: number,
  longEdge: number,
): ResolvedGridSize {
  const safeLongEdge = Math.max(1, Math.round(longEdge));

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return {
      width: safeLongEdge,
      height: safeLongEdge,
      longEdge: safeLongEdge,
    };
  }

  if (sourceWidth >= sourceHeight) {
    return {
      width: safeLongEdge,
      height: Math.max(1, Math.round((sourceHeight / sourceWidth) * safeLongEdge)),
      longEdge: safeLongEdge,
    };
  }

  return {
    width: Math.max(1, Math.round((sourceWidth / sourceHeight) * safeLongEdge)),
    height: safeLongEdge,
    longEdge: safeLongEdge,
  };
}

export function getGridPresetLongEdge(preset: GridSizeOption) {
  return Math.max(preset.width, preset.height);
}
