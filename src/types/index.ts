export interface Customer {
  id: string;
  userId: string;  // Required for IndexedDB user_id index
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  contactFirstName?: string;
  contactLastName?: string;
  createdAt: string;
}

export interface Item {
  id: string;
  userId?: string;
  name: string;
  description: string;
  enhancedDescription?: string; // NEW: Rich text description for proposals
  category: string;
  basePrice: number;
  markupType: 'percentage' | 'fixed';
  markup: number;
  finalPrice: number;
  units: string;
  minQuantity?: number; // Default minimum quantity
  imageUrl?: string; // NEW: Product/service image for proposals
  createdAt: string;
}

export interface QuoteItem {
  itemId: string;
  name: string;
  description: string;
  enhancedDescription?: string; // NEW: Rich text description
  category?: string; // For proposal grouping
  quantity: number;
  price: number;
  total: number;
  units?: string;
  imageUrl?: string; // For proposal visuals
}

export interface Quote {
  id: string;
  userId: string;  // Required for IndexedDB user_id index
  quoteNumber: string;
  customerId: string;
  customerName: string;
  title: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  notes?: string;
  executiveSummary?: string;
  sentDate?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  shareToken?: string;
  sharedAt?: string;
  viewedAt?: string;
  showPricing?: boolean; // Control line-item pricing visibility in proposals
  projectDescription?: string; // NEW: For AI visual matching
}

export type QuoteAge = 'fresh' | 'warm' | 'aging' | 'stale';

export interface AgingSummary {
  fresh: number;
  warm: number;
  aging: number;
  stale: number;
}

export interface CompanySettings {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  logo?: string;
  logoDisplayOption?: "logo" | "name" | "both";
  license?: string;
  insurance?: string;
  terms: string;
  proposalTemplate?: "classic" | "modern" | "detailed";
  proposalTheme?: "modern-corporate" | "creative-studio" | "minimalist" | "bold-impact" | "elegant-serif" | "tech-future";
  notifyEmailAccepted?: boolean;
  notifyEmailDeclined?: boolean;
  onboardingCompleted?: boolean;
}

// For offline sync queue
export type ChangeData = (Partial<Customer> | Partial<Item> | Partial<Quote> | Partial<CompanySettings>) & { id?: string };

export type QueueChange = {
  type: 'create' | 'update' | 'delete' | 'upsert';
  table: string;
  data: ChangeData;
};