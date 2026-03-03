import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  generateRandomToken,
  InMemoryClientsStore,
  AuthorizationCodeStore,
  TokenStore,
  OAUTH_CONSTANTS,
} from '../../src/auth/index.js';
import type {
  AuthorizationCodeRecord,
  AccessTokenRecord,
  RefreshTokenRecord,
} from '../../src/auth/index.js';

describe('generateRandomToken', () => {
  it('should return a 64-character hex string', () => {
    const token = generateRandomToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should generate unique tokens', () => {
    const tokens = new Set(Array.from({ length: 10 }, () => generateRandomToken()));
    expect(tokens.size).toBe(10);
  });
});

describe('InMemoryClientsStore', () => {
  it('should return undefined for unknown client', async () => {
    const store = new InMemoryClientsStore();
    const result = await store.getClient('nonexistent');
    expect(result).toBeUndefined();
  });

  it('should register and retrieve a client', async () => {
    const store = new InMemoryClientsStore();
    const registered = await store.registerClient({
      redirect_uris: ['http://localhost/callback'],
      client_name: 'Test Client',
    });

    expect(registered.client_id).toBeDefined();
    expect(registered.client_id).toMatch(/^[0-9a-f]{64}$/);
    expect(registered.client_id_issued_at).toBeDefined();
    expect(registered.client_name).toBe('Test Client');

    const retrieved = await store.getClient(registered.client_id);
    expect(retrieved).toEqual(registered);
  });

  it('should store multiple clients independently', async () => {
    const store = new InMemoryClientsStore();
    const client1 = await store.registerClient({
      redirect_uris: ['http://localhost/cb1'],
      client_name: 'Client 1',
    });
    const client2 = await store.registerClient({
      redirect_uris: ['http://localhost/cb2'],
      client_name: 'Client 2',
    });

    expect(client1.client_id).not.toBe(client2.client_id);
    expect((await store.getClient(client1.client_id))?.client_name).toBe('Client 1');
    expect((await store.getClient(client2.client_id))?.client_name).toBe('Client 2');
  });
});

describe('AuthorizationCodeStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makeRecord = (overrides?: Partial<AuthorizationCodeRecord>): AuthorizationCodeRecord => ({
    code: 'test-code',
    clientId: 'test-client',
    codeChallenge: 'challenge123',
    redirectUri: 'http://localhost/callback',
    ghostConfig: { ghostUrl: 'https://example.ghost.io' },
    expiresAt: Date.now() + OAUTH_CONSTANTS.AUTH_CODE_EXPIRY * 1000,
    ...overrides,
  });

  it('should save and retrieve a code', () => {
    const store = new AuthorizationCodeStore();
    const record = makeRecord();
    store.save(record);

    const retrieved = store.get('test-code');
    expect(retrieved).toEqual(record);
  });

  it('should return undefined for unknown code', () => {
    const store = new AuthorizationCodeStore();
    expect(store.get('nonexistent')).toBeUndefined();
  });

  it('should return undefined for expired code', () => {
    const store = new AuthorizationCodeStore();
    store.save(makeRecord({ expiresAt: Date.now() - 1000 }));
    expect(store.get('test-code')).toBeUndefined();
  });

  it('should consume a code (single-use)', () => {
    const store = new AuthorizationCodeStore();
    store.save(makeRecord());

    const consumed = store.consume('test-code');
    expect(consumed).toBeDefined();
    expect(consumed?.code).toBe('test-code');

    // Second consume should fail
    expect(store.consume('test-code')).toBeUndefined();
    expect(store.get('test-code')).toBeUndefined();
  });

  it('should not consume an expired code', () => {
    const store = new AuthorizationCodeStore();
    store.save(makeRecord({ expiresAt: Date.now() - 1000 }));
    expect(store.consume('test-code')).toBeUndefined();
  });
});

describe('TokenStore', () => {
  const makeAccessToken = (overrides?: Partial<AccessTokenRecord>): AccessTokenRecord => ({
    token: 'access-token-123',
    clientId: 'test-client',
    ghostConfig: { ghostUrl: 'https://example.ghost.io' },
    scopes: [],
    expiresAt: Date.now() + OAUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY * 1000,
    ...overrides,
  });

  const makeRefreshToken = (overrides?: Partial<RefreshTokenRecord>): RefreshTokenRecord => ({
    token: 'refresh-token-123',
    clientId: 'test-client',
    ghostConfig: { ghostUrl: 'https://example.ghost.io' },
    scopes: [],
    expiresAt: Date.now() + OAUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY * 1000,
    ...overrides,
  });

  describe('access tokens', () => {
    it('should save and retrieve an access token', () => {
      const store = new TokenStore();
      const record = makeAccessToken();
      store.saveAccessToken(record);

      const retrieved = store.getAccessToken('access-token-123');
      expect(retrieved).toEqual(record);
    });

    it('should return undefined for unknown token', () => {
      const store = new TokenStore();
      expect(store.getAccessToken('nonexistent')).toBeUndefined();
    });

    it('should return undefined for expired token', () => {
      const store = new TokenStore();
      store.saveAccessToken(makeAccessToken({ expiresAt: Date.now() - 1000 }));
      expect(store.getAccessToken('access-token-123')).toBeUndefined();
    });

    it('should revoke an access token', () => {
      const store = new TokenStore();
      store.saveAccessToken(makeAccessToken());
      store.revokeAccessToken('access-token-123');
      expect(store.getAccessToken('access-token-123')).toBeUndefined();
    });
  });

  describe('refresh tokens', () => {
    it('should save and retrieve a refresh token', () => {
      const store = new TokenStore();
      const record = makeRefreshToken();
      store.saveRefreshToken(record);

      const retrieved = store.getRefreshToken('refresh-token-123');
      expect(retrieved).toEqual(record);
    });

    it('should return undefined for unknown token', () => {
      const store = new TokenStore();
      expect(store.getRefreshToken('nonexistent')).toBeUndefined();
    });

    it('should return undefined for expired token', () => {
      const store = new TokenStore();
      store.saveRefreshToken(makeRefreshToken({ expiresAt: Date.now() - 1000 }));
      expect(store.getRefreshToken('refresh-token-123')).toBeUndefined();
    });

    it('should revoke a refresh token', () => {
      const store = new TokenStore();
      store.saveRefreshToken(makeRefreshToken());
      store.revokeRefreshToken('refresh-token-123');
      expect(store.getRefreshToken('refresh-token-123')).toBeUndefined();
    });
  });
});
