import { parseCSVLine } from './csv-utils';
import { addCustomer, addItem, addQuote, saveSettings } from './db-service';
import { Customer, Item, Quote, CompanySettings } from '@/types';

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  overwritten: number;
  errors: string[];
}

export type DuplicateStrategy = 'skip' | 'overwrite' | 'error';

export async function importCustomersFromCSV(
  csvContent: string, 
  userId: string,
  duplicateStrategy: DuplicateStrategy = 'skip'
): Promise<ImportResult> {
  const lines = csvContent
    .trim()
    .split(/\r?\n|\r/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
    
  if (lines.length < 2) {
    return { success: 0, failed: 0, skipped: 0, overwritten: 0, errors: ['CSV file is empty or has no data rows'] };
  }
  
  const headers = parseCSVLine(lines[0]);
  const result: ImportResult = { success: 0, failed: 0, skipped: 0, overwritten: 0, errors: [] };

  const { getCustomers, updateCustomer } = await import('./db-service');
  const existingCustomers = await getCustomers(userId);

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        result.failed++;
        result.errors.push(
          `Line ${i + 1}: Column count mismatch. Expected ${headers.length} columns, found ${values.length}`
        );
        continue;
      }
      
      const customer: Partial<Customer> = {};
      headers.forEach((header, index) => {
        (customer as Record<string, unknown>)[header.trim()] = values[index] || '';
      });

      const existingCustomer = existingCustomers.find(
        existing => existing.name === customer.name && existing.email === customer.email
      );

      if (existingCustomer) {
        if (duplicateStrategy === 'skip') {
          result.skipped++;
          continue;
        } else if (duplicateStrategy === 'error') {
          result.failed++;
          result.errors.push(`Line ${i + 1}: Duplicate customer: ${customer.name} (${customer.email})`);
          continue;
        } else if (duplicateStrategy === 'overwrite') {
          await updateCustomer(userId, existingCustomer.id, customer as Customer);
          result.overwritten++;
          continue;
        }
      }

      await addCustomer(userId, customer as Customer);
      result.success++;
    } catch (error) {
      result.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('violates')) {
        result.errors.push(`Line ${i + 1}: Database constraint violation - ${errorMsg}`);
      } else {
        result.errors.push(`Line ${i + 1}: ${errorMsg}`);
      }
    }
  }

  return result;
}

export async function importItemsFromCSV(
  csvContent: string, 
  userId: string,
  duplicateStrategy: DuplicateStrategy = 'skip'
): Promise<ImportResult> {
  const lines = csvContent
    .trim()
    .split(/\r?\n|\r/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
    
  if (lines.length < 2) {
    console.log('[CSV Import] CSV is empty or has no data rows');
    return { success: 0, failed: 0, skipped: 0, overwritten: 0, errors: ['CSV file is empty or has no data rows'] };
  }
  
  const headers = parseCSVLine(lines[0]);
  console.log('[CSV Import] ========== IMPORT STARTED ==========');
  console.log('[CSV Import] Headers detected:', headers);
  console.log('[CSV Import] Total lines to import:', lines.length - 1);
  
  const result: ImportResult = { success: 0, failed: 0, skipped: 0, overwritten: 0, errors: [] };

  const { getItems, updateItem } = await import('./db-service');
  const existingItems = await getItems(userId);

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      console.log(`\n[CSV Import] ========== LINE ${i + 1} ==========`);
      console.log(`[CSV Import] Raw values:`, values);
      
      if (values.length !== headers.length) {
        result.failed++;
        result.errors.push(
          `Line ${i + 1}: Column count mismatch. Expected ${headers.length} columns, found ${values.length}`
        );
        console.error(`[CSV Import] Column count mismatch on line ${i + 1}`);
        continue;
      }
      
      const item: Partial<Item> = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        const headerName = header.trim();
        
        if (['basePrice', 'finalPrice'].includes(headerName)) {
          (item as Record<string, unknown>)[headerName] = parseFloat(value) || 0;
        } else if (headerName === 'minQuantity') {
          const parsed = parseInt(value, 10);
          const minQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
          (item as Record<string, unknown>)[headerName] = minQty;
          console.log(`[CSV Import] minQuantity parsed: "${value}" -> ${minQty}`);
        } else if (headerName === 'imageUrl') {
          const trimmedUrl = value.trim();
          if (trimmedUrl && trimmedUrl.length > 0) {
            (item as Record<string, unknown>)[headerName] = trimmedUrl;
            console.log(`[CSV Import] imageUrl set: ${trimmedUrl.substring(0, 50)}...`);
          } else {
            console.log(`[CSV Import] imageUrl is empty, skipping`);
          }
        } else if (headerName === 'markup') {
          const markupValue = value.trim();
          if (markupValue.includes('%')) {
            item.markup = parseFloat(markupValue.replace('%', '')) || 0;
            if (!item.markupType) item.markupType = 'percentage';
          } else if (markupValue.includes('$')) {
            item.markup = parseFloat(markupValue.replace('$', '')) || 0;
            if (!item.markupType) item.markupType = 'fixed';
          } else {
            item.markup = parseFloat(markupValue) || 0;
          }
        } else {
          (item as Record<string, unknown>)[headerName] = value;
        }
      });

      console.log(`[CSV Import] Parsed item data:`, {
        name: item.name,
        category: item.category,
        basePrice: item.basePrice,
        finalPrice: item.finalPrice,
        minQuantity: item.minQuantity,
        hasImageUrl: !!item.imageUrl,
        imageUrl: item.imageUrl ? item.imageUrl.substring(0, 50) + '...' : undefined
      });

      // Calculate finalPrice if not provided
      const basePrice = item.basePrice || 0;
      const markup = item.markup || 0;
      const markupType = item.markupType || 'percentage';
      
      if (!item.finalPrice || item.finalPrice === 0) {
        if (markupType === 'percentage') {
          item.finalPrice = basePrice + (basePrice * markup / 100);
        } else if (markupType === 'fixed') {
          item.finalPrice = basePrice + markup;
        } else {
          item.finalPrice = basePrice;
        }
        console.log(`[CSV Import] Calculated finalPrice: ${item.finalPrice}`);
      }

      // Validate markup_type
      if (item.markupType && !['percentage', 'fixed'].includes(item.markupType)) {
        result.failed++;
        result.errors.push(`Line ${i + 1}: Invalid markupType "${item.markupType}". Must be "percentage" or "fixed"`);
        console.error(`[CSV Import] Invalid markupType: ${item.markupType}`);
        continue;
      }

      // Check for duplicates
      const existingItem = existingItems.find(
        existing => existing.name === item.name && existing.category === item.category
      );

      if (existingItem) {
        if (duplicateStrategy === 'skip') {
          result.skipped++;
          console.log(`[CSV Import] Skipping duplicate: ${item.name}`);
          continue;
        } else if (duplicateStrategy === 'error') {
          result.failed++;
          result.errors.push(`Line ${i + 1}: Duplicate item: ${item.name} in ${item.category}`);
          console.error(`[CSV Import] Duplicate detected: ${item.name}`);
          continue;
        } else if (duplicateStrategy === 'overwrite') {
          await updateItem(userId, existingItem.id, item as Item);
          result.overwritten++;
          console.log(`[CSV Import] Overwritten: ${item.name}`);
          continue;
        }
      }

      // Create new item with ALL fields
      const newItem: Item = {
        id: crypto.randomUUID(),
        name: item.name as string,
        description: item.description as string,
        category: item.category as string,
        basePrice: item.basePrice as number,
        markup: item.markup as number,
        markupType: item.markupType as 'percentage' | 'fixed',
        finalPrice: item.finalPrice as number,
        units: item.units as string,
        minQuantity: item.minQuantity as number | undefined,
        imageUrl: item.imageUrl as string | undefined,
        createdAt: new Date().toISOString(),
      };
      
      console.log(`[CSV Import] Creating item:`, {
        name: newItem.name,
        minQuantity: newItem.minQuantity,
        hasImageUrl: !!newItem.imageUrl
      });
      
      await addItem(userId, newItem);
      result.success++;
      console.log(`[CSV Import] ✓ Successfully imported: ${newItem.name}`);
    } catch (error) {
      result.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[CSV Import] ✗ Error on line ${i + 1}:`, error);
      if (errorMsg.includes('violates') || errorMsg.includes('constraint')) {
        result.errors.push(`Line ${i + 1}: Database constraint violation - ${errorMsg}`);
      } else {
        result.errors.push(`Line ${i + 1}: ${errorMsg}`);
      }
    }
  }

  console.log('[CSV Import] ========== IMPORT COMPLETE ==========');
  console.log('[CSV Import] Results:', result);
  return result;
}

export async function importQuotesFromCSV(csvContent: string, userId: string): Promise<ImportResult> {
  const lines = csvContent
    .trim()
    .split(/\r?\n|\r/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
    
  if (lines.length < 2) {
    console.log('[Import] Quotes CSV is empty or has no data rows');
    return { success: 0, failed: 0, skipped: 0, overwritten: 0, errors: ['CSV file is empty or has no data rows'] };
  }
  
  const headers = parseCSVLine(lines[0]);
  const result: ImportResult = { success: 0, failed: 0, skipped: 0, overwritten: 0, errors: [] };

  console.log(`[Import] Starting quote import with ${lines.length - 1} rows`);

  const { getQuotes, getCustomers } = await import('./db-service');
  const existingQuotes = await getQuotes(userId);
  const existingCustomers = await getCustomers(userId);

  console.log(`[Import] Found ${existingQuotes.length} existing quotes`);
  console.log(`[Import] Found ${existingCustomers.length} existing customers for mapping`);

  const validStatuses = ['draft', 'sent', 'accepted', 'declined'];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        result.failed++;
        result.errors.push(
          `Line ${i + 1}: Column count mismatch. Expected ${headers.length} columns, found ${values.length}`
        );
        continue;
      }
      
      const quote: Partial<Quote> = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        const headerName = header.trim();
        
        if (headerName === 'items') {
          try {
            (quote as Record<string, unknown>)[headerName] = value ? JSON.parse(value) : [];
          } catch (e) {
            (quote as Record<string, unknown>)[headerName] = [];
          }
        } else if (['subtotal', 'tax', 'total'].includes(headerName)) {
          (quote as Record<string, unknown>)[headerName] = parseFloat(value) || 0;
        } else if (['sentDate', 'followUpDate'].includes(headerName)) {
          (quote as Record<string, unknown>)[headerName] = value || null;
        } else {
          (quote as Record<string, unknown>)[headerName] = value;
        }
      });

      const isDuplicate = existingQuotes.some(
        existing => existing.quoteNumber === quote.quoteNumber
      );

      if (isDuplicate) {
        console.log(`[Import] Skipping duplicate quote: ${quote.quoteNumber}`);
        result.skipped++;
        continue;
      }

      if (!quote.quoteNumber || !quote.customerName || !quote.title) {
        result.failed++;
        result.errors.push(`Line ${i + 1}: Missing required fields (quoteNumber, customerName, or title)`);
        console.error(`[Import] Quote validation failed at line ${i + 1}: Missing required fields`);
        continue;
      }

      if (quote.status && !validStatuses.includes(quote.status)) {
        result.failed++;
        result.errors.push(`Line ${i + 1}: Invalid status "${quote.status}". Must be "draft", "sent", "accepted", or "declined"`);
        console.error(`[Import] Quote validation failed at line ${i + 1}: Invalid status`);
        continue;
      }

      if (quote.customerName) {
        const matchingCustomer = existingCustomers.find(
          c => c.name === quote.customerName
        );
        
        if (matchingCustomer) {
          quote.customer_id = matchingCustomer.id;
          console.log(`[Import] Mapped customer "${quote.customerName}" to UUID: ${matchingCustomer.id}`);
        } else {
          quote.customer_id = null;
          console.log(`[Import] No matching customer found for "${quote.customerName}", setting customer_id to null`);
        }
      } else {
        quote.customer_id = null;
      }

      delete (quote as Partial<Quote & { customerId: string }>).customerId;

      console.log(`[Import] Adding quote: ${quote.quoteNumber} - ${quote.title}`);
      await addQuote(userId, quote as Quote);
      console.log(`[Import] Successfully added quote: ${quote.quoteNumber}`);
      result.success++;
    } catch (error) {
      result.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Import] Quote import error at line ${i + 1}:`, error);
      if (errorMsg.includes('violates') || errorMsg.includes('constraint')) {
        result.errors.push(`Line ${i + 1}: Database constraint violation - ${errorMsg}`);
      } else {
        result.errors.push(`Line ${i + 1}: ${errorMsg}`);
      }
    }
  }

  console.log(`[Import] Quote import complete. Success: ${result.success}, Failed: ${result.failed}, Skipped: ${result.skipped}`);
  return result;
}

export async function importCompanySettingsFromCSV(csvContent: string, userId: string): Promise<void> {
  const lines = csvContent.trim().split('\n');
  const settings: Partial<CompanySettings> = {};

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= 2) {
      const field = values[0].trim();
      const value = values[1].trim();
      (settings as Record<string, unknown>)[field] = value;
    }
  }

  await saveSettings(userId, settings as CompanySettings);
}

export function validateItemsCSV(csvContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = csvContent.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  
  const validMarkupTypes = ['percentage', 'fixed'];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const item: Record<string, string> = {};
    headers.forEach((header, index) => {
      item[header.trim()] = values[index] || '';
    });
    
    if (item.markupType && !validMarkupTypes.includes(item.markupType)) {
      errors.push(`Line ${i + 1}: Invalid markupType "${item.markupType}". Must be "percentage" or "fixed"`);
    }
    
    if (!item.name) {
      errors.push(`Line ${i + 1}: Missing required field "name"`);
    }
    
    if (item.basePrice && isNaN(parseFloat(item.basePrice))) {
      errors.push(`Line ${i + 1}: Invalid basePrice "${item.basePrice}"`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateQuotesCSV(csvContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = csvContent.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  
  const validStatuses = ['draft', 'sent', 'accepted', 'declined'];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const quote: Record<string, string> = {};
    headers.forEach((header, index) => {
      quote[header.trim()] = values[index] || '';
    });
    
    if (!quote.quoteNumber) {
      errors.push(`Line ${i + 1}: Missing required field "quoteNumber"`);
    }
    if (!quote.customerName) {
      errors.push(`Line ${i + 1}: Missing required field "customerName"`);
    }
    if (!quote.title) {
      errors.push(`Line ${i + 1}: Missing required field "title"`);
    }
    
    if (quote.status && !validStatuses.includes(quote.status)) {
      errors.push(`Line ${i + 1}: Invalid status "${quote.status}". Must be "draft", "sent", "accepted", or "declined"`);
    }
    
    if (quote.items) {
      try {
        JSON.parse(quote.items);
      } catch (e) {
        errors.push(`Line ${i + 1}: Invalid JSON in items field`);
      }
    }
    
    if (quote.subtotal && isNaN(parseFloat(quote.subtotal))) {
      errors.push(`Line ${i + 1}: Invalid subtotal "${quote.subtotal}"`);
    }
    if (quote.tax && isNaN(parseFloat(quote.tax))) {
      errors.push(`Line ${i + 1}: Invalid tax "${quote.tax}"`);
    }
    if (quote.total && isNaN(parseFloat(quote.total))) {
      errors.push(`Line ${i + 1}: Invalid total "${quote.total}"`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export async function loadSampleDataFile(filename: string): Promise<string> {
  const response = await fetch(`/sample-data/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${filename}`);
  }
  return response.text();
}

export async function exportAllData(): Promise<void> {
  try {
    const { getCustomers, getItems, getQuotes, getSettings } = await import('./db-service');
    
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const [customers, items, quotes, settings] = await Promise.all([
      getCustomers(userId),
      getItems(userId),
      getQuotes(userId),
      getSettings(userId),
    ]);

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        customers,
        items,
        quotes,
        settings,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quote-it-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[Export] Failed to export data:', error);
    throw error;
  }
}

export async function importAllData(file: File): Promise<void> {
  try {
    const text = await file.text();
    const importData = JSON.parse(text);

    if (!importData.version || !importData.data) {
      throw new Error('Invalid backup file format');
    }

    const { customers, items, quotes, settings } = importData.data;

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (settings) {
      await saveSettings(userId, settings);
    }

    if (customers && Array.isArray(customers)) {
      for (const customer of customers) {
        try {
          await addCustomer(userId, customer);
        } catch (error) {
          console.warn('[Import] Failed to import customer:', customer.name, error);
        }
      }
    }

    if (items && Array.isArray(items)) {
      for (const item of items) {
        try {
          await addItem(userId, item);
        } catch (error) {
          console.warn('[Import] Failed to import item:', item.name, error);
        }
      }
    }

    if (quotes && Array.isArray(quotes)) {
      for (const quote of quotes) {
        try {
          await addQuote(userId, quote);
        } catch (error) {
          console.warn('[Import] Failed to import quote:', quote.quoteNumber, error);
        }
      }
    }

    const { cacheManager } = await import('./cache-manager');
    await cacheManager.clearAll();
  } catch (error) {
    console.error('[Import] Failed to import data:', error);
    throw error;
  }
}

export const exportItemsToCSV = (items: Item[]): string => {
  const headers = ['Name', 'Description', 'Category', 'Base Price', 'Markup Type', 'Markup', 'Final Price', 'Units', 'Min Quantity', 'Image URL'];
  const rows = items.map(item => [
    item.name,
    item.description,
    item.category,
    item.basePrice.toString(),
    item.markupType,
    item.markup.toString(),
    item.finalPrice.toString(),
    item.units,
    (item.minQuantity || 1).toString(),
    item.imageUrl || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};