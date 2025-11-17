
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Sparkles, Zap, Building2, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

// Updated pricing structure with new tiers
const SUBSCRIPTION_TIERS = {
  pro_monthly: {
    name: 'Pro',
    price: '$29/month',
    priceId: 'price_1SPTGFFe05N9s8ojqPOfbsBO', // Will need to be updated in Stripe
    productId: 'prod_TMBdXO8oZcVkfV',
    description: 'For growing businesses',
    popular: true,
    features: [
      '50 quotes per month',
      'Unlimited customers & items',
      'Professional HTML Email Sending',
      'Editable Email Templates',
      'Branded Quote Emails',
      'QuickBooks Integration',
      'Stripe Payment Integration',
      'AI Quote Titles & Descriptions',
      'AI Terms & Conditions Generator',
      'AI Executive Summaries',
      'AI Follow-up Messages',
      'Cloud sync across devices',
      'Priority support',
    ],
  },
  pro_annual: {
    name: 'Pro Annual',
    price: '$290/year',
    savings: 'Save $58',
    priceId: 'price_1SPTGPFe05N9s8ojPuL611il',
    productId: 'prod_TMBdpTblCywgQf',
    description: 'Best value for Pro tier',
    features: [
      'Everything in Pro Monthly',
      '600 quotes per year',
      '2 months free',
      'Priority email support',
    ],
  },
  business_monthly: {
    name: 'Business',
    price: '$79/month',
    priceId: 'price_business_monthly_new', // New tier - needs Stripe setup
    productId: 'prod_business_new',
    description: 'For established businesses',
    popular: false,
    features: [
      'Everything in Pro, plus:',
      'Unlimited quotes per month',
      'Unlimited team members',
      'Advanced analytics dashboard',
      'White-label branding options',
      'API access for CRM integrations',
      'Advanced AI features',
      'AI Scope of Work (SOW) drafting',
      'AI Item Recommendations',
      'AI Pricing Optimization',
      'Priority support',
      'Dedicated account manager',
    ],
  },
  business_annual: {
    name: 'Business Annual',
    price: '$790/year',
    savings: 'Save $158',
    priceId: 'price_business_annual_new',
    productId: 'prod_business_annual_new',
    description: 'Best value for Business tier',
    features: [
      'Everything in Business Monthly',
      '2 months free',
      'Dedicated onboarding session',
      'Priority 24/7 support',
    ],
  },
  max_monthly: {
    name: 'Max AI',
    price: '$149/month',
    priceId: 'price_1SPTGQFe05N9s8ojREGE4yhs',
    productId: 'prod_TMBdc6WfCWbNVm',
    description: 'Enterprise-grade AI automation',
    popular: false,
    features: [
      'Everything in Business, plus:',
      'Unlimited AI generation requests',
      'AI-powered full quote generation',
      'AI competitive analysis',
      'AI customer insights & behavior prediction',
      'Custom AI training on your data',
      'Advanced email automation',
      'RFP response matching (coming soon)',
      'Smart content library',
      'White-label + custom domain',
      'Dedicated account manager',
      '24/7 priority support',
      'Custom integrations',
    ],
  },
  max_annual: {
    name: 'Max AI Annual',
    price: '$1,490/year',
    savings: 'Save $298',
    priceId: 'price_1SPTGQFe05N9s8ojtcXQuj1p',
    productId: 'prod_TMBd1KM25jZncG',
    description: 'Best value for Max AI',
    features: [
      'Everything in Max AI Monthly',
      '2 months free',
      'Quarterly strategy sessions',
      'Custom feature development',
    ],
  },
};

export default function Subscription() {
  const { subscription, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

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

  // Filter tiers based on billing cycle
  const displayedTiers = Object.entries(SUBSCRIPTION_TIERS).filter(([key]) => {
    if (billingCycle === 'monthly') {
      return key.includes('_monthly');
    } else {
      return key.includes('_annual');
    }
  });

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Subscription Plans</h2>
        <p className="text-muted-foreground">
          Choose the plan that's right for your business. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={billingCycle === 'monthly' ? 'default' : 'outline'}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={billingCycle === 'annual' ? 'default' : 'outline'}
          onClick={() => setBillingCycle('annual')}
          className="relative"
        >
          Annual
          <Badge variant="secondary" className="ml-2 bg-green-600 text-white">
            <Gift className="h-3 w-3 mr-1" />
            Save 17%
          </Badge>
        </Button>
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

      {/* Free Tier Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Free
            </CardTitle>
          </div>
          <CardDescription className="text-2xl font-bold">
            $0/forever
          </CardDescription>
          <p className="text-sm text-muted-foreground mt-2">Perfect for getting started</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>5 quotes per month</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>Basic customer & item management</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>Simple email notifications</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>Standard PDF export</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>Email support</span>
            </li>
          </ul>
          <Button className="w-full" variant="outline" disabled>
            Current Plan
          </Button>
        </CardContent>
      </Card>

      {/* Paid Tiers Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {displayedTiers.map(([key, tier]) => {
          const isActive = isCurrentPlan(tier.productId);
          const isLoading = loading === tier.priceId;
          const isPopular = 'popular' in tier && tier.popular;

          let icon = Zap;
          if (key.includes('business')) icon = Building2;
          if (key.includes('max')) icon = Sparkles;

          return (
            <Card key={key} className={`${isActive ? 'border-primary' : ''} ${isPopular ? 'border-primary shadow-lg scale-105' : ''} relative`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {React.createElement(icon, { className: "h-5 w-5 text-primary" })}
                    {tier.name}
                  </CardTitle>
                  {isActive && (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <CardDescription className="text-3xl font-bold text-foreground">
                    {tier.price}
                  </CardDescription>
                  {'savings' in tier && (
                    <p className="text-sm text-green-600 font-semibold">{tier.savings}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 min-h-[300px]">
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
                  variant={isActive ? 'secondary' : isPopular ? 'default' : 'outline'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : isActive ? (
                    'Current Plan'
                  ) : (
                    `Subscribe to ${tier.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison Note */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Why Quote-It AI?</CardTitle>
          <CardDescription>
            Professional features at a fraction of competitor prices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Quote-It AI Pro ($29/mo)
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• QuickBooks & Stripe included</li>
                <li>• Professional email automation</li>
                <li>• AI-powered features</li>
                <li>• No per-user fees</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-muted-foreground">
                Competitors ($49-$99/mo)
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Basic integrations only</li>
                <li>• Limited email features</li>
                <li>• AI costs extra ($20-50/mo)</li>
                <li>• Per-user pricing adds up</li>
              </ul>
            </div>
          </div>
          <p className="text-sm font-semibold text-primary">
            Save $240-$840/year vs PandaDoc, Proposify, or ServiceTitan
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Have questions about our plans or need a custom solution?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={refreshSubscription}>
            Refresh Subscription Status
          </Button>
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
