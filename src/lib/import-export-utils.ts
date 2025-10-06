import { parseCSVLine } from './csv-utils';
import { addCustomer, addItem, saveSettings } from './db-service';

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export async function importCustomersFromCSV(csvContent: string, userId: string): Promise<ImportResult> {
  const lines = csvContent.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const result: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  // Import getCustomers to check for duplicates
  const { getCustomers } = await import('./db-service');
  const existingCustomers = await getCustomers(userId);

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      const customer: any = {};
      headers.forEach((header, index) => {
        customer[header.trim()] = values[index] || '';
      });

      // Check for duplicates by name and email
      const isDuplicate = existingCustomers.some(
        existing => existing.name === customer.name && existing.email === customer.email
      );

      if (isDuplicate) {
        result.skipped++;
        continue;
      }

      // Don't queue to sync manager - direct DB insert during import
      await addCustomer(userId, customer);
      result.success++;
    } catch (error) {
      result.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      // Include specific constraint violations in error message
      if (errorMsg.includes('violates')) {
        result.errors.push(`Line ${i + 1}: Database constraint violation - ${errorMsg}`);
      } else {
        result.errors.push(`Line ${i + 1}: ${errorMsg}`);
      }
    }
  }

  return result;
}

export async function importItemsFromCSV(csvContent: string, userId: string): Promise<ImportResult> {
  const lines = csvContent.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const result: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  // Import getItems to check for duplicates
  const { getItems } = await import('./db-service');
  const existingItems = await getItems(userId);

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      const item: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        const headerName = header.trim();
        
        if (['basePrice', 'markup', 'finalPrice'].includes(headerName)) {
          item[headerName] = parseFloat(value) || 0;
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
      const isDuplicate = existingItems.some(
        existing => existing.name === item.name && existing.category === item.category
      );

      if (isDuplicate) {
        result.skipped++;
        continue;
      }

      // Don't queue to sync manager - direct DB insert during import
      await addItem(userId, item);
      result.success++;
    } catch (error) {
      result.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      // Include specific constraint violations in error message
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
  const lines = csvContent.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const result: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  // Import getQuotes and addQuote to check for duplicates
  const { getQuotes } = await import('./db-service');
  const existingQuotes = await getQuotes(userId);

  const validStatuses = ['draft', 'sent', 'accepted', 'declined'];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
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
        result.skipped++;
        continue;
      }

      // Validate required fields
      if (!quote.quoteNumber || !quote.customerName || !quote.title) {
        result.failed++;
        result.errors.push(`Line ${i + 1}: Missing required fields (quoteNumber, customerName, or title)`);
        continue;
      }

      // Validate status
      if (quote.status && !validStatuses.includes(quote.status)) {
        result.failed++;
        result.errors.push(`Line ${i + 1}: Invalid status "${quote.status}". Must be "draft", "sent", "accepted", or "declined"`);
        continue;
      }

      // Import addQuote dynamically to save the quote
      const { addQuote } = await import('./db-service');
      await addQuote(userId, quote);
      result.success++;
    } catch (error) {
      result.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      // Include specific constraint violations in error message
      if (errorMsg.includes('violates') || errorMsg.includes('constraint')) {
        result.errors.push(`Line ${i + 1}: Database constraint violation - ${errorMsg}`);
      } else {
        result.errors.push(`Line ${i + 1}: ${errorMsg}`);
      }
    }
  }

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
