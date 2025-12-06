/**
 * Proposal Categories Management
 * Standardizes category display order and grouping logic
 */

// Standard category display order (enforced in proposals)
export const CATEGORY_DISPLAY_ORDER = [
  'Pool Structure',
  'Coping & Tile',
  'Decking',
  'Equipment',
  'Accessories',
  'Services',
  'Other' // Catch-all for uncategorized items
] as const;

export type StandardCategory = typeof CATEGORY_DISPLAY_ORDER[number];

// Category metadata for enhanced display
export const CATEGORY_METADATA: Record<string, { 
  displayName: string; 
  description: string;
  icon?: string;
}> = {
  'Pool Structure': {
    displayName: 'Pool Structure',
    description: 'Foundation and structural elements of your pool',
  },
  'Coping & Tile': {
    displayName: 'Coping & Tile',
    description: 'Finishing touches and decorative elements',
  },
  'Decking': {
    displayName: 'Decking',
    description: 'Pool deck materials and installation',
  },
  'Equipment': {
    displayName: 'Equipment',
    description: 'Pumps, filters, heaters, and automation',
  },
  'Accessories': {
    displayName: 'Accessories',
    description: 'Lights, covers, cleaning equipment, and extras',
  },
  'Services': {
    displayName: 'Services',
    description: 'Professional services and ongoing support',
  },
  'Other': {
    displayName: 'Additional Items',
    description: 'Other items and services',
  },
};

/**
 * Normalizes a category string to match standard categories
 */
export const normalizeCategory = (category?: string): StandardCategory => {
  if (!category) return 'Other';
  
  const normalized = category.trim();
  
  // Direct match
  if (CATEGORY_DISPLAY_ORDER.includes(normalized as StandardCategory)) {
    return normalized as StandardCategory;
  }
  
  // Fuzzy matching for common variations
  const lowerCategory = normalized.toLowerCase();
  
  if (lowerCategory.includes('pool') && lowerCategory.includes('structure')) return 'Pool Structure';
  if (lowerCategory.includes('coping') || lowerCategory.includes('tile')) return 'Coping & Tile';
  if (lowerCategory.includes('deck')) return 'Decking';
  if (lowerCategory.includes('equipment') || lowerCategory.includes('pump') || lowerCategory.includes('filter')) return 'Equipment';
  if (lowerCategory.includes('accessory') || lowerCategory.includes('accessories') || lowerCategory.includes('light')) return 'Accessories';
  if (lowerCategory.includes('service')) return 'Services';
  
  return 'Other';
};

/**
 * Gets display metadata for a category
 */
export const getCategoryMetadata = (category: string) => {
  const normalized = normalizeCategory(category);
  return CATEGORY_METADATA[normalized];
};

/**
 * Sorts categories according to display order
 */
export const sortCategoriesByOrder = (categories: string[]): string[] => {
  return categories.sort((a, b) => {
    const normalizedA = normalizeCategory(a);
    const normalizedB = normalizeCategory(b);
    
    const indexA = CATEGORY_DISPLAY_ORDER.indexOf(normalizedA);
    const indexB = CATEGORY_DISPLAY_ORDER.indexOf(normalizedB);
    
    return indexA - indexB;
  });
};