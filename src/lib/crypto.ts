const ENCRYPTION_KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

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

export async function encrypt(text: string, password?: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const userPassword = password || import.meta.env.VITE_ENCRYPTION_KEY || "default-key-change-in-production";
    
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const cryptoKey = await getEncryptionKey(userPassword, salt);
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      data
    );

    const result = new Uint8Array(SALT_LENGTH + IV_LENGTH + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, SALT_LENGTH);
    result.set(new Uint8Array(encrypted), SALT_LENGTH + IV_LENGTH);

    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

export async function decrypt(encryptedText: string, password?: string): Promise<string> {
  try {
    const decoder = new TextDecoder();
    
    const userPassword = password || import.meta.env.VITE_ENCRYPTION_KEY || "default-key-change-in-production";
    
    const data = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    const salt = data.slice(0, SALT_LENGTH);
    const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = data.slice(SALT_LENGTH + IV_LENGTH);

    const cryptoKey = await getEncryptionKey(userPassword, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encrypted
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}