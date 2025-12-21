import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  seats: string;
  overage: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for solopreneurs starting their digital journey.",
    seats: "1 Seat included",
    overage: "N/A",
    features: [
      "5 Quotes per month",
      "Standard PDF export",
      "Customer & item management",
      "Basic Item Catalog"
    ],
    cta: "Get Started Free",
    highlighted: false
  },
  {
    name: "Pro",
    price: "$59",
    period: "per month",
    description: "Professional teams scaling their closing power.",
    seats: "2 Seats included",
    overage: "$25/extra seat (up to 2)",
    features: [
      "Unlimited quotes",
      "QuickBooks & Stripe Sync",
      "AI Follow-up Messages",
      "Cloud sync across devices",
      "Priority email support"
    ],
    cta: "Start Pro Trial",
    highlighted: false,
    badge: "Most Popular"
  },
  {
    name: "Business",
    price: "$149",
    period: "per month",
    description: "The Cinematic Experience. Best value for serious closers.",
    seats: "5 Seats included",
    overage: "$20/extra seat (up to 4)",
    features: [
      "✨ Behavioral Sales Intelligence",
      "✨ Cinematic Pro Dynamic Banners",
      "✨ Dwell-time Heatmaps",
      "AI-powered full generation",
      "Everything in Pro"
    ],
    cta: "Start Business Trial",
    highlighted: true,
    badge: "BEST VALUE FOR CLOSERS"
  }
];

export function PricingSection() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 bg-background relative overflow-hidden transition-colors duration-500">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter">
            Hybrid <span className="text-primary italic">Seat-Bucket</span> Logic
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Choose your base tier and scale dynamically. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {pricingPlans.map((plan, idx) => (
            <GlassCard
              key={idx}
              delay={idx * 0.1}
              className={`flex flex-col relative ${plan.highlighted ? "border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.15)] lg:scale-105" : ""
                }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground font-black text-[10px] tracking-widest px-3 py-0.5">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/{plan.period}</span>
                </div>
                <p className="text-muted-foreground text-sm mt-4 min-h-[40px]">{plan.description}</p>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 mb-8 border border-primary/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-tighter">{plan.seats}</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                  Overage: {plan.overage}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-start gap-2">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${feature.includes("✨") ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-12 font-bold ${plan.highlighted
                  ? "bg-brand-pro text-primary-foreground hover:opacity-90 shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
                  : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                onClick={() => navigate("/auth")}
              >
                {plan.cta}
                {plan.highlighted && <Zap className="ml-2 h-4 w-4 fill-current" />}
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
