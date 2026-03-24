import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "light";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-mist-50 text-ink-950 hover:bg-white disabled:bg-mist-100 disabled:text-ink-800/50",
  secondary:
    "border border-white/10 bg-white/5 text-mist-50 hover:bg-white/10 disabled:text-white/40",
  ghost: "text-mist-50/80 hover:bg-white/5 hover:text-mist-50 disabled:text-white/40",
  danger:
    "border border-rose-500/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 disabled:text-rose-200/40",
  light:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  icon,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition duration-200 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
