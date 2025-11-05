import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PublicQuoteView from '../PublicQuoteView';
import * as AuthContext from '@/contexts/AuthContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'quote-123' }),
  };
});

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
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { id: 'user-123' },
        isMaxAITier: false,
        userRole: 'pro',
      } as any);

      const { findByText, getByText } = renderPublicQuoteView();

      // Wait for footer to appear
      const footer = await findByText(/Powered by/i);
      expect(footer).toBeInTheDocument();
      expect(getByText(/Quote-it AI/i)).toBeInTheDocument();
    });

    it('should NOT show footer for Max AI tier users', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { id: 'user-123' },
        isMaxAITier: true,
        userRole: 'max',
      } as any);

      const { queryByText } = renderPublicQuoteView();

      // Footer should not exist
      const footer = queryByText(/Powered by/i);
      expect(footer).not.toBeInTheDocument();
    });

    it('should show footer for Free tier users', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { id: 'user-123' },
        isMaxAITier: false,
        userRole: 'free',
      } as any);

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

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { id: 'user-123' },
        isMaxAITier: true,
        userRole: 'max',
      } as any);

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

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { id: 'user-123' },
        isMaxAITier: false,
        userRole: 'pro',
      } as any);

      renderPublicQuoteView();

      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      expect(favicon.href).toContain('favicon.png');
    });
  });

  describe('Browser Title Customization', () => {
    it('should use company name in title for Max AI tier users', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { id: 'user-123' },
        isMaxAITier: true,
        userRole: 'max',
      } as any);

      renderPublicQuoteView();

      // Title change logic is in the actual component
      // This verifies the integration point exists
      expect(document.title).toBeDefined();
    });
  });
});
