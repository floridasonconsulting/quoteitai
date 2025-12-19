import {
  Quote,
  QuoteItem,
  CompanySettings,
} from "@/types";
import {
  ProposalData,
  ProposalSection,
  ProposalItem,
  CategoryGroup,
  ProposalVisuals
} from "@/types/proposal";
import {
  CATEGORY_DISPLAY_ORDER,
  normalizeCategory,
  getCategoryMetadata,
  sortCategoriesByOrder
} from "./proposal-categories";
import {
  getSmartCoverImage,
  getCategoryImage,
  getSmartItemImage,
  getThemeGradient,
  Industry
} from "./proposal-image-library";

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
  const showImages = activeSettings.showProposalImages !== false;

  // Extract unique categories for smart image selection
  const uniqueCategories = Array.from(new Set(quote.items.map(item => normalizeCategory(item.category))));

  // Extract item names for even smarter image selection
  const itemNames = quote.items.map(item => item.name);

  // Smart cover image selection (now uses quote title + categories + item names)
  // ONLY if images are enabled in settings
  const smartCoverImage = showImages
    ? getSmartCoverImage(
      visuals?.coverImage,
      activeSettings.proposalTheme,
      activeSettings
    )
    : undefined;

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
    total: quote.total,
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
    total: quote.total,
    currency: activeSettings.currency || 'USD',
  });

  // --- Section B: Category Groups (The Meat) with SMART IMAGE RESOLUTION ---
  console.log('[Transformation] 🔍 CATEGORY ANALYSIS - Starting item categorization...');
  console.log('[Transformation] Total items to process:', quote.items.length);

  const groupedItems = new Map<string, ProposalItem[]>();

  quote.items.forEach((item, index) => {
    const originalCategory = item.category;
    const normalizedCat = normalizeCategory(item.category, item.name); // Pass item name for inference
    const currentGroup = groupedItems.get(normalizedCat) || [];

    console.log(`[Transformation] Item ${index + 1}/${quote.items.length}: "${item.name}"`);
    console.log(`  - Original Category: "${originalCategory || 'NULL/UNDEFINED'}"`);
    console.log(`  - Normalized Category: "${normalizedCat}"`);
    console.log(`  - Was Normalized: ${originalCategory !== normalizedCat}`);
    console.log(`  - Group Size: ${currentGroup.length + 1}`);

    // UNIVERSAL IMAGE RESOLUTION:
    // 1. Visual Override (User edited in Proposal Viewer)
    // 2. Database Image (From Item Catalog)
    // 3. Smart Fallback (Visual Rules / Category / Theme Gradient)
    const itemOverride = visuals?.itemImages?.[item.name] || visuals?.sectionBackgrounds?.[`item_${item.name}`];

    // Check override OR database image
    const effectiveImageUrl = itemOverride || item.imageUrl;

    const smartItemImage = showImages
      ? getSmartItemImage(item.name, item.category, effectiveImageUrl, activeSettings.proposalTheme, activeSettings)
      : undefined;

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
      imageUrl: smartItemImage,
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

    // Generate consistent section ID for lookup
    const sectionId = `cat-${category.toLowerCase().replace(/\s+/g, '-')}`;

    // Smart category image selection
    // ONLY if images are enabled in settings
    const categoryImage = showImages
      ? getCategoryImage(
        category,
        visuals?.sectionBackgrounds?.[sectionId] || visuals?.sectionBackgrounds?.[category], // Try ID first (new format), then name (legacy)
        activeSettings.proposalTheme,
        activeSettings
      )
      : undefined;

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
      showPricing: quote.showPricing,
      pricingMode: quote.pricingMode || 'category_total'
    });
  });

  // --- Section C: Financial Summary ---
  sections.push({
    id: 'financials',
    type: 'lineItems',
    title: 'Investment Summary',
    items: quote.items.map(i => ({
      ...i,
      imageUrl: showImages ? i.imageUrl : undefined,
      category: normalizeCategory(i.category, i.name) // Pass item name for inference
    })),
    subtotal: quote.subtotal,
    tax: quote.tax,
    total: quote.total,
    showPricing: true,
    // Pass persistent pricing mode setting (default to 'category_total')
    pricingMode: quote.pricingMode || 'category_total', // Use quote setting directly
    backgroundImage: showImages
      ? getCategoryImage(
        'Investment Summary', // Pseudo-category name
        visuals?.sectionBackgrounds?.['financials'],
        activeSettings.proposalTheme,
        activeSettings
      )
      : undefined
  } as any);

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
    backgroundImage: showImages
      ? getCategoryImage(
        'Terms & Conditions', // Pseudo-category name
        visuals?.sectionBackgrounds?.['terms'],
        activeSettings.proposalTheme,
        activeSettings
      )
      : undefined
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