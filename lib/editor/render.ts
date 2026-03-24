import {
  BASE_CANVAS_CELL_SIZE,
  EXTERNAL_BACKGROUND_FILL,
  DEFAULT_CANVAS_BACKGROUND,
  GRID_GUIDE_INTERVAL,
  LARGE_GRID_GUIDE_THRESHOLD,
  MAX_ZOOM,
  MIN_ZOOM,
} from "@/lib/constants";
import { getReadableTextColor } from "@/lib/color";
import { getGridDisplayFill } from "@/lib/editor/grid-colors";
import { clamp } from "@/lib/utils";
import type {
  GridRenderMode,
  PaletteColor,
  PixelGrid,
  ViewportState,
} from "@/types/editor";

export interface CanvasRenderInput {
  canvas: HTMLCanvasElement;
  grid: PixelGrid;
  palette: PaletteColor[];
  renderMode: GridRenderMode;
  viewport: ViewportState;
  width: number;
  height: number;
}

export function getRenderedCellSize(zoom: number) {
  return BASE_CANVAS_CELL_SIZE * zoom;
}

function shouldShowCoordinateGuides(grid: PixelGrid) {
  return Math.max(grid.width, grid.height) >= LARGE_GRID_GUIDE_THRESHOLD;
}

function drawGridLineSet(
  context: CanvasRenderingContext2D,
  grid: PixelGrid,
  offsetX: number,
  offsetY: number,
  cellSize: number,
  interval: number,
  strokeStyle: string,
  lineWidth: number,
) {
  const contentWidth = grid.width * cellSize;
  const contentHeight = grid.height * cellSize;

  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.beginPath();

  for (let x = 0; x <= grid.width; x += interval) {
    const drawX = offsetX + x * cellSize;
    context.moveTo(drawX, offsetY);
    context.lineTo(drawX, offsetY + contentHeight);
  }

  for (let y = 0; y <= grid.height; y += interval) {
    const drawY = offsetY + y * cellSize;
    context.moveTo(offsetX, drawY);
    context.lineTo(offsetX + contentWidth, drawY);
  }

  context.stroke();
}

export function fitGridViewport(
  grid: PixelGrid,
  viewportWidth: number,
  viewportHeight: number,
): ViewportState {
  const zoom = clamp(
    Math.min(
      viewportWidth / (grid.width * BASE_CANVAS_CELL_SIZE + 80),
      viewportHeight / (grid.height * BASE_CANVAS_CELL_SIZE + 80),
    ),
    MIN_ZOOM,
    MAX_ZOOM,
  );
  const cellSize = getRenderedCellSize(zoom);
  const contentWidth = grid.width * cellSize;
  const contentHeight = grid.height * cellSize;

  return {
    zoom,
    offsetX: (viewportWidth - contentWidth) / 2,
    offsetY: (viewportHeight - contentHeight) / 2,
    showGrid: true,
  };
}

export function getCellFromCanvasPoint(
  grid: PixelGrid,
  viewport: ViewportState,
  pointX: number,
  pointY: number,
) {
  const cellSize = getRenderedCellSize(viewport.zoom);
  const x = Math.floor((pointX - viewport.offsetX) / cellSize);
  const y = Math.floor((pointY - viewport.offsetY) / cellSize);

  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
    return null;
  }

  return {
    x,
    y,
    index: y * grid.width + x,
  };
}

export function getCellScreenCenter(
  viewport: ViewportState,
  cellX: number,
  cellY: number,
) {
  const cellSize = getRenderedCellSize(viewport.zoom);

  return {
    x: viewport.offsetX + cellX * cellSize + cellSize / 2,
    y: viewport.offsetY + cellY * cellSize + cellSize / 2,
  };
}

export function zoomViewportAtPoint(
  viewport: ViewportState,
  nextZoom: number,
  anchorX: number,
  anchorY: number,
) {
  const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
  const currentCellSize = getRenderedCellSize(viewport.zoom);
  const nextCellSize = getRenderedCellSize(clampedZoom);

  const contentX = (anchorX - viewport.offsetX) / currentCellSize;
  const contentY = (anchorY - viewport.offsetY) / currentCellSize;

  return {
    ...viewport,
    zoom: clampedZoom,
    offsetX: anchorX - contentX * nextCellSize,
    offsetY: anchorY - contentY * nextCellSize,
  };
}

export function renderPixelGrid({
  canvas,
  grid,
  renderMode,
  viewport,
  width,
  height,
}: CanvasRenderInput) {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * devicePixelRatio);
  canvas.height = Math.floor(height * devicePixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, width, height);
  context.fillStyle = DEFAULT_CANVAS_BACKGROUND;
  context.fillRect(0, 0, width, height);

  const cellSize = getRenderedCellSize(viewport.zoom);
  const contentWidth = grid.width * cellSize;
  const contentHeight = grid.height * cellSize;

  context.fillStyle = "rgba(255,255,255,0.03)";
  context.fillRect(
    viewport.offsetX - 12,
    viewport.offsetY - 12,
    contentWidth + 24,
    contentHeight + 24,
  );

  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      context.fillStyle = grid.cells[y * grid.width + x];
      const cellIndex = y * grid.width + x;
      context.fillStyle = getGridDisplayFill(grid, cellIndex, EXTERNAL_BACKGROUND_FILL);
      context.fillRect(
        viewport.offsetX + x * cellSize,
        viewport.offsetY + y * cellSize,
        cellSize,
        cellSize,
      );
    }
  }

  if (renderMode === "coded" && cellSize >= 12) {
    const fontSize = Math.max(9, Math.min(18, Math.floor(cellSize * 0.36)));

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;

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

        const centerX = viewport.offsetX + x * cellSize + cellSize / 2;
        const centerY = viewport.offsetY + y * cellSize + cellSize / 2;
        const textColor = getReadableTextColor(fill);

        context.lineWidth = Math.max(2, Math.floor(fontSize * 0.18));
        context.strokeStyle =
          textColor === "#f8fafc" ? "rgba(15, 23, 35, 0.6)" : "rgba(248, 250, 252, 0.7)";
        context.fillStyle = textColor;
        context.strokeText(label, centerX, centerY);
        context.fillText(label, centerX, centerY);
      }
    }
  }

  if (viewport.showGrid) {
    if (cellSize >= 8) {
      drawGridLineSet(
        context,
        grid,
        viewport.offsetX,
        viewport.offsetY,
        cellSize,
        1,
        "rgba(15, 23, 42, 0.14)",
        1,
      );
    }

    if (shouldShowCoordinateGuides(grid) && cellSize >= 4) {
      drawGridLineSet(
        context,
        grid,
        viewport.offsetX,
        viewport.offsetY,
        cellSize,
        GRID_GUIDE_INTERVAL,
        "rgba(15, 23, 42, 0.34)",
        cellSize >= 10 ? 1.5 : 1,
      );
    }
  }

  context.strokeStyle = "rgba(255,255,255,0.16)";
  context.lineWidth = 1;
  context.strokeRect(viewport.offsetX, viewport.offsetY, contentWidth, contentHeight);
}
