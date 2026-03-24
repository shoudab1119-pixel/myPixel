import type { Locale } from "@/types/i18n";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "mypixel.locale";

const dictionaries = {
  en: {
    header: {
      nav: {
        home: "Home",
        editor: "Editor",
        palette: "Palette",
        projects: "Projects",
      },
      cta: "Start Creating",
      brandTagline: "Pixel art workflow",
      language: {
        label: "Language",
        en: "EN",
        zh: "中文",
      },
    },
    footer: {
      description:
        "MyPixel Studio. Convert images into editable pixel and perler patterns.",
      editor: "Editor",
      palette: "Palette",
      projects: "Projects",
    },
    home: {
      hero: {
        badge: "Image to pixel art, perler-ready",
        title: "Build polished pixel patterns from any image, then finish them by hand.",
        description:
          "Upload a photo, convert it into a real color-quantized pixel grid, edit every cell in a dedicated canvas, export PNG, and reopen projects locally whenever you need them.",
        primaryAction: "Start Creating",
        secondaryAction: "Open Saved Projects",
        metrics: [
          { label: "Worker-based processing", value: "1 click" },
          { label: "Grid presets", value: "4 sizes" },
          { label: "Editing flow", value: "Canvas" },
        ],
        previewEyebrow: "Source to grid",
        previewTitle: "Conversion preview",
        previewBadge: "Smart palette match",
        previewConnector: "to",
        previewNotes: [
          "Upload an image and choose a target grid.",
          "Worker quantization maps each cell to the nearest palette color.",
          "Edit, save, and export without leaving the browser.",
        ],
      },
      features: {
        eyebrow: "Product value",
        title: "Built for image-to-pixel workflows that still need real editing control.",
        description:
          "The MVP covers the full loop: upload, convert, edit, save, reopen, and export. The codebase is split by rendering, tools, worker processing, and persistence so it can grow cleanly.",
        items: [
          {
            title: "Upload and convert",
            description:
              "Turn photos, illustrations, or references into true pixel grids.",
          },
          {
            title: "Custom grid sizing",
            description:
              "Switch between 32, 48, 64, or 96 square grids with one regenerate pass.",
          },
          {
            title: "Smart color match",
            description:
              "Every cell is quantized to a structured palette using nearest-color matching.",
          },
          {
            title: "Manual editing",
            description:
              "Refine details with brush, eraser, eyedropper, and fill tools inside canvas.",
          },
          {
            title: "Export high-res PNG",
            description:
              "Render crisp pixel output for previews, printouts, or perler references.",
          },
          {
            title: "Save locally",
            description:
              "Store projects in IndexedDB with thumbnails and reopen them from the project library.",
          },
        ],
      },
      workflow: {
        eyebrow: "Workflow",
        title: "A clean MVP, organized for the next release.",
        description:
          "The editor state, tool operations, renderer, worker pipeline, and storage layer are separated so new features like palette import, per-bead counts, or collaborative sync can be added without rewriting the core.",
        steps: [
          {
            id: "01",
            title: "Import your source",
            description:
              "Drop in a JPG, PNG, or WEBP image. The app reads the original dimensions and prepares it for worker processing.",
          },
          {
            id: "02",
            title: "Generate the pixel grid",
            description:
              "The worker downscales the source, averages pixel regions, and maps every cell to the nearest palette color.",
          },
          {
            id: "03",
            title: "Finish by hand",
            description:
              "Use the canvas editor to clean silhouettes, replace colors, bucket-fill areas, and refine the final pattern.",
          },
          {
            id: "04",
            title: "Save or export",
            description:
              "Store the project locally with a thumbnail for later sessions, or export a sharp PNG for sharing and production.",
          },
        ],
      },
    },
    editor: {
      toolbar: {
        brush: "Brush",
        eraser: "Eraser",
        eyedropper: "Eyedropper",
        bucket: "Bucket",
        hand: "Hand",
        undo: "Undo",
        redo: "Redo",
      },
      topbar: {
        placeholder: "Project name",
        unsavedChanges: "Unsaved changes",
        savedState: "Saved state",
        processing: "Processing image in worker...",
        saving: "Saving project locally...",
        idleHint: "Drag to edit. Hold Space or use right/middle mouse to pan.",
        lastSave: (value: string) => `Last save: ${value}.`,
        plainPng: "Plain PNG",
        codedPng: "Code PNG",
        upload: "Upload",
        replaceImage: "Replace Image",
        regenerate: "Regenerate",
        openSaved: "Open Saved",
        reset: "Reset",
        exportPng: "Export PNG",
        exportStats: "Export Stats",
        saveProject: "Save Project",
      },
      sidebar: {
        generateTab: "Generate",
        editTab: "Edit Pattern",
        sourceEyebrow: "Source",
        sourceTitle: "Image setup",
        original: (width: number, height: number) => `Original: ${width} x ${height}`,
        currentGrid: (width: number, height: number) =>
          `Current grid: ${width} x ${height}`,
        noImage: "No image loaded yet. Upload one to generate a grid.",
        uploadImage: "Upload image",
        replaceImage: "Replace image",
        regenerate: "Regenerate",
        removeNoise: "Remove noise",
        gridEyebrow: "Grid",
        gridTitle: "Target size",
        gridToggle: (showGrid: boolean) => `Grid ${showGrid ? "on" : "off"}`,
        presetSuffix: "pixel grid",
        paletteEyebrow: "Palette",
        paletteTitle: "Color control",
        paletteReady: "Pick an active palette edition, then choose a working color quickly.",
        paletteInactive:
          "Generate or restore a grid first, then the palette controls become available.",
        palettePresetBase: "221 base",
        palettePresetFull: "291 full",
        palettePresetMeta: (count: number, label: string) =>
          `${label} · ${count} colors`,
        currentColor: "Current color",
        noColorSelected: "No color selected yet.",
        quickSelect: "Quick select",
        openPalettePage: "Open full palette page",
        editEyebrow: "Editing",
        editTitle: "Pattern controls",
        statsEyebrow: "Usage",
        statsTitle: "Color usage",
        statsOrder: "low to high",
        statsUsage: (count: number) => `${count} cells`,
        statsEmpty: "No active colors available yet.",
        deleteColor: "Delete",
      },
      controls: {
        zoomLabel: "Zoom",
        fit: "Fit",
        wheelHint: "Wheel inside canvas pans the artwork. Use the slider for zoom.",
      },
      canvas: {
        hint: "Wheel: pan · Space / middle mouse: pan",
        rebuilding: "Rebuilding pixel grid...",
        emptyTitle: "Start from an image",
        emptyDescription:
          "Upload an image to generate a real pixel grid, then refine it directly on the canvas with brush, eraser, eyedropper, and bucket tools.",
        uploadImage: "Upload image",
        externalBackground: "External background",
        generateHint: "Generate mode · pan and inspect",
      },
      app: {
        generatingGrid: (label: string) => `Generating ${label} pixel grid...`,
        generatedGrid: (width: number, height: number, colors: number) =>
          `Generated ${width} x ${height} grid with ${colors} palette colors.`,
        loadingProject: "Loading saved project...",
        projectNotFound: "Saved project not found.",
        openedProject: (name: string) => `Opened ${name}.`,
        uploadBeforeRegenerate: "Upload an image before regenerating.",
        reloadingSource: "Reloading the source image and regenerating the grid...",
        savingProject: "Saving project locally...",
        generateBeforeSaving: "Generate a pixel grid before saving.",
        savedProject: (name: string) => `Saved ${name} locally.`,
        generateBeforeExport: "Generate a grid before exporting PNG.",
        pngExported: (renderMode: "plain" | "coded") =>
          renderMode === "coded"
            ? "PNG exported with palette codes."
            : "PNG exported.",
        statsExported: "Stats PNG exported.",
        noiseRemoved: (count: number) => `Removed noise from ${count} cells.`,
        noiseAlreadyClean: "No obvious noise found in the current pattern.",
        deletedColor: (colorKey: string, count: number) =>
          `Removed ${colorKey} from ${count} cells using surrounding colors.`,
        colorAlreadyGone: (colorKey: string) => `${colorKey} is no longer used in the grid.`,
        exportModePlain: "Export mode switched to plain PNG.",
        exportModeCodes: "Export mode switched to code PNG.",
        unableGenerateGrid: "Unable to generate the pixel grid.",
        unableImportImage: "Unable to import the image.",
        unableOpenProject: "Unable to open the project.",
        unableSaveProject: "Unable to save the project.",
        unableExportPng: "Unable to export the PNG.",
        unableExportStats: "Unable to export the stats PNG.",
        cannotDeleteLastColor: "At least one active color must remain in the grid.",
        noGridLoaded: "No grid loaded",
        summary: (width: number, height: number, colors: number) =>
          `${width} x ${height} · ${colors} colors`,
        selectedColor: "Selected color",
        tool: "Tool",
      },
    },
    projects: {
      page: {
        eyebrow: "Project library",
        title: "Reopen your saved pixel projects.",
        description:
          "Projects are stored in IndexedDB with a localStorage fallback. Every save keeps a thumbnail, last update time, and full editor snapshot.",
        refresh: "Refresh",
        newProject: "New Project",
        emptyTitle: "No local projects yet",
        emptyDescription:
          "Save a project from the editor and it will appear here with a thumbnail preview and edit link.",
        openEditor: "Open Editor",
        cardMeta: (width: number, height: number, colors: number) =>
          `${width} x ${height} grid · ${colors} colors`,
        updated: (value: string) => `Updated ${value}`,
        continueEditing: "Continue editing",
        delete: "Delete",
        loadError: "Unable to load saved projects.",
      },
      dialog: {
        eyebrow: "Local storage",
        title: "Saved projects",
        emptyPrefix: "No saved project yet. Save from the editor first or browse the full",
        projectPage: "project page",
        cardMeta: (width: number, height: number, colors: number) =>
          `${width} x ${height} grid · ${colors} colors`,
        updated: (value: string) => `Updated ${value}`,
        open: "Open",
        delete: "Delete",
        loadError: "Unable to load saved projects.",
      },
    },
    palette: {
      page: {
        eyebrow: "Mard palette",
        title: "Browse every Mard color in one place.",
        description:
          "This page is for full palette browsing only. Hover or click any swatch to copy its code, hex value, and display name.",
        basePreset: "221 Base",
        fullPreset: "291 Full",
        meta: (name: string, count: number) => `${name} · ${count} colors`,
        hoverHint: "Hover a swatch to copy color info.",
        copied: (code: string, hex: string) => `Copied ${code} · ${hex}`,
        copyFallback: (value: string) => `Copy manually: ${value}`,
        seriesCount: (count: number) => `${count} colors`,
      },
    },
  },
  zh: {
    header: {
      nav: {
        home: "首页",
        editor: "编辑器",
        palette: "色卡",
        projects: "项目",
      },
      cta: "开始创作",
      brandTagline: "像素创作工作流",
      language: {
        label: "语言",
        en: "EN",
        zh: "中文",
      },
    },
    footer: {
      description: "MyPixel Studio，用于将图片转换为可编辑的像素图与拼豆图案。",
      editor: "编辑器",
      palette: "色卡",
      projects: "项目",
    },
    home: {
      hero: {
        badge: "图片转像素图，适配拼豆制作",
        title: "把任意图片变成精致像素图，并继续进行精修编辑。",
        description:
          "上传图片后，系统会生成真实的调色板像素网格。你可以继续逐格编辑、导出 PNG，并在本地随时重新打开项目。",
        primaryAction: "开始创作",
        secondaryAction: "打开已保存项目",
        metrics: [
          { label: "基于 Worker 的处理", value: "1 次生成" },
          { label: "网格预设", value: "4 种尺寸" },
          { label: "编辑方式", value: "Canvas" },
        ],
        previewEyebrow: "原图到网格",
        previewTitle: "转换预览",
        previewBadge: "智能颜色匹配",
        previewConnector: "转为",
        previewNotes: [
          "上传图片并选择目标网格尺寸。",
          "Worker 会把每个格子映射到最接近的调色板颜色。",
          "无需离开浏览器即可编辑、保存和导出。",
        ],
      },
      features: {
        eyebrow: "产品能力",
        title: "面向真实图片转像素工作流，同时保留手动编辑控制力。",
        description:
          "这个 MVP 覆盖了完整链路：上传、生成、编辑、保存、重新打开和导出。代码结构按渲染、工具、Worker 处理和持久化拆分，便于继续迭代。",
        items: [
          {
            title: "上传并转换",
            description: "把照片、插画或参考图转换成真正可编辑的像素网格。",
          },
          {
            title: "自定义网格尺寸",
            description: "支持在 32、48、64、96 方格预设之间切换并重新生成。",
          },
          {
            title: "智能颜色匹配",
            description: "每个格子都会通过最近色匹配量化到结构化调色板中。",
          },
          {
            title: "手动精修",
            description: "使用画笔、橡皮、吸管和填充工具继续在画布里细修。",
          },
          {
            title: "高清 PNG 导出",
            description: "输出清晰像素图，适合预览、打印或拼豆制作参考。",
          },
          {
            title: "本地项目保存",
            description: "项目会存入 IndexedDB，并带缩略图，方便后续重新打开。",
          },
        ],
      },
      workflow: {
        eyebrow: "工作流",
        title: "一个干净的 MVP，也为下一阶段扩展预留了结构。",
        description:
          "编辑器状态、工具逻辑、渲染层、Worker 管线和存储层彼此分离，后续扩展调色板导入、拼豆统计或协作能力时不需要推倒重来。",
        steps: [
          {
            id: "01",
            title: "导入原图",
            description:
              "支持 JPG、PNG、WEBP。系统会读取原始尺寸，并准备交给 Worker 进行处理。",
          },
          {
            id: "02",
            title: "生成像素网格",
            description:
              "Worker 会按目标网格做降采样、区域平均，并映射到最近的调色板颜色。",
          },
          {
            id: "03",
            title: "继续手工编辑",
            description:
              "使用画布编辑器修轮廓、替换颜色、区域填充，完善最终图案。",
          },
          {
            id: "04",
            title: "保存或导出",
            description:
              "你可以把项目保存到本地，下次继续编辑；也可以导出清晰 PNG 用于分享或制作。",
          },
        ],
      },
    },
    editor: {
      toolbar: {
        brush: "画笔",
        eraser: "橡皮",
        eyedropper: "吸管",
        bucket: "油漆桶",
        hand: "拖拽",
        undo: "撤销",
        redo: "重做",
      },
      topbar: {
        placeholder: "项目名称",
        unsavedChanges: "未保存修改",
        savedState: "已保存状态",
        processing: "正在通过 Worker 处理图片...",
        saving: "正在保存到本地...",
        idleHint: "直接绘制即可；按住空格或使用右键 / 中键可平移。",
        lastSave: (value: string) => `上次保存：${value}。`,
        plainPng: "普通 PNG",
        codedPng: "色号 PNG",
        upload: "上传",
        replaceImage: "换图",
        regenerate: "重新生成",
        openSaved: "打开已保存",
        reset: "重置",
        exportPng: "导出 PNG",
        exportStats: "导出统计",
        saveProject: "保存项目",
      },
      sidebar: {
        generateTab: "生成",
        editTab: "编辑拼图",
        sourceEyebrow: "来源",
        sourceTitle: "图片设置",
        original: (width: number, height: number) => `原始尺寸：${width} x ${height}`,
        currentGrid: (width: number, height: number) =>
          `当前网格：${width} x ${height}`,
        noImage: "尚未加载图片。先上传一张图片来生成像素网格。",
        uploadImage: "上传图片",
        replaceImage: "重新换图",
        regenerate: "重新生成",
        removeNoise: "去除杂色",
        gridEyebrow: "网格",
        gridTitle: "目标尺寸",
        gridToggle: (showGrid: boolean) => `网格${showGrid ? "开" : "关"}`,
        presetSuffix: "像素网格",
        paletteEyebrow: "调色板",
        paletteTitle: "颜色控制",
        paletteReady: "选择色卡版本后，可在这里快速切换当前绘制颜色。",
        paletteInactive: "先生成或恢复网格，随后这里会激活颜色控制。",
        palettePresetBase: "221 基础版",
        palettePresetFull: "291 完整版",
        palettePresetMeta: (count: number, label: string) =>
          `${label} · ${count} 色`,
        currentColor: "当前颜色",
        noColorSelected: "当前还没有可用颜色。",
        quickSelect: "快速选择",
        openPalettePage: "打开完整色卡页",
        editEyebrow: "编辑",
        editTitle: "拼图控制",
        statsEyebrow: "统计",
        statsTitle: "颜色使用情况",
        statsOrder: "由少到多",
        statsUsage: (count: number) => `${count} 格`,
        statsEmpty: "当前还没有可操作的颜色。",
        deleteColor: "删除",
      },
      controls: {
        zoomLabel: "缩放",
        fit: "适应画布",
        wheelHint: "画布内滚轮用于平移图片，缩放请使用滑条。",
      },
      canvas: {
        hint: "滚轮平移 · 空格 / 中键平移",
        rebuilding: "正在重新生成像素网格...",
        emptyTitle: "从一张图片开始",
        emptyDescription:
          "先上传图片生成真实像素网格，然后在画布中继续使用画笔、橡皮、吸管和油漆桶逐格编辑。",
        uploadImage: "上传图片",
        externalBackground: "外部背景",
        generateHint: "生成模式 · 可拖拽和查看",
      },
      app: {
        generatingGrid: (label: string) => `正在生成 ${label} 像素网格...`,
        generatedGrid: (width: number, height: number, colors: number) =>
          `已生成 ${width} x ${height} 网格，共匹配 ${colors} 种调色板颜色。`,
        loadingProject: "正在加载已保存项目...",
        projectNotFound: "未找到已保存项目。",
        openedProject: (name: string) => `已打开 ${name}。`,
        uploadBeforeRegenerate: "请先上传图片再重新生成。",
        reloadingSource: "正在重新读取原图并生成网格...",
        savingProject: "正在保存项目到本地...",
        generateBeforeSaving: "请先生成像素网格再保存。",
        savedProject: (name: string) => `已将 ${name} 保存到本地。`,
        generateBeforeExport: "请先生成网格再导出 PNG。",
        pngExported: (renderMode: "plain" | "coded") =>
          renderMode === "coded" ? "已导出带色号 PNG。" : "已导出 PNG。",
        statsExported: "已导出颜色统计 PNG。",
        noiseRemoved: (count: number) => `已清理 ${count} 个杂色格子。`,
        noiseAlreadyClean: "当前图纸没有明显杂色可清理。",
        deletedColor: (colorKey: string, count: number) =>
          `已删除 ${colorKey}，并用周边颜色替换 ${count} 个格子。`,
        colorAlreadyGone: (colorKey: string) => `${colorKey} 当前已不在图纸中使用。`,
        exportModePlain: "已切换为普通 PNG 导出模式。",
        exportModeCodes: "已切换为色号 PNG 导出模式。",
        unableGenerateGrid: "无法生成像素网格。",
        unableImportImage: "无法导入图片。",
        unableOpenProject: "无法打开项目。",
        unableSaveProject: "无法保存项目。",
        unableExportPng: "无法导出 PNG。",
        unableExportStats: "无法导出统计 PNG。",
        cannotDeleteLastColor: "图纸里至少需要保留一种颜色。",
        noGridLoaded: "尚未加载网格",
        summary: (width: number, height: number, colors: number) =>
          `${width} x ${height} · ${colors} 种颜色`,
        selectedColor: "当前颜色",
        tool: "工具",
      },
    },
    projects: {
      page: {
        eyebrow: "项目库",
        title: "重新打开你保存过的像素项目。",
        description:
          "项目会优先保存在 IndexedDB，并带有 localStorage 回退。每次保存都会记录缩略图、更新时间和完整编辑快照。",
        refresh: "刷新",
        newProject: "新建项目",
        emptyTitle: "还没有本地项目",
        emptyDescription:
          "在编辑器中保存项目后，它会显示在这里，并附带缩略图预览和继续编辑入口。",
        openEditor: "打开编辑器",
        cardMeta: (width: number, height: number, colors: number) =>
          `${width} x ${height} 网格 · ${colors} 种颜色`,
        updated: (value: string) => `更新于 ${value}`,
        continueEditing: "继续编辑",
        delete: "删除",
        loadError: "无法加载已保存项目。",
      },
      dialog: {
        eyebrow: "本地存储",
        title: "已保存项目",
        emptyPrefix: "还没有已保存项目。先在编辑器里保存，或者前往完整的",
        projectPage: "项目页面",
        cardMeta: (width: number, height: number, colors: number) =>
          `${width} x ${height} 网格 · ${colors} 种颜色`,
        updated: (value: string) => `更新于 ${value}`,
        open: "打开",
        delete: "删除",
        loadError: "无法加载已保存项目。",
      },
    },
    palette: {
      page: {
        eyebrow: "Mard 色卡",
        title: "在一个页面里浏览全部 Mard 颜色。",
        description:
          "这个页面专门用于完整查看色卡。将鼠标悬浮或点击任意色块，即可复制它的色号、十六进制值和显示名。",
        basePreset: "221 基础版",
        fullPreset: "291 完整版",
        meta: (name: string, count: number) => `${name} · ${count} 色`,
        hoverHint: "将鼠标悬浮到色块上即可复制颜色信息。",
        copied: (code: string, hex: string) => `已复制 ${code} · ${hex}`,
        copyFallback: (value: string) => `请手动复制：${value}`,
        seriesCount: (count: number) => `${count} 色`,
      },
    },
  },
} as const;

export type Messages = (typeof dictionaries)[typeof DEFAULT_LOCALE];

export function getMessages(locale: Locale) {
  return dictionaries[locale];
}

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "zh";
}
