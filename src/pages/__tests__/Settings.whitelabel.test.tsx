import { render } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Settings from '../Settings';
import * as AuthContext from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@supabase/supabase-js';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
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

const renderSettings = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Settings - White-Label Branding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tier-Based Access Control', () => {
    it('should show upgrade prompt for non-Max AI tier users', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: false,
        userRole: 'pro',
      }));

      const { getByText, queryByText } = renderSettings();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(queryByText(/Loading settings/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Now check for the upgrade prompt
      await waitFor(() => {
        expect(getByText(/Upgrade to Max AI/i)).toBeInTheDocument();
        expect(getByText(/White-label branding is available/i)).toBeInTheDocument();
      });
    });

    it('should show logo upload for Max AI tier users', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: true,
        userRole: 'max',
      }));

      const { getByText, queryByText } = renderSettings();

      await waitFor(() => {
        expect(getByText(/Company Logo for Branding/i)).toBeInTheDocument();
        expect(queryByText(/Upgrade to Max AI/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Logo Upload Functionality', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: true,
        userRole: 'max',
      }));
    });

    it('should validate file size (max 2MB)', async () => {
      const { getByLabelText } = renderSettings();

      const file = new File(['x'.repeat(3 * 1024 * 1024)], 'large-logo.png', {
        type: 'image/png',
      });

      const input = getByLabelText(/Company Logo for Branding/i) as HTMLInputElement;
      const user = userEvent.setup();
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: expect.stringContaining('2MB'),
            variant: 'destructive',
          })
        );
      });
    });

    it('should validate file type (images only)', async () => {
      const { getByLabelText } = renderSettings();

      const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const input = getByLabelText(/Company Logo for Branding/i) as HTMLInputElement;
      const user = userEvent.setup();
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: expect.stringContaining('image'),
            variant: 'destructive',
          })
        );
      });
    });

    it('should successfully upload valid logo', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: () => ({
          data: { publicUrl: 'https://example.com/logo.png' },
        }),
      } as ReturnType<typeof supabase.storage.from>);

      vi.mocked(supabase.from).mockReturnValue({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: mockUpdate,
            }),
          }),
        }),
      } as ReturnType<typeof supabase.from>);

      const { getByLabelText } = renderSettings();

      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const input = getByLabelText(/Company Logo for Branding/i) as HTMLInputElement;
      const user = userEvent.setup();
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            description: expect.stringContaining('uploaded'),
          })
        );
      });
    });
  });

  describe('Logo Delete Functionality', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: true,
        userRole: 'max',
      }));
      
      // CRITICAL: Mock Supabase to return existing logo so Remove button appears
      const mockSelect = vi.fn().mockResolvedValue({
        data: { 
          name: 'Test Company',
          logo: 'https://example.com/logo.png',
          primary_color: '#3b82f6',
          secondary_color: '#8b5cf6'
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: mockSelect,
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }),
      } as ReturnType<typeof supabase.from>);
    });

    it('should show remove button when logo exists', async () => {
      const { getByText, queryByText } = renderSettings();

      // Wait for component to load with logo data
      await waitFor(() => {
        expect(queryByText(/Loading settings/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show Remove Logo button since logo exists in mock data
      await waitFor(() => {
        expect(getByText(/Remove Logo/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Should NOT show upgrade prompt since user is Max tier
      expect(queryByText(/Upgrade to Max AI/i)).not.toBeInTheDocument();
    });

    it('should successfully delete logo', async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as ReturnType<typeof supabase.storage.from>);

      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: { 
                name: 'Test Company',
                logo: 'https://example.com/company-logos/user-123/logo.png',
                primary_color: '#3b82f6',
                secondary_color: '#8b5cf6'
              },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: mockUpdate,
            }),
          }),
        }),
      } as ReturnType<typeof supabase.from>);

      const { getByText, queryByText } = renderSettings();
      const user = userEvent.setup();

      // Wait for component to load
      await waitFor(() => {
        expect(queryByText(/Loading settings/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Wait for Remove Logo button to appear
      await waitFor(() => {
        expect(getByText(/Remove Logo/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click Remove Logo button
      const removeButton = getByText(/Remove Logo/i);
      await user.click(removeButton);

      // Wait for confirmation dialog and click Delete
      await waitFor(() => {
        const confirmButton = getByText(/^Delete$/i);
        expect(confirmButton).toBeInTheDocument();
        return user.click(confirmButton);
      });

      // Verify deletion API calls were made
      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalled();
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            description: expect.stringContaining('removed'),
          })
        );
      });
    });
  });
});
