import { useState } from 'react';
import { supabaseFunctions } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { rateLimiter } from '@/lib/rate-limiter';
import { sanitizeForAI } from '@/lib/input-sanitization';

export type AIFeatureType =
  | 'quote_title'
  | 'notes_generator'
  | 'item_description'
  | 'quote_summary'
  | 'followup_message'
  | 'discount_justification'
  | 'email_draft'
  | 'scope_of_work'
  | 'full_quote_generation'
  | 'item_recommendations'
  | 'pricing_optimization'
  | 'follow_up_suggestions'
  | 'customer_insights'
  | 'competitive_analysis'
  | 'rfp_response_matching'
  | 'content_generation'
  | 'advanced_analytics';

interface UseAIOptions {
  onSuccess?: (content: string) => void;
  onError?: (error: string) => void;
  onUpgradeRequired?: (requiredTier: 'pro' | 'max') => void;
}

export interface AIUpgradeInfo {
  needsUpgrade: true;
  requiredTier: 'pro' | 'max';
  featureName: AIFeatureType;
}

// Map feature types to rate limit keys
const FEATURE_RATE_LIMIT_MAP: Record<AIFeatureType, string> = {
  quote_title: 'ai-assist',
  notes_generator: 'ai-assist',
  item_description: 'ai-assist',
  quote_summary: 'ai-assist',
  followup_message: 'ai-follow-up',
  discount_justification: 'ai-assist',
  email_draft: 'ai-follow-up',
  scope_of_work: 'ai-assist',
  full_quote_generation: 'ai-quote-generation',
  item_recommendations: 'ai-item-recommendations',
  pricing_optimization: 'ai-pricing-optimization',
  follow_up_suggestions: 'ai-follow-up',
  customer_insights: 'ai-assist',
  competitive_analysis: 'ai-assist',
  rfp_response_matching: 'ai-assist',
  content_generation: 'ai-assist',
  advanced_analytics: 'ai-assist',
};

export function useAI(featureType: AIFeatureType, options?: UseAIOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generate = async (prompt: string, context?: Record<string, unknown>): Promise<string | AIUpgradeInfo | null> => {
    // Sanitize prompt to prevent injection attacks
    const sanitizedPrompt = sanitizeForAI(prompt);

    if (!sanitizedPrompt) {
      toast.error('Invalid Input', {
        description: 'Please provide valid input for AI generation.',
      });
      return null;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Get the appropriate rate limit key for this feature
      const rateLimitKey = FEATURE_RATE_LIMIT_MAP[featureType] || 'ai-assist';

      // Wrap the API call with rate limiting
      const data = await rateLimiter.trackRequest(rateLimitKey, async () => {
        try {
          const { data, error } = await supabaseFunctions.functions.invoke('ai-assist', {
            body: {
              featureType,
              prompt: sanitizedPrompt,
              context
            },
          });

          // Handle network/invoke errors
          if (error) {
            console.error('[useAI] Edge Function invoke error (full):', JSON.stringify(error, null, 2));
            console.error('[useAI] Error name:', error.name);
            console.error('[useAI] Error message:', error.message);

            // Check if it's a 404 (Edge Function doesn't exist)
            if (error.message?.includes('404') ||
              error.message?.includes('FunctionsRelayError') ||
              error.message?.includes('FunctionsHttpError')) {
              // Return graceful error instead of throwing
              return {
                error: 'AI features are currently unavailable. The app works without AI assistance - you can still create quotes manually.'
              };
            }

            throw new Error('Failed to connect to AI service. Please try again.');
          }

          return data;
        } catch (invokeError) {
          console.error('[useAI] Edge Function not available:', invokeError);

          // Return a friendly error for missing Edge Functions
          return {
            error: 'AI features are not available. Edge Functions need to be deployed to your Supabase project.'
          };
        }
      });

      // Check for upgrade requirement (now returned with 200 status)
      if (data?.requiresUpgrade) {
        const needsMax = data.error?.toLowerCase?.()?.includes('max') ?? false;
        const requiredTier = needsMax ? 'max' : 'pro';

        options?.onUpgradeRequired?.(requiredTier);

        return {
          needsUpgrade: true,
          requiredTier,
          featureName: featureType
        };
      }

      // Handle errors - but show as info toast, not error
      if (data?.error) {
        // If it's about missing Edge Functions, just log it - don't show error to user during signup
        if (data.error.includes('Edge Functions') || data.error.includes('unavailable')) {
          console.info('[useAI] AI features not available:', data.error);
          options?.onError?.(data.error);
          return null;
        }

        toast.error('AI Request Failed', {
          description: data.error,
          duration: 5000,
        });
        options?.onError?.(data.error);
        return null;
      }

      // Success case
      if (data?.content) {
        setResult(data.content);
        options?.onSuccess?.(data.content);
        toast.success('AI generated successfully!');
        return data.content;
      }

      // Unexpected response format
      throw new Error('Invalid response from AI service');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI generation failed';
      console.error('[useAI] AI generation error:', error);

      // Special handling for rate limit errors
      if (message.includes('Rate limit exceeded')) {
        toast.error('Too Many Requests', {
          description: message,
          duration: 5000,
        });
      } else if (message.includes('Edge Functions') || message.includes('unavailable')) {
        // Edge Function deployment error - just log, don't show toast
        console.info('[useAI] AI features unavailable:', message);
      } else {
        toast.error('AI Generation Error', {
          description: message,
        });
      }

      options?.onError?.(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generate, isLoading, result };
}