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
  // Default settings if not provided
  const defaultSettings: CompanySettings = {
    name: 'Company Name',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    website: '',
    terms: 'Payment terms and conditions to be discussed.',
    currency: 'USD'
  };

  const activeSettings = settings || defaultSettings;

  // 1. Create Base Proposal Data
  const proposalData: ProposalData = {
    id: quote.id,
    status: quote.status,
    settings: {
      theme: 'modern_scroll', // Default to modern scroll
      mode: 'light',
      primaryColor: '#000000', // Should come from settings
      currency: activeSettings.currency || 'USD',
    },
    client: {
      name: quote.customerName,
      email: '', // Would need customer details fetch
      company: '',
    },
    sender: {
      name: activeSettings.name,
      company: activeSettings.name,
      logoUrl: activeSettings.logo,
    },
    sections: [],
    visuals: visuals || {},
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };

  // 2. Generate Sections
  const sections: ProposalSection[] = [];

  // --- Section A: Hero / Cover ---
  // (Handled by ProposalCover component state, but we can have a hero section content too)
  sections.push({
    id: 'hero',
    type: 'hero',
    title: quote.title,
    subtitle: `Prepared for ${quote.customerName}`,
    content: quote.executiveSummary || "Thank you for the opportunity to present this proposal. We have carefully reviewed your requirements and crafted a solution that meets your specific needs.",
    backgroundImage: visuals?.coverImage,
  });

  // --- Section B: Category Groups (The Meat) ---
  // Group items by normalized category
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

    // Get category-specific background if available
    const bgImage = visuals?.sectionBackgrounds?.[category];

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
      showPricing: quote.showPricing // Inherit visibility setting
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
    showPricing: true // Summary always shows pricing unless globally hidden (logic can be refined)
  });

  // --- Section D: Terms & Conditions ---
  if (activeSettings.terms) {
    sections.push({
      id: 'terms',
      type: 'legal',
      title: 'Terms & Conditions',
      content: activeSettings.terms,
    });
  }

  proposalData.sections = sections;
  return proposalData;
}