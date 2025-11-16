/**
 * Parse a CSV line properly handling commas within quoted fields
 * and escaped quotes (double quotes)
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let fieldWasQuoted = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote - add single quote to output
        current += '"';
        i++; // Skip the next quote
      } else if (!inQuotes && current.length === 0) {
        // Starting quote at the beginning of a field
        inQuotes = true;
        fieldWasQuoted = true;
      } else {
        // Ending quote
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator outside quotes
      // Only trim if field was NOT quoted
      result.push(fieldWasQuoted ? current : current.trim());
      current = '';
      fieldWasQuoted = false;
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(fieldWasQuoted ? current : current.trim());
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
