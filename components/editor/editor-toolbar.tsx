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
  onSelectTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function EditorToolbar({
  selectedTool,
  canUndo,
  canRedo,
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
    <Panel className="flex h-full flex-col gap-3 p-3">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => onSelectTool(tool.id)}
          className={cn(
            "group flex flex-col items-center gap-2 rounded-[22px] border px-3 py-4 text-center transition",
            selectedTool === tool.id
              ? "border-mint-300/40 bg-mint-300/14 text-mist-50"
              : "border-transparent bg-white/[0.03] text-mist-50/62 hover:border-white/10 hover:bg-white/[0.06] hover:text-mist-50",
          )}
        >
          <tool.icon className="h-5 w-5" />
          <div>
            <p className="text-xs font-medium">{tool.label}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/35">
              {tool.shortcut}
            </p>
          </div>
        </button>
      ))}
      <div className="mt-auto grid gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          icon={<Undo2 className="h-4 w-4" />}
        >
          {copy.undo}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          icon={<Redo2 className="h-4 w-4" />}
        >
          {copy.redo}
        </Button>
      </div>
    </Panel>
  );
}
