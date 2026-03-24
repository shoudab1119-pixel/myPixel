import type { PixelGrid } from "@/types/editor";

export function getCellIndex(x: number, y: number, width: number) {
  return y * width + x;
}

export function getCoordinatesFromIndex(index: number, width: number) {
  return {
    x: index % width,
    y: Math.floor(index / width),
  };
}

export function traceLine(startIndex: number, endIndex: number, width: number) {
  const start = getCoordinatesFromIndex(startIndex, width);
  const end = getCoordinatesFromIndex(endIndex, width);
  const indices: number[] = [];

  let x = start.x;
  let y = start.y;
  const deltaX = Math.abs(end.x - start.x);
  const deltaY = -Math.abs(end.y - start.y);
  const stepX = start.x < end.x ? 1 : -1;
  const stepY = start.y < end.y ? 1 : -1;
  let error = deltaX + deltaY;

  while (true) {
    indices.push(getCellIndex(x, y, width));

    if (x === end.x && y === end.y) {
      break;
    }

    const doubleError = 2 * error;

    if (doubleError >= deltaY) {
      error += deltaY;
      x += stepX;
    }

    if (doubleError <= deltaX) {
      error += deltaX;
      y += stepY;
    }
  }

  return indices;
}

export function applyPaintToIndices(
  grid: PixelGrid,
  indices: number[],
  color: string,
) {
  const nextCells = [...grid.cells];
  let changed = false;

  for (const index of indices) {
    if (index < 0 || index >= nextCells.length) {
      continue;
    }

    if (nextCells[index] !== color) {
      nextCells[index] = color;
      changed = true;
    }
  }

  return {
    changed,
    cells: nextCells,
  };
}

export function fillConnectedCells(
  grid: PixelGrid,
  startIndex: number,
  replacementColor: string,
) {
  const targetColor = grid.cells[startIndex];
  if (!targetColor || targetColor === replacementColor) {
    return {
      changed: false,
      cells: grid.cells,
    };
  }

  const nextCells = [...grid.cells];
  const queue = [startIndex];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined || visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (nextCells[current] !== targetColor) {
      continue;
    }

    nextCells[current] = replacementColor;
    const { x, y } = getCoordinatesFromIndex(current, grid.width);

    if (x > 0) {
      queue.push(current - 1);
    }
    if (x < grid.width - 1) {
      queue.push(current + 1);
    }
    if (y > 0) {
      queue.push(current - grid.width);
    }
    if (y < grid.height - 1) {
      queue.push(current + grid.width);
    }
  }

  return {
    changed: true,
    cells: nextCells,
  };
}
