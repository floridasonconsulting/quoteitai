import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[AI-ASSIST] ${step}${detailsStr}`);
};

// Utility to strip markdown code blocks from AI responses
const stripMarkdownCodeBlocks = (content: string): string => {
  // Remove ```json and ``` wrappers, also handle ```javascript, ```ts, etc.
  const codeBlockPattern = /^```(?:json|javascript|typescript|ts|js)?\s*\n?([\s\S]*?)\n?```$/;
  const match = content.trim().match(codeBlockPattern);
  return match ? match[1].trim() : content.trim();
};

// Feature configuration with tier restrictions and limits
const FEATURE_CONFIG = {
  // Pro Tier Features
  quote_title: { tier: "pro", monthlyLimit: 50 },
  notes_generator: { tier: "pro", monthlyLimit: 50 },
  item_description: { tier: "pro", monthlyLimit: 50 },
  quote_summary: { tier: "pro", monthlyLimit: 50 },
  followup_message: { tier: "pro", monthlyLimit: 30 },
  discount_justification: { tier: "pro", monthlyLimit: 50 },
  email_draft: { tier: "pro", monthlyLimit: null }, // unlimited
  scope_of_work: { tier: "pro", monthlyLimit: 25 },
  
  // Max Tier Features
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

    // CRITICAL: Server-side rate limiting to prevent API abuse
    const rateLimit = checkRateLimit(user.id, "AI_GENERATION");
    if (!rateLimit.allowed) {
      logStep("Rate limit exceeded", { 
        userId: user.id, 
        remaining: rateLimit.remaining, 
        resetIn: rateLimit.resetIn 
      });
      
      return new Response(
        JSON.stringify({ 
          error: `Rate limit exceeded. You can make ${rateLimit.limit} AI requests per minute. Please try again in ${rateLimit.resetIn} seconds.`,
          rateLimitExceeded: true,
          resetIn: rateLimit.resetIn,
        }),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.resetIn.toString(),
          }, 
          status: 429 
        }
      );
    }

    logStep("Rate limit check passed", { 
      remaining: rateLimit.remaining, 
      limit: rateLimit.limit 
    });

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
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    if (featureConfig.tier === "max" && (userTier === "free" || userTier === "pro")) {
      return new Response(
        JSON.stringify({ error: "This feature requires a Max AI subscription", requiresUpgrade: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
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
    const userPrompt = prompt;

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
      case "quote_summary":
        systemPrompt = `You are a professional business writer. Generate a compelling 2-3 sentence executive summary for this quote.

The summary should:
- Highlight the key value proposition
- Mention the total investment amount
- Create urgency and excitement
- Be customer-focused (what's in it for them)

Keep it concise, professional, and persuasive. This will be the first thing customers see.`;
        break;
      case "followup_message":
        systemPrompt = `You are a sales expert specializing in follow-up communications. Generate a personalized follow-up message for this quote.

Consider:
- Quote age (days since sent)
- Current status (draft, sent, accepted, rejected)
- Customer relationship history
- Quote value and complexity

Create a warm, professional message that:
- References specific details from the quote
- Adds value (insights, options, answers)
- Has a clear call-to-action
- Maintains appropriate urgency based on timing

Keep the tone conversational but professional. Personalize using context provided.`;
        break;
      case "discount_justification":
        systemPrompt = `You are a professional sales consultant. Generate a clear, professional justification for applying a discount to this quote.

The justification should:
- Explain the business rationale for the discount
- Maintain the company's value proposition
- Reference specific context (volume, relationship, timing, etc.)
- Be concise (2-3 sentences)
- Sound professional, not apologetic

Examples of good justifications:
- "Volume discount for purchasing multiple units"
- "Loyalty discount for valued long-term customer"
- "Early commitment discount for project timeline flexibility"
- "Bundle discount for comprehensive service package"

Generate a justification based on the discount percentage and context provided.`;
        break;
      case "email_draft":
        systemPrompt = "You are a professional email writer. Create a professional email template to send with this quote. Include a warm greeting, quote summary, next steps, and professional closing.";
        break;
      case "scope_of_work":
        systemPrompt = `You are a professional business consultant specializing in Scope of Work (SOW) documentation. Generate a comprehensive, legally sound SOW document based on the project details and quote items provided.

CRITICAL RESPONSE FORMAT: Return ONLY raw JSON object. Do NOT wrap in markdown code blocks or use \`\`\`json markers.

Required JSON format:
{
  "projectOverview": "2-3 paragraph overview of the entire project scope, objectives, and expected outcomes",
  "workBreakdown": [
    {
      "phase": "Phase name (e.g., 'Phase 1: Site Preparation')",
      "description": "Detailed description of this phase",
      "tasks": [
        "Specific task 1",
        "Specific task 2",
        "Specific task 3"
      ],
      "duration": "Estimated duration (e.g., '2-3 weeks')",
      "dependencies": "Prerequisites or dependencies for this phase"
    }
  ],
  "deliverables": [
    {
      "name": "Specific deliverable name",
      "description": "What will be delivered",
      "acceptanceCriteria": "Clear, measurable criteria for acceptance",
      "dueDate": "Relative timeline (e.g., 'End of Phase 2')"
    }
  ],
  "timeline": {
    "startDate": "Relative date (e.g., 'Upon contract signing')",
    "milestones": [
      {
        "name": "Milestone name",
        "date": "Relative timeline",
        "criteria": "Completion criteria"
      }
    ],
    "completionDate": "Estimated completion (e.g., '8-10 weeks from start')"
  },
  "exclusions": [
    "Item or service NOT included in this scope",
    "Another exclusion"
  ],
  "assumptions": [
    "Key assumption about the project",
    "Another assumption"
  ],
  "changeManagement": "Brief policy on how scope changes will be handled (1-2 sentences)"
}

SOW Generation Rules:
1. Be SPECIFIC to the actual project details and quote items provided
2. Use the customer's industry terminology
3. Break down work into 3-6 logical phases
4. Include 5-10 clear deliverables with measurable acceptance criteria
5. Provide realistic timelines based on project complexity
6. List 3-5 common exclusions to prevent scope creep
7. Include 3-5 key assumptions (site access, permits, existing conditions, etc.)
8. Make acceptance criteria MEASURABLE (not "looks good" but "passes inspection per code XYZ")
9. Reference actual quote items in the work breakdown
10. Ensure the total scope aligns with the quote total value

Quality Standards:
- Professional business language
- Legally defensible terms
- Clear, unambiguous descriptions
- Realistic timelines
- Specific, measurable criteria

This SOW should be detailed enough to prevent disputes while remaining clear and customer-friendly.`;
        break;
      case "full_quote_generation":
        systemPrompt = `You are a professional business consultant. Based on the project description and available items catalog, generate a complete quote.

CRITICAL RESPONSE FORMAT: Return ONLY the raw JSON object below. Do NOT wrap it in markdown code blocks. Do NOT include \`\`\`json or \`\`\` markers. Return ONLY the JSON object itself.

Required JSON format:
{
  "title": "Professional quote title (max 60 characters)",
  "notes": "Professional terms and conditions (3-4 paragraphs)",
  "summary": "Executive summary (2-3 sentences highlighting key value and total investment)",
  "suggestedItems": [
    {
      "itemId": "id from catalog",
      "name": "item name",
      "description": "item description",
      "quantity": 1,
      "price": 100.00,
      "total": 100.00,
      "units": "units from catalog"
    }
  ]
}

### RULES FOR ITEM QUANTITIES (CRITICAL)
You must determine the quantity (qty) for each line item using the following strict hierarchy:

1. **User Override (Highest Priority)**: If the User's Project Description explicitly states a quantity (e.g., "Install 5 lights", "Need 200 sq ft"), YOU MUST use that specific number, even if it differs from the catalog minimum.

2. **Catalog Minimum (Default Priority)**: If the User's Project Description is vague or does not specify a number (e.g., "Install lighting"), you MUST check the min_quantity field in the provided Item Catalog. If min_quantity is greater than 0, use that value.

3. **Global Fallback**: If no specific quantity is requested, and the item has no min_quantity (or it is 0/1), default the qty to 1.

Other Rules:
- Return ONLY raw JSON, no markdown formatting
- Only suggest items that exist in the provided catalog
- Use exact itemId, name, and units from catalog
- Calculate total = quantity * price
- Suggest 3-8 relevant items based on project scope
- Make notes specific to the project (reference actual details)
- Summary should mention total value and key deliverables
- ALWAYS include min_quantity from catalog when calculating quantities`;
        break;
      case "item_recommendations":
        systemPrompt = `You are a sales consultant specializing in item recommendations. Based on the current quote items, suggest 3-5 complementary items from the available catalog.

CRITICAL RESPONSE FORMAT: Return ONLY raw JSON object. Do NOT wrap in markdown code blocks.

Required JSON format:
{
  "recommendations": [
    {
      "name": "exact item name from catalog",
      "description": "item description from catalog",
      "price": 100.00,
      "priority": "high|medium|low",
      "reasoning": "Why this item complements current quote (1-2 sentences)",
      "units": "units from catalog"
    }
  ]
}

Rules:
- Only suggest items from the provided catalog
- Prioritize items that are commonly paired with current selections
- Explain why each item complements the quote
- Assign priority based on relevance (high/medium/low)
- Return 3-5 recommendations max`;
        break;
      case "pricing_optimization":
        systemPrompt = `You are a pricing strategist and market analyst. Analyze the provided quote and provide comprehensive pricing optimization recommendations.

Your analysis should cover:

1. Market Position: Compare pricing to typical market rates and competitive positioning
2. Margin Optimization: Identify opportunities to increase profitability while staying competitive
3. Bundling Strategy: Suggest package deals that increase perceived value
4. Psychology: Recommend pricing tactics to increase quote acceptance rates

Format your response as a detailed analysis with:
- Specific price adjustment recommendations
- Reasoning for each suggestion
- Expected impact on profitability and acceptance rate
- Clear action items the user can implement

Be specific and actionable. Reference actual quote items, quantities, and prices in your recommendations.`;
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
    let content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content in AI response");

    // Strip markdown code blocks if present
    content = stripMarkdownCodeBlocks(content);

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
    
    // Log failed attempt with full error details server-side only
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
    } catch {
      // Silently ignore logging errors
    }

    // Return sanitized error to client
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
    const clientError = isDevelopment 
      ? errorMessage 
      : 'An error occurred while processing your request. Please try again.';

    return new Response(
      JSON.stringify({ error: clientError }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
