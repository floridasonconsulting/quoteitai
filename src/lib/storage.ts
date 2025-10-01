import { Customer, Item, Quote, CompanySettings } from '@/types';

const STORAGE_KEYS = {
  CUSTOMERS: 'quote-it-customers',
  ITEMS: 'quote-it-items',
  QUOTES: 'quote-it-quotes',
  SETTINGS: 'quote-it-settings',
  THEME: 'quote-it-theme',
} as const;

// Generic storage helpers
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return defaultValue;
  }
};

export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
  }
};

// Customers
export const getCustomers = (): Customer[] => 
  getStorageItem(STORAGE_KEYS.CUSTOMERS, []);

export const saveCustomers = (customers: Customer[]): void => 
  setStorageItem(STORAGE_KEYS.CUSTOMERS, customers);

export const addCustomer = (customer: Customer): void => {
  const customers = getCustomers();
  saveCustomers([...customers, customer]);
};

export const updateCustomer = (id: string, updates: Partial<Customer>): void => {
  const customers = getCustomers();
  const updated = customers.map(c => c.id === id ? { ...c, ...updates } : c);
  saveCustomers(updated);
};

export const deleteCustomer = (id: string): void => {
  const customers = getCustomers();
  saveCustomers(customers.filter(c => c.id !== id));
};

// Items
export const getItems = (): Item[] => 
  getStorageItem(STORAGE_KEYS.ITEMS, []);

export const saveItems = (items: Item[]): void => 
  setStorageItem(STORAGE_KEYS.ITEMS, items);

export const addItem = (item: Item): void => {
  const items = getItems();
  saveItems([...items, item]);
};

export const updateItem = (id: string, updates: Partial<Item>): void => {
  const items = getItems();
  const updated = items.map(i => i.id === id ? { ...i, ...updates } : i);
  saveItems(updated);
};

export const deleteItem = (id: string): void => {
  const items = getItems();
  saveItems(items.filter(i => i.id !== id));
};

// Quotes
export const getQuotes = (): Quote[] => 
  getStorageItem(STORAGE_KEYS.QUOTES, []);

export const saveQuotes = (quotes: Quote[]): void => 
  setStorageItem(STORAGE_KEYS.QUOTES, quotes);

export const addQuote = (quote: Quote): void => {
  const quotes = getQuotes();
  saveQuotes([...quotes, quote]);
};

export const updateQuote = (id: string, updates: Partial<Quote>): void => {
  const quotes = getQuotes();
  const updated = quotes.map(q => q.id === id ? { ...q, ...updates } : q);
  saveQuotes(updated);
};

export const deleteQuote = (id: string): void => {
  const quotes = getQuotes();
  saveQuotes(quotes.filter(q => q.id !== id));
};

// Settings
export const getSettings = (): CompanySettings => 
  getStorageItem(STORAGE_KEYS.SETTINGS, {
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    terms: 'Payment due within 30 days. Thank you for your business!',
  });

export const saveSettings = (settings: CompanySettings): void => 
  setStorageItem(STORAGE_KEYS.SETTINGS, settings);

// Theme
export const getTheme = (): 'light' | 'dark' => 
  getStorageItem(STORAGE_KEYS.THEME, 'light');

export const saveTheme = (theme: 'light' | 'dark'): void => 
  setStorageItem(STORAGE_KEYS.THEME, theme);
