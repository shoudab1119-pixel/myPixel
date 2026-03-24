"use client";

import { useCallback, useEffect, useState } from "react";

import { deleteProject, listProjects } from "@/lib/storage/project-storage";
import type { ProjectListItem } from "@/types/project";

export function useProjectsLibrary(loadErrorMessage = "Unable to load saved projects.") {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setProjects(await listProjects());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : loadErrorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadErrorMessage]);

  const remove = async (projectId: string) => {
    await deleteProject(projectId);
    await refresh();
  };

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    projects,
    loading,
    error,
    refresh,
    remove,
  };
}
