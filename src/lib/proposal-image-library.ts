/**
 * Proposal Image Library
 * Curated high-quality gradients for proposals
 * 
 * Strategy: User Overrides → Visual Rules → Global Defaults → Theme Gradients
 */

import type { CompanySettings } from '@/types';

export type Industry = CompanySettings['industry'];
export type Theme = CompanySettings['proposalTheme'];

export const SUPPORTED_INDUSTRIES = [
  { value: 'pool-spa', label: 'Pool & Spa Services' },
  { value: 'landscaping', label: 'Landscaping & Lawn Care' },
  { value: 'hvac', label: 'HVAC Services' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'fencing', label: 'Fencing' },
  { value: 'general-contractor', label: 'General Contractor' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'painting', label: 'Painting' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'other', label: 'Other' },
] as const;

// ============================================================================
// THEME GRADIENT LIBRARY (High Quality CSS Gradients)
// ============================================================================

import { getGeneratedBackground } from './svg-patterns';

export const THEME_GRADIENTS = {
  'modern-corporate': {
    cover: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)', // Deep Teal/Slate
    section: 'linear-gradient(to right, #f8fafc, #e2e8f0)',
    item: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  },
  'creative-studio': {
    cover: 'conic-gradient(from 0deg at 50% 50%, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%)', // Vibrant Pink/Purple/Blue
    section: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)', // Clean White
    item: 'linear-gradient(to bottom right, #fff1eb 0%, #ace0f9 100%)', // Subtle Peach/Blue
  },
  'minimalist': {
    cover: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)', // Soft Silver
    section: 'linear-gradient(to right, #ffffff, #f3f4f6)',
    item: 'linear-gradient(to bottom, #ffffff, #fafafa)',
  },
  'bold-impact': {
    cover: 'linear-gradient(to right, #243949 0%, #517fa4 100%)', // Strong Blue Steel
    section: 'linear-gradient(to right, #18181b, #27272a)',
    item: 'linear-gradient(135deg, #27272a 0%, #52525b 100%)',
  },
  'elegant-serif': {
    cover: 'radial-gradient(circle at center, #603813 0%, #b29f94 100%)', // Rich Brown/Taupe
    section: 'linear-gradient(to right, #fafaf9, #e7e5e4)',
    item: 'linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)',
  },
  'tech-future': {
    cover: 'radial-gradient(circle at 10% 20%, rgb(0, 0, 0) 0%, rgb(64, 64, 64) 90.2%)', // Deep Carbon
    section: 'linear-gradient(to right, #0f172a, #1e293b)',
    item: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  },
} as const;

export const DEFAULT_FALLBACK_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

export function getThemeGradient(theme?: Theme, type: 'cover' | 'section' | 'item' = 'cover'): string {
  const selectedTheme = theme && theme in THEME_GRADIENTS ? theme as keyof typeof THEME_GRADIENTS : undefined;

  if (!selectedTheme) return DEFAULT_FALLBACK_GRADIENT; // Fallback if invalid theme

  const baseGradient = THEME_GRADIENTS[selectedTheme][type];

  // Only apply SVG patterns to 'cover' for maximum impact (keep sections/items cleaner)
  if (type === 'cover') {
    switch (selectedTheme) {
      case 'modern-corporate':
        return getGeneratedBackground('waves', '#3b82f6', '#1e40af', baseGradient);
      case 'creative-studio':
        return getGeneratedBackground('blobs', '#db2777', '#7e22ce', baseGradient); // Pass vibrant colors for blobs
      case 'minimalist':
        return baseGradient; // Minimalist keeps it clean (no pattern)
      case 'bold-impact':
        return getGeneratedBackground('grid', '#ffffff', '#000000', baseGradient);
      case 'elegant-serif':
        return getGeneratedBackground('dots', '#ffffff', '#000000', baseGradient);
      case 'tech-future':
        return getGeneratedBackground('isometric', '#4c1d95', '#0f172a', baseGradient);
      default:
        return baseGradient;
    }
  }

  // Check for 'section' patterns if requested (optional, keeping clean for now)
  if (type === 'section' && selectedTheme === 'tech-future') {
    return getGeneratedBackground('grid', '#1e293b', '#0f172a', baseGradient);
  }

  return baseGradient;
}

// ============================================================================
// IMAGE SELECTION FUNCTIONS
// ============================================================================

/**
 * Gets a smart cover image based on availability and priority:
 * 1. User overridden URL (passed as currentUrl)
 * 2. Settings "Default Cover Image"
 * 3. Theme-based Gradient
 */
export function getSmartCoverImage(currentUrl?: string, theme?: Theme, settings?: CompanySettings): string {
  // 1. Override
  if (currentUrl && currentUrl !== "") {
    return currentUrl;
  }

  // 2. Global Default
  if (settings?.defaultCoverImage) {
    return settings.defaultCoverImage;
  }

  // 3. Fallback
  return getThemeGradient(theme, 'cover');
}

/**
 * Gets item image based on priority:
 * 1. Viewer Override (User edited in Proposal Viewer)
 * 2. Visual Rules (Category/Name match)
 * 3. Database Image (From Quote/Catalog)
 * 4. Theme Gradient
 */
export function getSmartItemImage(
  itemName: string,
  category: string,
  viewerOverride: string | undefined, // Was currentUrl
  databaseImage: string | undefined, // New param
  theme?: Theme,
  settings?: CompanySettings
): string {
  // 1. Viewer Override (Highest Priority)
  if (viewerOverride && (viewerOverride.startsWith('http') || viewerOverride.startsWith('data:'))) {
    return viewerOverride;
  }

  // 2. Visual Rules (Global Presentation Settings)
  if (settings?.visualRules) {
    const lowerName = (itemName || '').toLowerCase();
    const lowerCat = (category || '').toLowerCase();
    const match = settings.visualRules.find(rule => {
      const key = (rule.keyword || '').toLowerCase();
      // Simple inclusive check AND valid image check
      // This ensures we skip rules that match keywords but have no image (broken rules)
      const matchesKeyword = lowerCat.includes(key) || lowerName.includes(key);
      const hasValidImage = rule.imageUrl && rule.imageUrl.trim().length > 0;

      return matchesKeyword && hasValidImage;
    });

    if (match) return match.imageUrl;
  }

  // 3. Database Image (Quote/Catalog Data)
  if (databaseImage && (databaseImage.startsWith('http') || databaseImage.startsWith('data:'))) {
    return databaseImage;
  }

  // 4. Theme Gradient (Fallback)
  return getThemeGradient(theme, 'item');
}

/**
 * Gets category header image based on priority:
 * 1. Manual Override (User edited this specific section)
 * 2. Visual Rules (Category match)
 * 3. Global Default Header
 * 4. Theme Gradient
 */
export function getCategoryImage(categoryName: string, currentUrl?: string, theme?: Theme, settings?: CompanySettings): string {
  console.log('[getCategoryImage] 🔍 CATEGORY IMAGE RESOLUTION:', {
    categoryName,
    hasOverride: !!currentUrl,
    overrideUrl: currentUrl?.substring(0, 50),
    hasSettings: !!settings,
    hasVisualRules: !!(settings?.visualRules?.length),
    visualRulesCount: settings?.visualRules?.length || 0,
    hasDefaultHeader: !!settings?.defaultHeaderImage,
    defaultHeaderUrl: settings?.defaultHeaderImage?.substring(0, 50),
    theme
  });

  // 1. Override
  if (currentUrl && currentUrl !== "") {
    console.log('[getCategoryImage] ✓ Using OVERRIDE:', currentUrl.substring(0, 50));
    return currentUrl;
  }

  // 2. Visual Rules
  if (settings?.visualRules && settings.visualRules.length > 0) {
    const lowerCat = (categoryName || '').toLowerCase();
    console.log('[getCategoryImage] Checking visual rules:', {
      categoryLower: lowerCat,
      rules: settings.visualRules.map(r => ({ keyword: r.keyword, hasImageUrl: !!r.imageUrl }))
    });

    const match = settings.visualRules.find(rule => {
      const keywordLower = (rule.keyword || '').toLowerCase();
      const isMatch = lowerCat.includes(keywordLower);
      const hasValidImage = rule.imageUrl && rule.imageUrl.trim().length > 0;

      console.log(`[getCategoryImage] Rule check: "${lowerCat}" includes "${keywordLower}" = ${isMatch}, ValidImg: ${hasValidImage} (${rule.imageUrl?.substring(0, 15)}...)`);

      return isMatch && hasValidImage;
    });

    if (match) {
      console.log('[getCategoryImage] ✓ Visual rule MATCHED:', match.keyword, '->', match.imageUrl?.substring(0, 50));
      return match.imageUrl;
    }
    console.log('[getCategoryImage] ✗ No visual rule matched (checked all)');
  }

  // 3. Global Default Header
  if (settings?.defaultHeaderImage) {
    console.log('[getCategoryImage] ✓ Using DEFAULT HEADER:', settings.defaultHeaderImage.substring(0, 50));
    return settings.defaultHeaderImage;
  }

  // 4. Fallback
  const gradient = getThemeGradient(theme, 'section');
  console.log('[getCategoryImage] ⚠️ FALLBACK to gradient');
  return gradient;
}

/**
 * Get all unique categories from items and map to images
 */
export function mapCategoriesToImages(
  categories: string[],
  userImages?: Record<string, string>,
  theme?: Theme,
  settings?: CompanySettings
): Record<string, string> {
  const mapping: Record<string, string> = {};
  categories.forEach(category => {
    // Treat userImages lookup as the "override" (Step 1)
    const currentUrl = userImages?.[category];
    mapping[category] = getCategoryImage(category, currentUrl, theme, settings);
  });
  return mapping;
}
