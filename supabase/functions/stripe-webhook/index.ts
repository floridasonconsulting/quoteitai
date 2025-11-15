import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
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

        if (!quoteId) {
          console.error('No quoteId in session metadata')
          break
        }

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
  } catch (error) {
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
