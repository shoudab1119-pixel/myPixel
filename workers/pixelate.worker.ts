import type { PaletteColor } from "@/types/editor";
import type { PixelWorkerRequest, PixelWorkerResponse } from "@/types/worker";

const workerScope = globalThis as typeof globalThis & {
  onmessage: ((event: MessageEvent<PixelWorkerRequest>) => void) | null;
  postMessage: (message: PixelWorkerResponse) => void;
};

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

const GLOBAL_SIMILARITY_DISTANCE = 26 * 26 * 3;
const LOCAL_SIMILARITY_DISTANCE = 24 * 24 * 3;
const DOMINANT_NEIGHBOR_COUNT = 5;
const DOMINANT_USAGE_RATIO = 1.6;
const SMOOTHING_PASSES = 2;

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
    r: background.r + (r - background.r) * opacity,
    g: background.g + (g - background.g) * opacity,
    b: background.b + (b - background.b) * opacity,
  };
}

function colorDistance(a: RGBColor, b: RGBColor) {
  const red = a.r - b.r;
  const green = a.g - b.g;
  const blue = a.b - b.b;
  return red * red + green * green + blue * blue;
}

function findNearestColor(color: RGBColor, palette: PaletteColor[]) {
  let winner = palette[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of palette) {
    const rgb = candidate.rgb ?? hexToRgb(candidate.hex);
    const distance = colorDistance(color, rgb);
    if (distance < bestScore) {
      bestScore = distance;
      winner = candidate;
    }
  }

  return winner;
}

function buildPaletteIndex(palette: PaletteColor[]) {
  const index = new Map<string, RGBColor>();

  for (const color of palette) {
    index.set(color.hex, color.rgb ?? hexToRgb(color.hex));
  }

  return index;
}

function buildUsageMap(cells: string[]) {
  const usage = new Map<string, number>();

  for (const cell of cells) {
    usage.set(cell, (usage.get(cell) ?? 0) + 1);
  }

  return usage;
}

function resolveMergeTarget(
  colorHex: string,
  usage: Map<string, number>,
  paletteIndex: Map<string, RGBColor>,
) {
  const colorUsage = usage.get(colorHex) ?? 0;
  const colorRgb = paletteIndex.get(colorHex);

  if (!colorRgb) {
    return colorHex;
  }

  let winner = colorHex;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const [candidateHex, candidateUsage] of usage.entries()) {
    if (candidateHex === colorHex) {
      continue;
    }

    if (candidateUsage < Math.max(colorUsage * DOMINANT_USAGE_RATIO, colorUsage + 2)) {
      continue;
    }

    const candidateRgb = paletteIndex.get(candidateHex);
    if (!candidateRgb) {
      continue;
    }

    const distance = colorDistance(colorRgb, candidateRgb);
    if (distance > GLOBAL_SIMILARITY_DISTANCE) {
      continue;
    }

    const score = distance - candidateUsage * 0.25;
    if (score < bestScore) {
      bestScore = score;
      winner = candidateHex;
    }
  }

  return winner;
}

function mergeGloballySimilarColors(
  cells: string[],
  paletteIndex: Map<string, RGBColor>,
) {
  const usage = buildUsageMap(cells);
  const colorsByUsage = [...usage.entries()].sort((left, right) => left[1] - right[1]);
  const mergeMap = new Map<string, string>();

  for (const [colorHex] of colorsByUsage) {
    let targetHex = resolveMergeTarget(colorHex, usage, paletteIndex);

    while (mergeMap.has(targetHex) && mergeMap.get(targetHex) !== targetHex) {
      targetHex = mergeMap.get(targetHex) ?? targetHex;
    }

    mergeMap.set(colorHex, targetHex);
  }

  return cells.map((cell) => {
    let resolved = mergeMap.get(cell) ?? cell;

    while (mergeMap.has(resolved) && mergeMap.get(resolved) !== resolved) {
      resolved = mergeMap.get(resolved) ?? resolved;
    }

    return resolved;
  });
}

function countNeighborColors(
  cells: string[],
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const counts = new Map<string, number>();

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (offsetX === 0 && offsetY === 0) {
        continue;
      }

      const neighborX = x + offsetX;
      const neighborY = y + offsetY;

      if (
        neighborX < 0 ||
        neighborX >= width ||
        neighborY < 0 ||
        neighborY >= height
      ) {
        continue;
      }

      const neighborHex = cells[neighborY * width + neighborX];
      counts.set(neighborHex, (counts.get(neighborHex) ?? 0) + 1);
    }
  }

  return counts;
}

function smoothLocalColorNoise(
  cells: string[],
  width: number,
  height: number,
  paletteIndex: Map<string, RGBColor>,
) {
  let currentCells = [...cells];

  for (let pass = 0; pass < SMOOTHING_PASSES; pass += 1) {
    const nextCells = [...currentCells];

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const cellIndex = y * width + x;
        const currentHex = currentCells[cellIndex];
        const currentRgb = paletteIndex.get(currentHex);

        if (!currentRgb) {
          continue;
        }

        const neighborCounts = countNeighborColors(currentCells, width, height, x, y);
        const currentNeighborCount = neighborCounts.get(currentHex) ?? 0;
        let dominantHex = currentHex;
        let dominantCount = currentNeighborCount;

        for (const [neighborHex, count] of neighborCounts.entries()) {
          if (count > dominantCount) {
            dominantHex = neighborHex;
            dominantCount = count;
          }
        }

        if (dominantHex === currentHex || dominantCount < DOMINANT_NEIGHBOR_COUNT) {
          continue;
        }

        const dominantRgb = paletteIndex.get(dominantHex);
        if (!dominantRgb) {
          continue;
        }

        if (colorDistance(currentRgb, dominantRgb) > LOCAL_SIMILARITY_DISTANCE) {
          continue;
        }

        if (dominantCount <= currentNeighborCount + 1) {
          continue;
        }

        nextCells[cellIndex] = dominantHex;
      }
    }

    currentCells = nextCells;
  }

  return currentCells;
}

function refineQuantizedCells(
  cells: string[],
  width: number,
  height: number,
  palette: PaletteColor[],
) {
  const paletteIndex = buildPaletteIndex(palette);
  const mergedCells = mergeGloballySimilarColors(cells, paletteIndex);
  return smoothLocalColorNoise(mergedCells, width, height, paletteIndex);
}

function pixelate(request: PixelWorkerRequest): PixelWorkerResponse {
  const { source, target, palette, backgroundHex } = request.payload;
  const sourcePixels = new Uint8ClampedArray(source.data);
  const background = hexToRgb(backgroundHex);
  const cells = new Array<string>(target.width * target.height);

  for (let targetY = 0; targetY < target.height; targetY += 1) {
    const sourceYStart = Math.floor((targetY * source.height) / target.height);
    const sourceYEnd = Math.max(
      sourceYStart + 1,
      Math.floor(((targetY + 1) * source.height) / target.height),
    );

    for (let targetX = 0; targetX < target.width; targetX += 1) {
      const sourceXStart = Math.floor((targetX * source.width) / target.width);
      const sourceXEnd = Math.max(
        sourceXStart + 1,
        Math.floor(((targetX + 1) * source.width) / target.width),
      );

      let red = 0;
      let green = 0;
      let blue = 0;
      let samples = 0;

      for (let sourceY = sourceYStart; sourceY < sourceYEnd; sourceY += 1) {
        for (let sourceX = sourceXStart; sourceX < sourceXEnd; sourceX += 1) {
          const pixelIndex = (sourceY * source.width + sourceX) * 4;
          const composite = compositeAlpha(
            sourcePixels[pixelIndex],
            sourcePixels[pixelIndex + 1],
            sourcePixels[pixelIndex + 2],
            sourcePixels[pixelIndex + 3],
            background,
          );

          red += composite.r;
          green += composite.g;
          blue += composite.b;
          samples += 1;
        }
      }

      const nearest = findNearestColor(
        {
          r: red / samples,
          g: green / samples,
          b: blue / samples,
        },
        palette,
      );

      const cellIndex = targetY * target.width + targetX;
      cells[cellIndex] = nearest.hex;
    }
  }

  const refinedCells = refineQuantizedCells(
    cells,
    target.width,
    target.height,
    palette,
  );
  const usedColors = new Set(refinedCells);

  return {
    type: "success",
    requestId: request.requestId,
    payload: {
      grid: {
        width: target.width,
        height: target.height,
        background: backgroundHex,
        cells: refinedCells,
      },
      usedColors: [...usedColors],
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
