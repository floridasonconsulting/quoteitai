import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function LandingHeader() {
  const navigate = useNavigate();

  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Quote-it AI" className="h-8 w-8" />
          <span className="text-xl font-bold">Quote-it AI</span>
        </div>
        <nav className="hidden md:flex gap-6">
          <button 
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} 
            className="text-sm hover:text-primary transition-colors"
          >
            Features
          </button>
          <button 
            onClick={() => document.getElementById("integrations")?.scrollIntoView({ behavior: "smooth" })} 
            className="text-sm hover:text-primary transition-colors"
          >
            Integrations
          </button>
          <button 
            onClick={() => document.getElementById("comparison")?.scrollIntoView({ behavior: "smooth" })} 
            className="text-sm hover:text-primary transition-colors"
          >
            Pricing
          </button>
          <button 
            onClick={() => navigate("/help")} 
            className="text-sm hover:text-primary transition-colors"
          >
            Help
          </button>
        </nav>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
          <Button onClick={() => navigate("/auth")}>
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}