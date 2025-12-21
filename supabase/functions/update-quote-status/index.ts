import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateQuoteStatusRequest {
  shareToken: string;
  status: 'accepted' | 'declined' | 'commented';
  comment?: string;
  sectionId?: string;
  signatureData?: string;
  signerName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reqData: UpdateQuoteStatusRequest = await req.json();
    const { shareToken, status } = reqData;

    // Validate input
    if (!shareToken || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing shareToken or status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (status !== 'accepted' && status !== 'declined' && status !== 'commented') {
      return new Response(
        JSON.stringify({ error: 'Invalid status. Must be "accepted", "declined", or "commented"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find quote by share token
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, status')
      .eq('share_token', shareToken)
      .single();

    if (fetchError || !quote) {
      return new Response(
        JSON.stringify({ error: 'Quote not found or link has expired' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If status is 'commented', we don't necessarily want to change the quote's primary status
    // but we might want to track that it was commented on.
    // For now, let's update the status if it's accepted/declined.
    if (status === 'accepted' || status === 'declined') {
      const updatePayload: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'accepted' && reqData.signatureData) {
        updatePayload.signature_data = reqData.signatureData;
        updatePayload.signed_at = new Date().toISOString();
        updatePayload.signed_by_name = reqData.signerName || 'Client';
      }

      const { error: updateError } = await supabase
        .from('quotes')
        .update(updatePayload)
        .eq('share_token', shareToken);

      if (updateError) {
        throw updateError;
      }
    }

    console.log(`Quote status updated: ${shareToken} -> ${status}`);

    // Fetch quote details to get owner info
    const { data: quoteDetails, error: detailsError } = await supabase
      .from('quotes')
      .select('id, user_id, quote_number, customer_name, title, share_token')
      .eq('share_token', shareToken)
      .single();

    if (!detailsError && quoteDetails) {
      // Handle comment/conversation
      if (status === 'commented' && reqData.comment) {
        const { error: convError } = await supabase
          .from('proposal_conversations')
          .insert({
            organization_id: (quoteDetails as any).organization_id,
            quote_id: quoteDetails.id,
            section_id: reqData.sectionId || 'general',
            client_name: quoteDetails.customer_name,
            client_question: reqData.comment,
            status: 'pending'
          });

        if (convError) {
          console.error('Failed to save conversation:', convError);
        }
      }

      // Create notification for quote owner
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: quoteDetails.user_id,
          quote_id: quoteDetails.id,
          type: status === 'accepted' ? 'quote_accepted' : (status === 'declined' ? 'quote_declined' : 'quote_commented'),
          message: status === 'commented'
            ? `New feedback from ${quoteDetails.customer_name} on Quote #${quoteDetails.quote_number}`
            : `Quote #${quoteDetails.quote_number} for ${quoteDetails.customer_name} has been ${status}`,
          read: false
        });

      if (notifError) {
        console.error('Failed to create notification:', notifError);
      } else {
        console.log(`Notification created for user ${quoteDetails.user_id}`);
      }

      // Check if email notifications are enabled
      const { data: settings } = await supabase
        .from('company_settings')
        .select('notify_email_accepted, notify_email_declined, name')
        .eq('user_id', quoteDetails.user_id)
        .single();

      const shouldSendEmail = status === 'accepted'
        ? settings?.notify_email_accepted !== false
        : settings?.notify_email_declined !== false;

      if (shouldSendEmail) {
        // Fetch user email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', quoteDetails.user_id)
          .single();

        if (profile?.email) {
          try {
            // Get the app URL from environment or construct it
            const appUrl = Deno.env.get('VITE_APP_URL') || `${supabaseUrl.replace('supabase.co', 'lovable.app')}`;
            const quoteLink = `${appUrl}/quote/view/${quoteDetails.share_token}`;

            // Send email notification
            const emailResponse = await supabase.functions.invoke('send-quote-notification', {
              body: {
                email: profile.email,
                quoteId: quoteDetails.id,
                quoteNumber: quoteDetails.quote_number,
                customerName: quoteDetails.customer_name,
                status: status,
                quoteLink: quoteLink,
                companyName: settings?.name || undefined
              }
            });

            if (emailResponse.error) {
              console.error('Failed to send email notification:', emailResponse.error);
              // Email failed but quote status was updated successfully - this is OK
            } else {
              console.log(`✅ Email notification sent to ${profile.email}`);
            }
          } catch (emailError) {
            console.error('⚠️ Email notification failed (quote status updated successfully):', emailError);
            // Don't fail the whole request if email fails - in-app notification still works
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Quote ${status} successfully`,
        status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error updating quote status:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update quote status' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
