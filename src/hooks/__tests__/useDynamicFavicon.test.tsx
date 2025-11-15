import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDynamicFavicon } from '../useDynamicFavicon';
import * as AuthContext from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';

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
    refreshSubscription: vi.fn(),
  };
  return { ...defaultValues, ...overrides };
};

describe('useDynamicFavicon', () => {
  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '<link rel="icon" href="/original-favicon.png" />';
  });

  it('should not change favicon for non-Max AI tier users', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({ isMaxAITier: false }));

    renderHook(() => useDynamicFavicon('https://example.com/custom-logo.png'));

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(favicon.href).toContain('original-favicon.png');
  });

  it('should change favicon for Max AI tier users with logo URL', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({ isMaxAITier: true }));

    const customLogoUrl = 'https://example.com/custom-logo.png';
    renderHook(() => useDynamicFavicon(customLogoUrl));

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(favicon.href).toBe(customLogoUrl);
  });

  it('should not change favicon if no logo URL is provided', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({ isMaxAITier: true }));

    renderHook(() => useDynamicFavicon(undefined));

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(favicon.href).toContain('original-favicon.png');
  });

  it('should restore original favicon on cleanup', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({ isMaxAITier: true }));

    const customLogoUrl = 'https://example.com/custom-logo.png';
    const { unmount } = renderHook(() => useDynamicFavicon(customLogoUrl));

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(favicon.href).toBe(customLogoUrl);

    unmount();

    expect(favicon.href).toContain('original-favicon.png');
  });

  it('should create favicon link if it does not exist', () => {
    document.head.innerHTML = '';
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(getMockAuthContext({ isMaxAITier: true }));

    const customLogoUrl = 'https://example.com/custom-logo.png';
    renderHook(() => useDynamicFavicon(customLogoUrl));

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(favicon).toBeTruthy();
    expect(favicon.href).toBe(customLogoUrl);
  });
});
