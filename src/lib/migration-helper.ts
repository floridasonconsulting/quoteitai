import { supabase } from '@/integrations/supabase/client';
import { 
  getStorageItem, 
  setStorageItem,
  getCustomers as getLocalCustomers,
  getItems as getLocalItems,
  getQuotes as getLocalQuotes,
  getSettings as getLocalSettings
} from './storage';
import { toSnakeCase } from './db-service';

const MIGRATION_FLAG_KEY = 'data-migrated-to-db';

export const checkAndMigrateData = async (userId: string): Promise<void> => {
  try {
    console.log('Starting data migration check for user:', userId);

    // Migrate customers
    const localCustomers = getLocalCustomers();
    if (localCustomers.length > 0) {
      const customersToInsert = localCustomers.map(customer => 
        toSnakeCase({ ...customer, user_id: userId })
      );
      const { error: customersError } = await supabase
        .from('customers')
        .upsert(customersToInsert, { onConflict: 'id' });
      if (customersError) throw customersError;
      console.log(`Migrated ${localCustomers.length} customers`);
    }

    // Migrate items
    const localItems = getLocalItems();
    if (localItems.length > 0) {
      const itemsToInsert = localItems.map(item => 
        toSnakeCase({ ...item, user_id: userId })
      );
      const { error: itemsError } = await supabase
        .from('items')
        .upsert(itemsToInsert, { onConflict: 'id' });
      if (itemsError) throw itemsError;
      console.log(`Migrated ${localItems.length} items`);
    }

    // Migrate quotes
    const localQuotes = getLocalQuotes();
    if (localQuotes.length > 0) {
      const quotesToInsert = localQuotes.map(quote => 
        toSnakeCase({ ...quote, user_id: userId })
      );
      const { error: quotesError } = await supabase
        .from('quotes')
        .upsert(quotesToInsert, { onConflict: 'id' });
      if (quotesError) throw quotesError;
      console.log(`Migrated ${localQuotes.length} quotes`);
    }

    // Migrate company settings
    const localSettings = getLocalSettings();
    if (localSettings.name || localSettings.email) {
      const settingsToInsert = toSnakeCase({
        user_id: userId,
        ...localSettings
      });
      const { error: settingsError } = await supabase
        .from('company_settings')
        .upsert(settingsToInsert, { onConflict: 'user_id' });
      if (settingsError) throw settingsError;
      console.log('Migrated company settings');
    }

    console.log('Data migration completed successfully');
  } catch (error) {
    console.error('Error during data migration:', error);
  }
};
