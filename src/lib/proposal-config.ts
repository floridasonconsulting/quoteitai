/**
 * Proposal Configuration
 * Defines category ordering, styling, and business logic for proposal generation
 */

export interface CategoryConfig {
  id: string;
  displayName: string;
  order: number;
  icon?: string;
  description?: string;
}

/**
 * CATEGORY_DISPLAY_ORDER
 * Controls the presentation sequence of item categories in proposals
 * 
 * Categories appear in this exact order regardless of data insertion order
 */
export const CATEGORY_DISPLAY_ORDER: CategoryConfig[] = [
  {
    id: "pool-structure",
    displayName: "Pool Structure",
    order: 1,
    description: "The foundation of your pool project. This includes the shell construction, excavation, rebar installation, and gunite/shotcrete application. We use premium materials and proven techniques to ensure your pool's structural integrity for decades to come."
  },
  {
    id: "coping",
    displayName: "Coping",
    order: 2,
    description: "Premium coping materials that protect your pool edge while creating a polished, professional appearance. Our coping options combine beauty with durability and safety."
  },
  {
    id: "tile",
    displayName: "Tile",
    order: 3,
    description: "Waterline tile options that add style and protect your pool finish. Choose from various colors, patterns, and materials to complement your design vision."
  },
  {
    id: "decking",
    displayName: "Decking",
    order: 4,
    description: "The surrounding area that completes your backyard oasis. Choose from various decking materials including concrete, pavers, travertine, and natural stone. We design and install pool decks that enhance both functionality and visual appeal while providing safe, comfortable surfaces."
  },
  {
    id: "equipment",
    displayName: "Equipment",
    order: 5,
    description: "High-quality mechanical systems that keep your pool running efficiently. This includes pumps, filters, heaters, automation systems, and sanitization equipment. We install energy-efficient, reliable equipment backed by industry-leading warranties."
  },
  {
    id: "accessories",
    displayName: "Accessories",
    order: 6,
    description: "Additional features and enhancements to customize your pool experience. From lighting and water features to cleaning systems and safety equipment, these additions elevate your pool from functional to extraordinary."
  }
];

/**
 * ITEMS_PER_SLIDE
 * Maximum items per category slide before overflow to next slide
 */
export const ITEMS_PER_SLIDE = 6;

/**
 * Get category config by name
 * Handles case-insensitive matching and variations
 */
export function getCategoryConfig(categoryName: string): CategoryConfig | undefined {
  const normalized = categoryName.toLowerCase().trim();
  
  // Direct matches
  const directMatch = CATEGORY_DISPLAY_ORDER.find(
    cat => cat.displayName.toLowerCase() === normalized
  );
  if (directMatch) return directMatch;
  
  // Fuzzy matches for common variations - NOW SEPARATE!
  if (normalized.includes("pool") || normalized.includes("structure")) {
    return CATEGORY_DISPLAY_ORDER[0]; // Pool Structure
  }
  if (normalized.includes("coping") && !normalized.includes("tile")) {
    return CATEGORY_DISPLAY_ORDER[1]; // Coping only
  }
  if (normalized.includes("tile") && !normalized.includes("coping")) {
    return CATEGORY_DISPLAY_ORDER[2]; // Tile only
  }
  if (normalized.includes("deck")) {
    return CATEGORY_DISPLAY_ORDER[3]; // Decking
  }
  if (normalized.includes("equipment") || normalized.includes("pump") || normalized.includes("filter")) {
    return CATEGORY_DISPLAY_ORDER[4]; // Equipment
  }
  if (normalized.includes("accessor") || normalized.includes("add-on") || normalized.includes("feature")) {
    return CATEGORY_DISPLAY_ORDER[5]; // Accessories
  }
  
  return undefined;
}

/**
 * Sort categories by display order
 */
export function sortCategoriesByOrder(categories: string[]): string[] {
  return categories.sort((a, b) => {
    const configA = getCategoryConfig(a);
    const configB = getCategoryConfig(b);
    
    if (!configA && !configB) return 0;
    if (!configA) return 1;
    if (!configB) return -1;
    
    return configA.order - configB.order;
  });
}

/**
 * DATA MIGRATION INSTRUCTIONS
 * 
 * Run this SQL in Supabase SQL Editor to update existing items:
 * 
 * -- Update generic categories to specific ones
 * UPDATE items SET category = 'Pool Structure' WHERE category = 'Product' AND name ILIKE '%pool%';
 * UPDATE items SET category = 'Coping & Tile' WHERE category = 'Product' AND name ILIKE '%tile%';
 * UPDATE items SET category = 'Coping & Tile' WHERE category = 'Product' AND name ILIKE '%coping%';
 * UPDATE items SET category = 'Decking' WHERE category = 'Product' AND name ILIKE '%deck%';
 * UPDATE items SET category = 'Equipment' WHERE category = 'Product' AND (name ILIKE '%pump%' OR name ILIKE '%filter%' OR name ILIKE '%heater%');
 * UPDATE items SET category = 'Accessories' WHERE category = 'Product' AND category NOT IN ('Pool Structure', 'Coping & Tile', 'Decking', 'Equipment');
 * UPDATE items SET category = 'Accessories' WHERE category = 'Service';
 * 
 * -- Or use a more sophisticated approach with CASE statement:
 * UPDATE items 
 * SET category = CASE
 *   WHEN name ILIKE '%pool%' OR name ILIKE '%shell%' OR name ILIKE '%structure%' THEN 'Pool Structure'
 *   WHEN name ILIKE '%tile%' OR name ILIKE '%coping%' THEN 'Coping & Tile'
 *   WHEN name ILIKE '%deck%' OR name ILIKE '%patio%' THEN 'Decking'
 *   WHEN name ILIKE '%pump%' OR name ILIKE '%filter%' OR name ILIKE '%heater%' OR name ILIKE '%equipment%' THEN 'Equipment'
 *   ELSE 'Accessories'
 * END
 * WHERE category IN ('Product', 'Service', 'General');
 */