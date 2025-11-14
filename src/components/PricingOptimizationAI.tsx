import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAI } from '@/hooks/useAI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIButton } from './AIButton';
import { AIUpgradeDialog } from './AIUpgradeDialog';
import { TrendingUp } from 'lucide-react';
import { Quote, Customer, QuoteItem } from '@/types';
import { sanitizeForAI } from '@/lib/input-sanitization';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PricingOptimizationAIProps {
  quote: {
    items: QuoteItem[];
    total: number;
  };
  customer: Customer | null;
}

export function PricingOptimizationAI({ quote, customer }: PricingOptimizationAIProps) {
  const { userRole } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ requiredTier: 'pro' | 'max' } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [showResultDialog, setShowResultDialog] = useState(false);

  const pricingAI = useAI('pricing_optimization', {
    onSuccess: (content) => {
      setAnalysisResult(content);
      setShowResultDialog(true);
    },
    onUpgradeRequired: (requiredTier) => {
      setUpgradeInfo({ requiredTier });
      setShowUpgradeDialog(true);
    }
  });

  const handleAnalyze = async () => {
    if (userRole !== 'max' && userRole !== 'admin') {
      setUpgradeInfo({ requiredTier: 'max' });
      setShowUpgradeDialog(true);
      return;
    }

    if (!quote.items.length) {
      return;
    }

    const itemsData = quote.items.map(item => ({
      name: sanitizeForAI(item.name),
      description: sanitizeForAI(item.description || ''),
      quantity: item.quantity,
      price: item.price,
      total: item.total
    }));

    const customerName = customer ? sanitizeForAI(customer.name) : 'Customer';

    const prompt = `Analyze the pricing for this quote and provide optimization recommendations:

Customer: ${customerName}
Quote Total: $${quote.total.toFixed(2)}

Items:
${JSON.stringify(itemsData, null, 2)}

Provide a comprehensive pricing analysis covering:
1. Market Position: How does this pricing compare to typical market rates?
2. Margin Optimization: Where can we improve profitability while staying competitive?
3. Bundling Strategy: Should we bundle services for better value perception?
4. Psychology: What pricing tactics could increase acceptance?

Format your response as detailed analysis with specific recommendations and potential price adjustments.`;

    await pricingAI.generate(prompt, { items: itemsData, total: quote.total, customerName });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Pricing Optimization
            {(userRole === 'free' || userRole === 'pro') && (
              <span className="text-xs font-normal text-muted-foreground">(Max AI)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered pricing analysis and recommendations
          </p>
          <AIButton
            onClick={handleAnalyze}
            isLoading={pricingAI.isLoading}
            disabled={!quote.items.length}
            className="w-full"
          >
            Analyze Pricing
          </AIButton>
        </CardContent>
      </Card>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Pricing Optimization Analysis
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                {analysisResult}
              </pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="pricing_optimization"
        requiredTier={upgradeInfo?.requiredTier || 'max'}
      />
    </>
  );
}
