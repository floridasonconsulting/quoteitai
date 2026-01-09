import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const section = useIntersectionObserver<HTMLElement>({ threshold: 0.1 });
  const navigate = useNavigate();

  return (
    <section
      ref={section.ref}
      className={`py-20 relative overflow-hidden transition-all duration-1000 ${section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
    >
      <div className="absolute inset-0 bg-brand-pro" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10 text-center text-primary-foreground">
        <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter">
          Ready to Save $1,000s and Win More Deals?
        </h2>
        <p className="text-lg mb-12 max-w-xl mx-auto opacity-90 font-medium leading-relaxed">
          Join 500+ businesses who switched to Sellegance for QuickBooks integration,
          Stripe payments, and intelligent automation at 40-80% less cost.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button
            size="lg"
            className="bg-white text-brand-pro hover:bg-white/90 h-16 px-10 text-lg font-bold shadow-xl shadow-black/20"
            onClick={() => navigate("/auth")}
          >
            Start Free 14-Day Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-transparent border-white/30 text-white hover:bg-white/10 h-16 px-10 text-lg font-bold backdrop-blur-sm"
            onClick={() => navigate("/help")}
          >
            View Demo & Tutorials
          </Button>
        </div>
        <p className="text-sm mt-8 opacity-70 font-mono tracking-widest uppercase">
          No credit card required • QuickBooks & Stripe included • Cancel anytime
        </p>
      </div>
    </section>
  );
}
