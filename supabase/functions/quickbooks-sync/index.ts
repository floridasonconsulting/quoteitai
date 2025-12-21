import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getQuickBooksClient, createQuickBooksInvoice, findOrCreateQuickBooksCustomer } from "../_shared/quickbooks.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { action, quoteId, organizationId, userId: providedUserId } = await req.json();

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get the user ID
        let userId: string = providedUserId;
        if (!userId) {
            if (quoteId) {
                const { data: quote } = await supabase.from("quotes").select("user_id").eq("id", quoteId).single();
                if (!quote) throw new Error("Quote not found");
                userId = quote.user_id;
            } else if (organizationId) {
                // Search for user by organization
                const { data: settings } = await supabase.from("company_settings").select("user_id").eq("organization_id", organizationId).maybeSingle();
                if (!settings) {
                    // Fallback: search across all settings for this org
                    const { data: allSettings } = await supabase.from("company_settings").select("user_id").maybeSingle();
                    userId = allSettings?.user_id;
                } else {
                    userId = settings.user_id;
                }
            }
        }

        if (!userId) throw new Error("Could not determine user for sync");

        const { accessToken, realmId } = await getQuickBooksClient(supabase, userId);

        if (action === 'push_quote') {
            return await handlePushQuote(supabase, quoteId, accessToken, realmId);
        } else if (action === 'sync_customers' || !action) {
            // Default action is sync_customers if none provided (backward compatibility with settings sync)
            return await handleSyncCustomers(supabase, userId, accessToken, realmId);
        } else {
            throw new Error(`Invalid action: ${action}`);
        }

    } catch (error) {
        console.error('QuickBooks sync error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

async function handlePushQuote(supabase: any, quoteId: string, accessToken: string, realmId: string) {
    // Fetch detailed quote data
    const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*, customers(*)')
        .eq('id', quoteId)
        .single();

    if (quoteError || !quote) throw new Error("Failed to fetch quote details");

    // 1. Sync Customer
    const qbCustomer = await findOrCreateQuickBooksCustomer(accessToken, realmId, {
        DisplayName: quote.customer_name,
        PrimaryEmailAddr: { Address: quote.customers?.email || '' },
        PrimaryPhone: { FreeFormNumber: quote.customers?.phone || '' },
    });

    // 2. Map Items to QuickBooks Invoice lines
    const lines = quote.items.map((item: any) => ({
        Description: item.description,
        Amount: item.total,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
            Qty: item.quantity,
            UnitPrice: item.price,
        }
    }));

    // 3. Create Invoice
    const invoiceData = {
        Line: lines,
        CustomerRef: {
            value: qbCustomer.Id
        },
        DocNumber: quote.quote_number,
        PrivateNote: `Imported from Quote-it AI. Quote ID: ${quote.id}`,
    };

    const qbInvoice = await createQuickBooksInvoice(accessToken, realmId, invoiceData);

    // 4. Update quote with QB IDs
    await supabase
        .from('quotes')
        .update({
            quickbooks_invoice_id: qbInvoice.Invoice.Id,
            quickbooks_invoice_number: qbInvoice.Invoice.DocNumber,
            updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

    // Also update customer with QB ID if it doesn't have one
    if (quote.customer_id && !quote.customers?.quickbooks_customer_id) {
        await supabase
            .from('customers')
            .update({ quickbooks_customer_id: qbCustomer.Id })
            .eq('id', quote.customer_id);
    }

    return new Response(
        JSON.stringify({
            success: true,
            invoiceId: qbInvoice.Invoice.Id,
            invoiceNumber: qbInvoice.Invoice.DocNumber
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

async function handleSyncCustomers(supabase: any, userId: string, accessToken: string, realmId: string) {
    // Fetch customers from QuickBooks
    const query = "select * from Customer maxresults 100";
    const response = await fetch(`https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
        }
    });

    if (!response.ok) throw new Error("Failed to fetch customers from QuickBooks");

    const data = await response.json();
    const qbCustomers = data.QueryResponse?.Customer || [];

    let importedCount = 0;
    for (const qbCust of qbCustomers) {
        const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('quickbooks_customer_id', qbCust.Id)
            .maybeSingle();

        if (!existing) {
            const { error } = await supabase.from('customers').insert({
                user_id: userId,
                name: qbCust.DisplayName,
                email: qbCust.PrimaryEmailAddr?.Address || '',
                phone: qbCust.PrimaryPhone?.FreeFormNumber || '',
                quickbooks_customer_id: qbCust.Id,
                created_at: new Date().toISOString(),
            });
            if (!error) importedCount++;
        }
    }

    return new Response(
        JSON.stringify({ success: true, importedCount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}
