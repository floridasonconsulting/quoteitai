/**
 * Debug Utility for Quote Persistence Issues
 * Helps identify where phantom quotes are being stored
 */

import { supabase } from '@/integrations/supabase/client';
import { QuoteDB, isIndexedDBSupported } from './indexed-db';
import { getQuotes as getStorageQuotes } from './storage';
import { cacheManager } from './cache-manager';
import { Quote } from '@/types';

interface SyncQueueItem {
  type: string;
  table: string;
  data: {
    id: string;
    quoteNumber?: string;
    quote_number?: string;
    [key: string]: unknown;
  };
}

export async function debugQuoteStorage(userId: string) {
  console.log('========================================');
  console.log('🔍 QUOTE STORAGE DEBUG REPORT');
  console.log('========================================');
  console.log('User ID:', userId);
  console.log('Timestamp:', new Date().toISOString());
  console.log('');

  // 1. Check Supabase
  console.log('📊 SUPABASE DATABASE:');
  try {
    const { data: supabaseQuotes, error } = await supabase
      .from('quotes')
      .select('id, quote_number, title, status')
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Supabase error:', error);
    } else {
      console.log(`✅ Found ${supabaseQuotes?.length || 0} quotes in Supabase`);
      supabaseQuotes?.forEach((q, i) => {
        console.log(`  ${i + 1}. [${q.id}] ${q.quote_number} - ${q.title} (${q.status})`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to fetch from Supabase:', error);
  }
  console.log('');

  // 2. Check IndexedDB
  console.log('💾 INDEXEDDB:');
  if (isIndexedDBSupported()) {
    try {
      const indexedDBQuotes = await QuoteDB.getAll(userId);
      console.log(`✅ Found ${indexedDBQuotes.length} quotes in IndexedDB`);
      indexedDBQuotes.forEach((q, i) => {
        console.log(`  ${i + 1}. [${q.id}] ${q.quoteNumber} - ${q.title} (${q.status})`);
      });
    } catch (error) {
      console.error('❌ Failed to read IndexedDB:', error);
    }
  } else {
    console.log('⚠️ IndexedDB not supported');
  }
  console.log('');

  // 3. Check localStorage
  console.log('📦 LOCALSTORAGE:');
  try {
    const storageQuotes = getStorageQuotes(userId);
    console.log(`✅ Found ${storageQuotes.length} quotes in localStorage`);
    storageQuotes.forEach((q, i) => {
      console.log(`  ${i + 1}. [${q.id}] ${q.quoteNumber} - ${q.title} (${q.status})`);
    });
  } catch (error) {
    console.error('❌ Failed to read localStorage:', error);
  }
  console.log('');

  // 4. Check memory cache
  console.log('🧠 MEMORY CACHE:');
  try {
    const cachedQuotes = await cacheManager.get<Quote[]>('quotes');
    if (cachedQuotes) {
      console.log(`✅ Found ${cachedQuotes.length} quotes in cache`);
      cachedQuotes.forEach((q, i) => {
        console.log(`  ${i + 1}. [${q.id}] ${q.quoteNumber} - ${q.title} (${q.status})`);
      });
    } else {
      console.log('✅ No quotes in memory cache');
    }
  } catch (error) {
    console.error('❌ Failed to read cache:', error);
  }
  console.log('');

  // 5. Check sync queue
  console.log('🔄 SYNC QUEUE:');
  try {
    const queueJSON = localStorage.getItem('offline-changes-queue');
    if (queueJSON) {
      const queue = JSON.parse(queueJSON) as SyncQueueItem[];
      const quoteOperations = queue.filter((item) => item.table === 'quotes');
      console.log(`✅ Found ${quoteOperations.length} quote operations in sync queue`);
      quoteOperations.forEach((op, i) => {
        console.log(`  ${i + 1}. ${op.type.toUpperCase()} - [${op.data.id}] ${op.data.quoteNumber || op.data.quote_number}`);
      });
    } else {
      console.log('✅ Sync queue is empty');
    }
  } catch (error) {
    console.error('❌ Failed to read sync queue:', error);
  }
  console.log('');

  // 6. Check for duplicate IDs
  console.log('🔍 DUPLICATE CHECK:');
  const allQuoteIds: string[] = [];
  const duplicates: string[] = [];

  // Add IDs from all sources
  try {
    const { data: supabaseQuotes } = await supabase
      .from('quotes')
      .select('id')
      .eq('user_id', userId);
    supabaseQuotes?.forEach(q => {
      if (allQuoteIds.includes(q.id)) {
        duplicates.push(q.id);
      } else {
        allQuoteIds.push(q.id);
      }
    });

    if (isIndexedDBSupported()) {
      const indexedDBQuotes = await QuoteDB.getAll(userId);
      indexedDBQuotes.forEach(q => {
        if (allQuoteIds.includes(q.id)) {
          duplicates.push(q.id);
        } else {
          allQuoteIds.push(q.id);
        }
      });
    }

    const storageQuotes = getStorageQuotes(userId);
    storageQuotes.forEach(q => {
      if (allQuoteIds.includes(q.id)) {
        duplicates.push(q.id);
      } else {
        allQuoteIds.push(q.id);
      }
    });

    if (duplicates.length > 0) {
      console.log(`⚠️ Found ${duplicates.length} duplicate quote IDs across storage layers:`);
      duplicates.forEach(id => console.log(`  - ${id}`));
    } else {
      console.log('✅ No duplicate IDs found');
    }
  } catch (error) {
    console.error('❌ Failed duplicate check:', error);
  }

  console.log('');
  console.log('========================================');
  console.log('🏁 DEBUG REPORT COMPLETE');
  console.log('========================================');
}

/**
 * Nuclear option: Clear ALL quote data from ALL sources
 */
export async function nuclearClearAllQuotes(userId: string) {
  console.log('☢️ NUCLEAR CLEAR: Removing ALL quote data from ALL sources...');

  // 1. Clear Supabase
  try {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
    console.log('✅ Cleared Supabase');
  } catch (error) {
    console.error('❌ Failed to clear Supabase:', error);
  }

  // 2. Clear IndexedDB
  if (isIndexedDBSupported()) {
    try {
      await QuoteDB.clear(userId);
      console.log('✅ Cleared IndexedDB');
    } catch (error) {
      console.error('❌ Failed to clear IndexedDB:', error);
    }
  }

  // 3. Clear localStorage (all quote-related keys)
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('quotes') || key.includes('quote-') || key.includes('quote_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('✅ Cleared localStorage');
  } catch (error) {
    console.error('❌ Failed to clear localStorage:', error);
  }

  // 4. Clear memory cache
  try {
    await cacheManager.invalidate('quotes');
    console.log('✅ Cleared memory cache');
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }

  // 5. Clear sync queue
  try {
    const queueJSON = localStorage.getItem('offline-changes-queue');
    if (queueJSON) {
      const queue = JSON.parse(queueJSON) as SyncQueueItem[];
      const filtered = queue.filter((item) => item.table !== 'quotes');
      localStorage.setItem('offline-changes-queue', JSON.stringify(filtered));
    }
    console.log('✅ Cleared sync queue');
  } catch (error) {
    console.error('❌ Failed to clear sync queue:', error);
  }

  console.log('☢️ NUCLEAR CLEAR COMPLETE');
  console.log('⚠️ Recommendation: Refresh the page now to verify all quotes are gone');
}

// Export to window for easy console access
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.debugQuoteStorage = debugQuoteStorage;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.nuclearClearAllQuotes = nuclearClearAllQuotes;
}