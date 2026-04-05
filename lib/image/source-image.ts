"use client";

import type { SourceImageAsset } from "@/types/editor";

export interface RasterizedImageSource {
  asset: SourceImageAsset;
  pixels: Uint8ClampedArray;
}

interface UploadSourceImageResponse {
  url: string;
  name: string;
  type: string;
}

const IMAGE_UPLOAD_ENDPOINT = "/api/uploads/";
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export function resolveSourceImageSrc(asset: Pick<SourceImageAsset, "url" | "dataUrl">) {
  const source = asset.url ?? asset.dataUrl;

  if (!source) {
    throw new Error("Unable to resolve the source image URL.");
  }

  return source;
}

async function uploadSourceImage(file: File): Promise<UploadSourceImageResponse> {
  const normalizedType = file.type.toLowerCase();
  if (normalizedType && !ACCEPTED_IMAGE_TYPES.has(normalizedType)) {
    throw new Error("Unsupported image format. Please upload PNG, JPG, or WEBP.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(IMAGE_UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json().catch(() => null)) as
    | (UploadSourceImageResponse & { error?: string })
    | { error?: string }
    | null;

  if (!response.ok || !payload || !("url" in payload)) {
    throw new Error(
      payload?.error ?? "Unable to upload the image to the server.",
    );
  }

  return payload;
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
      ...(src.startsWith("data:")
        ? { dataUrl: src }
        : { url: src }),
      width: canvas.width,
      height: canvas.height,
    },
    pixels: new Uint8ClampedArray(imageData.data),
  };
}

export async function rasterizeFile(file: File) {
  const uploaded = await uploadSourceImage(file);
  return rasterizeSource(uploaded.url, uploaded.name, uploaded.type || "image/png");
}

export async function rasterizeAsset(asset: SourceImageAsset) {
  return rasterizeSource(resolveSourceImageSrc(asset), asset.name, asset.type);
}
