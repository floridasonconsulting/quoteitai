
import { Customer, Item, Quote, CompanySettings } from "@/types";
import { CustomerDB, ItemDB, QuoteDB, SettingsDB, isIndexedDBSupported, getStorageStats } from "./indexed-db";
import { getCustomers, getItems, getQuotes, getSettings } from "./storage";

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

export class IndexedDBMigrationService {
  private static instance: IndexedDBMigrationService;
  private userId: string = "";

  private constructor() {}

  public static getInstance(): IndexedDBMigrationService {
    if (!IndexedDBMigrationService.instance) {
      IndexedDBMigrationService.instance = new IndexedDBMigrationService();
    }
    return IndexedDBMigrationService.instance;
  }

  public initialize(userId: string): void {
    this.userId = userId;
  }

  public async needsMigration(): Promise<boolean> {
    if (!isIndexedDBSupported()) {
      return false;
    }

    const status = this.getMigrationStatus();
    if (status?.completed) {
      return false;
    }
    
    // Check if there's any data in localStorage that needs to be migrated.
    const localCustomers = getCustomers(this.userId);
    const localItems = getItems(this.userId);
    const localQuotes = getQuotes(this.userId);
    const localSettings = getSettings();

    const hasLocalData = localCustomers.length > 0 || localItems.length > 0 || localQuotes.length > 0 || !!localSettings.name;
    if (!hasLocalData) {
        return false;
    }

    // Check if IndexedDB is empty
    const stats = await getStorageStats(this.userId);
    const isIDBEmpty = stats.customers.count === 0 && stats.items.count === 0 && stats.quotes.count === 0;

    return hasLocalData && isIDBEmpty;
  }

  public async migrateFromLocalStorage(): Promise<MigrationResult> {
    console.log("[Migration] ========== STARTING INDEXEDDB MIGRATION ==========");
    
    if (!this.userId) {
        throw new Error("Migration service not initialized with a user ID.");
    }

    if (!isIndexedDBSupported()) {
      const errorMsg = "IndexedDB not supported in this browser";
      console.error(`[Migration] ${errorMsg}`);
      return this.createFailureResult(errorMsg);
    }
    
    this.createBackup();

    try {
      const allErrors: string[] = [];

      const customersResult = await this.migrateCustomers();
      allErrors.push(...customersResult.errors);

      const itemsResult = await this.migrateItems();
      allErrors.push(...itemsResult.errors);

      const quotesResult = await this.migrateQuotes();
      allErrors.push(...quotesResult.errors);
      
      const settingsResult = await this.migrateSettings();
      allErrors.push(...settingsResult.errors);

      const verification = await this.verifyMigration({
        customers: customersResult.count,
        items: itemsResult.count,
        quotes: quotesResult.count,
      });

      if (!verification.success) {
        throw new Error(verification.message);
      }

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

      this.setMigrationStatus(status);
      console.log("[Migration] ========== MIGRATION COMPLETED SUCCESSFULLY ==========");
      return {
        success: true,
        status,
        message: "Migration successful.",
      };

    } catch (error: unknown) {
      console.error("[Migration] ========== MIGRATION FAILED ==========");
      console.error("[Migration] Error:", error);
      this.restoreFromBackup();
      const message = error instanceof Error ? error.message : String(error);
      return this.createFailureResult(`Migration failed: ${message}`, true);
    }
  }

  private createFailureResult(errorMsg: string, rollbackAttempted: boolean = false): MigrationResult {
      const errors = [errorMsg];
      if (rollbackAttempted) {
          errors.push("Rollback attempted from backup.");
      }
      const status: MigrationStatus = {
        completed: false,
        timestamp: new Date().toISOString(),
        version: 1,
        customersCount: 0,
        itemsCount: 0,
        quotesCount: 0,
        settingsMigrated: false,
        errors: errors,
      };
      this.setMigrationStatus(status);
      return {
        success: false,
        status,
        message: errorMsg,
      };
  }

  private getMigrationStatus(): MigrationStatus | null {
    try {
      const status = localStorage.getItem(MIGRATION_STATUS_KEY);
      return status ? JSON.parse(status) : null;
    } catch (error) {
      console.error("[Migration] Error getting migration status:", error);
      return null;
    }
  }

  private setMigrationStatus(status: MigrationStatus): void {
    try {
      localStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify(status));
    } catch (error) {
      console.error("[Migration] Error setting migration status:", error);
    }
  }

  private createBackup(): void {
    try {
      const backup = {
        customers: localStorage.getItem(`customers_${this.userId}`),
        items: localStorage.getItem(`items_${this.userId}`),
        quotes: localStorage.getItem(`quotes_${this.userId}`),
        settings: localStorage.getItem("quote-it-settings"),
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify(backup));
    } catch (error) {
      console.error("[Migration] Failed to create backup:", error);
    }
  }

  private restoreFromBackup(): void {
    try {
      const backup = localStorage.getItem(MIGRATION_BACKUP_KEY);
      if (!backup) return;

      const parsed = JSON.parse(backup);
      if (parsed.customers) localStorage.setItem(`customers_${this.userId}`, parsed.customers);
      if (parsed.items) localStorage.setItem(`items_${this.userId}`, parsed.items);
      if (parsed.quotes) localStorage.setItem(`quotes_${this.userId}`, parsed.quotes);
      if (parsed.settings) localStorage.setItem("quote-it-settings", parsed.settings);
    } catch (error) {
      console.error("[Migration] Rollback failed:", error);
    }
  }

  private async migrateCustomers(): Promise<{ count: number, errors: string[] }> {
    const customers = getCustomers(this.userId);
    let count = 0;
    const errors: string[] = [];
    for (const customer of customers) {
      try {
        await CustomerDB.add({ ...customer, user_id: this.userId });
        count++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to migrate customer ${customer.id}: ${message}`);
      }
    }
    return { count, errors };
  }

  private async migrateItems(): Promise<{ count: number, errors: string[] }> {
    const items = getItems(this.userId);
    let count = 0;
    const errors: string[] = [];
    for (const item of items) {
      try {
        await ItemDB.add({ ...item, user_id: this.userId });
        count++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to migrate item ${item.id}: ${message}`);
      }
    }
    return { count, errors };
  }

  private async migrateQuotes(): Promise<{ count: number, errors: string[] }> {
    const quotes = getQuotes(this.userId);
    let count = 0;
    const errors: string[] = [];
    for (const quote of quotes) {
      try {
        await QuoteDB.add({ ...quote, user_id: this.userId });
        count++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to migrate quote ${quote.id}: ${message}`);
      }
    }
    return { count, errors };
  }

  private async migrateSettings(): Promise<{ success: boolean, errors: string[] }> {
    const settings = getSettings();
    if (!settings.name) return { success: true, errors: [] };

    try {
      await SettingsDB.set(this.userId, settings);
      return { success: true, errors: [] };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, errors: [`Failed to migrate settings: ${message}`] };
    }
  }

  private async verifyMigration(expectedCounts: { customers: number, items: number, quotes: number }): Promise<{ success: boolean; message: string }> {
    const stats = await getStorageStats(this.userId);
    const actual = { customers: stats.customers.count, items: stats.items.count, quotes: stats.quotes.count };
    
    const matches = actual.customers === expectedCounts.customers &&
                    actual.items === expectedCounts.items &&
                    actual.quotes === expectedCounts.quotes;
    
    if (matches) {
        return { success: true, message: "Verification passed." };
    } else {
        return { success: false, message: `Verification failed: Expected ${JSON.stringify(expectedCounts)}, got ${JSON.stringify(actual)}` };
    }
  }

  public clearMigrationData(): void {
    try {
      localStorage.removeItem(MIGRATION_STATUS_KEY);
      localStorage.removeItem(MIGRATION_BACKUP_KEY);
    } catch (error) {
      console.error("[Migration] Error clearing migration data:", error);
    }
  }
}

export interface MigrationResult {
  success: boolean;
  status: MigrationStatus;
  message: string;
}
