import type { GridSizeOption } from "@/types/editor";

export const GRID_PRESETS: GridSizeOption[] = [
  { id: "32", label: "32 x 32", width: 32, height: 32 },
  { id: "48", label: "48 x 48", width: 48, height: 48 },
  { id: "64", label: "64 x 64", width: 64, height: 64 },
  { id: "96", label: "96 x 96", width: 96, height: 96 },
];

export const DEFAULT_GRID_PRESET = GRID_PRESETS[1];
export const DEFAULT_PROJECT_NAME = "Untitled Pattern";
export const DEFAULT_CANVAS_BACKGROUND = "#f7f4ed";
export const DEFAULT_EMPTY_CELL = "#f7f2e7";
export const EXTERNAL_BACKGROUND_FILL = "#E5E7EB";
export const HISTORY_LIMIT = 40;
export const BASE_CANVAS_CELL_SIZE = 16;
export const MIN_ZOOM = 0.35;
export const MAX_ZOOM = 3.4;
export const PROJECT_DB_NAME = "mypixel-projects";
export const PROJECT_STORE_NAME = "projects";
export const PROJECT_FALLBACK_KEY = "mypixel.projects.fallback";
export const EDITOR_PREFS_KEY = "mypixel.editor.preferences";
export const BACKGROUND_COLOR_KEYS = [
  "T1",
  "H1",
  "H2",
  "H17",
  "H18",
  "H21",
  "E16",
  "P1",
  "P19",
] as const;

export function findGridPresetById(id: string | null | undefined): GridSizeOption {
  return GRID_PRESETS.find((preset) => preset.id === id) ?? DEFAULT_GRID_PRESET;
}
