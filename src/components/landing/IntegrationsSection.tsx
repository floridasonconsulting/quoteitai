import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CreditCard, Sparkles, CheckCircle2, Star } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const integrationBenefits = [
  {
    icon: Building2,
    title: "QuickBooks Online",
    features: [
      "Two-way customer synchronization",
      "Automatic invoice creation from accepted quotes",
      "Real-time payment tracking",
      "Chart of accounts sync"
    ],
    badge: "Included in Pro"
  },
  {
    icon: CreditCard,
    title: "Stripe Payments",
    features: [
      "Professional invoice generation",
      "Secure payment link creation",
      "Real-time payment status tracking",
      "Automatic payment reminders"
    ],
    badge: "Included in Pro"
  },
  {
    icon: Sparkles,
    title: "AI-Powered SOW",
    features: [
      "Comprehensive scope of work documents",
      "Automatic work breakdown structure",
      "Timeline and milestone generation",
      "Deliverables with acceptance criteria"
    ],
    badge: "Business tier"
  }
];

export function IntegrationsSection() {
  const section = useIntersectionObserver<HTMLElement>({ threshold: 0.1 });

  return (
    <section 
      id="integrations" 
      ref={section.ref}
      className={`py-16 bg-muted/30 transition-all duration-700 ${
        section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Star className="h-3 w-3 mr-1 fill-primary" />
            New Integrations
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built-In Integrations That Save You Time & Money
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            QuickBooks and Stripe integration included at no extra cost - competitors charge $99-200/month for these features
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {integrationBenefits.map((integration, idx) => (
            <Card 
              key={idx} 
              className={`hover-scale transition-all duration-500 ${
                section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ 
                transitionDelay: section.isVisible ? `${idx * 100}ms` : "0ms" 
              }}
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <integration.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  {integration.title}
                  <Badge variant="secondary" className="text-xs">{integration.badge}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {integration.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}