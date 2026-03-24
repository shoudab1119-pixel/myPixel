import { BACKGROUND_COLOR_KEYS } from "@/lib/constants";
import type { PaletteColor } from "@/types/editor";
import type { PixelWorkerRequest, PixelWorkerResponse } from "@/types/worker";

const workerScope = globalThis as typeof globalThis & {
  onmessage: ((event: MessageEvent<PixelWorkerRequest>) => void) | null;
  postMessage: (message: PixelWorkerResponse) => void;
};

const OPAQUE_ALPHA_THRESHOLD = 220;
const REGION_SIMILARITY_THRESHOLD = 26 * 26 * 3;
const LARGE_REGION_SIZE = 10;
const DOMINANT_REGION_RATIO = 0.58;

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

interface MappedCell {
  hex: string;
  key: string;
  rgb: RGBColor;
}

function hexToRgb(hex: string): RGBColor {
  const normalized = hex.replace("#", "").trim().toLowerCase();
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

function colorDistance(a: RGBColor, b: RGBColor) {
  const red = a.r - b.r;
  const green = a.g - b.g;
  const blue = a.b - b.b;
  return red * red + green * green + blue * blue;
}

function compositeAlpha(
  r: number,
  g: number,
  b: number,
  alpha: number,
  background: RGBColor,
) {
  if (alpha >= 255) {
    return { r, g, b };
  }

  const opacity = alpha / 255;

  return {
    r: Math.round(background.r + (r - background.r) * opacity),
    g: Math.round(background.g + (g - background.g) * opacity),
    b: Math.round(background.b + (b - background.b) * opacity),
  };
}

function resolveTargetDimensions(sourceWidth: number, sourceHeight: number, granularity: number) {
  if (sourceWidth >= sourceHeight) {
    return {
      width: granularity,
      height: Math.max(1, Math.round((sourceHeight / sourceWidth) * granularity)),
    };
  }

  return {
    width: Math.max(1, Math.round((sourceWidth / sourceHeight) * granularity)),
    height: granularity,
  };
}

function findNearestColor(color: RGBColor, palette: PaletteColor[]) {
  let winner = palette[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of palette) {
    const distance = colorDistance(color, candidate.rgb ?? hexToRgb(candidate.hex));
    if (distance < bestScore) {
      bestScore = distance;
      winner = candidate;
    }
  }

  return winner;
}

function getDominantColorForRegion(
  sourcePixels: Uint8ClampedArray,
  sourceWidth: number,
  sourceXStart: number,
  sourceXEnd: number,
  sourceYStart: number,
  sourceYEnd: number,
  background: RGBColor,
) {
  const frequency = new Map<
    string,
    {
      count: number;
      color: RGBColor;
    }
  >();
  let fallbackRed = 0;
  let fallbackGreen = 0;
  let fallbackBlue = 0;
  let fallbackSamples = 0;

  for (let sourceY = sourceYStart; sourceY < sourceYEnd; sourceY += 1) {
    for (let sourceX = sourceXStart; sourceX < sourceXEnd; sourceX += 1) {
      const pixelIndex = (sourceY * sourceWidth + sourceX) * 4;
      const red = sourcePixels[pixelIndex];
      const green = sourcePixels[pixelIndex + 1];
      const blue = sourcePixels[pixelIndex + 2];
      const alpha = sourcePixels[pixelIndex + 3];
      const composite = compositeAlpha(red, green, blue, alpha, background);

      fallbackRed += composite.r;
      fallbackGreen += composite.g;
      fallbackBlue += composite.b;
      fallbackSamples += 1;

      if (alpha < OPAQUE_ALPHA_THRESHOLD) {
        continue;
      }

      const key = `${red},${green},${blue}`;
      const existing = frequency.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        frequency.set(key, {
          count: 1,
          color: {
            r: red,
            g: green,
            b: blue,
          },
        });
      }
    }
  }

  let winner: RGBColor | null = null;
  let bestCount = -1;

  for (const entry of frequency.values()) {
    if (entry.count > bestCount) {
      bestCount = entry.count;
      winner = entry.color;
    }
  }

  if (winner) {
    return winner;
  }

  if (fallbackSamples === 0) {
    return background;
  }

  return {
    r: Math.round(fallbackRed / fallbackSamples),
    g: Math.round(fallbackGreen / fallbackSamples),
    b: Math.round(fallbackBlue / fallbackSamples),
  };
}

function buildInitialMappedData(
  sourcePixels: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  palette: PaletteColor[],
  background: RGBColor,
) {
  const cells = new Array<MappedCell>(targetWidth * targetHeight);

  for (let targetY = 0; targetY < targetHeight; targetY += 1) {
    const sourceYStart = Math.floor((targetY * sourceHeight) / targetHeight);
    const sourceYEnd = Math.max(
      sourceYStart + 1,
      Math.floor(((targetY + 1) * sourceHeight) / targetHeight),
    );

    for (let targetX = 0; targetX < targetWidth; targetX += 1) {
      const sourceXStart = Math.floor((targetX * sourceWidth) / targetWidth);
      const sourceXEnd = Math.max(
        sourceXStart + 1,
        Math.floor(((targetX + 1) * sourceWidth) / targetWidth),
      );
      const dominantColor = getDominantColorForRegion(
        sourcePixels,
        sourceWidth,
        sourceXStart,
        sourceXEnd,
        sourceYStart,
        sourceYEnd,
        background,
      );
      const nearest = findNearestColor(dominantColor, palette);
      const key = nearest.code ?? nearest.name;

      cells[targetY * targetWidth + targetX] = {
        hex: nearest.hex,
        key,
        rgb: nearest.rgb ?? hexToRgb(nearest.hex),
      };
    }
  }

  return cells;
}

function getNeighborIndices(index: number, width: number, height: number) {
  const x = index % width;
  const y = Math.floor(index / width);
  const neighbors: number[] = [];

  if (x > 0) {
    neighbors.push(index - 1);
  }
  if (x < width - 1) {
    neighbors.push(index + 1);
  }
  if (y > 0) {
    neighbors.push(index - width);
  }
  if (y < height - 1) {
    neighbors.push(index + width);
  }

  return neighbors;
}

function mergeSimilarRegions(
  cells: MappedCell[],
  width: number,
  height: number,
) {
  const nextCells = cells.map((cell) => ({ ...cell }));
  const visited = new Array<boolean>(cells.length).fill(false);

  for (let index = 0; index < cells.length; index += 1) {
    if (visited[index]) {
      continue;
    }

    const queue = [index];
    const regionIndices: number[] = [];
    const seedCell = cells[index];
    const counts = new Map<string, number>();
    visited[index] = true;

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) {
        continue;
      }

      const currentCell = cells[current];
      if (colorDistance(seedCell.rgb, currentCell.rgb) > REGION_SIMILARITY_THRESHOLD) {
        continue;
      }

      regionIndices.push(current);
      counts.set(currentCell.key, (counts.get(currentCell.key) ?? 0) + 1);

      for (const neighbor of getNeighborIndices(current, width, height)) {
        if (visited[neighbor]) {
          continue;
        }

        const neighborCell = cells[neighbor];
        if (colorDistance(seedCell.rgb, neighborCell.rgb) > REGION_SIMILARITY_THRESHOLD) {
          continue;
        }

        visited[neighbor] = true;
        queue.push(neighbor);
      }
    }

    let dominantKey = seedCell.key;
    let dominantCount = counts.get(dominantKey) ?? 0;

    for (const [key, count] of counts.entries()) {
      if (count > dominantCount) {
        dominantKey = key;
        dominantCount = count;
      }
    }

    const dominantRatio = dominantCount / Math.max(1, regionIndices.length);
    if (
      regionIndices.length >= LARGE_REGION_SIZE &&
      dominantRatio < DOMINANT_REGION_RATIO
    ) {
      continue;
    }

    const dominantCell =
      regionIndices
        .map((regionIndex) => cells[regionIndex])
        .find((cell) => cell.key === dominantKey) ?? seedCell;

    for (const regionIndex of regionIndices) {
      nextCells[regionIndex] = {
        ...dominantCell,
      };
    }
  }

  return nextCells;
}

function markExternalBackground(
  cells: MappedCell[],
  width: number,
  height: number,
) {
  const externalMask = new Array<boolean>(cells.length).fill(false);
  const backgroundKeys = new Set<string>(BACKGROUND_COLOR_KEYS);
  const queue: number[] = [];

  for (let x = 0; x < width; x += 1) {
    queue.push(x, (height - 1) * width + x);
  }

  for (let y = 1; y < height - 1; y += 1) {
    queue.push(y * width, y * width + (width - 1));
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined || externalMask[current]) {
      continue;
    }

    if (!backgroundKeys.has(cells[current].key)) {
      continue;
    }

    externalMask[current] = true;

    for (const neighbor of getNeighborIndices(current, width, height)) {
      if (!externalMask[neighbor]) {
        queue.push(neighbor);
      }
    }
  }

  return externalMask;
}

function pixelate(request: PixelWorkerRequest): PixelWorkerResponse {
  const { source, target, palette, backgroundHex, excludedColorKeys = [] } = request.payload;
  const sourcePixels = new Uint8ClampedArray(source.data);
  const background = hexToRgb(backgroundHex);
  const excludedSet = new Set(excludedColorKeys);
  const activePalette = palette.filter((color) => {
    const key = color.code ?? color.name;
    return !excludedSet.has(key);
  });

  if (activePalette.length === 0) {
    throw new Error("No active palette colors available.");
  }

  const granularity = Math.max(target.width, target.height);
  const resolvedTarget = resolveTargetDimensions(
    source.width,
    source.height,
    granularity,
  );
  const initialMappedCells = buildInitialMappedData(
    sourcePixels,
    source.width,
    source.height,
    resolvedTarget.width,
    resolvedTarget.height,
    activePalette,
    background,
  );
  const mergedCells = mergeSimilarRegions(
    initialMappedCells,
    resolvedTarget.width,
    resolvedTarget.height,
  );
  const externalMask = markExternalBackground(
    mergedCells,
    resolvedTarget.width,
    resolvedTarget.height,
  );
  const usedColors = new Set<string>();
  const usedColorKeys = new Set<string>();

  mergedCells.forEach((cell, index) => {
    if (externalMask[index]) {
      return;
    }

    usedColors.add(cell.hex);
    usedColorKeys.add(cell.key);
  });

  return {
    type: "success",
    requestId: request.requestId,
    payload: {
      grid: {
        width: resolvedTarget.width,
        height: resolvedTarget.height,
        background: backgroundHex,
        cells: mergedCells.map((cell) => cell.hex),
        cellKeys: mergedCells.map((cell) => cell.key),
        initialCellKeys: initialMappedCells.map((cell) => cell.key),
        externalMask,
      },
      usedColors: [...usedColors],
      usedColorKeys: [...usedColorKeys],
    },
  };
}

workerScope.onmessage = (event: MessageEvent<PixelWorkerRequest>) => {
  try {
    workerScope.postMessage(pixelate(event.data));
  } catch (reason) {
    workerScope.postMessage({
      type: "error",
      requestId: event.data.requestId,
      payload: {
        message:
          reason instanceof Error ? reason.message : "Pixel processing failed.",
      },
    } satisfies PixelWorkerResponse);
  }
};

export {};
