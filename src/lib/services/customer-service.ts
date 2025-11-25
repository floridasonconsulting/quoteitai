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
        } else {
          // IndexedDB is empty - check for legacy localStorage data
          console.log('[CustomerService] IndexedDB empty - checking for legacy localStorage data');
          const legacyKey = 'customers';
          const legacyData = localStorage.getItem(legacyKey);
          
          if (legacyData) {
            try {
              const parsedCustomers = JSON.parse(legacyData) as Customer[];
              if (parsedCustomers && Array.isArray(parsedCustomers) && parsedCustomers.length > 0) {
                console.log(`[CustomerService] Found ${parsedCustomers.length} customers in legacy localStorage - migrating to IndexedDB`);
                
                // Migrate each customer to IndexedDB
                const migratedCustomers: Customer[] = [];
                for (const customer of parsedCustomers) {
                  try {
                    // Add user_id and ensure proper structure
                    const customerWithUserId = { 
                      ...customer, 
                      user_id: userId,
                      userId: userId // Both formats for compatibility
                    };
                    
                    // Use add() for new records
                    await CustomerDB.add(customerWithUserId as never);
                    migratedCustomers.push(customerWithUserId as Customer);
                  } catch (addError) {
                    console.error(`[CustomerService] Failed to migrate customer ${customer.id}:`, addError);
                  }
                }
                
                if (migratedCustomers.length > 0) {
                  console.log(`✅ Successfully migrated ${migratedCustomers.length} customers to IndexedDB`);
                  // Cache the migrated customers
                  await cacheManager.set('customers', migratedCustomers);
                  // Remove legacy data
                  localStorage.removeItem(legacyKey);
                  // Return migrated data immediately
                  return migratedCustomers;
                }
              }
            } catch (parseError) {
              console.error('[CustomerService] Error parsing legacy customer data:', parseError);
            }
          }
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
        
        // CRITICAL FIX: Only sync FROM Supabase TO IndexedDB if we got data
        // DO NOT clear IndexedDB if Supabase is empty (preserves offline data)
        if (isIndexedDBSupported()) {
          try {
            if (result.length > 0) {
              // We got data from Supabase - sync it to IndexedDB
              console.log(`[CustomerService] Syncing ${result.length} customers from Supabase to IndexedDB`);
              for (const customer of result) {
                await CustomerDB.update({ ...customer, user_id: userId } as never);
              }
              console.log(`[CustomerService] Successfully synced ${result.length} customers to IndexedDB`);
              
              // Update cache with Supabase data
              await cacheManager.set('customers', result);
              console.log(`[CustomerService] RETURNING ${result.length} customers from Supabase`);
              return result;
            } else {
              // Supabase returned empty - check if IndexedDB has data we should preserve
              console.log(`[CustomerService] Supabase empty - checking IndexedDB for local data`);
              const indexedDBData = await CustomerDB.getAll(userId);
              if (indexedDBData && indexedDBData.length > 0) {
                console.log(`[CustomerService] ⚠️ Supabase empty but IndexedDB has ${indexedDBData.length} customers`);
                console.log(`[CustomerService] PRESERVING local IndexedDB data (offline-created or not yet synced)`);
                // Cache the IndexedDB data
                await cacheManager.set('customers', indexedDBData);
                return indexedDBData;
              } else {
                console.log(`[CustomerService] Both Supabase and IndexedDB are empty - returning empty array`);
                await cacheManager.set('customers', []);
                return [];
              }
            }
          } catch (error) {
            console.warn('[CustomerService] IndexedDB sync failed:', error);
            // Still return Supabase data even if IndexedDB sync failed
            await cacheManager.set('customers', result);
            return result;
          }
        } else {
          // IndexedDB not supported - just use Supabase data
          await cacheManager.set('customers', result);
          console.log(`[CustomerService] RETURNING ${result.length} customers from Supabase (IndexedDB not supported)`);
          return result;
        }
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
