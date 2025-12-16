/**
 * Proposal Categories Management
 * Standardizes category display order and grouping logic
 */

// Standard category display order (enforced in proposals)
export const CATEGORY_DISPLAY_ORDER = [
  'Pool Structure',
  'Interior Surface',  // NEW: Added for pool finishes
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
  heroImage?: string;
}> = {
  'Pool Structure': {
    displayName: 'Pool Structure',
    description: 'Foundation and structural elements of your pool',
    heroImage: 'https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=1920&q=80'
  },
  'Interior Surface': {
    displayName: 'Interior Surface',
    description: 'Pool finish materials and surface treatments',
    heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80'
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
/**
 * Infer category from item name when category is missing
 */
function inferCategoryFromItemName(itemName: string): string {
  const nameLower = itemName.toLowerCase();

  // Pool Structure & Surface
  if (nameLower.includes('quartz') || nameLower.includes('plaster') || nameLower.includes('pebble')) return 'Interior Surface';
  if (nameLower.includes('pool') && (nameLower.includes('shell') || nameLower.includes('structure'))) return 'Pool Structure';

  // Coping
  if (nameLower.includes('coping')) return 'Coping';

  // Tile
  if (nameLower.includes('tile') || nameLower.includes('glass tile')) return 'Tile';

  // Decking
  if (nameLower.includes('travertine') || nameLower.includes('paver') || nameLower.includes('deck')) return 'Decking';

  // Equipment
  if (nameLower.includes('pump') || nameLower.includes('filter') || nameLower.includes('heater')) return 'Equipment';

  // Removal/Labor services
  if (nameLower.includes('removal') || nameLower.includes('demolition')) return 'Services';

  return 'Other';
}

/**
 * Normalizes a category string to match standard categories, or pass through custom ones
 * ENHANCED: Now infers category from item name if category is missing
 */
export const normalizeCategory = (category?: string, itemName?: string): string => {
  // If no category provided, try to infer from item name
  if (!category) {
    if (itemName) {
      const inferred = inferCategoryFromItemName(itemName);
      console.log(`[normalizeCategory] Inferred "${inferred}" from item name: "${itemName}"`);
      return inferred;
    }
    return 'Other';
  }

  const normalized = category.trim();

  // Direct match with standard categories
  if ((CATEGORY_DISPLAY_ORDER as readonly string[]).includes(normalized)) {
    return normalized;
  }

  // Fuzzy matching for standard categories (POOL SPECIFIC)
  const lowerCategory = normalized.toLowerCase();

  if (lowerCategory.includes('pool') && lowerCategory.includes('structure')) return 'Pool Structure';
  if (lowerCategory.includes('interior') || lowerCategory.includes('finish') || lowerCategory.includes('plaster')) return 'Interior Surface';
  if (lowerCategory.includes('coping') && !lowerCategory.includes('tile')) return 'Coping';
  if (lowerCategory.includes('tile') && !lowerCategory.includes('coping')) return 'Tile';
  if (lowerCategory.includes('coping') && lowerCategory.includes('tile')) {
    return lowerCategory.indexOf('coping') < lowerCategory.indexOf('tile') ? 'Coping' : 'Tile';
  }
  if (lowerCategory.includes('deck')) return 'Decking';
  if (lowerCategory.includes('equipment') || lowerCategory.includes('pump') || lowerCategory.includes('filter')) return 'Equipment';
  if (lowerCategory.includes('accessory') || lowerCategory.includes('accessories')) return 'Accessories';
  if (lowerCategory.includes('service')) return 'Services';

  // Return the original normalized category
  return normalized;
};

/**
 * Gets display metadata for a category
 */
export const getCategoryMetadata = (category: string, itemName?: string) => {
  const normalized = normalizeCategory(category, itemName);
  // Return metadata if exists, otherwise generate default
  return CATEGORY_METADATA[normalized] || {
    displayName: normalized,
    description: '',
    // No default heroImage here, handled by image library
  };
};

/**
 * Sorts categories according to display order
 */
export const sortCategoriesByOrder = (categories: string[]): string[] => {
  return categories.sort((a, b) => {
    const normalizedA = normalizeCategory(a, undefined);
    const normalizedB = normalizeCategory(b, undefined);

    const indexA = CATEGORY_DISPLAY_ORDER.indexOf(normalizedA as any);
    const indexB = CATEGORY_DISPLAY_ORDER.indexOf(normalizedB as any);

    // If both are standard categories, sort by order
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;

    // If A is standard and B is custom, A comes first
    if (indexA !== -1) return -1;

    // If B is standard and A is custom, B comes first
    if (indexB !== -1) return 1;

    // If both are custom, sort alphabetically
    return normalizedA.localeCompare(normalizedB);
  });
};