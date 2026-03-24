"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import type { Locale } from "@/types/i18n";

const options: Locale[] = ["en", "zh"];

export function LanguageSwitcher() {
  const { locale, setLocale, messages } = useLocale();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          aria-label={`${messages.header.language.label}: ${messages.header.language[option]}`}
          className={cn(
            "rounded-full px-3 py-2 text-xs font-medium transition",
            locale === option
              ? "bg-mist-50 text-ink-950"
              : "text-mist-50/65 hover:text-mist-50",
          )}
        >
          {messages.header.language[option]}
        </button>
      ))}
    </div>
  );
}
