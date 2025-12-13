import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
      className={`py-16 transition-all duration-700 ${
        section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Common Workflows Made Simple</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how Quote-it AI streamlines your daily tasks
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover-scale">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <workflow.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  {workflow.title}
                </CardTitle>
                <CardDescription>{workflow.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflow.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                        {idx + 1}
                      </div>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4" onClick={() => navigate("/auth")}>
                  Try It Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}