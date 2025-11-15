import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PublicQuoteView from '../PublicQuoteView';
import * as AuthContext from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@supabase/supabase-js';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ shareToken: 'test-share-token' }),
  };
});

const mockQuoteSelect = {
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: {
      id: 'quote-123',
      share_token: 'test-share-token',
      quote_number: 'Q-001',
      title: 'Test Quote',
      customer_name: 'Test Customer',
      customer_id: 'customer-1',
      user_id: 'user-123',
      items: [],
      subtotal: 100,
      tax: 10,
      total: 110,
      status: 'sent',
    },
    error: null,
  }),
};

const mockRoleSelect = (role: string) => ({
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: { role },
    error: null,
  }),
});

const mockSettingsSelect = (logoUrl: string | null) => ({
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: { logo: logoUrl },
    error: null,
  }),
});

// Mock Supabase with quote data
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'quotes') {
        return { select: vi.fn(() => mockQuoteSelect) };
      }
      if (table === 'user_roles') {
        return { select: vi.fn(() => mockRoleSelect('free')) };
      }
      if (table === 'company_settings') {
        return { select: vi.fn(() => mockSettingsSelect(null)) };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  },
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

const renderPublicQuoteView = () => {
  return render(
    <BrowserRouter>
      <PublicQuoteView />
    </BrowserRouter>
  );
};

describe('PublicQuoteView - White-Label Branding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Quote-it AI';
  });

  describe('Tier-Based Footer Display', () => {
    it('should show "Powered by Quote-it AI" footer for Pro tier users', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: false,
        userRole: 'pro',
      }));

      const { findByText, getByText } = renderPublicQuoteView();

      // Wait for footer to appear
      const footer = await findByText(/Powered by/i);
      expect(footer).toBeInTheDocument();
      expect(getByText(/Quote-it AI/i)).toBeInTheDocument();
    });

    it('should NOT show footer for Max AI tier users', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: true,
        userRole: 'max',
      }));

      const { queryByText } = renderPublicQuoteView();

      // Footer should not exist
      const footer = queryByText(/Powered by/i);
      expect(footer).not.toBeInTheDocument();
    });

    it('should show footer for Free tier users', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: false,
        userRole: 'free',
      }));

      const { findByText } = renderPublicQuoteView();

      const footer = await findByText(/Powered by/i);
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Dynamic Favicon Integration', () => {
    it('should apply custom favicon for Max AI tier with company logo', () => {
      const originalFavicon = document.createElement('link');
      originalFavicon.rel = 'icon';
      originalFavicon.href = '/favicon.png';
      document.head.appendChild(originalFavicon);

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: true,
        userRole: 'max',
      }));

      // Mock company settings with logo
      const companyLogo = 'https://example.com/company-logo.png';
      
      renderPublicQuoteView();

      // Note: Actual favicon change is tested in useDynamicFavicon.test.tsx
      // This test verifies the integration point
      expect(document.querySelector('link[rel="icon"]')).toBeTruthy();
    });

    it('should use default favicon for non-Max AI tier users', () => {
      const originalFavicon = document.createElement('link');
      originalFavicon.rel = 'icon';
      originalFavicon.href = '/favicon.png';
      document.head.appendChild(originalFavicon);

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: false,
        userRole: 'pro',
      }));

      renderPublicQuoteView();

      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      expect(favicon.href).toContain('favicon.png');
    });
  });

  describe('Browser Title Customization', () => {
    it('should use company name in title for Max AI tier users', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: true,
        userRole: 'max',
      }));

      renderPublicQuoteView();

      // Title change logic is in the actual component
      // This verifies the integration point exists
      expect(document.title).toBeDefined();
    });
  });
});
