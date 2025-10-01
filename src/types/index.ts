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
  markup: number;
  markupType: 'percentage' | 'fixed';
  finalPrice: number;
  createdAt: string;
}

export interface QuoteItem {
  itemId: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
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
  notes: string;
  followUpDate?: string;
  sentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo?: string;
  terms: string;
}

export type QuoteAge = 'fresh' | 'warm' | 'aging' | 'stale';

export interface AgingSummary {
  fresh: number;
  warm: number;
  aging: number;
  stale: number;
}
