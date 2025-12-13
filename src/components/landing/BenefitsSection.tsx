import { DollarSign, Zap, Building2, Mail, TrendingUp } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const benefits = [
  {
    icon: DollarSign,
    title: "Save 40-80%",
    stat: "vs competitors",
    description: "Professional features at $29/mo instead of $49-$200/mo"
  },
  {
    icon: Zap,
    title: "10x Faster Quotes",
    stat: "Minutes not hours",
    description: "AI automation eliminates repetitive work and speeds up quote creation"
  },
  {
    icon: Building2,
    title: "Seamless Accounting",
    stat: "QuickBooks sync",
    description: "Automatic customer and invoice sync - no double entry"
  },
  {
    icon: Mail,
    title: "Professional Communication",
    stat: "100% branded",
    description: "Send beautiful, customized emails that reinforce your brand"
  },
  {
    icon: TrendingUp,
    title: "Increase Win Rates",
    description: "Professional, consistent quotes impress clients and close more deals"
  }
];

export function BenefitsSection() {
  const section = useIntersectionObserver<HTMLElement>({ threshold: 0.1 });

  return (
    <section 
      id="benefits" 
      ref={section.ref}
      className={`py-16 bg-muted/30 transition-all duration-700 ${
        section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Quote-it AI?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional tools without the enterprise price tag
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {benefits.map((benefit, idx) => (
            <div 
              key={idx} 
              className={`text-center transition-all duration-500 ${
                section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ 
                transitionDelay: section.isVisible ? `${idx * 100}ms` : "0ms" 
              }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 hover-scale">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              {benefit.stat && (
                <p className="text-2xl font-bold text-primary mb-2">{benefit.stat}</p>
              )}
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}