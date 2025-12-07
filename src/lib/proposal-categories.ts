/**
 * Proposal Categories Management
 * Standardizes category display order and grouping logic
 */

// Standard category display order (enforced in proposals)
export const CATEGORY_DISPLAY_ORDER = [
  'Pool Structure',
  'Coping',
  'Tile',
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
  heroImage?: string; // NEW: Default hero image for category
}> = {
  'Pool Structure': {
    displayName: 'Pool Structure',
    description: 'Foundation and structural elements of your pool',
    heroImage: 'https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=1920&q=80'
  },
  'Coping': {
    displayName: 'Coping',
    description: 'Premium coping materials and installation',
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80'
  },
  'Tile': {
    displayName: 'Tile',
    description: 'Decorative tile work and finishes',
    heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80'
  },
  'Decking': {
    displayName: 'Decking',
    description: 'Pool deck materials and installation',
    heroImage: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80'
  },
  'Equipment': {
    displayName: 'Equipment',
    description: 'Pumps, filters, heaters, and automation',
    heroImage: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1920&q=80'
  },
  'Accessories': {
    displayName: 'Accessories',
    description: 'Lights, covers, cleaning equipment, and extras',
    heroImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80'
  },
  'Services': {
    displayName: 'Services',
    description: 'Professional services and ongoing support',
    heroImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80'
  },
  'Other': {
    displayName: 'Additional Items',
    description: 'Other items and services',
    heroImage: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80'
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
  if (lowerCategory.includes('coping') && !lowerCategory.includes('tile')) return 'Coping';
  if (lowerCategory.includes('tile') && !lowerCategory.includes('coping')) return 'Tile';
  if (lowerCategory.includes('coping') && lowerCategory.includes('tile')) {
    // If both mentioned, prioritize based on order in string
    return lowerCategory.indexOf('coping') < lowerCategory.indexOf('tile') ? 'Coping' : 'Tile';
  }
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