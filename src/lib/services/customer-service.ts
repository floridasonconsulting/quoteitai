/**
 * Customer Service
 * Handles all customer-related database operations
 */

import { Customer, QueueChange } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '../cache-manager';
import { dedupedRequest, withTimeout } from './request-pool-service';
import { toCamelCase, toSnakeCase } from './transformation-utils';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';
import { CustomerDB, isIndexedDBSupported } from '../indexed-db';
import { apiTracker } from '@/lib/api-performance-tracker';
import { getData } from '../local-db';

/**
 * Fetch all customers for a user
 * Priority: Cache > IndexedDB > Supabase > Empty
 */
export async function getCustomers(userId: string | undefined): Promise<Customer[]> {
  if (!userId) {
    console.warn('⚠️ No user ID - using cache for customers.');
    const cached = await cacheManager.get<Customer[]>('customers');
    return cached || [];
  }

  const dedupKey = `fetch-customers-${userId}`;

  return dedupedRequest(dedupKey, async () => {
    // Check cache first (CacheManager handles memory cache)
    const cached = await cacheManager.get<Customer[]>('customers');
    if (cached && cached.length > 0) {
      console.log(`[CustomerService] Retrieved ${cached.length} customers from cache`);
      return cached;
    }

    // Try IndexedDB if cache miss
    if (isIndexedDBSupported()) {
      try {
        const indexedDBData = await CustomerDB.getAll(userId);
        console.log(`[CustomerService] IndexedDB check: found ${indexedDBData?.length || 0} customers`);
        if (indexedDBData && indexedDBData.length > 0) {
          console.log(`[CustomerService] Retrieved ${indexedDBData.length} customers from IndexedDB`);
          // Update cache
          await cacheManager.set('customers', indexedDBData);
          console.log(`[CustomerService] Cached ${indexedDBData.length} customers from IndexedDB`);
          
          // If offline, return IndexedDB data immediately
          if (!navigator.onLine) {
            console.log(`[CustomerService] Offline - returning ${indexedDBData.length} customers from IndexedDB`);
            return indexedDBData;
          }
          
          // If online, we'll fetch from Supabase to sync, but keep IndexedDB data as fallback
          console.log(`[CustomerService] Online - will fetch from Supabase to sync`);
        }
      } catch (error) {
        console.warn('[CustomerService] IndexedDB read failed, falling back to Supabase:', error);
      }
    }

    if (!navigator.onLine) {
      return cached || [];
    }

    // Use cache manager's request coalescing for network requests
    return cacheManager.coalesce(`customers-${userId}`, async () => {
      console.log(`[CustomerService] Starting Supabase fetch for user ${userId}`);
      try {
        const dbQueryPromise = Promise.resolve(
          supabase
            .from('customers')
            .select('*')
            .eq('user_id', userId)
        );
        
        const { data, error } = await withTimeout(dbQueryPromise, 15000);
        
        if (error) {
          console.error('Error fetching customers:', error);
          // Try IndexedDB as fallback
          if (isIndexedDBSupported()) {
            const indexedDBData = await CustomerDB.getAll(userId);
            if (indexedDBData && indexedDBData.length > 0) {
              return indexedDBData;
            }
          }
          if (cached) {
            console.log('[Cache] Using cached customers after error');
            return cached;
          }
          throw error;
        }
        
        const result = data ? data.map(item => toCamelCase(item)) as Customer[] : [];
        console.log(`[CustomerService] Supabase returned ${result.length} customers`);
        
        // CRITICAL FIX: If Supabase returns empty, check if we have local data BEFORE clearing cache
        // This prevents data loss if the user is offline or sync hasn't completed
        if (result.length === 0 && isIndexedDBSupported()) {
          console.log(`[CustomerService] Supabase empty - checking IndexedDB for local data`);
          try {
            const indexedDBData = await CustomerDB.getAll(userId);
            if (indexedDBData && indexedDBData.length > 0) {
              console.log(`[CustomerService] Supabase empty but IndexedDB has ${indexedDBData.length} customers - PRESERVING LOCAL DATA`);
              // Update cache with IndexedDB data instead of empty Supabase result
              await cacheManager.set('customers', indexedDBData);
              return indexedDBData;
            }
            
            // NEW FALLBACK: Check localStorage if IndexedDB is also empty
            // This handles cases where migration might have failed or not run
            console.log('[CustomerService] IndexedDB empty - checking legacy localStorage');
            const legacyData = getData<Customer[]>('customers');
            if (legacyData && legacyData.length > 0) {
               console.log(`[CustomerService] Found ${legacyData.length} customers in legacy storage - migrating now`);
               // Migrate to IndexedDB on the fly
               const migratedCustomers: Customer[] = [];
               for (const customer of legacyData) {
                 const customerWithUserId = { ...customer, user_id: userId } as Customer;
                 try {
                   // CRITICAL FIX: Use add() for new records, not update()
                   await CustomerDB.add(customerWithUserId as never);
                   migratedCustomers.push(customerWithUserId);
                 } catch (addError) {
                   console.error(`[CustomerService] Failed to migrate customer ${customer.id}:`, addError);
                 }
               }
               
               if (migratedCustomers.length > 0) {
                 console.log(`✅ Migrated ${migratedCustomers.length} customers from localStorage to IndexedDB`);
                 // Cache the migrated data
                 await cacheManager.set('customers', migratedCustomers);
                 // Return the migrated data
                 return migratedCustomers;
               }
            }
            
          } catch (err) {
             console.warn('[CustomerService] IndexedDB check failed:', err);
          }
        }

        // Only update IndexedDB if we received data from Supabase
        if (isIndexedDBSupported() && result.length > 0) {
          try {
            console.log(`[CustomerService] Syncing ${result.length} customers from Supabase to IndexedDB`);
            // Sync Supabase data to IndexedDB
            for (const customer of result) {
              await CustomerDB.update({ ...customer, user_id: userId } as never);
            }
            console.log(`[CustomerService] Saved ${result.length} customers to IndexedDB`);
          } catch (error) {
            console.warn('[CustomerService] Failed to save to IndexedDB:', error);
          }
        }
        
        // Update cache
        console.log(`[CustomerService] Caching ${result.length} customers from Supabase`);
        await cacheManager.set('customers', result);
        console.log(`[CustomerService] RETURNING ${result.length} customers from Supabase`);
        
        return result;
      } catch (error) {
        console.error('Error fetching customers:', error);
        // Try IndexedDB as fallback
        if (isIndexedDBSupported()) {
          const indexedDBData = await CustomerDB.getAll(userId);
          if (indexedDBData && indexedDBData.length > 0) {
            return indexedDBData;
          }
        }
        if (cached) {
          console.log('[Cache] Returning cached customers after timeout');
          return cached;
        }
        return [];
      }
    });
  });
}

/**
 * Create a new customer
 * Priority: Supabase + IndexedDB + Cache
 */
export async function addCustomer(
  userId: string | undefined,
  customer: Customer,
  queueChange?: (change: QueueChange) => void
): Promise<Customer> {
  const customerWithUser = { ...customer, user_id: userId } as Customer;

  // Save to IndexedDB first if supported
  if (isIndexedDBSupported()) {
    try {
      await CustomerDB.add(customerWithUser as never);
      console.log('[CustomerService] Saved customer to IndexedDB');
    } catch (error) {
      console.warn('[CustomerService] IndexedDB save failed:', error);
    }
  }

  // Invalidate cache to force refresh
  await cacheManager.invalidate('customers');

  if (!navigator.onLine || !userId) {
    if (!userId) {
      console.warn('⚠️ No user ID - customer saved to IndexedDB only.');
    }
    queueChange?.({ type: 'create', table: 'customers', data: customerWithUser });
    return customerWithUser;
  }

  try {
    const dbCustomer = toSnakeCase(customerWithUser);
    const { error } = await supabase.from('customers').insert(dbCustomer as unknown);
    
    if (error) {
      console.error('❌ Database insert failed for customer:', error);
      throw error;
    }
    
    console.log('✅ Successfully inserted customer into database');
    dispatchDataRefresh('customers-changed');
    
    return customerWithUser;
  } catch (error) {
    console.error('⚠️ Error creating customer, queued for sync:', error);
    queueChange?.({ type: 'create', table: 'customers', data: customerWithUser });
    throw error;
  }
}

/**
 * Update an existing customer
 * Priority: IndexedDB + Supabase + Cache
 */
export async function updateCustomer(
  userId: string | undefined,
  id: string,
  updates: Partial<Customer>,
  queueChange?: (change: QueueChange) => void
): Promise<Customer> {
  // Get current customer data
  let currentCustomer: Customer | undefined;
  
  if (isIndexedDBSupported()) {
    try {
      const indexedCustomer = await CustomerDB.getById(id);
      if (indexedCustomer) {
        currentCustomer = indexedCustomer;
      }
    } catch (error) {
      console.warn('[CustomerService] IndexedDB read failed:', error);
    }
  }
  
  if (!currentCustomer) {
    const cached = await cacheManager.get<Customer[]>('customers');
    currentCustomer = cached?.find(c => c.id === id);
  }

  const updatedCustomer = { ...currentCustomer, ...updates } as Customer;

  // Update IndexedDB
  if (isIndexedDBSupported()) {
    try {
      await CustomerDB.update({ ...updatedCustomer, user_id: userId } as never);
      console.log('[CustomerService] Updated customer in IndexedDB');
    } catch (error) {
      console.warn('[CustomerService] IndexedDB update failed:', error);
    }
  }

  // Invalidate cache
  await cacheManager.invalidate('customers');

  if (!navigator.onLine || !userId) {
    queueChange?.({ type: 'update', table: 'customers', data: { id, ...updates } });
    return updatedCustomer;
  }

  try {
    const dbUpdates = toSnakeCase(updates);
    const { error } = await supabase
      .from('customers')
      .update(dbUpdates as unknown)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    dispatchDataRefresh('customers-changed');
    
    return updatedCustomer;
  } catch (error) {
    console.error('Error updating customer:', error);
    queueChange?.({ type: 'update', table: 'customers', data: { id, ...updates } });
    return updatedCustomer;
  }
}

/**
 * Delete a customer
 * Priority: IndexedDB + Supabase + Cache
 */
export async function deleteCustomer(
  userId: string | undefined,
  id: string,
  queueChange?: (change: QueueChange) => void
): Promise<void> {
  // Delete from IndexedDB
  if (isIndexedDBSupported()) {
    try {
      await CustomerDB.delete(id);
      console.log('[CustomerService] Deleted customer from IndexedDB');
    } catch (error) {
      console.warn('[CustomerService] IndexedDB delete failed:', error);
    }
  }

  // Invalidate cache
  await cacheManager.invalidate('customers');

  if (!navigator.onLine || !userId) {
    queueChange?.({ type: 'delete', table: 'customers', data: { id } });
    return;
  }

  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    dispatchDataRefresh('customers-changed');
  } catch (error) {
    console.error('Error deleting customer:', error);
    queueChange?.({ type: 'delete', table: 'customers', data: { id } });
  }
}
