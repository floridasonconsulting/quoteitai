import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function LandingHeader() {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-xl z-50 transition-colors duration-500">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
          <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.4)] group-hover:scale-110 transition-transform">
            <span className="text-primary-foreground font-black text-xl">Q</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-foreground uppercase">QUOTE<span className="text-primary">IT</span> <span className="text-muted-foreground font-light px-1 opacity-50 lowercase">v1.0</span></span>
        </div>
        <nav className="hidden md:flex gap-8">
          {["Features", "Integrations", "Benefits", "Pricing"].map((item) => (
            <button
              key={item}
              onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:glow-primary"
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="flex gap-4">
          <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-muted" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
          <Button className="bg-brand-pro text-primary-foreground hover:opacity-90 shadow-[0_0_15px_hsl(var(--primary)/0.3)] font-bold px-6" onClick={() => navigate("/auth")}>
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
