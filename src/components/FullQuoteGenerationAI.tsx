import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAI, AIUpgradeInfo } from '@/hooks/useAI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AIButton } from './AIButton';
import { AIUpgradeDialog } from './AIUpgradeDialog';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Item, QuoteItem, Customer } from '@/types';

interface FullQuoteGenerationAIProps {
  items: Item[];
  customers: Customer[]; // NEW: Pass customers for matching
  onQuoteGenerated: (data: {
    title: string;
    notes: string;
    summary: string;
    suggestedItems: QuoteItem[];
    customerId?: string;
  }) => void;
}

// Simple Levenshtein distance for fuzzy matching
const levenshteinDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

export function FullQuoteGenerationAI({ items, customers, onQuoteGenerated }: FullQuoteGenerationAIProps) {
  const { userRole } = useAuth();
  const [projectDescription, setProjectDescription] = useState('');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ requiredTier: 'pro' | 'max' } | null>(null);

  const quoteAI = useAI('full_quote_generation', {
    onSuccess: (content) => {
      try {
        const parsed = JSON.parse(content);

        // INTELLIGENT CUSTOMER MATCHING
        // INTELLIGENT CUSTOMER MATCHING
        let matchedCustomerId = undefined;
        if (parsed.clientName && parsed.clientName.trim() !== '') {
          const targetName = parsed.clientName.toLowerCase();

          // 1. Exact/Contains match
          const exactMatch = customers.find(c =>
            c.name.toLowerCase().includes(targetName) ||
            targetName.includes(c.name.toLowerCase())
          );

          if (exactMatch) {
            matchedCustomerId = exactMatch.id;
          } else {
            // 2. Fuzzy match
            let bestMatch: Customer | null = null;
            let minDistance = Infinity;

            customers.forEach(c => {
              const distance = levenshteinDistance(c.name.toLowerCase(), targetName);
              // Threshold: roughly 40% difference allowed or max 3-4 chars
              const threshold = Math.max(3, Math.floor(c.name.length * 0.4));

              if (distance < minDistance && distance <= threshold) {
                minDistance = distance;
                bestMatch = c;
              }
            });

            if (bestMatch) {
              matchedCustomerId = (bestMatch as Customer).id;
            }
          }

          // If customer found, assign it
          if (matchedCustomerId) {
            parsed.customerId = matchedCustomerId;
            console.log(`[AI] Matched customer "${parsed.clientName}" to ${(matchedCustomerId)}`);
          } else {
            console.log(`[AI] No matching customer found for "${parsed.clientName}"`);
          }
        }

        // RE-PLAN: The hook onSuccess is standard function. I can make it async or use .then().
        // Better approach: Do the matching inside the handleQuoteGenerated in NewQuote.tsx?
        // NO, the prompt returns clientName. NewQuote doesn't see the raw content unless I pass clientName.
        // I will pass clientName to onQuoteGenerated.

        onQuoteGenerated(parsed);
        toast.success('Quote generated successfully!');
        setProjectDescription('');
      } catch (error) {
        console.error('Failed to parse AI response:', error);
        console.error('Raw content received:', content);
        toast.error('AI response format error. Please try again.');
      }
    },
    onUpgradeRequired: (requiredTier) => {
      setUpgradeInfo({ requiredTier });
      setShowUpgradeDialog(true);
    }
  });

  const handleGenerate = async () => {
    if (userRole !== 'max' && userRole !== 'admin') {
      setUpgradeInfo({ requiredTier: 'max' });
      setShowUpgradeDialog(true);
      return;
    }

    if (!projectDescription.trim()) {
      toast.error('Please describe the project');
      return;
    }

    const itemsCatalog = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.finalPrice,
      units: item.units,
      min_quantity: item.minQuantity || 1 // NEW: Include minimum quantity for AI
    }));

    const prompt = `Generate a complete quote for the following project:

Project Description: ${projectDescription}

Available Items Catalog:
${JSON.stringify(itemsCatalog, null, 2)}

Please return a JSON object with:
{
  "title": "Professional quote title (max 60 chars)",
  "notes": "Professional terms and conditions",
  "summary": "2-3 sentence executive summary highlighting value. IMPORTANT: Do NOT include pricing, costs, or total investment figures.",
  "clientName": "Extracted client name from description (or empty string)",
  "suggestedItems": [
    {
      "itemId": "item id from catalog",
      "name": "item name",
      "description": "item description",
      "quantity": 1,
      "price": 100,
      "total": 100,
      "units": "units"
    }
  ]
}`;

    await quoteAI.generate(prompt, { projectDescription, itemsCatalog });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Full Quote Generation
            {(userRole === 'free' || userRole === 'pro') && (
              <span className="text-xs font-normal text-muted-foreground">(Max AI)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Project Description</Label>
            <Textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Describe the project: what the customer needs, scope of work, key requirements..."
              rows={4}
            />
          </div>
          <AIButton
            onClick={handleGenerate}
            isLoading={quoteAI.isLoading}
            disabled={!projectDescription.trim()}
            className="w-full"
          >
            Generate Complete Quote with AI
          </AIButton>
          <p className="text-xs text-muted-foreground">
            AI will suggest a title, recommended items, professional notes, and executive summary based on your project description.
          </p>
        </CardContent>
      </Card>

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="full_quote_generation"
        requiredTier={upgradeInfo?.requiredTier || 'max'}
      />
    </>
  );
}
