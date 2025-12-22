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
import { withTimeout } from './services/request-pool-service';
import { supabase } from '@/integrations/supabase/client';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';

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

  // 1. Try CacheManager first (now with stale-while-revalidate)
  const cached = await cacheManager.get<CompanySettings>('settings', userId);
  if (cached && (cached.name || cached.email)) {
    console.log('[db-service] ✓ Retrieved settings from CacheManager');
    return cached;
  }

  // 2. Try IndexedDB 
  if (isIndexedDBSupported()) {
    try {
      const indexedDBSettings = await SettingsDB.get(userId);
      if (indexedDBSettings && (indexedDBSettings.name || indexedDBSettings.email)) {
        console.log('[db-service] ✓ Retrieved settings from IndexedDB');
        await cacheManager.set('settings', indexedDBSettings, userId);
        return indexedDBSettings;
      }
    } catch (error) {
      console.warn('[db-service] IndexedDB read failed:', error);
    }
  }

  // 3. Fall back to Supabase
  console.log('[db-service] 🔍 Local settings missing or stale, attempting Supabase fetch...');
  try {
    const { data: dbSettings, error } = await withTimeout(
      Promise.resolve(
        supabase
          .from('company_settings' as any)
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
      ),
      10000
    ) as any;

    if (error) {
      console.error('[db-service] Supabase settings fetch failed:', error);
    } else if (dbSettings) {
      console.log('[db-service] ✓ Retrieved settings from Supabase');

      const mappedSettings: CompanySettings = {
        name: (dbSettings as any).name || '',
        address: (dbSettings as any).address || '',
        city: (dbSettings as any).city || '',
        state: (dbSettings as any).state || '',
        zip: (dbSettings as any).zip || '',
        phone: (dbSettings as any).phone || '',
        email: (dbSettings as any).email || '',
        website: (dbSettings as any).website || '',
        logo: (dbSettings as any).logo || undefined,
        logoDisplayOption: (dbSettings as any).logo_display_option as any || 'both',
        license: (dbSettings as any).license || '',
        insurance: (dbSettings as any).insurance || '',
        terms: (dbSettings as any).terms || '',
        legalTerms: (dbSettings as any).legal_terms || undefined,
        proposalTemplate: (dbSettings as any).proposal_template as any || 'classic',
        proposalTheme: (dbSettings as any).proposal_theme as any || 'modern-corporate',
        industry: (dbSettings as any).industry as any || 'other',
        notifyEmailAccepted: (dbSettings as any).notify_email_accepted ?? true,
        notifyEmailDeclined: (dbSettings as any).notify_email_declined ?? true,
        showProposalImages: (dbSettings as any).show_proposal_images ?? true,
        onboardingCompleted: (dbSettings as any).onboarding_completed ?? false,
        defaultCoverImage: (dbSettings as any).default_cover_image || undefined,
        defaultHeaderImage: (dbSettings as any).default_header_image || undefined,
        visualRules: (dbSettings as any).visual_rules || undefined,
        showFinancing: (dbSettings as any).show_financing ?? false,
        financingText: (dbSettings as any).financing_text || "",
        financingLink: (dbSettings as any).financing_link || "",
        primaryColor: (dbSettings as any).primary_color || undefined,
        accentColor: (dbSettings as any).accent_color || undefined,
      };

      // Restore to local storage to avoid future overhead
      if (isIndexedDBSupported()) {
        SettingsDB.set(userId, mappedSettings).catch(e => console.error('Failed to update IDB during fallback:', e));
      }
      setStorageItem(`settings_${userId}`, mappedSettings);

      return mappedSettings;
    }
  } catch (error) {
    console.error('[db-service] Unexpected error in getSettings fallback:', error);
  }

  const localStorageSettings = storageGetSettings(userId);
  return localStorageSettings;
};

export async function saveSettings(
  userId: string,
  organizationId: string | null,
  settings: CompanySettings,
  queueChange?: (change: SyncChange) => void
): Promise<void> {
  try {
    // Step 1: Store in storage/cache immediately for UI responsiveness
    const cacheKey = `settings-${userId}`;
    await cacheManager.set('settings', settings, userId);

    if (isIndexedDBSupported()) {
      await SettingsDB.set(userId, settings).catch(e => console.error('IDB set failed:', e));
    }
    setStorageItem(`settings_${userId}`, settings);

    console.log('[DB Service] ✓ Settings updated locally');

    // Step 3: ALWAYS attempt Supabase save (even if offline, we'll queue it)
    console.log('[DB Service] Attempting Supabase save...');

    // CRITICAL: Build the database object with proper field mapping
    // NOTE: visual_rules is JSONB, so we pass the object/array directly, let Supabase client handle serialization
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
      legal_terms: settings.legalTerms || null,
      proposal_template: settings.proposalTemplate || 'classic',
      proposal_theme: settings.proposalTheme || 'modern-corporate',
      industry: settings.industry || 'other',
      notify_email_accepted: settings.notifyEmailAccepted ?? true,
      notify_email_declined: settings.notifyEmailDeclined ?? true,
      show_proposal_images: settings.showProposalImages ?? true,
      default_cover_image: settings.defaultCoverImage || null,
      default_header_image: settings.defaultHeaderImage || null,
      visual_rules: settings.visualRules || null,
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
      // Use upsert with a 30s timeout
      const { error } = await withTimeout(
        Promise.resolve(
          supabase
            .from('company_settings' as any)
            .upsert(dbSettings, {
              onConflict: organizationId ? 'organization_id' : 'user_id',
              ignoreDuplicates: false
            })
        ),
        30000
      ) as any;

      if (error) {
        console.error('[DB Service] ❌ Supabase upsert error:', error);

        // Resilience logic for schema mismatches
        if (error.message?.includes("column") || error.code === 'PGRST204') {
          const baseColumns = [
            'user_id', 'name', 'address', 'city', 'state', 'zip', 'phone', 'email',
            'website', 'logo', 'logo_display_option', 'license', 'insurance', 'terms',
            'proposal_template', 'proposal_theme', 'notify_email_accepted',
            'notify_email_declined', 'onboarding_completed', 'updated_at'
          ];
          const resilientSettings: any = {};
          baseColumns.forEach(col => {
            if ((dbSettings as any)[col] !== undefined) resilientSettings[col] = (dbSettings as any)[col];
          });

          await withTimeout(
            Promise.resolve(
              supabase.from('company_settings' as any).upsert(resilientSettings, { onConflict: 'user_id' })
            ),
            10000
          );
        } else {
          throw error;
        }
      }

      console.log('[DB Service] ✓ Settings saved to Supabase');
      dispatchDataRefresh('quotes-changed');
    } else {
      console.log('[DB Service] Offline - queuing for sync');
      if (queueChange) {
        queueChange({
          id: `settings-${userId}`,
          type: 'settings',
          action: 'update',
          data: settings,
          timestamp: Date.now()
        });
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