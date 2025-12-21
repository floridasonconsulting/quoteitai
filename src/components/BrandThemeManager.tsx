
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSettings } from '@/lib/db-service';
import { hexToHSL } from '@/lib/color-utils';

export function BrandThemeManager() {
    const { user, organizationId } = useAuth();

    useEffect(() => {
        const applyBrandTheme = async () => {
            if (!user?.id) return;

            try {
                const settings = await getSettings(user.id, organizationId);

                const root = window.document.documentElement;

                if (settings.primaryColor) {
                    const primaryHsl = hexToHSL(settings.primaryColor);
                    root.style.setProperty('--primary', primaryHsl);
                    root.style.setProperty('--ring', primaryHsl);
                }

                if (settings.accentColor) {
                    const accentHsl = hexToHSL(settings.accentColor);
                    root.style.setProperty('--accent', accentHsl);
                }

                console.log('[BrandThemeManager] Applied brand colors:', {
                    primary: settings.primaryColor,
                    accent: settings.accentColor
                });

            } catch (error) {
                console.error('[BrandThemeManager] Failed to apply brand theme:', error);
            }
        };

        applyBrandTheme();
    }, [user?.id, organizationId]);

    return null;
}
