import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-10 text-center">
      <div className="max-w-md space-y-3">
        <h3 className="font-display text-2xl font-semibold text-mist-50">{title}</h3>
        <p className="text-sm leading-6 text-mist-50/65">{description}</p>
      </div>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
