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

// Re-export everything from the specialized services
export * from './services/quote-service';
export * from './services/customer-service';
export * from './services/item-service';
    
// Re-export the clearInFlightRequests from the request pool service
export { clearInFlightRequests } from './services/request-pool-service';

// Re-export getSettings from storage for backward compatibility
export { getSettings } from './storage';

// Import the specific function with an alias to avoid naming conflicts
import { saveSettings as storageSaveSettings } from './storage';

// Wrap saveSettings to accept userId and make it async for proper IndexedDB handling
export const saveSettings = async (userId: string, settings: CompanySettings): Promise<void> => {
  console.log('[db-service] saveSettings called with userId:', userId);
  console.log('[db-service] Settings to save:', JSON.stringify(settings).substring(0, 200));
  
  // Save to localStorage first (synchronous, immediate)
  storageSaveSettings(settings, userId);
  console.log('[db-service] ✓ Saved to localStorage');
  
  // Save to IndexedDB if supported (async, more reliable)
  if (isIndexedDBSupported()) {
    try {
      await SettingsDB.set(userId, settings);
      console.log('[db-service] ✓ Saved to IndexedDB');
    } catch (error) {
      console.error('[db-service] ✗ IndexedDB save failed:', error);
      // Don't throw - localStorage save succeeded
    }
  }
  
  // Add small delay to ensure storage operations are flushed
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('[db-service] ✓ saveSettings completed');
};

// Re-export clearAllData from storage as clearDatabaseData for backward compatibility
export { clearAllData as clearDatabaseData } from './storage';

// Placeholder for clearSampleData - this function doesn't exist yet but is imported
// TODO: Implement clearSampleData in sample-data.ts and export it here
export const clearSampleData = async (userId?: string): Promise<void> => {
  console.log('[db-service] clearSampleData called for user:', userId);
  // For now, just log that this was called
  // The actual implementation should be in sample-data.ts
};
