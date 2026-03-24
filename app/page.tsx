import { FeatureGrid } from "@/components/home/feature-grid";
import { HeroSection } from "@/components/home/hero-section";
import { WorkflowSection } from "@/components/home/workflow-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureGrid />
      <WorkflowSection />
    </>
  );
}
