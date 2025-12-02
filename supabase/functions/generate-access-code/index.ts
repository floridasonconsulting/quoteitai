import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareToken, email } = await req.json();

    if (!shareToken || !email) {
      return new Response(
        JSON.stringify({ error: "shareToken and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get quote by share token
    const { data: quote, error: quoteError } = await supabaseClient
      .from("quotes")
      .select("id, customer_id, user_id, authorized_viewers, expires_at")
      .eq("share_token", shareToken)
      .single();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ error: "Quote not found or link expired" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check if link has expired
    if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Quote link has expired", expired: true }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Get customer email
    const { data: customer } = await supabaseClient
      .from("customers")
      .select("email")
      .eq("id", quote.customer_id)
      .single();

    const customerEmail = customer?.email?.toLowerCase();
    const requestEmail = email.toLowerCase();

    // 4. Verify email is authorized (customer email or in authorized_viewers list)
    const authorizedViewers = quote.authorized_viewers || [];
    const isAuthorized =
      requestEmail === customerEmail ||
      authorizedViewers.some((viewer: string) => viewer.toLowerCase() === requestEmail);

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Email not authorized to view this proposal" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 6. Save code to database (expires in 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error: codeError } = await supabaseClient
      .from("proposal_access_codes")
      .insert({
        quote_id: quote.id,
        email: requestEmail,
        code,
        expires_at: expiresAt,
      });

    if (codeError) {
      console.error("Error saving access code:", codeError);
      return new Response(
        JSON.stringify({ error: "Failed to generate access code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Send email with code (using Resend)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Quote.it AI <noreply@quoteit.ai>",
            to: [email],
            subject: "Your Secure Proposal Access Code",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Secure Access Code</h2>
                <p>Your one-time access code is:</p>
                <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
                  ${code}
                </div>
                <p style="color: #6b7280; font-size: 14px;">This code expires in 15 minutes.</p>
                <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error("Failed to send email:", await emailResponse.text());
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the request if email fails - code is still valid
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Access code sent to your email",
        expiresIn: 900, // 15 minutes in seconds
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
