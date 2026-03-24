import { getReadableTextColor } from "@/lib/color";
import {
  EXTERNAL_BACKGROUND_FILL,
  GRID_GUIDE_INTERVAL,
  LARGE_GRID_GUIDE_THRESHOLD,
} from "@/lib/constants";
import { getGridColorUsage, getGridDisplayFill } from "@/lib/editor/grid-colors";
import { clamp } from "@/lib/utils";
import type { GridRenderMode, PaletteColor, PixelGrid } from "@/types/editor";

interface GridExportOptions {
  cellSize?: number;
  palette?: PaletteColor[];
  renderMode?: GridRenderMode;
}

function resolveCellSize(grid: PixelGrid, renderMode: GridRenderMode, cellSize?: number) {
  if (cellSize) {
    return cellSize;
  }

  const maxDimension = Math.max(grid.width, grid.height);

  if (renderMode === "coded") {
    return clamp(Math.floor(3072 / maxDimension), 24, 42);
  }

  return clamp(Math.floor(2048 / maxDimension), 12, 48);
}

function drawGridLines(
  context: CanvasRenderingContext2D,
  grid: PixelGrid,
  cellSize: number,
  interval: number,
  strokeStyle: string,
  lineWidth = 1,
) {
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.beginPath();

  for (let x = 0; x <= grid.width; x += interval) {
    const drawX = x * cellSize;
    context.moveTo(drawX, 0);
    context.lineTo(drawX, grid.height * cellSize);
  }

  for (let y = 0; y <= grid.height; y += interval) {
    const drawY = y * cellSize;
    context.moveTo(0, drawY);
    context.lineTo(grid.width * cellSize, drawY);
  }

  context.stroke();
}

function shouldShowCoordinateGuides(grid: PixelGrid) {
  return Math.max(grid.width, grid.height) >= LARGE_GRID_GUIDE_THRESHOLD;
}

function drawGrid(grid: PixelGrid, options: GridExportOptions = {}) {
  const renderMode = options.renderMode ?? "plain";
  const cellSize = resolveCellSize(grid, renderMode, options.cellSize);
  const canvas = document.createElement("canvas");
  canvas.width = grid.width * cellSize;
  canvas.height = grid.height * cellSize;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable.");
  }

  context.imageSmoothingEnabled = false;

  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const cellIndex = y * grid.width + x;
      context.fillStyle = getGridDisplayFill(grid, cellIndex, EXTERNAL_BACKGROUND_FILL);
      context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  if (renderMode === "coded" && options.palette?.length) {
    drawGridLines(context, grid, cellSize, 1, "rgba(15, 23, 35, 0.2)");

    const fontSize = Math.max(10, Math.min(18, Math.floor(cellSize * 0.34)));
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `700 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;

    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const cellIndex = y * grid.width + x;
        if (grid.externalMask[cellIndex]) {
          continue;
        }

        const fill = grid.cells[cellIndex];
        const label = grid.cellKeys[cellIndex];

        if (!label) {
          continue;
        }

        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        const textColor = getReadableTextColor(fill);

        context.lineWidth = Math.max(2, Math.floor(fontSize * 0.18));
        context.strokeStyle =
          textColor === "#f8fafc" ? "rgba(15, 23, 35, 0.68)" : "rgba(248, 250, 252, 0.8)";
        context.fillStyle = textColor;
        context.strokeText(label, centerX, centerY);
        context.fillText(label, centerX, centerY);
      }
    }

    context.strokeStyle = "rgba(15, 23, 35, 0.35)";
    context.lineWidth = 1.5;
    context.strokeRect(0, 0, canvas.width, canvas.height);
  }

  if (shouldShowCoordinateGuides(grid)) {
    drawGridLines(
      context,
      grid,
      cellSize,
      GRID_GUIDE_INTERVAL,
      "rgba(15, 23, 35, 0.4)",
      cellSize >= 24 ? 1.75 : 1.25,
    );
  }

  return canvas;
}

export async function exportGridToBlob(grid: PixelGrid, options: GridExportOptions = {}) {
  const canvas = drawGrid(grid, options);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to export PNG."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

export function createGridThumbnail(grid: PixelGrid) {
  const cellSize = Math.max(3, Math.floor(192 / Math.max(grid.width, grid.height)));
  return drawGrid(grid, { cellSize, renderMode: "plain" }).toDataURL("image/png");
}

export async function exportGridStatsToBlob(
  grid: PixelGrid,
  palette: PaletteColor[],
) {
  const usage = [...getGridColorUsage(grid, palette).values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return (left.color.code ?? left.color.name).localeCompare(
      right.color.code ?? right.color.name,
    );
  });

  const swatchSize = 30;
  const rowHeight = 52;
  const padding = 28;
  const width = 760;
  const height = Math.max(180, padding * 2 + 72 + usage.length * rowHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable.");
  }

  context.fillStyle = "#0f1723";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#f8fafc";
  context.font = "700 28px ui-sans-serif, system-ui, sans-serif";
  context.fillText("Color Usage", padding, 44);

  context.fillStyle = "rgba(248, 250, 252, 0.6)";
  context.font = "500 14px ui-sans-serif, system-ui, sans-serif";
  context.fillText("Only non-background external cells are counted.", padding, 68);

  let offsetY = padding + 72;

  for (const item of usage) {
    const code = item.color.code ?? item.color.name;

    context.fillStyle = "rgba(255,255,255,0.04)";
    context.fillRect(padding - 10, offsetY - 14, width - padding * 2 + 20, rowHeight - 4);

    context.fillStyle = item.color.hex;
    context.fillRect(padding, offsetY, swatchSize, swatchSize);

    context.strokeStyle = "rgba(255,255,255,0.14)";
    context.lineWidth = 1;
    context.strokeRect(padding, offsetY, swatchSize, swatchSize);

    context.fillStyle = "#f8fafc";
    context.font = "700 18px ui-sans-serif, system-ui, sans-serif";
    context.fillText(code, padding + swatchSize + 16, offsetY + 20);

    context.fillStyle = "rgba(248, 250, 252, 0.68)";
    context.font = "500 14px ui-sans-serif, system-ui, sans-serif";
    context.fillText(item.color.hex, padding + swatchSize + 16, offsetY + 40);

    context.fillStyle = "#fbbf24";
    context.font = "700 18px ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "right";
    context.fillText(String(item.count), width - padding, offsetY + 30);
    context.textAlign = "left";

    offsetY += rowHeight;
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to export stats PNG."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}
