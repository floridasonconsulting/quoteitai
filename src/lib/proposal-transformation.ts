import { 
  ProposalData, 
  ProposalSection, 
  ProposalItem, 
  Quote, 
  QuoteItem, 
  CompanySettings,
  CategoryGroup,
  ProposalVisuals
} from "@/types";
import { 
  CATEGORY_DISPLAY_ORDER, 
  normalizeCategory, 
  getCategoryMetadata,
  sortCategoriesByOrder
} from "./proposal-categories";
import { getSmartCoverImage, getCategoryImage } from "./proposal-image-library";

/**
 * UNIVERSAL IMAGE RESOLUTION SYSTEM
 * Works for ANY industry without database migrations
 * 
 * Strategy:
 * 1. Use item.imageUrl from quote JSONB if present
 * 2. Fall back to smart category-based stock images
 * 3. Final fallback to generic professional images
 */

/**
 * Get a smart item image based on item name and category
 * This works universally across all industries
 */
function getSmartItemImage(itemName: string, category: string, existingUrl?: string): string | undefined {
  // Priority 1: Use existing URL if present and valid
  if (existingUrl && existingUrl.trim() && existingUrl.startsWith('http')) {
    console.log(`[SmartImage] ✅ Using database URL for "${itemName}":`, existingUrl);
    return existingUrl;
  }
  
  console.log(`[SmartImage] ⚠️ No valid database URL for "${itemName}", using smart fallback`);
  
  // Priority 2: Smart matching based on item name keywords (universal)
  const nameLower = itemName.toLowerCase();
  
  // POOL & SPA (common keywords)
  if (nameLower.includes('pump')) return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80';
  if (nameLower.includes('filter')) return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80';
  if (nameLower.includes('heater') || nameLower.includes('heat pump')) return 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80';
  if (nameLower.includes('salt') || nameLower.includes('ozone')) return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80';
  if (nameLower.includes('skimmer')) return 'https://images.unsplash.com/photo-1576013551627-0cc20b468848?w=800&q=80'; // NEW: Added skimmer
  if (nameLower.includes('pebble') || nameLower.includes('plaster') || nameLower.includes('quartz')) return 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80';
  
  // DECKING & PAVING
  if (nameLower.includes('paver') || nameLower.includes('brick')) return 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80';
  if (nameLower.includes('concrete')) return 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80';
  if (nameLower.includes('travertine') || nameLower.includes('stone')) return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80';
  if (nameLower.includes('deck')) return 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80';
  
  // TILE & COPING
  if (nameLower.includes('tile')) return 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80';
  if (nameLower.includes('coping')) return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80';
  
  // HVAC & MECHANICAL
  if (nameLower.includes('hvac') || nameLower.includes('air condition')) return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80';
  if (nameLower.includes('furnace')) return 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80';
  if (nameLower.includes('duct')) return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80';
  
  // ELECTRICAL
  if (nameLower.includes('light') || nameLower.includes('lighting')) return 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80';
  if (nameLower.includes('panel') || nameLower.includes('electric')) return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80';
  
  // PLUMBING
  if (nameLower.includes('plumb') || nameLower.includes('pipe')) return 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80';
  if (nameLower.includes('drain')) return 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80';
  
  // LANDSCAPING
  if (nameLower.includes('plant') || nameLower.includes('tree') || nameLower.includes('shrub')) return 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80';
  if (nameLower.includes('lawn') || nameLower.includes('grass') || nameLower.includes('sod')) return 'https://images.unsplash.com/photo-1592307277589-68b9b7c17c27?w=800&q=80';
  if (nameLower.includes('irrigation') || nameLower.includes('sprinkler')) return 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80';
  
  // ROOFING
  if (nameLower.includes('roof') || nameLower.includes('shingle')) return 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&q=80';
  
  console.log(`[SmartImage] ⚠️ No keyword match for "${itemName}", using category fallback`);
  
  // Priority 3: Fall back to category-based image
  const categoryNormalized = normalizeCategory(category);
  return getCategoryImage(categoryNormalized);
}

/**
 * Transforms a raw Quote object into the new ProposalData structure
 * suitable for the "Better Proposals" viewer experience
 * 
 * UNIVERSAL: Works for ANY industry with smart image resolution
 */
export function transformQuoteToProposal(
  quote: Quote, 
  settings?: CompanySettings,
  visuals?: ProposalVisuals
): ProposalData {
  console.log('[Transformation] Starting with:', { 
    quoteId: quote.id, 
    hasSettings: !!settings,
    hasVisuals: !!visuals,
    visualsCoverImage: visuals?.coverImage,
    settingsLogo: settings?.logo
  });

  // CRITICAL: Log item data to debug image issues
  console.log('[Transformation] Quote items (RAW):', quote.items.map(item => ({
    name: item.name,
    category: item.category,
    imageUrl: item.imageUrl,
    imageUrlType: typeof item.imageUrl,
    imageUrlValid: item.imageUrl && item.imageUrl.startsWith('http'),
    enhancedDescription: item.enhancedDescription
  })));

  // Default settings if not provided - with empty strings to avoid placeholders
  const defaultSettings: CompanySettings = {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    website: '',
    terms: '',
  };

  const activeSettings = settings || defaultSettings;

  // Extract unique categories for smart image selection
  const uniqueCategories = Array.from(new Set(quote.items.map(item => normalizeCategory(item.category))));
  
  // Extract item names for even smarter image selection
  const itemNames = quote.items.map(item => item.name);
  
  // Smart cover image selection (now uses quote title + categories + item names)
  const smartCoverImage = getSmartCoverImage(
    quote.title,
    uniqueCategories,
    visuals?.coverImage,
    itemNames
  );
  
  console.log('[Transformation] Smart cover image selected:', smartCoverImage);

  // 1. Create Base Proposal Data
  const proposalData: ProposalData = {
    id: quote.id,
    status: quote.status,
    settings: {
      theme: 'modern_scroll',
      mode: 'light',
      primaryColor: '#000000',
      currency: 'USD',
    },
    client: {
      name: quote.customerName,
      email: '',
      company: '',
    },
    sender: {
      name: activeSettings.name || '',
      company: activeSettings.name || '',
      logoUrl: activeSettings.logo,
    },
    sections: [],
    visuals: {
      ...visuals,
      coverImage: smartCoverImage
    },
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };

  // 2. Generate Sections
  const sections: ProposalSection[] = [];

  // --- Section A: Hero / Executive Summary ---
  console.log('[Transformation] Hero section - coverImage:', smartCoverImage);
  
  sections.push({
    id: 'hero',
    type: 'hero',
    title: quote.title,
    subtitle: `Prepared for ${quote.customerName}`,
    content: quote.executiveSummary || "Thank you for the opportunity to present this proposal. We have carefully reviewed your requirements and crafted a solution that meets your specific needs.",
    backgroundImage: smartCoverImage,
    companyName: activeSettings.name || '',
  });

  // --- Section B: Category Groups (The Meat) with SMART IMAGE RESOLUTION ---
  const groupedItems = new Map<string, ProposalItem[]>();
  
  quote.items.forEach(item => {
    const normalizedCat = normalizeCategory(item.category);
    const currentGroup = groupedItems.get(normalizedCat) || [];
    
    // UNIVERSAL IMAGE RESOLUTION: Check database FIRST, then smart fallback
    const smartItemImage = getSmartItemImage(item.name, normalizedCat, item.imageUrl);
    
    console.log('[Transformation] Processing item with SMART RESOLUTION:', {
      itemName: item.name,
      originalCategory: item.category,
      normalizedCategory: normalizedCat,
      originalImageUrl: item.imageUrl,
      resolvedImageUrl: smartItemImage,
      resolutionMethod: item.imageUrl && item.imageUrl.startsWith('http') 
        ? '✅ DATABASE (original)' 
        : smartItemImage 
          ? '⚠️ Smart Fallback (keyword or category)' 
          : '❌ None',
      enhancedDescription: item.enhancedDescription
    });
    
    currentGroup.push({
      itemId: item.itemId,
      name: item.name,
      description: item.description,
      enhancedDescription: item.enhancedDescription,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      units: item.units,
      imageUrl: smartItemImage, // ⬅️ SMART RESOLUTION APPLIED HERE
      category: normalizedCat,
    });
    
    groupedItems.set(normalizedCat, currentGroup);
  });

  // CRITICAL FIX: Sort categories based on standard display order
  const sortedCategories = sortCategoriesByOrder(Array.from(groupedItems.keys()));
  
  console.log('[Transformation] Category sort order:', {
    unsortedCategories: Array.from(groupedItems.keys()),
    sortedCategories: sortedCategories,
    standardOrder: CATEGORY_DISPLAY_ORDER
  });

  // Create a section for each category group (in sorted order)
  sortedCategories.forEach(category => {
    const items = groupedItems.get(category) || [];
    const metadata = getCategoryMetadata(category);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    // Smart category image selection
    const categoryImage = getCategoryImage(
      category,
      visuals?.sectionBackgrounds
    );

    const categoryGroup: CategoryGroup = {
      category,
      displayName: metadata?.displayName || category,
      description: metadata?.description,
      items,
      subtotal,
      backgroundImage: categoryImage
    };

    console.log('[Transformation] Creating category section:', {
      category,
      displayName: metadata?.displayName,
      itemCount: items.length,
      itemsWithDatabaseImages: items.filter(i => i.imageUrl && quote.items.find(qi => qi.name === i.name)?.imageUrl).length,
      itemsWithFallbackImages: items.filter(i => i.imageUrl && !quote.items.find(qi => qi.name === i.name)?.imageUrl).length,
      itemsWithNoImages: items.filter(i => !i.imageUrl).length,
      subtotal,
      backgroundImage: categoryImage,
      sampleItem: items[0] ? {
        name: items[0].name,
        hasImage: !!items[0].imageUrl,
        imageUrl: items[0].imageUrl,
        imageSource: quote.items.find(qi => qi.name === items[0].name)?.imageUrl ? 'DATABASE' : 'FALLBACK'
      } : null
    });

    sections.push({
      id: `cat-${category.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'categoryGroup',
      title: metadata?.displayName,
      categoryGroups: [categoryGroup],
      backgroundImage: categoryImage,
      showPricing: quote.showPricing
    });
  });

  // --- Section C: Financial Summary ---
  sections.push({
    id: 'financials',
    type: 'lineItems',
    title: 'Investment Summary',
    items: quote.items.map(i => ({
      ...i, 
      category: normalizeCategory(i.category)
    })),
    subtotal: quote.subtotal,
    tax: quote.tax,
    total: quote.total,
    showPricing: true
  });

  // --- Section D: Terms & Conditions ---
  const termsContent = activeSettings.terms && activeSettings.terms.trim() 
    ? activeSettings.terms 
    : `Payment Terms: Net 30 days from invoice date.

Warranty: All work is guaranteed for one year from completion date.

Cancellation: 48 hours notice required for cancellation without penalty.

Changes: Any changes to the scope of work must be approved in writing and may result in additional charges.

Liability: We maintain full insurance coverage for all work performed.`;

  sections.push({
    id: 'terms',
    type: 'legal',
    title: 'Terms & Conditions',
    content: termsContent,
  });

  proposalData.sections = sections;
  
  console.log('[Transformation] ✅ COMPLETE - Image Resolution Summary:', {
    totalSections: sections.length,
    categoryCount: sortedCategories.length,
    totalItems: quote.items.length,
    itemsWithDatabaseImages: quote.items.filter(i => i.imageUrl && i.imageUrl.startsWith('http')).length,
    itemsUsingFallbacks: quote.items.filter(i => !i.imageUrl || !i.imageUrl.startsWith('http')).length,
  });
  
  return proposalData;
}