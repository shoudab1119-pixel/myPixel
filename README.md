# MyPixel Studio

MyPixel Studio is a browser-based image-to-pixel-art and perler-pattern editor.
It converts uploaded images into real pixel grids, lets users keep editing cell-by-cell on canvas, exports PNG, and saves projects locally for reopening later.

## Positioning

This project is an MVP for an online creative tool similar to image-to-pixel and bead-pattern generators.
The focus is not only on the conversion result, but on a usable editing workflow:

- Upload image
- Choose target grid size
- Quantize to a structured palette
- Edit with brush / eraser / eyedropper / bucket
- Export PNG
- Save and reopen local projects

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Zustand for editor state
- HTML5 Canvas for grid rendering and editing
- Web Worker for pixelation and color quantization
- IndexedDB with localStorage fallback for project persistence

## Features

- Modern landing page at `/`
- Full editor at `/editor`
- Local project library at `/projects`
- Real image raster processing and palette mapping
- Grid presets: 32x32, 48x48, 64x64, 96x96
- Undo / redo history
- Canvas zoom and pan
- Grid toggle
- PNG export
- Local save / restore / delete
- Empty, loading, and error states

## Project Structure

```text
app/
  editor/
  projects/
  globals.css
  layout.tsx
  page.tsx
components/
  editor/
  home/
  projects/
  site/
  ui/
hooks/
  use-pixel-worker.ts
  use-projects-library.ts
lib/
  editor/
  export/
  image/
  storage/
  color.ts
  constants.ts
  palette.ts
  utils.ts
store/
  editor-store.ts
types/
  editor.ts
  project.ts
  worker.ts
workers/
  pixelate.worker.ts
```

## Core Modules

### Editor state

`/store/editor-store.ts`

- Central editor state
- Grid data, viewport, selected tool/color
- History stack
- Save status and processing state

### Rendering layer

`/components/editor/pixel-canvas.tsx`
`/lib/editor/render.ts`

- Canvas draw loop
- Pointer interaction handling
- Zoom / pan math
- Efficient cell rendering without CSS mosaic tricks

### Tool logic

`/lib/editor/tools.ts`

- Cell indexing
- Bresenham stroke tracing
- Flood fill
- Batch paint application

### Pixelation pipeline

`/workers/pixelate.worker.ts`
`/lib/image/source-image.ts`

- Read original image pixels
- Downscale into target grid regions
- Average source pixels per cell
- Map each cell to nearest palette color
- Return a true editable grid

### Persistence

`/lib/storage/project-storage.ts`
`/lib/storage/editor-preferences.ts`

- IndexedDB project storage
- localStorage fallback
- Thumbnail generation
- Editor preference persistence

## Data Design

Main editable grid data:

- `width`
- `height`
- `cells: string[]`
- `background`

Editor runtime state includes:

- `palette`
- `history`
- `selectedTool`
- `selectedColor`
- `viewport`
- `sourceImage`
- `processing`

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm run start
```

Lint:

```bash
npm run lint
```

## Publish to GitHub

Initialize and push the repository:

```bash
git init -b main
git add .
git commit -m "feat: initial release"
git remote add origin https://github.com/<your-account>/<your-repo>.git
git push -u origin main
```

If the repository already exists locally, skip `git init`.

## Deploy Online

### Vercel

This project is ready to deploy on Vercel with zero framework changes.

```bash
npm i -g vercel
vercel
vercel --prod
```

Or connect the GitHub repository in the Vercel dashboard:

1. Import the GitHub repository
2. Framework preset: `Next.js`
3. Build command: `npm run build`
4. Output setting: default Next.js output
5. Click deploy

### Self-host

```bash
npm install
npm run build
npm run start
```

Then expose port `3000` through Nginx, Caddy, or a cloud load balancer.

## Verified

The project has been checked with:

- `npm run lint`
- `npm run build`

## Future Expansion

- Custom palette import and export
- Bead count / material estimation
- Multi-layer editing
- Selection tools
- Mirror / transform tools
- PDF export for printable patterns
- Cloud sync and account system

## Notes

- Projects are stored in the browser, not on a server.
- Large source images are decoded client-side before worker processing.
- The MVP currently uses a single default palette, but the palette model is extensible.
