import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Webhook signature or secret missing', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`Received Stripe webhook: ${event.type}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const quoteId = session.metadata?.quoteId
        const paymentType = session.metadata?.paymentType
        const depositPercentage = session.metadata?.depositPercentage

        if (!quoteId && !session.metadata?.orgId) {
          console.error('No quoteId or orgId in session metadata')
          break
        }

        if (quoteId) {
          // Update quote with payment information
          const { error: updateError } = await supabase
            .from('quotes')
            .update({
              payment_status: 'paid',
              payment_amount: session.amount_total ? session.amount_total / 100 : 0,
              stripe_payment_id: session.payment_intent as string,
              deposit_percentage: depositPercentage ? parseInt(depositPercentage) : null,
              paid_at: new Date().toISOString(),
              status: 'accepted', // Automatically accept quote on payment
              updated_at: new Date().toISOString(),
            })
            .eq('id', quoteId)

          if (updateError) {
            console.error('Failed to update quote:', updateError)
            throw updateError
          }

          console.log(`Quote ${quoteId} marked as paid (${paymentType})`)
        }

        if (session.mode === 'subscription' && session.metadata?.orgId) {
          const orgId = session.metadata.orgId
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          await syncAllowedSeats(supabase, stripe, orgId, subscription)
        }

        // Send confirmation email (optional - call send-quote-notification function)
        try {
          await supabase.functions.invoke('send-quote-notification', {
            body: {
              quoteId,
              event: 'payment_received',
              paymentType,
              depositPercentage,
            },
          })
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError)
          // Don't fail the webhook if email fails
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata?.orgId
        if (orgId) {
          await syncAllowedSeats(supabase, stripe, orgId, subscription)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id)

        // Optional: Update quote status to indicate payment failure
        // You could add a payment_status = 'failed' field
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Webhook failed' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function syncAllowedSeats(supabase: any, stripe: any, orgId: string, subscription: Stripe.Subscription) {
  console.log(`Syncing allowed_seats for org ${orgId}`)

  const tier = subscription.metadata?.tier || 'starter'
  const tierLimits: Record<string, number> = { starter: 1, pro: 3, business: 10, max_ai: 999999 }
  const includedSeats = tierLimits[tier] || 1

  let overageSeats = 0

  // Sum quantities of items that are NOT the base tier (which is usually quantity 1)
  // or items specifically tagged as additional seats.
  for (const item of subscription.items.data) {
    const isAdditionalSeat = item.metadata?.metered_seats === 'true' ||
      item.price.product.toString().toLowerCase().includes('seat')

    if (isAdditionalSeat) {
      overageSeats += (item.quantity || 0)
    }
  }

  const totalSeats = includedSeats + overageSeats
  console.log(`Calculated total seats: ${totalSeats} (${includedSeats} included + ${overageSeats} overage)`)

  // Determine if we should set pro_upgraded_at
  const isPaidTier = ['pro', 'business', 'max_ai'].includes(tier)

  const updateData: any = {
    allowed_seats: totalSeats,
    subscription_tier: tier,
    stripe_customer_id: subscription.customer as string,
    updated_at: new Date().toISOString()
  }

  // Only set pro_upgraded_at if transitioning to a paid tier 
  // Rationale: We want to catch the FIRST time they upgrade for the welcome sequence
  if (isPaidTier) {
    // We update it if it's currently null. 
    // Since we don't have the current state easily here without a fetch, 
    // and we want to avoid unnecessary fetches, we can use a clever Supabase update 
    // or just fetch. Fetching is safer to avoid overwriting.
    const { data: org } = await supabase
      .from('organizations')
      .select('pro_upgraded_at')
      .eq('id', orgId)
      .single()

    if (org && !org.pro_upgraded_at) {
      updateData.pro_upgraded_at = new Date().toISOString()
    }
  }

  const { error } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', orgId)

  if (error) {
    console.error('Failed to sync allowed_seats:', error)
    throw error
  }
}
