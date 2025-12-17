/**
 * Proposal Image Library
 * Curated high-quality images for various industries and categories
 * 
 * Strategy: Industry Defaults → Smart Keyword Matching → User Overrides → Elegant Gradient Fallback
 */

import type { CompanySettings } from '@/types';

// ============================================================================
// SUPPORTED INDUSTRIES
// ============================================================================

export type Industry = CompanySettings['industry'];

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
// INDUSTRY-SPECIFIC IMAGE LIBRARIES
// ============================================================================

export const INDUSTRY_IMAGE_LIBRARIES = {
  'pool-spa': {
    cover: [
      'https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=1920&q=80', // Luxury pool aerial
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80', // Pool with travertine deck
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80', // Beautiful backyard pool
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80', // Modern spa
    ],
    fallback: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
  },
  'landscaping': {
    cover: [
      'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80', // Professional landscaping
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80', // Beautiful garden
      'https://images.unsplash.com/photo-1592307277589-68b9b7c17c27?w=1920&q=80', // Manicured lawn
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80', // Irrigation system
    ],
    fallback: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80',
  },
  'hvac': {
    cover: [
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80', // HVAC unit
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1920&q=80', // Heating equipment
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1920&q=80', // Commercial HVAC
    ],
    fallback: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80',
  },
  'roofing': {
    cover: [
      'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=1920&q=80', // Roofing work
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80', // Construction site
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=80', // House siding/roof
    ],
    fallback: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=1920&q=80',
  },
  'fencing': {
    cover: [
      'https://images.unsplash.com/photo-1610224705310-ec48f5d2dde1?w=1920&q=80', // Modern fence
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80', // Backyard with fence
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1920&q=80', // Patio fencing
    ],
    fallback: 'https://images.unsplash.com/photo-1610224705310-ec48f5d2dde1?w=1920&q=80',
  },
  'general-contractor': {
    cover: [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80', // Construction site
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80', // Renovation work
      'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1920&q=80', // Remodeling
    ],
    fallback: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80',
  },
  'plumbing': {
    cover: [
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1920&q=80', // Plumbing work
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80', // Modern bathroom
      'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=1920&q=80', // Kitchen plumbing
    ],
    fallback: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1920&q=80',
  },
  'electrical': {
    cover: [
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1920&q=80', // Electrical panel
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=1920&q=80', // Modern lighting
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80', // Electrical work
    ],
    fallback: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1920&q=80',
  },
  'painting': {
    cover: [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1920&q=80', // Painting work
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=80', // Modern interior
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80', // Painted bedroom
    ],
    fallback: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1920&q=80',
  },
  'flooring': {
    cover: [
      'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&q=80', // Hardwood flooring
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=80', // Modern living room
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80', // Flooring installation
    ],
    fallback: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&q=80',
  },
  'other': {
    cover: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1920&q=80', // Modern home exterior
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80', // Commercial building
      'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80', // Abstract modern
    ],
    fallback: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1920&q=80',
  },
} as const;

// ============================================================================
// ELEGANT GRADIENT FALLBACK (Professional, Brand-Neutral)
// ============================================================================

export const ELEGANT_GRADIENT_FALLBACK = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

// Convert CSS gradient to data URL for use as background image
export const getGradientFallback = (): string => {
  // Return a high-quality abstract gradient that works for any industry
  return 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80'; // Modern abstract gradient
};

// ============================================================================
// COVER IMAGES (Hero Backgrounds for Quote Title Pages)
// ============================================================================

export const DEFAULT_COVER_IMAGES = {
  // Construction & Renovation
  construction: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80',
  renovation: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
  remodeling: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1920&q=80',

  // Pool & Water - ENHANCED: Luxurious backyard pool scenes
  pool: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80', // Beautiful pool with travertine deck
  pools: 'https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=1920&q=80', // Luxury pool wide angle
  spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80', // Modern spa
  backyard: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80', // Beautiful backyard with pool
  fountain: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1920&q=80', // Water feature
  swimming: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80', // Pool from above
  outdoor: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80', // Outdoor living space

  // Landscaping
  landscaping: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80',
  landscape: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80',
  gardening: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80',
  garden: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80',
  lawn: 'https://images.unsplash.com/photo-1592307277589-68b9b7c17c27?w=1920&q=80',

  // Home Services
  plumbing: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1920&q=80',
  electrical: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1920&q=80',
  hvac: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80',
  heating: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80',
  cooling: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80',
  roofing: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=1920&q=80',
  painting: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1920&q=80',
  flooring: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&q=80',

  // Outdoor & Exterior
  decking: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80',
  deck: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80',
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

  // Generic Fallbacks - Pool/Outdoor focused
  generic_home: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80', // Beautiful home with pool
  generic_commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80',
  generic_outdoor: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80', // Outdoor deck/patio
  generic_modern: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80', // Abstract gradient
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

  // Generic - Pool/Outdoor focused fallbacks
  'Other': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80', // Generic pool scene
  'Additional Items': 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80', // Backyard pool
  'Materials': 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1920&q=80',
  'Labor': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
} as const;

// ============================================================================
// SMART IMAGE SELECTION FUNCTIONS
// ============================================================================

/**
 * Get the best cover image based on quote title, categories, AND item names
 * ENHANCED: Now analyzes all available text for better matching
 */
export function getSmartCoverImage(
  quoteTitle: string,
  categories: string[],
  userCoverImage?: string,
  itemNames?: string[], // NEW: Analyze item names too
  industry?: Industry   // NEW: Explicit industry selection
): string {
  // Priority 1: User-uploaded image
  if (userCoverImage) return userCoverImage;

  // Priority 2: Explicit industry selection (High priority match)
  if (industry && industry in DEFAULT_COVER_IMAGES) {
    console.log(`[SmartImage] Using explicit industry for cover: ${industry}`);
    return DEFAULT_COVER_IMAGES[industry as keyof typeof DEFAULT_COVER_IMAGES];
  }

  // Combine title and categories ONLY for analysis (NOT item names - they're too specific)
  const allText = [
    quoteTitle,
    ...categories
  ].join(' ').toLowerCase();

  console.log('[SmartImage] Analyzing quote for INDUSTRY-LEVEL cover image:', { quoteTitle, categories });

  // Priority 2: Score each image by keyword relevance
  const scores: Record<string, number> = {};

  for (const [keyword, imageUrl] of Object.entries(DEFAULT_COVER_IMAGES)) {
    let score = 0;
    const keywordLower = keyword.toLowerCase();

    // Title match (highest weight)
    if (quoteTitle.toLowerCase().includes(keywordLower)) score += 10;

    // Category match (medium weight)
    for (const category of categories) {
      if (category.toLowerCase().includes(keywordLower)) score += 5;
    }

    // General text match (low weight)
    if (allText.includes(keywordLower)) score += 1;

    if (score > 0) {
      scores[keyword] = score;
      console.log(`[SmartImage] Keyword "${keyword}" scored ${score}`);
    }
  }

  // Return highest scoring image
  if (Object.keys(scores).length > 0) {
    const bestKeyword = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)[0][0];

    console.log(`[SmartImage] Best match: "${bestKeyword}" (score: ${scores[bestKeyword]})`);
    return DEFAULT_COVER_IMAGES[bestKeyword as keyof typeof DEFAULT_COVER_IMAGES];
  }

  // Priority 3: Detect industry from combined text
  const detectedIndustry = detectIndustry(quoteTitle, categories);
  if (detectedIndustry && detectedIndustry in DEFAULT_COVER_IMAGES) {
    console.log(`[SmartImage] Industry detected: ${detectedIndustry}`);
    return DEFAULT_COVER_IMAGES[detectedIndustry as keyof typeof DEFAULT_COVER_IMAGES];
  }

  // Priority 4: Elegant gradient fallback (professional, brand-neutral)
  console.log('[SmartImage] No match found, using elegant gradient fallback');
  return getGradientFallback();
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
 * ENHANCED: More comprehensive keyword matching
 */
export function detectIndustry(quoteTitle: string, categories: string[]): string {
  const allText = `${quoteTitle} ${categories.join(' ')}`.toLowerCase();

  // Pool & Spa (most specific first)
  if (allText.includes('pool') || allText.includes('spa') || allText.includes('swimming')) return 'pool';

  // Landscaping
  if (allText.includes('landscape') || allText.includes('garden') || allText.includes('lawn')) return 'landscaping';

  // Home Services
  if (allText.includes('roof')) return 'roofing';
  if (allText.includes('plumb')) return 'plumbing';
  if (allText.includes('electric')) return 'electrical';
  if (allText.includes('hvac') || allText.includes('heating') || allText.includes('cooling') || allText.includes('air condition')) return 'hvac';

  // Interior
  if (allText.includes('kitchen')) return 'kitchen';
  if (allText.includes('bathroom') || allText.includes('bath')) return 'bathroom';

  // Exterior
  if (allText.includes('paint')) return 'painting';
  if (allText.includes('floor')) return 'flooring';
  if (allText.includes('deck')) return 'decking';
  if (allText.includes('patio')) return 'patio';
  if (allText.includes('fence')) return 'fencing';

  // Construction
  if (allText.includes('construct') || allText.includes('build') || allText.includes('renovat') || allText.includes('remodel')) return 'construction';

  // Fallback to elegant gradient
  return 'generic_modern';
}