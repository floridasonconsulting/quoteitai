import { useNavigate } from "react-router-dom";

export function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border py-16 bg-background transition-colors duration-500">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
              <div className="h-7 w-7 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-black text-sm">Q</span>
              </div>
              <span className="text-lg font-black tracking-tighter text-foreground uppercase">QUOTE<span className="text-primary">IT</span></span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Precision estimate engineering powered by solar-adaptive intelligence.
              Built for high-performance service teams.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-6 uppercase tracking-widest text-xs">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#integrations" className="hover:text-primary transition-colors">
                  Integrations
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/help" className="hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-6 uppercase tracking-widest text-xs">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="/help" className="hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/help" className="hover:text-primary transition-colors">
                  Guides
                </a>
              </li>
              <li>
                <a href="/help" className="hover:text-primary transition-colors">
                  Mobile Apps
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-6 uppercase tracking-widest text-xs">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <button
                  onClick={() => navigate("/privacy")}
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/terms")}
                  className="hover:text-primary transition-colors"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-widest">
          <p>© 2025 Quote-it AI. All rights reserved.</p>
          <p>Handcrafted by Floridason Consulting</p>
        </div>
      </div>
    </footer>
  );
}
