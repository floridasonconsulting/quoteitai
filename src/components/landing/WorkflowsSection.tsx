import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { FileText, Mail, TrendingUp, Users, ArrowRight } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useNavigate } from "react-router-dom";

const workflows = [
  {
    id: "create-quote",
    title: "Create a Quote",
    icon: FileText,
    description: "From customer selection to PDF generation in under 60 seconds",
    steps: ["Select customer", "Add items", "AI generates details", "Export PDF"]
  },
  {
    id: "email-quote",
    title: "Email a Quote",
    icon: Mail,
    description: "Send professional branded emails with one click",
    steps: ["Create quote & generate AI summary", "Customize email subject & body", "Preview branded HTML email", "Send with download button"]
  },
  {
    id: "track-quotes",
    title: "Track Performance",
    icon: TrendingUp,
    description: "Monitor quote status and aging with visual indicators",
    steps: ["View dashboard", "Check aging alerts", "Follow up on time", "Close deals"]
  },
  {
    id: "manage-customers",
    title: "Manage Customers",
    icon: Users,
    description: "Add contacts, import data, and keep everything organized",
    steps: ["Add customer", "Import from CSV", "View history", "Send quotes"]
  }
];

export function WorkflowsSection() {
  const section = useIntersectionObserver<HTMLElement>({ threshold: 0.1 });
  const navigate = useNavigate();

  return (
    <section
      ref={section.ref}
      className={`py-24 bg-background relative overflow-hidden transition-all duration-1000 ${section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
        }`}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase italic">
            Visual <span className="text-primary not-italic">Sequence</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Optimized operational paths for the high-performance modern enterprise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {workflows.map((workflow, idx) => (
            <GlassCard
              key={workflow.id}
              delay={idx * 0.1}
              className="flex flex-col group h-full"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-all duration-500">
                <workflow.icon className="h-7 w-7 text-primary" />
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {workflow.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {workflow.description}
                </p>
              </div>

              <div className="space-y-4 flex-1">
                {workflow.steps.map((step, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-lg bg-primary/10 text-primary text-[10px] flex items-center justify-center font-black border border-primary/20">
                      {sIdx + 1}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{step}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="ghost"
                className="w-full mt-8 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 group"
                onClick={() => navigate("/auth")}
              >
                Execute
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
