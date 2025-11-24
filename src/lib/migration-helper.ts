
import { supabase } from "@/integrations/supabase/client";
import {
  getStorageItem,
  setStorageItem,
  getCustomers as getLocalCustomers,
  getItems as getLocalItems,
  getQuotes as getLocalQuotes,
  getSettings as getLocalSettings,
} from "./storage";
import { toSnakeCase } from "./db-service";
import { IndexedDBMigrationService } from "./indexed-db-migration";

const MIGRATION_FLAG_KEY = "data-migrated-to-indexeddb";
const SUPABASE_SYNC_FLAG_KEY = "data-synced-to-supabase";

/**
 * Main migration function that orchestrates the complete migration process
 * Phase 1: localStorage → IndexedDB
 * Phase 2: IndexedDB → Supabase (when online)
 */
export const checkAndMigrateData = async (
  userId: string
): Promise<void> => {
  try {
    console.log("Starting migration check for user:", userId);

    // Phase 1: Migrate localStorage → IndexedDB (one-time migration)
    const indexedDBMigrated = getStorageItem(MIGRATION_FLAG_KEY);
    if (!indexedDBMigrated) {
      console.log("Starting localStorage → IndexedDB migration");
      await migrateLocalStorageToIndexedDB(userId);
      setStorageItem(MIGRATION_FLAG_KEY, "true");
      console.log("localStorage → IndexedDB migration completed");
    }

    // Phase 2: Sync IndexedDB → Supabase (happens every session when online)
    if (navigator.onLine) {
      console.log("Starting IndexedDB → Supabase sync");
      await syncIndexedDBToSupabase(userId);
      console.log("IndexedDB → Supabase sync completed");
    } else {
      console.log("Offline: Skipping Supabase sync, will sync when online");
    }

    console.log("Migration process completed successfully");
  } catch (error) {
    console.error("Error during migration process:", error);
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
  await migrationService.initialize(userId);

  // Check if migration is needed
  const needsMigration = await migrationService.needsMigration();
  if (!needsMigration) {
    console.log("IndexedDB migration not needed or already completed");
    return;
  }

  // Perform the migration
  await migrationService.migrateFromLocalStorage();

  console.log("Successfully migrated data from localStorage to IndexedDB");
}

/**
 * Phase 2: Sync IndexedDB data to Supabase
 * This runs every session to ensure cloud backup is up to date
 */
async function syncIndexedDBToSupabase(userId: string): Promise<void> {
  try {
    const migrationService = IndexedDBMigrationService.getInstance();
    await migrationService.initialize(userId);

    // Get all data from IndexedDB
    const db = migrationService["db"]; // Access private db instance
    if (!db) {
      console.warn("IndexedDB not initialized, skipping Supabase sync");
      return;
    }

    // Sync customers
    const customers = await db.getAllCustomers();
    if (customers.length > 0) {
      const customersToSync = customers.map((customer) =>
        toSnakeCase({ ...customer, user_id: userId })
      );
      const { error: customersError } = await supabase
        .from("customers")
        .upsert(customersToSync, { onConflict: "id" });

      if (customersError) {
        console.error("Error syncing customers to Supabase:", customersError);
      } else {
        console.log(`Synced ${customers.length} customers to Supabase`);
      }
    }

    // Sync items
    const items = await db.getAllItems();
    if (items.length > 0) {
      const itemsToSync = items.map((item) =>
        toSnakeCase({ ...item, user_id: userId })
      );
      const { error: itemsError } = await supabase
        .from("items")
        .upsert(itemsToSync, { onConflict: "id" });

      if (itemsError) {
        console.error("Error syncing items to Supabase:", itemsError);
      } else {
        console.log(`Synced ${items.length} items to Supabase`);
      }
    }

    // Sync quotes
    const quotes = await db.getAllQuotes();
    if (quotes.length > 0) {
      const quotesToSync = quotes.map((quote) =>
        toSnakeCase({ ...quote, user_id: userId })
      );
      const { error: quotesError } = await supabase
        .from("quotes")
        .upsert(quotesToSync, { onConflict: "id" });

      if (quotesError) {
        console.error("Error syncing quotes to Supabase:", quotesError);
      } else {
        console.log(`Synced ${quotes.length} quotes to Supabase`);
      }
    }

    // Sync company settings (stored as metadata in IndexedDB)
    const localSettings = getLocalSettings();
    if (localSettings.name || localSettings.email) {
      const settingsToSync = toSnakeCase({
        user_id: userId,
        ...localSettings,
      });
      const { error: settingsError } = await supabase
        .from("company_settings")
        .upsert(settingsToSync, { onConflict: "user_id" });

      if (settingsError) {
        console.error("Error syncing settings to Supabase:", settingsError);
      } else {
        console.log("Synced company settings to Supabase");
      }
    }

    console.log("All data synced to Supabase successfully");
  } catch (error) {
    console.error("Error during Supabase sync:", error);
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
