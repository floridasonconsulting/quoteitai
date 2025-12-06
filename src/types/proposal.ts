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
  quantity: number;
  price: number;
  total: number;
  units?: string;
  imageUrl?: string; // NEW: Product/service image
  category?: string; // NEW: Category for grouping
}

export interface CategoryGroup {
  category: string;
  displayName: string;
  description?: string; // NEW: Category description paragraph
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

export interface ProposalSection {
  id: string;
  type: 'hero' | 'text' | 'lineItems' | 'categoryGroup' | 'pricing' | 'legal';
  title?: string;
  subtitle?: string;
  content?: string;
  backgroundImage?: string;
  companyName?: string; // NEW: Company name for title page
  items?: ProposalItem[];
  categoryGroups?: CategoryGroup[]; // NEW: Grouped items by category
  subtotal?: number;
  tax?: number;
  total?: number;
  terms?: string;
  showPricing?: boolean; // NEW: Toggle for line-item pricing visibility
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
  createdAt: string;
  updatedAt: string;
}
