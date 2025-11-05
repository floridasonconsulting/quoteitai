import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Quote, Customer } from '@/types';
import { Loader2, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useAI } from '@/hooks/useAI';
import { AIUpgradeDialog } from '@/components/AIUpgradeDialog';
import { sanitizeForAI, sanitizeNumber } from '@/lib/input-sanitization';

interface SendQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  customer: Customer | null;
  onConfirm: (includeSummary: boolean, customSummary?: string) => void;
}

export function SendQuoteDialog({ 
  open, 
  onOpenChange, 
  quote, 
  customer,
  onConfirm 
}: SendQuoteDialogProps) {
  const [includeSummary, setIncludeSummary] = useState(!!quote.executiveSummary);
  const [summary, setSummary] = useState(quote.executiveSummary || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [requiredTier, setRequiredTier] = useState<'pro' | 'max'>('pro');

  const summaryAI = useAI('quote_summary', {
    onSuccess: (content) => {
      setSummary(content);
      setIncludeSummary(true);
    },
    onUpgradeRequired: (tier) => {
      setRequiredTier(tier);
      setShowUpgradeDialog(true);
    },
  });

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    const sanitizedQuote = {
      title: sanitizeForAI(quote.title),
      items: quote.items.map(item => ({
        name: sanitizeForAI(item.name),
        description: sanitizeForAI(item.description),
        quantity: sanitizeNumber(item.quantity),
        price: sanitizeNumber(item.price),
      })),
      total: sanitizeNumber(quote.total),
      notes: sanitizeForAI(quote.notes || ''),
    };

    const sanitizedCustomer = customer ? {
      name: sanitizeForAI(customer.name),
      contactFirstName: sanitizeForAI(customer.contactFirstName || ''),
      contactLastName: sanitizeForAI(customer.contactLastName || ''),
    } : null;

    const prompt = `Generate a professional executive summary for this quote that highlights the key value propositions and benefits to the customer.`;
    const context = {
      quote: sanitizedQuote,
      customer: sanitizedCustomer,
    };

    await summaryAI.generate(prompt, context);
    setIsGenerating(false);
  };

  const handleConfirm = () => {
    onConfirm(includeSummary, includeSummary ? summary : undefined);
    onOpenChange(false);
  };

  const greeting = customer?.contactFirstName 
    ? `Hello ${customer.contactFirstName},`
    : customer?.contactLastName
    ? `Hello Mr./Ms. ${customer.contactLastName},`
    : `Hello,`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Quote to Customer</DialogTitle>
            <DialogDescription>
              Review the email content before sending to {customer?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Email Preview */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="space-y-2 text-sm">
                <p><strong>To:</strong> {customer?.email}</p>
                <p><strong>Subject:</strong> Quote #{quote.quoteNumber}: {quote.title}</p>
                <div className="border-t pt-3 mt-3">
                  <div className="whitespace-pre-wrap">
                    {greeting}
                    {'\n\n'}
                    Please find your quote #{quote.quoteNumber} for {quote.title}.
                    {'\n\n'}
                    Total: ${quote.total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-summary"
                    checked={includeSummary}
                    onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                  />
                  <Label htmlFor="include-summary" className="text-sm font-medium cursor-pointer">
                    Include AI Executive Summary in email
                  </Label>
                </div>
                {!summary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSummary}
                    disabled={isGenerating || summaryAI.isLoading}
                  >
                    {(isGenerating || summaryAI.isLoading) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Summary
                      </>
                    )}
                  </Button>
                )}
              </div>

              {summary && (
                <div className="space-y-2">
                  <Label htmlFor="summary-edit">Executive Summary</Label>
                  <Textarea
                    id="summary-edit"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={6}
                    className="resize-none"
                    placeholder="Executive summary will appear here..."
                    disabled={!includeSummary}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can edit the summary before sending
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="quote_summary"
        requiredTier={requiredTier}
      />
    </>
  );
}
