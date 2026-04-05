"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { usePixelWorker } from "@/hooks/use-pixel-worker";
import { useLocale } from "@/components/providers/locale-provider";
import { CanvasControls } from "@/components/editor/canvas-controls";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { EditorTopbar } from "@/components/editor/editor-topbar";
import { PixelCanvas } from "@/components/editor/pixel-canvas";
import { ProjectLibraryDialog } from "@/components/editor/project-library-dialog";
import {
  getGridColorUsage,
  removeNoiseFromGrid,
  replaceColorKeyWithNeighborColors,
} from "@/lib/editor/grid-colors";
import { zoomViewportAtPoint } from "@/lib/editor/render";
import { Panel } from "@/components/ui/panel";
import { DEFAULT_PROJECT_NAME } from "@/lib/constants";
import {
  createGridThumbnail,
  exportGridStatsToBlob,
  exportGridToBlob,
} from "@/lib/export/grid-export";
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
import { createSafeId, downloadBlob } from "@/lib/utils";
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

function resolveProjectNameForSourceChange(
  currentProjectName: string,
  currentSourceImage: SourceImageAsset | null,
  nextFilename: string,
) {
  const nextBaseName = stripExtension(nextFilename);
  const trimmedCurrentName = currentProjectName.trim();

  if (!trimmedCurrentName || trimmedCurrentName === DEFAULT_PROJECT_NAME) {
    return nextBaseName;
  }

  if (
    currentSourceImage &&
    trimmedCurrentName === stripExtension(currentSourceImage.name)
  ) {
    return nextBaseName;
  }

  return trimmedCurrentName;
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
  const [editorView, setEditorView] = useState<"generate" | "edit">("generate");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { pixelate } = usePixelWorker();

  const {
    projectId,
    projectName,
    grid,
    sourceImage,
    targetSize,
    palettePresetId,
    palette,
    excludedColorKeys,
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
      excludedColorKeys: state.excludedColorKeys,
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
    setSelectedTool("hand");
  }, [setSelectedTool]);

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
        excludedColorKeys?: string[];
      },
    ) => {
      const nextPalettePreset = getPalettePreset(
        options?.palettePresetId ?? palettePresetId,
      );
      const nextPalette = options?.palette ?? nextPalettePreset.colors;
      const requestId = createSafeId();

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
            excludedColorKeys: options?.excludedColorKeys ?? excludedColorKeys,
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
          excludedColorKeys: options?.excludedColorKeys ?? excludedColorKeys,
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
    [
      copy,
      excludedColorKeys,
      initializeProject,
      palettePresetId,
      pixelate,
      setProcessing,
    ],
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
        setEditorView("generate");
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

  const openFilePicker = useCallback(() => {
    const input = fileInputRef.current;

    if (!input) {
      return;
    }

    input.value = "";
    input.click();
  }, []);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    try {
      setProcessing({
        isPixelating: true,
        error: null,
        status: copy.reloadingSource,
      });

      const raster = await rasterizeFile(file);
      setEditorView("generate");
      await processRaster(raster.asset, raster.pixels, targetSize, {
        projectId: sourceImage ? projectId : null,
        projectName: resolveProjectNameForSourceChange(
          projectName,
          sourceImage,
          file.name,
        ),
        palettePresetId,
        palette,
        excludedColorKeys,
      });

      if (projectId) {
        router.replace(`/editor?project=${projectId}`);
        lastLoadedProjectRef.current = projectId;
      } else {
        router.replace("/editor");
        lastLoadedProjectRef.current = null;
      }
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
      nextExcludedColorKeys: string[] = excludedColorKeys,
    ) => {
      if (!sourceImage) {
        setProcessing({
          error: copy.uploadBeforeRegenerate,
          status: null,
        });
        return;
      }

      try {
        setProcessing({
          isPixelating: true,
          error: null,
          status: copy.reloadingSource,
        });

        const nextPalettePreset = getPalettePreset(nextPalettePresetId);
        const raster = await rasterizeAsset(sourceImage);
        await processRaster(raster.asset, raster.pixels, preset, {
          projectId,
          projectName,
          palettePresetId: nextPalettePreset.id,
          palette: nextPalettePreset.colors,
          excludedColorKeys: nextExcludedColorKeys,
        });
      } catch (reason) {
        setProcessing({
          isPixelating: false,
          error: reason instanceof Error ? reason.message : copy.unableGenerateGrid,
          status: null,
        });
      }
    },
    [
      copy,
      excludedColorKeys,
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

  const handleExportStats = useCallback(async () => {
    if (!grid) {
      setProcessing({
        error: copy.generateBeforeExport,
        status: null,
      });
      return;
    }

    try {
      const blob = await exportGridStatsToBlob(grid, palette);
      downloadBlob(
        blob,
        `${(projectName || DEFAULT_PROJECT_NAME)
          .replace(/\s+/g, "-")
          .toLowerCase()}-stats.png`,
      );
      setProcessing({
        status: copy.statsExported,
      });
    } catch (reason) {
      setProcessing({
        error: reason instanceof Error ? reason.message : copy.unableExportStats,
        status: null,
      });
    }
  }, [copy, grid, palette, projectName, setProcessing]);

  const handleRemoveNoise = useCallback(() => {
    if (!grid) {
      return;
    }

    const result = removeNoiseFromGrid(grid, palette);
    if (result.changedCount === 0) {
      setProcessing({
        status: copy.noiseAlreadyClean,
        error: null,
      });
      return;
    }

    useEditorStore.getState().applyCellsWithHistory(result.grid.cells);
    setProcessing({
      status: copy.noiseRemoved(result.changedCount),
      error: null,
    });
  }, [copy, grid, palette, setProcessing]);

  const handleDeleteColorKey = useCallback(
    (colorKey: string) => {
      if (!grid) {
        return;
      }

      const result = replaceColorKeyWithNeighborColors(grid, palette, colorKey);
      if (!result) {
        setProcessing({
          error: copy.cannotDeleteLastColor,
          status: null,
        });
        return;
      }

      if (result.changedCount === 0) {
        setProcessing({
          error: null,
          status: copy.colorAlreadyGone(colorKey),
        });
        return;
      }

      useEditorStore.getState().applyCellsWithHistory(result.grid.cells);
      setProcessing({
        error: null,
        status: copy.deletedColor(colorKey, result.changedCount),
      });
    },
    [copy, grid, palette, setProcessing],
  );

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

    return copy.summary(grid.width, grid.height, getGridColorUsage(grid, palette).size);
  }, [copy, grid, palette]);

  const usedPaletteEntries = useMemo(() => {
    if (!grid) {
      return [];
    }

    return [...getGridColorUsage(grid, palette).values()]
      .map((entry) => ({
        key: entry.color.code ?? entry.color.name,
        hex: entry.color.hex,
        name: entry.color.name,
        count: entry.count,
      }))
      .sort((left, right) => {
        if (left.count !== right.count) {
          return left.count - right.count;
        }

        return left.key.localeCompare(right.key);
      });
  }, [grid, palette]);

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

      <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-none flex-col gap-4 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-3 py-3 xl:h-[calc(100vh-81px)] xl:overflow-hidden xl:px-5 xl:py-4">
        <EditorTopbar
          editorView={editorView}
          projectName={projectName}
          hasSourceImage={Boolean(sourceImage)}
          dirty={dirty}
          isPixelating={processing.isPixelating || processing.isLoadingProject}
          isSaving={processing.isSavingProject}
          status={processing.status}
          lastSavedAt={lastSavedAt}
          renderMode={renderMode}
          onProjectNameChange={setProjectName}
          onUpload={openFilePicker}
          onOpenLibrary={() => setLibraryOpen(true)}
          onSave={() => void handleSave()}
          onExport={() => void handleExport()}
          onExportStats={() => void handleExportStats()}
          onReset={resetToOriginal}
          onRegenerate={() => void handleRegenerate()}
          onEditorViewChange={setEditorView}
          onRenderModeChange={handleRenderModeChange}
        />

        {processing.error ? (
          <Panel className="border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {processing.error}
          </Panel>
        ) : null}

        <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)]">
          <div className="flex min-h-[640px] flex-col gap-4 xl:relative xl:min-h-0 xl:h-full">
            <div className="xl:hidden">
              <EditorToolbar
                selectedTool={selectedTool}
                canUndo={history.past.length > 0}
                canRedo={history.future.length > 0}
                editingEnabled={editorView === "edit"}
                onSelectTool={setSelectedTool}
                onUndo={undo}
                onRedo={redo}
              />
            </div>

            <div className="hidden xl:absolute xl:left-5 xl:top-5 xl:z-10 xl:block xl:w-[88px]">
              <EditorToolbar
                selectedTool={selectedTool}
                canUndo={history.past.length > 0}
                canRedo={history.future.length > 0}
                editingEnabled={editorView === "edit"}
                onSelectTool={setSelectedTool}
                onUndo={undo}
                onRedo={redo}
              />
            </div>

            <div className="h-[min(76vh,940px)] min-h-[560px] xl:min-h-0 xl:flex-1 xl:h-full">
              <PixelCanvas
                fitSignal={fitSignal}
                isPixelating={processing.isPixelating}
                editingEnabled={editorView === "edit"}
                onUploadRequest={openFilePicker}
              />
            </div>

            <div className="xl:hidden">
              <CanvasControls
                zoom={viewport.zoom}
                onZoomChange={handleZoomChange}
                onFit={handleFitView}
              />
            </div>

            <div className="xl:hidden">
              <Panel className="flex flex-wrap items-center justify-between gap-3 border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-soft">
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

            <div
              className="hidden xl:absolute xl:top-5 xl:z-10 xl:block xl:max-w-[280px]"
              style={{ right: sidebarOpen ? 360 : 20 }}
            >
              <Panel className="border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-soft backdrop-blur">
                <p className="font-medium text-slate-900">{summary}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                  <span>
                    {copy.selectedColor}: {selectedColor}
                  </span>
                  <span>
                    {copy.tool}: {toolLabel}
                  </span>
                </div>
              </Panel>
            </div>

            <div className="hidden xl:absolute xl:bottom-5 xl:left-1/2 xl:z-10 xl:block xl:w-[min(440px,calc(100%-160px))] xl:-translate-x-1/2">
              <CanvasControls
                zoom={viewport.zoom}
                onZoomChange={handleZoomChange}
                onFit={handleFitView}
              />
            </div>

            <div className="absolute right-3 top-3 z-20 flex items-start gap-3 xl:right-5 xl:top-5">
              {sidebarOpen ? (
                <div className="h-[calc(100vh-160px)] w-[min(320px,88vw)] overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/88 shadow-[0_28px_70px_rgba(15,23,42,0.14)] backdrop-blur">
                  <EditorSidebar
                    editorView={editorView}
                    grid={grid}
                    sourceImage={sourceImage}
                    targetSize={targetSize}
                    palettePresetId={palettePresetId}
                    selectedColor={selectedColor}
                    palette={palette}
                    usedPaletteEntries={usedPaletteEntries}
                    showGrid={viewport.showGrid}
                    isPixelating={processing.isPixelating || processing.isLoadingProject}
                    onUpload={openFilePicker}
                    onRegenerate={() => void handleRegenerate()}
                    onRemoveNoise={handleRemoveNoise}
                    onSelectPreset={(preset) => {
                      setTargetSize(preset);
                      if (sourceImage) {
                        void handleRegenerate(preset);
                      }
                    }}
                    onSelectPalettePreset={(nextPalettePresetId) => {
                      setPalettePresetId(nextPalettePresetId);
                      if (sourceImage) {
                        void handleRegenerate(
                          targetSize,
                          nextPalettePresetId,
                          excludedColorKeys,
                        );
                      }
                    }}
                    onSelectColor={setSelectedColor}
                    onDeleteColorKey={handleDeleteColorKey}
                    onToggleGrid={() => setViewport({ showGrid: !viewport.showGrid })}
                  />
                </div>
              ) : null}

              <button
                type="button"
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                onClick={() => setSidebarOpen((value) => !value)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/92 text-slate-600 shadow-soft backdrop-blur transition hover:border-slate-300 hover:text-slate-900"
              >
                {sidebarOpen ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </button>
            </div>
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
