import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Sparkles, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

// Real Stripe product and price IDs
const SUBSCRIPTION_TIERS = {
  pro_monthly: {
    name: 'Pro Monthly',
    price: '$9.99/month',
    priceId: 'price_1SEuOKFe05N9s8oj50fHpdt2',
    productId: 'prod_TBGwDXWSBdGOEM',
    features: [
      '50 quotes per month',
      'Unlimited customers & items',
      'AI Quote Titles & Descriptions',
      'AI Terms & Conditions Generator',
      'AI Executive Summaries',
      'AI Follow-up Messages (30/mo)',
      'AI Discount Justifications',
      'Email support',
    ],
  },
  pro_annual: {
    name: 'Pro Annual',
    price: '$99/year',
    priceId: 'price_1SEuP5Fe05N9s8ojbUqindin',
    productId: 'prod_TBGwuEojGwEuM5',
    features: [
      '600 quotes per year',
      'Unlimited customers & items',
      'AI Quote Titles & Descriptions',
      'AI Terms & Conditions Generator',
      'AI Executive Summaries',
      'AI Follow-up Messages (360/yr)',
      'AI Discount Justifications',
      'Priority email support',
      'Save $20 vs monthly',
    ],
  },
  max_monthly: {
    name: 'Max AI Monthly',
    price: '$19.99/month',
    priceId: 'price_1SEuQ3Fe05N9s8ojkiETaKB4',
    productId: 'prod_TBGxhMwPGvWBdO',
    features: [
      'Everything in Pro, plus:',
      'Unlimited quotes & AI requests',
      'AI Full Quote Generation',
      'AI Item Recommendations',
      'AI Pricing Optimization',
      'AI Customer Insights',
      'AI Competitive Analysis',
      'Advanced follow-up automation',
      'Priority support',
    ],
  },
  max_annual: {
    name: 'Max AI Annual',
    price: '$199/year',
    priceId: 'price_1SEuQoFe05N9s8ojTbzv8sGt',
    productId: 'prod_TBGyVDEvJOqCz3',
    features: [
      'Everything in Pro, plus:',
      'Unlimited quotes & AI requests',
      'AI Full Quote Generation',
      'AI Item Recommendations',
      'AI Pricing Optimization',
      'AI Customer Insights',
      'AI Competitive Analysis',
      'Advanced follow-up automation',
      '24/7 priority support',
      'Save $40 vs monthly',
    ],
  },
};

export default function Subscription() {
  const { subscription, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        setTimeout(() => {
          refreshSubscription();
        }, 5000);
      }
    } catch (error) {
      toast.error('Failed to create checkout session');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast.error('Failed to open customer portal');
      console.error(error);
    }
  };

  const isCurrentPlan = (productId: string) => {
    return subscription?.product_id === productId;
  };

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Subscription</h2>
        <p className="text-muted-foreground">
          Choose the plan that's right for your business
        </p>
      </div>

      {subscription?.subscribed && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              Your subscription is active
              {subscription.subscription_end && 
                ` until ${new Date(subscription.subscription_end).toLocaleDateString()}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleManageSubscription} variant="outline">
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
          const isActive = isCurrentPlan(tier.productId);
          const isLoading = loading === tier.priceId;

          return (
            <Card key={key} className={isActive ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {key.includes('max') ? (
                      <Sparkles className="h-5 w-5 text-primary" />
                    ) : (
                      <Zap className="h-5 w-5 text-primary" />
                    )}
                    {tier.name}
                  </CardTitle>
                  {isActive && (
                    <Badge variant="default">Your Plan</Badge>
                  )}
                </div>
                <CardDescription className="text-2xl font-bold">
                  {tier.price}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(tier.priceId)}
                  disabled={isActive || isLoading}
                  variant={isActive ? 'secondary' : 'default'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : isActive ? (
                    'Current Plan'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Have questions about our plans or need a custom solution?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={refreshSubscription}>
            Refresh Subscription Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
