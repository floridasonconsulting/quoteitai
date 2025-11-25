import { render, screen } from '@testing-library/react';
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
import * as dbService from '@/lib/db-service';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock db-service completely
vi.mock('@/lib/db-service', () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  clearDatabaseData: vi.fn(),
  clearSampleData: vi.fn(),
}));

// Mock useSyncManager to avoid sync operations during tests
vi.mock('@/hooks/useSyncManager', () => ({
  useSyncManager: () => ({
    queueChange: vi.fn(),
    pauseSync: vi.fn(),
    resumeSync: vi.fn(),
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
  }),
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
      // Set up auth context mock BEFORE rendering
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: false,
        userRole: 'pro',
      }));

      // Mock getSettings to return basic settings
      vi.mocked(dbService.getSettings).mockResolvedValue({
        name: 'Test Company',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        website: '',
        terms: '',
      });

      renderSettings();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Loading settings/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Check for upgrade prompt
      await waitFor(() => {
        expect(screen.getByText(/Upgrade to Max AI/i)).toBeInTheDocument();
        expect(screen.getByText(/White-label branding is available/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show logo upload for Max AI tier users', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: true,
        userRole: 'max',
      }));

      vi.mocked(dbService.getSettings).mockResolvedValue({
        name: 'Test Company',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        website: '',
        terms: '',
      });

      renderSettings();

      await waitFor(() => {
        expect(screen.getByText(/Company Logo for Branding/i)).toBeInTheDocument();
        expect(screen.queryByText(/Upgrade to Max AI/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Logo Upload Functionality', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: true,
        userRole: 'max',
      }));

      vi.mocked(dbService.getSettings).mockResolvedValue({
        name: 'Test Company',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        website: '',
        terms: '',
      });
    });

    it('should validate file size (max 2MB)', async () => {
      renderSettings();

      // Wait for component to load completely
      await waitFor(() => {
        expect(screen.queryByText(/Loading settings/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Wait for BrandingSection to render
      await waitFor(() => {
        expect(screen.getByText(/Company Logo for Branding/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      const file = new File(['x'.repeat(3 * 1024 * 1024)], 'large-logo.png', {
        type: 'image/png',
      });

      const input = screen.getByLabelText(/Company Logo for Branding/i) as HTMLInputElement;
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
      }, { timeout: 3000 });
    });

    it('should validate file type (images only)', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.queryByText(/Loading settings/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });
      
      await waitFor(() => {
        expect(screen.getByText(/Company Logo for Branding/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const input = screen.getByLabelText(/Company Logo for Branding/i) as HTMLInputElement;
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
      }, { timeout: 3000 });
    });

    it('should successfully upload valid logo', { timeout: 10000 }, async () => {
      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      const mockSaveSettings = vi.mocked(dbService.saveSettings);
      
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: () => ({
          data: { publicUrl: 'https://example.com/logo.png' },
        }),
      } as any);

      mockSaveSettings.mockResolvedValue();

      renderSettings();

      await waitFor(() => {
        expect(screen.queryByText(/Loading settings/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });
      
      await waitFor(() => {
        expect(screen.getByText(/Company Logo for Branding/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const input = screen.getByLabelText(/Company Logo for Branding/i) as HTMLInputElement;
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
      }, { timeout: 5000 });
    });
  });

  describe('Logo Delete Functionality', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({
        user: { id: 'user-123' } as User,
        isMaxAITier: true,
        userRole: 'max',
      }));
      
      // Mock getSettings to return logo data - MUST be set up before render
      vi.mocked(dbService.getSettings).mockResolvedValue({
        name: 'Test Company',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        website: '',
        terms: '',
        logo: 'https://example.com/test-logo.png',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
      });
    });

    it('should show remove button when logo exists', { timeout: 15000 }, async () => {
      renderSettings();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Loading settings/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Wait for settings to load (check that BrandingSection is rendered)
      await waitFor(() => {
        expect(screen.getByText(/Company Logo for Branding/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // CRITICAL: Wait for logo image to appear (confirms logo data loaded)
      await waitFor(() => {
        const logoImg = screen.getByAlt(/Company logo/i);
        expect(logoImg).toBeInTheDocument();
        expect(logoImg).toHaveAttribute('src', 'https://example.com/test-logo.png');
      }, { timeout: 5000 });

      // Now check for Remove Logo button
      await waitFor(() => {
        const removeButton = screen.getByText(/Remove Logo/i);
        expect(removeButton).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Verify no upgrade prompt
      expect(screen.queryByText(/Upgrade to Max AI/i)).not.toBeInTheDocument();
    });

    it('should successfully delete logo', { timeout: 15000 }, async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      const mockSaveSettings = vi.mocked(dbService.saveSettings);

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any);

      mockSaveSettings.mockResolvedValue();

      renderSettings();
      const user = userEvent.setup();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Loading settings/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Wait for BrandingSection to render
      await waitFor(() => {
        expect(screen.getByText(/Company Logo for Branding/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Wait for logo to be displayed (confirms data loaded)
      await waitFor(() => {
        const logoImg = screen.getByAlt(/Company logo/i);
        expect(logoImg).toBeInTheDocument();
      }, { timeout: 5000 });

      // Wait for Remove Logo button
      await waitFor(() => {
        expect(screen.getByText(/Remove Logo/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click Remove Logo button
      const removeButton = screen.getByText(/Remove Logo/i);
      await user.click(removeButton);

      // Wait for confirmation dialog and click Delete
      await waitFor(() => {
        const confirmButton = screen.getByText(/^Delete$/i);
        expect(confirmButton).toBeInTheDocument();
        return user.click(confirmButton);
      }, { timeout: 3000 });

      // Verify deletion calls
      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalled();
        expect(mockSaveSettings).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            description: expect.stringContaining('removed'),
          })
        );
      }, { timeout: 5000 });
    });
  });
});
