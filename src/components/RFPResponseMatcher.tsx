
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAI } from '@/hooks/useAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIButton } from './AIButton';
import { AIUpgradeDialog } from './AIUpgradeDialog';
import { FileSearch, CheckCircle2, AlertCircle } from 'lucide-react';
import { Quote, Item } from '@/types';
import { sanitizeForAI } from '@/lib/input-sanitization';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface RFPMatch {
  confidence: 'high' | 'medium' | 'low';
  matchedItems: {
    itemName: string;
    itemId?: string;
    reasoning: string;
    suggestedQuantity: number;
  }[];
  missingCapabilities: string[];
  recommendedApproach: string;
  estimatedTotal: number;
  winProbability: string;
}

interface RFPResponseMatcherProps {
  availableItems: Item[];
  onCreateQuote?: (items: { itemId: string; quantity: number }[]) => void;
}

export function RFPResponseMatcher({ availableItems, onCreateQuote }: RFPResponseMatcherProps) {
  const { userRole } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [rfpContent, setRfpContent] = useState('');
  const [matchResult, setMatchResult] = useState<RFPMatch | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const rfpAI = useAI('rfp_response_matching', {
    onSuccess: (content) => {
      try {
        const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed: RFPMatch = JSON.parse(cleaned);
        setMatchResult(parsed);
        setShowResultDialog(true);
      } catch (error) {
        console.error('Failed to parse RFP match:', error);
        toast.error('Failed to parse AI response');
      }
    },
    onUpgradeRequired: () => {
      setShowUpgradeDialog(true);
    }
  });

  const handleAnalyzeRFP = async () => {
    if (userRole !== 'max' && userRole !== 'admin') {
      setShowUpgradeDialog(true);
      return;
    }

    if (!rfpContent.trim()) {
      toast.error('Please paste RFP content');
      return;
    }

    const sanitizedRFP = sanitizeForAI(rfpContent, 10000);
    if (!sanitizedRFP) {
      toast.error('Invalid RFP content');
      return;
    }

    const itemsCatalog = availableItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.finalPrice,
      units: item.units
    }));

    const prompt = `Analyze this RFP/Project Request and match it to available services:

RFP Content:
${sanitizedRFP}

Available Services Catalog:
${JSON.stringify(itemsCatalog, null, 2)}

Provide a comprehensive RFP response analysis in JSON format:
{
  "confidence": "high|medium|low",
  "matchedItems": [
    {
      "itemName": "exact name from catalog",
      "itemId": "id from catalog",
      "reasoning": "why this item matches the RFP requirement",
      "suggestedQuantity": 1
    }
  ],
  "missingCapabilities": ["list any requirements we can't fulfill"],
  "recommendedApproach": "strategic approach to win this RFP",
  "estimatedTotal": 0,
  "winProbability": "percentage chance of winning (e.g., '75%')"
}

Match RFP requirements to our catalog items, identify gaps, and provide a strategic response plan.`;

    await rfpAI.generate(prompt, { rfpContent: sanitizedRFP, itemsCatalog });
  };

  const handleCreateQuoteFromRFP = () => {
    if (!matchResult || !onCreateQuote) return;

    const items = matchResult.matchedItems
      .filter(item => item.itemId)
      .map(item => ({
        itemId: item.itemId!,
        quantity: item.suggestedQuantity
      }));

    onCreateQuote(items);
    setShowResultDialog(false);
    toast.success('Quote template created from RFP');
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-purple-500" />
            RFP Response Matcher
            {(userRole === 'free' || userRole === 'pro' || userRole === 'business') && (
              <Badge variant="secondary" className="ml-auto">Max AI</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Analyze RFPs and automatically match them to your services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>RFP / Project Request Content</Label>
            <Textarea
              value={rfpContent}
              onChange={(e) => setRfpContent(e.target.value)}
              placeholder="Paste the RFP, project request, or requirements document here..."
              rows={10}
              maxLength={10000}
            />
            <p className="text-xs text-muted-foreground">
              {rfpContent.length}/10,000 characters
            </p>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">AI will analyze and provide:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Matched services from your catalog</li>
                  <li>Suggested quantities and pricing</li>
                  <li>Gaps in your capabilities</li>
                  <li>Strategic approach to win</li>
                  <li>Win probability estimate</li>
                </ul>
              </div>
            </div>
          </div>

          <AIButton
            onClick={handleAnalyzeRFP}
            isLoading={rfpAI.isLoading}
            disabled={!rfpContent.trim()}
            className="w-full"
          >
            Analyze RFP & Match Services
          </AIButton>
        </CardContent>
      </Card>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-purple-500" />
              RFP Analysis Results
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            {matchResult && (
              <div className="space-y-6">
                {/* Confidence & Win Probability */}
                <div className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium mb-1">Match Confidence</p>
                    <Badge variant="outline" className={getConfidenceColor(matchResult.confidence)}>
                      {matchResult.confidence.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Win Probability</p>
                    <p className="text-2xl font-bold text-primary">{matchResult.winProbability}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Estimated Total</p>
                    <p className="text-2xl font-bold">${matchResult.estimatedTotal.toFixed(2)}</p>
                  </div>
                </div>

                {/* Matched Items */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Matched Services ({matchResult.matchedItems.length})
                  </h3>
                  <div className="space-y-3">
                    {matchResult.matchedItems.map((item, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <CardTitle className="text-sm">{item.itemName}</CardTitle>
                          <CardDescription className="text-xs">
                            Suggested Quantity: {item.suggestedQuantity}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{item.reasoning}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Missing Capabilities */}
                {matchResult.missingCapabilities.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Gaps to Address ({matchResult.missingCapabilities.length})
                    </h3>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                      <ul className="space-y-2">
                        {matchResult.missingCapabilities.map((gap, idx) => (
                          <li key={idx} className="text-sm text-orange-700 dark:text-orange-300">
                            • {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Recommended Approach */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Strategic Approach</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{matchResult.recommendedApproach}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleCreateQuoteFromRFP} className="flex-1">
                    Create Quote from This RFP
                  </Button>
                  <Button variant="outline" onClick={() => setShowResultDialog(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="rfp_response_matching"
        requiredTier="max"
      />
    </>
  );
}
