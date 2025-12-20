import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { priceId, orgId, tier, totalSeats } = await req.json();

    // Seat Bucket Logic
    const tierLimits = { pro: 3, business: 10 };
    const includedSeats = tierLimits[tier as keyof typeof tierLimits] || 0;
    const overageSeats = Math.max(0, (totalSeats || 0) - includedSeats);

    // Get price IDs from env or fallback to one-time priceId if provided
    const basePriceId = Deno.env.get(`STRIPE_${tier?.toUpperCase()}_BASE_PRICE_ID`) || priceId;
    const seatPriceId = Deno.env.get(`STRIPE_${tier?.toUpperCase()}_SEAT_PRICE_ID`);

    if (!basePriceId) throw new Error("Base Price ID is required");

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: basePriceId,
        quantity: 1,
      },
    ];

    if (overageSeats > 0 && seatPriceId) {
      lineItems.push({
        price: seatPriceId,
        quantity: overageSeats,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/settings/billing`,
      metadata: {
        orgId: orgId || "",
        tier: tier || "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[CREATE-CHECKOUT ERROR]', error);

    // Return sanitized error to client
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
    const clientError = isDevelopment
      ? errorMessage
      : 'Unable to create checkout session. Please try again.';

    return new Response(JSON.stringify({ error: clientError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
