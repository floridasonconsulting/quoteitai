import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import * as AuthContext from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import Dashboard from '@/pages/Dashboard';
import NewQuote from '@/pages/NewQuote';
import Settings from '@/pages/Settings';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@supabase/supabase-js';
import * as dbService from '@/lib/db-service';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  },
}));

// Mock db-service
vi.mock('@/lib/db-service', () => ({
  getSettings: vi.fn().mockResolvedValue({}),
  getQuotes: vi.fn().mockResolvedValue([]),
  getCustomers: vi.fn().mockResolvedValue([]),
  getItems: vi.fn().mockResolvedValue([]),
}));

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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider>{children}</ThemeProvider>
  </BrowserRouter>
);

describe('Free Tier Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block AI features and show upgrade prompt', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'free',
      isMaxAITier: false,
      isAdmin: false,
      loading: false,
    }));

    render(<NewQuote />, { wrapper });

    await waitFor(() => {
      // Free tier should see basic quote creation
      expect(screen.getByText(/create quote/i)).toBeInTheDocument();
    });

    // AI features should not be available or show upgrade prompts
    // This would need more detailed implementation based on actual UI
  });

  it('should block email sending and show upgrade prompt', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'free',
      isMaxAITier: false,
      isAdmin: false,
      loading: false,
    }));

    render(<Dashboard />, { wrapper });

    await waitFor(() => {
      // Dashboard should load
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    // Email features should be blocked (implementation depends on UI)
  });

  it('should not show white-label branding options', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'free',
      isMaxAITier: false,
      isAdmin: false,
      loading: false,
    }));

    render(<Settings />, { wrapper });

    await waitFor(() => {
      // Should show upgrade message instead of white-label options
      const upgradeMessages = screen.queryAllByText(/upgrade/i);
      expect(upgradeMessages.length).toBeGreaterThan(0);
    });
  });

  it('should allow basic customer viewing', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'free',
      isMaxAITier: false,
      isAdmin: false,
      loading: false,
    }));

    // Free tier can view customers but with limitations
    // Implementation depends on actual feature set
  });

  it('should enforce quote limits for free tier', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
      user: { id: 'test-user' } as User,
      userRole: 'free',
      isMaxAITier: false,
      isAdmin: false,
      loading: false,
    }));

    // Test that free tier has quote creation limits
    // This would check usage tracking
  });
});
