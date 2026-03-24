"use client";

import { useEffect, useState } from "react";
import { Grid3x3, Tag } from "lucide-react";
import {
  Download,
  FolderOpen,
  LayoutList,
  RefreshCw,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import type { GridRenderMode } from "@/types/editor";

interface EditorTopbarProps {
  projectName: string;
  hasSourceImage: boolean;
  dirty: boolean;
  isPixelating: boolean;
  isSaving: boolean;
  status: string | null;
  lastSavedAt: string | null;
  renderMode: GridRenderMode;
  onProjectNameChange: (value: string) => void;
  onUpload: () => void;
  onOpenLibrary: () => void;
  onSave: () => void;
  onExport: () => void;
  onExportStats: () => void;
  onReset: () => void;
  onRegenerate: () => void;
  onRenderModeChange: (renderMode: GridRenderMode) => void;
}

export function EditorTopbar({
  projectName,
  hasSourceImage,
  dirty,
  isPixelating,
  isSaving,
  status,
  lastSavedAt,
  renderMode,
  onProjectNameChange,
  onUpload,
  onOpenLibrary,
  onSave,
  onExport,
  onExportStats,
  onReset,
  onRegenerate,
  onRenderModeChange,
}: EditorTopbarProps) {
  const { messages } = useLocale();
  const copy = messages.editor.topbar;
  const [draftName, setDraftName] = useState(projectName);

  useEffect(() => {
    setDraftName(projectName);
  }, [projectName]);

  const commitProjectName = () => {
    onProjectNameChange(draftName);
  };

  return (
    <Panel className="flex flex-col gap-4 border-slate-200 bg-white p-4 shadow-soft xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={draftName}
            onChange={(event) => {
              setDraftName(event.target.value);
              onProjectNameChange(event.target.value);
            }}
            onBlur={commitProjectName}
            onCompositionEnd={(event) => {
              setDraftName(event.currentTarget.value);
              onProjectNameChange(event.currentTarget.value);
            }}
            className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-display text-lg text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300"
            placeholder={copy.placeholder}
          />
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-500">
            {dirty ? copy.unsavedChanges : copy.savedState}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {isPixelating ? copy.processing : isSaving ? copy.saving : status ?? copy.idleHint}
          {lastSavedAt ? ` ${copy.lastSave(formatDateTime(lastSavedAt))}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            aria-pressed={renderMode === "plain"}
            onClick={() => onRenderModeChange("plain")}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition",
              renderMode === "plain"
                ? "border-emerald-300 bg-white font-medium text-slate-900 shadow-sm"
                : "border-transparent text-slate-500 hover:bg-white hover:text-slate-800",
            )}
          >
            <Grid3x3 className="h-4 w-4" />
            {copy.plainPng}
          </button>
          <button
            type="button"
            aria-pressed={renderMode === "coded"}
            onClick={() => onRenderModeChange("coded")}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition",
              renderMode === "coded"
                ? "border-amber-300 bg-white font-medium text-slate-900 shadow-sm"
                : "border-transparent text-slate-500 hover:bg-white hover:text-slate-800",
            )}
          >
            <Tag className="h-4 w-4" />
            {copy.codedPng}
          </button>
        </div>
        <Button variant="light" onClick={onUpload} icon={<Upload className="h-4 w-4" />}>
          {hasSourceImage ? copy.replaceImage : copy.upload}
        </Button>
        <Button
          variant="light"
          onClick={onRegenerate}
          disabled={!hasSourceImage || isPixelating}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          {copy.regenerate}
        </Button>
        <Button
          variant="light"
          onClick={() => {
            commitProjectName();
            onOpenLibrary();
          }}
          icon={<FolderOpen className="h-4 w-4" />}
        >
          {copy.openSaved}
        </Button>
        <Button
          variant="light"
          onClick={() => {
            commitProjectName();
            onReset();
          }}
          icon={<RotateCcw className="h-4 w-4" />}
        >
          {copy.reset}
        </Button>
        <Button
          variant="light"
          onClick={() => {
            commitProjectName();
            onExport();
          }}
          icon={<Download className="h-4 w-4" />}
        >
          {copy.exportPng}
        </Button>
        <Button
          variant="light"
          onClick={() => {
            commitProjectName();
            onExportStats();
          }}
          icon={<LayoutList className="h-4 w-4" />}
        >
          {copy.exportStats}
        </Button>
        <Button
          onClick={() => {
            commitProjectName();
            onSave();
          }}
          icon={<Save className="h-4 w-4" />}
        >
          {copy.saveProject}
        </Button>
      </div>
    </Panel>
  );
}
