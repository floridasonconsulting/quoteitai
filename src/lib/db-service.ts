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

import type { CompanySettings } from '@/types';
import { SettingsDB, isIndexedDBSupported } from './indexed-db';
import { cacheManager } from './cache-manager';
import { setStorageItem } from './storage';
import { supabase } from '@/integrations/supabase/client';

// Re-export everything from the specialized services
export * from './services/quote-service';
export * from './services/customer-service';
export * from './services/item-service';

// Re-export the clearInFlightRequests from the request pool service
export { clearInFlightRequests } from './services/request-pool-service';

// Import the storage getSettings with an alias
import { getSettings as storageGetSettings } from './storage';

// Import the specific function with an alias to avoid naming conflicts
import { saveSettings as storageSaveSettings } from './storage';

// Add SyncChange type definition
interface SyncChange {
  id: string;
  type: string;
  action: string;
  data: unknown;
  timestamp: number;
}

// Wrap getSettings to check IndexedDB first (async for proper data retrieval)
export const getSettings = async (userId: string): Promise<CompanySettings> => {
  console.log('[db-service] getSettings called with userId:', userId);

  // Try IndexedDB first if supported
  if (isIndexedDBSupported()) {
    try {
      const indexedDBSettings = await SettingsDB.get(userId);
      if (indexedDBSettings && (indexedDBSettings.name || indexedDBSettings.email)) {
        console.log('[db-service] ✓ Retrieved settings from IndexedDB');
        return indexedDBSettings;
      }
    } catch (error) {
      console.warn('[db-service] IndexedDB read failed, falling back to localStorage:', error);
    }
  }

  // Fall back to localStorage
  const localStorageSettings = storageGetSettings(userId);
  console.log('[db-service] ✓ Retrieved settings from localStorage');
  return localStorageSettings;
};

export async function saveSettings(
  userId: string,
  settings: CompanySettings,
  queueChange?: (change: SyncChange) => void
): Promise<void> {
  console.log('[DB Service] ========== SAVING SETTINGS ==========');
  console.log('[DB Service] User ID:', userId);
  console.log('[DB Service] Settings data:', {
    name: settings.name,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    hasLogo: !!settings.logo,
    terms: settings.terms?.substring(0, 50) + '...',
    proposalTheme: settings.proposalTheme
  });

  try {
    // Step 1: Store in memory cache first
    const cacheKey = `settings-${userId}`;
    await cacheManager.set(cacheKey, settings);
    console.log('[DB Service] ✓ Settings cached in memory');

    // Step 2: Store in IndexedDB
    if (isIndexedDBSupported()) {
      try {
        await SettingsDB.set(userId, settings);
        console.log('[DB Service] ✓ Settings saved to IndexedDB');
      } catch (indexedDBError) {
        console.error('[DB Service] IndexedDB save failed:', indexedDBError);
        // Fallback to localStorage
        setStorageItem(`settings-${userId}`, settings);
        console.log('[DB Service] ✓ Settings saved to localStorage (fallback)');
      }
    } else {
      // No IndexedDB support, use localStorage
      setStorageItem(`settings-${userId}`, settings);
      console.log('[DB Service] ✓ Settings saved to localStorage');
    }

    // Step 3: ALWAYS attempt Supabase save (even if offline, we'll queue it)
    console.log('[DB Service] Attempting Supabase save...');

    // CRITICAL: Build the database object with proper field mapping
    const dbSettings = {
      user_id: userId,
      name: settings.name || '',
      address: settings.address || '',
      city: settings.city || '',
      state: settings.state || '',
      zip: settings.zip || '',
      phone: settings.phone || '',
      email: settings.email || '',
      website: settings.website || '',
      logo: settings.logo || null,
      logo_display_option: settings.logoDisplayOption || 'both',
      license: settings.license || '',
      insurance: settings.insurance || '',
      terms: settings.terms || '',
      proposal_template: settings.proposalTemplate || 'classic',
      proposal_theme: settings.proposalTheme || 'modern-corporate',
      industry: settings.industry || 'other',
      notify_email_accepted: settings.notifyEmailAccepted ?? true,
      notify_email_declined: settings.notifyEmailDeclined ?? true,
      onboarding_completed: settings.onboardingCompleted ?? false,
      updated_at: new Date().toISOString()
    };

    console.log('[DB Service] Upserting to Supabase with data:', {
      user_id: dbSettings.user_id,
      name: dbSettings.name,
      email: dbSettings.email,
      termsLength: dbSettings.terms.length,
      hasLogo: !!dbSettings.logo
    });

    if (navigator.onLine) {
      // Use upsert with proper conflict resolution
      const { data, error } = await supabase
        .from('company_settings')
        .upsert(dbSettings, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('[DB Service] ❌ Supabase upsert error:', error);
        console.error('[DB Service] Full Error JSON:', JSON.stringify(error, null, 2));
        console.error('[DB Service] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('[DB Service] ✓ Settings saved to Supabase successfully');
      console.log('[DB Service] Supabase returned data:', data ? 'data received' : 'no data');

      // Verify the save by reading back
      const { data: verifyData, error: verifyError } = await supabase
        .from('company_settings')
        .select('name, email, terms, industry, license, insurance')
        .eq('user_id', userId)
        .single();

      if (verifyError) {
        console.error('[DB Service] ❌ Verification failed:', verifyError);
      } else {
        const vData = verifyData as any;
        console.log('[DB Service] ✓ Verified save:', {
          name: vData.name,
          email: vData.email,
          industry: vData.industry,
          termsLength: vData.terms?.length || 0
        });
      }
    } else {
      console.log('[DB Service] Offline - queuing for sync');
      // Offline: queue for sync
      if (queueChange) {
        queueChange({
          id: `settings-${userId}`,
          type: 'settings',
          action: 'update',
          data: settings,
          timestamp: Date.now()
        });
        console.log('[DB Service] ✓ Settings queued for sync');
      }
    }

    console.log('[DB Service] ========== SETTINGS SAVE COMPLETE ==========');
  } catch (error) {
    console.error('[DB Service] ========== CRITICAL ERROR SAVING SETTINGS ==========');
    console.error('[DB Service] Error:', error);

    // RE-THROW error so UI knows save failed
    throw error;
  }
}

// Re-export clearAllData from storage as clearDatabaseData for backward compatibility
export { clearAllData as clearDatabaseData } from './storage';

// Placeholder for clearSampleData - this function doesn't exist yet but is imported
// TODO: Implement clearSampleData in sample-data.ts and export it here
export const clearSampleData = async (userId?: string): Promise<void> => {
  console.log('[db-service] clearSampleData called for user:', userId);
  // For now, just log that this was called
  // The actual implementation should be in sample-data.ts
};