"use client";

import { Focus } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { MAX_ZOOM, MIN_ZOOM } from "@/lib/constants";

interface CanvasControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFit: () => void;
}

export function CanvasControls({
  zoom,
  onZoomChange,
  onFit,
}: CanvasControlsProps) {
  const { messages } = useLocale();
  const copy = messages.editor.controls;
  const zoomPercent = Math.round(zoom * 100);

  return (
    <Panel className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-mist-50/40">
          {copy.zoomLabel}
        </span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step="0.01"
          value={zoom}
          aria-label={copy.zoomLabel}
          onChange={(event) => onZoomChange(Number(event.target.value))}
          onWheelCapture={(event) => {
            event.currentTarget.blur();
          }}
          onWheel={(event) => {
            event.currentTarget.blur();
          }}
          onPointerUp={(event) => {
            event.currentTarget.blur();
          }}
          className="h-2 w-full min-w-[180px] max-w-[280px] cursor-pointer accent-ember-400"
        />
        <span className="min-w-14 text-right text-sm font-medium text-mist-50/68">
          {zoomPercent}%
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={onFit}
          icon={<Focus className="h-4 w-4" />}
        >
          {copy.fit}
        </Button>
      </div>

      <p className="text-xs text-mist-50/40">{copy.wheelHint}</p>
    </Panel>
  );
}
