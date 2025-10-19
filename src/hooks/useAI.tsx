import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AIFeatureType =
  | 'quote_title'
  | 'notes_generator'
  | 'item_description'
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

      if (error) throw error;

      if (data.error) {
        if (data.requiresUpgrade) {
          toast.error(data.error, {
            description: `Your current tier doesn't include this feature. Upgrade to unlock AI capabilities.`,
            action: {
              label: 'View Plans',
              onClick: () => window.location.href = '/subscription',
            },
          });
        } else {
          toast.error('AI Generation Failed', {
            description: data.error,
          });
        }
        options?.onError?.(data.error);
        return null;
      }

      setResult(data.content);
      options?.onSuccess?.(data.content);
      toast.success('AI generated successfully!');
      return data.content;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI generation failed';
      toast.error(message);
      options?.onError?.(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generate, isLoading, result };
}
