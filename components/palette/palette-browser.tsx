"use client";

import { useMemo, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getReadableTextColor } from "@/lib/color";
import { getPalettePreset } from "@/lib/palette";
import type { PaletteColor, PalettePresetId } from "@/types/editor";

function groupBySeries(colors: PaletteColor[]) {
  const groups = new Map<string, PaletteColor[]>();

  for (const color of colors) {
    const key = color.series ?? "Other";
    const list = groups.get(key) ?? [];
    list.push(color);
    groups.set(key, list);
  }

  return [...groups.entries()];
}

export function PaletteBrowser() {
  const { messages } = useLocale();
  const copy = messages.palette.page;
  const [presetId, setPresetId] = useState<PalettePresetId>("mard-291");
  const [status, setStatus] = useState<string | null>(null);

  const preset = useMemo(() => getPalettePreset(presetId), [presetId]);
  const groups = useMemo(() => groupBySeries(preset.colors), [preset.colors]);

  const copyColor = async (color: PaletteColor) => {
    const payload = `${color.code ?? color.name} · ${color.hex} · ${color.name}`;

    try {
      await navigator.clipboard.writeText(payload);
      setStatus(copy.copied(color.code ?? color.name, color.hex));
    } catch {
      setStatus(copy.copyFallback(payload));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember-400">
            {copy.eyebrow}
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-mist-50">
            {copy.title}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-mist-50/68">
            {copy.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant={presetId === "mard-221" ? "primary" : "secondary"}
            onClick={() => setPresetId("mard-221")}
          >
            {copy.basePreset}
          </Button>
          <Button
            variant={presetId === "mard-291" ? "primary" : "secondary"}
            onClick={() => setPresetId("mard-291")}
          >
            {copy.fullPreset}
          </Button>
        </div>
      </div>

      <Panel className="mt-8 flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-mist-50/62">
          {copy.meta(preset.name, preset.colorCount)}
        </p>
        <p className="text-sm text-mist-50/50">{status ?? copy.hoverHint}</p>
      </Panel>

      <div className="mt-8 space-y-6">
        {groups.map(([series, colors]) => (
          <Panel key={series} className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-mist-50">{series}</h2>
              <p className="text-xs uppercase tracking-[0.16em] text-mist-50/35">
                {copy.seriesCount(colors.length)}
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 xl:grid-cols-13">
              {colors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onMouseEnter={() => void copyColor(color)}
                  onFocus={() => void copyColor(color)}
                  onClick={() => void copyColor(color)}
                  title={`${color.code ?? color.name} · ${color.hex}`}
                  className="group rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-left transition hover:border-white/18 hover:bg-white/[0.05]"
                >
                  <div
                    className="flex aspect-square items-end rounded-xl border border-black/10 p-1.5"
                    style={{ backgroundColor: color.hex }}
                  >
                    <span
                      className="text-[10px] font-semibold tracking-[0.08em]"
                      style={{ color: getReadableTextColor(color.hex) }}
                    >
                      {color.code}
                    </span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <p className="truncate text-[11px] font-medium text-mist-50">
                      {color.code ?? color.name}
                    </p>
                    <p className="truncate text-[10px] uppercase tracking-[0.08em] text-mist-50/40">
                      {color.hex}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
