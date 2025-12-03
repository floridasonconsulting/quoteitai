import { parseCSVLine } from './csv-utils';
import { addCustomer, addItem, saveSettings } from './db-service';
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
  // Handle all line ending types and filter empty lines
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

  // Import customer functions
  const { getCustomers, updateCustomer } = await import('./db-service');
  const existingCustomers = await getCustomers(userId);

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      // Validate column count
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

      // Check for duplicates by name and email
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

      // Don't queue to sync manager - direct DB insert during import
      const inserted = await addCustomer(userId, customer as Customer);
      
      // Update local cache immediately so data appears without navigation
      const { getCachedData, setCachedData } = await import('./db-service');
      const cached = getCachedData<Customer>('customers-cache') || [];
      setCachedData('customers-cache', [...cached, inserted]);
      
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
  // Handle all line ending types and filter empty lines
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

  // Import item functions
  const { getItems, updateItem } = await import('./db-service');
  const existingItems = await getItems(userId);

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      // Validate column count
      if (values.length !== headers.length) {
        result.failed++;
        result.errors.push(
          `Line ${i + 1}: Column count mismatch. Expected ${headers.length} columns, found ${values.length}`
        );
        continue;
      }
      
      const item: Partial<Item> = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        const headerName = header.trim();
        
        if (['basePrice', 'finalPrice'].includes(headerName)) {
          (item as Record<string, unknown>)[headerName] = parseFloat(value) || 0;
        } else if (headerName === 'markup') {
          // Parse markup and detect type from format
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

      // CRITICAL FIX: Calculate finalPrice if not provided or if it's 0
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
      }

      // Validate markup_type
      if (item.markupType && !['percentage', 'fixed'].includes(item.markupType)) {
        result.failed++;
        result.errors.push(`Line ${i + 1}: Invalid markupType "${item.markupType}". Must be "percentage" or "fixed"`);
        continue;
      }

      // Check for duplicates by name and category
      const existingItem = existingItems.find(
        existing => existing.name === item.name && existing.category === item.category
      );

      if (existingItem) {
        if (duplicateStrategy === 'skip') {
          result.skipped++;
          continue;
        } else if (duplicateStrategy === 'error') {
          result.failed++;
          result.errors.push(`Line ${i + 1}: Duplicate item: ${item.name} in ${item.category}`);
          continue;
        } else if (duplicateStrategy === 'overwrite') {
          await updateItem(userId, existingItem.id, item as Item);
          result.overwritten++;
          continue;
        }
      }

      // Don't queue to sync manager - direct DB insert during import
      const inserted = await addItem(userId, item as Item);
      
      // Update local cache immediately so data appears without navigation
      const { getCachedData, setCachedData } = await import('./db-service');
      const cached = getCachedData<Item>('items-cache') || [];
      setCachedData('items-cache', [...cached, inserted]);
      
      result.success++;
    } catch (error) {
      result.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('violates') || errorMsg.includes('constraint')) {
        result.errors.push(`Line ${i + 1}: Database constraint violation - ${errorMsg}`);
      } else {
        result.errors.push(`Line ${i + 1}: ${errorMsg}`);
      }
    }
  }

  return result;
}

export async function importQuotesFromCSV(csvContent: string, userId: string): Promise<ImportResult> {
  // Handle all line ending types and filter empty lines
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

  // Import getQuotes, getCustomers and addQuote to check for duplicates
  const { getQuotes, getCustomers } = await import('./db-service');
  const existingQuotes = await getQuotes(userId);
  const existingCustomers = await getCustomers(userId);

  console.log(`[Import] Found ${existingQuotes.length} existing quotes`);
  console.log(`[Import] Found ${existingCustomers.length} existing customers for mapping`);

  const validStatuses = ['draft', 'sent', 'accepted', 'declined'];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      // Validate column count
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
          // Parse JSON for items array
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

      // Check for duplicates by quoteNumber
      const isDuplicate = existingQuotes.some(
        existing => existing.quoteNumber === quote.quoteNumber
      );

      if (isDuplicate) {
        console.log(`[Import] Skipping duplicate quote: ${quote.quoteNumber}`);
        result.skipped++;
        continue;
      }

      // Validate required fields
      if (!quote.quoteNumber || !quote.customerName || !quote.title) {
        result.failed++;
        result.errors.push(`Line ${i + 1}: Missing required fields (quoteNumber, customerName, or title)`);
        console.error(`[Import] Quote validation failed at line ${i + 1}: Missing required fields`);
        continue;
      }

      // Validate status
      if (quote.status && !validStatuses.includes(quote.status)) {
        result.failed++;
        result.errors.push(`Line ${i + 1}: Invalid status "${quote.status}". Must be "draft", "sent", "accepted", or "declined"`);
        console.error(`[Import] Quote validation failed at line ${i + 1}: Invalid status`);
        continue;
      }

      // Map customerName to actual customer UUID
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

      // Remove customerId from CSV if it exists (not a valid UUID)
      delete (quote as Partial<Quote & { customerId: string }>).customerId;

      // Import addQuote dynamically to save the quote
      const { addQuote, getCachedData, setCachedData } = await import('./db-service');
      console.log(`[Import] Adding quote: ${quote.quoteNumber} - ${quote.title}`);
      const inserted = await addQuote(userId, quote as Quote);
      
      // Update local cache immediately so data appears without navigation
      const cached = getCachedData<Quote>('quotes-cache') || [];
      setCachedData('quotes-cache', [...cached, inserted]);
      
      console.log(`[Import] Successfully added quote: ${quote.quoteNumber}`);
      result.success++;
    } catch (error) {
      result.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Import] Quote import error at line ${i + 1}:`, error);
      // Include specific constraint violations in error message
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

// Validation function to pre-check CSV data
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
    
    // Check markup type
    if (item.markupType && !validMarkupTypes.includes(item.markupType)) {
      errors.push(`Line ${i + 1}: Invalid markupType "${item.markupType}". Must be "percentage" or "fixed"`);
    }
    
    // Check required fields
    if (!item.name) {
      errors.push(`Line ${i + 1}: Missing required field "name"`);
    }
    
    // Check numeric fields
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
    
    // Check required fields
    if (!quote.quoteNumber) {
      errors.push(`Line ${i + 1}: Missing required field "quoteNumber"`);
    }
    if (!quote.customerName) {
      errors.push(`Line ${i + 1}: Missing required field "customerName"`);
    }
    if (!quote.title) {
      errors.push(`Line ${i + 1}: Missing required field "title"`);
    }
    
    // Check status
    if (quote.status && !validStatuses.includes(quote.status)) {
      errors.push(`Line ${i + 1}: Invalid status "${quote.status}". Must be "draft", "sent", "accepted", or "declined"`);
    }
    
    // Check items is valid JSON
    if (quote.items) {
      try {
        JSON.parse(quote.items);
      } catch (e) {
        errors.push(`Line ${i + 1}: Invalid JSON in items field`);
      }
    }
    
    // Check numeric fields
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

/**
 * Export All Data
 * Exports all customers, items, quotes, and settings to a JSON file
 */
export async function exportAllData(): Promise<void> {
  try {
    // Import necessary functions
    const { getCustomers, getItems, getQuotes, getSettings } = await import('./db-service');
    
    // Get user ID from auth context
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Fetch all data
    const [customers, items, quotes, settings] = await Promise.all([
      getCustomers(userId),
      getItems(userId),
      getQuotes(userId),
      getSettings(userId),
    ]);

    // Create export object
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

    // Convert to JSON and download
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

/**
 * Import All Data
 * Imports customers, items, quotes, and settings from a JSON backup file
 */
export async function importAllData(file: File): Promise<void> {
  try {
    // Read file
    const text = await file.text();
    const importData = JSON.parse(text);

    // Validate import data structure
    if (!importData.version || !importData.data) {
      throw new Error('Invalid backup file format');
    }

    const { customers, items, quotes, settings } = importData.data;

    // Get user ID
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Import settings first
    if (settings) {
      const { saveSettings } = await import('./db-service');
      await saveSettings(userId, settings);
    }

    // Import customers
    if (customers && Array.isArray(customers)) {
      const { addCustomer } = await import('./db-service');
      for (const customer of customers) {
        try {
          await addCustomer(userId, customer);
        } catch (error) {
          console.warn('[Import] Failed to import customer:', customer.name, error);
        }
      }
    }

    // Import items
    if (items && Array.isArray(items)) {
      const { addItem } = await import('./db-service');
      for (const item of items) {
        try {
          await addItem(userId, item);
        } catch (error) {
          console.warn('[Import] Failed to import item:', item.name, error);
        }
      }
    }

    // Import quotes
    if (quotes && Array.isArray(quotes)) {
      const { addQuote } = await import('./db-service');
      for (const quote of quotes) {
        try {
          await addQuote(userId, quote);
        } catch (error) {
          console.warn('[Import] Failed to import quote:', quote.quoteNumber, error);
        }
      }
    }

    // Clear caches to force fresh data load
    const { clearAllCaches } = await import('./db-service');
    clearAllCaches();
  } catch (error) {
    console.error('[Import] Failed to import data:', error);
    throw error;
  }
}

// Add minQuantity to item parsing
const parseItemsCSV = (csvText: string): Item[] => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      
      return {
        id: crypto.randomUUID(),
        name: row.name || row.item || '',
        description: row.description || '',
        category: row.category || 'General',
        basePrice: parseFloat(row.baseprice || row['base price'] || '0'),
        markupType: (row.markuptype || row['markup type'] || 'percentage') as 'percentage' | 'fixed',
        markup: parseFloat(row.markup || '0'),
        finalPrice: parseFloat(row.finalprice || row['final price'] || '0'),
        units: row.units || 'unit',
        minQuantity: parseInt(row.minquantity || row['min quantity'] || row['minimum quantity'] || '1', 10),
        createdAt: new Date().toISOString(),
      };
    });
};

// Add minQuantity to CSV export headers and data
export const exportItemsToCSV = (items: Item[]): string => {
  const headers = ['Name', 'Description', 'Category', 'Base Price', 'Markup Type', 'Markup', 'Final Price', 'Units', 'Min Quantity'];
  const rows = items.map(item => [
    item.name,
    item.description,
    item.category,
    item.basePrice.toString(),
    item.markupType,
    item.markup.toString(),
    item.finalPrice.toString(),
    item.units,
    (item.minQuantity || 1).toString()
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};
