import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_IMAGE_UPLOAD_BYTES = 12 * 1024 * 1024;
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const SUPPORTED_IMAGE_TYPES = new Map<string, string>([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/webp", ".webp"],
]);

function resolveFileExtension(file: File) {
  const normalizedType = file.type.toLowerCase();
  const typeExtension = SUPPORTED_IMAGE_TYPES.get(normalizedType);

  if (typeExtension) {
    return typeExtension;
  }

  const fileExtension = path.extname(file.name).toLowerCase();
  return [...SUPPORTED_IMAGE_TYPES.values()].includes(fileExtension)
    ? fileExtension
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing image file." },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The image file is empty." },
        { status: 400 },
      );
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Image is too large. Please keep uploads under 12 MB." },
        { status: 413 },
      );
    }

    const extension = resolveFileExtension(file);
    if (!extension) {
      return NextResponse.json(
        { error: "Unsupported image format. Please upload PNG, JPG, or WEBP." },
        { status: 415 },
      );
    }

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const outputDirectory = path.join(UPLOAD_ROOT, year, month);
    const filePath = path.join(outputDirectory, filename);
    const publicPath = path.posix.join("/uploads", year, month, filename);
    const basePath = request.nextUrl.basePath || "";

    await mkdir(outputDirectory, { recursive: true });
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({
      url: `${basePath}${publicPath}`,
      name: file.name,
      type: file.type || "application/octet-stream",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to store the uploaded image.",
      },
      { status: 500 },
    );
  }
}
