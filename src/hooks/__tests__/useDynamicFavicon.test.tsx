import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDynamicFavicon } from '../useDynamicFavicon';
import * as AuthContext from '@/contexts/AuthContext';

describe('useDynamicFavicon', () => {
  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '<link rel="icon" href="/original-favicon.png" />';
  });

  it('should not change favicon for non-Max AI tier users', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isMaxAITier: false,
    } as any);

    renderHook(() => useDynamicFavicon('https://example.com/custom-logo.png'));

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(favicon.href).toContain('original-favicon.png');
  });

  it('should change favicon for Max AI tier users with logo URL', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isMaxAITier: true,
    } as any);

    const customLogoUrl = 'https://example.com/custom-logo.png';
    renderHook(() => useDynamicFavicon(customLogoUrl));

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(favicon.href).toBe(customLogoUrl);
  });

  it('should not change favicon if no logo URL is provided', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isMaxAITier: true,
    } as any);

    renderHook(() => useDynamicFavicon(undefined));

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(favicon.href).toContain('original-favicon.png');
  });

  it('should restore original favicon on cleanup', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isMaxAITier: true,
    } as any);

    const customLogoUrl = 'https://example.com/custom-logo.png';
    const { unmount } = renderHook(() => useDynamicFavicon(customLogoUrl));

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(favicon.href).toBe(customLogoUrl);

    unmount();

    expect(favicon.href).toContain('original-favicon.png');
  });

  it('should create favicon link if it does not exist', () => {
    document.head.innerHTML = '';
    
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isMaxAITier: true,
    } as any);

    const customLogoUrl = 'https://example.com/custom-logo.png';
    renderHook(() => useDynamicFavicon(customLogoUrl));

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    expect(favicon).toBeTruthy();
    expect(favicon.href).toBe(customLogoUrl);
  });
});
