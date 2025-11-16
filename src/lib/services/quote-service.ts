
/**
 * Quote Service
 * Handles all quote-related database operations
 */

import { Quote, QueueChange } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_KEYS, getCachedData, setCachedData } from './cache-service';
import { dedupedRequest, withTimeout } from './request-pool-service';
import { toCamelCase, toSnakeCase } from './transformation-utils';
import { dispatchDataRefresh } from '@/hooks/useDataRefresh';

/**
 * Fetch all quotes for a user
 */
export async function getQuotes(userId: string | undefined): Promise<Quote[]> {
  if (!userId) {
    console.warn('⚠️ No user ID - using cache for quotes.');
    return getCachedData<Quote>(CACHE_KEYS.QUOTES) || [];
  }

  const dedupKey = `fetch-quotes-${userId}`;

  return dedupedRequest(dedupKey, async () => {
    const cached = getCachedData<Quote>(CACHE_KEYS.QUOTES);
    
    if (!navigator.onLine) {
      return cached || [];
    }

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
      setCachedData<Quote>(CACHE_KEYS.QUOTES, result);
      
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
}

/**
 * Create a new quote
 */
export async function addQuote(
  userId: string | undefined,
  quote: Quote,
  queueChange?: (change: QueueChange) => void
): Promise<Quote> {
  const quoteWithUser = { ...quote, user_id: userId } as Quote;

  if (!navigator.onLine || !userId) {
    if (!userId) {
      console.warn('⚠️ No user ID - saving quote to localStorage only.');
    }
    const cached = getCachedData<Quote>(CACHE_KEYS.QUOTES) || [];
    setCachedData<Quote>(CACHE_KEYS.QUOTES, [...cached, quoteWithUser]);
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
    const cached = getCachedData<Quote>(CACHE_KEYS.QUOTES) || [];
    setCachedData<Quote>(CACHE_KEYS.QUOTES, [...cached, quoteWithUser]);
    
    dispatchDataRefresh('quotes-changed');
    
    return quoteWithUser;
  } catch (error) {
    console.error('⚠️ Error creating quote, falling back to localStorage:', error);
    const cached = getCachedData<Quote>(CACHE_KEYS.QUOTES) || [];
    setCachedData<Quote>(CACHE_KEYS.QUOTES, [...cached, quoteWithUser]);
    queueChange?.({ type: 'create', table: 'quotes', data: quoteWithUser });
    throw error;
  }
}

/**
 * Update an existing quote
 */
export async function updateQuote(
  userId: string | undefined,
  id: string,
  updates: Partial<Quote>,
  queueChange?: (change: QueueChange) => void
): Promise<Quote> {
  if (!navigator.onLine || !userId) {
    const cached = getCachedData<Quote>(CACHE_KEYS.QUOTES) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as Quote : item
    );
    setCachedData<Quote>(CACHE_KEYS.QUOTES, updated);
    queueChange?.({ type: 'update', table: 'quotes', data: { id, ...updates } });
    return updated.find(item => item.id === id)!;
  }

  try {
    const dbUpdates = toSnakeCase(updates);
    const { error } = await supabase
      .from('quotes')
      .update(dbUpdates as unknown)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const cached = getCachedData<Quote>(CACHE_KEYS.QUOTES) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as Quote : item
    );
    setCachedData<Quote>(CACHE_KEYS.QUOTES, updated);
    
    dispatchDataRefresh('quotes-changed');
    
    return updated.find(item => item.id === id)!;
  } catch (error) {
    console.error('Error updating quote:', error);
    const cached = getCachedData<Quote>(CACHE_KEYS.QUOTES) || [];
    const updated = cached.map(item => 
      item.id === id ? { ...item, ...updates } as Quote : item
    );
    setCachedData<Quote>(CACHE_KEYS.QUOTES, updated);
    queueChange?.({ type: 'update', table: 'quotes', data: { id, ...updates } });
    return updated.find(item => item.id === id)!;
  }
}

/**
 * Delete a quote
 */
export async function deleteQuote(
  userId: string | undefined,
  id: string,
  queueChange?: (change: QueueChange) => void
): Promise<void> {
  if (!navigator.onLine || !userId) {
    const cached = getCachedData<Quote>(CACHE_KEYS.QUOTES) || [];
    setCachedData<Quote>(CACHE_KEYS.QUOTES, cached.filter(item => item.id !== id));
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
    
    const cached = getCachedData<Quote>(CACHE_KEYS.QUOTES) || [];
    setCachedData<Quote>(CACHE_KEYS.QUOTES, cached.filter(item => item.id !== id));
    
    dispatchDataRefresh('quotes-changed');
  } catch (error) {
    console.error('Error deleting quote:', error);
    const cached = getCachedData<Quote>(CACHE_KEYS.QUOTES) || [];
    setCachedData<Quote>(CACHE_KEYS.QUOTES, cached.filter(item => item.id !== id));
    queueChange?.({ type: 'delete', table: 'quotes', data: { id } });
  }
}
