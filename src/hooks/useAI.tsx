import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AIFeatureType =
  | 'quote_title'
  | 'notes_generator'
  | 'item_description'
  | 'quote_summary'
  | 'followup_message'
  | 'discount_justification'
  | 'email_draft'
  | 'full_quote_generation'
  | 'item_recommendations'
  | 'pricing_optimization'
  | 'follow_up_suggestions'
  | 'customer_insights'
  | 'competitive_analysis';

interface UseAIOptions {
  onSuccess?: (content: string) => void;
  onError?: (error: string) => void;
}

export function useAI(featureType: AIFeatureType, options?: UseAIOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generate = async (prompt: string, context?: any) => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: { featureType, prompt, context },
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

      // Handle edge function response errors
      if (data?.error) {
        // Check if this is a tier restriction
        if (data.requiresUpgrade) {
          // Determine which tier is needed based on the error message
          const needsMax = data.error.toLowerCase().includes('max');
          const tierName = needsMax ? 'Max AI' : 'Pro';
          
          toast.error(`${tierName} Feature Required`, {
            description: data.error,
            duration: 6000,
            action: {
              label: 'Upgrade Now',
              onClick: () => {
                window.location.href = '/subscription';
              },
            },
          });
        } else {
          // Other errors (rate limits, etc.)
          toast.error('AI Request Failed', {
            description: data.error,
            duration: 5000,
          });
        }
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
