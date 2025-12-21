import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { MotionProposalSection } from "@/components/landing/MotionProposalSection";
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

// DEPLOYMENT TRIGGER: 2025-12-04T14:44:57Z
// Force Vercel to rebuild with latest features:
// - QuickBooks Integration (NEW)
// - Stripe Payments (NEW)
// - AI SOW Drafting (NEW)
// - Updated Hero Section with badges
// - Updated Features Section with 10 features
// - Full Advanced Analytics on Dashboard

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 selection:bg-primary/30 selection:text-primary">
      <LandingHeader />
      <main>
        <HeroSection />
        <MotionProposalSection />
        <IntegrationsSection />
        <FeaturesSection />
        <BenefitsSection />
        <ComparisonSection />
        <ScreenshotsSection />
        <WorkflowsSection />
        <PricingSection />
        <CTASection />
      </main>
      <LandingFooter />
      <ScrollTopButton />
    </div>
  );
}
