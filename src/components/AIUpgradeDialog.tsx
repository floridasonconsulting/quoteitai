import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, Zap } from 'lucide-react';
import { AIFeatureType } from '@/hooks/useAI';

interface AIUpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: AIFeatureType;
  requiredTier: 'pro' | 'max';
}

const FEATURE_BENEFITS: Record<AIFeatureType, {
  name: string;
  description: string;
  benefits: string[];
}> = {
  quote_title: {
    name: 'AI Quote Titles',
    description: 'Generate professional, compelling quote titles instantly',
    benefits: ['Save 10+ minutes per quote', 'Consistent professional tone', 'SEO-optimized titles']
  },
  quote_summary: {
    name: 'AI Executive Summaries',
    description: 'Create persuasive summaries that close deals faster',
    benefits: ['Highlight key value propositions', 'Professional writing quality', 'Boost conversion rates']
  },
  followup_message: {
    name: 'AI Follow-up Messages',
    description: 'Generate personalized follow-up messages for your quotes',
    benefits: ['Save time writing follow-ups', 'Personalized for each customer', 'Increase response rates']
  },
  notes_generator: {
    name: 'AI Notes Generator',
    description: 'Automatically generate detailed notes for your quotes',
    benefits: ['Never forget important details', 'Consistent documentation', 'Save hours of manual work']
  },
  item_description: {
    name: 'AI Item Descriptions',
    description: 'Create compelling product and service descriptions',
    benefits: ['Professional product descriptions', 'Highlight key features', 'Increase perceived value']
  },
  discount_justification: {
    name: 'AI Discount Justification',
    description: 'Generate professional justifications for pricing and discounts',
    benefits: ['Explain value clearly', 'Build trust with transparency', 'Justify pricing decisions']
  },
  email_draft: {
    name: 'AI Email Drafts',
    description: 'Generate professional emails for quotes and follow-ups',
    benefits: ['Perfect tone every time', 'Save hours writing emails', 'Increase engagement']
  },
  full_quote_generation: {
    name: 'AI Full Quote Generation',
    description: 'Generate complete quotes with AI assistance',
    benefits: ['Create quotes in minutes', 'Professional formatting', 'Reduce errors and omissions']
  },
  item_recommendations: {
    name: 'AI Item Recommendations',
    description: 'Get smart suggestions for items to include in quotes',
    benefits: ['Increase quote value', 'Never miss cross-sell opportunities', 'Personalized recommendations']
  },
  pricing_optimization: {
    name: 'AI Pricing Optimization',
    description: 'Optimize your pricing strategy with AI insights',
    benefits: ['Maximize profitability', 'Stay competitive', 'Data-driven pricing decisions']
  },
  follow_up_suggestions: {
    name: 'AI Follow-up Suggestions',
    description: 'Get intelligent timing and content suggestions for follow-ups',
    benefits: ['Never miss a follow-up', 'Perfect timing recommendations', 'Increase conversion rates']
  },
  customer_insights: {
    name: 'AI Customer Insights',
    description: 'Gain deep insights into customer behavior and preferences',
    benefits: ['Understand your customers better', 'Personalize your approach', 'Predict customer needs']
  },
  competitive_analysis: {
    name: 'AI Competitive Analysis',
    description: 'Analyze market positioning and competitive advantages',
    benefits: ['Stay ahead of competition', 'Identify market opportunities', 'Strategic decision making']
  },
};

const TIER_INFO = {
  pro: {
    name: 'Pro',
    price: '$9.99/month',
    features: ['50 AI requests per month', 'All basic AI features', 'Priority support', 'Advanced analytics']
  },
  max: {
    name: 'Max AI',
    price: '$19.99/month',
    features: ['Unlimited AI requests', 'All AI features unlocked', 'Premium support', 'Advanced automation', 'Custom AI models']
  }
};

export function AIUpgradeDialog({ isOpen, onClose, featureName, requiredTier }: AIUpgradeDialogProps) {
  const feature = FEATURE_BENEFITS[featureName];
  const tier = TIER_INFO[requiredTier];

  const handleUpgrade = () => {
    onClose();
    window.location.href = '/settings?tab=subscription';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <Badge variant="secondary" className="text-xs">
              {tier.name} Feature
            </Badge>
          </div>
          <DialogTitle className="text-2xl">
            Unlock {feature.name} ✨
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {feature.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              What you'll get:
            </h4>
            <ul className="space-y-2">
              {feature.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Upgrade to {tier.name}</h4>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{tier.price}</span>
              </div>
              <ul className="space-y-2">
                {tier.features.map((tierFeature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{tierFeature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button 
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
