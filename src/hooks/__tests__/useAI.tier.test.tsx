import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAI, AIFeatureType } from '@/hooks/useAI';
import { supabase } from '@/integrations/supabase/client';

describe('useAI Tier-Based Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pro Tier AI Features', () => {
    const proTierFeatures: AIFeatureType[] = [
      'quote_title',
      'notes_generator',
      'item_description',
      'quote_summary',
      'followup_message',
      'discount_justification',
      'email_draft',
    ];

    proTierFeatures.forEach((feature) => {
      it(`should allow ${feature} for Pro tier users`, async () => {
        const mockInvoke = vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: { content: 'AI generated content' },
          error: null,
        });

        const { result } = renderHook(() => useAI(feature));

        await result.current.generate('test prompt');

        await waitFor(() => {
          expect(mockInvoke).toHaveBeenCalledWith('ai-assist', {
            body: {
              featureType: feature,
              prompt: 'test prompt',
              context: undefined,
            },
          });
        });
      });

      it(`should block ${feature} for Free tier users`, async () => {
        const mockInvoke = vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: {
            requiresUpgrade: true,
            error: 'This feature requires Pro tier',
          },
          error: null,
        });

        const onUpgradeRequired = vi.fn();
        const { result } = renderHook(() =>
          useAI(feature, { onUpgradeRequired })
        );

        await result.current.generate('test prompt');

        await waitFor(() => {
          expect(onUpgradeRequired).toHaveBeenCalledWith('pro');
        });
      });
    });

    it('should enforce 30/month limit for followup_message in Pro tier', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          error: 'Monthly AI request limit reached',
        },
        error: null,
      });

      const { result } = renderHook(() => useAI('followup_message'));

      await result.current.generate('test prompt');

      await waitFor(() => {
        expect(result.current.result).toBeNull();
      });
    });
  });

  describe('Max AI Exclusive Features', () => {
    const maxAIFeatures: AIFeatureType[] = [
      'full_quote_generation',
      'item_recommendations',
      'pricing_optimization',
      'follow_up_suggestions',
      'customer_insights',
      'competitive_analysis',
    ];

    maxAIFeatures.forEach((feature) => {
      it(`should allow ${feature} for Max AI tier users`, async () => {
        const mockInvoke = vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: { content: 'AI generated content' },
          error: null,
        });

        const { result } = renderHook(() => useAI(feature));

        await result.current.generate('test prompt');

        await waitFor(() => {
          expect(mockInvoke).toHaveBeenCalledWith('ai-assist', {
            body: {
              featureType: feature,
              prompt: 'test prompt',
              context: undefined,
            },
          });
        });
      });

      it(`should block ${feature} for Pro tier users`, async () => {
        const mockInvoke = vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: {
            requiresUpgrade: true,
            error: 'This feature requires Max AI tier',
          },
          error: null,
        });

        const onUpgradeRequired = vi.fn();
        const { result } = renderHook(() =>
          useAI(feature, { onUpgradeRequired })
        );

        await result.current.generate('test prompt');

        await waitFor(() => {
          expect(onUpgradeRequired).toHaveBeenCalledWith('max');
        });
      });

      it(`should block ${feature} for Free tier users`, async () => {
        const mockInvoke = vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: {
            requiresUpgrade: true,
            error: 'This feature requires Max AI tier',
          },
          error: null,
        });

        const onUpgradeRequired = vi.fn();
        const { result } = renderHook(() =>
          useAI(feature, { onUpgradeRequired })
        );

        await result.current.generate('test prompt');

        await waitFor(() => {
          expect(onUpgradeRequired).toHaveBeenCalledWith('max');
        });
      });
    });
  });

  describe('AI Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      });

      const onError = vi.fn();
      const { result } = renderHook(() =>
        useAI('quote_title', { onError })
      );

      await result.current.generate('test prompt');

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        expect(result.current.result).toBeNull();
      });
    });

    it('should handle AI service errors gracefully', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          error: 'AI service unavailable',
        },
        error: null,
      });

      const onError = vi.fn();
      const { result } = renderHook(() =>
        useAI('quote_title', { onError })
      );

      await result.current.generate('test prompt');

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('AI service unavailable');
      });
    });

    it('should return upgrade info when upgrade is required', async () => {
      const mockInvoke = vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          requiresUpgrade: true,
          error: 'This feature requires Max AI tier',
        },
        error: null,
      });

      const { result } = renderHook(() => useAI('full_quote_generation'));

      const response = await result.current.generate('test prompt');

      expect(response).toEqual({
        needsUpgrade: true,
        requiredTier: 'max',
        featureName: 'full_quote_generation',
      });
    });
  });
});
