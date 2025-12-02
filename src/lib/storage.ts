
import { Customer, Item, Quote, CompanySettings } from '@/types';

const STORAGE_KEYS = {
  CUSTOMERS: 'quote-it-customers',
  ITEMS: 'quote-it-items',
  QUOTES: 'quote-it-quotes',
  SETTINGS: 'quote-it-settings',
  THEME: 'quote-it-theme',
  TEMPLATE_PREFERENCE: 'quote-it-template-preference',
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

// Helper to get user-specific storage key
const getUserStorageKey = (baseKey: string, userId?: string): string => {
  if (userId) {
    // Use user-specific key format: customers_${userId}
    const keyMap: Record<string, string> = {
      [STORAGE_KEYS.CUSTOMERS]: 'customers',
      [STORAGE_KEYS.ITEMS]: 'items',
      [STORAGE_KEYS.QUOTES]: 'quotes',
    };
    const prefix = keyMap[baseKey];
    if (prefix) {
      return `${prefix}_${userId}`;
    }
  }
  // Fall back to legacy key format
  return baseKey;
};

// Customers
export const getCustomers = (userId?: string): Customer[] => {
  const key = getUserStorageKey(STORAGE_KEYS.CUSTOMERS, userId);
  const data = getStorageItem(key, []);
  
  // If user-specific key is empty, try legacy key for backward compatibility
  if (userId && data.length === 0) {
    const legacyData = getStorageItem(STORAGE_KEYS.CUSTOMERS, []);
    if (legacyData.length > 0) {
      // Migrate legacy data to user-specific key
      setStorageItem(key, legacyData);
      // Clear legacy data after migration
      localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      return legacyData;
    }
  }
  
  return data;
};

export const saveCustomers = (customers: Customer[], userId?: string): void => {
  const key = getUserStorageKey(STORAGE_KEYS.CUSTOMERS, userId);
  setStorageItem(key, customers);
};

export const addCustomer = (customer: Customer, userId?: string): void => {
  const customers = getCustomers(userId);
  saveCustomers([...customers, customer], userId);
};

export const updateCustomer = (id: string, updates: Partial<Customer>, userId?: string): void => {
  const customers = getCustomers(userId);
  const updated = customers.map(c => c.id === id ? { ...c, ...updates } : c);
  saveCustomers(updated, userId);
};

export const deleteCustomer = (id: string, userId?: string): void => {
  const customers = getCustomers(userId);
  saveCustomers(customers.filter(c => c.id !== id), userId);
};

// Items
export const getItems = (userId?: string): Item[] => {
  const key = getUserStorageKey(STORAGE_KEYS.ITEMS, userId);
  const data = getStorageItem(key, []);
  
  // If user-specific key is empty, try legacy key for backward compatibility
  if (userId && data.length === 0) {
    const legacyData = getStorageItem(STORAGE_KEYS.ITEMS, []);
    if (legacyData.length > 0) {
      // Migrate legacy data to user-specific key
      setStorageItem(key, legacyData);
      // Clear legacy data after migration
      localStorage.removeItem(STORAGE_KEYS.ITEMS);
      return legacyData;
    }
  }
  
  return data;
};

export const saveItems = (items: Item[], userId?: string): void => {
  const key = getUserStorageKey(STORAGE_KEYS.ITEMS, userId);
  setStorageItem(key, items);
};

export const addItem = (item: Item, userId?: string): void => {
  const items = getItems(userId);
  saveItems([...items, item], userId);
};

export const updateItem = (id: string, updates: Partial<Item>, userId?: string): void => {
  const items = getItems(userId);
  const updated = items.map(i => i.id === id ? { ...i, ...updates } : i);
  saveItems(updated, userId);
};

export const deleteItem = (id: string, userId?: string): void => {
  const items = getItems(userId);
  saveItems(items.filter(i => i.id !== id), userId);
};

// Quotes
export const getQuotes = (userId?: string): Quote[] => {
  const key = getUserStorageKey(STORAGE_KEYS.QUOTES, userId);
  const data = getStorageItem(key, []);
  
  // If user-specific key is empty, try legacy key for backward compatibility
  if (userId && data.length === 0) {
    const legacyData = getStorageItem(STORAGE_KEYS.QUOTES, []);
    if (legacyData.length > 0) {
      // Migrate legacy data to user-specific key
      setStorageItem(key, legacyData);
      // Clear legacy data after migration
      localStorage.removeItem(STORAGE_KEYS.QUOTES);
      return legacyData;
    }
  }
  
  return data;
};

export const saveQuotes = (quotes: Quote[], userId?: string): void => {
  const key = getUserStorageKey(STORAGE_KEYS.QUOTES, userId);
  setStorageItem(key, quotes);
};

export const addQuote = (quote: Quote, userId?: string): void => {
  const quotes = getQuotes(userId);
  saveQuotes([...quotes, quote], userId);
};

export const updateQuote = (id: string, updates: Partial<Quote>, userId?: string): void => {
  const quotes = getQuotes(userId);
  const updated = quotes.map(q => q.id === id ? { ...q, ...updates } : q);
  saveQuotes(updated, userId);
};

export const deleteQuote = (id: string, userId?: string): void => {
  const quotes = getQuotes(userId);
  saveQuotes(quotes.filter(q => q.id !== id), userId);
};

// Settings (now supports user-specific storage)
export const getSettings = (userId?: string): CompanySettings => {
  // Try user-specific key first
  if (userId) {
    const userKey = `settings_${userId}`;
    const userSettings = getStorageItem<CompanySettings | null>(userKey, null);
    if (userSettings && (userSettings.name || userSettings.email)) {
      console.log(`[Storage] Retrieved settings from user key: ${userKey}`);
      return userSettings;
    }
  }
  
  // Fall back to global settings key
  const globalSettings = getStorageItem(STORAGE_KEYS.SETTINGS, {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    website: '',
    license: '',
    insurance: '',
    logoDisplayOption: 'both',
    terms: 'Payment due within 30 days. Thank you for your business!',
    proposalTemplate: 'classic',
  });
  console.log('[Storage] Retrieved settings from global key');
  return globalSettings;
};

export const saveSettings = (settings: CompanySettings, userId?: string): void => {
  console.log('[Storage] saveSettings called');
  console.log('[Storage] userId:', userId);
  console.log('[Storage] settings.name:', settings.name);
  console.log('[Storage] settings.email:', settings.email);
  
  // Save to both user-specific key and global key for redundancy
  if (userId) {
    const userKey = `settings_${userId}`;
    setStorageItem(userKey, settings);
    console.log(`[Storage] ✓ Saved settings to user-specific key: ${userKey}`);
    
    // Verify the save
    const verified = localStorage.getItem(userKey);
    if (verified) {
      console.log(`[Storage] ✓ Verified save in localStorage (${verified.length} chars)`);
    } else {
      console.error('[Storage] ✗ Failed to verify save in localStorage');
    }
  }
  
  // Also save to global key for backward compatibility
  setStorageItem(STORAGE_KEYS.SETTINGS, settings);
  console.log('[Storage] ✓ Saved settings to global key');
};

// Theme
export const getTheme = (): 'light' | 'dark' => 
  getStorageItem(STORAGE_KEYS.THEME, 'light');

export const saveTheme = (theme: 'light' | 'dark'): void => 
  setStorageItem(STORAGE_KEYS.THEME, theme);

// Template Preference (isolated from settings)
export const getTemplatePreference = (): string =>
  getStorageItem(STORAGE_KEYS.TEMPLATE_PREFERENCE, 'classic');

export const saveTemplatePreference = (template: string): void =>
  setStorageItem(STORAGE_KEYS.TEMPLATE_PREFERENCE, template);

// Clear All Data
export const clearAllData = (userId?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (userId) {
        // Clear user-specific data
        localStorage.removeItem(`customers_${userId}`);
        localStorage.removeItem(`items_${userId}`);
        localStorage.removeItem(`quotes_${userId}`);
      } else {
        // Clear legacy data
        localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
        localStorage.removeItem(STORAGE_KEYS.ITEMS);
        localStorage.removeItem(STORAGE_KEYS.QUOTES);
      }
      // Note: We preserve SETTINGS and THEME
      
      // Small delay to ensure localStorage operations are flushed
      setTimeout(() => resolve(), 50);
    } catch (error) {
      console.error('Error clearing data:', error);
      reject(error);
    }
  });
};
