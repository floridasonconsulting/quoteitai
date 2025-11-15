# Stripe Setup Guide for Quote-It AI

This guide will help you set up Stripe payment processing for the Accept & Pay flow.

## Prerequisites

- [ ] Stripe account (sign up at https://stripe.com)
- [ ] Quote-It AI deployed with Supabase backend

## Step 1: Get Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Click on "Developers" in the sidebar
3. Click on "API keys"
4. Copy your **Publishable key** (starts with `pk_`)
5. Copy your **Secret key** (starts with `sk_`) - Keep this secure!

## Step 2: Add Stripe Keys to Environment

### For Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Stripe publishable key:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### For Production (Vercel/Netlify)

1. Go to your hosting platform's environment variables settings
2. Add `VITE_STRIPE_PUBLISHABLE_KEY` with your **live** publishable key

### For Supabase Edge Functions

1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add secret environment variable:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```

## Step 3: Create Supabase Edge Function

Create a new edge function for creating payment intents:

```bash
npx supabase functions new create-payment-intent
```

Add the following code to `supabase/functions/create-payment-intent/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { quoteId, amount, currency = 'usd', paymentType, depositPercentage } = await req.json()

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: paymentType === 'deposit' 
                ? `Quote Payment - ${depositPercentage}% Deposit` 
                : 'Quote Payment - Full Amount',
              description: `Quote ID: ${quoteId}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/quotes/public/${quoteId}?payment=success`,
      cancel_url: `${req.headers.get('origin')}/quotes/public/${quoteId}?payment=canceled`,
      metadata: {
        quoteId,
        paymentType,
        ...(depositPercentage && { depositPercentage: depositPercentage.toString() }),
      },
    })

    return new Response(
      JSON.stringify({
        id: session.id,
        clientSecret: session.client_secret,
        amount,
        currency,
        status: 'created',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
```

Deploy the function:
```bash
npx supabase functions deploy create-payment-intent
```

## Step 4: Set up Stripe Webhook (Optional but Recommended)

To automatically update quote status when payment is successful:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Add to Supabase Edge Functions environment:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Step 5: Test Payment Flow

### Test Mode (Development)

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC will work.

### Live Mode (Production)

1. Switch to live mode in Stripe Dashboard
2. Update environment variables with live keys:
   - `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - `STRIPE_SECRET_KEY=sk_live_...`
3. Test with real payment method

## Step 6: Database Schema Updates

Add payment fields to quotes table:

```sql
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_amount NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
```

## Troubleshooting

### "Stripe not initialized" Error
- Check that `VITE_STRIPE_PUBLISHABLE_KEY` is set in your environment
- Verify the key starts with `pk_test_` or `pk_live_`
- Restart your development server after adding the key

### Payment Intent Creation Fails
- Check Supabase Edge Function logs
- Verify `STRIPE_SECRET_KEY` is set in Supabase
- Ensure Edge Function is deployed successfully

### Webhook Not Receiving Events
- Check webhook URL is correct
- Verify webhook secret is set
- Check Stripe Dashboard → Developers → Webhooks → Events for delivery status

## Security Best Practices

1. **Never expose secret keys**: Only use publishable keys in frontend code
2. **Use environment variables**: Never hardcode API keys
3. **Enable Stripe Radar**: Automatic fraud detection (enabled by default)
4. **Use webhooks**: Don't rely solely on client-side success callbacks
5. **Test thoroughly**: Use test mode before going live

## Pricing

Stripe charges:
- **Standard pricing**: 2.9% + $0.30 per successful card charge
- **No monthly fees**
- **No setup fees**
- **Instant payouts available**

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Support

If you encounter issues:
1. Check Stripe Dashboard → Developers → Logs
2. Check Supabase Edge Function logs
3. Review browser console for errors
4. Contact Stripe Support or Supabase Support if needed
