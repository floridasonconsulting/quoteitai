import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  | 'content_generation';

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
};

export function useAI(featureType: AIFeatureType, options?: UseAIOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generate = async (prompt: string, context?: Record<string, unknown>): Promise<string | AIUpgradeInfo | null> => {
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
      const rateLimitKey = FEATURE_RATE_LIMIT_MAP[featureType] || 'ai-assist';

      const data = await rateLimiter.trackRequest(rateLimitKey, async () => {
        try {
          // Use the single, primary supabase client
          const { data, error } = await supabase.functions.invoke('ai-assist', {
            body: { 
              featureType, 
              prompt: sanitizedPrompt, 
              context 
            },
          });

          if (error) {
            console.error('[useAI] Edge Function invoke error:', error);
            if (error.message?.includes('404') || 
                error.message?.includes('FunctionsRelayError') ||
                error.message?.includes('FunctionsHttpError')) {
              return {
                error: 'AI features are currently unavailable. The app works without AI assistance - you can still create quotes manually.'
              };
            }
            throw new Error('Failed to connect to AI service. Please try again.');
          }

          return data;
        } catch (invokeError) {
          console.error('[useAI] Edge Function not available:', invokeError);
          return {
            error: 'AI features are not available. Edge Functions need to be deployed to your Supabase project.'
          };
        }
      });

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

      if (data?.error) {
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

      if (data?.content) {
        setResult(data.content);
        options?.onSuccess?.(data.content);
        toast.success('AI generated successfully!');
        return data.content;
      }

      throw new Error('Invalid response from AI service');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI generation failed';
      console.error('[useAI] AI generation error:', error);
      
      if (message.includes('Rate limit exceeded')) {
        toast.error('Too Many Requests', {
          description: message,
          duration: 5000,
        });
      } else if (message.includes('Edge Functions') || message.includes('unavailable')) {
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
