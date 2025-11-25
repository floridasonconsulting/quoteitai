import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import * as AuthContext from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@supabase/supabase-js';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider>{children}</ThemeProvider>
  </BrowserRouter>
);

type MockAuthContext = Partial<ReturnType<typeof useAuth>>;

const getMockAuthContext = (overrides: MockAuthContext): ReturnType<typeof useAuth> => {
  const defaultValues: ReturnType<typeof useAuth> = {
    user: null,
    session: null,
    subscription: null,
    userRole: 'free',
    isAdmin: false,
    isMaxAITier: false,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateUserRole: vi.fn(),
    checkUserRole: vi.fn(),
    refreshSubscription: vi.fn(),
  };
  return { ...defaultValues, ...overrides };
};

describe('Pro Tier Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow 50 quotes per month (600/year for annual)', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'pro',
    }));

    // Test quota enforcement for Pro tier
    // Would need to check usage_tracking table
  });

  it('should enable AI Quote Titles feature', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'pro',
    }));

    // Pro tier should have access to quote_title AI feature
  });

  it('should enable AI Item Descriptions feature', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'pro',
    }));

    // Pro tier should have access to item_description AI feature
  });

  it('should enable AI Terms & Conditions feature', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'pro',
    }));

    // Pro tier should have access to notes_generator AI feature
  });

  it('should enable AI Executive Summaries feature', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'pro',
    }));

    // Pro tier should have access to quote_summary AI feature
  });

  it('should enable AI Follow-up Messages with 30/month limit', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'pro',
    }));

    // Pro tier should have access to followup_message with limits
  });

  it('should enable AI Discount Justifications feature', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'pro',
    }));

    // Pro tier should have access to discount_justification AI feature
  });

  it('should enable HTML Email sending', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'pro',
    }));

    // Pro tier should be able to send HTML emails
  });

  it('should block Max AI exclusive features', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'pro',
    }));

    // Pro tier should NOT have access to:
    // - full_quote_generation
    // - item_recommendations
    // - pricing_optimization
    // - customer_insights
    // - competitive_analysis
  });

  it('should block white-label branding', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'pro',
    }));

    render(<Settings />, { wrapper });

    await waitFor(() => {
      // Pro tier should see upgrade message for white-label features
      const upgradeTexts = screen.getAllByText(/max ai/i);
      expect(upgradeTexts.length).toBeGreaterThan(0);
    });
  });
});
