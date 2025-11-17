import { useNavigate } from "react-router-dom";

export function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Quote-it AI" className="h-5 w-5" />
              <span className="font-bold">Quote-it AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Smart quote management powered by AI with QuickBooks & Stripe integration
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
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
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
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
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
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
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Quote-it AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
