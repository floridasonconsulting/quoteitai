import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, Zap, MousePointer2 } from "lucide-react";

export function MotionProposalSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const x = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [0.8, 1]);

    return (
        <section ref={containerRef} className="py-32 overflow-hidden bg-slate-950 text-white relative">
            {/* Background elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8">
                        <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-4 py-1.5 text-xs font-black uppercase tracking-widest">
                            Proposal Motion Experience
                        </Badge>
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tighter">
                            Stop Sending PDFs.<br />
                            <span className="text-indigo-400">Start Sending Experiences.</span>
                        </h2>
                        <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
                            Static documents belong in the 90s. QuoteIt proposals are living, breathing sales engines that track every scroll, every hover, and every hesitation.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-wide text-sm mb-1">Dwell Time Heatmaps</h3>
                                    <p className="text-xs text-slate-500">Know exactly where clients linger and what parts they skip.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-wide text-sm mb-1">Real-time Telemetry</h3>
                                    <p className="text-xs text-slate-500">Get notified the second they open your proposal.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-wide text-sm mb-1">The AI Closer</h3>
                                    <p className="text-xs text-slate-500">Auto-generate follows-ups based on behavioral data.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <MousePointer2 className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-wide text-sm mb-1">Dynamic Interaction</h3>
                                    <p className="text-xs text-slate-500">Cinematic headers and responsive layouts that WOW.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative">
                        <motion.div
                            style={{ opacity, scale, y: x }}
                            className="relative aspect-[3/4] md:aspect-[4/5] bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden group"
                        >
                            {/* Proposal Mockup Content */}
                            <div className="absolute inset-x-0 top-0 h-48 md:h-64 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2670&auto=format&fit=crop"
                                    alt="Cinematic Header"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-slate-900" />
                            </div>

                            <div className="relative pt-32 md:pt-48 px-8 space-y-6">
                                <div className="space-y-2">
                                    <div className="h-1 w-12 bg-indigo-500 rounded-full" />
                                    <h4 className="text-2xl md:text-4xl font-black uppercase tracking-tight">Luxury Pool Renovation</h4>
                                </div>

                                <div className="space-y-4 pt-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="h-4 w-full bg-slate-800 rounded-lg animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                                            <div className="h-4 w-2/3 bg-slate-800/50 rounded-lg animate-pulse" style={{ animationDelay: `${i * 250}ms` }} />
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-8 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Investment</p>
                                        <p className="text-3xl font-black text-indigo-400">$64,250.00</p>
                                    </div>
                                    <div className="h-12 w-32 bg-indigo-500 rounded-2xl flex items-center justify-center font-black uppercase tracking-widest text-xs">
                                        Sign Now
                                    </div>
                                </div>
                            </div>

                            {/* Floating Behavioral Badges */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute top-1/2 -right-8 bg-white text-slate-950 p-4 rounded-2xl shadow-2xl border border-slate-200 z-20 hidden md:block"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                    <p className="text-[10px] font-black uppercase">Live: Client is viewing Scope</p>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity }}
                                className="absolute bottom-1/4 -left-12 bg-slate-800 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 z-20 hidden md:block"
                            >
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase">Lingering Detected</p>
                                        <p className="text-[9px] text-slate-400">Exclusions Section (84s)</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
