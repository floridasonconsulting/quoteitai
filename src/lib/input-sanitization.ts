/**
 * Input sanitization utilities for security
 * Prevents prompt injection and malicious input attacks
 */

/**
 * Sanitize user input before passing to AI models
 * Removes potentially malicious characters and limits length
 */
export function sanitizeForAI(input: string | undefined | null, maxLength: number = 500): string {
  if (!input) return '';
  
  return input
    .replace(/[\n\r]/g, ' ')        // Remove newlines
    .replace(/["'`]/g, '')          // Remove quotes
    .replace(/[<>]/g, '')           // Remove angle brackets
    .replace(/\\/g, '')             // Remove backslashes
    .trim()
    .slice(0, maxLength);           // Limit length
}

/**
 * Sanitize numeric input to prevent injection
 */
export function sanitizeNumber(value: number | undefined | null): string {
  if (!value || isNaN(value)) return '0.00';
  return Math.abs(value).toFixed(2);
}

/**
 * Sanitize array of strings for AI context
 */
export function sanitizeArray(items: string[], maxLength: number = 200): string[] {
  return items.map(item => sanitizeForAI(item, maxLength));
}
