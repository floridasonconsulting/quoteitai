/**
 * Proposal Transformation Layer
 * Transforms Quote data into structured ProposalData with category grouping
 */

import { Quote, Customer, CompanySettings, QuoteItem } from '@/types';
import { ProposalData, ProposalSection, CategoryGroup, ProposalItem } from '@/types/proposal';
import { CATEGORY_DISPLAY_ORDER, sortCategoriesByOrder, getCategoryConfig } from './proposal-config';

/**
 * Transform quote to proposal with intelligent category grouping
 */
export function transformQuoteToProposal(
  quote: Quote,
  customer?: Customer,
  settings?: CompanySettings
): ProposalData {
  console.log('[transformQuoteToProposal] Input:', {
    quoteId: quote.id,
    showPricing: quote.showPricing,
    itemCount: quote.items?.length,
    settingsName: settings?.name,
    settingsEmail: settings?.email,
    settingsTerms: settings?.terms?.substring(0, 50),
    hasLogo: !!settings?.logo
  });

  // Group items by category
  const categoryGroups = groupItemsByCategory(quote.items);
  
  console.log('[transformQuoteToProposal] Category groups:', categoryGroups.map(g => ({
    category: g.category,
    itemCount: g.items.length,
    hasImages: g.items.filter(i => i.imageUrl).length
  })));

  // Build sections in presentation order
  const sections: ProposalSection[] = [
    // 1. Hero/Title Page with company info
    {
      id: 'hero',
      type: 'hero',
      title: quote.title,
      subtitle: customer?.name || quote.customerName,
      backgroundImage: settings?.logo,
      companyName: settings?.name || 'Company',
      companyAddress: settings?.address,
      companyCity: settings?.city,
      companyState: settings?.state,
      companyZip: settings?.zip,
      companyPhone: settings?.phone,
      companyEmail: settings?.email,
      companyWebsite: settings?.website,
    },
    
    // 2. Executive Summary (if exists)
    ...(quote.executiveSummary ? [{
      id: 'executive-summary',
      type: 'text' as const,
      title: 'Executive Summary',
      content: quote.executiveSummary,
    }] : []),
    
    // 3. Category Groups (dynamic, sorted by display order)
    ...categoryGroups.map((group, index) => ({
      id: `category-${index}`,
      type: 'categoryGroup' as const,
      title: group.displayName,
      categoryGroups: [group],
      showPricing: quote.showPricing === true,
    })),
    
    // 4. Pricing Summary - ALWAYS SHOW (even when line item pricing is hidden)
    {
      id: 'pricing',
      type: 'pricing' as const,
      title: 'Investment Summary',
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      terms: settings?.terms || 'Payment terms to be discussed',
    },
    
    // 5. Terms & Conditions
    {
      id: 'legal',
      type: 'legal' as const,
      title: 'Terms & Conditions',
      content: settings?.terms || 'Standard terms and conditions apply.',
    },
  ];

  console.log('[transformQuoteToProposal] Generated sections:', sections.map(s => ({
    id: s.id,
    type: s.type,
    showPricing: 'showPricing' in s ? s.showPricing : undefined,
    hasCompanyInfo: s.type === 'hero' ? {
      name: s.companyName,
      email: s.companyEmail,
      phone: s.companyPhone
    } : undefined
  })));

  return {
    id: quote.id,
    quoteId: quote.id,
    theme: settings?.proposalTheme || 'modern-corporate',
    sections,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };
}

/**
 * Group quote items by category with sorting
 */
function groupItemsByCategory(items: QuoteItem[]): CategoryGroup[] {
  console.log('[groupItemsByCategory] Processing items:', items?.length);
  
  if (!items || items.length === 0) {
    console.warn('[groupItemsByCategory] No items provided');
    return [];
  }

  // Create a map of category -> items
  const categoryMap = new Map<string, ProposalItem[]>();
  
  items.forEach((item, index) => {
    const category = item.category || 'Uncategorized';
    
    console.log(`[groupItemsByCategory] Item ${index}:`, {
      name: item.name,
      category,
      hasImage: !!item.imageUrl,
      imageUrl: item.imageUrl
    });
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    
    categoryMap.get(category)!.push({
      itemId: item.itemId,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      units: item.units,
      imageUrl: item.imageUrl,
      category: category,
    });
  });
  
  // Convert map to sorted array of CategoryGroups
  const categories = Array.from(categoryMap.keys());
  const sortedCategories = sortCategoriesByOrder(categories);
  
  return sortedCategories.map(category => {
    const items = categoryMap.get(category)!;
    const config = getCategoryConfig(category);
    
    return {
      category,
      displayName: config?.displayName || category,
      description: config?.description,
      items,
      subtotal: items.reduce((sum, item) => sum + item.total, 0),
    };
  });
}