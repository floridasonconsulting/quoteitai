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
  // Group items by category
  const categoryGroups = groupItemsByCategory(quote.items);
  
  // Build sections in presentation order
  const sections: ProposalSection[] = [
    // 1. Hero/Title Page
    {
      id: 'hero',
      type: 'hero',
      title: quote.title,
      subtitle: customer?.name || quote.customerName,
      backgroundImage: settings?.logo,
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
    })),
    
    // 4. Pricing Summary
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
  // Create a map of category -> items
  const categoryMap = new Map<string, ProposalItem[]>();
  
  items.forEach(item => {
    const category = item.category || 'Uncategorized';
    
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
      items,
      subtotal: items.reduce((sum, item) => sum + item.total, 0),
    };
  });
}