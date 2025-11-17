import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
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
  | 'competitive_analysis';

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

export function useAI(featureType: AIFeatureType, options?: UseAIOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generate = async (prompt: string, context?: Record<string, unknown>): Promise<string | AIUpgradeInfo | null> => {
    // Rate limiting check
    const userId = (await supabase.auth.getUser()).data.user?.id || 'anonymous';
    const rateLimitResult = checkRateLimit(userId, 'AI_GENERATION');
    
    if (!rateLimitResult.allowed) {
      toast.error('Rate Limit Reached', {
        description: `Please wait ${rateLimitResult.resetIn} seconds before trying again.`,
      });
      options?.onError?.('Rate limit exceeded');
      return null;
    }

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
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: { 
          featureType, 
          prompt: sanitizedPrompt, 
          context 
        },
      });

      // Handle network/invoke errors
      if (error) {
        console.error('AI invoke error:', error);
        toast.error('Connection Error', {
          description: 'Failed to connect to AI service. Please try again.',
        });
        options?.onError?.(error.message);
        return null;
      }

      // Check for upgrade requirement (now returned with 200 status)
      if (data?.requiresUpgrade) {
        const needsMax = data.error?.toLowerCase().includes('max');
        const requiredTier = needsMax ? 'max' : 'pro';
        
        options?.onUpgradeRequired?.(requiredTier);
        
        return {
          needsUpgrade: true,
          requiredTier,
          featureName: featureType
        };
      }

      // Handle other errors
      if (data?.error) {
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
      console.error('AI generation error:', error);
      toast.error('AI Generation Error', {
        description: message,
      });
      options?.onError?.(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generate, isLoading, result };
}
