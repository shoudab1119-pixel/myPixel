"use client";

import { EDITOR_PREFS_KEY } from "@/lib/constants";
import type { GridRenderMode, PalettePresetId } from "@/types/editor";

export interface EditorPreferences {
  lastProjectId: string | null;
  showGrid: boolean;
  gridPresetId: string;
  palettePresetId: PalettePresetId;
  renderMode: GridRenderMode;
}

export const defaultEditorPreferences: EditorPreferences = {
  lastProjectId: null,
  showGrid: true,
  gridPresetId: "48",
  palettePresetId: "mard-221",
  renderMode: "plain",
};

export function loadEditorPreferences() {
  if (typeof window === "undefined") {
    return defaultEditorPreferences;
  }

  try {
    const raw = window.localStorage.getItem(EDITOR_PREFS_KEY);
    if (!raw) {
      return defaultEditorPreferences;
    }

    return {
      ...defaultEditorPreferences,
      ...JSON.parse(raw),
    } as EditorPreferences;
  } catch {
    return defaultEditorPreferences;
  }
}

export function saveEditorPreferences(preferences: EditorPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(EDITOR_PREFS_KEY, JSON.stringify(preferences));
}
