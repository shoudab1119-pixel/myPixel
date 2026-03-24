import { colorDistance, hexToRgb, normalizeHex } from "@/lib/color";
import type { PaletteColor, PixelGrid } from "@/types/editor";

interface GridColorOptions {
  excludeExternal?: boolean;
}

function getPaletteKey(color: PaletteColor) {
  return color.code ?? color.name;
}

export function createPaletteMaps(palette: PaletteColor[]) {
  const byHex = new Map<string, PaletteColor>();
  const byKey = new Map<string, PaletteColor>();

  for (const color of palette) {
    byHex.set(normalizeHex(color.hex), color);
    byKey.set(getPaletteKey(color), color);
  }

  return {
    byHex,
    byKey,
  };
}

export function resolvePaletteColorByHex(hex: string, palette: PaletteColor[]) {
  return createPaletteMaps(palette).byHex.get(normalizeHex(hex)) ?? null;
}

export function resolvePaletteColorByKey(key: string, palette: PaletteColor[]) {
  return createPaletteMaps(palette).byKey.get(key) ?? null;
}

export function normalizePixelGrid(grid: PixelGrid, palette: PaletteColor[]): PixelGrid {
  const { byHex, byKey } = createPaletteMaps(palette);
  const cellCount = grid.width * grid.height;
  const cellKeys =
    (grid.cellKeys?.length ?? 0) === cellCount
      ? [...grid.cellKeys]
      : grid.cells.map((cellHex) => byHex.get(normalizeHex(cellHex))?.code ?? cellHex);
  const initialCellKeys =
    (grid.initialCellKeys?.length ?? 0) === cellCount
      ? [...grid.initialCellKeys]
      : [...cellKeys];
  const externalMask =
    (grid.externalMask?.length ?? 0) === cellCount
      ? [...grid.externalMask]
      : new Array(cellCount).fill(false);
  const cells = grid.cells.map((cellHex, index) => {
    const key = cellKeys[index];
    const paletteColor = byKey.get(key);
    return paletteColor?.hex ?? cellHex;
  });

  return {
    ...grid,
    cells,
    cellKeys,
    initialCellKeys,
    externalMask,
  };
}

export function getGridCellKey(
  grid: PixelGrid,
  index: number,
  palette: PaletteColor[],
) {
  return grid.cellKeys[index] ?? resolvePaletteColorByHex(grid.cells[index], palette)?.code ?? grid.cells[index];
}

export function getGridDisplayFill(grid: PixelGrid, index: number, externalFill: string) {
  return grid.externalMask[index] ? externalFill : grid.cells[index];
}

export function getPresentColorKeys(
  grid: PixelGrid,
  options: GridColorOptions = {},
) {
  const keys = new Set<string>();
  const excludeExternal = options.excludeExternal ?? true;

  grid.cellKeys.forEach((key, index) => {
    if (excludeExternal && grid.externalMask[index]) {
      return;
    }

    keys.add(key);
  });

  return [...keys];
}

export function getInitialPresentColorKeys(grid: PixelGrid) {
  const keys = new Set<string>();

  grid.initialCellKeys.forEach((key, index) => {
    if (grid.externalMask[index]) {
      return;
    }

    keys.add(key);
  });

  return [...keys];
}

export function getGridColorUsage(
  grid: PixelGrid,
  palette: PaletteColor[],
  options: GridColorOptions = {},
) {
  const { byKey } = createPaletteMaps(palette);
  const usage = new Map<
    string,
    {
      color: PaletteColor;
      count: number;
    }
  >();
  const excludeExternal = options.excludeExternal ?? true;

  grid.cellKeys.forEach((key, index) => {
    if (excludeExternal && grid.externalMask[index]) {
      return;
    }

    const color = byKey.get(key);
    if (!color) {
      return;
    }

    const entry = usage.get(key);
    if (entry) {
      entry.count += 1;
      return;
    }

    usage.set(key, {
      color,
      count: 1,
    });
  });

  return usage;
}

export function replaceGridCellsWithPalette(
  grid: PixelGrid,
  nextCells: string[],
  palette: PaletteColor[],
) {
  const { byHex } = createPaletteMaps(palette);
  const cellKeys = [...grid.cellKeys];
  const externalMask = [...grid.externalMask];

  nextCells.forEach((hex, index) => {
    if (grid.cells[index] === hex) {
      return;
    }

    const paletteColor = byHex.get(normalizeHex(hex));
    cellKeys[index] = paletteColor?.code ?? hex;
    externalMask[index] = false;
  });

  return {
    ...grid,
    cells: nextCells,
    cellKeys,
    externalMask,
  };
}

export function remapExcludedColorKey(
  grid: PixelGrid,
  palette: PaletteColor[],
  excludedColorKey: string,
  excludedColorKeys: string[],
) {
  const { byKey } = createPaletteMaps(palette);
  const targetKeys = getInitialPresentColorKeys(grid).filter(
    (key) => key !== excludedColorKey && !excludedColorKeys.includes(key),
  );
  const targetPalette = targetKeys
    .map((key) => byKey.get(key))
    .filter((color): color is PaletteColor => Boolean(color));

  if (targetPalette.length === 0) {
    return null;
  }

  const sourceColor = byKey.get(excludedColorKey);
  const sourceRgb = sourceColor?.rgb ?? null;
  const nextCells = [...grid.cells];
  const nextCellKeys = [...grid.cellKeys];

  grid.cellKeys.forEach((key, index) => {
    if (grid.externalMask[index] || key !== excludedColorKey) {
      return;
    }

    const currentRgb = sourceRgb ?? hexToRgb(grid.cells[index]);
    let winner = targetPalette[0];
    let bestScore = Number.POSITIVE_INFINITY;

    for (const candidate of targetPalette) {
      const score = colorDistance(currentRgb, candidate.rgb);
      if (score < bestScore) {
        bestScore = score;
        winner = candidate;
      }
    }

    nextCells[index] = winner.hex;
    nextCellKeys[index] = winner.code ?? winner.hex;
  });

  return {
    ...grid,
    cells: nextCells,
    cellKeys: nextCellKeys,
  };
}
