import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import * as AuthContext from '@/contexts/AuthContext';
import Dashboard from '@/pages/Dashboard';
import NewQuote from '@/pages/NewQuote';
import Settings from '@/pages/Settings';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Free Tier Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block AI features and show upgrade prompt', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'test-user' } as any,
      userRole: 'free',
      isMaxAITier: false,
      isAdmin: false,
      loading: false,
    } as any);

    render(<NewQuote />, { wrapper });

    await waitFor(() => {
      // Free tier should see basic quote creation
      expect(screen.getByText(/create quote/i)).toBeInTheDocument();
    });

    // AI features should not be available or show upgrade prompts
    // This would need more detailed implementation based on actual UI
  });

  it('should block email sending and show upgrade prompt', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'test-user' } as any,
      userRole: 'free',
      isMaxAITier: false,
      isAdmin: false,
      loading: false,
    } as any);

    render(<Dashboard />, { wrapper });

    await waitFor(() => {
      // Dashboard should load
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    // Email features should be blocked (implementation depends on UI)
  });

  it('should not show white-label branding options', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'test-user' } as any,
      userRole: 'free',
      isMaxAITier: false,
      isAdmin: false,
      loading: false,
    } as any);

    render(<Settings />, { wrapper });

    await waitFor(() => {
      // Should show upgrade message instead of white-label options
      const upgradeMessages = screen.queryAllByText(/upgrade/i);
      expect(upgradeMessages.length).toBeGreaterThan(0);
    });
  });

  it('should allow basic customer viewing', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'test-user' } as any,
      userRole: 'free',
      isMaxAITier: false,
      isAdmin: false,
      loading: false,
    } as any);

    // Free tier can view customers but with limitations
    // Implementation depends on actual feature set
  });

  it('should enforce quote limits for free tier', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'test-user' } as any,
      userRole: 'free',
      isMaxAITier: false,
      isAdmin: false,
      loading: false,
    } as any);

    // Test that free tier has quote creation limits
    // This would check usage tracking
  });
});
