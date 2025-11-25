export type ProposalTheme = 'corporate_sidebar' | 'modern_scroll' | 'presentation_deck';
export type ProposalMode = 'light' | 'dark' | 'vibrant';
export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'signed';

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
  id: string;
  name: string;
  desc: string;
  price: number;
  optional: boolean;
  quantity?: number;
  units?: string;
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
  type: 'hero' | 'text' | 'line-items' | 'pricing' | 'legal';
  title: string;
  // Hero specific
  subtitle?: string;
  backgroundImage?: string;
  // Text/Legal specific
  content?: string;
  // Line items specific
  showPrices?: boolean;
  items?: ProposalItem[];
  // Pricing specific
  packages?: PricingOption[];
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
