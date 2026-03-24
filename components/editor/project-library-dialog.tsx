"use client";

import Link from "next/link";
import { FolderOpen, Trash2, X } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { LoadingRing } from "@/components/ui/loading-ring";
import { Panel } from "@/components/ui/panel";
import { useProjectsLibrary } from "@/hooks/use-projects-library";
import { formatDateTime } from "@/lib/utils";

interface ProjectLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onOpenProject: (projectId: string) => void;
}

export function ProjectLibraryDialog({
  open,
  onClose,
  onOpenProject,
}: ProjectLibraryDialogProps) {
  const { messages } = useLocale();
  const copy = messages.projects.dialog;
  const { projects, loading, error, remove } = useProjectsLibrary(copy.loadError);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-md">
      <Panel className="max-h-[88vh] w-full max-w-5xl overflow-hidden">
        <div className="flex items-start justify-between border-b border-white/8 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-mist-50/40">
              {copy.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-mist-50">
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-mist-50/55 transition hover:bg-white/5 hover:text-mist-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(88vh-92px)] overflow-auto p-6">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <LoadingRing />
            </div>
          ) : error ? (
            <Panel className="p-5 text-sm text-rose-200">{error}</Panel>
          ) : projects.length === 0 ? (
            <Panel className="p-6 text-sm leading-6 text-mist-50/66">
              {copy.emptyPrefix}{" "}
              <Link href="/projects" className="text-mint-300">
                {copy.projectPage}
              </Link>
              .
            </Panel>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="grid gap-4 rounded-[28px] border border-white/8 bg-white/[0.03] p-4 md:grid-cols-[180px_1fr_auto]"
                >
                  <img
                    src={project.thumbnailDataUrl}
                    alt={project.name}
                    className="aspect-[4/3] w-full rounded-[22px] border border-white/8 object-cover"
                  />
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-mist-50">
                      {project.name}
                    </h3>
                    <p className="mt-2 text-sm text-mist-50/62">
                      {copy.cardMeta(project.width, project.height, project.colorCount)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-mist-50/35">
                      {copy.updated(formatDateTime(project.updatedAt))}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => {
                        onOpenProject(project.id);
                        onClose();
                      }}
                      icon={<FolderOpen className="h-4 w-4" />}
                    >
                      {copy.open}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => void remove(project.id)}
                      icon={<Trash2 className="h-4 w-4" />}
                    >
                      {copy.delete}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
