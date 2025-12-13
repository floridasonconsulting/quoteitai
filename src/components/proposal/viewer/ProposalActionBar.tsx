import { motion } from "framer-motion";
import { MessageSquare, ThumbsDown, CheckCircle } from "lucide-react";
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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800"
      style={{
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Total Investment */}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Investment</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={onComment}
              disabled={isProcessing}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Comment</span>
            </Button>

            <Separator orientation="vertical" className="h-10" />

            <Button
              variant="outline"
              size="lg"
              onClick={onDecline}
              disabled={isProcessing}
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="hidden sm:inline">Decline</span>
            </Button>

            <Button
              size="lg"
              onClick={onAccept}
              disabled={isProcessing}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              <CheckCircle className="w-4 h-4" />
              Approve Proposal
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}