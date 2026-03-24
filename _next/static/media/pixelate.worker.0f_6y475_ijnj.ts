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

function pixelate(request: PixelWorkerRequest): PixelWorkerResponse {
  const { source, target, palette, backgroundHex } = request.payload;
  const sourcePixels = new Uint8ClampedArray(source.data);
  const background = hexToRgb(backgroundHex);
  const cells = new Array<string>(target.width * target.height);
  const usedColors = new Set<string>();

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
      usedColors.add(nearest.hex);
    }
  }

  return {
    type: "success",
    requestId: request.requestId,
    payload: {
      grid: {
        width: target.width,
        height: target.height,
        background: backgroundHex,
        cells,
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
