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
    description: "Intelligent automation eliminates repetitive work and speeds up quote creation"
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
      className={`py-24 bg-background border-y border-border transition-all duration-1000 ${section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter uppercase italic">
            Engineered <span className="text-primary not-italic">Efficiency</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Professional estimate engineering for high-performance service teams.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {benefits.map((benefit, idx) => (
            <div
              key={idx}
              className={`text-center transition-all duration-1000 ${section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
              style={{
                transitionDelay: section.isVisible ? `${idx * 150}ms` : "0ms"
              }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/5 border border-primary/10 mb-6 hover:scale-110 hover:bg-primary/10 transition-all duration-500">
                <benefit.icon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{benefit.title}</h3>
              {benefit.stat && (
                <p className="text-sm font-black text-primary mb-3 uppercase tracking-widest">{benefit.stat}</p>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}