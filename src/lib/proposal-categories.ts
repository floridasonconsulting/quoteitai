/**
 * Proposal Categories Management
 * Standardizes category display order and grouping logic
 */

// Standard category display order (enforced in proposals)
export const CATEGORY_DISPLAY_ORDER = [
  'Permits & Engineering',
  'Site Preparation',
  'Demolition',
  'Pool Structure',
  'Interior Surface',
  'Coping & Tile',
  'Decking',
  'Heating',
  'Cooling',
  'Landscaping',
  'Hardscaping',
  'Softscaping',
  'Equipment',
  'Accessories',
  'Electrical & Plumbing',
  'Labor',
  'Materials',
  'Services',
  'Other'
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
    heroImage: 'https://images.unsplash.com/photo-1560742124-275138ed4e95?w=1920&q=80'
  },
  'Interior Surface': {
    displayName: 'Interior Surface',
    description: 'Pool finish materials and surface treatments',
    heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80'
  },
  'Coping & Tile': {
    displayName: 'Coping & Tile',
    description: 'Premium coping materials and decorative tile work',
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80'
  },
  'Decking': {
    displayName: 'Decking',
    description: 'Pool deck materials and installation',
    heroImage: 'https://images.unsplash.com/photo-1590059530462-811c7590874e?w=1920&q=80'
  },
  'Equipment': {
    displayName: 'Equipment',
    description: 'Pumps, filters, heaters, and automation',
    heroImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80'
  },
  'Accessories': {
    displayName: 'Accessories',
    description: 'Lights, covers, cleaning equipment, and extras',
    heroImage: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1920&q=80'
  },
  'Services': {
    displayName: 'Services',
    description: 'Professional services and ongoing support',
    heroImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80'
  },
  'Other': {
    displayName: 'Additional Items',
    description: 'Other items and services',
    heroImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80'
  },
  // HVAC
  'Heating': {
    displayName: 'Heating Services',
    description: 'Furnace installation, repair, and maintenance',
    heroImage: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1920&q=80'
  },
  'Cooling': {
    displayName: 'Cooling Services',
    description: 'AC installation and cooling system optimization',
    heroImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80'
  },
  // Landscaping
  'Softscaping': {
    displayName: 'Planting & Softscaping',
    description: 'Trees, shrubs, flowers, and turf installation',
    heroImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80'
  },
  'Hardscaping': {
    displayName: 'Hardscaping',
    description: 'Patios, walls, and structural landscape elements',
    heroImage: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1920&q=80'
  },
  // General
  'Materials': {
    displayName: 'Materials & Supplies',
    description: 'High-quality materials for your project',
    heroImage: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=1920&q=80'
  },
  'Labor': {
    displayName: 'Professional Labor',
    description: 'Skilled craftsmanship and expert installation',
    heroImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80'
  },
  'Permits & Engineering': {
    displayName: 'Permits & Engineering',
    description: 'Plans, engineering, and city permitting process',
    heroImage: 'https://images.unsplash.com/photo-1503387762-592dee58c460?w=1920&q=80'
  },
  'Site Preparation': {
    displayName: 'Site Preparation',
    description: 'Access, protection, and site setup',
    heroImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=1920&q=80'
  },
  'Demolition': {
    displayName: 'Demolition',
    description: 'Existing structure removal and site clearance',
    heroImage: 'https://images.unsplash.com/photo-1565008480202-c94605968d48?w=1920&q=80'
  }
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
  // Check for generic categories that should trigger inference
  const isGeneric = !category ||
    category.trim() === '' ||
    category.toLowerCase().trim() === 'other' ||
    category.toLowerCase().trim() === 'uncategorized';

  if (isGeneric) {
    if (itemName) {
      const inferred = inferCategoryFromItemName(itemName);
      if (inferred !== 'Other') {
        console.log(`[normalizeCategory] Upgraded generic "${category}" to "${inferred}" based on item: "${itemName}"`);
        return inferred;
      }
    }
    // If inference fails or no item name, return 'Other' (or the original generic term if preferred, but 'Other' is standard)
    return 'Other';
  }

  const normalized = category.trim();

  // Direct match with standard categories
  if ((CATEGORY_DISPLAY_ORDER as readonly string[]).includes(normalized)) {
    return normalized;
  }

  // Fuzzy matching for standard categories (POOL SPECIFIC)
  const lowerCategory = normalized.toLowerCase();

  if (lowerCategory.includes('permit') || lowerCategory.includes('engineering') || lowerCategory.includes('plan')) return 'Permits & Engineering';
  if (lowerCategory.includes('site prep') || lowerCategory.includes('access') || lowerCategory.includes('grading')) return 'Site Preparation';
  if (lowerCategory.includes('demo') || lowerCategory.includes('removal') || lowerCategory.includes('rip out')) return 'Demolition';
  if (lowerCategory.includes('pool') && lowerCategory.includes('structure')) return 'Pool Structure';
  if (lowerCategory.includes('interior') || lowerCategory.includes('finish') || lowerCategory.includes('plaster') || lowerCategory.includes('surface')) return 'Interior Surface';
  if (lowerCategory.includes('coping') || lowerCategory.includes('tile')) return 'Coping & Tile';
  if (lowerCategory.includes('deck')) return 'Decking';
  if (lowerCategory.includes('equipment') || lowerCategory.includes('pump') || lowerCategory.includes('filter')) return 'Equipment';
  if (lowerCategory.includes('accessory') || lowerCategory.includes('accessories')) return 'Accessories';
  if (lowerCategory.includes('service')) return 'Services';

  // HVAC
  if (lowerCategory.includes('heat') || lowerCategory.includes('furnace')) return 'Heating';
  if (lowerCategory.includes('cool') || lowerCategory.includes('ac ')) return 'Cooling';

  // Landscaping
  if (lowerCategory.includes('plant') || lowerCategory.includes('tree') || lowerCategory.includes('flower') || lowerCategory.includes('softscape')) return 'Softscaping';
  if (lowerCategory.includes('hardscape') || lowerCategory.includes('paving') || lowerCategory.includes('wall')) return 'Hardscaping';

  // General
  if (lowerCategory.includes('labor') || lowerCategory.includes('work') || lowerCategory.includes('installation')) return 'Labor';
  if (lowerCategory.includes('material') || lowerCategory.includes('supply')) return 'Materials';

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