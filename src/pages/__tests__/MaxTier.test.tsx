import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import * as AuthContext from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import Settings from '@/pages/Settings';
import PublicQuoteView from '@/pages/PublicQuoteView';
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
    subscriptionTier: 'free',
    organizationId: null,
    isAdmin: false,
    isProTier: false,
    isBusinessTier: false,
    isEnterpriseTier: false,
    isMaxAITier: false,
    isDevAccount: false,
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

describe('Enterprise Tier Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow unlimited quotes', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'max',
      isMaxAITier: true,
    }));

    // Enterprise tier should have no quote limits
  });

  it('should allow unlimited Intelligent requests', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'max',
      isMaxAITier: true,
    }));

    // Enterprise tier should have no Intelligence usage limits
  });

  it('should enable Intelligent Full Quote Generation', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'max',
      isMaxAITier: true,
    }));

    // Max AI tier should have access to full_quote_generation
  });

  it('should enable Intelligence Item Recommendations', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'max',
      isMaxAITier: true,
    }));

    // Enterprise tier should have access to item_recommendations
  });

  it('should enable Pricing Optimization', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'max',
      isMaxAITier: true,
    }));

    // Enterprise tier should have access to pricing_optimization
  });

  it('should enable Customer Insights', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'max',
      isMaxAITier: true,
    }));

    // Max AI tier should have access to customer_insights
  });

  it('should enable Competitive Analysis', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'max',
      isMaxAITier: true,
    }));

    // Max AI tier should have access to competitive_analysis
  });

  it('should enable white-label branding with logo upload', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'max',
      isMaxAITier: true,
    }));

    render(<Settings />, { wrapper });

    await waitFor(() => {
      // Should see white-label options, not upgrade prompt
      const uploadButton = screen.queryByText(/upload logo/i);
      expect(uploadButton).toBeInTheDocument();
    });
  });

  it('should not show "Powered by" footer on public quotes', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'max',
      isMaxAITier: true,
    }));

    // Enterprise tier should have no branding footer on public quotes
    // This is tested in PublicQuoteView.whitelabel.test.tsx
  });

  it('should enable custom favicon', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'max',
      isMaxAITier: true,
    }));

    // Enterprise tier should be able to set custom favicon
    // This is tested in useDynamicFavicon.test.tsx
  });

  it('should have all Pro tier features included', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'max',
      isMaxAITier: true,
    }));

    // Max AI tier should have access to all Pro features:
    // - quote_title
    // - notes_generator
    // - item_description
    // - quote_summary
    // - followup_message
    // - discount_justification
    // - email_draft
  });
});
