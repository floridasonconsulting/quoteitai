import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AIButton } from '@/components/AIButton';
import { useAI } from '@/hooks/useAI';
import { useAuth } from '@/contexts/AuthContext';
import { AIUpgradeDialog } from '@/components/AIUpgradeDialog';
import { Quote, Customer } from '@/types';
import { Sparkles } from 'lucide-react';
import { sanitizeForAI, sanitizeNumber } from '@/lib/input-sanitization';

interface QuoteSummaryAIProps {
  quote: Quote;
  customer: Customer | null;
  onSummaryGenerated?: (summary: string) => void;
}

export function QuoteSummaryAI({ quote, customer, onSummaryGenerated }: QuoteSummaryAIProps) {
  const [summary, setSummary] = useState(quote.executiveSummary || '');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [requiredTier, setRequiredTier] = useState<'pro' | 'max'>('pro');
  const { userRole } = useAuth();

  const summaryAI = useAI('quote_summary', {
    onSuccess: (content) => {
      setSummary(content);
      onSummaryGenerated?.(content);
    },
    onUpgradeRequired: (tier) => {
      setRequiredTier(tier);
      setShowUpgradeDialog(true);
    },
  });

  const handleSummaryChange = (value: string) => {
    setSummary(value);
    onSummaryGenerated?.(value);
  };

  const generateSummary = async () => {
    // Client-side tier check for instant feedback
    if (userRole === 'free') {
      setRequiredTier('pro');
      setShowUpgradeDialog(true);
      return;
    }

    const sanitizedCustomerName = sanitizeForAI(customer?.name, 100) || 'Customer';
    const sanitizedTitle = sanitizeForAI(quote.title, 200);
    const itemCount = quote.items.length;
    const total = sanitizeNumber(quote.total);

    const context = {
      customerName: sanitizedCustomerName,
      quoteTitle: sanitizedTitle,
      itemCount,
      total,
      items: quote.items.map(item => ({
        name: sanitizeForAI(item.name, 100),
        quantity: item.quantity,
      })),
    };

    const prompt = `Generate an executive summary for this quote:

Title: ${sanitizedTitle}
Customer: ${sanitizedCustomerName}
Items: ${itemCount} items
Total Investment: $${total}

Key Items: ${quote.items.slice(0, 3).map(i => sanitizeForAI(i.name, 50)).join(', ')}`;

    const result = await summaryAI.generate(prompt, context);
    
    // Check if upgrade is required
    if (result && typeof result === 'object' && 'needsUpgrade' in result) {
      setRequiredTier(result.requiredTier);
      setShowUpgradeDialog(true);
    }
  };

  return (
    <>
      {!summary && !summaryAI.isLoading ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Executive Summary
            </CardTitle>
            <CardDescription>
              Generate an AI-powered executive summary to highlight the value of this quote
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIButton
              onClick={generateSummary}
              isLoading={summaryAI.isLoading}
              size="default"
              className="w-full"
            >
              Generate Executive Summary
            </AIButton>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={summary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              rows={4}
              className="resize-none"
              placeholder="AI-generated summary will appear here..."
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateSummary}
                disabled={summaryAI.isLoading}
              >
                Regenerate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(summary);
                }}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="quote_summary"
        requiredTier={requiredTier}
      />
    </>
  );
}
