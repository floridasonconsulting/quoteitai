import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ProposalActionBarProps {
  quoteId: string;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  userEmail: string;
  userName?: string;
  onAccept: () => Promise<void>;
  onReject: (reason?: string) => Promise<void>;
  onComment?: () => void;
  className?: string;
}

export function ProposalActionBar({
  total,
  status,
  onAccept,
  onReject,
  onComment,
  className,
}: ProposalActionBarProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept();
    } finally {
      setLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    setLoading(true);
    try {
      await onReject(rejectionReason || undefined);
      setRejectDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = () => {
    if (onComment) {
      onComment();
    }
    setCommentDialogOpen(false);
    setComment('');
  };

  // Don't show if already accepted/declined
  if (status === 'accepted' || status === 'declined') {
    return null;
  }

  return (
    <>
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg",
          className
        )}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Total Cost */}
            <div>
              <p className="text-sm text-gray-600">Total Project Cost</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(total)}
              </p>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCommentDialogOpen(true)}
                className="gap-2"
              >
                <MessageSquare className="h-5 w-5" />
                Comment
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setRejectDialogOpen(true)}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={loading}
              >
                <XCircle className="h-5 w-5" />
                Decline
              </Button>

              <Button
                size="lg"
                onClick={handleAccept}
                className="gap-2 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                Approve Proposal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Proposal</DialogTitle>
            <DialogDescription>
              We'd appreciate any feedback on why this proposal doesn't meet your needs.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Optional: Let us know your concerns..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Share your thoughts or questions about this proposal.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Your comments or questions..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCommentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCommentSubmit}
              disabled={!comment.trim()}
            >
              Send Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
