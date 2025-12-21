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
    description: "Perfect for solopreneurs",
    seats: "1 Seat included",
    overage: "N/A",
    features: [
      "5 Quotes per month",
      "Standard PDF export",
      "Customer & item management",
      "Email support"
    ],
    cta: "Get Started Free",
    highlighted: false
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For small professional teams",
    seats: "3 Seats included",
    overage: "$15/extra seat",
    features: [
      "Unlimited quotes",
      "QuickBooks & Stripe Sync",
      "Professional Email Sending",
      "AI Follow-up Messages",
      "Cloud sync across devices",
      "Priority support"
    ],
    cta: "Start Pro Trial",
    highlighted: false,
    badge: "Most Popular"
  },
  {
    name: "Business",
    price: "$99",
    period: "per month",
    description: "The AI Powerhouse",
    seats: "10 Seats included",
    overage: "$10/extra seat",
    features: [
      "✨ AI Scope of Work Engine",
      "✨ AI-powered full generation",
      "Manager dashboard & review",
      "Advanced analytics",
      "Everything in Pro"
    ],
    cta: "Start Business Trial",
    highlighted: true,
    badge: "ENTREPRENEUR'S CHOICE"
  },
  {
    name: "Max AI",
    price: "$249",
    period: "per month",
    description: "Enterprise scale",
    seats: "Unlimited Seats",
    overage: "$0 Overage",
    features: [
      "White-label branding",
      "Custom domain support",
      "API Access (Coming Soon)",
      "Dedicated account manager",
      "Everything in Business"
    ],
    cta: "Go Max AI",
    highlighted: false,
    badge: "UNLIMITED"
  }
];

export function PricingSection() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 bg-[#0A0A0A] relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            Hybrid <span className="text-primary italic">Seat-Bucket</span> Logic
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Choose your base tier and scale dynamically. No hidden fees.
            No enterprise-level friction.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {pricingPlans.map((plan, idx) => (
            <GlassCard
              key={idx}
              delay={idx * 0.1}
              className={`flex flex-col relative ${plan.highlighted ? "border-primary/50 shadow-[0_0_30px_rgba(0,255,255,0.1)] lg:scale-105" : ""
                }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-black font-black text-[10px] tracking-widest px-3 py-0.5">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-500 text-sm">/{plan.period}</span>
                </div>
                <p className="text-slate-400 text-sm mt-4 min-h-[40px]">{plan.description}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-8 border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-tighter">{plan.seats}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                  Overage: {plan.overage}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-start gap-2">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${feature.includes("✨") ? "text-primary animate-pulse" : "text-slate-600"}`} />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-12 font-bold ${plan.highlighted
                    ? "bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
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
