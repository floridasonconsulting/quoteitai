const ENCRYPTION_KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Validates the encryption key configuration
 * @throws {Error} If encryption key is missing or invalid
 */
function validateEncryptionKey(password?: string): string {
  // If password provided directly, use it
  if (password) {
    return password;
  }
  
  // Check environment variable
  const envKey = import.meta.env.VITE_ENCRYPTION_KEY;
  
  // CRITICAL SECURITY: No fallback to default keys
  if (!envKey) {
    throw new Error(
      'VITE_ENCRYPTION_KEY environment variable is required but not set. ' +
      'Generate a secure key using: openssl rand -base64 32'
    );
  }
  
  // Prevent use of known default/placeholder keys
  const invalidKeys = [
    'default-key-change-in-production',
    'change-me',
    'your-key-here',
    'test-key',
    '12345'
  ];
  
  if (invalidKeys.includes(envKey) || envKey.length < 16) {
    throw new Error(
      'VITE_ENCRYPTION_KEY is set to an insecure value. ' +
      'Never use default or weak keys in production. ' +
      'Generate a secure key using: openssl rand -base64 32'
    );
  }
  
  return envKey;
}

async function getEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts text using AES-GCM with PBKDF2 key derivation
 * @param text - The text to encrypt
 * @param password - Optional password. If not provided, uses VITE_ENCRYPTION_KEY
 * @returns Base64-encoded encrypted data (salt + iv + ciphertext)
 * @throws {Error} If encryption fails or key is invalid
 */
export async function encrypt(text: string, password?: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Validate and get encryption key (throws if invalid)
    const validatedPassword = validateEncryptionKey(password);
    
    // Generate random salt and IV for this encryption
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const cryptoKey = await getEncryptionKey(validatedPassword, salt);
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      data
    );

    // Combine salt + iv + encrypted data for storage
    const result = new Uint8Array(SALT_LENGTH + IV_LENGTH + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, SALT_LENGTH);
    result.set(new Uint8Array(encrypted), SALT_LENGTH + IV_LENGTH);

    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error("Encryption failed:", error);
    if (error instanceof Error && error.message.includes('VITE_ENCRYPTION_KEY')) {
      throw error; // Re-throw validation errors
    }
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts text that was encrypted with the encrypt() function
 * @param encryptedText - Base64-encoded encrypted data
 * @param password - Optional password. If not provided, uses VITE_ENCRYPTION_KEY
 * @returns Decrypted plaintext
 * @throws {Error} If decryption fails, key is invalid, or data is corrupted
 */
export async function decrypt(encryptedText: string, password?: string): Promise<string> {
  try {
    const decoder = new TextDecoder();
    
    // Validate and get encryption key (throws if invalid)
    const validatedPassword = validateEncryptionKey(password);
    
    // Decode base64
    const data = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // Extract salt, IV, and encrypted data
    const salt = data.slice(0, SALT_LENGTH);
    const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = data.slice(SALT_LENGTH + IV_LENGTH);

    const cryptoKey = await getEncryptionKey(validatedPassword, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encrypted
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    if (error instanceof Error && error.message.includes('VITE_ENCRYPTION_KEY')) {
      throw error; // Re-throw validation errors
    }
    throw new Error("Failed to decrypt data. Data may be corrupted or encrypted with a different key.");
  }
}

/**
 * Generates a cryptographically secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Hashes a password using SHA-256
 * @param password - The password to hash
 * @returns Hex-encoded hash
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a secure encryption key for development/testing
 * WARNING: Only use this in development! Never in production!
 * @returns Base64-encoded random key
 * @throws {Error} If called in production environment
 */
export function generateSecureKey(): string {
  if (import.meta.env.PROD) {
    throw new Error('generateSecureKey() must not be called in production. Use openssl rand -base64 32 instead.');
  }
  
  const array = new Uint8Array(ENCRYPTION_KEY_LENGTH);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Securely compares two strings in constant time to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal, false otherwise
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}