/**
 * Password validation utility for strong password requirements
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

const ALLOWED_SYMBOLS = '!@#$%^&*()_+-=[]{};\'\\:"|<>?,./`~';

/**
 * Validates password against security requirements:
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 * - At least one symbol from allowed set
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  const symbolRegex = new RegExp(`[${ALLOWED_SYMBOLS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
  if (!symbolRegex.test(password)) {
    errors.push(`Password must contain at least one special character (${ALLOWED_SYMBOLS})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Returns formatted password requirements for display
 */
export function getPasswordRequirements(): string[] {
  return [
    'At least 8 characters',
    'One uppercase letter (A-Z)',
    'One lowercase letter (a-z)',
    'One number (0-9)',
    `One special character (${ALLOWED_SYMBOLS})`,
  ];
}

/**
 * Calculates password strength (0-100)
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;
  
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;
  
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  
  const symbolRegex = new RegExp(`[${ALLOWED_SYMBOLS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
  if (symbolRegex.test(password)) strength += 15;
  
  return Math.min(100, strength);
}
