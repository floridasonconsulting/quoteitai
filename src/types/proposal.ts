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
}

export interface CategoryGroup {
  category: string;
  displayName: string;
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
  items?: ProposalItem[];
  categoryGroups?: CategoryGroup[]; // NEW: Grouped items by category
  subtotal?: number;
  tax?: number;
  total?: number;
  terms?: string;
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
