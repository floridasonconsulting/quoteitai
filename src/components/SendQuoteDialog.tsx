import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Quote, Customer } from '@/types';
import { Loader2, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useAI } from '@/hooks/useAI';
import { AIUpgradeDialog } from '@/components/AIUpgradeDialog';
import { sanitizeForAI, sanitizeNumber } from '@/lib/input-sanitization';

export interface EmailContent {
  subject: string;
  greeting: string;
  bodyText: string;
  closingText: string;
  includeSummary: boolean;
  customSummary?: string;
  includeShareLink: boolean;
}

interface SendQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  customer: Customer | null;
  onConfirm: (emailContent: EmailContent) => void;
}

export function SendQuoteDialog({
  open,
  onOpenChange,
  quote,
  customer,
  onConfirm
}: SendQuoteDialogProps) {
  const greeting = customer?.contactFirstName
    ? `Hello ${customer.contactFirstName},`
    : customer?.contactLastName
      ? `Hello Mr./Ms. ${customer.contactLastName},`
      : `Hello,`;

  const [subject, setSubject] = useState(`Quote #${quote.quoteNumber}: ${quote.title}`);
  const [greetingText, setGreetingText] = useState(greeting);
  const [bodyText, setBodyText] = useState(`Please find your quote #${quote.quoteNumber} for ${quote.title}.\n\nTotal: $${quote.total.toFixed(2)}\n\nPlease review and let me know if you have any questions.`);
  const [closingText, setClosingText] = useState('Best regards');
  const [includeSummary, setIncludeSummary] = useState(!!quote.executiveSummary);
  const [summary, setSummary] = useState(quote.executiveSummary || '');
  const [includeShareLink, setIncludeShareLink] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [requiredTier, setRequiredTier] = useState<'pro' | 'max'>('pro');

  // Log share token for debugging
  useEffect(() => {
    if (quote.shareToken) {
      console.log('[SendQuoteDialog] Quote has shareToken:', quote.shareToken);
      console.log('[SendQuoteDialog] Public URL:', `${window.location.origin}/quotes/public/${quote.shareToken}`);
    } else {
      console.warn('[SendQuoteDialog] ⚠️ Quote missing shareToken - public link will not work!');
    }
  }, [quote.shareToken]);

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
    onConfirm({
      subject,
      greeting: greetingText,
      bodyText,
      closingText,
      includeSummary,
      customSummary: includeSummary ? summary : undefined,
      includeShareLink,
    });
    onOpenChange(false);
  };

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
            {/* Editable Email Fields */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email-to">To</Label>
                <Input id="email-to" value={customer?.email || ''} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-greeting">Greeting</Label>
                <Input
                  id="email-greeting"
                  value={greetingText}
                  onChange={(e) => setGreetingText(e.target.value)}
                  placeholder="Hello,"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-body">Email Body</Label>
                <Textarea
                  id="email-body"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={5}
                  placeholder="Email message..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-link"
                  checked={includeShareLink}
                  onCheckedChange={(checked) => setIncludeShareLink(checked as boolean)}
                />
                <Label htmlFor="include-link" className="text-sm font-medium cursor-pointer">
                  Include "View & Download Quote" button in email
                </Label>
              </div>
            </div>

            {/* Executive Summary Section */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    className="w-full sm:w-auto"
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

            <div className="space-y-2">
              <Label htmlFor="email-closing">Closing</Label>
              <Input
                id="email-closing"
                value={closingText}
                onChange={(e) => setClosingText(e.target.value)}
                placeholder="Best regards"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="w-full sm:w-auto">
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
export default SendQuoteDialog;
