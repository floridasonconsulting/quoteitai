export type ProposalTheme = 'corporate_sidebar' | 'modern_scroll' | 'presentation_deck';
export type ProposalMode = 'light' | 'dark' | 'vibrant';
export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'accepted' | 'declined';

export interface ProposalSettings {
  theme: ProposalTheme;
  mode: ProposalMode;
  primaryColor: string;
  secondaryColor?: string;
  currency: string;
  fontFamily?: string;
}

export interface ProposalClient {
  name: string;
  email: string;
  company?: string;
  address?: string;
}

export interface ProposalItem {
  itemId?: string;
  name: string;
  description: string;
  enhancedDescription?: string; // NEW: Rich text description for proposals
  quantity: number;
  price: number;
  total: number;
  units?: string;
  imageUrl?: string; // Product/service image
  category?: string; // Category for grouping
}

export interface CategoryGroup {
  category: string;
  displayName: string;
  description?: string; // Category description paragraph
  backgroundImage?: string; // NEW: Category-specific background image
  items: ProposalItem[];
  subtotal: number;
}

export interface PricingOption {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

// NEW: Visual assets management
export interface ProposalVisuals {
  coverImage?: string; // Hero background for cover page
  logo?: string; // Company/brand logo
  gallery?: string[]; // Additional images for gallery sections
  sectionBackgrounds?: Record<string, string>; // Category-specific backgrounds
  itemImages?: Record<string, string>; // NEW: Line item specific images
}

export interface ProposalSection {
  id: string;
  type: 'hero' | 'text' | 'lineItems' | 'categoryGroup' | 'pricing' | 'legal';
  title?: string;
  subtitle?: string;
  content?: string;
  backgroundImage?: string;
  companyName?: string; // Company name for title page
  items?: ProposalItem[];
  categoryGroups?: CategoryGroup[]; // Grouped items by category
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: string;
  terms?: string;
  showPricing?: boolean; // Toggle for line-item pricing visibility
}

export interface ProposalData {
  id: string;
  status: ProposalStatus;
  settings: ProposalSettings;
  client: ProposalClient;
  sender?: {
    name: string;
    company: string;
    logoUrl?: string;
  };
  sections: ProposalSection[];
  visuals?: ProposalVisuals; // NEW: Visual assets
  createdAt: string;
  updatedAt: string;
}

// NEW: Category display order constant
export const CATEGORY_DISPLAY_ORDER = [
  'Pool Structure',
  'Coping & Tile',
  'Decking',
  'Equipment',
  'Accessories',
  'Services',
  'Other' // Catch-all for uncategorized items
] as const;

export type StandardCategory = typeof CATEGORY_DISPLAY_ORDER[number];

// NEW: Helper function to get display name for categories
export const getCategoryDisplayName = (category: string): string => {
  const standardCategories: Record<string, string> = {
    'Pool Structure': 'Pool Structure',
    'Coping & Tile': 'Coping & Tile',
    'Decking': 'Decking',
    'Equipment': 'Equipment',
    'Accessories': 'Accessories',
    'Services': 'Services',
    'Other': 'Other'
  };

  return standardCategories[category] || 'Other';
};

// NEW: Success state types for proposal actions
export type ProposalActionType = 'accepted' | 'declined' | 'commented';

export interface ProposalActionResult {
  type: ProposalActionType;
  message?: string; // For comments
  salesRepName?: string; // For acceptance follow-up
  timestamp: string;
}