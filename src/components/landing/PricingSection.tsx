import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useNavigate } from "react-router-dom";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "5 quotes per month",
      "Basic email notifications",
      "Standard PDF export",
      "Customer & item management",
      "Email support"
    ],
    cta: "Get Started Free",
    highlighted: false
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    oldPrice: "$49-99/mo competitors",
    annualPrice: "$290/year (save $58)",
    description: "For growing businesses - 40% cheaper than PandaDoc",
    features: [
      "50 quotes per month",
      "✨ QuickBooks Integration",
      "✨ Stripe Payment Integration",
      "Professional HTML email automation",
      "Editable email templates",
      "AI quote generation",
      "AI terms & conditions",
      "Cloud sync across devices",
      "Priority support"
    ],
    cta: "Start Pro Trial",
    highlighted: true,
    savings: "Save $240/year vs PandaDoc"
  },
  {
    name: "Business",
    price: "$79",
    period: "per month",
    oldPrice: "$200+/mo competitors",
    annualPrice: "$790/year (save $158)",
    description: "For established businesses - 60% cheaper than ServiceTitan",
    features: [
      "Everything in Pro, plus:",
      "Unlimited quotes",
      "Unlimited team members (no per-seat fees)",
      "✨ AI Scope of Work drafting",
      "✨ AI item recommendations",
      "✨ AI pricing optimization",
      "Advanced analytics",
      "White-label branding options",
      "API access",
      "Dedicated account manager"
    ],
    cta: "Start Business Trial",
    highlighted: false,
    savings: "Save $1,452/year vs ServiceTitan"
  },
  {
    name: "Max AI",
    price: "$149",
    period: "per month",
    oldPrice: "$300+/mo competitors",
    annualPrice: "$1,490/year (save $298)",
    description: "Enterprise AI automation - 50% cheaper than competitors with AI",
    features: [
      "Everything in Business, plus:",
      "Unlimited AI generation",
      "AI full quote generation",
      "AI competitive analysis",
      "AI customer insights",
      "Custom AI training",
      "RFP response matching",
      "Smart content library",
      "White-label + custom domain",
      "24/7 priority support",
      "Custom integrations"
    ],
    cta: "Start Max AI Trial",
    highlighted: false,
    savings: "Save $1,812/year vs competitors"
  }
];

export function PricingSection() {
  const section = useIntersectionObserver<HTMLElement>({ threshold: 0.1 });
  const navigate = useNavigate();

  return (
    <section
      id="pricing"
      ref={section.ref}
      className={`py-16 bg-muted/30 transition-all duration-700 ${
        section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. No per-user fees. No setup costs.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan, idx) => (
            <Card
              key={idx}
              className={`hover-scale transition-all duration-500 flex flex-col ${
                plan.highlighted ? "border-primary shadow-lg md:scale-105" : ""
              } ${
                section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{
                transitionDelay: section.isVisible ? `${idx * 100}ms` : "0ms"
              }}
            >
              <CardHeader>
                {plan.highlighted && (
                  <Badge className="mb-2 w-fit">Most Popular</Badge>
                )}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4 space-y-1">
                  <div>
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  {plan.oldPrice && (
                    <p className="text-xs text-muted-foreground line-through">{plan.oldPrice}</p>
                  )}
                  {plan.annualPrice && (
                    <p className="text-sm text-muted-foreground">{plan.annualPrice}</p>
                  )}
                  {plan.savings && (
                    <p className="text-sm font-semibold text-green-600">{plan.savings}</p>
                  )}
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Button
                  className="w-full mb-4"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => navigate("/auth")}
                >
                  {plan.cta}
                </Button>
                <ul className="space-y-2 flex-1">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include 14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
