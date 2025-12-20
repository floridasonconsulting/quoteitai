import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FollowUpSchedule {
    id: string;
    user_id: string;
    quote_id: string;
    schedule_type: string;
    frequency_days: number | null;
    max_follow_ups: number;
    follow_ups_sent: number;
    next_send_at: string;
    last_sent_at: string | null;
    status: string;
    subject_template: string | null;
    message_template: string | null;
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Find all active schedules where next_send_at is in the past
        const { data: pendingSchedules, error: fetchError } = await supabase
            .from("follow_up_schedules")
            .select(`
        *,
        quotes!inner(
          id,
          quote_number,
          title,
          customer_name,
          total,
          status,
          share_token,
          user_id
        )
      `)
            .eq("status", "active")
            .lte("next_send_at", new Date().toISOString())
            .order("next_send_at", { ascending: true })
            .limit(50);

        if (fetchError) {
            throw new Error(`Failed to fetch pending schedules: ${fetchError.message}`);
        }

        if (!pendingSchedules || pendingSchedules.length === 0) {
            return new Response(
                JSON.stringify({ message: "No pending follow-ups", processed: 0 }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Processing ${pendingSchedules.length} pending follow-ups`);

        let processed = 0;
        let errors = 0;

        for (const schedule of pendingSchedules) {
            try {
                const quote = (schedule as any).quotes;

                // Skip if quote is already accepted/declined
                if (quote.status === "accepted" || quote.status === "declined") {
                    // Mark schedule as completed
                    await supabase
                        .from("follow_up_schedules")
                        .update({
                            status: "completed",
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", schedule.id);
                    continue;
                }

                // Get company settings for email content
                const { data: settings } = await supabase
                    .from("company_settings")
                    .select("name, email, phone")
                    .eq("user_id", quote.user_id)
                    .single();

                // Get customer email
                const { data: customer } = await supabase
                    .from("customers")
                    .select("email, name")
                    .eq("id", quote.customer_id)
                    .single();

                if (!customer?.email) {
                    console.error(`No email for customer on quote ${quote.id}`);
                    continue;
                }

                // Generate quote URL
                const appUrl = Deno.env.get("APP_URL") || "https://quoteitai.com";
                const quoteUrl = `${appUrl}/quote/${encodeURIComponent(quote.share_token)}`;

                // Use custom template or default
                const subject = schedule.subject_template ||
                    `Following up: ${quote.title} - Quote #${quote.quote_number}`;

                const message = schedule.message_template ||
                    `Hi ${customer.name || 'there'},

I wanted to follow up on the quote I sent for "${quote.title}".

If you have any questions or would like to discuss the proposal, please don't hesitate to reach out.

You can view and respond to the quote here:
${quoteUrl}

Best regards,
${settings?.name || 'The Team'}`;

                // Send the follow-up email using existing function
                const { error: sendError } = await supabase.functions.invoke("send-follow-up-email", {
                    body: {
                        customerEmail: customer.email,
                        customerName: customer.name,
                        subject,
                        greeting: "Hello " + (customer.name || 'there') + ",",
                        bodyText: message.split('\n\n').slice(1, -2).join('\n\n'), // Try to extract body if possible, or just send full message
                        closingText: "Best regards,",
                        companyName: settings?.name || 'The Team',
                        includeQuoteReference: true,
                        quoteNumber: quote.quote_number,
                        quoteTitle: quote.title,
                        quoteTotal: quote.total,
                        quoteShareLink: quoteUrl,
                    },
                });

                if (sendError) {
                    throw sendError;
                }

                // Update schedule
                const newFollowUpCount = schedule.follow_ups_sent + 1;
                const isComplete = newFollowUpCount >= schedule.max_follow_ups;

                let nextSendAt = null;
                if (!isComplete && schedule.schedule_type === "recurring" && schedule.frequency_days) {
                    nextSendAt = new Date(Date.now() + schedule.frequency_days * 24 * 60 * 60 * 1000).toISOString();
                }

                await supabase
                    .from("follow_up_schedules")
                    .update({
                        follow_ups_sent: newFollowUpCount,
                        last_sent_at: new Date().toISOString(),
                        next_send_at: nextSendAt,
                        status: isComplete ? "completed" : "active",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", schedule.id);

                processed++;
                console.log(`Sent follow-up for quote ${quote.id} (${newFollowUpCount}/${schedule.max_follow_ups})`);

            } catch (err) {
                console.error(`Error processing schedule ${schedule.id}:`, err);
                errors++;
            }
        }

        return new Response(
            JSON.stringify({
                message: `Processed ${processed} follow-ups, ${errors} errors`,
                processed,
                errors
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Scheduled follow-up error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
