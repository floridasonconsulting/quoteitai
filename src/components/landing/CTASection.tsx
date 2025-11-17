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
      className={`py-16 bg-primary text-primary-foreground transition-all duration-700 ${
        section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Save $1,000s and Win More Deals?
        </h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
          Join smart businesses who switched to Quote-it AI for QuickBooks integration, Stripe payments, and AI automation at 40-80% less cost
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
            Start Free 14-Day Trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            onClick={() => navigate("/help")}
          >
            View Demo & Tutorials
          </Button>
        </div>
        <p className="text-sm mt-4 opacity-80">
          No credit card required • QuickBooks & Stripe included • Cancel anytime
        </p>
      </div>
    </section>
  );
}
