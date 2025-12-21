import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Shield, Check, ArrowRight, MousePointer2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export function ProactiveShowcase() {
    const [step, setStep] = useState(0); // 0: Idle, 1: Paused, 2: Bubble, 3: Success

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 py-1 px-3">
                            ANTICIPATE NEEDS
                        </Badge>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                            Anticipate Your Customer’s Needs—<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Automatically.</span>
                        </h2>
                        <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                            Don't wait for the phone to ring. Our AI monitors dwell time on critical sections like "Exclusions" or "Investment" and offers proactive help at the perfect psychological moment.
                        </p>

                        <div className="space-y-4">
                            {[
                                { title: "Empathy-First Triggers", desc: "Triggers help only when a customer shows hesitation." },
                                { title: "Context-Aware Assistance", desc: "Messages adapt to the specific section being viewed." },
                                { title: "Draft-then-Verify", desc: "AI drafts the perfect response for your approval." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{item.title}</h4>
                                        <p className="text-sm text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        {/* Visual Simulation Frame */}
                        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden aspect-[4/3] flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                </div>
                                <div className="px-4 py-1 bg-slate-800 rounded-full text-[10px] text-slate-500 font-mono">
                                    PROPOSAL: #QU-2024-X
                                </div>
                            </div>

                            {/* Fake Content Area */}
                            <div className="space-y-6 flex-1">
                                <div className="h-8 bg-slate-800 rounded-md w-1/3" />
                                <div className="h-4 bg-slate-800/50 rounded-md w-full" />
                                <div className="h-4 bg-slate-800/50 rounded-md w-5/6" />

                                <div className="mt-8 border-2 border-indigo-500/30 rounded-2xl p-6 bg-indigo-500/5 relative">
                                    <div className="absolute -top-3 left-6 px-3 py-0.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-full">
                                        Active Section: Project Exclusions
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-3 bg-slate-700 rounded-md w-full" />
                                        <div className="h-3 bg-slate-700 rounded-md w-full" />
                                        <div className="h-3 bg-slate-700 rounded-md w-2/3" />
                                    </div>

                                    {/* cursor simulation */}
                                    <AnimatePresence>
                                        {step === 1 && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 200, y: 100 }}
                                                animate={{ opacity: 1, x: 150, y: 40 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute text-indigo-400 z-50 pointer-events-none"
                                            >
                                                <MousePointer2 className="w-8 h-8 fill-indigo-400" />
                                                <span className="ml-5 mt-2 inline-block px-2 py-1 bg-white text-indigo-600 text-[10px] font-bold rounded shadow-lg">
                                                    Customer lingering... 62s
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* The Bubble Pop-up */}
                            <AnimatePresence>
                                {step >= 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                        className="absolute bottom-8 right-8 z-20"
                                    >
                                        <GlassCard className="w-64 p-0 shadow-2xl border-indigo-500/50 bg-slate-900 shadow-indigo-500/20">
                                            <div className="bg-indigo-600 p-3 flex items-center gap-2 text-white">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                <span className="font-bold text-[10px] tracking-tight uppercase">Support Available</span>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                {step === 2 ? (
                                                    <>
                                                        <p className="text-[11px] text-slate-300 italic leading-relaxed">
                                                            "Have a question about our project exclusions? I'm here to clarify."
                                                        </p>
                                                        <div className="h-8 bg-slate-800 rounded-md flex items-center px-3 text-[10px] text-slate-500">
                                                            Type your question...
                                                        </div>
                                                        <div className="h-8 bg-indigo-600 rounded-md flex items-center justify-center text-[10px] text-white font-bold gap-2">
                                                            Ask Expert <ArrowRight className="w-3 h-3" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="py-2 text-center space-y-2">
                                                        <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
                                                            <Check className="w-4 h-4" />
                                                        </div>
                                                        <p className="font-bold text-xs text-white uppercase tracking-tighter">Draft sent to contractor!</p>
                                                        <p className="text-[9px] text-slate-500">We're reviewing your question now.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Reflection Glow */}
                            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full" />
                        </div>

                        {/* Floaties */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute -top-6 -right-6 h-20 w-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl z-20"
                        >
                            <MessageSquare className="w-8 h-8 text-white" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
