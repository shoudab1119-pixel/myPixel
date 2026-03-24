"use client";

import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingRing } from "@/components/ui/loading-ring";
import {
  fitGridViewport,
  getCellScreenCenter,
  getCellFromCanvasPoint,
  renderPixelGrid,
} from "@/lib/editor/render";
import {
  applyPaintToIndices,
  fillConnectedCells,
  traceLine,
} from "@/lib/editor/tools";
import { useEditorStore } from "@/store/editor-store";

interface PixelCanvasProps {
  fitSignal: number;
  isPixelating: boolean;
  editingEnabled: boolean;
  onUploadRequest: () => void;
}

type InteractionState =
  | {
      mode: "pan";
      pointerId: number;
      lastPoint: { x: number; y: number };
    }
  | {
      mode: "paint";
      pointerId: number;
      lastCellIndex: number;
    }
  | null;

interface HoverSample {
  code: string;
  hex: string;
  x: number;
  y: number;
  external: boolean;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
}

export function PixelCanvas({
  fitSignal,
  isPixelating,
  editingEnabled,
  onUploadRequest,
}: PixelCanvasProps) {
  const { messages } = useLocale();
  const copy = messages.editor.canvas;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<InteractionState>(null);
  const spacePressedRef = useRef(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [hoverSample, setHoverSample] = useState<HoverSample | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const grid = useEditorStore((state) => state.grid);
  const palette = useEditorStore((state) => state.palette);
  const renderMode = useEditorStore((state) => state.renderMode);
  const selectedTool = useEditorStore((state) => state.selectedTool);
  const viewport = useEditorStore((state) => state.viewport);
  const setSelectedTool = useEditorStore((state) => state.setSelectedTool);
  const setViewport = useEditorStore((state) => state.setViewport);
  const setCanvasBounds = useEditorStore((state) => state.setCanvasBounds);
  const panViewport = useEditorStore((state) => state.panViewport);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const nextWidth = entry.contentRect.width;
      const nextHeight = entry.contentRect.height;

      setViewportSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }

        setCanvasBounds({
          width: nextWidth,
          height: nextHeight,
        });

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [setCanvasBounds]);

  useEffect(() => {
    if (!grid || !viewportSize.width || !viewportSize.height) {
      return;
    }

    setViewport(fitGridViewport(grid, viewportSize.width, viewportSize.height));
  }, [fitSignal, grid, setViewport, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    if (!canvasRef.current || !grid || !viewportSize.width || !viewportSize.height) {
      return;
    }

    renderPixelGrid({
      canvas: canvasRef.current,
      grid,
      palette,
      renderMode,
      viewport,
      width: viewportSize.width,
      height: viewportSize.height,
    });
  }, [grid, palette, renderMode, viewport, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.code === "Space") {
        spacePressedRef.current = true;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }

      switch (event.key.toLowerCase()) {
        case "b":
          if (!editingEnabled) {
            break;
          }
          setSelectedTool("brush");
          break;
        case "e":
          if (!editingEnabled) {
            break;
          }
          setSelectedTool("eraser");
          break;
        case "i":
          if (!editingEnabled) {
            break;
          }
          setSelectedTool("eyedropper");
          break;
        case "g":
          if (!editingEnabled) {
            break;
          }
          setSelectedTool("bucket");
          break;
        case "h":
          setSelectedTool("hand");
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        spacePressedRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [editingEnabled, redo, setSelectedTool, undo]);

  const getLocalPoint = (
    event: PointerEvent<HTMLCanvasElement> | WheelEvent<HTMLCanvasElement>,
  ) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  };

  const finishInteraction = () => {
    const state = useEditorStore.getState();
    if (interactionRef.current?.mode === "paint") {
      state.commitHistoryTransaction();
    }
    interactionRef.current = null;
    setIsPanning(false);
  };

  const updateHoverSample = (
    point: { x: number; y: number },
    liveGrid = useEditorStore.getState().grid,
  ) => {
    const state = useEditorStore.getState();
    const activeGrid = liveGrid ?? state.grid;

    if (!activeGrid) {
      setHoverSample(null);
      return;
    }

    const cell = getCellFromCanvasPoint(activeGrid, state.viewport, point.x, point.y);
    if (!cell) {
      setHoverSample(null);
      return;
    }

    const hex = activeGrid.cells[cell.index];
    const key = activeGrid.cellKeys[cell.index];
    const match =
      state.palette.find((color) => color.code === key) ??
      state.palette.find((color) => color.hex === hex) ??
      state.palette.find((color) => color.hex.toLowerCase() === hex.toLowerCase());
    const screen = getCellScreenCenter(state.viewport, cell.x, cell.y);

    setHoverSample({
      code: match?.code ?? key ?? match?.name ?? hex,
      hex,
      x: screen.x,
      y: screen.y,
      external: activeGrid.externalMask[cell.index] ?? false,
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const state = useEditorStore.getState();
    const liveGrid = state.grid;

    if (!liveGrid) {
      return;
    }

    const point = getLocalPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);

    if (
      event.button === 1 ||
      event.button === 2 ||
      spacePressedRef.current ||
      state.selectedTool === "hand" ||
      !editingEnabled
    ) {
      setIsPanning(true);
      interactionRef.current = {
        mode: "pan",
        pointerId: event.pointerId,
        lastPoint: point,
      };
      return;
    }

    if (event.button !== 0) {
      return;
    }

    const cell = getCellFromCanvasPoint(liveGrid, state.viewport, point.x, point.y);
    if (!cell) {
      interactionRef.current = {
        mode: "pan",
        pointerId: event.pointerId,
        lastPoint: point,
      };
      return;
    }

    if (editingEnabled && state.selectedTool === "eyedropper") {
      state.pickColorAt(cell.index);
      return;
    }

    if (editingEnabled && state.selectedTool === "bucket") {
      const result = fillConnectedCells(liveGrid, cell.index, state.selectedColor);
      if (result.changed) {
        state.applyCellsWithHistory(result.cells);
      }
      return;
    }

    if (!editingEnabled) {
      interactionRef.current = {
        mode: "pan",
        pointerId: event.pointerId,
        lastPoint: point,
      };
      setIsPanning(true);
      return;
    }

    state.startHistoryTransaction();
    const strokeColor =
      state.selectedTool === "eraser" ? liveGrid.background : state.selectedColor;
    const result = applyPaintToIndices(liveGrid, [cell.index], strokeColor);
    if (result.changed) {
      state.applyCells(result.cells);
    }
    interactionRef.current = {
      mode: "paint",
      pointerId: event.pointerId,
      lastCellIndex: cell.index,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = getLocalPoint(event);
    const state = useEditorStore.getState();
    const liveGrid = state.grid;

    updateHoverSample(point, liveGrid);

    if (!interactionRef.current) {
      return;
    }

    if (interactionRef.current.mode === "pan") {
      const deltaX = point.x - interactionRef.current.lastPoint.x;
      const deltaY = point.y - interactionRef.current.lastPoint.y;
      panViewport(deltaX, deltaY);
      interactionRef.current = {
        ...interactionRef.current,
        lastPoint: point,
      };
      return;
    }

    if (!liveGrid || !editingEnabled) {
      return;
    }

    const cell = getCellFromCanvasPoint(liveGrid, state.viewport, point.x, point.y);
    if (!cell || cell.index === interactionRef.current.lastCellIndex) {
      return;
    }

    const strokeColor =
      state.selectedTool === "eraser" ? liveGrid.background : state.selectedColor;
    const stroke = traceLine(
      interactionRef.current.lastCellIndex,
      cell.index,
      liveGrid.width,
    );
    const result = applyPaintToIndices(liveGrid, stroke, strokeColor);

    if (result.changed) {
      state.applyCells(result.cells);
    }

    interactionRef.current = {
      ...interactionRef.current,
      lastCellIndex: cell.index,
    };
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (interactionRef.current?.pointerId === event.pointerId) {
      finishInteraction();
    }
  };

  const handleWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    const state = useEditorStore.getState();
    if (!state.grid) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    panViewport(-event.deltaX, -event.deltaY);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 overflow-hidden overscroll-contain rounded-[38px] border border-slate-200/80 bg-[#eef2f7] shadow-[0_30px_80px_rgba(15,23,42,0.08)]"
    >
      {grid ? (
        <>
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={() => {
              setHoverSample(null);
            }}
            onWheel={handleWheel}
            onContextMenu={(event) => event.preventDefault()}
            className="h-full w-full touch-none"
            style={{
              cursor: !editingEnabled
                ? isPanning
                  ? "grabbing"
                  : "grab"
                : isPanning
                ? "grabbing"
                : selectedTool === "hand"
                  ? "grab"
                  : selectedTool === "eyedropper"
                    ? "crosshair"
                    : "default",
            }}
          />
          {hoverSample ? (
            <div
              className="pointer-events-none absolute z-10 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-soft"
              style={{
                left: hoverSample.x + 14,
                top: hoverSample.y + 14,
                transform: "translate(0, 0)",
              }}
            >
              <p className="font-medium text-slate-800">{hoverSample.code}</p>
              <p className="mt-1 uppercase tracking-[0.14em] text-slate-400">
                {hoverSample.hex}
              </p>
              {hoverSample.external ? (
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  {copy.externalBackground}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-slate-200 bg-white/92 px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-400 shadow-sm">
            {editingEnabled ? copy.hint : copy.generateHint}
          </div>
          {isPixelating ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-5 py-3 text-sm text-slate-700 shadow-soft">
                <LoadingRing />
                {copy.rebuilding}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex h-full items-center justify-center p-8">
          <EmptyState
            title={copy.emptyTitle}
            description={copy.emptyDescription}
            action={<Button variant="light" onClick={onUploadRequest}>{copy.uploadImage}</Button>}
          />
        </div>
      )}
    </div>
  );
}
