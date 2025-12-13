
import DOMPurify from 'isomorphic-dompurify';

/**
 * Security utilities for input sanitization and validation
 */

// Allowed HTML tags for rich text content (terms, descriptions, etc.)
const ALLOWED_HTML_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'];
const ALLOWED_HTML_ATTR: string[] = [];

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - Raw HTML string from user input
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ALLOWED_HTML_TAGS,
    ALLOWED_ATTR: ALLOWED_HTML_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text by removing all HTML
 * @param text - Text that may contain HTML
 * @returns Plain text with HTML stripped
 */
export function sanitizePlainText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Allowed domains for external resources (logos, images, etc.)
 */
const ALLOWED_DOMAINS = [
  'supabase.co',
  'quoteit.ai',
  'localhost',
  'images.unsplash.com',
  'unsplash.com',
  'pexels.com',
  'pixabay.com',
];

/**
 * Validate URL is from an allowed domain
 * @param url - URL to validate
 * @returns true if URL is from allowed domain
 * @throws Error if URL is invalid or from disallowed domain
 */
export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Check if hostname matches allowed domains
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed) {
      throw new Error(`URL domain not allowed: ${urlObj.hostname}`);
    }
    
    // Only allow HTTPS (except localhost for development)
    if (urlObj.protocol !== 'https:' && !urlObj.hostname.includes('localhost')) {
      throw new Error('Only HTTPS URLs are allowed');
    }
    
    return true;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Invalid URL format');
    }
    throw error;
  }
}

/**
 * Sanitize email address
 * @param email - Email address to sanitize
 * @returns Sanitized email or throws error
 */
export function sanitizeEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Sanitize phone number (allow digits, spaces, dashes, parentheses)
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  // Remove all characters except digits, spaces, dashes, parentheses, and plus
  return phone.replace(/[^\d\s\-()+ ]/g, '');
}

/**
 * Generate a secure random password for quote protection
 * @param length - Length of password (default 8)
 * @returns Random password
 */
export function generateSecurePassword(length: number = 8): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Validate and sanitize company settings before saving to database
 * @param settings - Company settings object
 * @returns Sanitized settings
 */
export function sanitizeCompanySettings(settings: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  // Sanitize each field based on its type
  for (const [key, value] of Object.entries(settings)) {
    if (typeof value === 'string') {
      if (key === 'email') {
        sanitized[key] = sanitizeEmail(value);
      } else if (key === 'phone') {
        sanitized[key] = sanitizePhone(value);
      } else if (key === 'terms' || key === 'description') {
        sanitized[key] = sanitizeHtml(value);
      } else if (key === 'logo' || key === 'website') {
        try {
          validateUrl(value);
          sanitized[key] = value;
        } catch {
          sanitized[key] = '';
        }
      } else {
        sanitized[key] = sanitizePlainText(value);
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
