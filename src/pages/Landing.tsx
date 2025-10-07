import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { 
  Sparkles, 
  BarChart3, 
  Smartphone, 
  FileText, 
  Users, 
  Package, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Zap,
  Shield,
  Globe,
  MousePointerClick,
  ArrowRight,
  Star,
  Play
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Quoting",
      description: "Auto-generate professional quote titles, descriptions, and terms with advanced AI"
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
      icon: FileText,
      title: "Professional PDFs",
      description: "Generate branded, polished quote documents with custom company information"
    },
    {
      icon: Clock,
      title: "Quote Aging Tracking",
      description: "Visual indicators show quote freshness - never miss a follow-up opportunity"
    },
    {
      icon: Globe,
      title: "Mobile Ready",
      description: "Native Android & iOS app capabilities powered by Capacitor"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Save Time",
      stat: "10x faster",
      description: "Create professional quotes in minutes, not hours, with AI automation"
    },
    {
      icon: TrendingUp,
      title: "Increase Win Rates",
      description: "Professional, consistent quotes impress clients and close more deals"
    },
    {
      icon: CheckCircle2,
      title: "Never Miss Follow-Ups",
      description: "Smart aging alerts tell you exactly when to reach out to prospects"
    },
    {
      icon: Shield,
      title: "Work Anywhere",
      description: "Office, job site, or home - your quotes sync across all devices"
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Basic features",
        "Limited quotes per month",
        "Standard PDF export",
        "Email support"
      ],
      cta: "Get Started Free",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "per month",
      annualPrice: "$99/year (save $20)",
      description: "For growing businesses",
      features: [
        "50 quotes per month",
        "Basic AI features",
        "Customer management",
        "Item catalog",
        "Cloud sync",
        "Priority support"
      ],
      cta: "Start Pro Trial",
      highlighted: true
    },
    {
      name: "Max AI",
      price: "$19.99",
      period: "per month",
      annualPrice: "$199/year (save $40)",
      description: "Unlimited power",
      features: [
        "Unlimited quotes",
        "Advanced AI features",
        "AI quote generation",
        "AI terms & conditions",
        "Priority AI processing",
        "Dedicated support"
      ],
      cta: "Start Max AI Trial",
      highlighted: false
    }
  ];

  const testimonials = [
    {
      quote: "Quote-it AI has transformed how we create proposals. What used to take hours now takes minutes.",
      author: "Sarah Johnson",
      role: "Contractor, BuildRight Co."
    },
    {
      quote: "The aging alerts are a game-changer. We're following up at the perfect time and closing more deals.",
      author: "Michael Chen",
      role: "Sales Consultant"
    },
    {
      quote: "Being able to create quotes on my phone while at job sites has been incredible for my business.",
      author: "David Martinez",
      role: "Freelance Electrician"
    }
  ];

  const heroFeatures = [
    { icon: Sparkles, text: "AI-powered quote generation" },
    { icon: BarChart3, text: "Real-time analytics dashboard" },
    { icon: Clock, text: "Smart aging alerts" },
    { icon: Smartphone, text: "Works on any device" }
  ];

  const screenshots = [
    {
      id: 'dashboard',
      title: 'Smart Dashboard',
      description: 'Track all your quotes and metrics in one place',
      image: '/screenshots/dashboard.png',
      badge: 'Analytics'
    },
    {
      id: 'quote-detail',
      title: 'Professional Quotes',
      description: 'Create detailed quotes with AI assistance',
      image: '/screenshots/quote-detail.png',
      badge: 'AI-Powered'
    },
    {
      id: 'customers',
      title: 'Customer Management',
      description: 'Organize and manage all your contacts',
      image: '/screenshots/customers.png',
      badge: 'CRM'
    }
  ];

  const workflows = [
    {
      id: 'create-quote',
      title: 'Create a Quote',
      icon: FileText,
      description: 'From customer selection to PDF generation in under 60 seconds',
      steps: ['Select customer', 'Add items', 'AI generates details', 'Export PDF']
    },
    {
      id: 'track-quotes',
      title: 'Track Performance',
      icon: TrendingUp,
      description: 'Monitor quote status and aging with visual indicators',
      steps: ['View dashboard', 'Check aging alerts', 'Follow up on time', 'Close deals']
    },
    {
      id: 'manage-customers',
      title: 'Manage Customers',
      icon: Users,
      description: 'Add contacts, import data, and keep everything organized',
      steps: ['Add customer', 'Import from CSV', 'View history', 'Send quotes']
    }
  ];

  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Quote-it AI</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm hover:text-primary transition-colors">Features</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm hover:text-primary transition-colors">Pricing</button>
            <button onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm hover:text-primary transition-colors">Testimonials</button>
            <button onClick={() => navigate('/help')} className="text-sm hover:text-primary transition-colors">Help</button>
          </nav>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button onClick={() => navigate('/auth')}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Banner with Screenshots */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Feature highlights */}
            <div className="space-y-8">
              <Badge variant="secondary">
                <Star className="h-3 w-3 mr-1 fill-primary" />
                See It In Action
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Create Professional Quotes in{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Seconds
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Smart quote management powered by AI. Track quotes, manage customers, and never miss a follow-up opportunity.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {heroFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate('/auth')}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById('screenshots')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Play className="mr-2 h-4 w-4" />
                  View Demo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No credit card required • Free forever plan available
              </p>
            </div>
            
            {/* Right: Screenshot carousel */}
            <div className="relative">
              <Carousel 
                plugins={[plugin.current]}
                className="w-full"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
              >
                <CarouselContent>
                  {screenshots.map((screenshot) => (
                    <CarouselItem key={screenshot.id}>
                      <div className="space-y-4">
                        <Badge variant="secondary">{screenshot.badge}</Badge>
                        <div className="browser-mockup bg-card rounded-lg overflow-hidden shadow-2xl border">
                          <img 
                            src={screenshot.image} 
                            alt={screenshot.title}
                            className="w-full h-auto"
                            loading={screenshot.id === 'dashboard' ? 'eager' : 'lazy'}
                            fetchPriority={screenshot.id === 'dashboard' ? 'high' : 'auto'}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{screenshot.title}</h3>
                          <p className="text-sm text-muted-foreground">{screenshot.description}</p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to streamline your quoting process and grow your business
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx}>
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

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Quote-it AI?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform how you create and manage quotes
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
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

      {/* Interactive Screenshots Section */}
      <section id="screenshots" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <MousePointerClick className="h-3 w-3 mr-1" />
              Interactive Preview
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See Quote-it AI in Action</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore the intuitive interface designed for speed and simplicity
            </p>
          </div>
          
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8 h-auto">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
              <TabsTrigger value="quotes" className="text-xs sm:text-sm">Quotes</TabsTrigger>
              <TabsTrigger value="new-quote" className="text-xs sm:text-sm">Create</TabsTrigger>
              <TabsTrigger value="customers" className="text-xs sm:text-sm">Customers</TabsTrigger>
              <TabsTrigger value="items" className="text-xs sm:text-sm">Catalog</TabsTrigger>
              <TabsTrigger value="mobile" className="text-xs sm:text-sm">Mobile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="space-y-4">
              <div className="relative max-w-6xl mx-auto">
                <div className="browser-mockup">
                  <img 
                    src="/screenshots/dashboard.png" 
                    alt="Dashboard Overview"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="quotes" className="space-y-4">
              <div className="relative max-w-6xl mx-auto">
                <div className="browser-mockup">
                  <img 
                    src="/screenshots/quotes.png" 
                    alt="Quote Management"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="new-quote" className="space-y-4">
              <div className="relative max-w-6xl mx-auto">
                <div className="browser-mockup">
                  <img 
                    src="/screenshots/new-quote.png" 
                    alt="AI-Powered Quote Creation"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="customers" className="space-y-4">
              <div className="relative max-w-6xl mx-auto">
                <div className="browser-mockup">
                  <img 
                    src="/screenshots/customers.png" 
                    alt="Customer Management"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="items" className="space-y-4">
              <div className="relative max-w-6xl mx-auto">
                <div className="browser-mockup">
                  <img 
                    src="/screenshots/items.png" 
                    alt="Item Catalog"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="mobile" className="space-y-4">
              <div className="relative max-w-sm mx-auto">
                <div className="phone-mockup mx-auto">
                  <img 
                    src="/screenshots/mobile.png" 
                    alt="Mobile App"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Workflow Demonstrations */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Common Workflows Made Simple</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how Quote-it AI streamlines your daily tasks
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
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
                  <Button variant="ghost" className="w-full mt-4" onClick={() => navigate('/auth')}>
                    Try It Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <Card key={idx} className={plan.highlighted ? "border-primary shadow-lg scale-105" : ""}>
                <CardHeader>
                  {plan.highlighted && (
                    <Badge className="mb-2 w-fit">Most Popular</Badge>
                  )}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  {plan.annualPrice && (
                    <p className="text-sm text-muted-foreground mt-1">{plan.annualPrice}</p>
                  )}
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full mb-4" 
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => navigate('/auth')}
                  >
                    {plan.cta}
                  </Button>
                  <ul className="space-y-2">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Professionals</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our users have to say about Quote-it AI
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Quoting Process?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of professionals who are creating better quotes faster with Quote-it AI
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-bold">Quote-it AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Smart quote management powered by AI
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="/help" className="hover:text-primary transition-colors">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://github.com/yourusername/quote-it-ai" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="/help" className="hover:text-primary transition-colors">Guides</a></li>
                <li><a href="/help" className="hover:text-primary transition-colors">Mobile Apps</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Quote-it AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
