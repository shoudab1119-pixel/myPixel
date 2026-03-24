export type ToolType = "brush" | "eraser" | "eyedropper" | "bucket" | "hand";
export type GridRenderMode = "plain" | "coded";

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface PaletteColor {
  id: string;
  name: string;
  hex: string;
  rgb: RGBColor;
  code?: string;
  series?: string;
  family?: PalettePresetId;
}

export type PalettePresetId = "mard-221" | "mard-291";

export interface PalettePreset {
  id: PalettePresetId;
  name: string;
  description: string;
  colorCount: number;
  backgroundHex: string;
  defaultColorHex: string;
  colors: PaletteColor[];
}

export interface GridSizeOption {
  id: string;
  label: string;
  width: number;
  height: number;
}

export interface PixelGrid {
  width: number;
  height: number;
  cells: string[];
  background: string;
}

export interface SourceImageAsset {
  name: string;
  type: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  showGrid: boolean;
}

export interface CanvasBounds {
  width: number;
  height: number;
}

export interface HistoryState {
  past: string[][];
  future: string[][];
  pending: string[] | null;
  limit: number;
}

export interface ProcessingState {
  isPixelating: boolean;
  isLoadingProject: boolean;
  isSavingProject: boolean;
  error: string | null;
  status: string | null;
}
