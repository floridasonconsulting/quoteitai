import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[AI-ASSIST] ${step}${detailsStr}`);
};

// Feature configuration with tier restrictions and limits
const FEATURE_CONFIG = {
  quote_title: { tier: "pro", monthlyLimit: 50 },
  notes_generator: { tier: "pro", monthlyLimit: 50 },
  item_description: { tier: "pro", monthlyLimit: 50 },
  email_draft: { tier: "pro", monthlyLimit: null }, // unlimited
  full_quote_generation: { tier: "max", monthlyLimit: null },
  item_recommendations: { tier: "max", monthlyLimit: null },
  pricing_optimization: { tier: "max", monthlyLimit: null },
  follow_up_suggestions: { tier: "max", monthlyLimit: null },
  customer_insights: { tier: "max", monthlyLimit: null },
  competitive_analysis: { tier: "max", monthlyLimit: 20 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { featureType, prompt, context } = await req.json();
    logStep("Request received", { featureType });

    // Check if feature exists
    const featureConfig = FEATURE_CONFIG[featureType as keyof typeof FEATURE_CONFIG];
    if (!featureConfig) throw new Error("Invalid feature type");

    // Use database function to get highest priority role
    const { data: userRole, error: roleError } = await supabaseClient
      .rpc("get_user_highest_role", { _user_id: user.id });

    logStep("Role query result", { 
      hasData: !!userRole, 
      role: userRole, 
      hasError: !!roleError, 
      errorMsg: roleError?.message 
    });

    let userTier: "free" | "pro" | "max" = "free";
    
    if (userRole) {
      const roleMap: Record<string, "free" | "pro" | "max"> = {
        "admin": "max", // admin gets full access
        "max": "max",
        "pro": "pro",
        "free": "free"
      };
      
      userTier = roleMap[userRole] || "free";
      logStep("User tier from role", { dbRole: userRole, mappedTier: userTier, requiredTier: featureConfig.tier });
    } else {
      // Fall back to subscription check
      const { data: subscription } = await supabaseClient
        .from("subscriptions")
        .select("stripe_product_id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      userTier = subscription?.status === "active" 
        ? (subscription.stripe_product_id?.includes("max") ? "max" : "pro")
        : "free";
      
      logStep("User tier from subscription", { userTier, requiredTier: featureConfig.tier });
    }

    // Check tier access
    if (featureConfig.tier === "pro" && userTier === "free") {
      return new Response(
        JSON.stringify({ error: "This feature requires a Pro or Max AI subscription", requiresUpgrade: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }
    if (featureConfig.tier === "max" && (userTier === "free" || userTier === "pro")) {
      return new Response(
        JSON.stringify({ error: "This feature requires a Max AI subscription", requiresUpgrade: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Check usage limits (only for Pro tier with limits)
    if (userTier === "pro" && featureConfig.monthlyLimit) {
      const { data: usage } = await supabaseClient
        .from("usage_tracking")
        .select("ai_requests_this_month")
        .eq("user_id", user.id)
        .single();

      if (usage && usage.ai_requests_this_month >= featureConfig.monthlyLimit) {
        return new Response(
          JSON.stringify({ 
            error: "Monthly AI limit reached. Upgrade to Max AI for unlimited requests.", 
            requiresUpgrade: true 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
      }
    }

    // Build system prompts based on feature type
    let systemPrompt = "You are a professional business assistant for a quoting application.";
    let userPrompt = prompt;

    switch (featureType) {
      case "quote_title":
        systemPrompt = "You are a professional business assistant. Generate 3 concise, professional quote titles based on the customer and items. Keep each title under 60 characters. Return as JSON array with key 'titles'.";
        break;
      case "notes_generator":
        systemPrompt = `You are a professional business writing assistant. Generate professional terms and conditions for quotes.
        
IMPORTANT: Use the provided context (company info, customer details, items, totals) to create SPECIFIC, RELEVANT terms.
DO NOT use placeholder values like "Your Company", "John Doe", or generic amounts.

Include:
1. Payment terms (specify exact amount from context)
2. Warranty information (reference actual items)
3. Liability limitations
4. Quote validity period (30 days standard)
5. Relevant legal disclaimers

Format as clear, professional terms. Reference actual company name, customer name, and quote total from the context provided.`;
        break;
      case "item_description":
        systemPrompt = "You are a professional copywriter. Enhance the item description to be more professional, sales-oriented, and compelling while maintaining accuracy. Keep it concise.";
        break;
      case "email_draft":
        systemPrompt = "You are a professional email writer. Create a professional email template to send with this quote. Include a warm greeting, quote summary, next steps, and professional closing.";
        break;
      case "full_quote_generation":
        systemPrompt = "You are a professional business consultant. Based on the project description and available items catalog, suggest a complete quote including recommended items, quantities, and pricing strategy. Return structured data.";
        break;
      case "item_recommendations":
        systemPrompt = "You are a sales consultant. Based on the currently selected items, suggest complementary items from the catalog that are commonly paired together.";
        break;
      case "pricing_optimization":
        systemPrompt = "You are a pricing strategist. Analyze the quote and suggest pricing optimizations based on market rates and historical data.";
        break;
      case "follow_up_suggestions":
        systemPrompt = "You are a sales strategist. Suggest optimal follow-up timing and personalized message drafts based on the quote status and customer history.";
        break;
      case "customer_insights":
        systemPrompt = "You are a business analyst. Analyze the customer's quote history and provide insights on buying patterns, preferences, and strategies to win more business.";
        break;
      case "competitive_analysis":
        systemPrompt = "You are a market research analyst. Provide insights on market rates and competitive positioning for the requested service or product.";
        break;
    }

    logStep("Calling Lovable AI", { model: "google/gemini-2.5-flash" });

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt + (context ? `\n\nContext: ${JSON.stringify(context)}` : "") },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service rate limit exceeded. Please try again later." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please contact support." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
        );
      }
      const errorText = await response.text();
      throw new Error(`AI gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content in AI response");

    logStep("AI response received", { contentLength: content.length });

    // Log usage
    await supabaseClient.from("ai_usage_log").insert({
      user_id: user.id,
      feature_type: featureType,
      tokens_used: data.usage?.total_tokens || 0,
      success: true,
    });

    // Update usage tracking - increment counter
    const { data: currentUsage } = await supabaseClient
      .from("usage_tracking")
      .select("ai_requests_this_month")
      .eq("user_id", user.id)
      .single();

    const newCount = (currentUsage?.ai_requests_this_month || 0) + 1;
    await supabaseClient
      .from("usage_tracking")
      .update({
        ai_requests_this_month: newCount,
        last_ai_request_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    logStep("Usage tracked", { newCount });

    return new Response(
      JSON.stringify({ content, tokens: data.usage?.total_tokens || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    // Log failed attempt
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData.user) {
          await supabaseClient.from("ai_usage_log").insert({
            user_id: userData.user.id,
            feature_type: "unknown",
            success: false,
            error_message: errorMessage,
          });
        }
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
