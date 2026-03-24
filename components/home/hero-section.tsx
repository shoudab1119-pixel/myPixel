"use client";

import Link from "next/link";

import { useLocale } from "@/components/providers/locale-provider";

export function HeroSection() {
  const { messages } = useLocale();
  const metrics = messages.home.hero.metrics;

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-20 lg:px-10 lg:pb-28 lg:pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,127,50,0.22),transparent_35%),radial-gradient(circle_at_right,rgba(123,220,194,0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute right-[-8rem] top-12 h-72 w-72 rounded-full bg-ember-500/15 blur-3xl" />
      <div className="pointer-events-none absolute left-[-10rem] top-28 h-80 w-80 rounded-full bg-mint-300/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.24em] text-mist-50/68">
            {messages.home.hero.badge}
          </div>
          <div className="space-y-6">
            <h1 className="max-w-4xl font-display text-5xl font-semibold tracking-tight text-mist-50 sm:text-6xl lg:text-7xl">
              {messages.home.hero.title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-mist-50/72 sm:text-xl">
              {messages.home.hero.description}
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/editor"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-mist-50 px-5 text-base font-medium text-ink-950 transition hover:bg-white"
            >
              {messages.home.hero.primaryAction}
            </Link>
            <Link
              href="/projects"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-medium text-mist-50 transition hover:bg-white/10"
            >
              {messages.home.hero.secondaryAction}
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-2xl font-semibold text-mist-50">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-mist-50/62">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[34px] bg-gradient-to-br from-white/10 via-white/0 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-ink-900/80 p-5 shadow-panel">
            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/8 bg-ink-950/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-mist-50/42">
                      {messages.home.hero.previewEyebrow}
                    </p>
                    <p className="mt-2 text-lg font-medium text-mist-50">
                      {messages.home.hero.previewTitle}
                    </p>
                  </div>
                  <div className="rounded-full border border-mint-300/20 bg-mint-300/10 px-3 py-1 text-xs text-mint-300">
                    {messages.home.hero.previewBadge}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="aspect-square rounded-[24px] bg-[linear-gradient(135deg,#f7f2e7,#cb5e7d,#4362a6,#3f5e3a)]" />
                  <div className="text-sm uppercase tracking-[0.2em] text-mist-50/34">
                    {messages.home.hero.previewConnector}
                  </div>
                  <div className="grid aspect-square grid-cols-8 gap-1 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    {new Array(64).fill(0).map((_, index) => {
                      const colors = [
                        "#f7f2e7",
                        "#cb5e7d",
                        "#f0c95f",
                        "#4362a6",
                        "#3f5e3a",
                        "#1b1f27",
                      ];
                      return (
                        <span
                          key={index}
                          className="rounded-[4px]"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {messages.home.hero.previewNotes.map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-mist-50/62"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
