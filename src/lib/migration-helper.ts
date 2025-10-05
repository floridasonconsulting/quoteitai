import { supabase } from '@/integrations/supabase/client';
import { 
  getStorageItem, 
  setStorageItem,
  getCustomers as getLocalCustomers,
  getItems as getLocalItems,
  getQuotes as getLocalQuotes,
  getSettings as getLocalSettings
} from './storage';

const MIGRATION_FLAG_KEY = 'data-migrated-to-db';

export const checkAndMigrateData = async (userId: string): Promise<void> => {
  // Check if migration already happened
  const migrated = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrated === 'true') return;

  try {
    console.log('Starting data migration to database...');

    // Migrate customers
    const localCustomers = getLocalCustomers();
    if (localCustomers.length > 0) {
      const customersToInsert = localCustomers.map(customer => ({
        ...customer,
        user_id: userId,
      }));
      const { error: customersError } = await supabase
        .from('customers')
        .upsert(customersToInsert, { onConflict: 'id' });
      if (customersError) throw customersError;
      console.log(`Migrated ${localCustomers.length} customers`);
    }

    // Migrate items
    const localItems = getLocalItems();
    if (localItems.length > 0) {
      const itemsToInsert = localItems.map(item => ({
        id: item.id,
        user_id: userId,
        name: item.name,
        description: item.description,
        category: item.category,
        base_price: item.basePrice,
        markup: item.markup,
        markup_type: item.markupType,
        final_price: item.finalPrice,
        units: item.units,
        created_at: item.createdAt,
      }));
      const { error: itemsError } = await supabase
        .from('items')
        .upsert(itemsToInsert, { onConflict: 'id' });
      if (itemsError) throw itemsError;
      console.log(`Migrated ${localItems.length} items`);
    }

    // Migrate quotes
    const localQuotes = getLocalQuotes();
    if (localQuotes.length > 0) {
      const quotesToInsert = localQuotes.map(quote => ({
        id: quote.id,
        user_id: userId,
        customer_id: quote.customerId,
        customer_name: quote.customerName,
        quote_number: quote.quoteNumber,
        title: quote.title,
        notes: quote.notes,
        items: quote.items as any, // Cast to any for JSON compatibility
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        status: quote.status,
        sent_date: quote.sentDate,
        follow_up_date: quote.followUpDate,
        created_at: quote.createdAt,
        updated_at: quote.updatedAt,
      }));
      const { error: quotesError } = await supabase
        .from('quotes')
        .upsert(quotesToInsert, { onConflict: 'id' });
      if (quotesError) throw quotesError;
      console.log(`Migrated ${localQuotes.length} quotes`);
    }

    // Migrate company settings
    const localSettings = getLocalSettings();
    if (localSettings.name || localSettings.email) {
      const settingsToInsert = {
        user_id: userId,
        name: localSettings.name,
        address: localSettings.address,
        city: localSettings.city,
        state: localSettings.state,
        zip: localSettings.zip,
        phone: localSettings.phone,
        email: localSettings.email,
        website: localSettings.website,
        license: localSettings.license,
        insurance: localSettings.insurance,
        logo: localSettings.logo,
        logo_display_option: localSettings.logoDisplayOption,
        terms: localSettings.terms,
      };
      const { error: settingsError } = await supabase
        .from('company_settings')
        .upsert(settingsToInsert, { onConflict: 'user_id' });
      if (settingsError) throw settingsError;
      console.log('Migrated company settings');
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    console.log('Data migration completed successfully');
  } catch (error) {
    console.error('Error during data migration:', error);
    // Don't set the migration flag on error, so it can be retried
  }
};
