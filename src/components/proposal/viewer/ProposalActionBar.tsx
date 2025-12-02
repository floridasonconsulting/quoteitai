import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  authorName?: string;
  authorEmail: string;
  commentText: string;
  createdAt: string;
  isInternal: boolean;
}

interface ProposalActionBarProps {
  quoteId: string;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  userEmail: string;
  userName?: string;
  onAccept: () => Promise<void>;
  onReject: (reason?: string) => Promise<void>;
  className?: string;
}

export function ProposalActionBar({ 
  quoteId, 
  total, 
  status, 
  userEmail,
  userName,
  onAccept, 
  onReject,
  className 
}: ProposalActionBarProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('proposal_comments')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComments(data.map(c => ({
        id: c.id,
        authorName: c.author_name,
        authorEmail: c.author_email,
        commentText: c.comment_text,
        createdAt: c.created_at,
        isInternal: c.is_internal
      })));
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('proposal_comments')
        .insert({
          quote_id: quoteId,
          author_email: userEmail,
          author_name: userName,
          comment_text: newComment.trim(),
          is_internal: false
        });

      if (error) throw error;

      // Trigger notification to sales rep
      await supabase.functions.invoke('send-quote-notification', {
        body: {
          quoteId,
          type: 'comment',
          message: `New comment from ${userName || userEmail}: ${newComment.slice(0, 100)}...`
        }
      });

      toast.success('Comment added');
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept();
      toast.success('Proposal accepted! The sender will be notified.');
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Failed to accept proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(rejectReason.trim() || undefined);
      setRejectDialogOpen(false);
      setRejectReason('');
      toast.success('Proposal declined. The sender will be notified.');
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error('Failed to decline proposal');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isReadOnly = status === 'accepted' || status === 'declined';

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-2xl",
      className
    )}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Left: Total */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="text-2xl font-bold">{formatCurrency(total)}</span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Comment Button */}
          <Sheet open={commentsOpen} onOpenChange={(open) => {
            setCommentsOpen(open);
            if (open) loadComments();
          }}>
            <SheetTrigger asChild>
              <Button variant="outline" size="default" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Comment</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Comments</SheetTitle>
                <SheetDescription>
                  Communicate with the sales representative
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* Comment History */}
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {loadingComments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No comments yet. Start the conversation!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {comment.authorName || comment.authorEmail}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.commentText}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* New Comment Input */}
                <div className="space-y-3 pt-4 border-t">
                  <Textarea
                    placeholder="Add a comment or question..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    disabled={loading}
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={loading || !newComment.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Send Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Reject Button */}
          {!isReadOnly && (
            <>
              <Button 
                variant="secondary" 
                size="default"
                onClick={() => setRejectDialogOpen(true)}
                disabled={loading}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Reject</span>
              </Button>

              <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Decline Proposal</DialogTitle>
                    <DialogDescription>
                      Please let us know why you're declining (optional)
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="Reason for declining..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleReject} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Declining...
                        </>
                      ) : (
                        'Decline Proposal'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* Accept Button */}
          {!isReadOnly && (
            <Button 
              size="default"
              onClick={handleAccept}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Accept Proposal</span>
                  <span className="sm:hidden">Accept</span>
                </>
              )}
            </Button>
          )}

          {/* Status Badge (if accepted/rejected) */}
          {isReadOnly && (
            <div className={cn(
              "px-4 py-2 rounded-full font-medium text-sm",
              status === 'accepted' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            )}>
              {status === 'accepted' ? 'Accepted' : 'Declined'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
