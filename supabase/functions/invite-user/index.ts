import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.14.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

    try {
        const authHeader = req.headers.get("Authorization")!;
        const { email, organizationId } = await req.json();

        if (!email || !organizationId) {
            throw new Error("Missing email or organizationId");
        }

        // 1. Get the requester's info to verify they are an admin/owner of this org
        const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
            global: { headers: { Authorization: authHeader } },
        });
        const { data: { user: requester }, error: requesterError } = await userClient.auth.getUser();

        if (requesterError || !requester) throw new Error("Unauthorized");

        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("organization_id, role")
            .eq("id", requester.id)
            .single();

        if (profileError || profile.organization_id !== organizationId || !["owner", "admin"].includes(profile.role)) {
            throw new Error("Unauthorized: Only organization owners/admins can invite users");
        }

        // 2. Check current seat usage vs tier limits
        const { data: org, error: orgError } = await supabaseAdmin
            .from("organizations")
            .select("subscription_tier, stripe_customer_id")
            .eq("id", organizationId)
            .single();

        if (orgError) throw new Error("Organization not found");

        const { count: userCount, error: countError } = await supabaseAdmin
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", organizationId);

        if (countError) throw new Error("Failed to check user count");

        const maxBaseSeats = {
            "starter": 1,
            "pro": 2,
            "business": 5,
            "enterprise": 10,
            "max_ai": 999999
        }[org.subscription_tier as string] || 1;

        const maxTotalSeats = {
            "starter": 1,
            "pro": 5, // User #6 triggers Business Upgrade
            "business": 10, // User #11 triggers Enterprise Upgrade
            "enterprise": 999999,
            "max_ai": 999999
        }[org.subscription_tier as string] || 1;

        const currentSeatCount = userCount || 0;
        const needsMeteredBilling = currentSeatCount >= maxBaseSeats;
        const isHardCapped = currentSeatCount >= maxTotalSeats;

        // 3. Handle Seat Overage (Stripe Metered Billing)
        if (isHardCapped) {
            return new Response(
                JSON.stringify({
                    error: `Seat limit reached for the ${org.subscription_tier} tier. Please upgrade to unlock more seats.`,
                    code: "ERR_SEAT_LIMIT_REACHED",
                    needsUpgrade: true
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (needsMeteredBilling) {
            if (org.subscription_tier === "starter" || org.subscription_tier === "max_ai" || org.subscription_tier === "enterprise") {
                // Starter and High Tiers don't have metered extras in the same way or are already maxed
                return new Response(
                    JSON.stringify({ error: "Seat limit reached for this tier.", code: "ERR_SEAT_LIMIT_REACHED" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // If we have Stripe setup and it's a paid tier (Pro/Business), we increment usage
            if (stripe && org.stripe_customer_id) {
                console.log(`Org ${organizationId} is adding a metered seat (${currentSeatCount + 1}) on ${org.subscription_tier} tier.`);

                // Find the metered subscription item
                const subscriptions = await stripe.subscriptions.list({
                    customer: org.stripe_customer_id,
                    status: 'active',
                    limit: 1,
                });

                if (subscriptions.data.length > 0) {
                    const subscription = subscriptions.data[0];
                    const seatItem = subscription.items.data.find(item =>
                        item.metadata.metered_seats === 'true' ||
                        item.price.product.toString().toLowerCase().includes('seat')
                    );

                    if (seatItem) {
                        await stripe.subscriptionItems.createUsageRecord(seatItem.id, {
                            quantity: 1,
                            action: 'increment',
                        });
                        console.log('Stripe usage record created successfully');
                    } else {
                        console.warn('No seat-based metered item found in Stripe subscription.');
                        return new Response(
                            JSON.stringify({ error: "No automated seat billing configured. Please upgrade.", code: "ERR_SEAT_LIMIT_REACHED" }),
                            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                        );
                    }
                }
            } else {
                return new Response(
                    JSON.stringify({ error: "Seat limit reached. Please upgrade or add seats via Stripe.", code: "ERR_SEAT_LIMIT_REACHED" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // 4. Send Invitation
        const { data: invite, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                organization_id: organizationId,
                invited_by: requester.id
            }
        });

        if (inviteError) throw inviteError;

        // Note: The profile will be created automatically via a database trigger 
        // or when the user accepts the invite and signs in. 
        // However, for seat limits to work accurately, we should ensure the profile exists.
        // If the user accepts the invite, we'll need to update their profile's organization_id.

        return new Response(
            JSON.stringify({ success: true, message: "Invitation sent successfully", user: invite.user }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Invite error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
