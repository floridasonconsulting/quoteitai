import { parseCSVLine } from './csv-utils';
import { addCustomer, addItem, saveSettings } from './db-service';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export async function importCustomersFromCSV(csvContent: string, userId: string): Promise<ImportResult> {
  const lines = csvContent.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      const customer: any = {};
      headers.forEach((header, index) => {
        customer[header.trim()] = values[index] || '';
      });

      await addCustomer(userId, customer);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

export async function importItemsFromCSV(csvContent: string, userId: string): Promise<ImportResult> {
  const lines = csvContent.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

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

      await addItem(userId, item);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export async function loadSampleDataFile(filename: string): Promise<string> {
  const response = await fetch(`/sample-data/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${filename}`);
  }
  return response.text();
}
