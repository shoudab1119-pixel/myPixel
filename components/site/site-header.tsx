"use client";

import Link from "next/link";

import { useLocale } from "@/components/providers/locale-provider";
import { LanguageSwitcher } from "@/components/site/language-switcher";

export function SiteHeader() {
  const { messages } = useLocale();
  const navigation = [
    { href: "/", label: messages.header.nav.home },
    { href: "/editor", label: messages.header.nav.editor },
    { href: "/palette", label: messages.header.nav.palette },
    { href: "/projects", label: messages.header.nav.projects },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 grid-cols-2 gap-1 rounded-2xl bg-gradient-to-br from-ember-500 via-mist-200 to-mint-300 p-2 shadow-soft">
            <span className="rounded-md bg-ink-950/80" />
            <span className="rounded-md bg-ink-950/60" />
            <span className="rounded-md bg-ink-950/60" />
            <span className="rounded-md bg-ink-950/80" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-mist-50">MyPixel Studio</p>
            <p className="text-xs uppercase tracking-[0.2em] text-mist-50/45">
              {messages.header.brandTagline}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-mist-50/72 transition hover:text-mist-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/editor"
            className="hidden h-11 items-center rounded-2xl bg-mist-50 px-4 text-sm font-medium text-ink-950 transition hover:bg-white md:inline-flex"
          >
            {messages.header.cta}
          </Link>
        </div>
      </div>
    </header>
  );
}
