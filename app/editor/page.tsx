import { Suspense } from "react";

import { EditorApp } from "@/components/editor/editor-app";
import { LoadingRing } from "@/components/ui/loading-ring";

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-81px)] items-center justify-center">
          <LoadingRing />
        </div>
      }
    >
      <EditorApp />
    </Suspense>
  );
}
