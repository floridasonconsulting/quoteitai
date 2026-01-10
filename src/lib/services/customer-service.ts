/**
 * Customer Service
 * Handles all customer-related database operations
 */

import { Customer, QueueChange } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '../cache-manager';
import { dedupedRequest, executeWithPool, withTimeout } from './request-pool-service';
import { toCamelCase, toSnakeCase } from './transformation-utils';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';
import { CustomerDB, isIndexedDBSupported } from '../indexed-db';
import { apiTracker } from '@/lib/api-performance-tracker';
import { syncStorage } from '../sync-storage';
import { isDemoModeActive } from '@/contexts/DemoContext';
import { MOCK_CUSTOMERS } from '../mockData';

// Track if this is the first load for this user session
const firstLoadMap = new Map<string, boolean>();

/**
 * Fetch all customers for a user
 * Priority: Cache > IndexedDB > Supabase > Empty
 */
// Fetch all customers for a user
// Priority: Cache/IDB (Immediate) -> Supabase (Background Refresh)
export async function getCustomers(
  userId: string | undefined,
  organizationId: string | null = null,
  isAdminOrOwner: boolean = false,
  options?: { forceRefresh?: boolean }
): Promise<Customer[]> {
  if (isDemoModeActive()) {
    console.log('[customer-service] (Demo Mode) Returning mock customers');
    return Promise.resolve(MOCK_CUSTOMERS);
  }

  if (!userId) {
    console.warn('⚠️ No user ID - returning empty array.');
    return [];
  }

  const forceRefresh = options?.forceRefresh;
  const dedupKey = `fetch-customers-${userId}`;
  let cached: Customer[] | null = null;
  const isFirstLoad = !firstLoadMap.has(userId);

  if (isFirstLoad || forceRefresh) {
    console.log(`[CustomerService] First load or force refresh for user ${userId}`);
  }

  // 1. Try Memory Cache
  cached = await cacheManager.get<Customer[]>('customers');

  // 2. Try IndexedDB if memory miss
  if (!cached && isIndexedDBSupported()) {
    try {
      const indexedDBData = await CustomerDB.getAll(userId);
      if (indexedDBData && indexedDBData.length > 0) {
        cached = indexedDBData;
        await cacheManager.set('customers', indexedDBData);
      }
    } catch (e) {
      console.warn('[CustomerService] IDB read failed:', e);
    }
  }

  // Define Background Fetch Function
  const fetchFromSupabase = async () => {
    if (!navigator.onLine) {
      console.log('[CustomerService] Offline - skipping background fetch');
      return null;
    }

    console.log('[CustomerService] 🔄 SWR: Fetching customers from Supabase...');
    try {
      return await dedupedRequest(dedupKey, async () => {
        return cacheManager.coalesce(`customers-${userId}`, async () => {
          console.log(`[CustomerService] Fetching from Supabase for user ${userId}`);
          try {
            let query = supabase.from('customers' as any).select('*');

            if (organizationId) {
              query = query.or(`organization_id.eq.${organizationId},user_id.eq.${userId}`);
            } else {
              query = query.eq('user_id', userId);
            }

            const { data, error } = await executeWithPool(async (signal) => {
              return await (query as any).abortSignal(signal);
            }, 15000, `fetch-customers-${userId}`);

            if (error) {
              console.error('[CustomerService] Supabase error:', error);
              throw error;
            }

            const result = data ? data.map(item => toCamelCase(item)) as Customer[] : [];

            // PROTECT LOCAL STATE
            const dedupedResult = syncStorage.applyPendingChanges(result, 'customers');

            // Sync to IndexedDB
            if (isIndexedDBSupported()) {
              try {
                if (dedupedResult.length > 0) {
                  await CustomerDB.clear(userId);
                  for (const customer of dedupedResult) {
                    await CustomerDB.update({ ...customer, user_id: userId } as never);
                  }
                  console.log(`[CustomerService] ✓ Synced ${dedupedResult.length} customers to IndexedDB`);
                }
              } catch (syncError) {
                console.warn('[CustomerService] IndexedDB sync failed:', syncError);
              }
            }

            // Update cache
            await cacheManager.set('customers', dedupedResult);

            // Notify if changed
            if (!cached || JSON.stringify(cached.map(c => c.id).sort()) !== JSON.stringify(dedupedResult.map(c => c.id).sort())) {
              console.log('[CustomerService] 🔄 Data changed, dispatching refresh');
              dispatchDataRefresh('customers-changed');
            }

            // Mark first load complete
            if (isFirstLoad) firstLoadMap.set(userId, true);

            return dedupedResult;
          } catch (error) {
            console.error('[CustomerService] Error:', error);
            // First load fallback logic
            if (isFirstLoad) firstLoadMap.set(userId, true);
            return null;
          }
        });
      });
    } catch (err) {
      console.error('[CustomerService] Background fetch failed:', err);
      return null;
    }
  };

  // STRATEGY:
  // 1. If Forced Refresh: Await Sync.
  // 2. If Cached: Return Cache + Trigger Background Sync.
  // 3. If No Cache: Await Sync.

  if (forceRefresh) {
    console.log('[CustomerService] Force refresh requested - awaiting fetch');
    const fresh = await fetchFromSupabase();
    return fresh || cached || [];
  }

  if (cached) {
    console.log(`[CustomerService] ⚡ Using ${cached.length} cached customers (background sync triggered)`);
    // Fire and forget background fetch
    fetchFromSupabase().catch(e => console.error('Background sync error:', e));
    return cached;
  }

  console.log('[CustomerService] ⏳ No cache, awaiting customers...');
  const initialFetch = await fetchFromSupabase();
  return initialFetch || [];
}

/**
 * Create a new customer
 * Priority: Supabase + IndexedDB + Cache
 */
export async function addCustomer(
  userId: string | undefined,
  organizationId: string | null,
  customer: Customer,
  queueChange?: (change: QueueChange) => void
): Promise<Customer> {
  const customerWithUser = { ...customer, user_id: userId, organization_id: organizationId } as Customer;

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
    const { error } = await executeWithPool(async (signal) => {
      return await (supabase.from('customers' as any).insert(dbCustomer as any) as any).abortSignal(signal);
    }, 15000, `create-customer-${customer.id}`);

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
  organizationId: string | null,
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
    const { error } = await executeWithPool(async (signal) => {
      let query = supabase
        .from('customers' as any)
        .update(dbUpdates as unknown)
        .eq('id', id);

      // If not in an organization context, strictly enforce user_id matching
      // If in an organization, allow RLS to handle permission (to allow owner/admin updates)
      if (!organizationId) {
        query = query.eq('user_id', userId);
      }
      return await (query as any).abortSignal(signal);
    }, 15000, `update-customer-${id}`);

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
  organizationId: string | null,
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
    const { error } = await executeWithPool(async (signal) => {
      let query = supabase
        .from('customers' as any)
        .delete()
        .eq('id', id);

      // If not in an organization context, strictly enforce user_id matching
      // If in an organization, allow RLS to handle permission (to allow owner/admin deletes)
      if (!organizationId) {
        query = query.eq('user_id', userId);
      }
      return await (query as any).abortSignal(signal);
    }, 15000, `delete-customer-${id}`);

    if (error) throw error;

    dispatchDataRefresh('customers-changed');
  } catch (error) {
    console.error('Error deleting customer:', error);
    queueChange?.({ type: 'delete', table: 'customers', data: { id } });
  }
}
