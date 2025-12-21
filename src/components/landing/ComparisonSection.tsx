import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useNavigate } from "react-router-dom";

export function ComparisonSection() {
  const section = useIntersectionObserver<HTMLElement>({ threshold: 0.1 });
  const navigate = useNavigate();

  return (
    <section
      id="comparison"
      ref={section.ref}
      className={`py-24 bg-background relative overflow-hidden transition-all duration-1000 ${section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
        }`}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase italic">
            Economic <span className="text-primary not-italic">Dominance</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional estimate engineering at 40-80% less cost than legacy systems.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <GlassCard className="p-0 overflow-hidden border-primary/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/10 bg-primary/5">
                    <th className="text-left py-6 px-8 font-black text-xs uppercase tracking-widest text-muted-foreground">Operational Metric</th>
                    <th className="text-center py-6 px-8 font-black text-xs uppercase tracking-widest text-primary italic">Quote-it AI</th>
                    <th className="text-center py-6 px-8 font-black text-xs uppercase tracking-widest text-muted-foreground/50">PandaDoc</th>
                    <th className="text-center py-6 px-8 font-black text-xs uppercase tracking-widest text-muted-foreground/50">ServiceTitan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  <tr>
                    <td className="py-6 px-8 font-bold text-foreground">QuickBooks Integration</td>
                    <td className="text-center py-6 px-8">
                      <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest bg-primary/10 rounded-full py-1 px-3 w-fit mx-auto border border-primary/20">
                        <CheckCircle2 className="h-4 w-4" />
                        Native
                      </div>
                    </td>
                    <td className="text-center py-6 px-8 text-muted-foreground/60 text-sm">$79/mo tier</td>
                    <td className="text-center py-6 px-8 text-muted-foreground/60 text-sm">$200+/mo</td>
                  </tr>
                  <tr>
                    <td className="py-6 px-8 font-bold text-foreground">Stripe Payment Flow</td>
                    <td className="text-center py-6 px-8">
                      <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest bg-primary/10 rounded-full py-1 px-3 w-fit mx-auto border border-primary/20">
                        <CheckCircle2 className="h-4 w-4" />
                        Integrated
                      </div>
                    </td>
                    <td className="text-center py-6 px-8 text-muted-foreground/60 text-sm">$49/mo tier</td>
                    <td className="text-center py-6 px-8 text-muted-foreground/60 text-sm">Add-on</td>
                  </tr>
                  <tr>
                    <td className="py-6 px-8 font-bold text-foreground">AI SOW Drafting</td>
                    <td className="text-center py-6 px-8">
                      <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest bg-primary/10 rounded-full py-1 px-3 w-fit mx-auto border border-primary/20">
                        <Sparkles className="h-4 w-4" />
                        Extreme
                      </div>
                    </td>
                    <td className="text-center py-6 px-8 text-muted-foreground/60 text-sm">Not available</td>
                    <td className="text-center py-6 px-8 text-muted-foreground/60 text-sm">Manual</td>
                  </tr>
                  <tr>
                    <td className="py-6 px-8 font-bold text-foreground">Per-User License Fees</td>
                    <td className="text-center py-6 px-8">
                      <span className="text-success font-black uppercase text-xs tracking-widest">$0</span>
                    </td>
                    <td className="text-center py-6 px-8 text-muted-foreground/60 text-sm">$19-39/user</td>
                    <td className="text-center py-6 px-8 text-muted-foreground/60 text-sm">$50-200/user</td>
                  </tr>
                  <tr>
                    <td className="py-6 px-8 font-bold text-foreground">Onboarding/Setup</td>
                    <td className="text-center py-6 px-8">
                      <span className="text-success font-black uppercase text-xs tracking-widest">Instant</span>
                    </td>
                    <td className="text-center py-6 px-8 text-muted-foreground/60 text-sm">$0</td>
                    <td className="text-center py-6 px-8 text-muted-foreground/60 text-sm">$500-1,500</td>
                  </tr>
                  <tr className="bg-primary/5">
                    <td className="py-8 px-8 font-black text-foreground uppercase tracking-widest text-xs italic">Annual ROI Potential</td>
                    <td className="text-center py-8 px-8">
                      <div className="text-2xl font-black text-primary">$49/mo</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Flat Rate</div>
                    </td>
                    <td className="text-center py-8 px-8">
                      <div className="text-xl font-bold text-destructive/70">$1,728+/yr</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">Scaling Costs</div>
                    </td>
                    <td className="text-center py-8 px-8">
                      <div className="text-xl font-bold text-destructive/70">$12,000+/yr</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">High Orbit</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-12 bg-success/5 border-t border-success/10 text-center">
              <div className="mb-8">
                <span className="text-success font-black uppercase tracking-[0.3em] text-xs mb-4 block">Strategic Advantage</span>
                <p className="text-3xl md:text-5xl font-black text-foreground tracking-tighter mb-4">
                  Save up to <span className="text-success">$11,412</span> Per Year
                </p>
                <p className="text-muted-foreground font-medium">Reinvest your API tax into actual growth operations.</p>
              </div>
              <Button
                size="lg"
                className="bg-brand-pro text-primary-foreground hover:opacity-90 h-16 px-12 text-lg font-black shadow-2xl shadow-primary/20"
                onClick={() => navigate("/auth")}
              >
                PROCEED TO SCALE
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
