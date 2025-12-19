import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.5.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            throw new Error("Stripe secret key not configured");
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
        });

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const body = await req.json();
        const { action, userId, accountId, code } = body;

        switch (action) {
            case "create_account_link": {
                // Create a new Stripe Connect account for the user
                if (!userId) {
                    throw new Error("userId is required");
                }

                // Check if user already has a Stripe account
                const { data: existingSettings } = await supabase
                    .from("company_settings")
                    .select("stripe_account_id")
                    .eq("user_id", userId)
                    .maybeSingle();

                let stripeAccountId = (existingSettings as any)?.stripe_account_id;

                // Create new account if none exists
                if (!stripeAccountId) {
                    const account = await stripe.accounts.create({
                        type: "express",
                        capabilities: {
                            card_payments: { requested: true },
                            transfers: { requested: true },
                        },
                    });
                    stripeAccountId = account.id;

                    // Save account ID
                    await supabase
                        .from("company_settings")
                        .update({
                            stripe_account_id: stripeAccountId,
                            stripe_connected_at: new Date().toISOString(),
                            stripe_onboarding_complete: false,
                        })
                        .eq("user_id", userId);
                }

                // Create account link for onboarding
                const appUrl = Deno.env.get("APP_URL") || "https://quoteitai.com";
                const accountLink = await stripe.accountLinks.create({
                    account: stripeAccountId,
                    refresh_url: `${appUrl}/settings?stripe_refresh=true`,
                    return_url: `${appUrl}/settings?stripe_connected=true`,
                    type: "account_onboarding",
                });

                return new Response(
                    JSON.stringify({ url: accountLink.url, accountId: stripeAccountId }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "check_status": {
                // Check if Stripe account is fully onboarded
                if (!accountId) {
                    throw new Error("accountId is required");
                }

                const account = await stripe.accounts.retrieve(accountId);

                const isComplete = account.details_submitted &&
                    account.charges_enabled &&
                    account.payouts_enabled;

                // Update onboarding status in database
                if (userId && isComplete) {
                    await supabase
                        .from("company_settings")
                        .update({ stripe_onboarding_complete: true })
                        .eq("user_id", userId);
                }

                return new Response(
                    JSON.stringify({
                        accountId: account.id,
                        isComplete,
                        chargesEnabled: account.charges_enabled,
                        payoutsEnabled: account.payouts_enabled,
                        detailsSubmitted: account.details_submitted,
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "create_dashboard_link": {
                // Create a link to the Stripe Express dashboard
                if (!accountId) {
                    throw new Error("accountId is required");
                }

                const loginLink = await stripe.accounts.createLoginLink(accountId);

                return new Response(
                    JSON.stringify({ url: loginLink.url }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "disconnect": {
                // Note: We don't delete the Stripe account, just clear our reference
                if (!userId) {
                    throw new Error("userId is required");
                }

                await supabase
                    .from("company_settings")
                    .update({
                        stripe_account_id: null,
                        stripe_connected_at: null,
                        stripe_onboarding_complete: false,
                    })
                    .eq("user_id", userId);

                return new Response(
                    JSON.stringify({ success: true }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }
    } catch (error: any) {
        console.error("Stripe Connect error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
