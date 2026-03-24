import { getReadableTextColor, normalizeHex } from "@/lib/color";
import { clamp } from "@/lib/utils";
import type { GridRenderMode, PaletteColor, PixelGrid } from "@/types/editor";

interface GridExportOptions {
  cellSize?: number;
  palette?: PaletteColor[];
  renderMode?: GridRenderMode;
}

function createPaletteCodeLookup(palette: PaletteColor[]) {
  return new Map(
    palette.map((color) => [normalizeHex(color.hex), color.code ?? color.name]),
  );
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
  strokeStyle: string,
) {
  context.strokeStyle = strokeStyle;
  context.lineWidth = 1;
  context.beginPath();

  for (let x = 0; x <= grid.width; x += 1) {
    const drawX = x * cellSize;
    context.moveTo(drawX, 0);
    context.lineTo(drawX, grid.height * cellSize);
  }

  for (let y = 0; y <= grid.height; y += 1) {
    const drawY = y * cellSize;
    context.moveTo(0, drawY);
    context.lineTo(grid.width * cellSize, drawY);
  }

  context.stroke();
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
      context.fillStyle = grid.cells[y * grid.width + x];
      context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  if (renderMode === "coded" && options.palette?.length) {
    const paletteCodeLookup = createPaletteCodeLookup(options.palette);

    drawGridLines(context, grid, cellSize, "rgba(15, 23, 35, 0.22)");

    const fontSize = Math.max(10, Math.min(18, Math.floor(cellSize * 0.34)));
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `700 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;

    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const fill = grid.cells[y * grid.width + x];
        const label = paletteCodeLookup.get(normalizeHex(fill));

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
