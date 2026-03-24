"use client";

import Link from "next/link";
import {
  ExternalLink,
  Grid2x2Check,
  ImagePlus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { GRID_PRESETS } from "@/lib/constants";
import { PALETTE_PRESET_OPTIONS } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type {
  GridSizeOption,
  PaletteColor,
  PalettePresetId,
  PixelGrid,
  SourceImageAsset,
} from "@/types/editor";

export type EditorView = "generate" | "edit";

interface UsedPaletteEntry {
  key: string;
  hex: string;
  name: string;
  count: number;
}

interface EditorSidebarProps {
  editorView: EditorView;
  grid: PixelGrid | null;
  sourceImage: SourceImageAsset | null;
  targetSize: GridSizeOption;
  palettePresetId: PalettePresetId;
  selectedColor: string;
  palette: PaletteColor[];
  usedPaletteEntries: UsedPaletteEntry[];
  showGrid: boolean;
  isPixelating: boolean;
  onUpload: () => void;
  onRegenerate: () => void;
  onRemoveNoise: () => void;
  onSelectPreset: (preset: GridSizeOption) => void;
  onSelectPalettePreset: (palettePresetId: PalettePresetId) => void;
  onSelectColor: (color: string) => void;
  onDeleteColorKey: (colorKey: string) => void;
  onToggleGrid: () => void;
}

export function EditorSidebar({
  editorView,
  grid,
  sourceImage,
  targetSize,
  palettePresetId,
  selectedColor,
  palette,
  usedPaletteEntries,
  showGrid,
  isPixelating,
  onUpload,
  onRegenerate,
  onRemoveNoise,
  onSelectPreset,
  onSelectPalettePreset,
  onSelectColor,
  onDeleteColorKey,
  onToggleGrid,
}: EditorSidebarProps) {
  const { messages } = useLocale();
  const copy = messages.editor.sidebar;
  const selectedPaletteColor =
    palette.find((color) => color.hex === selectedColor) ?? palette[0] ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto pb-2">
      {editorView === "generate" ? (
        <>
          <Panel className="border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {copy.sourceEyebrow}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-slate-900">
                  {copy.sourceTitle}
                </h3>
              </div>
              <Grid2x2Check className="h-5 w-5 text-amber-500" />
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-500">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                {sourceImage ? (
                  <>
                    <p className="font-medium text-slate-900">{sourceImage.name}</p>
                    <p className="mt-2">{copy.original(sourceImage.width, sourceImage.height)}</p>
                    <p className="mt-1">
                      {copy.currentGrid(
                        grid?.width ?? targetSize.width,
                        grid?.height ?? targetSize.height,
                      )}
                    </p>
                  </>
                ) : (
                  <p>{copy.noImage}</p>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <Button
                  variant="light"
                  onClick={onUpload}
                  icon={<ImagePlus className="h-4 w-4" />}
                >
                  {sourceImage ? copy.replaceImage : copy.uploadImage}
                </Button>
                <Button
                  variant="light"
                  onClick={onRegenerate}
                  disabled={!sourceImage || isPixelating}
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  {copy.regenerate}
                </Button>
                <Button
                  variant="light"
                  onClick={onRemoveNoise}
                  disabled={!grid || isPixelating}
                  icon={<Sparkles className="h-4 w-4" />}
                  className="sm:col-span-2 xl:col-span-1"
                >
                  {copy.removeNoise}
                </Button>
              </div>
            </div>
          </Panel>

          <Panel className="border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {copy.gridEyebrow}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-slate-900">
                  {copy.gridTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={onToggleGrid}
                className={cn(
                  "rounded-full px-3 py-2 text-xs uppercase tracking-[0.16em] transition",
                  showGrid
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500 hover:text-slate-700",
                )}
              >
                {copy.gridToggle(showGrid)}
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {GRID_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-left text-sm transition",
                    targetSize.id === preset.id
                      ? "border-amber-300 bg-amber-50 text-slate-900"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900",
                  )}
                >
                  <p className="font-medium">{preset.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                    {copy.presetSuffix}
                  </p>
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="border-slate-200 bg-white p-5 shadow-soft">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {copy.paletteEyebrow}
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold text-slate-900">
                {copy.paletteTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {grid ? copy.paletteReady : copy.paletteInactive}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {PALETTE_PRESET_OPTIONS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPalettePreset(preset.id)}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-left transition",
                    palettePresetId === preset.id
                      ? "border-emerald-300 bg-emerald-50 text-slate-900"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900",
                  )}
                >
                  <p className="text-sm font-medium">{preset.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                    {copy.palettePresetMeta(
                      preset.colorCount,
                      preset.id === "mard-221" ? copy.palettePresetBase : copy.palettePresetFull,
                    )}
                  </p>
                </button>
              ))}
            </div>
          </Panel>
        </>
      ) : (
        <>
          <Panel className="border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {copy.editEyebrow}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-slate-900">
                  {copy.editTitle}
                </h3>
              </div>
              <Link
                href="/palette"
                target="_blank"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                <ExternalLink className="h-4 w-4" />
                {copy.openPalettePage}
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {copy.currentColor}
                </p>
                {selectedPaletteColor ? (
                  <div className="mt-3 flex items-center gap-4">
                    <div
                      className="h-14 w-14 rounded-2xl border border-slate-200"
                      style={{ backgroundColor: selectedPaletteColor.hex }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {selectedPaletteColor.code ?? selectedPaletteColor.name}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                        {selectedPaletteColor.hex}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{selectedPaletteColor.name}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">{copy.noColorSelected}</p>
                )}
              </div>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {copy.quickSelect}
                </span>
                <select
                  value={selectedColor}
                  onChange={(event) => onSelectColor(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-300"
                >
                  {palette.map((color) => (
                    <option key={color.id} value={color.hex}>
                      {(color.code ?? color.name) + " · " + color.hex}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Panel>

          <Panel className="min-h-0 border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {copy.statsEyebrow}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-slate-900">
                  {copy.statsTitle}
                </h3>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                {copy.statsOrder}
              </span>
            </div>

            {usedPaletteEntries.length > 0 ? (
              <div className="mt-4 grid max-h-[28rem] gap-2 overflow-auto pr-1">
                {usedPaletteEntries.map((entry) => (
                  <div
                    key={entry.key}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <span
                      className="h-6 w-6 rounded-full border border-slate-200"
                      style={{ backgroundColor: entry.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {entry.key}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {entry.hex} · {copy.statsUsage(entry.count)}
                      </p>
                    </div>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => onDeleteColorKey(entry.key)}
                      disabled={isPixelating || usedPaletteEntries.length <= 1}
                      icon={<Trash2 className="h-4 w-4" />}
                      className="shrink-0"
                    >
                      {copy.deleteColor}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">{copy.statsEmpty}</p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
