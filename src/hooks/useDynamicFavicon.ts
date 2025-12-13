import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to dynamically update the favicon based on company logo
 * Only active for Max AI tier users
 */
export function useDynamicFavicon(logoUrl?: string) {
  const { isMaxAITier } = useAuth();

  useEffect(() => {
    // Only apply custom favicon for Max AI tier
    if (!isMaxAITier || !logoUrl) {
      return;
    }

    const originalFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    const originalHref = originalFavicon?.href;

    // Create or update favicon link
    let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }

    // Set custom favicon
    faviconLink.href = logoUrl;

    // Cleanup: restore original favicon
    return () => {
      if (originalHref && faviconLink) {
        faviconLink.href = originalHref;
      }
    };
  }, [isMaxAITier, logoUrl]);
}
