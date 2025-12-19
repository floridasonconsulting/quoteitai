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
export type Theme = CompanySettings['proposalTheme'];

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

export function getThemeGradient(theme: Theme, type: 'cover' | 'section' | 'item' = 'cover'): string {
  if (!theme || !(theme in THEME_GRADIENTS)) return ELEGANT_GRADIENT_FALLBACK;
  return THEME_GRADIENTS[theme as keyof typeof THEME_GRADIENTS][type];
}

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
    ],
    fallback: 'https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=1920&q=80',
  },
  'landscaping': {
    cover: [
      'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80', // Professional landscaping
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80', // Beautiful garden
    ],
    fallback: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80',
  },
  'hvac': {
    cover: [
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80', // Industrial HVAC
      'https://images.unsplash.com/photo-1504384308090-c89eec2cd3a9?w=1920&q=80', // Modern furnace
    ],
    fallback: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80',
  },
  'roofing': {
    cover: [
      'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=1920&q=80', // Roofing work
    ],
    fallback: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=1920&q=80',
  },
  'fencing': {
    cover: [
      'https://images.unsplash.com/photo-1610224705310-ec48f5d2dde1?w=1920&q=80', // Modern fence
    ],
    fallback: 'https://images.unsplash.com/photo-1610224705310-ec48f5d2dde1?w=1920&q=80',
  },
  'general-contractor': {
    cover: [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80', // Construction site
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80', // Renovation work
    ],
    fallback: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80',
  },
  'plumbing': {
    cover: [
      'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1920&q=80', // Pipe system
    ],
    fallback: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1920&q=80',
  },
  'electrical': {
    cover: [
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1920&q=80', // Electrical panel
    ],
    fallback: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1920&q=80',
  },
  'painting': {
    cover: [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1920&q=80', // Painting work
    ],
    fallback: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1920&q=80',
  },
  'flooring': {
    cover: [
      'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&q=80', // Hardwood flooring
    ],
    fallback: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&q=80',
  },
  'other': {
    cover: [
      'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80', // Deep purple mesh gradient
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80', // Multi-color smooth gradient
      'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=1920&q=80', // Abstract blue waves
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80', // Dark professional geometry
    ],
    fallback: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80',
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
  'general-contractor': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80',
  construction: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
  renovation: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1920&q=80',
  remodeling: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1920&q=80',

  // Pool & Water
  'pool-spa': 'https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=1920&q=80',
  pool: 'https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=1920&q=80',
  spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80',
  backyard: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',

  // Professionals
  design: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=1920&q=80',
  consulting: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1920&q=80',
  architecture: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80',

  // Abstract / Generic - Premium Mesh Gradients (BetterProposals style)
  generic_modern: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80',
  generic_dark: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
  generic_blue: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=1920&q=80',
  generic_clean: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
} as const;

// ============================================================================
// CATEGORY BACKGROUND IMAGES (Section Headers)
// ============================================================================

export const CATEGORY_IMAGES = {
  // Pool Categories
  'Pool Structure': 'https://images.unsplash.com/photo-1560742124-275138ed4e95?w=1920&q=80',
  'Coping': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
  'Tile': 'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=1920&q=80',
  'Decking': 'https://images.unsplash.com/photo-1590059530462-811c7590874e?w=1920&q=80',
  'Equipment': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80',
  'Accessories': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1920&q=80',

  // Construction
  'Foundation': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
  'Framing': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80',
  'Service': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80',

  // Generic - Abstract fallbacks for a cleaner look
  'Other': 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80',
  'Additional Items': 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80',
  'Labor': 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
  'Materials': 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=1920&q=80',
} as const;

// ============================================================================
// SMART KEYWORD LIBRARY (Categorized by Industry)
// ============================================================================

export const SMART_KEYWORD_LIBRARY = {
  'pool-spa': [
    { keywords: ['pump', 'motor', 'energy star'], url: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=800&q=80' },
    { keywords: ['filter', 'cartridge'], url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80' },
    { keywords: ['heater', 'heat pump'], url: 'https://images.unsplash.com/photo-1584622741563-12-811c7590874e?w=800&q=80' },
    { keywords: ['salt', 'chlorine', 'ozone', 'sanitizer'], url: 'https://images.unsplash.com/photo-1560742124-275138ed4e95?w=800&q=80' },
    { keywords: ['skimmer', 'basket', 'cleaner'], url: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?w=800&q=80' },
    { keywords: ['pebble', 'plaster', 'quartz', 'marcite', 'finish', 'texture'], url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80' },
    { keywords: ['tile', 'mosaic', 'glass'], url: 'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=800&q=80' },
    { keywords: ['coping', 'cantilever', 'travertine', 'paver'], url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80' },
    { keywords: ['lighting', 'led', 'color'], url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80' },
  ],
  'landscaping': [
    { keywords: ['plant', 'tree', 'shrub', 'flower'], url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80' },
    { keywords: ['lawn', 'grass', 'sod', 'mowing'], url: 'https://images.unsplash.com/photo-1592307277589-68b9b7c17c27?w=800&q=80' },
    { keywords: ['irrigation', 'sprinkler', 'drip'], url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80' },
    { keywords: ['mulch', 'bark', 'rock'], url: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80' },
    { keywords: ['retain', 'wall', 'paver', 'stone'], url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80' },
  ],
  'hvac': [
    { keywords: ['ac', 'air', 'cool', 'condenser'], url: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=800&q=80' },
    { keywords: ['furnace', 'heat', 'boiler'], url: 'https://images.unsplash.com/photo-1504384308090-c89eec2cd3a9?w=800&q=80' },
    { keywords: ['duct', 'vent', 'register'], url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80' },
    { keywords: ['thermostat', 'smart', 'control'], url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80' },
  ],
  'plumbing': [
    { keywords: ['pipe', 'leak', 'plumb'], url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80' },
    { keywords: ['water heater', 'tank'], url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80' },
    { keywords: ['drain', 'clog', 'sewer'], url: 'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=800&q=80' },
    { keywords: ['faucet', 'sink', 'toilet', 'fixture'], url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80' },
  ],
  'electrical': [
    { keywords: ['panel', 'breaker', 'fuse'], url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80' },
    { keywords: ['wire', 'outlet', 'switch'], url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80' },
    { keywords: ['light', 'lamp', 'fixture', 'recessed'], url: 'https://images.unsplash.com/photo-1510563800743-aed236490d08?w=800&q=80' },
    { keywords: ['ev', 'charger', 'tesla'], url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80' },
  ],
  'roofing': [
    { keywords: ['roof', 'shingle', 'tile'], url: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&q=80' },
    { keywords: ['gutter', 'downspout'], url: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&q=80' },
    { keywords: ['skylight', 'vent'], url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80' },
  ],
  'painting': [
    { keywords: ['paint', 'coat', 'prime'], url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80' },
    { keywords: ['drywall', 'patch', 'texture'], url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80' },
    { keywords: ['stain', 'seal'], url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80' },
  ],
} as const;

// ============================================================================
// SMART IMAGE SELECTION FUNCTIONS
// ============================================================================

/**
 * Get the best cover image based on quote title, categories, AND item names
 */
export function getSmartCoverImage(
  quoteTitle: string,
  categories: string[],
  userCoverImage?: string,
  itemNames?: string[],
  industry?: Industry,
  theme?: Theme
): string {
  if (userCoverImage) return userCoverImage;

  // NEW STRATEGY: If theme is provided, use its gradient DEFAULT
  if (theme && theme in THEME_GRADIENTS) {
    return getThemeGradient(theme, 'cover');
  }

  // Use explicit industry if provided
  if (industry && industry in DEFAULT_COVER_IMAGES) {
    return DEFAULT_COVER_IMAGES[industry as keyof typeof DEFAULT_COVER_IMAGES];
  }

  // Detect industry from all available text
  const detectedIndustry = detectIndustry(quoteTitle, categories);

  // Keyword scoring
  const scores: Record<string, number> = {};
  const allText = `${quoteTitle} ${categories.join(' ')}`.toLowerCase();

  for (const [id, imageUrl] of Object.entries(DEFAULT_COVER_IMAGES)) {
    const idLower = id.toLowerCase();
    let score = 0;

    if (quoteTitle.toLowerCase().includes(idLower)) score += 10;
    if (categories.some(c => c.toLowerCase().includes(idLower))) score += 5;
    if (allText.includes(idLower)) score += 1;

    if (score > 0) scores[id] = score;
  }

  if (Object.keys(scores).length > 0) {
    const bestMatch = Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0];
    return DEFAULT_COVER_IMAGES[bestMatch as keyof typeof DEFAULT_COVER_IMAGES];
  }

  // Fallback to detected industry
  if (detectedIndustry && detectedIndustry in DEFAULT_COVER_IMAGES) {
    return DEFAULT_COVER_IMAGES[detectedIndustry as keyof typeof DEFAULT_COVER_IMAGES];
  }

  return getGradientFallback();
}

/**
 * Get a smart item image based on name, category and industry
 * UNIVERSAL: Works for ANY industry using the keyword library
 */
export function getSmartItemImage(
  itemName: string,
  category: string,
  existingUrl?: string,
  industry?: Industry,
  overrideUrl?: string,
  theme?: Theme
): string | undefined {
  if (overrideUrl && (overrideUrl.startsWith('http') || overrideUrl.startsWith('data:'))) return overrideUrl;
  if (existingUrl && existingUrl.startsWith('http')) return existingUrl;

  // NEW STRATEGY: If theme is provided, default to gradient (SKIP keyword match)
  if (theme && theme in THEME_GRADIENTS) {
    return getThemeGradient(theme, 'item');
  }

  const nameLower = itemName.toLowerCase();

  // 1. Search in explicitly selected industry first
  if (industry && industry in SMART_KEYWORD_LIBRARY) {
    const lib = SMART_KEYWORD_LIBRARY[industry as keyof typeof SMART_KEYWORD_LIBRARY];
    for (const item of lib) {
      if (item.keywords.some(k => nameLower.includes(k))) return item.url;
    }
  }

  // 2. Search across ALL industries (cross-matching)
  for (const [ind, lib] of Object.entries(SMART_KEYWORD_LIBRARY)) {
    for (const item of lib) {
      if (item.keywords.some(k => nameLower.includes(k))) return item.url;
    }
  }

  // 3. Category match
  const catImage = getCategoryImage(category);
  const genericOther = CATEGORY_IMAGES['Other'];

  if (catImage && catImage !== genericOther) return catImage;

  // 4. Industry-specific fallback
  if (industry && industry in INDUSTRY_IMAGE_LIBRARIES) {
    return (INDUSTRY_IMAGE_LIBRARIES[industry as keyof typeof INDUSTRY_IMAGE_LIBRARIES] as any).fallback;
  }

  return catImage;
}

/**
 * Get category background image with smart fallbacks
 */
export function getCategoryImage(
  category: string,
  userImages?: Record<string, string>,
  industry?: Industry,
  theme?: Theme
): string {
  if (userImages?.[category]) return userImages[category];

  // NEW STRATEGY: Theme gradient for category headers
  if (theme && theme in THEME_GRADIENTS) {
    return getThemeGradient(theme, 'section');
  }

  // Exact match
  if (category in CATEGORY_IMAGES) return CATEGORY_IMAGES[category as keyof typeof CATEGORY_IMAGES];

  // Fuzzy match
  const catLower = category.toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    if (catLower.includes(key.toLowerCase()) || key.toLowerCase().includes(catLower)) return url;
  }

  // Industry-specific fallback for category
  if (industry && industry in INDUSTRY_IMAGE_LIBRARIES) {
    return (INDUSTRY_IMAGE_LIBRARIES[industry as keyof typeof INDUSTRY_IMAGE_LIBRARIES] as any).fallback;
  }

  return CATEGORY_IMAGES['Other'];
}

/**
 * Get all unique categories from items and map to images
 */
export function mapCategoriesToImages(
  categories: string[],
  userImages?: Record<string, string>,
  industry?: Industry,
  theme?: Theme
): Record<string, string> {
  const mapping: Record<string, string> = {};
  categories.forEach(category => {
    mapping[category] = getCategoryImage(category, userImages, industry, theme);
  });
  return mapping;
}

/**
 * Industry detection from quote data
 */
export function detectIndustry(quoteTitle: string, categories: string[]): string {
  const allText = `${quoteTitle} ${categories.join(' ')}`.toLowerCase();

  // POOL & SPA - Extended with common remodel terms
  if (
    allText.includes('pool') ||
    allText.includes('spa') ||
    allText.includes('swimming') ||
    allText.includes('plaster') ||
    allText.includes('pebble') ||
    allText.includes('coping') ||
    allText.includes('water feature')
  ) return 'pool-spa';

  if (allText.includes('landscape') || allText.includes('garden') || allText.includes('lawn') || allText.includes('irrigation') || allText.includes('sod')) return 'landscaping';
  if (allText.includes('hvac') || allText.includes('heat') || allText.includes('cool') || allText.includes('ac ')) return 'hvac';
  if (allText.includes('roof') || allText.includes('shingle')) return 'roofing';
  if (allText.includes('plumb') || allText.includes('pipe') || allText.includes('leak')) return 'plumbing';
  if (allText.includes('electric') || allText.includes('wire') || allText.includes('panel')) return 'electrical';
  if (allText.includes('paint')) return 'painting';
  if (allText.includes('floor') || allText.includes('hardwood')) return 'flooring'; // Removed "tile" as it's common in pools too
  if (allText.includes('fence')) return 'fencing';
  if (allText.includes('renov') || allText.includes('remodel') || allText.includes('construct')) return 'general-contractor';

  return 'other';
}
