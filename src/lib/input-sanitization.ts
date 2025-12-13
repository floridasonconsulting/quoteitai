/**
 * Input sanitization utilities for security
 * Prevents prompt injection and malicious input attacks
 */

/**
 * Sanitize user input before passing to AI models
 * Removes potentially malicious characters and limits length
 */
export function sanitizeForAI(input: string | undefined | null, maxLength: number = 500): string {
  if (!input) return "";
  
  return input
    .replace(/[\n\r]/g, " ")        // Remove newlines
    .replace(/["'`]/g, "")          // Remove quotes
    .replace(/[<>]/g, "")           // Remove angle brackets
    .replace(/\\/g, "")             // Remove backslashes
    .trim()
    .slice(0, maxLength);           // Limit length
}

/**
 * Sanitize array of strings for AI context
 */
export function sanitizeArray(items: string[], maxLength: number = 200): string[] {
  return items.map(item => sanitizeForAI(item, maxLength));
}

// Enhanced email validation with stricter regex
export function sanitizeEmail(email: string): string {
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error("Invalid email format");
  }
  
  return sanitized;
}

// Enhanced phone number sanitization
export function sanitizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length < 10 || cleaned.length > 15) {
    throw new Error("Invalid phone number length");
  }
  
  return cleaned;
}

// URL sanitization to prevent XSS
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  
  try {
    const parsed = new URL(trimmed);
    const allowedProtocols = ["http:", "https:", "mailto:"];
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      throw new Error("Invalid URL protocol");
    }
    
    return parsed.toString();
  } catch {
    throw new Error("Invalid URL format");
  }
}

// Sanitize numeric input
export function sanitizeNumber(value: string | number, min?: number, max?: number): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) {
    throw new Error("Invalid number");
  }
  
  if (min !== undefined && num < min) {
    throw new Error(`Number must be at least ${min}`);
  }
  
  if (max !== undefined && num > max) {
    throw new Error(`Number must be at most ${max}`);
  }
  
  return num;
}

// Sanitize file names to prevent directory traversal
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 255);
}
