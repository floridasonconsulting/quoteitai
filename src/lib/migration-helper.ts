import { supabase } from "@/integrations/supabase/client";
import {
  getStorageItem,
  setStorageItem,
  getSettings,
} from "./storage";
import { toSnakeCase } from "./services/transformation-utils";
import { executeWithPool } from "./services/request-pool-service";
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
    const indexedDBMigrated = getStorageItem(MIGRATION_FLAG_KEY, "false");
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
      const customersToSync = customers.map((customer) => ({
        id: customer.id,
        user_id: userId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        contact_first_name: customer.contactFirstName,
        contact_last_name: customer.contactLastName,
        created_at: customer.createdAt
      }));
      const { error: customersError } = await executeWithPool(
        async (signal) => await (supabase
          .from("customers")
          .upsert(customersToSync, { onConflict: "id" }) as any).abortSignal(signal),
        30000,
        'migration-customers'
      ) as any;

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
      const itemsToSync = items.map((item) => ({
        id: item.id,
        user_id: userId,
        name: item.name,
        description: item.description,
        enhanced_description: item.enhancedDescription,
        category: item.category,
        base_price: item.basePrice,
        markup_type: item.markupType,
        markup: item.markup,
        final_price: item.finalPrice,
        units: item.units,
        min_quantity: item.minQuantity,
        image_url: item.imageUrl,
        created_at: item.createdAt
      }));
      const { error: itemsError } = await executeWithPool(
        async (signal) => await (supabase
          .from("items")
          .upsert(itemsToSync, { onConflict: "id" }) as any).abortSignal(signal),
        30000,
        'migration-items'
      ) as any;

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
      const quotesToSync = quotes.map((quote) => {
        // Create a base object with only the fields that exist in the DB
        const cleanQuote: any = {
          id: quote.id,
          user_id: userId,
          quote_number: quote.quoteNumber,
          customer_id: quote.customerId,
          customer_name: quote.customerName,
          title: quote.title,
          items: quote.items,
          subtotal: quote.subtotal,
          tax: quote.tax,
          total: quote.total,
          status: quote.status,
          notes: quote.notes,
          executive_summary: quote.executiveSummary,
          payment_terms: quote.paymentTerms,
          legal_terms: quote.legalTerms,
          sent_date: quote.sentDate,
          follow_up_date: quote.followUpDate,
          created_at: quote.createdAt,
          updated_at: quote.updatedAt,
          share_token: quote.shareToken,
          shared_at: quote.sharedAt,
          viewed_at: quote.viewedAt,
          show_pricing: quote.showPricing,
          project_description: quote.projectDescription,
          pricing_mode: quote.pricingMode,
          scope_of_work: quote.scopeOfWork,
          organization_id: quote.organizationId,
          signature_data: quote.signatureData,
          signed_at: quote.signedAt,
          signed_by_name: quote.signedByName
        };

        // Remove undefined values to let DB defaults take over or avoid errors
        Object.keys(cleanQuote).forEach(key => cleanQuote[key] === undefined && delete cleanQuote[key]);

        return cleanQuote;
      });
      const { error: quotesError } = await executeWithPool(
        async (signal) => await (supabase
          .from("quotes")
          .upsert(quotesToSync, { onConflict: "id" }) as any).abortSignal(signal),
        60000, // Quotes can be large
        'migration-quotes'
      ) as any;

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
      const settingsToSync: any = {
        user_id: userId,
        name: settings.name,
        address: settings.address,
        city: settings.city,
        state: settings.state,
        zip: settings.zip,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        logo: settings.logo,
        logo_display_option: settings.logoDisplayOption,
        license: settings.license,
        insurance: settings.insurance,
        terms: settings.terms,
        legal_terms: settings.legalTerms,
        proposal_template: settings.proposalTemplate,
        proposal_theme: settings.proposalTheme,
        industry: settings.industry,
        notify_email_accepted: settings.notifyEmailAccepted,
        notify_email_declined: settings.notifyEmailDeclined,
        show_proposal_images: settings.showProposalImages,
        default_cover_image: settings.defaultCoverImage,
        default_header_image: settings.defaultHeaderImage,
        visual_rules: settings.visualRules,
        show_financing: settings.showFinancing,
        financing_text: settings.financingText,
        financing_link: settings.financingLink,
        primary_color: settings.primaryColor,
        accent_color: settings.accentColor,
        onboarding_completed: settings.onboardingCompleted
      };

      // Remove undefined values
      Object.keys(settingsToSync).forEach(key => settingsToSync[key] === undefined && delete settingsToSync[key]);
      const { error: settingsError } = await executeWithPool(
        async (signal) => await (supabase
          .from("company_settings")
          .upsert(settingsToSync, { onConflict: "user_id" }) as any).abortSignal(signal),
        30000,
        'migration-settings'
      ) as any;

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
