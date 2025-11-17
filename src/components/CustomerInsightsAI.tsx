
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAI } from '@/hooks/useAI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AIButton } from './AIButton';
import { AIUpgradeDialog } from './AIUpgradeDialog';
import { Users, AlertCircle } from 'lucide-react';
import { Customer, Quote } from '@/types';
import { sanitizeForAI } from '@/lib/input-sanitization';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CustomerInsightsAIProps {
  customer: Customer;
  quotes: Quote[];
}

export function CustomerInsightsAI({ customer, quotes }: CustomerInsightsAIProps) {
  const { userRole } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ requiredTier: 'pro' | 'max' } | null>(null);
  const [insightsResult, setInsightsResult] = useState<string>('');
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [analysisType, setAnalysisType] = useState<'behavior' | 'preferences' | 'opportunities'>('behavior');

  const insightsAI = useAI('customer_insights', {
    onSuccess: (content) => {
      setInsightsResult(content);
      setShowResultDialog(true);
    },
    onUpgradeRequired: (requiredTier) => {
      setUpgradeInfo({ requiredTier });
      setShowUpgradeDialog(true);
    }
  });

  const handleGenerateInsights = async () => {
    if (userRole !== 'max' && userRole !== 'admin') {
      setUpgradeInfo({ requiredTier: 'max' });
      setShowUpgradeDialog(true);
      return;
    }

    if (!customer) {
      toast.error('Customer data is required');
      return;
    }

    const sanitizedCustomerName = sanitizeForAI(customer.name);
    const customerQuotes = quotes.filter(q => q.customerId === customer.id);
    
    const quoteHistory = customerQuotes.map(q => ({
      date: q.date,
      total: q.total,
      status: q.status,
      itemCount: q.items.length,
      title: sanitizeForAI(q.title, 100)
    }));

    const totalQuoted = customerQuotes.reduce((sum, q) => sum + q.total, 0);
    const acceptedQuotes = customerQuotes.filter(q => q.status === 'Accepted').length;
    const winRate = customerQuotes.length > 0 ? (acceptedQuotes / customerQuotes.length * 100).toFixed(1) : '0';

    let promptFocus = '';
    if (analysisType === 'behavior') {
      promptFocus = `Focus on analyzing this customer's buying behavior patterns, decision-making timeline, and engagement patterns.`;
    } else if (analysisType === 'preferences') {
      promptFocus = `Focus on identifying this customer's preferences for services, pricing sensitivity, and communication style.`;
    } else {
      promptFocus = `Focus on identifying upsell opportunities, cross-sell potential, and strategies to increase customer lifetime value.`;
    }

    const prompt = `Generate customer insights for the following customer profile:

Customer Name: ${sanitizedCustomerName}
Total Quotes: ${customerQuotes.length}
Accepted Quotes: ${acceptedQuotes}
Win Rate: ${winRate}%
Total Quoted Amount: $${totalQuoted.toFixed(2)}
${customer.email ? `Email: ${sanitizeForAI(customer.email)}` : ''}
${customer.phone ? `Phone: ${sanitizeForAI(customer.phone)}` : ''}

Quote History:
${JSON.stringify(quoteHistory, null, 2)}

${promptFocus}

Provide comprehensive customer insights covering:

1. **Customer Profile Analysis**
   - Buying patterns and behavior
   - Engagement level and responsiveness
   - Decision-making characteristics

2. **Value Assessment**
   - Customer lifetime value potential
   - Profitability analysis
   - Risk factors or red flags

3. **Communication Strategy**
   - Preferred communication style
   - Optimal outreach timing
   - Key messaging that resonates

4. **Growth Opportunities**
   - Upsell and cross-sell potential
   - Services they may need next
   - Relationship deepening strategies

5. **Actionable Recommendations**
   - Specific next steps to take
   - Tactics to increase win rate
   - Long-term relationship building plan

Format as a strategic customer intelligence report with specific, actionable recommendations.`;

    await insightsAI.generate(prompt, {
      customerName: sanitizedCustomerName,
      quoteHistory,
      totalQuoted,
      winRate: parseFloat(winRate),
      analysisType
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            AI Customer Insights
            {(userRole === 'free' || userRole === 'pro' || userRole === 'business') && (
              <Badge variant="secondary" className="ml-auto">Max AI</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Analysis Focus</Label>
            <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="behavior">Buying Behavior & Patterns</SelectItem>
                <SelectItem value="preferences">Preferences & Communication</SelectItem>
                <SelectItem value="opportunities">Growth Opportunities</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
            <p className="font-medium">Customer: {customer.name}</p>
            <div className="flex gap-4 text-muted-foreground">
              <span>Quotes: {quotes.filter(q => q.customerId === customer.id).length}</span>
              <span>Total: ${quotes.filter(q => q.customerId === customer.id).reduce((sum, q) => sum + q.total, 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              AI will analyze customer behavior, preferences, and quote history to provide actionable insights and growth strategies.
            </p>
          </div>
          <AIButton
            onClick={handleGenerateInsights}
            isLoading={insightsAI.isLoading}
            disabled={!customer || quotes.length === 0}
            className="w-full"
          >
            Generate Customer Insights
          </AIButton>
        </CardContent>
      </Card>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Customer Intelligence Report: {customer.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg font-sans">
                {insightsResult}
              </pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="customer_insights"
        requiredTier={upgradeInfo?.requiredTier || 'max'}
      />
    </>
  );
}
