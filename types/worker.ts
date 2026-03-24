import type { PaletteColor, PixelGrid } from "@/types/editor";

export interface PixelWorkerRequest {
  type: "pixelate";
  requestId: string;
  payload: {
    source: {
      width: number;
      height: number;
      data: ArrayBuffer;
    };
    target: {
      width: number;
      height: number;
    };
    palette: PaletteColor[];
    backgroundHex: string;
    excludedColorKeys?: string[];
  };
}

export interface PixelWorkerSuccessResponse {
  type: "success";
  requestId: string;
  payload: {
    grid: PixelGrid;
    usedColors: string[];
    usedColorKeys: string[];
  };
}

export interface PixelWorkerErrorResponse {
  type: "error";
  requestId: string;
  payload: {
    message: string;
  };
}

export type PixelWorkerResponse =
  | PixelWorkerSuccessResponse
  | PixelWorkerErrorResponse;
