import { DEFAULT_EMPTY_CELL } from "@/lib/constants";
import type { PixelGrid } from "@/types/editor";

export function createBlankGrid(
  width: number,
  height: number,
  fill = DEFAULT_EMPTY_CELL,
): PixelGrid {
  return {
    width,
    height,
    background: fill,
    cells: new Array(width * height).fill(fill),
    cellKeys: new Array(width * height).fill(fill),
    initialCellKeys: new Array(width * height).fill(fill),
    externalMask: new Array(width * height).fill(false),
  };
}

export function cloneGrid(grid: PixelGrid): PixelGrid {
  return {
    ...grid,
    cells: [...grid.cells],
    cellKeys: [...grid.cellKeys],
    initialCellKeys: [...grid.initialCellKeys],
    externalMask: [...grid.externalMask],
  };
}

export function areCellsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }

  return true;
}

export function countUsedColors(cells: string[]) {
  return new Set(cells).size;
}

export function getColorUsage(cells: string[]) {
  const usage = new Map<string, number>();

  for (const color of cells) {
    usage.set(color, (usage.get(color) ?? 0) + 1);
  }

  return usage;
}
