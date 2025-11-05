import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('AuthContext - Tier-Based Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isMaxAITier flag', () => {
    it('should return true for max tier users', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' },
          } as any,
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'max' },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isMaxAITier).toBe(true);
        expect(result.current.userRole).toBe('max');
      });
    });

    it('should return true for admin tier users', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'admin-123', email: 'admin@example.com' },
          } as any,
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isMaxAITier).toBe(true);
        expect(result.current.userRole).toBe('admin');
      });
    });

    it('should return false for pro tier users', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-456', email: 'pro@example.com' },
          } as any,
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'pro' },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isMaxAITier).toBe(false);
        expect(result.current.userRole).toBe('pro');
      });
    });

    it('should return false for free tier users', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-789', email: 'free@example.com' },
          } as any,
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'free' },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isMaxAITier).toBe(false);
        expect(result.current.userRole).toBe('free');
      });
    });
  });

  describe('White-label feature access validation', () => {
    it('should allow logo upload for Max AI tier', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' },
          } as any,
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'max' },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        // Max AI tier should have white-label branding access
        expect(result.current.isMaxAITier).toBe(true);
      });
    });

    it('should deny logo upload for Pro tier', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-456', email: 'pro@example.com' },
          } as any,
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'pro' },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        // Pro tier should NOT have white-label branding access
        expect(result.current.isMaxAITier).toBe(false);
      });
    });
  });
});
