/**
 * Proposal Image Library
 * Curated high-quality gradients for proposals
 * 
 * Strategy: User Overrides → Theme-Based Gradients → Default Gradient
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
    cover: 'radial-gradient(circle at top right, #1e40af 0%, #0f172a 100%)', // Rich Blue to Slate
    section: 'linear-gradient(to right, #f8fafc, #e2e8f0)', // Slate 50 -> 200
    item: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', // Blue 50 -> 100 (Subtle)
  },
  'creative-studio': {
    cover: 'conic-gradient(from 0deg at 50% 50%, #7e22ce, #db2777, #ea580c, #7e22ce)', // Multi-color vibrant
    section: 'linear-gradient(120deg, #fce7f3 0%, #e0e7ff 100%)', // Pink to Indigo light
    item: 'linear-gradient(to bottom right, #faf5ff, #f3e8ff)', // Purple 50 -> 100
  },
  'minimalist': {
    cover: 'linear-gradient(to bottom, #f3f4f6, #9ca3af)', // Gray 100 -> 400
    section: 'linear-gradient(to right, #ffffff, #f3f4f6)', // White -> Gray 100
    item: 'linear-gradient(to bottom, #ffffff, #fafafa)', // Pure clean
  },
  'bold-impact': {
    cover: 'linear-gradient(45deg, #000000 0%, #be123c 100%)', // Black to Crimson
    section: 'linear-gradient(to right, #18181b, #27272a)', // Zinc 900 -> 800
    item: 'linear-gradient(135deg, #27272a 0%, #52525b 100%)', // Zinc 800 -> 600
  },
  'elegant-serif': {
    cover: 'radial-gradient(circle at center, #57534e 0%, #1c1917 100%)', // Stone 600 -> 900
    section: 'linear-gradient(to right, #fafaf9, #e7e5e4)', // Stone 50 -> 200
    item: 'linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)', // Stone 50 -> 100
  },
  'tech-future': {
    cover: 'linear-gradient(180deg, #020617 0%, #1e1b4b 50%, #4c1d95 100%)', // Space logic
    section: 'linear-gradient(to right, #0f172a, #1e293b)', // Slate 900 -> 800
    item: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', // Slate 800 -> 700
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
 * Get the best cover image based on theme and overrides
 */
export function getSmartCoverImage(
  userCoverImage?: string,
  theme?: Theme
): string {
  if (userCoverImage) return userCoverImage;
  return getThemeGradient(theme, 'cover');
}

/**
 * Get item image based on override or theme
 */
export function getSmartItemImage(
  existingUrl?: string,
  overrideUrl?: string,
  theme?: Theme
): string | undefined {
  if (overrideUrl && (overrideUrl.startsWith('http') || overrideUrl.startsWith('data:'))) return overrideUrl;
  if (existingUrl && existingUrl.startsWith('http')) return existingUrl;

  return getThemeGradient(theme, 'item');
}

/**
 * Get category background image theme
 */
export function getCategoryImage(
  category: string, // Kept for signature compatibility if needed, but unused for logic
  userImages?: Record<string, string>,
  theme?: Theme
): string {
  if (userImages?.[category]) return userImages[category];
  return getThemeGradient(theme, 'section');
}

/**
 * Get all unique categories from items and map to images
 */
export function mapCategoriesToImages(
  categories: string[],
  userImages?: Record<string, string>,
  theme?: Theme
): Record<string, string> {
  const mapping: Record<string, string> = {};
  categories.forEach(category => {
    mapping[category] = getCategoryImage(category, userImages, theme);
  });
  return mapping;
}
