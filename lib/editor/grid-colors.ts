import { colorDistance, hexToRgb, normalizeHex } from "@/lib/color";
import type { PaletteColor, PixelGrid } from "@/types/editor";

interface GridColorOptions {
  excludeExternal?: boolean;
}

interface NeighborReplacementResult {
  grid: PixelGrid;
  changedCount: number;
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

function createNextGrid(
  grid: PixelGrid,
  nextCells: string[],
  nextCellKeys: string[],
) {
  return {
    ...grid,
    cells: nextCells,
    cellKeys: nextCellKeys,
  };
}

function getNeighborIndices(index: number, width: number, height: number) {
  const x = index % width;
  const y = Math.floor(index / width);
  const neighbors: number[] = [];

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (offsetX === 0 && offsetY === 0) {
        continue;
      }

      const nextX = x + offsetX;
      const nextY = y + offsetY;

      if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
        continue;
      }

      neighbors.push(nextY * width + nextX);
    }
  }

  return neighbors;
}

function getDominantNeighborKey(
  grid: PixelGrid,
  index: number,
  excludedKeys: Set<string>,
) {
  const counts = new Map<string, number>();

  for (const neighborIndex of getNeighborIndices(index, grid.width, grid.height)) {
    if (grid.externalMask[neighborIndex]) {
      continue;
    }

    const neighborKey = grid.cellKeys[neighborIndex];
    if (!neighborKey || excludedKeys.has(neighborKey)) {
      continue;
    }

    counts.set(neighborKey, (counts.get(neighborKey) ?? 0) + 1);
  }

  let winner: string | null = null;
  let winnerCount = 0;

  for (const [key, count] of counts.entries()) {
    if (count > winnerCount) {
      winner = key;
      winnerCount = count;
    }
  }

  return {
    key: winner,
    count: winnerCount,
  };
}

function getFallbackPaletteWinner(
  palette: PaletteColor[],
  currentHex: string,
  excludedKeys: Set<string>,
) {
  const candidates = palette.filter((color) => !excludedKeys.has(getPaletteKey(color)));
  if (candidates.length === 0) {
    return null;
  }

  const currentRgb = hexToRgb(currentHex);
  let winner = candidates[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const score = colorDistance(currentRgb, candidate.rgb);
    if (score < bestScore) {
      bestScore = score;
      winner = candidate;
    }
  }

  return winner;
}

export function removeNoiseFromGrid(
  grid: PixelGrid,
  palette: PaletteColor[],
): NeighborReplacementResult {
  const { byKey } = createPaletteMaps(palette);
  let nextGrid = {
    ...grid,
    cells: [...grid.cells],
    cellKeys: [...grid.cellKeys],
  };
  let changedCount = 0;

  for (let pass = 0; pass < 2; pass += 1) {
    const passCells = [...nextGrid.cells];
    const passKeys = [...nextGrid.cellKeys];

    for (let index = 0; index < nextGrid.cells.length; index += 1) {
      if (nextGrid.externalMask[index]) {
        continue;
      }

      const currentKey = nextGrid.cellKeys[index];
      const neighbor = getDominantNeighborKey(nextGrid, index, new Set([currentKey]));
      if (!neighbor.key || neighbor.count < 5) {
        continue;
      }

      const selfSupport = getNeighborIndices(index, nextGrid.width, nextGrid.height).filter(
        (neighborIndex) =>
          !nextGrid.externalMask[neighborIndex] &&
          nextGrid.cellKeys[neighborIndex] === currentKey,
      ).length;

      if (selfSupport >= 2) {
        continue;
      }

      const winner = byKey.get(neighbor.key);
      if (!winner) {
        continue;
      }

      if (passKeys[index] !== neighbor.key) {
        passKeys[index] = neighbor.key;
        passCells[index] = winner.hex;
        changedCount += 1;
      }
    }

    nextGrid = createNextGrid(nextGrid, passCells, passKeys);
  }

  return {
    grid: nextGrid,
    changedCount,
  };
}

export function replaceColorKeyWithNeighborColors(
  grid: PixelGrid,
  palette: PaletteColor[],
  targetColorKey: string,
): NeighborReplacementResult | null {
  const { byKey } = createPaletteMaps(palette);
  const currentPresentKeys = getPresentColorKeys(grid).filter((key) => key !== targetColorKey);

  if (currentPresentKeys.length === 0) {
    return null;
  }

  let nextGrid = {
    ...grid,
    cells: [...grid.cells],
    cellKeys: [...grid.cellKeys],
  };
  let changedCount = 0;
  let remainingTarget = nextGrid.cellKeys.some(
    (key, index) => !nextGrid.externalMask[index] && key === targetColorKey,
  );

  while (remainingTarget) {
    let passChanged = false;
    const passCells = [...nextGrid.cells];
    const passKeys = [...nextGrid.cellKeys];

    for (let index = 0; index < nextGrid.cells.length; index += 1) {
      if (nextGrid.externalMask[index] || nextGrid.cellKeys[index] !== targetColorKey) {
        continue;
      }

      const neighbor = getDominantNeighborKey(nextGrid, index, new Set([targetColorKey]));
      let winner = neighbor.key ? byKey.get(neighbor.key) ?? null : null;

      if (!winner) {
        winner = getFallbackPaletteWinner(
          palette,
          nextGrid.cells[index],
          new Set([targetColorKey]),
        );
      }

      if (!winner) {
        continue;
      }

      passChanged = true;
      changedCount += 1;
      passKeys[index] = getPaletteKey(winner);
      passCells[index] = winner.hex;
    }

    nextGrid = createNextGrid(nextGrid, passCells, passKeys);

    if (!passChanged) {
      break;
    }

    remainingTarget = nextGrid.cellKeys.some(
      (key, index) => !nextGrid.externalMask[index] && key === targetColorKey,
    );
  }

  return {
    grid: nextGrid,
    changedCount,
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
