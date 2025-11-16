
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

/**
 * Fetch all customers for a user
 */
export async function getCustomers(userId: string | undefined): Promise<Customer[]> {
  if (!userId) {
    console.warn('⚠️ No user ID - using cache for customers.');
    return getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
  }

  const dedupKey = `fetch-customers-${userId}`;

  return dedupedRequest(dedupKey, async () => {
    // Check cache first
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
 */
export async function addCustomer(
  userId: string | undefined,
  customer: Customer,
  queueChange?: (change: QueueChange) => void
): Promise<Customer> {
  const customerWithUser = { ...customer, user_id: userId } as Customer;

  if (!navigator.onLine || !userId) {
    if (!userId) {
      console.warn('⚠️ No user ID - saving customer to localStorage only.');
    }
    const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
    setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, [...cached, customerWithUser]);
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
    const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
    setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, [...cached, customerWithUser]);
    
    dispatchDataRefresh('customers-changed');
    
    return customerWithUser;
  } catch (error) {
    console.error('⚠️ Error creating customer, falling back to localStorage:', error);
    const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
    setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, [...cached, customerWithUser]);
    queueChange?.({ type: 'create', table: 'customers', data: customerWithUser });
    throw error;
  }
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  userId: string | undefined,
  id: string,
  updates: Partial<Customer>,
  queueChange?: (change: QueueChange) => void
): Promise<Customer> {
  if (!navigator.onLine || !userId) {
    const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as Customer : item
    );
    setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, updated);
    queueChange?.({ type: 'update', table: 'customers', data: { id, ...updates } });
    return updated.find(item => item.id === id)!;
  }

  try {
    const dbUpdates = toSnakeCase(updates);
    const { error } = await supabase
      .from('customers')
      .update(dbUpdates as unknown)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as Customer : item
    );
    setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, updated);
    
    dispatchDataRefresh('customers-changed');
    
    return updated.find(item => item.id === id)!;
  } catch (error) {
    console.error('Error updating customer:', error);
    const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as Customer : item
    );
    setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, updated);
    queueChange?.({ type: 'update', table: 'customers', data: { id, ...updates } });
    return updated.find(item => item.id === id)!;
  }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(
  userId: string | undefined,
  id: string,
  queueChange?: (change: QueueChange) => void
): Promise<void> {
  if (!navigator.onLine || !userId) {
    const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
    setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, cached.filter(item => item.id !== id));
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
    
    const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
    setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, cached.filter(item => item.id !== id));
    
    dispatchDataRefresh('customers-changed');
  } catch (error) {
    console.error('Error deleting customer:', error);
    const cached = getCachedData<Customer>(CACHE_KEYS.CUSTOMERS) || [];
    setCachedData<Customer>(CACHE_KEYS.CUSTOMERS, cached.filter(item => item.id !== id));
    queueChange?.({ type: 'delete', table: 'customers', data: { id } });
  }
}
