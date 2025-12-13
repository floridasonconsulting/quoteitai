import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Building2, CreditCard, Sparkles, Mail, DollarSign, ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { heroScreenshots } from "@/config/landing-media";

const heroFeatures = [
  { icon: Building2, text: "QuickBooks & Stripe integrated" },
  { icon: Sparkles, text: "AI-powered SOW drafting" },
  { icon: Mail, text: "Professional email automation" },
  { icon: DollarSign, text: "40-80% cheaper than competitors" }
];

export function HeroSection() {
  const navigate = useNavigate();
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-green-600 text-white">
                <Building2 className="h-3 w-3 mr-1" />
                QuickBooks Integrated
              </Badge>
              <Badge variant="secondary" className="bg-blue-600 text-white">
                <CreditCard className="h-3 w-3 mr-1" />
                Stripe Payments
              </Badge>
              <Badge variant="secondary" className="bg-purple-600 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                AI SOW Drafting
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Create Professional Quotes in{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Seconds
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              The only AI-native quoting platform with <strong>built-in QuickBooks & Stripe integration</strong>. Enterprise intelligence at <strong>40-80% less cost</strong> than PandaDoc, Proposify, or ServiceTitan.
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
              <Button size="lg" onClick={() => navigate("/auth")}>
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => document.getElementById("screenshots")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Play className="mr-2 h-4 w-4" />
                View Demo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required • 14-day free trial • QuickBooks & Stripe included
            </p>
          </div>
          
          <div className="relative">
            <Carousel 
              plugins={[plugin.current]}
              className="w-full"
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
            >
              <CarouselContent>
                {heroScreenshots.map((screenshot) => (
                  <CarouselItem key={screenshot.id}>
                    <div className="space-y-4">
                      <Badge variant="secondary">{screenshot.badge}</Badge>
                      <div className="browser-mockup bg-card rounded-lg overflow-hidden shadow-2xl border relative">
                        <img 
                          src={screenshot.image} 
                          alt={screenshot.title}
                          className="w-full h-auto"
                          loading={screenshot.id === "dashboard" ? "eager" : "lazy"}
                          fetchPriority={screenshot.id === "dashboard" ? "high" : "auto"}
                        />
                        {screenshot.isGif && (
                          <div className="absolute top-2 right-2 bg-black/60 rounded-full p-2">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        )}
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
  );
}