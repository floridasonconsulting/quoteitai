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
      return cached;
    }

    // Try IndexedDB if cache miss
    if (isIndexedDBSupported()) {
      try {
        const indexedDBData = await QuoteDB.getAll(userId);
        if (indexedDBData && indexedDBData.length > 0) {
          console.log(`[QuoteService] Retrieved ${indexedDBData.length} quotes from IndexedDB`);
          // Update cache
          await cacheManager.set('quotes', indexedDBData);
          return indexedDBData;
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
        );
        
        const { data, error } = await withTimeout(dbQueryPromise, 15000);
        
        if (error) {
          console.error('Error fetching quotes:', error);
          if (cached) {
            console.log('[Cache] Using cached quotes after error');
            return cached;
          }
          throw error;
        }
        
        const result = data ? data.map(item => toCamelCase(item)) as Quote[] : [];
        
        // Save to IndexedDB if supported and we received data
        if (isIndexedDBSupported() && result.length > 0) {
          try {
            // Only save the records we received from Supabase
            // This preserves any offline-created records that haven't synced yet
            for (const quote of result) {
              await QuoteDB.update({ ...quote, user_id: userId } as never);
            }
            console.log(`[QuoteService] Saved ${result.length} quotes to IndexedDB`);
          } catch (error) {
            console.warn('[QuoteService] Failed to save to IndexedDB:', error);
          }
        }
        
        // Update cache
        await cacheManager.set('quotes', result);
        
        return result;
      } catch (error) {
        console.error('Error fetching quotes:', error);
        if (cached) {
          console.log('[Cache] Returning cached quotes after timeout');
          return cached;
        }
        return [];
      }
    });
  });
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
  const quoteWithUser = { ...quote, user_id: userId } as Quote;

  // Save to IndexedDB first if supported
  if (isIndexedDBSupported()) {
    try {
      await QuoteDB.add(quoteWithUser as never);
      console.log('[QuoteService] Saved quote to IndexedDB');
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
  if (isIndexedDBSupported()) {
    try {
      await QuoteDB.update({ ...updatedQuote, user_id: userId } as never);
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
 * Priority: IndexedDB + Supabase + Cache
 */
export async function deleteQuote(
  userId: string | undefined,
  id: string,
  queueChange?: (change: QueueChange) => void
): Promise<void> {
  // Delete from IndexedDB
  if (isIndexedDBSupported()) {
    try {
      await QuoteDB.delete(id);
      console.log('[QuoteService] Deleted quote from IndexedDB');
    } catch (error) {
      console.warn('[QuoteService] IndexedDB delete failed:', error);
    }
  }

  // Invalidate cache
  await cacheManager.invalidate('quotes');

  if (!navigator.onLine || !userId) {
    queueChange?.({ type: 'delete', table: 'quotes', data: { id } });
    return;
  }

  try {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    dispatchDataRefresh('quotes-changed');
  } catch (error) {
    console.error('Error deleting quote:', error);
    queueChange?.({ type: 'delete', table: 'quotes', data: { id } });
  }
}
