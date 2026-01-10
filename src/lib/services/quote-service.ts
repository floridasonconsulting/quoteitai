/**
 * Quote Service
 * Handles all quote-related database operations
 */

import { Quote, QueueChange } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '../cache-manager';
import { dedupedRequest, executeWithPool, withTimeout } from './request-pool-service';
import { toCamelCase, toSnakeCase } from './transformation-utils';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';
import { QuoteDB, isIndexedDBSupported } from '../indexed-db';
import { syncStorage } from '../sync-storage';
import { isDemoModeActive } from '@/contexts/DemoContext';
import { MOCK_QUOTES } from '../mockData';

/**
 * Deduplicate quotes by ID (keeps the most recent version)
 */
function deduplicateQuotes(quotes: Quote[]): Quote[] {
  const quoteMap = new Map<string, Quote>();

  for (const quote of quotes) {
    const existing = quoteMap.get(quote.id);
    if (!existing || new Date(quote.updatedAt) > new Date(existing.updatedAt)) {
      quoteMap.set(quote.id, quote);
    }
  }

  const deduped = Array.from(quoteMap.values());
  if (quotes.length !== deduped.length) {
    console.log(`[QuoteService] Deduplicated ${quotes.length} quotes to ${deduped.length}`);
  }
  return deduped;
}

/**
 * Fetch all quotes for a user
 * Priority: Cache/IDB (Immediate) -> Supabase (Background Refresh)
 */
export async function getQuotes(
  userId: string | undefined,
  organizationId: string | null = null,
  isAdminOrOwner: boolean = false,
  options?: { forceRefresh?: boolean; client?: any }
): Promise<Quote[]> {
  const customClient = options?.client || supabase;
  if (isDemoModeActive()) {
    console.log('[quote-service] (Demo Mode) Returning mock quotes');
    return Promise.resolve(MOCK_QUOTES);
  }
  if (!userId) {
    console.warn('⚠️ No user ID - using cache for quotes.');
    const cached = await cacheManager.get<Quote[]>('quotes');
    return cached || [];
  }

  const forceRefresh = options?.forceRefresh;
  const dedupKey = `fetch-quotes-${userId}`;
  let cached: Quote[] | null = null;

  // 1. Check memory cache first (OUTSIDE of pool)
  cached = await cacheManager.get<Quote[]>('quotes');

  // 2. Try IndexedDB (OUTSIDE of pool) if memory miss
  if (!cached && isIndexedDBSupported()) {
    try {
      const indexedDBData = await QuoteDB.getAll(userId);
      if (indexedDBData && indexedDBData.length > 0) {
        cached = deduplicateQuotes(indexedDBData);
        await cacheManager.set('quotes', cached);
      }
    } catch (error) {
      console.warn('[QuoteService] IndexedDB read failed:', error);
    }
  }

  // Define Background Fetch
  const fetchFromSupabase = async () => {
    if (!navigator.onLine) {
      return null;
    }

    console.log('[QuoteService] 🔄 SWR: Fetching quotes from Supabase...');
    try {
      return dedupedRequest(dedupKey, async () => {
        return cacheManager.coalesce(`quotes-${userId}`, async () => {
          try {
            let query = customClient.from('quotes' as any).select('*, customers(contact_first_name, contact_last_name)');

            if (organizationId) {
              query = query.or(`organization_id.eq.${organizationId},user_id.eq.${userId}`);
            } else {
              query = query.eq('user_id', userId);
            }

            const { data, error } = await withTimeout(
              Promise.resolve(query.order('updated_at', { ascending: false })),
              15000
            );

            if (error) {
              console.error('Error fetching quotes from Supabase:', error);
              throw error;
            }

            const result = data ? data.map(item => {
              const camelItem = toCamelCase(item) as any;
              if (camelItem.customers) {
                const firstName = camelItem.customers.contactFirstName || '';
                const lastName = camelItem.customers.contactLastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                if (fullName) camelItem.contactName = fullName;
              }
              return camelItem as Quote;
            }) : [];

            const protectedResult = syncStorage.applyPendingChanges(result, 'quotes') as Quote[];
            const dedupedResult = deduplicateQuotes(protectedResult);

            console.log(`[QuoteService] Fetched ${result.length} from Supabase, protected to ${dedupedResult.length}`);

            // Update IndexedDB
            if (isIndexedDBSupported()) {
              try {
                await QuoteDB.clear(userId);
                if (dedupedResult.length > 0) {
                  const promises = dedupedResult.map(quote =>
                    QuoteDB.add({ ...quote, userId } as Quote)
                  );
                  await Promise.all(promises);
                }
              } catch (error) {
                console.warn('[QuoteService] Failed to sync to IndexedDB:', error);
              }
            }

            // Update cache
            await cacheManager.set('quotes', dedupedResult);

            // Notify if changed
            if (!cached || JSON.stringify(cached.map(q => q.id).sort()) !== JSON.stringify(dedupedResult.map(q => q.id).sort())) {
              console.log('[QuoteService] 🔄 Data changed, dispatching refresh');
              dispatchDataRefresh('quotes-changed');
            }

            return dedupedResult;
          } catch (error) {
            console.error('Error fetching quotes:', error);
            return null;
          }
        });
      });
    } catch (err) {
      console.error('Background fetch failed', err);
      return null;
    }
  };

  if (forceRefresh) {
    console.log('[QuoteService] Force refresh requested - awaiting fetch');
    const fresh = await fetchFromSupabase();
    return fresh || cached || [];
  }

  if (cached) {
    console.log(`[QuoteService] ⚡ Using ${cached.length} cached quotes (background sync triggered)`);
    fetchFromSupabase().catch(e => console.error('Background sync error:', e));
    return deduplicateQuotes(cached);
  }

  console.log('[QuoteService] ⏳ No cache, awaiting quotes...');
  const initialFetch = await fetchFromSupabase();
  return initialFetch || [];
}

/**
 * Fetch a single quote by its ID
 */
export async function getQuote(userId: string, id: string, client = supabase): Promise<Quote | null> {
  const cacheKey = `quote-${id}`;

  // 1. Check memory cache
  const cached = await cacheManager.get<Quote>(cacheKey);
  if (cached) return cached;

  // 2. Try IndexedDB
  if (isIndexedDBSupported()) {
    try {
      const indexedQuote = await QuoteDB.getById(id);
      if (indexedQuote && indexedQuote.userId === userId) {
        await cacheManager.set(cacheKey, indexedQuote);
        return indexedQuote;
      }
    } catch (error) {
      console.warn(`[QuoteService] IndexedDB read error for quote ${id}:`, error);
    }
  }

  if (!navigator.onLine) return null;

  // 3. Fetch from Supabase
  try {
    const { data, error } = await dedupedRequest(cacheKey, async () => {
      return await client
        .from("quotes")
        .select("*, customers(contact_first_name, contact_last_name)")
        .eq("user_id", userId)
        .eq("id", id)
        .single();
    });

    if (error || !data) {
      if (error && error.code !== "PGRST116") {
        console.error(`Error fetching quote ${id}:`, error);
      }
      return null;
    }

    const camelData = toCamelCase(data) as any;

    // Map contact name from joined customer data
    if (camelData.customers) {
      const firstName = camelData.customers.contactFirstName || '';
      const lastName = camelData.customers.contactLastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) {
        camelData.contactName = fullName;
      }
    }

    const result = camelData as Quote;

    // Update storage
    if (isIndexedDBSupported()) {
      try {
        const existing = await QuoteDB.getById(id);
        if (existing) {
          await QuoteDB.update({ ...result, userId } as Quote);
        } else {
          await QuoteDB.add({ ...result, userId } as Quote);
        }
      } catch (e) {
        console.warn("IndexedDB update failed:", e);
      }
    }

    await cacheManager.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error fetching quote ${id}:`, error);
    return null;
  }
}

/**
 * Create a new quote
 */
export async function addQuote(
  userId: string | undefined,
  organizationId: string | null,
  quote: Quote,
  queueChange?: (change: QueueChange) => void
): Promise<Quote> {
  const quoteWithUser = { ...quote, userId, organizationId } as any;

  // 1. Save to IndexedDB immediately for UI responsiveness
  if (isIndexedDBSupported() && userId) {
    try {
      await QuoteDB.add(quoteWithUser);
    } catch (error) {
      console.warn('[QuoteService] IndexedDB add failed:', error);
    }
  }

  // 2. Invalidate cache
  await cacheManager.invalidate('quotes');

  if (!navigator.onLine || !userId) {
    queueChange?.({ type: 'create', table: 'quotes', data: quoteWithUser });
    return quoteWithUser;
  }

  // 3. Save to Supabase
  try {
    const dbQuote = toSnakeCase(quoteWithUser);
    const { data: insertedData, error } = await executeWithPool(async (signal) => {
      return await (supabase
        .from('quotes' as any)
        .insert(dbQuote as any)
        .select()
        .single() as any).abortSignal(signal);
    }, 15000, `create-quote-${quote.id}`);

    if (error) throw error;

    console.log('✅ Quote created in Supabase');
    dispatchDataRefresh('quotes-changed');

    // Return the server-side object (with shareToken, timestamps, etc.)
    const createdQuote = toCamelCase(insertedData) as Quote;

    // CRITICAL: Ensure IndexedDB is updated with the server-returned data
    if (isIndexedDBSupported() && userId) {
      try {
        const quoteWithUserId = { ...createdQuote, userId };
        await QuoteDB.update(quoteWithUserId);
        console.log('[QuoteService] ✅ IndexedDB updated with created quote');
      } catch (error) {
        console.warn('[QuoteService] ⚠️ Failed to update IndexedDB after quote creation:', error);
      }
    }

    return createdQuote;
  } catch (error) {
    console.error('⚠️ Error creating quote, queuing for sync:', error);
    queueChange?.({ type: 'create', table: 'quotes', data: quoteWithUser });
    // Return the local object so UI updates
    return quoteWithUser;
  }
}

/**
 * Update an existing quote
 */
export async function updateQuote(
  userId: string | undefined,
  organizationId: string | null,
  id: string,
  updates: Partial<Quote>,
  queueChange?: (change: QueueChange) => void
): Promise<Quote> {
  // Need current state to merge updates
  let currentQuote: Quote | null = null;

  if (isIndexedDBSupported()) {
    currentQuote = await QuoteDB.getById(id);
  }

  if (!currentQuote) {
    const cached = await cacheManager.get<Quote[]>('quotes');
    currentQuote = cached?.find(q => q.id === id) || null;
  }

  // Merge updates
  const updatedQuote = { ...(currentQuote || {}), ...updates } as Quote;

  // 1. Update IndexedDB
  if (isIndexedDBSupported() && userId) {
    try {
      await QuoteDB.update({ ...updatedQuote, userId } as Quote);
    } catch (error) {
      console.warn('[QuoteService] IndexedDB update failed:', error);
    }
  }

  // 2. Invalidate cache
  await cacheManager.invalidate('quotes');
  await cacheManager.invalidate('quotes', id);

  if (!navigator.onLine || !userId) {
    queueChange?.({ type: 'update', table: 'quotes', data: { id, ...updates } });
    return updatedQuote;
  }

  // 3. Update Supabase
  try {
    const dbUpdates = toSnakeCase(updates);
    const { error } = await executeWithPool(async (signal) => {
      let query = supabase
        .from('quotes' as any)
        .update(dbUpdates as unknown)
        .eq('id', id);

      // If not in an organization context, strictly enforce user_id matching
      // If in an organization, allow RLS to handle permission (to allow owner/admin updates)
      if (!organizationId) {
        query = query.eq('user_id', userId);
      }
      return await (query.select().single() as any).abortSignal(signal);
    }, 15000, `update-quote-${id}`);

    if (error) throw error;

    dispatchDataRefresh('quotes-changed');
    return updatedQuote;
  } catch (error) {
    console.error('Error updating quote:', error);
    queueChange?.({ type: 'update', table: 'quotes', data: { id, ...updates } });
    return updatedQuote;
  }
}

/**
 * Delete a quote
 */
export async function deleteQuote(
  userId: string | undefined,
  organizationId: string | null,
  id: string,
  queueChange?: (change: QueueChange) => void
): Promise<void> {
  console.log(`[QuoteService] ========== DELETING QUOTE ${id} ==========`);

  // 1. Delete from IndexedDB
  if (isIndexedDBSupported()) {
    try {
      await QuoteDB.delete(id);
      console.log('[QuoteService] ✓ Deleted from IndexedDB');
    } catch (error) {
      console.warn('[QuoteService] IndexedDB delete failed:', error);
    }
  }

  // 2. Clear caches
  try {
    await cacheManager.invalidate('quotes');
    await cacheManager.invalidate('quotes', id);

    // CRITICAL: Clear localStorage specific keys
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes(`quote-${id}`) || key.includes(`quote_${id}`)) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('[QuoteService] Cache clear failed:', e);
  }

  if (!navigator.onLine || !userId) {
    console.log('[QuoteService] Offline - queuing delete');
    queueChange?.({ type: 'delete', table: 'quotes', data: { id } });
    return;
  }

  // 3. Delete from Supabase
  try {
    let query = supabase
      .from('quotes' as any)
      .delete()
      .eq('id', id);

    // If not in an organization context, strictly enforce user_id matching
    // If in an organization, allow RLS to handle permission (to allow owner/admin deletes)
    if (!organizationId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await executeWithPool(async (signal) => {
      return await (query as any).abortSignal(signal);
    }, 15000, `delete-quote-${id}`);

    if (error) throw error;

    console.log('[QuoteService] ✓ Deleted from Supabase');
    dispatchDataRefresh('quotes-changed');
  } catch (error) {
    console.error('[QuoteService] Supabase delete failed:', error);
    queueChange?.({ type: 'delete', table: 'quotes', data: { id } });
  }
}

/**
 * Clear ALL quotes for a user (Testing/Debug/Nuclear)
 */
export async function clearAllQuotes(
  userId: string,
  organizationId: string | null = null
): Promise<void> {
  console.log(`[QuoteService] ========== CLEARING ALL QUOTES ==========`);

  try {
    // 1. Clear IndexedDB
    if (isIndexedDBSupported()) {
      await QuoteDB.clear(userId);
      console.log('[QuoteService] ✓ Cleared IndexedDB');
    }

    // 2. Clear Cache & LocalStorage
    await cacheManager.invalidate('quotes');

    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('quotes') || key.includes('quote-')) {
        localStorage.removeItem(key);
      }
    });
    console.log('[QuoteService] ✓ Cleared Cache & Storage');

    // 3. Clear Supabase
    if (navigator.onLine) {
      const { error } = await supabase
        .from('quotes' as any)
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      console.log('[QuoteService] ✓ Cleared Supabase');
    }

    dispatchDataRefresh('quotes-changed');
  } catch (error) {
    console.error('[QuoteService] Error clearing quotes:', error);
    throw error;
  }
}