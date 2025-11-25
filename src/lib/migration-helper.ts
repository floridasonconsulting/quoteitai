import { supabase } from "@/integrations/supabase/client";
import {
  getStorageItem,
  setStorageItem,
  getSettings as getLocalSettings,
} from "./storage";
import { toSnakeCase } from "./services/transformation-utils";
import { IndexedDBMigrationService } from "./indexed-db-migration";
import { CustomerDB, ItemDB, QuoteDB, SettingsDB } from "./indexed-db";

const MIGRATION_FLAG_KEY = "data-migrated-to-indexeddb";

/**
 * Main migration function that orchestrates the complete migration process
 * Phase 1: localStorage → IndexedDB
 * Phase 2: IndexedDB → Supabase (when online)
 */
export const checkAndMigrateData = async (
  userId: string
): Promise<void> => {
  try {
    console.log("[MigrationHelper] Starting migration check for user:", userId);

    // Phase 1: Migrate localStorage → IndexedDB (one-time migration)
    const indexedDBMigrated = getStorageItem(MIGRATION_FLAG_KEY);
    if (!indexedDBMigrated) {
      console.log("[MigrationHelper] Starting localStorage → IndexedDB migration");
      await migrateLocalStorageToIndexedDB(userId);
      setStorageItem(MIGRATION_FLAG_KEY, "true");
      console.log("[MigrationHelper] localStorage → IndexedDB migration completed");
    }

    // Phase 2: Sync IndexedDB → Supabase (happens every session when online)
    if (navigator.onLine) {
      console.log("[MigrationHelper] Starting IndexedDB → Supabase sync");
      await syncIndexedDBToSupabase(userId);
      console.log("[MigrationHelper] IndexedDB → Supabase sync completed");
    } else {
      console.log("[MigrationHelper] Offline: Skipping Supabase sync, will sync when online");
    }

    console.log("[MigrationHelper] Migration process completed successfully");
  } catch (error) {
    console.error("[MigrationHelper] Error during migration process:", error);
    // Don't throw - allow app to continue even if migration fails
  }
};

/**
 * Phase 1: Migrate data from localStorage to IndexedDB
 */
async function migrateLocalStorageToIndexedDB(
  userId: string
): Promise<void> {
  const migrationService = IndexedDBMigrationService.getInstance();
  migrationService.initialize(userId);

  // Check if migration is needed
  const needsMigration = await migrationService.needsMigration();
  if (!needsMigration) {
    console.log("[MigrationHelper] IndexedDB migration not needed or already completed");
    return;
  }

  // Perform the migration
  const result = await migrationService.migrateFromLocalStorage();
  
  if (!result.success) {
    console.error("[MigrationHelper] Migration failed:", result.message);
    throw new Error(result.message);
  }

  console.log("[MigrationHelper] Successfully migrated data from localStorage to IndexedDB");
}

/**
 * Phase 2: Sync IndexedDB data to Supabase
 * This runs every session to ensure cloud backup is up to date
 */
async function syncIndexedDBToSupabase(userId: string): Promise<void> {
  try {
    console.log("[MigrationHelper] Starting Supabase sync for user:", userId);

    // Sync customers
    const customers = await CustomerDB.getAll(userId);
    if (customers.length > 0) {
      console.log(`[MigrationHelper] Syncing ${customers.length} customers to Supabase`);
      const customersToSync = customers.map((customer) =>
        toSnakeCase({ ...customer, user_id: userId })
      );
      const { error: customersError } = await supabase
        .from("customers")
        .upsert(customersToSync, { onConflict: "id" });

      if (customersError) {
        console.error("[MigrationHelper] Error syncing customers to Supabase:", customersError);
      } else {
        console.log(`[MigrationHelper] ✅ Synced ${customers.length} customers to Supabase`);
      }
    }

    // Sync items
    const items = await ItemDB.getAll(userId);
    if (items.length > 0) {
      console.log(`[MigrationHelper] Syncing ${items.length} items to Supabase`);
      const itemsToSync = items.map((item) =>
        toSnakeCase({ ...item, user_id: userId })
      );
      const { error: itemsError } = await supabase
        .from("items")
        .upsert(itemsToSync, { onConflict: "id" });

      if (itemsError) {
        console.error("[MigrationHelper] Error syncing items to Supabase:", itemsError);
      } else {
        console.log(`[MigrationHelper] ✅ Synced ${items.length} items to Supabase`);
      }
    }

    // Sync quotes
    const quotes = await QuoteDB.getAll(userId);
    if (quotes.length > 0) {
      console.log(`[MigrationHelper] Syncing ${quotes.length} quotes to Supabase`);
      const quotesToSync = quotes.map((quote) =>
        toSnakeCase({ ...quote, user_id: userId })
      );
      const { error: quotesError } = await supabase
        .from("quotes")
        .upsert(quotesToSync, { onConflict: "id" });

      if (quotesError) {
        console.error("[MigrationHelper] Error syncing quotes to Supabase:", quotesError);
      } else {
        console.log(`[MigrationHelper] ✅ Synced ${quotes.length} quotes to Supabase`);
      }
    }

    // Sync company settings
    const settings = await SettingsDB.get(userId);
    if (settings && (settings.name || settings.email)) {
      console.log("[MigrationHelper] Syncing company settings to Supabase");
      const settingsToSync = toSnakeCase({
        user_id: userId,
        ...settings,
      });
      const { error: settingsError } = await supabase
        .from("company_settings")
        .upsert(settingsToSync, { onConflict: "user_id" });

      if (settingsError) {
        console.error("[MigrationHelper] Error syncing settings to Supabase:", settingsError);
      } else {
        console.log("[MigrationHelper] ✅ Synced company settings to Supabase");
      }
    }

    console.log("[MigrationHelper] ✅ All data synced to Supabase successfully");
  } catch (error) {
    console.error("[MigrationHelper] Error during Supabase sync:", error);
    // Don't throw - allow app to continue offline
  }
}

/**
 * Legacy function for backward compatibility
 * Now delegates to the new migration system
 */
export const migrateToSupabase = async (userId: string): Promise<void> => {
  return checkAndMigrateData(userId);
};
