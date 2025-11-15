import { parseCSVLine } from './csv-utils';
import { addCustomer, addItem, saveSettings } from './db-service';

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
      
      const customer: any = {};
      headers.forEach((header, index) => {
        customer[header.trim()] = values[index] || '';
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
          await updateCustomer(userId, existingCustomer.id, customer);
          result.overwritten++;
          continue;
        }
      }

      // Don't queue to sync manager - direct DB insert during import
      const inserted = await addCustomer(userId, customer);
      
      // Update local cache immediately so data appears without navigation
      const { getCachedData, setCachedData } = await import('./db-service');
      const cached = getCachedData<any>('customers-cache') || [];
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
      
      const item: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        const headerName = header.trim();
        
        if (['basePrice', 'finalPrice'].includes(headerName)) {
          item[headerName] = parseFloat(value) || 0;
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
          item[headerName] = value;
        }
      });

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
          await updateItem(userId, existingItem.id, item);
          result.overwritten++;
          continue;
        }
      }

      // Don't queue to sync manager - direct DB insert during import
      const inserted = await addItem(userId, item);
      
      // Update local cache immediately so data appears without navigation
      const { getCachedData, setCachedData } = await import('./db-service');
      const cached = getCachedData<any>('items-cache') || [];
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
      
      const quote: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        const headerName = header.trim();
        
        if (headerName === 'items') {
          // Parse JSON for items array
          try {
            quote[headerName] = value ? JSON.parse(value) : [];
          } catch (e) {
            quote[headerName] = [];
          }
        } else if (['subtotal', 'tax', 'total'].includes(headerName)) {
          quote[headerName] = parseFloat(value) || 0;
        } else if (['sentDate', 'followUpDate'].includes(headerName)) {
          quote[headerName] = value || null;
        } else {
          quote[headerName] = value;
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
      delete quote.customerId;

      // Import addQuote dynamically to save the quote
      const { addQuote, getCachedData, setCachedData } = await import('./db-service');
      console.log(`[Import] Adding quote: ${quote.quoteNumber} - ${quote.title}`);
      const inserted = await addQuote(userId, quote);
      
      // Update local cache immediately so data appears without navigation
      const cached = getCachedData<any>('quotes-cache') || [];
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
  const settings: any = {};

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= 2) {
      const field = values[0].trim();
      const value = values[1].trim();
      settings[field] = value;
    }
  }

  await saveSettings(userId, settings);
}

// Validation function to pre-check CSV data
export function validateItemsCSV(csvContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = csvContent.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  
  const validMarkupTypes = ['percentage', 'fixed'];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const item: any = {};
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
    const quote: any = {};
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
