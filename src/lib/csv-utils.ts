/**
 * Parse a CSV line properly handling commas within quoted fields
 * and escaped quotes (double quotes)
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote - add single quote to output
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator outside quotes
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  return result;
}

/**
 * Escape a CSV field by wrapping in quotes if it contains commas,
 * quotes, or newlines, and escaping any existing quotes
 */
export function escapeCSVField(field: string | number): string {
  const str = String(field);
  
  // Check if field needs escaping (contains comma, quote, or newline)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    // Escape existing quotes by doubling them
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return str;
}

/**
 * Convert an array of fields to a properly formatted CSV line
 */
export function formatCSVLine(fields: (string | number)[]): string {
  return fields.map(escapeCSVField).join(',');
}
