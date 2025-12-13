import { motion } from "framer-motion";
import { CheckCircle, XCircle, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SuccessType = 'accepted' | 'declined' | 'commented';

interface ProposalSuccessStatesProps {
  type: SuccessType;
  salesRepName?: string;
  onReturn: () => void;
}

export function ProposalSuccessStates({ 
  type, 
  salesRepName = "Your Sales Representative", 
  onReturn 
}: ProposalSuccessStatesProps) {
  
  const content = {
    accepted: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      title: "Proposal Accepted!",
      message: `Thank you for your business. ${salesRepName} has been notified and will contact you shortly to discuss next steps.`,
      showConfetti: true
    },
    declined: {
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      title: "Proposal Declined",
      message: "Thank you for reviewing our proposal. We appreciate your consideration and feedback.",
      showConfetti: false
    },
    commented: {
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      title: "Feedback Sent",
      message: "Your comments have been sent successfully. We will review them and get back to you soon.",
      showConfetti: false
    }
  };

  const state = content[type];
  const Icon = state.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
    >
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${state.bgColor}`}
        >
          <Icon className={`w-12 h-12 ${state.color}`} />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-foreground mb-4"
        >
          {state.title}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-muted-foreground mb-8 leading-relaxed"
        >
          {state.message}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            variant="outline" 
            size="lg"
            onClick={onReturn}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Proposal
          </Button>
        </motion.div>

        {/* CSS-based Confetti Effect for Acceptance */}
        {state.showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
             {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'][i % 4],
                  left: `${Math.random() * 100}%`,
                  top: -20,
                }}
                animate={{
                  y: ['0vh', '100vh'],
                  x: [0, (Math.random() - 0.5) * 200],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "linear",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}