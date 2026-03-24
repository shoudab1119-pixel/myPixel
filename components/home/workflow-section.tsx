"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { SectionHeading } from "@/components/ui/section-heading";

export function WorkflowSection() {
  const { messages } = useLocale();
  const steps = messages.home.workflow.steps;

  return (
    <section className="px-6 pb-24 pt-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow={messages.home.workflow.eyebrow}
          title={messages.home.workflow.title}
          description={messages.home.workflow.description}
        />
        <div className="grid gap-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-[84px_1fr]"
            >
              <div className="font-display text-4xl font-semibold text-white/18">{step.id}</div>
              <div>
                <h3 className="font-display text-xl font-semibold text-mist-50">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-mist-50/66">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
