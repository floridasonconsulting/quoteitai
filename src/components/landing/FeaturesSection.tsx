import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  FileText, 
  Mail, 
  Smartphone, 
  BarChart3, 
  Users, 
  Package, 
  Crown,
  Building2,
  CreditCard
} from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const features = [
  {
    icon: Building2,
    title: "QuickBooks Integration",
    description: "Automatic customer sync and invoice creation - included in Pro tier",
    badge: "NEW"
  },
  {
    icon: CreditCard,
    title: "Stripe Payments",
    description: "Generate payment links and track invoices - included in Pro tier",
    badge: "NEW"
  },
  {
    icon: Sparkles,
    title: "AI Scope of Work Drafting",
    description: "Generate comprehensive SOWs with work breakdown, timelines, and deliverables",
    badge: "NEW"
  },
  {
    icon: FileText,
    title: "AI-Powered Quoting",
    description: "Auto-generate professional quote titles, descriptions, and terms with advanced AI"
  },
  {
    icon: Mail,
    title: "Professional Email Automation",
    description: "Send branded HTML emails with editable templates and automated follow-ups"
  },
  {
    icon: Smartphone,
    title: "Cross-Device Sync",
    description: "Work seamlessly across desktop, tablet, and mobile with real-time cloud sync"
  },
  {
    icon: BarChart3,
    title: "Smart Dashboard",
    description: "Track quotes, aging analysis, win rates, and revenue metrics at a glance"
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Organize contacts with full profile management and import/export capabilities"
  },
  {
    icon: Package,
    title: "Item Catalog",
    description: "Pre-configure products and services for lightning-fast quote creation"
  },
  {
    icon: Crown,
    title: "White-Label Branding",
    description: "Custom logo and favicon for professional, branded quotes (Max AI tier)"
  }
];

export function FeaturesSection() {
  const section = useIntersectionObserver<HTMLElement>({ threshold: 0.1 });

  return (
    <section 
      id="features" 
      ref={section.ref}
      className={`py-16 transition-all duration-700 ${
        section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Win More Deals
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to streamline your quoting process and grow your business
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((feature, idx) => (
            <Card 
              key={idx} 
              className={`hover-scale transition-all duration-500 relative ${
                section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ 
                transitionDelay: section.isVisible ? `${idx * 50}ms` : "0ms" 
              }}
            >
              {feature.badge && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 bg-green-600 text-white">
                  {feature.badge}
                </Badge>
              )}
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}