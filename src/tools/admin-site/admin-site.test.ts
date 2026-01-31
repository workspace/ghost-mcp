/**
 * Tests for Ghost Admin API Site tools.
 */

import { GhostClient } from '../../client/ghost-client.js';
import { GhostApiError } from '../../client/errors.js';
import { AdminReadSiteInputSchema } from './schemas.js';
import { executeAdminReadSite } from './read-site.js';

// Test Admin API key in "id:secret" format
const TEST_ADMIN_API_KEY =
  '6470e5adf7b2e800012f0001:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
const TEST_URL = 'https://example.ghost.io';

// Store original fetch
const originalFetch = globalThis.fetch;

// Mock fetch for testing
function mockFetch(
  response: {
    status: number;
    body?: unknown;
  },
  validator?: (url: string, options?: RequestInit) => void
): void {
  globalThis.fetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (validator) {
        validator(url, init);
      }

      return new Response(
        response.body !== undefined ? JSON.stringify(response.body) : null,
        {
          status: response.status,
          headers: { 'content-type': 'application/json' },
        }
      );
    }
  );
}

// Restore fetch after each test
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// =============================================================================
// Schema Tests
// =============================================================================

describe('AdminReadSiteInputSchema', () => {
  it('should accept empty object (no parameters)', () => {
    const result = AdminReadSiteInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should ignore extra parameters', () => {
    const result = AdminReadSiteInputSchema.safeParse({
      include: 'anything',
      fields: 'something',
    });
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// Execute Function Tests
// =============================================================================

describe('executeAdminReadSite', () => {
  it('should call client.get with correct endpoint', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch(
      {
        status: 200,
        body: {
          site: {
            title: 'Test Site',
            description: 'A test Ghost site',
            logo: null,
            icon: null,
            accent_color: '#FF5733',
            url: 'https://example.ghost.io',
            version: '5.0.0',
          },
        },
      },
      (url) => {
        expect(url).toContain('/ghost/api/admin/site/');
      }
    );

    await executeAdminReadSite(client);
  });

  it('should return site response', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      site: {
        title: 'My Ghost Site',
        description: 'A publication for testing',
        logo: 'https://example.ghost.io/content/images/logo.png',
        icon: 'https://example.ghost.io/content/images/icon.png',
        accent_color: '#15171A',
        url: 'https://example.ghost.io',
        version: '5.75.0',
      },
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeAdminReadSite(client);
    expect(result.site).toBeDefined();
    expect(result.site.title).toBe('My Ghost Site');
    expect(result.site.description).toBe('A publication for testing');
    expect(result.site.version).toBe('5.75.0');
    expect(result.site.url).toBe('https://example.ghost.io');
  });

  it('should handle null optional fields', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    const expectedResponse = {
      site: {
        title: 'Minimal Site',
        description: null,
        logo: null,
        icon: null,
        accent_color: null,
        url: 'https://example.ghost.io',
        version: '5.0.0',
      },
    };

    mockFetch({ status: 200, body: expectedResponse });

    const result = await executeAdminReadSite(client);
    expect(result.site.title).toBe('Minimal Site');
    expect(result.site.description).toBeNull();
    expect(result.site.logo).toBeNull();
    expect(result.site.accent_color).toBeNull();
  });

  it('should throw GhostApiError on API failure', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 401,
      body: { errors: [{ message: 'Invalid token' }] },
    });

    await expect(executeAdminReadSite(client)).rejects.toThrow(GhostApiError);
  });

  it('should throw GhostApiError on 403 forbidden', async () => {
    const client = new GhostClient({
      url: TEST_URL,
      apiKey: TEST_ADMIN_API_KEY,
    });

    mockFetch({
      status: 403,
      body: { errors: [{ message: 'Permission denied' }] },
    });

    await expect(executeAdminReadSite(client)).rejects.toThrow(GhostApiError);
  });
});
