/**
 * Database Service (Main Entry Point)
 * 
 * This file maintains backward compatibility by re-exporting functions from
 * the new modular service layer. All implementation details have been moved
 * to focused service modules for better maintainability.
 * 
 * Service Modules:
 * - cache-service.ts: Cache management
 * - request-pool-service.ts: Request pooling and deduplication
 * - transformation-utils.ts: Data transformation
 * - customer-service.ts: Customer CRUD operations
 * - item-service.ts: Item CRUD operations
 * - quote-service.ts: Quote CRUD operations
 */

import { supabase } from '@/integrations/supabase/client';
import { CompanySettings, QueueChange } from '@/types';
import { getStorageItem, setStorageItem } from './storage';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';
import { apiTracker } from './api-performance-tracker';

// Re-export cache utilities
export {
  getCachedData,
  setCachedData,
  clearAllCaches,
  clearCache,
  CACHE_KEYS,
} from './services/cache-service';

// Re-export request pool utilities
export {
  executeWithPool,
  clearInFlightRequests,
  withTimeout,
  dedupedRequest,
} from './services/request-pool-service';

// Re-export transformation utilities
export {
  toSnakeCase,
  toCamelCase,
} from './services/transformation-utils';

// Re-export customer service
export {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from './services/customer-service';

// Re-export item service
export {
  getItems,
  addItem,
  updateItem,
  deleteItem,
} from './services/item-service';

// Re-export quote service
export {
  getQuotes,
  addQuote,
  updateQuote,
  deleteQuote,
} from './services/quote-service';

/**
 * Company Settings Management
 * These remain in db-service.ts as they're unique and don't follow the standard CRUD pattern
 */

export const getSettings = async (userId: string | undefined): Promise<CompanySettings> => {
  const defaultSettings: CompanySettings = {
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
    notifyEmailAccepted: true,
    notifyEmailDeclined: true,
    onboardingCompleted: false,
  };

  if (!userId) {
    return getStorageItem<CompanySettings>('quote-it-settings', defaultSettings);
  }

  try {
    const startTime = performance.now();
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    apiTracker.track(
      'company_settings.select',
      'GET',
      performance.now() - startTime,
      error ? 'error' : 'success'
    );

    if (error) throw error;

    if (data) {
      const settings = {
        name: data.name || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        license: data.license || '',
        insurance: data.insurance || '',
        logo: data.logo || '',
        logoDisplayOption: data.logo_display_option || 'both',
        terms: data.terms || 'Payment due within 30 days. Thank you for your business!',
        proposalTemplate: data.proposal_template || 'classic',
        notifyEmailAccepted: data.notify_email_accepted !== false,
        notifyEmailDeclined: data.notify_email_declined !== false,
        onboardingCompleted: data.onboarding_completed || false,
      };
      
      console.log('[DB Service] Retrieved settings from DB:', { 
        proposalTemplate: settings.proposalTemplate, 
        logoDisplayOption: settings.logoDisplayOption,
        notifyEmailAccepted: settings.notifyEmailAccepted,
        notifyEmailDeclined: settings.notifyEmailDeclined
      });
      
      setStorageItem('quote-it-settings', settings);
      return settings;
    }

    return defaultSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return getStorageItem<CompanySettings>('quote-it-settings', defaultSettings);
  }
};

export const saveSettings = async (
  userId: string | undefined,
  settings: CompanySettings,
  queueChange?: (change: QueueChange) => void
): Promise<void> => {
  if (!userId) return;

  try {
    const settingsData = {
      user_id: userId,
      name: settings.name || '',
      address: settings.address || '',
      city: settings.city || '',
      state: settings.state || '',
      zip: settings.zip || '',
      phone: settings.phone || '',
      email: settings.email || '',
      website: settings.website || '',
      license: settings.license || '',
      insurance: settings.insurance || '',
      logo: settings.logo || '',
      logo_display_option: settings.logoDisplayOption || 'both',
      terms: settings.terms || '',
      proposal_template: settings.proposalTemplate || 'classic',
      notify_email_accepted: settings.notifyEmailAccepted !== false,
      notify_email_declined: settings.notifyEmailDeclined !== false,
      // Add onboarding_completed field if it exists in settings
      onboarding_completed: settings.onboardingCompleted || false,
    };

    console.log('[DB Service] Saving settings to DB:', {
      proposalTemplate: settingsData.proposal_template,
      logoDisplayOption: settingsData.logo_display_option,
      notifyEmailAccepted: settingsData.notify_email_accepted,
      notifyEmailDeclined: settingsData.notify_email_declined,
      onboardingCompleted: settingsData.onboarding_completed,
    });

    const startTime = performance.now();
    const { error } = await supabase
      .from('company_settings')
      .upsert(settingsData, { onConflict: 'user_id' });

    apiTracker.track(
      'company_settings.upsert',
      'POST',
      performance.now() - startTime,
      error ? 'error' : 'success'
    );

    if (error) {
      console.error('[DB Service] Error saving settings:', error);
      throw error;
    }
    
    // Store settings in localStorage for immediate access
    // Note: We keep the cache to prevent race conditions during verification
    // The cache will be refreshed on next getSettings() call
    setStorageItem('quote-it-settings', settings);
    
    console.log('[DB Service] Settings saved successfully to database and cached');
  } catch (error) {
    console.error('Error saving settings:', error);
    if (queueChange) {
      queueChange({
        type: 'upsert',
        table: 'company_settings',
        data: settings,
      });
    }
    throw error;
  }
};

/**
 * Data Management Operations
 */

export async function clearDatabaseData(userId: string | undefined): Promise<void> {
  if (!userId) return;

  const { error: customersError } = await supabase
    .from('customers')
    .delete()
    .eq('user_id', userId);

  const { error: itemsError } = await supabase
    .from('items')
    .delete()
    .eq('user_id', userId);

  const { error: quotesError } = await supabase
    .from('quotes')
    .delete()
    .eq('user_id', userId);

  if (customersError || itemsError || quotesError) {
    throw new Error('Failed to clear database data');
  }

  localStorage.removeItem(`customers_${userId}`);
  localStorage.removeItem(`items_${userId}`);
  localStorage.removeItem(`quotes_${userId}`);
}

export async function clearSampleData(userId: string | undefined): Promise<void> {
  if (!userId) return;

  const { error: customersError } = await supabase
    .from('customers')
    .delete()
    .eq('user_id', userId);

  const { error: itemsError } = await supabase
    .from('items')
    .delete()
    .eq('user_id', userId);

  const { error: quotesError } = await supabase
    .from('quotes')
    .delete()
    .eq('user_id', userId);

  if (customersError || itemsError || quotesError) {
    throw new Error('Failed to clear sample data');
  }

  const { CACHE_KEYS } = await import('./services/cache-service');
  localStorage.removeItem(CACHE_KEYS.CUSTOMERS);
  localStorage.removeItem(CACHE_KEYS.ITEMS);
  localStorage.removeItem(CACHE_KEYS.QUOTES);
  
  dispatchDataRefresh('customers-changed');
  dispatchDataRefresh('items-changed');
  dispatchDataRefresh('quotes-changed');
}
