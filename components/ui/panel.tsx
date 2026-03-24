import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
