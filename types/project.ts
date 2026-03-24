import type {
  GridRenderMode,
  GridSizeOption,
  PaletteColor,
  PalettePresetId,
  PixelGrid,
  SourceImageAsset,
  ViewportState,
} from "@/types/editor";

export interface ProjectSnapshot {
  version: number;
  projectId: string;
  projectName: string;
  grid: PixelGrid;
  originalGrid: PixelGrid;
  palettePresetId?: PalettePresetId;
  palette: PaletteColor[];
  selectedColor: string;
  renderMode?: GridRenderMode;
  targetSize: GridSizeOption;
  viewport: ViewportState;
  sourceImage: SourceImageAsset | null;
}

export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  thumbnailDataUrl: string;
  snapshot: ProjectSnapshot;
}

export interface ProjectListItem {
  id: string;
  name: string;
  updatedAt: string;
  thumbnailDataUrl: string;
  width: number;
  height: number;
  colorCount: number;
}
