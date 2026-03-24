"use client";

import type { SourceImageAsset } from "@/types/editor";

export interface RasterizedImageSource {
  asset: SourceImageAsset;
  pixels: Uint8ClampedArray;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the image file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode the image."));
    image.src = src;
  });
}

async function rasterizeSource(
  src: string,
  name: string,
  type: string,
): Promise<RasterizedImageSource> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is unavailable.");
  }

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  return {
    asset: {
      name,
      type,
      dataUrl: src,
      width: canvas.width,
      height: canvas.height,
    },
    pixels: new Uint8ClampedArray(imageData.data),
  };
}

export async function rasterizeFile(file: File) {
  const dataUrl = await readFileAsDataUrl(file);
  return rasterizeSource(dataUrl, file.name, file.type || "image/png");
}

export async function rasterizeAsset(asset: SourceImageAsset) {
  return rasterizeSource(asset.dataUrl, asset.name, asset.type);
}
