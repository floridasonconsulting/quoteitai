import { render } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Settings from '../Settings';
import * as AuthContext from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const renderSettings = () => {
  return render(
    <BrowserRouter>
      <Settings />
    </BrowserRouter>
  );
};

describe('Settings - White-Label Branding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tier-Based Access Control', () => {
    it('should show upgrade prompt for non-Max AI tier users', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { id: 'user-123' },
        isMaxAITier: false,
        userRole: 'pro',
      } as any);

      renderSettings();

      const { getByText } = renderSettings();
      expect(getByText(/Upgrade to Max AI/i)).toBeInTheDocument();
      expect(getByText(/White-label branding is available/i)).toBeInTheDocument();
    });

    it('should show logo upload for Max AI tier users', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { id: 'user-123' },
        isMaxAITier: true,
        userRole: 'max',
      } as any);

      const { getByText, queryByText } = renderSettings();

      expect(getByText(/Upload Company Logo/i)).toBeInTheDocument();
      expect(queryByText(/Upgrade to Max AI/i)).not.toBeInTheDocument();
    });
  });

  describe('Logo Upload Functionality', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { id: 'user-123' },
        isMaxAITier: true,
        userRole: 'max',
      } as any);
    });

    it('should validate file size (max 2MB)', async () => {
      const { getByLabelText } = renderSettings();

      const file = new File(['x'.repeat(3 * 1024 * 1024)], 'large-logo.png', {
        type: 'image/png',
      });

      const input = getByLabelText(/Upload Company Logo/i) as HTMLInputElement;
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

      const input = getByLabelText(/Upload Company Logo/i) as HTMLInputElement;
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
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: mockUpdate,
            }),
          }),
        }),
      } as any);

      const { getByLabelText } = renderSettings();

      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const input = getByLabelText(/Upload Company Logo/i) as HTMLInputElement;
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
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { id: 'user-123' },
        isMaxAITier: true,
        userRole: 'max',
      } as any);
    });

    it('should show remove button when logo exists', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: { logo: 'https://example.com/logo.png' },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: mockSelect,
          }),
        }),
      } as any);

      const { getByRole } = renderSettings();

      await waitFor(() => {
        expect(getByRole('button', { name: /Remove Logo/i })).toBeInTheDocument();
      });
    });

    it('should successfully delete logo', async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: { logo: 'company-logos/user-123/logo.png' },
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
      } as any);

      const { getByRole } = renderSettings();
      const user = userEvent.setup();

      await waitFor(() => {
        const removeButton = getByRole('button', { name: /Remove Logo/i });
        user.click(removeButton);
      });

      // Confirm deletion in dialog
      await waitFor(() => {
        const confirmButton = getByRole('button', { name: /Delete/i });
        user.click(confirmButton);
      });

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
