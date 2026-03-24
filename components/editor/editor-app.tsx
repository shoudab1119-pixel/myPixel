"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";

import { usePixelWorker } from "@/hooks/use-pixel-worker";
import { useLocale } from "@/components/providers/locale-provider";
import { CanvasControls } from "@/components/editor/canvas-controls";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { EditorTopbar } from "@/components/editor/editor-topbar";
import { PixelCanvas } from "@/components/editor/pixel-canvas";
import { ProjectLibraryDialog } from "@/components/editor/project-library-dialog";
import { zoomViewportAtPoint } from "@/lib/editor/render";
import { Panel } from "@/components/ui/panel";
import { DEFAULT_PROJECT_NAME } from "@/lib/constants";
import { createGridThumbnail, exportGridToBlob } from "@/lib/export/grid-export";
import { rasterizeAsset, rasterizeFile } from "@/lib/image/source-image";
import { getPalettePreset } from "@/lib/palette";
import {
  defaultEditorPreferences,
  loadEditorPreferences,
  saveEditorPreferences,
} from "@/lib/storage/editor-preferences";
import {
  createProjectRecord,
  getProject,
  saveProjectRecord,
} from "@/lib/storage/project-storage";
import { downloadBlob } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import type {
  GridSizeOption,
  PaletteColor,
  PalettePresetId,
  SourceImageAsset,
} from "@/types/editor";
import type { PixelWorkerRequest } from "@/types/worker";

function stripExtension(filename: string) {
  const base = filename.replace(/\.[^/.]+$/, "").trim();
  return base || DEFAULT_PROJECT_NAME;
}

export function EditorApp() {
  const { messages } = useLocale();
  const copy = messages.editor.app;
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastLoadedProjectRef = useRef<string | null>(null);
  const latestPixelateRequestRef = useRef<string | null>(null);
  const [fitSignal, setFitSignal] = useState(0);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { pixelate } = usePixelWorker();

  const {
    projectId,
    projectName,
    grid,
    sourceImage,
    targetSize,
    palettePresetId,
    palette,
    viewport,
    selectedColor,
    selectedTool,
    renderMode,
    dirty,
    lastSavedAt,
    canvasBounds,
    history,
    processing,
    setProjectName,
    setTargetSize,
    setPalettePresetId,
    setSelectedColor,
    setSelectedTool,
    setRenderMode,
    setViewport,
    initializeProject,
    loadSnapshot,
    createSnapshot,
    markSaved,
    resetToOriginal,
    undo,
    redo,
    setProcessing,
  } = useEditorStore(
    useShallow((state) => ({
      projectId: state.projectId,
      projectName: state.projectName,
      grid: state.grid,
      sourceImage: state.sourceImage,
      targetSize: state.targetSize,
      palettePresetId: state.palettePresetId,
      palette: state.palette,
      viewport: state.viewport,
      selectedColor: state.selectedColor,
      selectedTool: state.selectedTool,
      renderMode: state.renderMode,
      dirty: state.dirty,
      lastSavedAt: state.lastSavedAt,
      canvasBounds: state.canvasBounds,
      history: state.history,
      processing: state.processing,
      setProjectName: state.setProjectName,
      setTargetSize: state.setTargetSize,
      setPalettePresetId: state.setPalettePresetId,
      setSelectedColor: state.setSelectedColor,
      setSelectedTool: state.setSelectedTool,
      setRenderMode: state.setRenderMode,
      setViewport: state.setViewport,
      initializeProject: state.initializeProject,
      loadSnapshot: state.loadSnapshot,
      createSnapshot: state.createSnapshot,
      markSaved: state.markSaved,
      resetToOriginal: state.resetToOriginal,
      undo: state.undo,
      redo: state.redo,
      setProcessing: state.setProcessing,
    })),
  );

  useEffect(() => {
    const preferences = loadEditorPreferences();
    useEditorStore.getState().hydratePreferences(preferences);
  }, []);

  useEffect(() => {
    saveEditorPreferences({
      ...defaultEditorPreferences,
      lastProjectId: projectId,
      showGrid: viewport.showGrid,
      gridPresetId: targetSize.id,
      palettePresetId,
      renderMode,
    });
  }, [palettePresetId, projectId, renderMode, targetSize.id, viewport.showGrid]);

  const processRaster = useCallback(
    async (
      asset: SourceImageAsset,
      pixels: Uint8ClampedArray,
      nextTargetSize: GridSizeOption,
      options?: {
        projectId?: string | null;
        projectName?: string;
        palette?: PaletteColor[];
        palettePresetId?: PalettePresetId;
      },
    ) => {
      const nextPalettePreset = getPalettePreset(
        options?.palettePresetId ?? palettePresetId,
      );
      const nextPalette = options?.palette ?? nextPalettePreset.colors;
      const requestId = crypto.randomUUID();

      try {
        latestPixelateRequestRef.current = requestId;

        setProcessing({
          isPixelating: true,
          error: null,
          status: copy.generatingGrid(nextTargetSize.label),
        });

        const request: PixelWorkerRequest = {
          type: "pixelate",
          requestId,
          payload: {
            source: {
              width: asset.width,
              height: asset.height,
              data: new Uint8ClampedArray(pixels).buffer,
            },
            target: {
              width: nextTargetSize.width,
              height: nextTargetSize.height,
            },
            palette: nextPalette,
            backgroundHex: nextPalettePreset.backgroundHex,
          },
        };

        const response = await pixelate(request);
        if (latestPixelateRequestRef.current !== requestId) {
          return;
        }

        if (response.type === "error") {
          throw new Error(response.payload.message);
        }

        initializeProject({
          grid: response.payload.grid,
          originalGrid: response.payload.grid,
          palettePresetId: nextPalettePreset.id,
          sourceImage: asset,
          palette: nextPalette,
          targetSize: nextTargetSize,
          projectId: options?.projectId ?? null,
          projectName: options?.projectName ?? stripExtension(asset.name),
          dirty: true,
        });

        latestPixelateRequestRef.current = null;
        setFitSignal((value) => value + 1);
        setProcessing({
          isPixelating: false,
          status: copy.generatedGrid(
            response.payload.grid.width,
            response.payload.grid.height,
            response.payload.usedColors.length,
          ),
        });
      } catch (reason) {
        if (latestPixelateRequestRef.current !== requestId) {
          return;
        }

        if (latestPixelateRequestRef.current === requestId) {
          latestPixelateRequestRef.current = null;
        }

        setProcessing({
          isPixelating: false,
          error: reason instanceof Error ? reason.message : copy.unableGenerateGrid,
          status: null,
        });
      }
    },
    [copy, initializeProject, palettePresetId, pixelate, setProcessing],
  );

  const openProject = useCallback(
    async (id: string) => {
      try {
        setProcessing({
          isLoadingProject: true,
          error: null,
          status: copy.loadingProject,
        });

        const record = await getProject(id);
        if (!record) {
          throw new Error(copy.projectNotFound);
        }

        loadSnapshot(record.snapshot);
        lastLoadedProjectRef.current = id;
        setFitSignal((value) => value + 1);
        router.replace(`/editor?project=${id}`);
        setProcessing({
          isLoadingProject: false,
          status: copy.openedProject(record.name),
        });
      } catch (reason) {
        setProcessing({
          isLoadingProject: false,
          error: reason instanceof Error ? reason.message : copy.unableOpenProject,
          status: null,
        });
      }
    },
    [copy, loadSnapshot, router, setProcessing],
  );

  useEffect(() => {
    const projectParam = searchParams.get("project");

    if (!projectParam || lastLoadedProjectRef.current === projectParam) {
      return;
    }

    lastLoadedProjectRef.current = projectParam;
    void openProject(projectParam);
  }, [openProject, searchParams]);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    try {
      const raster = await rasterizeFile(file);
      await processRaster(raster.asset, raster.pixels, targetSize, {
        projectId: null,
        projectName: stripExtension(file.name),
        palettePresetId,
        palette,
      });
      router.replace("/editor");
      lastLoadedProjectRef.current = null;
    } catch (reason) {
      setProcessing({
        isPixelating: false,
        error: reason instanceof Error ? reason.message : copy.unableImportImage,
        status: null,
      });
    }
  };

  const handleRegenerate = useCallback(
    async (
      preset = targetSize,
      nextPalettePresetId: PalettePresetId = palettePresetId,
    ) => {
      if (!sourceImage) {
        setProcessing({
          error: copy.uploadBeforeRegenerate,
          status: null,
        });
        return;
      }

      const nextPalettePreset = getPalettePreset(nextPalettePresetId);
      const raster = await rasterizeAsset(sourceImage);
      await processRaster(raster.asset, raster.pixels, preset, {
        projectId,
        projectName,
        palettePresetId: nextPalettePreset.id,
        palette: nextPalettePreset.colors,
      });
    },
    [
      copy,
      palettePresetId,
      processRaster,
      projectId,
      projectName,
      setProcessing,
      sourceImage,
      targetSize,
    ],
  );

  const handleSave = useCallback(async () => {
    try {
      setProcessing({
        isSavingProject: true,
        error: null,
        status: copy.savingProject,
      });

      const snapshot = createSnapshot();
      if (!snapshot || !grid) {
        throw new Error(copy.generateBeforeSaving);
      }

      const existing = snapshot.projectId ? await getProject(snapshot.projectId) : null;
      const record = createProjectRecord(snapshot, createGridThumbnail(grid), existing);
      await saveProjectRecord(record);
      markSaved(record.id, record.name);
      router.replace(`/editor?project=${record.id}`);
      lastLoadedProjectRef.current = record.id;
      setProcessing({
        isSavingProject: false,
        status: copy.savedProject(record.name),
      });
    } catch (reason) {
      setProcessing({
        isSavingProject: false,
        error: reason instanceof Error ? reason.message : copy.unableSaveProject,
        status: null,
      });
    }
  }, [copy, createSnapshot, grid, markSaved, router, setProcessing]);

  const handleExport = useCallback(async () => {
    if (!grid) {
      setProcessing({
        error: copy.generateBeforeExport,
        status: null,
      });
      return;
    }

    try {
      const blob = await exportGridToBlob(grid, {
        palette,
        renderMode,
      });
      const fileSuffix = renderMode === "coded" ? "-codes" : "";
      downloadBlob(
        blob,
        `${(projectName || DEFAULT_PROJECT_NAME)
          .replace(/\s+/g, "-")
          .toLowerCase()}${fileSuffix}.png`,
      );
      setProcessing({
        status: copy.pngExported(renderMode),
      });
    } catch (reason) {
      setProcessing({
        error: reason instanceof Error ? reason.message : copy.unableExportPng,
        status: null,
      });
    }
  }, [copy, grid, palette, projectName, renderMode, setProcessing]);

  const handleFitView = useCallback(() => {
    setFitSignal((value) => value + 1);
  }, []);

  const handleRenderModeChange = useCallback(
    (nextRenderMode: "plain" | "coded") => {
      setRenderMode(nextRenderMode);
      setProcessing({
        status:
          nextRenderMode === "coded"
            ? copy.exportModeCodes
            : copy.exportModePlain,
      });
    },
    [copy.exportModeCodes, copy.exportModePlain, setProcessing, setRenderMode],
  );

  const handleZoomChange = useCallback(
    (nextZoom: number) => {
      if (!grid || !canvasBounds.width || !canvasBounds.height) {
        setViewport({ zoom: nextZoom });
        return;
      }

      setViewport(
        zoomViewportAtPoint(
          viewport,
          nextZoom,
          canvasBounds.width / 2,
          canvasBounds.height / 2,
        ),
      );
    },
    [canvasBounds.height, canvasBounds.width, grid, setViewport, viewport],
  );

  const summary = useMemo(() => {
    if (!grid) {
      return copy.noGridLoaded;
    }

    return copy.summary(grid.width, grid.height, new Set(grid.cells).size);
  }, [copy, grid]);

  const toolLabel = messages.editor.toolbar[selectedTool];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="mx-auto flex min-h-[calc(100vh-81px)] max-w-[1800px] flex-col gap-4 px-4 py-4 xl:px-6">
        <EditorTopbar
          projectName={projectName}
          dirty={dirty}
          isPixelating={processing.isPixelating || processing.isLoadingProject}
          isSaving={processing.isSavingProject}
          status={processing.status}
          lastSavedAt={lastSavedAt}
          renderMode={renderMode}
          onProjectNameChange={setProjectName}
          onUpload={() => fileInputRef.current?.click()}
          onOpenLibrary={() => setLibraryOpen(true)}
          onSave={() => void handleSave()}
          onExport={() => void handleExport()}
          onReset={resetToOriginal}
          onRenderModeChange={handleRenderModeChange}
        />

        {processing.error ? (
          <Panel className="border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {processing.error}
          </Panel>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[96px_minmax(0,1fr)_320px] xl:items-start">
          <EditorToolbar
            selectedTool={selectedTool}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            onSelectTool={setSelectedTool}
            onUndo={undo}
            onRedo={redo}
          />

          <div className="flex h-[min(72vh,900px)] min-h-[560px] flex-col gap-4">
            <PixelCanvas
              fitSignal={fitSignal}
              isPixelating={processing.isPixelating}
              onUploadRequest={() => fileInputRef.current?.click()}
            />
            <CanvasControls
              zoom={viewport.zoom}
              onZoomChange={handleZoomChange}
              onFit={handleFitView}
            />
            <Panel className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-mist-50/58">
              <p>{summary}</p>
              <div className="flex items-center gap-3">
                <span>
                  {copy.selectedColor}: {selectedColor}
                </span>
                <span>
                  {copy.tool}: {toolLabel}
                </span>
              </div>
            </Panel>
          </div>

          <div className="pr-1">
            <EditorSidebar
              grid={grid}
              sourceImage={sourceImage}
              targetSize={targetSize}
              palettePresetId={palettePresetId}
              selectedColor={selectedColor}
              palette={palette}
              showGrid={viewport.showGrid}
              isPixelating={processing.isPixelating}
              onUpload={() => fileInputRef.current?.click()}
              onRegenerate={() => void handleRegenerate()}
              onSelectPreset={(preset) => {
                setTargetSize(preset);
                if (sourceImage) {
                  void handleRegenerate(preset);
                }
              }}
              onSelectPalettePreset={(nextPalettePresetId) => {
                setPalettePresetId(nextPalettePresetId);
                if (sourceImage) {
                  void handleRegenerate(targetSize, nextPalettePresetId);
                }
              }}
              onSelectColor={setSelectedColor}
              onToggleGrid={() => setViewport({ showGrid: !viewport.showGrid })}
            />
          </div>
        </div>
      </div>

      <ProjectLibraryDialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onOpenProject={(id) => {
          void openProject(id);
        }}
      />
    </>
  );
}
