"use client";

import { useEffect, useState } from "react";
import { Grid3x3, Tag } from "lucide-react";
import { Download, FolderOpen, RotateCcw, Save, Upload } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import type { GridRenderMode } from "@/types/editor";

interface EditorTopbarProps {
  projectName: string;
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
  onReset: () => void;
  onRenderModeChange: (renderMode: GridRenderMode) => void;
}

export function EditorTopbar({
  projectName,
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
  onReset,
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
    <Panel className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between">
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
            className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/15 px-4 font-display text-lg text-mist-50 outline-none transition placeholder:text-mist-50/30 focus:border-mint-300/40"
            placeholder={copy.placeholder}
          />
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.18em] text-mist-50/50">
            {dirty ? copy.unsavedChanges : copy.savedState}
          </div>
        </div>
        <p className="mt-3 text-sm text-mist-50/55">
          {isPixelating ? copy.processing : isSaving ? copy.saving : status ?? copy.idleHint}
          {lastSavedAt ? ` ${copy.lastSave(formatDateTime(lastSavedAt))}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            aria-pressed={renderMode === "plain"}
            onClick={() => onRenderModeChange("plain")}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm transition",
              renderMode === "plain"
                ? "bg-mint-300/14 text-mist-50"
                : "text-mist-50/62 hover:text-mist-50",
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
              "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm transition",
              renderMode === "coded"
                ? "bg-ember-500/14 text-mist-50"
                : "text-mist-50/62 hover:text-mist-50",
            )}
          >
            <Tag className="h-4 w-4" />
            {copy.codedPng}
          </button>
        </div>
        <Button variant="secondary" onClick={onUpload} icon={<Upload className="h-4 w-4" />}>
          {copy.upload}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            commitProjectName();
            onOpenLibrary();
          }}
          icon={<FolderOpen className="h-4 w-4" />}
        >
          {copy.openSaved}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            commitProjectName();
            onReset();
          }}
          icon={<RotateCcw className="h-4 w-4" />}
        >
          {copy.reset}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            commitProjectName();
            onExport();
          }}
          icon={<Download className="h-4 w-4" />}
        >
          {copy.exportPng}
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
