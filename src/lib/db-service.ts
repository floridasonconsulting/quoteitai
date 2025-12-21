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
export const getSettings = async (userId: string, organizationId: string | null = null): Promise<CompanySettings> => {
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
  organizationId: string | null,
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
      organization_id: organizationId,
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
      show_proposal_images: settings.showProposalImages ?? true,
      default_cover_image: settings.defaultCoverImage || null,
      default_header_image: settings.defaultHeaderImage || null,
      visual_rules: settings.visualRules ? JSON.stringify(settings.visualRules) : null,
      show_financing: settings.showFinancing ?? false,
      financing_text: settings.financingText || null,
      financing_link: settings.financingLink || null,
      primary_color: settings.primaryColor || null,
      accent_color: settings.accentColor || null,
      onboarding_completed: settings.onboardingCompleted ?? false,
      updated_at: new Date().toISOString()
    };

    // DEBUG: Log visual rules specifically
    if (settings.visualRules) {
      console.log('[DB Service] Visual rules being saved:', {
        count: settings.visualRules.length,
        rules: settings.visualRules.map(r => ({
          keyword: r.keyword,
          hasImageUrl: !!r.imageUrl,
          imageUrlPreview: r.imageUrl?.substring(0, 80)
        })),
        stringified: dbSettings.visual_rules?.substring(0, 200)
      });
    }

    console.log('[DB Service] Upserting to Supabase with data:', {
      user_id: dbSettings.user_id,
      name: dbSettings.name,
      email: dbSettings.email,
      termsLength: dbSettings.terms.length,
      hasLogo: !!dbSettings.logo
    });

    if (navigator.onLine) {
      // Use upsert with proper conflict resolution
      let query = supabase.from('company_settings' as any).select('*');

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data: supabaseSettings, error: selectError } = await (query as any).maybeSingle();

      if (selectError) {
        console.error('[DB Service] ❌ Supabase select error:', selectError);
        throw selectError;
      }

      let upsertResult;
      if (supabaseSettings) {
        // Record exists, perform an update
        upsertResult = await (supabase
          .from('company_settings' as any)
          .update(dbSettings)
          .eq(organizationId ? 'organization_id' : 'user_id', organizationId || userId)
          .select()
          .single() as any);
      } else {
        // Record does not exist, perform an insert
        upsertResult = await (supabase
          .from('company_settings' as any)
          .insert(dbSettings)
          .select()
          .single() as any);
      }

      const { data, error } = upsertResult;

      if (error) {
        console.error('[DB Service] ❌ Supabase upsert error:', error);

        // AUTOMATIC RECOVERY: If 'industry' or 'show_proposal_images' column is missing, retry without it
        if (error.message?.includes("industry") || error.message?.includes("show_proposal_images") || error.code === 'PGRST204') {
          console.warn('[DB Service] ⚠️ Industry or ShowImages column missing in database. Retrying save without them...');

          // Create a copy without the industry, show_proposal_images, and visual fields
          const {
            industry,
            show_proposal_images,
            default_cover_image,
            default_header_image,
            visual_rules,
            ...resilientSettings
          } = dbSettings as any;

          const { data: retryData, error: retryError } = await (supabase
            .from('company_settings' as any)
            .upsert(resilientSettings, {
              onConflict: 'user_id',
              ignoreDuplicates: false
            }) as any)
            .select()
            .single();

          if (retryError) {
            console.error('[DB Service] ❌ Resilient retry failed:', retryError);
            throw retryError;
          }

          console.log('[DB Service] ✓ Settings saved successfully (without industry)');
          return;
        }

        console.error('[DB Service] Full Error JSON:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('[DB Service] ✓ Settings saved to Supabase successfully');
      console.log('[DB Service] Supabase returned data:', data ? 'data received' : 'no data');

      // Verify the save by reading back
      const { data: verifyData, error: verifyError } = await (supabase
        .from('company_settings' as any)
        .select('name, email, terms, industry, license, insurance, show_proposal_images, show_financing, financing_text, financing_link')
        .eq(organizationId ? 'organization_id' : 'user_id', organizationId || userId)
        .single() as any);

      if (verifyError) {
        console.error('[DB Service] ❌ Verification failed:', verifyError);
      } else {
        const vData = verifyData as any;
        console.log('[DB Service] ✓ Verified save:', {
          name: vData.name,
          email: vData.email,
          industry: vData.industry,
          showProposalImages: vData.show_proposal_images,
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