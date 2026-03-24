"use client";

import { useCallback, useEffect, useRef } from "react";

import type { PixelWorkerRequest, PixelWorkerResponse } from "@/types/worker";

interface PendingRequest {
  resolve: (value: PixelWorkerResponse) => void;
  reject: (reason?: unknown) => void;
}

export function usePixelWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/pixelate.worker.ts", import.meta.url),
      { type: "module" },
    );
    const pendingRequests = pendingRef.current;

    worker.onmessage = (event: MessageEvent<PixelWorkerResponse>) => {
      const response = event.data;
      const pending = pendingRequests.get(response.requestId);

      if (!pending) {
        return;
      }

      pending.resolve(response);
      pendingRequests.delete(response.requestId);
    };

    worker.onerror = (event) => {
      pendingRequests.forEach(({ reject }) => {
        reject(event.error ?? new Error("The pixel worker crashed."));
      });
      pendingRequests.clear();
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
      pendingRequests.clear();
    };
  }, []);

  const pixelate = useCallback((request: PixelWorkerRequest) => {
    if (!workerRef.current) {
      return Promise.reject(new Error("Worker is not ready."));
    }

    return new Promise<PixelWorkerResponse>((resolve, reject) => {
      pendingRef.current.set(request.requestId, {
        resolve,
        reject,
      });

      workerRef.current?.postMessage(request, [request.payload.source.data]);
    });
  }, []);

  return {
    pixelate,
  };
}
