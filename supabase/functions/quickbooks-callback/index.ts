import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const realmId = url.searchParams.get("realmId");
        const error = url.searchParams.get("error");

        // QuickBooks OAuth credentials from environment
        const clientId = Deno.env.get("QUICKBOOKS_CLIENT_ID");
        const clientSecret = Deno.env.get("QUICKBOOKS_CLIENT_SECRET");
        const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/+$/, "");
        const redirectUri = Deno.env.get("QUICKBOOKS_REDIRECT_URI") ||
            `${supabaseUrl}/functions/v1/quickbooks-callback`;

        if (!clientId || !clientSecret) {
            console.error("QuickBooks credentials not configured");
            return redirectWithError("Configuration error: QuickBooks not properly configured");
        }

        // Handle OAuth error
        if (error) {
            console.error("QuickBooks OAuth error:", error);
            return redirectWithError(error);
        }

        // Validate required params
        if (!code || !state || !realmId) {
            return redirectWithError("Missing required parameters");
        }

        // Decode state to get userId
        let userId: string;
        try {
            const stateData = JSON.parse(atob(state));
            userId = stateData.userId;
            if (!userId) throw new Error("No userId in state");
        } catch (e) {
            return redirectWithError("Invalid state parameter");
        }

        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error("Token exchange failed:", errorData);
            return redirectWithError("Failed to connect to QuickBooks");
        }

        const tokens = await tokenResponse.json();

        // Store tokens in Supabase
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get company info from QuickBooks
        const companyInfoResponse = await fetch(
            `https://quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`,
            {
                headers: {
                    "Authorization": `Bearer ${tokens.access_token}`,
                    "Accept": "application/json",
                },
            }
        );

        let companyName = "QuickBooks Company";
        if (companyInfoResponse.ok) {
            const companyData = await companyInfoResponse.json();
            companyName = companyData.CompanyInfo?.CompanyName || companyName;
        }

        // Update company_settings with QuickBooks tokens
        const { error: updateError } = await supabaseClient
            .from("company_settings")
            .update({
                quickbooks_realm_id: realmId,
                quickbooks_access_token: tokens.access_token,
                quickbooks_refresh_token: tokens.refresh_token,
                quickbooks_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                quickbooks_company_name: companyName,
                quickbooks_connected_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

        if (updateError) {
            console.error("Failed to store tokens:", updateError);
            return redirectWithError("Failed to save connection");
        }

        // Redirect back to settings with success
        const appUrl = Deno.env.get("APP_URL") || "https://quoteitai.com";
        return new Response(null, {
            status: 302,
            headers: {
                ...corsHeaders,
                "Location": `${appUrl}/settings?qb_connected=true&company=${encodeURIComponent(companyName)}`,
            },
        });

    } catch (error) {
        console.error("QuickBooks callback error:", error);
        return redirectWithError("An unexpected error occurred");
    }
});

function redirectWithError(message: string): Response {
    const appUrl = Deno.env.get("APP_URL") || "https://quoteitai.com";
    return new Response(null, {
        status: 302,
        headers: {
            "Location": `${appUrl}/settings?qb_error=${encodeURIComponent(message)}`,
        },
    });
}
