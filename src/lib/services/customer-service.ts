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

// Track if this is the first load for this user session
const firstLoadMap = new Map<string, boolean>();

/**
 * Fetch all customers for a user
 * Priority: Cache > IndexedDB > Supabase > Empty
 */
export async function getCustomers(userId: string | undefined): Promise<Customer[]> {
  if (!userId) {
    console.warn('⚠️ No user ID - returning empty array.');
    return [];
  }

  console.log(`[CustomerService] getCustomers called for user: ${userId}`);
  
  // Check if this is the first load for this user
  const isFirstLoad = !firstLoadMap.has(userId);
  if (isFirstLoad) {
    console.log(`[CustomerService] First load for user ${userId} - bypassing cache`);
    // Clear any stale cache on first load
    await cacheManager.invalidate('customers');
  }

  const dedupKey = `fetch-customers-${userId}`;

  return dedupedRequest(dedupKey, async () => {
    // On first load, skip cache and go straight to IndexedDB/Supabase
    if (!isFirstLoad) {
      const cached = await cacheManager.get<Customer[]>('customers');
      const hasCache = cached && Array.isArray(cached);
      
      if (hasCache && cached.length > 0) {
        console.log(`[CustomerService] ✓ Retrieved ${cached.length} customers from cache`);
        return cached;
      }
    }

    // Try IndexedDB
    if (isIndexedDBSupported()) {
      try {
        const indexedDBData = await CustomerDB.getAll(userId);
        console.log(`[CustomerService] IndexedDB check: found ${indexedDBData?.length || 0} customers`);
        
        if (indexedDBData && indexedDBData.length > 0) {
          console.log(`[CustomerService] ✓ Retrieved ${indexedDBData.length} customers from IndexedDB`);
          // Update cache for future reads
          await cacheManager.set('customers', indexedDBData);
          
          // Mark first load as complete BEFORE returning
          if (isFirstLoad) {
            firstLoadMap.set(userId, true);
            console.log(`[CustomerService] First load complete - found ${indexedDBData.length} customers`);
          }
          
          // If offline, return IndexedDB data immediately
          if (!navigator.onLine) {
            console.log(`[CustomerService] Offline - returning ${indexedDBData.length} customers from IndexedDB`);
            return indexedDBData;
          }
          
          // If online, still return IndexedDB data but continue with background sync
          console.log(`[CustomerService] Online - returning IndexedDB data and will sync with Supabase`);
        }
      } catch (error) {
        console.warn('[CustomerService] IndexedDB read failed:', error);
      }
    }

    // If we're offline and have no local data, return empty
    if (!navigator.onLine) {
      console.log('[CustomerService] Offline and no local data - returning empty array');
      // Mark first load as complete even with empty data
      if (isFirstLoad) {
        firstLoadMap.set(userId, true);
      }
      return [];
    }

    // Fetch from Supabase
    return cacheManager.coalesce(`customers-${userId}`, async () => {
      console.log(`[CustomerService] Fetching from Supabase for user ${userId}`);
      try {
        const dbQueryPromise = Promise.resolve(
          supabase
            .from('customers')
            .select('*')
            .eq('user_id', userId)
        );
        
        const { data, error } = await withTimeout(dbQueryPromise, 15000);
        
        if (error) {
          console.error('[CustomerService] Supabase error:', error);
          // Return IndexedDB data as fallback
          if (isIndexedDBSupported()) {
            const indexedDBData = await CustomerDB.getAll(userId);
            if (indexedDBData && indexedDBData.length > 0) {
              console.log(`[CustomerService] Returning ${indexedDBData.length} customers from IndexedDB (fallback)`);
              // Mark first load as complete
              if (isFirstLoad) {
                firstLoadMap.set(userId, true);
              }
              return indexedDBData;
            }
          }
          throw error;
        }
        
        const result = data ? data.map(item => toCamelCase(item)) as Customer[] : [];
        console.log(`[CustomerService] ✓ Supabase returned ${result.length} customers`);
        
        // Sync to IndexedDB if we got data
        if (isIndexedDBSupported()) {
          try {
            if (result.length > 0) {
              console.log(`[CustomerService] Syncing ${result.length} customers to IndexedDB`);
              for (const customer of result) {
                await CustomerDB.update({ ...customer, user_id: userId } as never);
              }
              console.log(`[CustomerService] ✓ Synced to IndexedDB`);
            } else {
              // Supabase is empty - check if IndexedDB has local data
              const indexedDBData = await CustomerDB.getAll(userId);
              if (indexedDBData && indexedDBData.length > 0) {
                console.log(`[CustomerService] ⚠️ Supabase empty but IndexedDB has ${indexedDBData.length} customers - preserving local data`);
                await cacheManager.set('customers', indexedDBData);
                // Mark first load as complete
                if (isFirstLoad) {
                  firstLoadMap.set(userId, true);
                }
                return indexedDBData;
              }
            }
          } catch (syncError) {
            console.warn('[CustomerService] IndexedDB sync failed:', syncError);
          }
        }
        
        // Update cache and return
        await cacheManager.set('customers', result);
        console.log(`[CustomerService] ✓ Returning ${result.length} customers from Supabase`);
        
        // Mark first load as complete
        if (isFirstLoad) {
          firstLoadMap.set(userId, true);
          console.log(`[CustomerService] First load complete - found ${result.length} customers`);
        }
        
        return result;
      } catch (error) {
        console.error('[CustomerService] Error:', error);
        // Try IndexedDB as final fallback
        if (isIndexedDBSupported()) {
          const indexedDBData = await CustomerDB.getAll(userId);
          if (indexedDBData && indexedDBData.length > 0) {
            console.log(`[CustomerService] Returning ${indexedDBData.length} customers from IndexedDB (error fallback)`);
            // Mark first load as complete
            if (isFirstLoad) {
              firstLoadMap.set(userId, true);
            }
            return indexedDBData;
          }
        }
        
        // Mark first load as complete even on error
        if (isFirstLoad) {
          firstLoadMap.set(userId, true);
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
