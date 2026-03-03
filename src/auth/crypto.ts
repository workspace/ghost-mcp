/**
 * Cryptographic utilities for credential encryption and password comparison.
 *
 * Uses AES-256-GCM for symmetric encryption of Ghost credentials
 * and timing-safe comparison for password verification.
 */

import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns a dot-separated string: iv.authTag.ciphertext (all base64).
 */
export function encrypt(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join('.');
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Expects dot-separated format: iv.authTag.ciphertext (all base64).
 */
export function decrypt(encrypted: string, keyHex: string): string {
  const parts = encrypted.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return decipher.update(ciphertext) + decipher.final('utf8');
}

/**
 * Timing-safe string comparison to prevent timing attacks on password verification.
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    // Compare against self to maintain constant-time behavior,
    // but always return false for length mismatch
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
