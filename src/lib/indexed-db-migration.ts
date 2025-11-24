/**
 * IndexedDB Migration Utilities
 * Handles migration from localStorage to IndexedDB with rollback support
 * 
 * Migration Flow:
 * 1. Check if IndexedDB is supported
 * 2. Check if migration is needed (localStorage has data, IndexedDB is empty)
 * 3. Backup localStorage data
 * 4. Migrate each entity type (customers, items, quotes, settings)
 * 5. Verify migration success
 * 6. Set migration flag
 * 7. Optionally clear localStorage (keep as backup initially)
 */

import { Customer, Item, Quote, CompanySettings } from "@/types";
import { CustomerDB, ItemDB, QuoteDB, SettingsDB, STORES, getStorageStats, isIndexedDBSupported } from "./indexed-db";

// Migration status keys
const MIGRATION_STATUS_KEY = "indexeddb_migration_status";
const MIGRATION_BACKUP_KEY = "indexeddb_migration_backup";

export interface MigrationStatus {
  completed: boolean;
  timestamp: string;
  version: number;
  customersCount: number;
  itemsCount: number;
  quotesCount: number;
  settingsMigrated: boolean;
  errors: string[];
}

export interface MigrationResult {
  success: boolean;
  status: MigrationStatus;
  message: string;
}

/**
 * Check if migration has already been completed
 */
export function isMigrationCompleted(): boolean {
  try {
    const status = localStorage.getItem(MIGRATION_STATUS_KEY);
    if (!status) return false;

    const parsed: MigrationStatus = JSON.parse(status);
    return parsed.completed === true;
  } catch (error) {
    console.error("[Migration] Error checking migration status:", error);
    return false;
  }
}

/**
 * Get current migration status
 */
export function getMigrationStatus(): MigrationStatus | null {
  try {
    const status = localStorage.getItem(MIGRATION_STATUS_KEY);
    if (!status) return null;

    return JSON.parse(status);
  } catch (error) {
    console.error("[Migration] Error getting migration status:", error);
    return null;
  }
}

/**
 * Set migration status
 */
function setMigrationStatus(status: MigrationStatus): void {
  try {
    localStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error("[Migration] Error setting migration status:", error);
  }
}

/**
 * Check if localStorage has data that needs migration
 */
function hasLocalStorageData(userId: string): boolean {
  try {
    const customers = localStorage.getItem(`customers_${userId}`);
    const items = localStorage.getItem(`items_${userId}`);
    const quotes = localStorage.getItem(`quotes_${userId}`);
    const settings = localStorage.getItem("quote-it-settings");

    return !!(customers || items || quotes || settings);
  } catch (error) {
    console.error("[Migration] Error checking localStorage data:", error);
    return false;
  }
}

/**
 * Create a backup of localStorage data before migration
 */
function createBackup(userId: string): void {
  try {
    const backup = {
      customers: localStorage.getItem(`customers_${userId}`),
      items: localStorage.getItem(`items_${userId}`),
      quotes: localStorage.getItem(`quotes_${userId}`),
      settings: localStorage.getItem("quote-it-settings"),
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify(backup));
    console.log("[Migration] Backup created successfully");
  } catch (error) {
    console.error("[Migration] Failed to create backup:", error);
    throw new Error("Failed to create migration backup");
  }
}

/**
 * Restore from backup (rollback)
 */
function restoreFromBackup(userId: string): boolean {
  try {
    const backup = localStorage.getItem(MIGRATION_BACKUP_KEY);
    if (!backup) {
      console.error("[Migration] No backup found for rollback");
      return false;
    }

    const parsed = JSON.parse(backup);

    if (parsed.customers) {
      localStorage.setItem(`customers_${userId}`, parsed.customers);
    }
    if (parsed.items) {
      localStorage.setItem(`items_${userId}`, parsed.items);
    }
    if (parsed.quotes) {
      localStorage.setItem(`quotes_${userId}`, parsed.quotes);
    }
    if (parsed.settings) {
      localStorage.setItem("quote-it-settings", parsed.settings);
    }

    console.log("[Migration] Rollback completed successfully");
    return true;
  } catch (error) {
    console.error("[Migration] Rollback failed:", error);
    return false;
  }
}

/**
 * Migrate customers from localStorage to IndexedDB
 */
async function migrateCustomers(userId: string): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    const stored = localStorage.getItem(`customers_${userId}`);
    if (!stored) {
      console.log("[Migration] No customers to migrate");
      return { count: 0, errors };
    }

    const customers: Customer[] = JSON.parse(stored);
    console.log(`[Migration] Migrating ${customers.length} customers...`);

    for (const customer of customers) {
      try {
        // Add user_id if not present
        const customerWithUser = { ...customer, user_id: userId };
        await CustomerDB.add(customerWithUser as never);
        count++;
      } catch (error) {
        const errorMsg = `Failed to migrate customer ${customer.id}: ${error}`;
        console.error(`[Migration] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`[Migration] Successfully migrated ${count}/${customers.length} customers`);
    return { count, errors };
  } catch (error) {
    const errorMsg = `Fatal error migrating customers: ${error}`;
    console.error(`[Migration] ${errorMsg}`);
    errors.push(errorMsg);
    return { count, errors };
  }
}

/**
 * Migrate items from localStorage to IndexedDB
 */
async function migrateItems(userId: string): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    const stored = localStorage.getItem(`items_${userId}`);
    if (!stored) {
      console.log("[Migration] No items to migrate");
      return { count: 0, errors };
    }

    const items: Item[] = JSON.parse(stored);
    console.log(`[Migration] Migrating ${items.length} items...`);

    for (const item of items) {
      try {
        // Add user_id if not present
        const itemWithUser = { ...item, user_id: userId };
        await ItemDB.add(itemWithUser as never);
        count++;
      } catch (error) {
        const errorMsg = `Failed to migrate item ${item.id}: ${error}`;
        console.error(`[Migration] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`[Migration] Successfully migrated ${count}/${items.length} items`);
    return { count, errors };
  } catch (error) {
    const errorMsg = `Fatal error migrating items: ${error}`;
    console.error(`[Migration] ${errorMsg}`);
    errors.push(errorMsg);
    return { count, errors };
  }
}

/**
 * Migrate quotes from localStorage to IndexedDB
 */
async function migrateQuotes(userId: string): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    const stored = localStorage.getItem(`quotes_${userId}`);
    if (!stored) {
      console.log("[Migration] No quotes to migrate");
      return { count: 0, errors };
    }

    const quotes: Quote[] = JSON.parse(stored);
    console.log(`[Migration] Migrating ${quotes.length} quotes...`);

    for (const quote of quotes) {
      try {
        // Add user_id if not present
        const quoteWithUser = { ...quote, user_id: userId };
        await QuoteDB.add(quoteWithUser as never);
        count++;
      } catch (error) {
        const errorMsg = `Failed to migrate quote ${quote.id}: ${error}`;
        console.error(`[Migration] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`[Migration] Successfully migrated ${count}/${quotes.length} quotes`);
    return { count, errors };
  } catch (error) {
    const errorMsg = `Fatal error migrating quotes: ${error}`;
    console.error(`[Migration] ${errorMsg}`);
    errors.push(errorMsg);
    return { count, errors };
  }
}

/**
 * Migrate company settings from localStorage to IndexedDB
 */
async function migrateSettings(userId: string): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const stored = localStorage.getItem("quote-it-settings");
    if (!stored) {
      console.log("[Migration] No settings to migrate");
      return { success: false, errors };
    }

    const settings: CompanySettings = JSON.parse(stored);
    console.log("[Migration] Migrating company settings...");

    try {
      await SettingsDB.set(userId, settings);
      console.log("[Migration] Successfully migrated settings");
      return { success: true, errors };
    } catch (error) {
      const errorMsg = `Failed to migrate settings: ${error}`;
      console.error(`[Migration] ${errorMsg}`);
      errors.push(errorMsg);
      return { success: false, errors };
    }
  } catch (error) {
    const errorMsg = `Fatal error migrating settings: ${error}`;
    console.error(`[Migration] ${errorMsg}`);
    errors.push(errorMsg);
    return { success: false, errors };
  }
}

/**
 * Verify migration success by comparing counts
 */
async function verifyMigration(
  userId: string,
  expectedCounts: {
    customers: number;
    items: number;
    quotes: number;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const [customers, items, quotes] = await Promise.all([
      CustomerDB.getAll(userId),
      ItemDB.getAll(userId),
      QuoteDB.getAll(userId),
    ]);

    const actualCounts = {
      customers: customers.length,
      items: items.length,
      quotes: quotes.length,
    };

    const matches =
      actualCounts.customers === expectedCounts.customers &&
      actualCounts.items === expectedCounts.items &&
      actualCounts.quotes === expectedCounts.quotes;

    if (matches) {
      return {
        success: true,
        message: `Verification passed: ${actualCounts.customers} customers, ${actualCounts.items} items, ${actualCounts.quotes} quotes`,
      };
    } else {
      return {
        success: false,
        message: `Verification failed: Expected ${expectedCounts.customers}/${expectedCounts.items}/${expectedCounts.quotes}, got ${actualCounts.customers}/${actualCounts.items}/${actualCounts.quotes}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Verification error: ${error}`,
    };
  }
}

/**
 * Main migration function
 * @param userId - User ID for migration
 * @param options - Migration options
 * @returns Migration result with status
 */
export async function migrateToIndexedDB(
  userId: string,
  options: {
    skipIfCompleted?: boolean;
    clearLocalStorageAfter?: boolean;
    timeoutMs?: number;
  } = {}
): Promise<MigrationResult> {
  const {
    skipIfCompleted = true,
    clearLocalStorageAfter = false,
    timeoutMs = 30000,
  } = options;

  console.log("[Migration] ========== STARTING INDEXEDDB MIGRATION ==========");
  console.log("[Migration] User ID:", userId);
  console.log("[Migration] Options:", options);

  // Check if already completed
  if (skipIfCompleted && isMigrationCompleted()) {
    const status = getMigrationStatus();
    console.log("[Migration] Migration already completed, skipping");
    return {
      success: true,
      status: status!,
      message: "Migration already completed",
    };
  }

  // Check IndexedDB support
  if (!isIndexedDBSupported()) {
    const errorMsg = "IndexedDB not supported in this browser";
    console.error(`[Migration] ${errorMsg}`);
    return {
      success: false,
      status: {
        completed: false,
        timestamp: new Date().toISOString(),
        version: 1,
        customersCount: 0,
        itemsCount: 0,
        quotesCount: 0,
        settingsMigrated: false,
        errors: [errorMsg],
      },
      message: errorMsg,
    };
  }

  // Check if there's data to migrate
  if (!hasLocalStorageData(userId)) {
    console.log("[Migration] No localStorage data to migrate");
    const status: MigrationStatus = {
      completed: true,
      timestamp: new Date().toISOString(),
      version: 1,
      customersCount: 0,
      itemsCount: 0,
      quotesCount: 0,
      settingsMigrated: false,
      errors: [],
    };
    setMigrationStatus(status);
    return {
      success: true,
      status,
      message: "No data to migrate",
    };
  }

  // Create backup before migration
  try {
    createBackup(userId);
  } catch (error) {
    const errorMsg = `Failed to create backup: ${error}`;
    console.error(`[Migration] ${errorMsg}`);
    return {
      success: false,
      status: {
        completed: false,
        timestamp: new Date().toISOString(),
        version: 1,
        customersCount: 0,
        itemsCount: 0,
        quotesCount: 0,
        settingsMigrated: false,
        errors: [errorMsg],
      },
      message: errorMsg,
    };
  }

  // Set timeout for migration
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Migration timeout")), timeoutMs);
  });

  try {
    // Perform migration with timeout
    const migrationResult = await Promise.race([
      (async () => {
        const allErrors: string[] = [];

        // Migrate customers
        console.log("[Migration] Step 1/4: Migrating customers...");
        const customersResult = await migrateCustomers(userId);
        allErrors.push(...customersResult.errors);

        // Migrate items
        console.log("[Migration] Step 2/4: Migrating items...");
        const itemsResult = await migrateItems(userId);
        allErrors.push(...itemsResult.errors);

        // Migrate quotes
        console.log("[Migration] Step 3/4: Migrating quotes...");
        const quotesResult = await migrateQuotes(userId);
        allErrors.push(...quotesResult.errors);

        // Migrate settings
        console.log("[Migration] Step 4/4: Migrating settings...");
        const settingsResult = await migrateSettings(userId);
        allErrors.push(...settingsResult.errors);

        // Verify migration
        console.log("[Migration] Verifying migration...");
        const verification = await verifyMigration(userId, {
          customers: customersResult.count,
          items: itemsResult.count,
          quotes: quotesResult.count,
        });

        if (!verification.success) {
          throw new Error(verification.message);
        }

        console.log(`[Migration] ${verification.message}`);

        // Get storage stats
        const stats = await getStorageStats();
        console.log("[Migration] Storage stats:", stats);

        // Create migration status
        const status: MigrationStatus = {
          completed: true,
          timestamp: new Date().toISOString(),
          version: 1,
          customersCount: customersResult.count,
          itemsCount: itemsResult.count,
          quotesCount: quotesResult.count,
          settingsMigrated: settingsResult.success,
          errors: allErrors,
        };

        // Save migration status
        setMigrationStatus(status);

        // Optionally clear localStorage
        if (clearLocalStorageAfter && allErrors.length === 0) {
          console.log("[Migration] Clearing localStorage after successful migration...");
          localStorage.removeItem(`customers_${userId}`);
          localStorage.removeItem(`items_${userId}`);
          localStorage.removeItem(`quotes_${userId}`);
          // Keep settings for now as fallback
          console.log("[Migration] localStorage cleared (kept settings as backup)");
        }

        console.log("[Migration] ========== MIGRATION COMPLETED SUCCESSFULLY ==========");

        return {
          success: true,
          status,
          message: `Successfully migrated ${status.customersCount} customers, ${status.itemsCount} items, ${status.quotesCount} quotes${
            allErrors.length > 0 ? ` (${allErrors.length} errors)` : ""
          }`,
        };
      })(),
      timeoutPromise,
    ]);

    return migrationResult;
  } catch (error) {
    console.error("[Migration] ========== MIGRATION FAILED ==========");
    console.error("[Migration] Error:", error);

    // Attempt rollback
    console.log("[Migration] Attempting rollback...");
    const rollbackSuccess = restoreFromBackup(userId);

    const status: MigrationStatus = {
      completed: false,
      timestamp: new Date().toISOString(),
      version: 1,
      customersCount: 0,
      itemsCount: 0,
      quotesCount: 0,
      settingsMigrated: false,
      errors: [
        `Migration failed: ${error}`,
        rollbackSuccess
          ? "Rollback successful - localStorage data restored"
          : "Rollback failed - check backup",
      ],
    };

    setMigrationStatus(status);

    return {
      success: false,
      status,
      message: `Migration failed: ${error}`,
    };
  }
}

/**
 * Clear migration status and backup (for testing/debugging)
 */
export function clearMigrationData(): void {
  try {
    localStorage.removeItem(MIGRATION_STATUS_KEY);
    localStorage.removeItem(MIGRATION_BACKUP_KEY);
    console.log("[Migration] Migration data cleared");
  } catch (error) {
    console.error("[Migration] Error clearing migration data:", error);
  }
}

