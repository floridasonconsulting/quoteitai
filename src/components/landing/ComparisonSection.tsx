import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useNavigate } from "react-router-dom";

export function ComparisonSection() {
  const section = useIntersectionObserver<HTMLElement>({ threshold: 0.1 });
  const navigate = useNavigate();

  return (
    <section
      id="comparison"
      ref={section.ref}
      className={`py-16 transition-all duration-700 ${
        section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Professional Tools at 40-80% Less Cost
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get enterprise-level features without enterprise pricing or per-user fees
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-4 font-semibold">Feature</th>
                      <th className="text-center py-4 px-4 font-semibold">Quote-it AI</th>
                      <th className="text-center py-4 px-4 font-semibold text-muted-foreground">PandaDoc</th>
                      <th className="text-center py-4 px-4 font-semibold text-muted-foreground">ServiceTitan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 px-4">QuickBooks Integration</td>
                      <td className="text-center py-4 px-4">
                        <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">$79/mo tier</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">$200+/mo</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4">Stripe Payment Integration</td>
                      <td className="text-center py-4 px-4">
                        <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">$49/mo tier</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Add-on</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4">AI Scope of Work Drafting</td>
                      <td className="text-center py-4 px-4">
                        <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Not available</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Limited</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4">Professional HTML Emails</td>
                      <td className="text-center py-4 px-4">
                        <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">$49/mo</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Basic</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4">Per-User Fees</td>
                      <td className="text-center py-4 px-4">
                        <span className="text-success font-semibold">None</span>
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">$19-39/user</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">$50-200/user</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4">Setup/Onboarding Fees</td>
                      <td className="text-center py-4 px-4">
                        <span className="text-success font-semibold">$0</span>
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">$0</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">$500-1,500</td>
                    </tr>
                    <tr className="bg-primary/5">
                      <td className="py-4 px-4 font-semibold">Starting Price (5-person team)</td>
                      <td className="text-center py-4 px-4">
                        <div className="text-2xl font-bold text-primary">$29/mo</div>
                        <div className="text-xs text-muted-foreground">Flat rate</div>
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">
                        <div className="text-xl font-semibold">$144/mo</div>
                        <div className="text-xs">($49 + 5 users)</div>
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">
                        <div className="text-xl font-semibold">$1,000+/mo</div>
                        <div className="text-xs">(+ setup fees)</div>
                      </td>
                    </tr>
                    <tr className="bg-success/5">
                      <td className="py-4 px-4 font-semibold">Your Annual Savings</td>
                      <td className="text-center py-4 px-4">
                        <div className="text-sm font-medium text-success">Base</div>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className="text-xl font-bold text-success">Save $1,380</div>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className="text-xl font-bold text-success">Save $11,652</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-8 text-center space-y-4">
                <p className="text-2xl font-bold text-primary">Save $1,380-$11,652/year compared to competitors</p>
                <p className="text-sm text-muted-foreground">No per-user fees • No setup costs • QuickBooks & Stripe included • Full AI features</p>
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}