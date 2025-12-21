import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Shield, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/GlassCard";
import { conversationService } from "@/lib/services/conversation-service";
import { toast } from "sonner";

interface Props {
    quoteId: string;
    organizationId: string;
    currentSectionId: string;
    sectionTitle: string;
}

const CONTEXT_MESSAGES: Record<string, string> = {
    'hero': "Have a question about the project overview?",
    'categoryGroup': "Need more detail on these items?",
    'scopeOfWork': "Want to clarify anything in the scope of work?",
    'investment': "Want to discuss financing or price protection?",
    'legal': "Have a question about our terms and conditions?",
    'default': "I'm here to help - want to discuss this section?"
};

export function ProposalAssistant({ quoteId, organizationId, currentSectionId, sectionTitle }: Props) {
    const [isVisible, setIsVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [responses, setResponses] = useState<any[]>([]);

    const dwellTimer = useRef<NodeJS.Timeout | null>(null);
    const currentSection = useRef(currentSectionId);

    // Dwell timer logic
    useEffect(() => {
        // Reset if section changes
        if (currentSection.current !== currentSectionId) {
            if (dwellTimer.current) clearTimeout(dwellTimer.current);
            setIsVisible(false);
            currentSection.current = currentSectionId;
        }

        // Start 60s timer
        dwellTimer.current = setTimeout(() => {
            setIsVisible(true);
        }, 60000);

        return () => {
            if (dwellTimer.current) clearTimeout(dwellTimer.current);
        };
    }, [currentSectionId]);

    // Subscribe to responses
    useEffect(() => {
        const channel = conversationService.subscribeToResponses(quoteId, (newConversation) => {
            if (newConversation.contractor_response) {
                setResponses(prev => [...prev, newConversation]);
                setIsVisible(true); // Ensure they see the new response
            }
        });

        return () => {
            channel.unsubscribe();
        };
    }, [quoteId]);

    const handleSubmit = async () => {
        if (!question.trim()) return;

        setIsSubmitting(true);
        try {
            await conversationService.submitQuestion({
                quote_id: quoteId,
                section_id: currentSectionId,
                client_question: question,
                organization_id: organizationId
            });
            setIsSubmitting(false);
            setIsSubmitted(true);
            setQuestion("");
            toast.success("Question sent to our team!");

            // Auto close after 3s
            setTimeout(() => {
                setIsOpen(false);
                setIsSubmitted(false);
            }, 3000);
        } catch (error) {
            setIsSubmitting(false);
            toast.error("Failed to send question");
        }
    };

    const message = CONTEXT_MESSAGES[currentSectionId] ||
        (currentSectionId.startsWith('cat-') ? CONTEXT_MESSAGES['categoryGroup'] : CONTEXT_MESSAGES['default']);

    return (
        <div className="fixed bottom-6 right-6 z-[100] pointer-events-none">
            <AnimatePresence>
                {(isVisible || responses.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="pointer-events-auto"
                    >
                        {isOpen ? (
                            <GlassCard className="w-80 p-0 overflow-hidden shadow-2xl border-indigo-500/20">
                                <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        <span className="font-bold text-sm tracking-tight">Proactive Support</span>
                                    </div>
                                    <X className="w-4 h-4 cursor-pointer hover:rotate-90 transition-transform" onClick={() => setIsOpen(false)} />
                                </div>

                                <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                                    {responses.map((resp, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="bg-slate-100 p-3 rounded-xl rounded-bl-none text-xs text-slate-600">
                                                {resp.client_question}
                                            </div>
                                            <div className="bg-indigo-50 p-3 rounded-xl rounded-br-none text-xs text-indigo-950 border border-indigo-100">
                                                <p className="font-bold mb-1 flex items-center gap-1">
                                                    <Shield className="w-3 h-3" /> Expert Response
                                                </p>
                                                {resp.contractor_response}
                                            </div>
                                        </div>
                                    ))}

                                    {!isSubmitted ? (
                                        <div className="space-y-3">
                                            <p className="text-xs text-slate-500 italic">
                                                "{message}"
                                            </p>
                                            <Textarea
                                                placeholder="Type your question..."
                                                value={question}
                                                onChange={(e) => setQuestion(e.target.value)}
                                                className="text-xs min-h-[80px] bg-slate-50/50"
                                            />
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting || !question.trim()}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs h-9"
                                            >
                                                {isSubmitting ? "Sending..." : "Send to Team"}
                                                <Send className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center space-y-2">
                                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                                <Check className="w-6 h-6" />
                                            </div>
                                            <p className="font-bold text-sm">Sent!</p>
                                            <p className="text-[10px] text-slate-500">We've been notified and will respond shortly.</p>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        ) : (
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsOpen(true)}
                                className="bg-indigo-600 text-white rounded-full p-4 shadow-xl shadow-indigo-500/30 flex items-center gap-3 cursor-pointer group border border-white/20 backdrop-blur-md"
                            >
                                <div className="relative">
                                    <MessageSquare className="w-6 h-6" />
                                    {responses.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-indigo-600" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Support</span>
                                    <span className="text-sm font-bold whitespace-nowrap">
                                        {responses.length > 0 ? "New Response" : sectionTitle} Clarification?
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
