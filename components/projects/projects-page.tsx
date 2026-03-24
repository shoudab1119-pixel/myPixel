"use client";

import Link from "next/link";
import { FolderOpen, Trash2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingRing } from "@/components/ui/loading-ring";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { useProjectsLibrary } from "@/hooks/use-projects-library";
import { formatDateTime } from "@/lib/utils";

export function ProjectsPage() {
  const { messages } = useLocale();
  const copy = messages.projects.page;
  const { projects, loading, error, remove, refresh } = useProjectsLibrary(copy.loadError);

  return (
    <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember-400">
            {copy.eyebrow}
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-mist-50">
            {copy.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-mist-50/68">
            {copy.description}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => void refresh()}>
            {copy.refresh}
          </Button>
          <Link
            href="/editor"
            className="inline-flex h-11 items-center rounded-2xl bg-mist-50 px-4 text-sm font-medium text-ink-950 transition hover:bg-white"
          >
            {copy.newProject}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <LoadingRing />
        </div>
      ) : error ? (
        <Panel className="p-6 text-sm text-rose-200">{error}</Panel>
      ) : projects.length === 0 ? (
        <EmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
          action={
            <Link
              href="/editor"
              className="inline-flex h-11 items-center rounded-2xl bg-mist-50 px-4 text-sm font-medium text-ink-950 transition hover:bg-white"
            >
              {copy.openEditor}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Panel key={project.id} className="overflow-hidden">
              <div className="relative aspect-[4/3] border-b border-white/8 bg-ink-900/80">
                <img
                  src={project.thumbnailDataUrl}
                  alt={project.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-mist-50">
                    {project.name}
                  </h2>
                  <p className="mt-2 text-sm text-mist-50/58">
                    {copy.cardMeta(project.width, project.height, project.colorCount)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-mist-50/35">
                    {copy.updated(formatDateTime(project.updatedAt))}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/editor?project=${project.id}`}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-mist-50 px-4 text-sm font-medium text-ink-950 transition hover:bg-white"
                  >
                    <FolderOpen className="h-4 w-4" />
                    {copy.continueEditing}
                  </Link>
                  <Button
                    variant="danger"
                    className="h-10 w-10 px-0"
                    onClick={() => void remove(project.id)}
                    aria-label={`${copy.delete} ${project.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
