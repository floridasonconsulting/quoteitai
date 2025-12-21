import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { interactiveScreenshots } from "@/config/landing-media";
import { MousePointerClick, Play } from "lucide-react";

export function ScreenshotsSection() {
  const section = useIntersectionObserver<HTMLElement>({ threshold: 0.1 });

  return (
    <section
      id="screenshots"
      ref={section.ref}
      className={`py-24 bg-background relative overflow-hidden transition-all duration-1000 ${section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-20 space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1">
            <MousePointerClick className="h-3 w-3 mr-2" />
            Interactive Preview
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase italic">
            Advanced <span className="text-primary not-italic">Interface</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Engineered for high-velocity operations and zero-latency decision making.
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-12 h-auto bg-muted/50 p-2 border border-border rounded-2xl">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all">Dashboard</TabsTrigger>
            <TabsTrigger value="quotes" className="text-xs sm:text-sm h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all">Quotes</TabsTrigger>
            <TabsTrigger value="new-quote" className="text-xs sm:text-sm h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all">Create</TabsTrigger>
            <TabsTrigger value="email-editor" className="text-xs sm:text-sm h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all">Email</TabsTrigger>
            <TabsTrigger value="customers" className="text-xs sm:text-sm h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all">Customers</TabsTrigger>
            <TabsTrigger value="items" className="text-xs sm:text-sm h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all">Catalog</TabsTrigger>
            <TabsTrigger value="mobile" className="text-xs sm:text-sm h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all">Mobile</TabsTrigger>
          </TabsList>

          {interactiveScreenshots.map((screenshot) => (
            <TabsContent key={screenshot.id} value={screenshot.id} className="space-y-4 focus-visible:outline-none outline-none">
              <div className={`relative ${screenshot.id === "mobile" ? "max-w-sm" : "max-w-6xl"} mx-auto`}>
                <div className={`relative ${screenshot.id === "mobile" ? "phone-mockup" : "browser-mockup"} shadow-2xl shadow-primary/10 border border-primary/20 p-2 bg-primary/5 rounded-3xl transition-all duration-700`}>
                  <div className="relative overflow-hidden rounded-2xl border border-primary/20">
                    <img
                      src={screenshot.image}
                      alt={screenshot.description}
                      className="w-full h-auto grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                      loading="lazy"
                    />
                    {screenshot.isGif && (
                      <div className="absolute top-2 right-2 bg-primary/80 backdrop-blur-md rounded-full p-2 border border-white/20">
                        <Play className="h-4 w-4 text-primary-foreground fill-current" />
                      </div>
                    )}
                  </div>
                </div>
                {screenshot.badge && (
                  <div className="mt-6 text-center">
                    <Badge variant="outline" className="border-primary/20 text-primary uppercase font-black text-[10px] tracking-widest px-4 py-1">{screenshot.badge}</Badge>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
