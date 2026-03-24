"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale } from "@/components/providers/locale-provider";

export function SiteFooter() {
  const { messages } = useLocale();
  const pathname = usePathname();

  if (pathname === "/editor") {
    return null;
  }

  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-mist-50/55 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p>{messages.footer.description}</p>
        <div className="flex items-center gap-5">
          <Link href="/editor" className="transition hover:text-mist-50">
            {messages.footer.editor}
          </Link>
          <Link href="/palette" className="transition hover:text-mist-50">
            {messages.footer.palette}
          </Link>
          <Link href="/projects" className="transition hover:text-mist-50">
            {messages.footer.projects}
          </Link>
        </div>
      </div>
    </footer>
  );
}
