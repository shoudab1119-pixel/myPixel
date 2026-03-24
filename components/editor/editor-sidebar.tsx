"use client";

import Link from "next/link";
import { ExternalLink, Grid2x2Check, ImagePlus, RefreshCw } from "lucide-react";

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

interface EditorSidebarProps {
  grid: PixelGrid | null;
  sourceImage: SourceImageAsset | null;
  targetSize: GridSizeOption;
  palettePresetId: PalettePresetId;
  selectedColor: string;
  palette: PaletteColor[];
  showGrid: boolean;
  isPixelating: boolean;
  onUpload: () => void;
  onRegenerate: () => void;
  onSelectPreset: (preset: GridSizeOption) => void;
  onSelectPalettePreset: (palettePresetId: PalettePresetId) => void;
  onSelectColor: (color: string) => void;
  onToggleGrid: () => void;
}

export function EditorSidebar({
  grid,
  sourceImage,
  targetSize,
  palettePresetId,
  selectedColor,
  palette,
  showGrid,
  isPixelating,
  onUpload,
  onRegenerate,
  onSelectPreset,
  onSelectPalettePreset,
  onSelectColor,
  onToggleGrid,
}: EditorSidebarProps) {
  const { messages } = useLocale();
  const copy = messages.editor.sidebar;
  const selectedPaletteColor =
    palette.find((color) => color.hex === selectedColor) ?? palette[0] ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-mist-50/40">
              {copy.sourceEyebrow}
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-mist-50">
              {copy.sourceTitle}
            </h3>
          </div>
          <Grid2x2Check className="h-5 w-5 text-ember-400" />
        </div>

        <div className="mt-5 space-y-3 text-sm text-mist-50/64">
          <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
            {sourceImage ? (
              <>
                <p className="font-medium text-mist-50">{sourceImage.name}</p>
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
              variant="secondary"
              onClick={onUpload}
              icon={<ImagePlus className="h-4 w-4" />}
            >
              {copy.uploadImage}
            </Button>
            <Button
              variant="secondary"
              onClick={onRegenerate}
              disabled={!sourceImage || isPixelating}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              {copy.regenerate}
            </Button>
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-mist-50/40">
              {copy.gridEyebrow}
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-mist-50">
              {copy.gridTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onToggleGrid}
            className={cn(
              "rounded-full px-3 py-2 text-xs uppercase tracking-[0.16em] transition",
              showGrid
                ? "bg-mint-300/15 text-mint-300"
                : "bg-white/[0.04] text-mist-50/42 hover:text-mist-50/62",
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
                  ? "border-ember-400/40 bg-ember-500/10 text-mist-50"
                  : "border-white/8 bg-white/[0.03] text-mist-50/65 hover:border-white/12 hover:text-mist-50",
              )}
            >
              <p className="font-medium">{preset.label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/30">
                {copy.presetSuffix}
              </p>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="min-h-0 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-mist-50/40">
            {copy.paletteEyebrow}
          </p>
          <h3 className="mt-2 font-display text-xl font-semibold text-mist-50">
            {copy.paletteTitle}
          </h3>
          <p className="mt-3 text-sm leading-6 text-mist-50/62">
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
                  ? "border-mint-300/40 bg-mint-300/12 text-mist-50"
                  : "border-white/8 bg-white/[0.03] text-mist-50/65 hover:border-white/12 hover:text-mist-50",
              )}
            >
              <p className="text-sm font-medium">{preset.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/38">
                {copy.palettePresetMeta(
                  preset.colorCount,
                  preset.id === "mard-221" ? copy.palettePresetBase : copy.palettePresetFull,
                )}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-mist-50/35">
              {copy.currentColor}
            </p>
            {selectedPaletteColor ? (
              <div className="mt-3 flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-2xl border border-black/10"
                  style={{ backgroundColor: selectedPaletteColor.hex }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-mist-50">
                    {selectedPaletteColor.code ?? selectedPaletteColor.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-mist-50/40">
                    {selectedPaletteColor.hex}
                  </p>
                  <p className="mt-1 text-xs text-mist-50/55">{selectedPaletteColor.name}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-mist-50/55">{copy.noColorSelected}</p>
            )}
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.16em] text-mist-50/35">
              {copy.quickSelect}
            </span>
            <select
              value={selectedColor}
              onChange={(event) => onSelectColor(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/15 px-4 text-sm text-mist-50 outline-none transition focus:border-mint-300/40"
            >
              {palette.map((color) => (
                <option key={color.id} value={color.hex} className="bg-ink-950 text-mist-50">
                  {(color.code ?? color.name) + " · " + color.hex}
                </option>
              ))}
            </select>
          </label>

          <Link
            href="/palette"
            target="_blank"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-mist-50 transition hover:bg-white/[0.06]"
          >
            <ExternalLink className="h-4 w-4" />
            {copy.openPalettePage}
          </Link>
        </div>
      </Panel>
    </div>
  );
}
