import { randomBytes } from 'node:crypto';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createSessionToken,
  validateSessionToken,
  SESSION_EXPIRY_MS,
} from '../../src/auth/session.js';

const TEST_KEY = randomBytes(32).toString('hex');

describe('session', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createSessionToken', () => {
    it('should create a token with 3 dot-separated parts', () => {
      const token = createSessionToken(TEST_KEY);
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should create unique tokens each time', () => {
      const a = createSessionToken(TEST_KEY);
      const b = createSessionToken(TEST_KEY);
      expect(a).not.toBe(b);
    });
  });

  describe('validateSessionToken', () => {
    it('should validate a freshly created token', () => {
      const token = createSessionToken(TEST_KEY);
      expect(validateSessionToken(token, TEST_KEY)).toBe(true);
    });

    it('should reject a token with wrong key', () => {
      const token = createSessionToken(TEST_KEY);
      const wrongKey = randomBytes(32).toString('hex');
      expect(validateSessionToken(token, wrongKey)).toBe(false);
    });

    it('should reject a tampered token', () => {
      const token = createSessionToken(TEST_KEY);
      const parts = token.split('.');
      const tampered = parts[0] + '.' + parts[1] + '.tampered-hmac';
      expect(validateSessionToken(tampered, TEST_KEY)).toBe(false);
    });

    it('should reject malformed tokens', () => {
      expect(validateSessionToken('', TEST_KEY)).toBe(false);
      expect(validateSessionToken('only.two', TEST_KEY)).toBe(false);
      expect(validateSessionToken('a.b.c.d', TEST_KEY)).toBe(false);
    });

    it('should reject expired tokens', () => {
      // Create a token, then advance time past expiry
      const token = createSessionToken(TEST_KEY);
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + SESSION_EXPIRY_MS + 1000);
      expect(validateSessionToken(token, TEST_KEY)).toBe(false);
    });

    it('should accept tokens within expiry window', () => {
      const token = createSessionToken(TEST_KEY);
      // Advance time but stay within 24 hours
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + SESSION_EXPIRY_MS - 1000);
      expect(validateSessionToken(token, TEST_KEY)).toBe(true);
    });
  });
});
