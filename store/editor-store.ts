"use client";

import { create } from "zustand";

import {
  DEFAULT_GRID_PRESET,
  DEFAULT_PROJECT_NAME,
  HISTORY_LIMIT,
  findGridPresetById,
} from "@/lib/constants";
import { areCellsEqual, cloneGrid } from "@/lib/editor/grid";
import {
  normalizePixelGrid,
  replaceGridCellsWithPalette,
} from "@/lib/editor/grid-colors";
import { pushPastSnapshot } from "@/lib/editor/history";
import {
  DEFAULT_PALETTE,
  DEFAULT_PALETTE_PRESET,
  DEFAULT_PALETTE_PRESET_ID,
  getPalettePreset,
  inferPalettePresetId,
} from "@/lib/palette";
import type {
  CanvasBounds,
  GridRenderMode,
  GridSizeOption,
  HistoryState,
  PaletteColor,
  PalettePresetId,
  PixelGrid,
  ProcessingState,
  SourceImageAsset,
  ToolType,
  ViewportState,
} from "@/types/editor";
import type { ProjectSnapshot } from "@/types/project";

interface EditorState {
  projectId: string | null;
  projectName: string;
  grid: PixelGrid | null;
  originalGrid: PixelGrid | null;
  palettePresetId: PalettePresetId;
  palette: PaletteColor[];
  sourceImage: SourceImageAsset | null;
  targetSize: GridSizeOption;
  excludedColorKeys: string[];
  selectedTool: ToolType;
  selectedColor: string;
  renderMode: GridRenderMode;
  viewport: ViewportState;
  canvasBounds: CanvasBounds;
  history: HistoryState;
  processing: ProcessingState;
  dirty: boolean;
  lastSavedAt: string | null;
  setProjectName: (projectName: string) => void;
  setProjectId: (projectId: string | null) => void;
  setTargetSize: (targetSize: GridSizeOption) => void;
  setPalettePresetId: (palettePresetId: PalettePresetId) => void;
  setExcludedColorKeys: (excludedColorKeys: string[]) => void;
  setSelectedTool: (selectedTool: ToolType) => void;
  setSelectedColor: (selectedColor: string) => void;
  setRenderMode: (renderMode: GridRenderMode) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  setCanvasBounds: (canvasBounds: CanvasBounds) => void;
  panViewport: (deltaX: number, deltaY: number) => void;
  hydratePreferences: (preferences: Partial<{
    showGrid: boolean;
    gridPresetId: string;
    palettePresetId: PalettePresetId;
    renderMode: GridRenderMode;
  }>) => void;
  setProcessing: (processing: Partial<ProcessingState>) => void;
  initializeProject: (payload: {
    grid: PixelGrid;
    originalGrid?: PixelGrid;
    palettePresetId?: PalettePresetId;
    sourceImage: SourceImageAsset | null;
    palette?: PaletteColor[];
    targetSize: GridSizeOption;
    excludedColorKeys?: string[];
    viewport?: ViewportState;
    projectId?: string | null;
    projectName?: string;
    dirty?: boolean;
  }) => void;
  loadSnapshot: (snapshot: ProjectSnapshot) => void;
  createSnapshot: () => ProjectSnapshot | null;
  startHistoryTransaction: () => void;
  applyCells: (cells: string[]) => void;
  commitHistoryTransaction: () => void;
  cancelHistoryTransaction: () => void;
  applyCellsWithHistory: (cells: string[]) => void;
  pickColorAt: (index: number) => void;
  resetToOriginal: () => void;
  undo: () => void;
  redo: () => void;
  markSaved: (projectId: string, projectName?: string) => void;
  clearEditor: () => void;
}

const createDefaultViewport = (): ViewportState => ({
  zoom: 1,
  offsetX: 96,
  offsetY: 96,
  showGrid: true,
});

const createDefaultHistory = (): HistoryState => ({
  past: [],
  future: [],
  pending: null,
  limit: HISTORY_LIMIT,
});

const createDefaultProcessing = (): ProcessingState => ({
  isPixelating: false,
  isLoadingProject: false,
  isSavingProject: false,
  error: null,
  status: null,
});

const createDefaultCanvasBounds = (): CanvasBounds => ({
  width: 0,
  height: 0,
});

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  projectName: DEFAULT_PROJECT_NAME,
  grid: null,
  originalGrid: null,
  palettePresetId: DEFAULT_PALETTE_PRESET_ID,
  palette: DEFAULT_PALETTE,
  sourceImage: null,
  targetSize: DEFAULT_GRID_PRESET,
  excludedColorKeys: [],
  selectedTool: "hand",
  selectedColor: DEFAULT_PALETTE_PRESET.defaultColorHex,
  renderMode: "plain",
  viewport: createDefaultViewport(),
  canvasBounds: createDefaultCanvasBounds(),
  history: createDefaultHistory(),
  processing: createDefaultProcessing(),
  dirty: false,
  lastSavedAt: null,
  setProjectName: (projectName) => set({ projectName, dirty: true }),
  setProjectId: (projectId) => set({ projectId }),
  setTargetSize: (targetSize) => set({ targetSize }),
  setPalettePresetId: (palettePresetId) =>
    set((state) => {
      const preset = getPalettePreset(palettePresetId);

      return {
        palettePresetId: preset.id,
        palette: preset.colors,
        selectedColor: preset.colors.some((color) => color.hex === state.selectedColor)
          ? state.selectedColor
          : preset.defaultColorHex,
      };
    }),
  setExcludedColorKeys: (excludedColorKeys) => set({ excludedColorKeys }),
  setSelectedTool: (selectedTool) => set({ selectedTool }),
  setSelectedColor: (selectedColor) => set({ selectedColor }),
  setRenderMode: (renderMode) => set({ renderMode }),
  setViewport: (viewport) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        ...viewport,
      },
    })),
  setCanvasBounds: (canvasBounds) =>
    set((state) =>
      state.canvasBounds.width === canvasBounds.width &&
      state.canvasBounds.height === canvasBounds.height
        ? state
        : { canvasBounds },
    ),
  panViewport: (deltaX, deltaY) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        offsetX: state.viewport.offsetX + deltaX,
        offsetY: state.viewport.offsetY + deltaY,
      },
    })),
  hydratePreferences: (preferences) =>
    set((state) => {
      const palettePreset = getPalettePreset(
        preferences.palettePresetId ?? state.palettePresetId,
      );

      return {
        viewport: {
          ...state.viewport,
          showGrid: preferences.showGrid ?? state.viewport.showGrid,
        },
        targetSize: findGridPresetById(preferences.gridPresetId ?? state.targetSize.id),
        palettePresetId: palettePreset.id,
        palette: palettePreset.colors,
        selectedColor: palettePreset.colors.some(
          (color) => color.hex === state.selectedColor,
        )
          ? state.selectedColor
          : palettePreset.defaultColorHex,
        renderMode: preferences.renderMode ?? state.renderMode,
      };
    }),
  setProcessing: (processing) =>
    set((state) => ({
      processing: {
        ...state.processing,
        ...processing,
      },
    })),
  initializeProject: ({
    grid,
    originalGrid,
    palettePresetId = DEFAULT_PALETTE_PRESET_ID,
    sourceImage,
    palette = DEFAULT_PALETTE,
    targetSize,
    excludedColorKeys = [],
    viewport,
    projectId = null,
    projectName = DEFAULT_PROJECT_NAME,
    dirty = false,
  }) =>
    set((state) => {
      const resolvedPreset = getPalettePreset(palettePresetId);
      const normalizedGrid = normalizePixelGrid(grid, palette);
      const normalizedOriginalGrid = normalizePixelGrid(originalGrid ?? grid, palette);

      return {
        projectId,
        projectName,
        grid: cloneGrid(normalizedGrid),
        originalGrid: cloneGrid(normalizedOriginalGrid),
        palettePresetId: resolvedPreset.id,
        sourceImage,
        palette,
        targetSize,
        excludedColorKeys,
        selectedColor: palette.some((color) => color.hex === state.selectedColor)
          ? state.selectedColor
          : resolvedPreset.defaultColorHex,
        renderMode: state.renderMode,
        viewport: viewport ?? state.viewport,
        history: createDefaultHistory(),
        processing: {
          ...state.processing,
          error: null,
        },
        dirty,
      };
    }),
  loadSnapshot: (snapshot) =>
    set(() => {
      const palettePresetId = inferPalettePresetId(
        snapshot.palettePresetId,
        snapshot.palette,
      );
      const normalizedGrid = normalizePixelGrid(snapshot.grid, snapshot.palette);
      const normalizedOriginalGrid = normalizePixelGrid(
        snapshot.originalGrid,
        snapshot.palette,
      );

      return {
        projectId: snapshot.projectId,
        projectName: snapshot.projectName,
        grid: cloneGrid(normalizedGrid),
        originalGrid: cloneGrid(normalizedOriginalGrid),
        palettePresetId,
        palette: snapshot.palette,
        sourceImage: snapshot.sourceImage,
        targetSize: snapshot.targetSize,
        excludedColorKeys: snapshot.excludedColorKeys ?? [],
        selectedColor: snapshot.selectedColor,
        renderMode: snapshot.renderMode ?? "plain",
        viewport: snapshot.viewport,
        canvasBounds: createDefaultCanvasBounds(),
        history: createDefaultHistory(),
        processing: createDefaultProcessing(),
        dirty: false,
        lastSavedAt: new Date().toISOString(),
      };
    }),
  createSnapshot: () => {
    const state = get();

    if (!state.grid || !state.originalGrid) {
      return null;
    }

    return {
      version: 3,
      projectId: state.projectId ?? crypto.randomUUID(),
      projectName: state.projectName.trim() || DEFAULT_PROJECT_NAME,
      grid: cloneGrid(state.grid),
      originalGrid: cloneGrid(state.originalGrid),
      palettePresetId: state.palettePresetId,
      palette: state.palette,
      selectedColor: state.selectedColor,
      renderMode: state.renderMode,
      targetSize: state.targetSize,
      viewport: state.viewport,
      sourceImage: state.sourceImage,
      excludedColorKeys: state.excludedColorKeys,
    };
  },
  startHistoryTransaction: () =>
    set((state) => ({
      history:
        state.history.pending || !state.grid
          ? state.history
          : {
              ...state.history,
              pending: [...state.grid.cells],
            },
    })),
  applyCells: (cells) =>
    set((state) => ({
      grid: state.grid ? replaceGridCellsWithPalette(state.grid, cells, state.palette) : null,
    })),
  commitHistoryTransaction: () =>
    set((state) => {
      if (!state.grid || !state.history.pending) {
        return {
          history: {
            ...state.history,
            pending: null,
          },
        };
      }

      if (areCellsEqual(state.history.pending, state.grid.cells)) {
        return {
          history: {
            ...state.history,
            pending: null,
          },
        };
      }

      return {
        history: {
          ...state.history,
          past: pushPastSnapshot(
            state.history.past,
            state.history.pending,
            state.history.limit,
          ),
          future: [],
          pending: null,
        },
        dirty: true,
      };
    }),
  cancelHistoryTransaction: () =>
    set((state) => ({
      history: {
        ...state.history,
        pending: null,
      },
    })),
  applyCellsWithHistory: (cells) =>
    set((state) => {
      if (!state.grid || areCellsEqual(state.grid.cells, cells)) {
        return state;
      }

      return {
        grid: replaceGridCellsWithPalette(state.grid, cells, state.palette),
        history: {
          ...state.history,
          past: pushPastSnapshot(state.history.past, state.grid.cells, state.history.limit),
          future: [],
          pending: null,
        },
        dirty: true,
      };
    }),
  pickColorAt: (index) => {
    const state = get();
    const color = state.grid?.cells[index];

    if (color) {
      set({
        selectedColor: color,
      });
    }
  },
  resetToOriginal: () =>
    set((state) => {
      if (!state.grid || !state.originalGrid) {
        return state;
      }

      return {
        grid: cloneGrid(state.originalGrid),
        history: {
          ...state.history,
          past: pushPastSnapshot(state.history.past, state.grid.cells, state.history.limit),
          future: [],
          pending: null,
        },
        dirty: true,
      };
    }),
  undo: () =>
    set((state) => {
      if (!state.grid || state.history.past.length === 0) {
        return state;
      }

      const previous = state.history.past[state.history.past.length - 1];

      return {
        grid: replaceGridCellsWithPalette(state.grid, [...previous], state.palette),
        history: {
          ...state.history,
          past: state.history.past.slice(0, -1),
          future: [[...state.grid.cells], ...state.history.future],
          pending: null,
        },
        dirty: true,
      };
    }),
  redo: () =>
    set((state) => {
      if (!state.grid || state.history.future.length === 0) {
        return state;
      }

      const [nextCells, ...future] = state.history.future;

      return {
        grid: replaceGridCellsWithPalette(state.grid, [...nextCells], state.palette),
        history: {
          ...state.history,
          past: pushPastSnapshot(state.history.past, state.grid.cells, state.history.limit),
          future,
          pending: null,
        },
        dirty: true,
      };
    }),
  markSaved: (projectId, projectName) =>
    set((state) => ({
      projectId,
      projectName:
        projectName ?? (state.projectName.trim() || DEFAULT_PROJECT_NAME),
      dirty: false,
      lastSavedAt: new Date().toISOString(),
      processing: {
        ...state.processing,
        isSavingProject: false,
      },
    })),
  clearEditor: () =>
    set({
      projectId: null,
      projectName: DEFAULT_PROJECT_NAME,
      grid: null,
      originalGrid: null,
      palettePresetId: DEFAULT_PALETTE_PRESET_ID,
      palette: DEFAULT_PALETTE,
      sourceImage: null,
      targetSize: DEFAULT_GRID_PRESET,
      excludedColorKeys: [],
      selectedTool: "hand",
      selectedColor: DEFAULT_PALETTE_PRESET.defaultColorHex,
      renderMode: "plain",
      viewport: createDefaultViewport(),
      canvasBounds: createDefaultCanvasBounds(),
      history: createDefaultHistory(),
      processing: createDefaultProcessing(),
      dirty: false,
      lastSavedAt: null,
    }),
}));
