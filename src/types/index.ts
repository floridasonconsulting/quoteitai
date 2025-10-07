export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  markupType: 'percentage' | 'fixed';
  markup: number;
  finalPrice: number;
  units: string;
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
  sentDate?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
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
  logoDisplayOption?: 'logo' | 'name' | 'both';
  license?: string;
  insurance?: string;
  terms: string;
  proposalTemplate?: 'classic' | 'modern' | 'detailed';
}
