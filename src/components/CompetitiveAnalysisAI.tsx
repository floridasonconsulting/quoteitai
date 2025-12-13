
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAI } from '@/hooks/useAI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AIButton } from './AIButton';
import { AIUpgradeDialog } from './AIUpgradeDialog';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Quote } from '@/types';
import { sanitizeForAI } from '@/lib/input-sanitization';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CompetitiveAnalysisAIProps {
  quote?: Quote;
}

export function CompetitiveAnalysisAI({ quote }: CompetitiveAnalysisAIProps) {
  const { userRole } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ requiredTier: 'pro' | 'max' } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [industry, setIndustry] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [serviceType, setServiceType] = useState('');

  const analysisAI = useAI('competitive_analysis', {
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

    if (!industry.trim() || !serviceType.trim()) {
      toast.error('Please fill in industry and service type');
      return;
    }

    const sanitizedIndustry = sanitizeForAI(industry);
    const sanitizedCompetitors = sanitizeForAI(competitors);
    const sanitizedServiceType = sanitizeForAI(serviceType);
    const quoteTotal = quote?.total || 0;

    const prompt = `Conduct a competitive analysis for the following business scenario:

Industry: ${sanitizedIndustry}
Service Type: ${sanitizedServiceType}
${sanitizedCompetitors ? `Known Competitors: ${sanitizedCompetitors}` : ''}
${quoteTotal > 0 ? `Current Quote Total: $${quoteTotal.toFixed(2)}` : ''}

Provide a comprehensive competitive analysis covering:

1. **Market Overview**
   - Industry trends and dynamics
   - Market size and growth projections
   - Key success factors

2. **Competitive Landscape**
   - Major competitors and their positioning
   - Typical pricing ranges in the market
   - Competitor strengths and weaknesses

3. **Differentiation Opportunities**
   - How to stand out from competitors
   - Unique value propositions to emphasize
   - Service bundles that competitors don't offer

4. **Pricing Strategy**
   - Competitive pricing benchmarks
   - Price positioning recommendations (premium/value/budget)
   - Bundling and packaging strategies

5. **Win Strategies**
   - Key messaging to beat competitors
   - Common objections and how to overcome them
   - Tactics for higher close rates

Format as a detailed strategic analysis with actionable recommendations.`;

    await analysisAI.generate(prompt, {
      industry: sanitizedIndustry,
      competitors: sanitizedCompetitors,
      serviceType: sanitizedServiceType,
      quoteTotal
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            AI Competitive Analysis
            {(userRole === 'free' || userRole === 'pro' || userRole === 'business') && (
              <Badge variant="secondary" className="ml-auto">Max AI</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Industry *</Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., HVAC, Plumbing, Electrical, Construction..."
            />
          </div>
          <div className="space-y-2">
            <Label>Service Type *</Label>
            <Input
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="e.g., Residential HVAC Installation, Commercial Plumbing..."
            />
          </div>
          <div className="space-y-2">
            <Label>Known Competitors (Optional)</Label>
            <Textarea
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="List competitor names or companies you compete against..."
              rows={2}
            />
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              AI will analyze your competitive landscape, identify differentiation opportunities, and provide strategic pricing recommendations.
            </p>
          </div>
          <AIButton
            onClick={handleAnalyze}
            isLoading={analysisAI.isLoading}
            disabled={!industry.trim() || !serviceType.trim()}
            className="w-full"
          >
            Generate Competitive Analysis
          </AIButton>
        </CardContent>
      </Card>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Competitive Analysis Report
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg font-sans">
                {analysisResult}
              </pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="competitive_analysis"
        requiredTier={upgradeInfo?.requiredTier || 'max'}
      />
    </>
  );
}
