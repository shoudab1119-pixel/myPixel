"use client";

import {
  Eraser,
  Hand,
  PaintBucket,
  Paintbrush2,
  Pipette,
  Redo2,
  Undo2,
} from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import type { ToolType } from "@/types/editor";

interface EditorToolbarProps {
  selectedTool: ToolType;
  canUndo: boolean;
  canRedo: boolean;
  editingEnabled: boolean;
  onSelectTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function EditorToolbar({
  selectedTool,
  canUndo,
  canRedo,
  editingEnabled,
  onSelectTool,
  onUndo,
  onRedo,
}: EditorToolbarProps) {
  const { messages } = useLocale();
  const copy = messages.editor.toolbar;
  const tools: Array<{
    id: ToolType;
    label: string;
    shortcut: string;
    icon: typeof Paintbrush2;
  }> = [
    { id: "brush", label: copy.brush, shortcut: "B", icon: Paintbrush2 },
    { id: "eraser", label: copy.eraser, shortcut: "E", icon: Eraser },
    { id: "eyedropper", label: copy.eyedropper, shortcut: "I", icon: Pipette },
    { id: "bucket", label: copy.bucket, shortcut: "G", icon: PaintBucket },
    { id: "hand", label: copy.hand, shortcut: "H", icon: Hand },
  ];

  return (
    <Panel className="flex h-full flex-col gap-3 border-slate-200/80 bg-white/92 p-3 shadow-soft backdrop-blur">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => onSelectTool(tool.id)}
          disabled={!editingEnabled && tool.id !== "hand"}
          className={cn(
            "group flex flex-col items-center gap-2 rounded-[20px] border px-2.5 py-3.5 text-center transition disabled:cursor-not-allowed",
            selectedTool === tool.id
              ? "border-blue-300 bg-blue-50 text-slate-900"
              : "border-slate-200 bg-slate-50/90 text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-700",
            !editingEnabled && tool.id !== "hand" ? "opacity-45" : "",
          )}
        >
          <tool.icon className="h-5 w-5" />
          <div>
            <p className="text-xs font-medium">{tool.label}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              {tool.shortcut}
            </p>
          </div>
        </button>
      ))}
      <div className="mt-auto grid gap-2">
        <Button
          variant="light"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo || !editingEnabled}
          icon={<Undo2 className="h-4 w-4" />}
        >
          {copy.undo}
        </Button>
        <Button
          variant="light"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo || !editingEnabled}
          icon={<Redo2 className="h-4 w-4" />}
        >
          {copy.redo}
        </Button>
      </div>
    </Panel>
  );
}
