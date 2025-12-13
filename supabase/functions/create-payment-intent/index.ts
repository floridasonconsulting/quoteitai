import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { quoteId, amount, currency = 'usd', paymentType, depositPercentage } = await req.json()

    // Validate input
    if (!quoteId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment parameters' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Get quote details from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*, customers(*)')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ error: 'Quote not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: paymentType === 'deposit' 
                ? `Quote #${quote.quote_number} - ${depositPercentage}% Deposit` 
                : `Quote #${quote.quote_number} - Full Payment`,
              description: quote.title,
              metadata: {
                quoteId,
                quoteNumber: quote.quote_number,
              },
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/quotes/public/${quote.share_token}?payment=success`,
      cancel_url: `${req.headers.get('origin')}/quotes/public/${quote.share_token}?payment=canceled`,
      customer_email: quote.customers?.email || undefined,
      metadata: {
        quoteId,
        quoteNumber: quote.quote_number,
        paymentType,
        ...(depositPercentage && { depositPercentage: depositPercentage.toString() }),
      },
    })

    // Log payment attempt
    await supabase
      .from('quotes')
      .update({
        payment_status: 'pending',
        payment_amount: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)

    return new Response(
      JSON.stringify({
        id: session.id,
        clientSecret: session.client_secret,
        url: session.url,
        amount,
        currency,
        status: 'created',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Payment intent creation error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Payment intent creation failed' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
