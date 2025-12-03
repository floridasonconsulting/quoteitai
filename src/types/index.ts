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
  category: string;
  basePrice: number;
  markupType: 'percentage' | 'fixed';
  markup: number;
  finalPrice: number;
  units: string;
  minQuantity: number; // NEW: Default minimum quantity for AI and manual addition
  createdAt: string;
}

export interface QuoteItem {
  itemId: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  units?: string;
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
  proposalTheme?: "modern-corporate" | "creative-studio" | "minimalist" | "bold-impact" | "elegant-serif" | "tech-future"; // Updated with all 6 themes
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
