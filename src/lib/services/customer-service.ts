/**
 * Customer Service
 * Handles all customer-related database operations
 */

import { Customer, QueueChange } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_KEYS, getCachedData, setCachedData } from './cache-service';
import { dedupedRequest, withTimeout } from './request-pool-service';
import { toCamelCase, toSnakeCase } from './transformation-utils';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';
import { CustomerDB, isIndexedDBSupported } from '../indexed-db';

/**
 * Fetch all customers for a user
 * Priority: IndexedDB > Supabase > Cache > Empty
 */
export async function getCustomers(userId: string | undefined): Promise<Customer[]> {
  if (!userId) {
    console.warn('⚠️ No user ID - using cache for customers.');
    return getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
  }

  const dedupKey = `fetch-customers-${userId}`;

  return dedupedRequest(dedupKey, async () => {
    // Try IndexedDB first if supported
    if (isIndexedDBSupported()) {
      try {
        const indexedDBData = await CustomerDB.getAll(userId);
        if (indexedDBData && indexedDBData.length > 0) {
          console.log(`[CustomerService] Retrieved ${indexedDBData.length} customers from IndexedDB`);
          // Update memory cache
          setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, indexedDBData);
          return indexedDBData;
        }
      } catch (error) {
        console.warn('[CustomerService] IndexedDB read failed, falling back to Supabase:', error);
      }
    }

    // Check memory cache
    const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS);
    
    if (!navigator.onLine) {
      return cached || [];
    }

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
        if (cached) {
          console.log('[Cache] Using cached customers after error');
          return cached;
        }
        throw error;
      }
      
      const result = data ? data.map(item => toCamelCase(item)) as Customer[] : [];
      
      // Save to IndexedDB if supported
      if (isIndexedDBSupported()) {
        try {
          // Clear old data and save new
          await CustomerDB.clear(userId);
          for (const customer of result) {
            await CustomerDB.add({ ...customer, user_id: userId } as never);
          }
          console.log(`[CustomerService] Saved ${result.length} customers to IndexedDB`);
        } catch (error) {
          console.warn('[CustomerService] Failed to save to IndexedDB:', error);
        }
      }
      
      // Update memory cache
      setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (cached) {
        console.log('[Cache] Returning cached customers after timeout');
        return cached;
      }
      return [];
    }
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

  // Update memory cache
  const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
  setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, [...cached, customerWithUser]);

  if (!navigator.onLine || !userId) {
    if (!userId) {
      console.warn('⚠️ No user ID - customer saved to IndexedDB/localStorage only.');
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
    const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
    currentCustomer = cached.find(c => c.id === id);
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

  // Update memory cache
  const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
  const updatedCache = cached.map(item => 
    item.id === id ? updatedCustomer : item
  );
  setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, updatedCache);

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

  // Update memory cache
  const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
  setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, cached.filter(item => item.id !== id));

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
