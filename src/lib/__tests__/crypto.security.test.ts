import { describe, it, expect, vi } from 'vitest';
import { encrypt, decrypt, generateSecureToken, hashPassword, secureCompare } from '../crypto';

describe('Crypto Security', () => {
  describe('Encryption Key Validation', () => {
    it('should accept valid encryption keys', async () => {
      const validKey = 'this-is-a-valid-secure-key-with-enough-length';
      
      const encrypted = await encrypt('test data', validKey);
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
    });
  });

  describe('Encryption/Decryption', () => {
    const testPassword = 'secure-test-password-with-good-length';

    it('should encrypt and decrypt data correctly', async () => {
      const plaintext = 'sensitive data';
      
      const encrypted = await encrypt(plaintext, testPassword);
      const decrypted = await decrypt(encrypted, testPassword);
      
      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const plaintext = 'same data';
      
      const encrypted1 = await encrypt(plaintext, testPassword);
      const encrypted2 = await encrypt(plaintext, testPassword);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      expect(await decrypt(encrypted1, testPassword)).toBe(plaintext);
      expect(await decrypt(encrypted2, testPassword)).toBe(plaintext);
    });

    it('should fail decryption with wrong password', async () => {
      const plaintext = 'secret';
      const encrypted = await encrypt(plaintext, testPassword);
      
      await expect(
        decrypt(encrypted, 'wrong-password-different-key')
      ).rejects.toThrow('Failed to decrypt');
    });

    it('should handle empty strings', async () => {
      const encrypted = await encrypt('', testPassword);
      const decrypted = await decrypt(encrypted, testPassword);
      
      expect(decrypted).toBe('');
    });

    it('should handle special characters', async () => {
      const plaintext = '!@#$%^&*()_+-={}[]|:;"<>,.?/~`';
      const encrypted = await encrypt(plaintext, testPassword);
      const decrypted = await decrypt(encrypted, testPassword);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Secure Token Generation', () => {
    it('should generate tokens of correct length', () => {
      const token16 = generateSecureToken(16);
      const token32 = generateSecureToken(32);
      
      expect(token16.length).toBe(32);
      expect(token32.length).toBe(64);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      
      expect(tokens.size).toBe(100);
    });

    it('should generate hex-encoded tokens', () => {
      const token = generateSecureToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('Password Hashing', () => {
    it('should hash passwords consistently', async () => {
      const password = 'test-password';
      
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1');
      const hash2 = await hashPassword('password2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce SHA-256 length hashes', async () => {
      const hash = await hashPassword('test');
      expect(hash.length).toBe(64);
    });
  });

  describe('Secure Comparison', () => {
    it('should return true for identical strings', () => {
      expect(secureCompare('test', 'test')).toBe(true);
      expect(secureCompare('', '')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(secureCompare('test', 'Test')).toBe(false);
      expect(secureCompare('abc', 'def')).toBe(false);
    });

    it('should return false for different lengths', () => {
      expect(secureCompare('short', 'longer')).toBe(false);
    });
  });
});
