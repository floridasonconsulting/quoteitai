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

export const THEME_GRADIENTS = {
  'modern-corporate': {
    cover: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', // Slate 800 -> 700
    section: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', // Slate 100 -> 200
    item: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', // Slate 50 -> 100
  },
  'creative-studio': {
    cover: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)', // Indigo -> Purple -> Pink
    section: 'linear-gradient(135deg, #e0e7ff 0%, #fae8ff 100%)', // Indigo 100 -> Fuchsia 100
    item: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)', // White -> Violet 50
  },
  'minimalist': {
    cover: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', // Gray 100 -> 200
    section: 'linear-gradient(to right, #ffffff, #f9fafb)', // White -> Gray 50
    item: 'linear-gradient(to bottom right, #ffffff, #fafafa)', // Pure clean
  },
  'bold-impact': {
    cover: 'linear-gradient(135deg, #000000 0%, #111111 100%)', // Pure Black
    section: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', // Zinc 900 -> 800
    item: 'linear-gradient(135deg, #27272a 0%, #3f3f46 100%)', // Zinc 800 -> 700
  },
  'elegant-serif': {
    cover: 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)', // Stone 900 -> 700
    section: 'linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 100%)', // Stone 100 -> 200
    item: 'linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)', // Stone 50 -> 100
  },
  'tech-future': {
    cover: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', // Slate 900 -> Indigo 950
    section: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', // Slate 800 -> 900
    item: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', // Slate 800 -> 700
  },
} as const;

export const DEFAULT_FALLBACK_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

export function getThemeGradient(theme?: Theme, type: 'cover' | 'section' | 'item' = 'cover'): string {
  if (!theme || !(theme in THEME_GRADIENTS)) return DEFAULT_FALLBACK_GRADIENT;
  return THEME_GRADIENTS[theme as keyof typeof THEME_GRADIENTS][type];
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
