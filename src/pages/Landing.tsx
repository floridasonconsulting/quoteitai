import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { IntegrationsSection } from "@/components/landing/IntegrationsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { ScreenshotsSection } from "@/components/landing/ScreenshotsSection";
import { WorkflowsSection } from "@/components/landing/WorkflowsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ScrollTopButton } from "@/components/landing/ScrollTopButton";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
      <IntegrationsSection />
      <FeaturesSection />
      <BenefitsSection />
      <ComparisonSection />
      <ScreenshotsSection />
      <WorkflowsSection />
      <PricingSection />
      <CTASection />
      <LandingFooter />
      <ScrollTopButton />
    </div>
  );
}
