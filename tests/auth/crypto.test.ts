import { randomBytes } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, safeCompare } from '../../src/auth/crypto.js';

const TEST_KEY = randomBytes(32).toString('hex'); // 64-char hex

describe('crypto', () => {
  describe('encrypt/decrypt', () => {
    it('should round-trip encrypt and decrypt', () => {
      const plaintext = 'hello world';
      const encrypted = encrypt(plaintext, TEST_KEY);
      const decrypted = decrypt(encrypted, TEST_KEY);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle JSON data', () => {
      const data = JSON.stringify({ ghostUrl: 'https://example.ghost.io', key: 'abc123' });
      const encrypted = encrypt(data, TEST_KEY);
      const decrypted = decrypt(encrypted, TEST_KEY);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(data));
    });

    it('should produce different ciphertexts for same plaintext (random IV)', () => {
      const plaintext = 'same data';
      const a = encrypt(plaintext, TEST_KEY);
      const b = encrypt(plaintext, TEST_KEY);
      expect(a).not.toBe(b);
    });

    it('should produce dot-separated format with 3 parts', () => {
      const encrypted = encrypt('test', TEST_KEY);
      const parts = encrypted.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should reject tampered ciphertext', () => {
      const encrypted = encrypt('test', TEST_KEY);
      const parts = encrypted.split('.');
      // Tamper with ciphertext
      const tampered = parts[0] + '.' + parts[1] + '.' + 'AAAA';
      expect(() => decrypt(tampered, TEST_KEY)).toThrow();
    });

    it('should reject tampered auth tag', () => {
      const encrypted = encrypt('test', TEST_KEY);
      const parts = encrypted.split('.');
      const tampered = parts[0] + '.AAAAAAAAAAAAAAAAAAAAAA==' + '.' + parts[2];
      expect(() => decrypt(tampered, TEST_KEY)).toThrow();
    });

    it('should reject wrong key', () => {
      const encrypted = encrypt('test', TEST_KEY);
      const wrongKey = randomBytes(32).toString('hex');
      expect(() => decrypt(encrypted, wrongKey)).toThrow();
    });

    it('should reject invalid format', () => {
      expect(() => decrypt('not.valid', TEST_KEY)).toThrow('Invalid encrypted data format');
    });

    it('should handle empty string', () => {
      const encrypted = encrypt('', TEST_KEY);
      const decrypted = decrypt(encrypted, TEST_KEY);
      expect(decrypted).toBe('');
    });

    it('should handle unicode', () => {
      const plaintext = 'Hello 世界 🌍';
      const encrypted = encrypt(plaintext, TEST_KEY);
      const decrypted = decrypt(encrypted, TEST_KEY);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('safeCompare', () => {
    it('should return true for equal strings', () => {
      expect(safeCompare('password123', 'password123')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(safeCompare('password123', 'password456')).toBe(false);
    });

    it('should return false for different lengths', () => {
      expect(safeCompare('short', 'longer-string')).toBe(false);
    });

    it('should return false for empty vs non-empty', () => {
      expect(safeCompare('', 'something')).toBe(false);
    });

    it('should return true for both empty', () => {
      expect(safeCompare('', '')).toBe(true);
    });
  });
});
