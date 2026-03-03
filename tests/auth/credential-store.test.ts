import { randomBytes } from 'node:crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { CredentialStore } from '../../src/auth/credential-store.js';

const TEST_KEY = randomBytes(32).toString('hex');

describe('CredentialStore', () => {
  let store: CredentialStore;

  beforeEach(() => {
    store = new CredentialStore(TEST_KEY);
  });

  it('should start empty', () => {
    expect(store.has()).toBe(false);
    expect(store.get()).toBeNull();
  });

  it('should save and retrieve credentials', () => {
    const config = {
      ghostUrl: 'https://example.ghost.io',
      ghostAdminApiKey: 'admin-key-123',
      ghostContentApiKey: 'content-key-456',
    };

    store.save(config);
    expect(store.has()).toBe(true);

    const retrieved = store.get();
    expect(retrieved).toEqual(config);
  });

  it('should overwrite previous credentials', () => {
    store.save({
      ghostUrl: 'https://first.ghost.io',
      ghostAdminApiKey: 'key-1',
    });

    store.save({
      ghostUrl: 'https://second.ghost.io',
      ghostAdminApiKey: 'key-2',
    });

    const retrieved = store.get();
    expect(retrieved?.ghostUrl).toBe('https://second.ghost.io');
    expect(retrieved?.ghostAdminApiKey).toBe('key-2');
  });

  it('should handle config with only content key', () => {
    store.save({
      ghostUrl: 'https://example.ghost.io',
      ghostContentApiKey: 'content-key',
    });

    const retrieved = store.get();
    expect(retrieved?.ghostUrl).toBe('https://example.ghost.io');
    expect(retrieved?.ghostContentApiKey).toBe('content-key');
    expect(retrieved?.ghostAdminApiKey).toBeUndefined();
  });

  it('should handle config with only admin key', () => {
    store.save({
      ghostUrl: 'https://example.ghost.io',
      ghostAdminApiKey: 'admin-key',
    });

    const retrieved = store.get();
    expect(retrieved?.ghostAdminApiKey).toBe('admin-key');
    expect(retrieved?.ghostContentApiKey).toBeUndefined();
  });
});
