import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CreditCard, Sparkles, DollarSign, ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-24 pb-32 overflow-hidden bg-background transition-colors duration-500">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-accent/10 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center gap-3"
          >
            <Badge className="bg-primary/10 backdrop-blur-md border-primary/20 text-primary py-1 px-3">
              <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
              AI-Native Quoting
            </Badge>
            <Badge className="bg-muted backdrop-blur-md border-border text-muted-foreground py-1 px-3">
              v1.0 Now Live
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tighter text-foreground"
          >
            Draft, Quote, & Win<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient">
              At Infinite Speed
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            The market-disrupting platform for high-end trade services.
            Built-in <span className="text-foreground font-semibold">QuickBooks & Stripe</span> integration.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button size="lg" className="bg-brand-pro text-primary-foreground hover:opacity-90 h-14 px-8 text-lg font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)]" onClick={() => navigate("/auth")}>
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-border bg-card/50 backdrop-blur-md text-foreground hover:bg-muted h-14 px-8 text-lg font-semibold" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              <Play className="mr-2 h-5 w-5 fill-current" />
              Watch Demo
            </Button>
          </motion.div>
        </div>

        {/* Cinematic Browser Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 relative max-w-6xl mx-auto"
        >
          <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full scale-90 opacity-50" />
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl bg-card transition-colors duration-500 group-hover:border-primary/30">
            {/* Top Bar */}
            <div className="h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
              <div className="flex gap-1.5 font-bold">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="mx-auto bg-background rounded-md px-12 py-1 text-[10px] text-muted-foreground font-mono tracking-widest uppercase">
                quoteit.ai / dashboard
              </div>
            </div>

            {/* Content Placeholder / Video Area */}
            <div className="relative aspect-video bg-gradient-to-br from-background to-muted flex items-center justify-center group-hover:from-muted/40 transition-all cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
                alt="Product Demo"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-background/40 group-hover:bg-background/20 transition-all flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.6)] group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 text-primary-foreground fill-current" />
                </div>
              </div>

              {/* Glowing border effect */}
              <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/40 rounded-3xl transition-all duration-500" />
            </div>
          </div>

          {/* Subtle reflection below */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-20 bg-primary/20 blur-[60px] opacity-30 skew-x-12" />
        </motion.div>
      </div>
    </section>
  );
}
