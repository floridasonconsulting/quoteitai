import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAI } from '@/hooks/useAI';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AIUpgradeDialog } from './AIUpgradeDialog';
import { Sparkles, Plus } from 'lucide-react';
import { QuoteItem, Item } from '@/types';
import { sanitizeForAI } from '@/lib/input-sanitization';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface RecommendedItem {
  name: string;
  description: string;
  price: number;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  units?: string;
}

interface ItemRecommendationsAIProps {
  currentItems: QuoteItem[];
  availableItems: Item[];
  onAddItem: (item: Item) => void;
}

export function ItemRecommendationsAI({ currentItems, availableItems, onAddItem }: ItemRecommendationsAIProps) {
  const { user } = useAuth();
  const userRole = user?.role;
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ requiredTier: 'pro' | 'max' } | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const recommendationsAI = useAI('item_recommendations', {
    onSuccess: (content) => {
      try {
        const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          setRecommendations(parsed.recommendations);
          setShowResultDialog(true);
        } else {
          toast.error('Invalid recommendations format');
        }
      } catch (error) {
        console.error('Failed to parse recommendations:', error);
        toast.error('Failed to parse AI recommendations');
      }
    },
    onUpgradeRequired: (requiredTier) => {
      setUpgradeInfo({ requiredTier });
      setShowUpgradeDialog(true);
    }
  });

  const handleGenerateRecommendations = async () => {
    if (userRole !== 'max' && userRole !== 'admin') {
      setUpgradeInfo({ requiredTier: 'max' });
      setShowUpgradeDialog(true);
      return;
    }

    if (!currentItems.length) {
      toast.error('Add some items first to get recommendations');
      return;
    }

    const currentItemsData = currentItems.map(item => ({
      name: sanitizeForAI(item.name),
      description: sanitizeForAI(item.description || ''),
      price: item.price,
      quantity: item.quantity
    }));

    const availableItemsData = availableItems.map(item => ({
      name: sanitizeForAI(item.name),
      description: sanitizeForAI(item.description || ''),
      category: sanitizeForAI(item.category || ''),
      price: item.finalPrice,
      units: item.units
    }));

    const prompt = `Based on the current quote items, suggest complementary items from the available catalog that would add value to this project.

Current Quote Items:
${JSON.stringify(currentItemsData, null, 2)}

Available Items Catalog:
${JSON.stringify(availableItemsData, null, 2)}

Provide 3-5 item recommendations in JSON format:
{
  "recommendations": [
    {
      "name": "item name from catalog",
      "description": "item description",
      "price": 100,
      "priority": "high|medium|low",
      "reasoning": "Why this item complements the current quote",
      "units": "units"
    }
  ]
}`;

    await recommendationsAI.generate(prompt, { currentItems: currentItemsData, availableItems: availableItemsData });
  };

  const handleAddRecommendation = (rec: RecommendedItem) => {
    // Create an object that matches the Item interface
    const newItem: Item = {
      id: crypto.randomUUID(), // New ID for the custom item
      name: rec.name,
      description: rec.description,
      category: 'Recommended',
      basePrice: rec.price,
      markup: 0,
      markupType: 'fixed',
      finalPrice: rec.price,
      units: rec.units || 'each',
      minQuantity: 1,
      createdAt: new Date().toISOString()
    };
    onAddItem(newItem);
    toast.success(`Added ${rec.name} to quote`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <Button
        onClick={handleGenerateRecommendations}
        variant="outline"
        size="sm"
        disabled={!currentItems.length || recommendationsAI.isLoading}
        className="gap-2"
      >
        <Sparkles className={`h-4 w-4 ${recommendationsAI.isLoading ? 'animate-pulse' : ''}`} />
        AI Item Recommendations
      </Button>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Item Recommendations
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Based on your current items, here are some complementary suggestions
          </p>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{rec.name}</h3>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(rec.priority)}
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rec.description}
                      </p>
                      <div className="text-sm">
                        <p className="font-medium mb-1">Why recommended:</p>
                        <p className="text-muted-foreground">{rec.reasoning}</p>
                      </div>
                      <p className="text-lg font-bold text-primary mt-3">
                        ${rec.price.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleAddRecommendation(rec)}
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="item_recommendations"
        requiredTier={upgradeInfo?.requiredTier || 'max'}
      />
    </>
  );
}
