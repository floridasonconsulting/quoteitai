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

/**
 * Transforms a raw Quote object into the new ProposalData structure
 * suitable for the "Better Proposals" viewer experience
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
    visuals: visuals || {},
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };

  // 2. Generate Sections
  const sections: ProposalSection[] = [];

  // --- Section A: Hero / Executive Summary ---
  const coverImage = visuals?.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80';
  
  console.log('[Transformation] Hero section - coverImage:', coverImage);
  
  sections.push({
    id: 'hero',
    type: 'hero',
    title: quote.title,
    subtitle: `Prepared for ${quote.customerName}`,
    content: quote.executiveSummary || "Thank you for the opportunity to present this proposal. We have carefully reviewed your requirements and crafted a solution that meets your specific needs.",
    backgroundImage: coverImage,
    companyName: activeSettings.name || '',
  });

  // --- Section B: Category Groups (The Meat) ---
  const groupedItems = new Map<string, ProposalItem[]>();
  
  quote.items.forEach(item => {
    const normalizedCat = normalizeCategory(item.category);
    const currentGroup = groupedItems.get(normalizedCat) || [];
    
    currentGroup.push({
      itemId: item.itemId,
      name: item.name,
      description: item.description,
      enhancedDescription: item.enhancedDescription,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      units: item.units,
      imageUrl: item.imageUrl,
      category: normalizedCat,
    });
    
    groupedItems.set(normalizedCat, currentGroup);
  });

  // Sort categories based on standard display order
  const sortedCategories = sortCategoriesByOrder(Array.from(groupedItems.keys()));

  // Create a section for each category group
  sortedCategories.forEach(category => {
    const items = groupedItems.get(category) || [];
    const metadata = getCategoryMetadata(category);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    // Priority for background images:
    // 1. User-uploaded category-specific background
    // 2. Default hero image from category metadata
    const bgImage = visuals?.sectionBackgrounds?.[category] || metadata?.heroImage;

    const categoryGroup: CategoryGroup = {
      category,
      displayName: metadata?.displayName || category,
      description: metadata?.description,
      items,
      subtotal,
      backgroundImage: bgImage
    };

    sections.push({
      id: `cat-${category.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'categoryGroup',
      title: metadata?.displayName,
      categoryGroups: [categoryGroup],
      backgroundImage: bgImage,
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
  // CRITICAL FIX: Always add terms section, use default if not provided
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
  return proposalData;
}