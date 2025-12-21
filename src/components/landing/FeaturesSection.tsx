import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  FileText,
  Mail,
  BarChart3,
  Users,
  Package,
  Building2,
  CreditCard,
  Zap,
  ShieldCheck
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const bentoFeatures = [
  {
    icon: Sparkles,
    title: "AI SOW Engine v1.0",
    description: "The market-disrupting engine that drafts legally-defensible, 3-phase Scope of Work documents in 15 seconds. Built for high-end trade professionals.",
    span: "lg:col-span-3 lg:row-span-2",
    badge: "FLAGSHIP",
  },
  {
    icon: Building2,
    title: "Universal Sync",
    description: "Native QuickBooks & Stripe architecture. No middleware, no lag.",
    span: "lg:col-span-2 lg:row-span-1",
    badge: "PRO"
  },
  {
    icon: Zap,
    title: "Rapid Win Sequence",
    description: "Automated 72-hour email retention logic that chases leads so you don't have to.",
    span: "lg:col-span-1 lg:row-span-1",
  },
  {
    icon: BarChart3,
    title: "Precision Analytics",
    description: "Live pipeline valuation and win-rate tracking with zero configuration.",
    span: "lg:col-span-1 lg:row-span-1",
  },
  {
    icon: ShieldCheck,
    title: "Risk Mitigation",
    description: "AI-generated exclusions and acceptance criteria to prevent scope creep.",
    span: "lg:col-span-1 lg:row-span-1",
  },
  {
    icon: Package,
    title: "Master Catalog",
    description: "Centralized item management for instant, error-free estimation.",
    span: "lg:col-span-2 lg:row-span-1",
  },
  {
    icon: Users,
    title: "Team Bucket Model",
    description: "Scalable seat-based licensing designed for growing service teams.",
    span: "lg:col-span-3 lg:row-span-1",
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden transition-colors duration-500">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-20 space-y-4">
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 uppercase tracking-widest px-4 py-1">
            Core Infrastructure
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter">
            Engineered for <span className="text-primary italic">Absolute</span> Dominance
          </h2>
          <p className="text-xl text-muted-foreground">
            Ditch the bloated legacy tools. QuoteIt AI is built on a high-performance stack
            designed to maximize conversion and minimize administrative overhead.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 auto-rows-[200px] gap-6">
          {bentoFeatures.map((feature, idx) => (
            <GlassCard
              key={idx}
              delay={idx * 0.1}
              className={`${feature.span} flex flex-col justify-between group overflow-hidden`}
            >
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-500">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-foreground tracking-tight">{feature.title}</h3>
                    {feature.badge && (
                      <Badge className="bg-primary text-primary-foreground font-bold text-[10px] py-0 px-2 h-5">
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-foreground transition-colors">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Decorative background element */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-colors" />
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
