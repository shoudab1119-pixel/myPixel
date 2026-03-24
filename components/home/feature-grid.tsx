"use client";

import { BrushCleaning, Grid2x2Check, Palette, Save, ScanSearch, Upload } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";

const featureIcons = [Upload, Grid2x2Check, ScanSearch, BrushCleaning, Palette, Save];

export function FeatureGrid() {
  const { messages } = useLocale();
  const features = messages.home.features.items.map((item, index) => ({
    ...item,
    icon: featureIcons[index],
  }));

  return (
    <section className="px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-12">
        <SectionHeading
          eyebrow={messages.home.features.eyebrow}
          title={messages.home.features.title}
          description={messages.home.features.description}
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <Panel key={feature.title} className="p-6">
              <feature.icon className="h-6 w-6 text-ember-400" />
              <h3 className="mt-5 font-display text-xl font-semibold text-mist-50">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-mist-50/68">{feature.description}</p>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  );
}
