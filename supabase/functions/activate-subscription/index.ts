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
        const { data: { user } } = await supabaseClient.auth.getUser(token);

        if (!user) throw new Error("User not authenticated");

        // Fetch stripe_subscription_id from the organization
        const { data: orgData, error: orgError } = await supabaseClient
            .from("organizations")
            .select("stripe_subscription_id, subscription_status")
            .eq("owner_id", user.id)
            .single();

        if (orgError || !orgData?.stripe_subscription_id) {
            throw new Error("No active trial subscription found for this user.");
        }

        if (orgData.subscription_status !== 'trialing') {
            throw new Error("Subscription is not in a trialing state.");
        }

        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
            apiVersion: "2025-08-27",
        });

        // Update subscription to end trial immediately
        const subscription = await stripe.subscriptions.update(orgData.stripe_subscription_id, {
            trial_end: "now",
        });

        console.log(`[ACTIVATE-SUBSCRIPTION] Trial ended for sub: ${subscription.id}`);

        return new Response(JSON.stringify({ success: true, subscription }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error('[ACTIVATE-SUBSCRIPTION ERROR]', error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
