/**
 * Quote Service
 * Handles all quote-related database operations
 */

import { Quote, QueueChange } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '../cache-manager';
import { dedupedRequest, withTimeout } from './request-pool-service';
import { toCamelCase, toSnakeCase } from './transformation-utils';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';
import { QuoteDB, isIndexedDBSupported } from '../indexed-db';
import { apiTracker } from '@/lib/api-performance-tracker';

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
  console.log(`[QuoteService] Deduplicated ${quotes.length} quotes to ${deduped.length}`);
  return deduped;
}

/**
 * Fetch all quotes for a user
 * Priority: Cache > IndexedDB > Supabase > Empty
 */
export async function getQuotes(userId: string | undefined): Promise<Quote[]> {
  if (!userId) {
    console.warn('⚠️ No user ID - using cache for quotes.');
    const cached = await cacheManager.get<Quote[]>('quotes');
    return cached || [];
  }

  const dedupKey = `fetch-quotes-${userId}`;

  return dedupedRequest(dedupKey, async () => {
    // Check cache first (CacheManager handles memory cache)
    const cached = await cacheManager.get<Quote[]>('quotes');
    if (cached && cached.length > 0) {
      console.log(`[QuoteService] Retrieved ${cached.length} quotes from cache`);
      return deduplicateQuotes(cached);
    }

    // Try IndexedDB if cache miss
    if (isIndexedDBSupported()) {
      try {
        const indexedDBData = await QuoteDB.getAll(userId);
        if (indexedDBData && indexedDBData.length > 0) {
          console.log(`[QuoteService] Retrieved ${indexedDBData.length} quotes from IndexedDB`);
          const dedupedData = deduplicateQuotes(indexedDBData);
          // Update cache
          await cacheManager.set('quotes', dedupedData);
          return dedupedData;
        }
      } catch (error) {
        console.warn('[QuoteService] IndexedDB read failed, falling back to Supabase:', error);
      }
    }

    if (!navigator.onLine) {
      return cached || [];
    }

    // Use cache manager's request coalescing for network requests
    return cacheManager.coalesce(`quotes-${userId}`, async () => {
      try {
        const dbQueryPromise = Promise.resolve(
          supabase
            .from('quotes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        );
        
        const { data, error } = await withTimeout(dbQueryPromise, 15000);
        
        if (error) {
          console.error('Error fetching quotes:', error);
          if (cached) {
            console.log('[QuoteService] Using cached quotes after error');
            return deduplicateQuotes(cached);
          }
          throw error;
        }
        
        const result = data ? data.map(item => toCamelCase(item)) as Quote[] : [];
        const dedupedResult = deduplicateQuotes(result);
        
        console.log(`[QuoteService] Fetched ${dedupedResult.length} quotes from Supabase`);
        
        // Save to IndexedDB if supported and we received data
        if (isIndexedDBSupported() && dedupedResult.length > 0) {
          try {
            // CRITICAL: Clear existing quotes for this user FIRST to prevent duplicates
            console.log('[QuoteService] Clearing existing IndexedDB quotes before sync...');
            await QuoteDB.clear(userId);
            
            // Add fresh quotes from Supabase
            console.log(`[QuoteService] Adding ${dedupedResult.length} quotes to IndexedDB...`);
            for (const quote of dedupedResult) {
              await QuoteDB.add({ ...quote, userId } as Quote);
            }
            console.log(`[QuoteService] ✓ Synced ${dedupedResult.length} quotes to IndexedDB`);
          } catch (error) {
            console.warn('[QuoteService] Failed to sync to IndexedDB:', error);
          }
        }
        
        // Update cache
        await cacheManager.set('quotes', dedupedResult);
        
        return dedupedResult;
      } catch (error) {
        console.error('Error fetching quotes:', error);
        if (cached) {
          console.log('[QuoteService] Returning cached quotes after timeout');
          return deduplicateQuotes(cached);
        }
        return [];
      }
    });
  });
}

/**
 * Fetch a single quote by its ID
 * Priority: Cache > IndexedDB > Supabase
 */
export async function getQuote(userId: string, id: string): Promise<Quote | null> {
  const cacheKey = `quote-${id}`;
  
  // 1. Check memory cache
  const cached = await cacheManager.get<Quote>(cacheKey);
  if (cached) {
    console.log(`[QuoteService] Retrieved quote ${id} from memory cache`);
    return cached;
  }

  // 2. Try IndexedDB
  if (isIndexedDBSupported()) {
    try {
      const indexedDBData = await QuoteDB.getById(id);
      if (indexedDBData && indexedDBData.userId === userId) {
        console.log(`[QuoteService] Retrieved quote ${id} from IndexedDB`);
        // Update memory cache
        await cacheManager.set(cacheKey, indexedDBData);
        return indexedDBData;
      }
    } catch (error) {
      console.warn(`[QuoteService] IndexedDB read for quote ${id} failed, falling back to Supabase:`, error);
    }
  }

  if (!navigator.onLine) {
    console.log("[QuoteService] Offline, cannot fetch quote from Supabase.");
    const allQuotes = await getQuotes(userId);
    const quoteFromList = allQuotes.find(q => q.id === id);
    if(quoteFromList) await cacheManager.set(cacheKey, quoteFromList);
    return quoteFromList || null;
  }

  // 3. Fetch from Supabase
  try {
    const apiCall = supabase
      .from("quotes")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .single();

    const { data, error } = await withTimeout(apiCall, 10000);

    if (error) {
      // PGRST116: "exact one row was not found" - this is not a fatal error
      if (error.code !== "PGRST116") {
        console.error(`Error fetching quote ${id}:`, error);
      }
      return null;
    }

    if (!data) {
      return null;
    }

    const result = toCamelCase(data) as Quote;

    // Save to IndexedDB (upsert logic)
    if (isIndexedDBSupported()) {
      try {
        // Check if exists first
        const existing = await QuoteDB.getById(id);
        if (existing) {
          await QuoteDB.update({ ...result, userId } as Quote);
          console.log(`[QuoteService] Updated quote ${id} in IndexedDB`);
        } else {
          await QuoteDB.add({ ...result, userId } as Quote);
          console.log(`[QuoteService] Added quote ${id} to IndexedDB`);
        }
      } catch (dbError) {
        console.warn("[QuoteService] Failed to save quote to IndexedDB:", dbError);
      }
    }

    // Update memory cache
    await cacheManager.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error(`Error fetching quote ${id}:`, error);
    return null;
  }
}

/**
 * Create a new quote
 * Priority: Supabase + IndexedDB + Cache
 */
export async function addQuote(
  userId: string | undefined,
  quote: Quote,
  queueChange?: (change: QueueChange) => void
): Promise<Quote> {
  const quoteWithUser = { ...quote, userId } as Quote;

  // Save to IndexedDB first if supported
  if (isIndexedDBSupported() && userId) {
    try {
      await QuoteDB.add(quoteWithUser);
      console.log('[QuoteService] Saved new quote to IndexedDB');
    } catch (error) {
      console.warn('[QuoteService] IndexedDB save failed:', error);
    }
  }

  // Invalidate cache to force refresh
  await cacheManager.invalidate('quotes');

  if (!navigator.onLine || !userId) {
    if (!userId) {
      console.warn('⚠️ No user ID - quote saved to IndexedDB only.');
    }
    queueChange?.({ type: 'create', table: 'quotes', data: quoteWithUser });
    return quoteWithUser;
  }

  try {
    const dbQuote = toSnakeCase(quoteWithUser);
    const { error } = await supabase.from('quotes').insert(dbQuote as unknown);
    
    if (error) {
      console.error('❌ Database insert failed for quote:', error);
      throw error;
    }
    
    console.log('✅ Successfully inserted quote into database');
    
    dispatchDataRefresh('quotes-changed');
    
    return quoteWithUser;
  } catch (error) {
    console.error('⚠️ Error creating quote, queued for sync:', error);
    queueChange?.({ type: 'create', table: 'quotes', data: quoteWithUser });
    throw error;
  }
}

/**
 * Update an existing quote
 * Priority: IndexedDB + Supabase + Cache
 */
export async function updateQuote(
  userId: string | undefined,
  id: string,
  updates: Partial<Quote>,
  queueChange?: (change: QueueChange) => void
): Promise<Quote> {
  // Get current quote data
  let currentQuote: Quote | undefined;
  
  if (isIndexedDBSupported()) {
    try {
      const indexedQuote = await QuoteDB.getById(id);
      if (indexedQuote) {
        currentQuote = indexedQuote;
      }
    } catch (error) {
      console.warn('[QuoteService] IndexedDB read failed:', error);
    }
  }
  
  if (!currentQuote) {
    const cached = await cacheManager.get<Quote[]>('quotes');
    currentQuote = cached?.find(q => q.id === id);
  }

  const updatedQuote = { ...currentQuote, ...updates } as Quote;

  // Update IndexedDB
  if (isIndexedDBSupported() && userId) {
    try {
      await QuoteDB.update({ ...updatedQuote, userId } as Quote);
      console.log('[QuoteService] Updated quote in IndexedDB');
    } catch (error) {
      console.warn('[QuoteService] IndexedDB update failed:', error);
    }
  }

  // Invalidate cache
  await cacheManager.invalidate('quotes');

  if (!navigator.onLine || !userId) {
    queueChange?.({ type: 'update', table: 'quotes', data: { id, ...updates } });
    return updatedQuote;
  }

  try {
    const dbUpdates = toSnakeCase(updates);
    const { error } = await supabase
      .from('quotes')
      .update(dbUpdates as unknown)
      .eq('id', id)
      .eq('user_id', userId);
    
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
 * Priority: Clear ALL sources (Supabase + IndexedDB + Cache + localStorage)
 */
export async function deleteQuote(
  userId: string | undefined,
  id: string,
  queueChange?: (change: QueueChange) => void
): Promise<void> {
  console.log(`[QuoteService] ========== DELETING QUOTE ${id} ==========`);
  
  // 1. Delete from IndexedDB
  if (isIndexedDBSupported()) {
    try {
      await QuoteDB.delete(id);
      console.log('[QuoteService] ✓ Deleted quote from IndexedDB');
    } catch (error) {
      console.warn('[QuoteService] IndexedDB delete failed:', error);
    }
  }

  // 2. Clear ALL cache entries for quotes
  try {
    // Clear the main quotes cache
    await cacheManager.invalidate('quotes');
    
    // Clear the specific quote cache
    await cacheManager.invalidate('quotes', id);
    
    // CRITICAL: Also clear from localStorage directly
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('quotes:') || key.includes(`quote-${id}`)) {
        localStorage.removeItem(key);
        console.log(`[QuoteService] ✓ Removed localStorage key: ${key}`);
      }
    });
    
    console.log('[QuoteService] ✓ Cleared all quote caches');
  } catch (error) {
    console.warn('[QuoteService] Cache clear failed:', error);
  }

  // 3. Delete from Supabase
  if (!navigator.onLine || !userId) {
    console.log('[QuoteService] Offline - queueing delete for sync');
    queueChange?.({ type: 'delete', table: 'quotes', data: { id } });
    return;
  }

  try {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('[QuoteService] ❌ Supabase delete failed:', error);
      throw error;
    }
    
    console.log('[QuoteService] ✓ Deleted quote from Supabase');
    console.log('[QuoteService] ========== DELETE COMPLETE ==========');
    
    dispatchDataRefresh('quotes-changed');
  } catch (error) {
    console.error('[QuoteService] Error deleting quote:', error);
    queueChange?.({ type: 'delete', table: 'quotes', data: { id } });
  }
}

/**
 * Clear ALL quotes for a user (for testing/debugging)
 */
export async function clearAllQuotes(userId: string): Promise<void> {
  console.log(`[QuoteService] ========== CLEARING ALL QUOTES ==========`);
  
  try {
    // 1. Clear IndexedDB
    if (isIndexedDBSupported()) {
      await QuoteDB.clear(userId);
      console.log('[QuoteService] ✓ Cleared IndexedDB');
    }
    
    // 2. Clear ALL cache entries
    await cacheManager.invalidate('quotes');
    
    // 3. Clear localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('quotes') || key.includes('quote-')) {
        localStorage.removeItem(key);
      }
    });
    console.log('[QuoteService] ✓ Cleared localStorage');
    
    // 4. Clear Supabase
    if (navigator.onLine) {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
      console.log('[QuoteService] ✓ Cleared Supabase');
    }
    
    console.log('[QuoteService] ========== CLEAR COMPLETE ==========');
    dispatchDataRefresh('quotes-changed');
  } catch (error) {
    console.error('[QuoteService] Error clearing quotes:', error);
    throw error;
  }
}