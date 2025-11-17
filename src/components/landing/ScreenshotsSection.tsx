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
      className={`py-16 bg-muted/30 transition-all duration-700 ${
        section.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
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
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-8 h-auto">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="quotes" className="text-xs sm:text-sm">Quotes</TabsTrigger>
            <TabsTrigger value="new-quote" className="text-xs sm:text-sm">Create</TabsTrigger>
            <TabsTrigger value="email-editor" className="text-xs sm:text-sm">Email</TabsTrigger>
            <TabsTrigger value="customers" className="text-xs sm:text-sm">Customers</TabsTrigger>
            <TabsTrigger value="items" className="text-xs sm:text-sm">Catalog</TabsTrigger>
            <TabsTrigger value="mobile" className="text-xs sm:text-sm">Mobile</TabsTrigger>
          </TabsList>

          {interactiveScreenshots.map((screenshot) => (
            <TabsContent key={screenshot.id} value={screenshot.id} className="space-y-4">
              <div className={`relative ${screenshot.id === "mobile" ? "max-w-sm" : "max-w-6xl"} mx-auto`}>
                <div className={screenshot.id === "mobile" ? "phone-mockup" : "browser-mockup"}>
                  <div className="relative">
                    <img
                      src={screenshot.image}
                      alt={screenshot.description}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                    {screenshot.isGif && (
                      <div className="absolute top-2 right-2 bg-black/60 rounded-full p-2">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                {screenshot.badge && (
                  <div className="mt-4 text-center">
                    <Badge variant="secondary">{screenshot.badge}</Badge>
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