import { Badge } from "@/components/ui/badge";
import { Building2, CreditCard, Sparkles, CheckCircle2, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const integrationBenefits = [
  {
    icon: Building2,
    title: "QuickBooks Online",
    features: [
      "Two-way customer synchronization",
      "Automatic invoice creation",
      "Real-time payment tracking",
      "Chart of accounts sync"
    ],
    badge: "Included @ Pro"
  },
  {
    icon: CreditCard,
    title: "Stripe Payments",
    features: [
      "Professional invoice generation",
      "Secure payment link creation",
      "Real-time status tracking",
      "Automatic payment reminders"
    ],
    badge: "Included @ Pro"
  },
  {
    icon: Sparkles,
    title: "AI-Powered SOW",
    features: [
      "Comprehensive scope of work",
      "Automatic WBS generation",
      "Timeline and milestone logic",
      "Exclusions & Acceptance filters"
    ],
    badge: "Business Tier"
  }
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="py-24 bg-background relative overflow-hidden transition-colors duration-500">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 px-4 py-1">
            <Star className="h-3 w-3 mr-2 fill-primary" />
            Zero-Friction Stacks
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter">
            Native <span className="text-primary italic">Deep</span> Sync
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop paying $200/mo for basic connectors. We've built QuickBooks and Stripe
            straight into the core, saving you thousands in API tax.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {integrationBenefits.map((integration, idx) => (
            <GlassCard
              key={idx}
              delay={idx * 0.15}
              className="group hover:border-primary/30"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                <integration.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-foreground tracking-tight">{integration.title}</h3>
                <Badge variant="outline" className="border-border text-muted-foreground text-[10px] uppercase font-bold px-2">
                  {integration.badge}
                </Badge>
              </div>
              <ul className="space-y-4">
                {integration.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-start gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
