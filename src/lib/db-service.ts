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
        console.log('[db-service]   - name:', indexedDBSettings.name);
        console.log('[db-service]   - email:', indexedDBSettings.email);
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
  console.log('[DB Service] Saving settings for user:', userId);
  console.log('[DB Service] Settings data:', settings);
  
  try {
    // Store in memory cache first
    const cacheKey = `settings-${userId}`;
    cacheManager.set(cacheKey, settings);
    console.log('[DB Service] Settings cached successfully');

    // Store in IndexedDB
    try {
      const { default: SettingsDB } = await import('./indexed-db');
      await SettingsDB.set(userId, settings);
      console.log('[DB Service] Settings saved to IndexedDB');
    } catch (indexedDBError) {
      console.error('[DB Service] IndexedDB save failed, falling back to localStorage:', indexedDBError);
      // Fallback to localStorage
      setStorageItem(`settings-${userId}`, settings);
    }

    // Queue for Supabase sync
    if (queueChange) {
      queueChange({
        id: `settings-${userId}`,
        type: 'settings',
        action: 'update',
        data: settings,
        timestamp: Date.now()
      });
      console.log('[DB Service] Settings queued for sync');
    }

    // Also attempt immediate Supabase save if online
    if (navigator.onLine) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase
          .from('company_settings')
          .upsert({
            user_id: userId,
            ...settings,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('[DB Service] Supabase save error:', error);
        } else {
          console.log('[DB Service] Settings saved to Supabase successfully');
        }
      } catch (supabaseError) {
        console.error('[DB Service] Supabase save failed:', supabaseError);
      }
    }

    console.log('[DB Service] Settings save complete');
  } catch (error) {
    console.error('[DB Service] Critical error saving settings:', error);
    throw new Error('Failed to save settings: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
