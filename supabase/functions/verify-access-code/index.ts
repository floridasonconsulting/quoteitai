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
    const { shareToken, email, code } = await req.json();

    if (!shareToken || !email || !code) {
      return new Response(
        JSON.stringify({ error: "shareToken, email, and code are required" }),
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
      .select("id")
      .eq("share_token", shareToken)
      .single();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ error: "Quote not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Find matching code
    const { data: accessCode, error: codeError } = await supabaseClient
      .from("proposal_access_codes")
      .select("*")
      .eq("quote_id", quote.id)
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .is("verified_at", null)
      .single();

    if (codeError || !accessCode) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired code" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check if code has expired
    if (new Date(accessCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Code has expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Mark code as verified
    await supabaseClient
      .from("proposal_access_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", accessCode.id);

    // 5. Generate session token (valid for 24 hours)
    const sessionToken = crypto.randomUUID();
    const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store session in a cookie-safe format
    const sessionData = {
      token: sessionToken,
      quoteId: quote.id,
      email: email.toLowerCase(),
      expiresAt: sessionExpiry,
    };

    return new Response(
      JSON.stringify({
        success: true,
        sessionToken,
        expiresAt: sessionExpiry,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Set-Cookie": `proposal_session=${JSON.stringify(sessionData)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
