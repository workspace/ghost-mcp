/**
 * Tests for JWT token generation for Ghost Admin API.
 */

import jwt from 'jsonwebtoken';
import {
  parseApiKey,
  decodeSecret,
  generateToken,
  createAuthorizationHeader,
  GhostAuthError,
} from '../../src/auth/jwt.js';

// Test API key - this is a valid format example, not a real key
// The secret is a hex-encoded string (64 hex chars = 32 bytes)
const TEST_API_KEY_ID = '6489d0c3c3c3c3c3c3c3c3c3';
const TEST_API_KEY_SECRET =
  'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
const TEST_API_KEY = `${TEST_API_KEY_ID}:${TEST_API_KEY_SECRET}`;

describe('parseApiKey', () => {
  it('should parse a valid API key', () => {
    const result = parseApiKey(TEST_API_KEY);

    expect(result.id).toBe(TEST_API_KEY_ID);
    expect(result.secret).toBe(TEST_API_KEY_SECRET);
  });

  it('should handle keys with multiple colons (colon in secret)', () => {
    // This is an edge case - colons after the first are part of the secret
    // However, Ghost secrets are hex, so this would fail hex validation
    const keyWithExtraColon = 'abc123:def456:extra';

    expect(() => parseApiKey(keyWithExtraColon)).toThrow(GhostAuthError);
    expect(() => parseApiKey(keyWithExtraColon)).toThrow(
      'secret must be hexadecimal'
    );
  });

  it('should throw for empty string', () => {
    expect(() => parseApiKey('')).toThrow(GhostAuthError);
    expect(() => parseApiKey('')).toThrow('must be a non-empty string');
  });

  it('should throw for key without colon', () => {
    expect(() => parseApiKey('invalidkey')).toThrow(GhostAuthError);
    expect(() => parseApiKey('invalidkey')).toThrow(
      'expected "id:secret" format'
    );
  });

  it('should throw for key with empty id', () => {
    expect(() => parseApiKey(':secret123')).toThrow(GhostAuthError);
    expect(() => parseApiKey(':secret123')).toThrow('id cannot be empty');
  });

  it('should throw for key with empty secret', () => {
    expect(() => parseApiKey('id123:')).toThrow(GhostAuthError);
    expect(() => parseApiKey('id123:')).toThrow('secret cannot be empty');
  });

  it('should throw for non-hexadecimal secret', () => {
    expect(() => parseApiKey('id123:notHexSecret!')).toThrow(GhostAuthError);
    expect(() => parseApiKey('id123:notHexSecret!')).toThrow(
      'secret must be hexadecimal'
    );
  });

  it('should accept uppercase hex in secret', () => {
    const result = parseApiKey('id123:ABCDEF0123456789');
    expect(result.secret).toBe('ABCDEF0123456789');
  });
});

describe('decodeSecret', () => {
  it('should decode hex string to buffer', () => {
    const hexSecret = '48656c6c6f'; // "Hello" in hex
    const buffer = decodeSecret(hexSecret);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.toString('utf8')).toBe('Hello');
  });

  it('should handle empty string', () => {
    const buffer = decodeSecret('');
    expect(buffer.length).toBe(0);
  });

  it('should decode the test secret correctly', () => {
    const buffer = decodeSecret(TEST_API_KEY_SECRET);
    // 64 hex chars = 32 bytes
    expect(buffer.length).toBe(32);
  });
});

describe('generateToken', () => {
  it('should generate a valid JWT token from string API key', () => {
    const token = generateToken(TEST_API_KEY);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should generate a valid JWT token from parsed API key', () => {
    const parsedKey = parseApiKey(TEST_API_KEY);
    const token = generateToken(parsedKey);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should set correct JWT header', () => {
    const token = generateToken(TEST_API_KEY);
    const decoded = jwt.decode(token, { complete: true });

    expect(decoded).not.toBeNull();
    expect(decoded!.header.alg).toBe('HS256');
    expect(decoded!.header.typ).toBe('JWT');
    expect(decoded!.header.kid).toBe(TEST_API_KEY_ID);
  });

  it('should set correct JWT payload', () => {
    const token = generateToken(TEST_API_KEY);
    const decoded = jwt.decode(token, { complete: true });

    expect(decoded).not.toBeNull();
    const payload = decoded!.payload as {
      iat: number;
      exp: number;
      aud: string;
    };

    expect(payload.aud).toBe('/admin/');
    expect(typeof payload.iat).toBe('number');
    expect(typeof payload.exp).toBe('number');
  });

  it('should set expiration to 5 minutes by default', () => {
    const token = generateToken(TEST_API_KEY);
    const decoded = jwt.decode(token, { complete: true });

    const payload = decoded!.payload as { iat: number; exp: number };
    const expectedExpiration = payload.iat + 5 * 60;

    expect(payload.exp).toBe(expectedExpiration);
  });

  it('should respect custom expiration time', () => {
    const token = generateToken(TEST_API_KEY, { expiresInMinutes: 3 });
    const decoded = jwt.decode(token, { complete: true });

    const payload = decoded!.payload as { iat: number; exp: number };
    const expectedExpiration = payload.iat + 3 * 60;

    expect(payload.exp).toBe(expectedExpiration);
  });

  it('should throw for expiration exceeding 5 minutes', () => {
    expect(() => generateToken(TEST_API_KEY, { expiresInMinutes: 6 })).toThrow(
      GhostAuthError
    );
    expect(() => generateToken(TEST_API_KEY, { expiresInMinutes: 6 })).toThrow(
      'cannot exceed 5 minutes'
    );
  });

  it('should throw for zero expiration', () => {
    expect(() => generateToken(TEST_API_KEY, { expiresInMinutes: 0 })).toThrow(
      GhostAuthError
    );
    expect(() => generateToken(TEST_API_KEY, { expiresInMinutes: 0 })).toThrow(
      'must be positive'
    );
  });

  it('should throw for negative expiration', () => {
    expect(() => generateToken(TEST_API_KEY, { expiresInMinutes: -1 })).toThrow(
      GhostAuthError
    );
  });

  it('should produce verifiable tokens', () => {
    const token = generateToken(TEST_API_KEY);
    const secretBytes = decodeSecret(TEST_API_KEY_SECRET);

    // This should not throw
    const verified = jwt.verify(token, secretBytes, {
      algorithms: ['HS256'],
      audience: '/admin/',
    }) as { iat: number; exp: number; aud: string };

    expect(verified.aud).toBe('/admin/');
  });

  it('should use timestamps in seconds (not milliseconds)', () => {
    const beforeTime = Math.floor(Date.now() / 1000);
    const token = generateToken(TEST_API_KEY);
    const afterTime = Math.floor(Date.now() / 1000);

    const decoded = jwt.decode(token, { complete: true });
    const payload = decoded!.payload as { iat: number };

    // iat should be between beforeTime and afterTime (in seconds)
    expect(payload.iat).toBeGreaterThanOrEqual(beforeTime);
    expect(payload.iat).toBeLessThanOrEqual(afterTime);

    // Timestamps in seconds should be ~10 digits, not ~13 digits (milliseconds)
    expect(payload.iat.toString().length).toBeLessThanOrEqual(10);
  });
});

describe('createAuthorizationHeader', () => {
  it('should create header with "Ghost " prefix', () => {
    const header = createAuthorizationHeader(TEST_API_KEY);

    expect(header.startsWith('Ghost ')).toBe(true);
  });

  it('should contain a valid JWT token', () => {
    const header = createAuthorizationHeader(TEST_API_KEY);
    const token = header.replace('Ghost ', '');

    expect(token.split('.')).toHaveLength(3);
  });

  it('should pass through options to generateToken', () => {
    const header = createAuthorizationHeader(TEST_API_KEY, {
      expiresInMinutes: 2,
    });
    const token = header.replace('Ghost ', '');
    const decoded = jwt.decode(token, { complete: true });

    const payload = decoded!.payload as { iat: number; exp: number };
    const expectedExpiration = payload.iat + 2 * 60;

    expect(payload.exp).toBe(expectedExpiration);
  });
});

describe('GhostAuthError', () => {
  it('should have correct name', () => {
    const error = new GhostAuthError('test message');
    expect(error.name).toBe('GhostAuthError');
  });

  it('should have correct message', () => {
    const error = new GhostAuthError('test message');
    expect(error.message).toBe('test message');
  });

  it('should be instanceof Error', () => {
    const error = new GhostAuthError('test message');
    expect(error).toBeInstanceOf(Error);
  });
});
