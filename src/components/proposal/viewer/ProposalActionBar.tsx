import { motion } from "framer-motion";
import { MessageSquare, ThumbsDown, CheckCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ProposalActionBarProps {
  totalAmount: number;
  currency: string;
  onComment: () => void;
  onDecline: () => void;
  onAccept: () => void;
  isProcessing?: boolean;
}

/**
 * Sticky Action Bar (Bottom Footer)
 * Glassmorphism style with live total and action buttons
 */
export function ProposalActionBar({
  totalAmount,
  currency,
  onComment,
  onDecline,
  onAccept,
  isProcessing = false,
}: ProposalActionBarProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 dark:border-gray-800"
      style={{
        backdropFilter: "blur(20px)",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Total Investment */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
            <p className="text-[10px] md:text-sm uppercase tracking-widest text-muted-foreground font-bold">Total Investment</p>
            <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-tight">
              {formatCurrency(totalAmount)}
            </p>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center justify-center w-full sm:w-auto gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={onComment}
              disabled={isProcessing}
              className="flex-1 sm:flex-none gap-2 bg-white/50 border-gray-300"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">Comment</span>
              <span className="xs:hidden">Chat</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onDecline}
              disabled={isProcessing}
              className="flex-1 sm:flex-none gap-2 text-red-600 border-red-200 bg-red-50/50 hover:bg-red-50 hover:text-red-700"
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">Decline</span>
              <span className="xs:hidden">Reject</span>
            </Button>

            <Button
              size="lg"
              onClick={onAccept}
              disabled={isProcessing}
              className="flex-[2] sm:flex-none gap-2 text-white shadow-xl hover:opacity-90 active:scale-95 transition-all px-4 sm:px-8"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="sm:inline">Approve</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}