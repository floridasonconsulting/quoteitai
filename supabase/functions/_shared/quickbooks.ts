import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export async function getQuickBooksClient(supabase: any, userId: string) {
    const { data: settings, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (error || !settings?.quickbooks_access_token) {
        throw new Error("QuickBooks not connected");
    }

    let accessToken = settings.quickbooks_access_token;
    const expiresAt = new Date(settings.quickbooks_token_expires_at);

    // Buffer of 5 minutes
    if (expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
        console.log("QuickBooks token expired, refreshing...");
        accessToken = await refreshQuickBooksToken(supabase, userId, settings.quickbooks_refresh_token);
    }

    return {
        accessToken,
        realmId: settings.quickbooks_realm_id,
    };
}

async function refreshQuickBooksToken(supabase: any, userId: string, refreshToken: string) {
    const clientId = Deno.env.get("QUICKBOOKS_CLIENT_ID");
    const clientSecret = Deno.env.get("QUICKBOOKS_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
        throw new Error("QuickBooks credentials not configured");
    }

    const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Token refresh failed:", errorData);
        throw new Error("Failed to refresh QuickBooks token");
    }

    const tokens = await response.json();

    const { error: updateError } = await supabase
        .from("company_settings")
        .update({
            quickbooks_access_token: tokens.access_token,
            quickbooks_refresh_token: tokens.refresh_token,
            quickbooks_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq("user_id", userId);

    if (updateError) {
        throw updateError;
    }

    return tokens.access_token;
}

export async function createQuickBooksInvoice(accessToken: string, realmId: string, invoiceData: any) {
    const response = await fetch(`https://quickbooks.api.intuit.com/v3/company/${realmId}/invoice`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`QuickBooks Invoice creation failed: ${JSON.stringify(errorData)}`);
    }

    return response.json();
}

export async function findOrCreateQuickBooksCustomer(accessToken: string, realmId: string, customerData: any) {
    // First, search by name or email
    const query = `select * from Customer where DisplayName = '${customerData.DisplayName.replace(/'/g, "\\'")}' or PrimaryEmailAddr.Address = '${customerData.PrimaryEmailAddr.Address}'`;
    const searchResponse = await fetch(`https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
        }
    });

    if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.QueryResponse?.Customer?.length > 0) {
            return searchData.QueryResponse.Customer[0];
        }
    }

    // If not found, create
    const createResponse = await fetch(`https://quickbooks.api.intuit.com/v3/company/${realmId}/customer`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(customerData),
    });

    if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(`QuickBooks Customer creation failed: ${JSON.stringify(errorData)}`);
    }

    const result = await createResponse.json();
    return result.Customer;
}
