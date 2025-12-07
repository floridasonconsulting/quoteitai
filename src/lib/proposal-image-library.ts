/**
 * Proposal Image Library
 * Curated high-quality images for various industries and categories
 * 
 * Strategy: Smart Defaults → User Overrides → AI Suggestions (optional)
 */

// ============================================================================
// COVER IMAGES (Hero Backgrounds for Quote Title Pages)
// ============================================================================

export const DEFAULT_COVER_IMAGES = {
  // Construction & Renovation
  construction: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80',
  renovation: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
  remodeling: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1920&q=80',
  
  // Pool & Water
  pool: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
  spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80',
  fountain: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1920&q=80',
  
  // Landscaping
  landscaping: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80',
  gardening: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80',
  lawn: 'https://images.unsplash.com/photo-1592307277589-68b9b7c17c27?w=1920&q=80',
  
  // Home Services
  plumbing: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1920&q=80',
  electrical: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1920&q=80',
  hvac: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80',
  roofing: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=1920&q=80',
  painting: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1920&q=80',
  flooring: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&q=80',
  
  // Outdoor & Exterior
  decking: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80',
  fencing: 'https://images.unsplash.com/photo-1610224705310-ec48f5d2dde1?w=1920&q=80',
  patio: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1920&q=80',
  driveway: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
  
  // Interior
  kitchen: 'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=1920&q=80',
  bathroom: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80',
  bedroom: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80',
  living: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=80',
  
  // Professional Services
  design: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=1920&q=80',
  consulting: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1920&q=80',
  architecture: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80',
  
  // Generic Fallbacks
  generic_home: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1920&q=80',
  generic_commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80',
  generic_modern: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
} as const;

// ============================================================================
// CATEGORY BACKGROUND IMAGES (Section Headers)
// ============================================================================

export const CATEGORY_IMAGES = {
  // Pool Categories
  'Pool Structure': 'https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=1920&q=80',
  'Coping': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
  'Tile': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80',
  'Decking': 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80',
  'Equipment': 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1920&q=80',
  'Accessories': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80',
  
  // Construction Categories
  'Foundation': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
  'Framing': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80',
  'Drywall': 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1920&q=80',
  'Siding': 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=80',
  
  // Home Services
  'Plumbing': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1920&q=80',
  'Electrical': 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1920&q=80',
  'HVAC': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80',
  'Roofing': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=1920&q=80',
  'Painting': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1920&q=80',
  'Flooring': 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&q=80',
  
  // Landscaping
  'Landscaping': 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80',
  'Irrigation': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80',
  'Hardscaping': 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1920&q=80',
  'Lighting': 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=1920&q=80',
  
  // Interior Work
  'Kitchen': 'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=1920&q=80',
  'Bathroom': 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80',
  'Cabinets': 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1920&q=80',
  'Countertops': 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1920&q=80',
  
  // Services
  'Services': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
  'Installation': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
  'Maintenance': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80',
  'Repair': 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=1920&q=80',
  
  // Generic
  'Other': 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80',
  'Materials': 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1920&q=80',
  'Labor': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
} as const;

// ============================================================================
// SMART IMAGE SELECTION FUNCTIONS
// ============================================================================

/**
 * Get the best cover image based on quote title and categories
 */
export function getSmartCoverImage(
  quoteTitle: string,
  categories: string[],
  userCoverImage?: string
): string {
  // Priority 1: User-uploaded image
  if (userCoverImage) return userCoverImage;
  
  // Priority 2: Match quote title keywords
  const titleLower = quoteTitle.toLowerCase();
  
  for (const [keyword, imageUrl] of Object.entries(DEFAULT_COVER_IMAGES)) {
    if (titleLower.includes(keyword)) {
      return imageUrl;
    }
  }
  
  // Priority 3: Match primary category
  if (categories.length > 0) {
    const primaryCategory = categories[0].toLowerCase();
    
    for (const [keyword, imageUrl] of Object.entries(DEFAULT_COVER_IMAGES)) {
      if (primaryCategory.includes(keyword)) {
        return imageUrl;
      }
    }
  }
  
  // Priority 4: Generic fallback
  return DEFAULT_COVER_IMAGES.generic_modern;
}

/**
 * Get category background image with smart fallbacks
 */
export function getCategoryImage(
  category: string,
  userImages?: Record<string, string>
): string {
  // Priority 1: User-uploaded category image
  if (userImages?.[category]) {
    return userImages[category];
  }
  
  // Priority 2: Exact match from library
  if (category in CATEGORY_IMAGES) {
    return CATEGORY_IMAGES[category as keyof typeof CATEGORY_IMAGES];
  }
  
  // Priority 3: Fuzzy match
  const categoryLower = category.toLowerCase();
  
  for (const [key, imageUrl] of Object.entries(CATEGORY_IMAGES)) {
    if (categoryLower.includes(key.toLowerCase()) || key.toLowerCase().includes(categoryLower)) {
      return imageUrl;
    }
  }
  
  // Priority 4: Generic fallback
  return CATEGORY_IMAGES['Other'];
}

/**
 * Get all unique categories from items and map to images
 */
export function mapCategoriesToImages(
  categories: string[],
  userImages?: Record<string, string>
): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  categories.forEach(category => {
    mapping[category] = getCategoryImage(category, userImages);
  });
  
  return mapping;
}

/**
 * Industry detection from quote data
 */
export function detectIndustry(quoteTitle: string, categories: string[]): string {
  const allText = `${quoteTitle} ${categories.join(' ')}`.toLowerCase();
  
  if (allText.includes('pool') || allText.includes('spa')) return 'pool';
  if (allText.includes('landscape') || allText.includes('garden')) return 'landscaping';
  if (allText.includes('roof')) return 'roofing';
  if (allText.includes('plumb')) return 'plumbing';
  if (allText.includes('electric')) return 'electrical';
  if (allText.includes('hvac') || allText.includes('heating') || allText.includes('cooling')) return 'hvac';
  if (allText.includes('kitchen')) return 'kitchen';
  if (allText.includes('bathroom')) return 'bathroom';
  if (allText.includes('paint')) return 'painting';
  if (allText.includes('floor')) return 'flooring';
  if (allText.includes('deck')) return 'decking';
  
  return 'construction'; // Default
}